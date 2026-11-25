/**
 * Application Express — Point d'entrée de l'API REST
 * 
 * Architecture SOA :
 *   - /api/auth         → Authentification et Sécurité
 *   - /api/users        → Gestion des Utilisateurs (RBAC Admin)
 *   - /api/affectations → Affectations Enseignants <-> Matières
 *   - /api/etudiants    → Service Métier Étudiants (Module 1)
 *   - /api/matieres     → Service Métier Matières (Module 2)
 *   - /api/notes        → Service Métier Notes et Moyennes (Module 3)
 *   - /api/dashboard    → Tableau de Bord et Statistiques
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Importer les routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const affectationRoutes = require('./routes/affectationRoutes');
const etudiantRoutes = require('./routes/etudiantRoutes');
const matiereRoutes = require('./routes/matiereRoutes');
const noteRoutes = require('./routes/noteRoutes');

// Importer les contrôleurs et middlewares
const noteController = require('./controllers/noteController');
const errorHandler = require('./middleware/errorHandler');
const { authenticateToken, requireRole, checkEtudiantAccess } = require('./middleware/auth');

// Importer les services pour le tableau de bord
const etudiantService = require('./services/etudiantService');
const matiereService = require('./services/matiereService');
const noteService = require('./services/noteService');
const enseignantMatiereRepository = require('./repositories/enseignantMatiereRepository');
const userRepository = require('./repositories/userRepository');

// Créer l'application Express
const app = express();

// ============================================================
// MIDDLEWARES GLOBAUX
// ============================================================

app.use(cors());
app.use(express.json());

// Servir les fichiers statiques du frontend
app.use(express.static(path.join(__dirname, '../../frontend')));

// ============================================================
// ROUTES D'AUTHENTIFICATION & SÉCURITÉ
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/affectations', affectationRoutes);

// ============================================================
// ROUTES MÉTIER (MODULES SOA)
// ============================================================

// Module 1 : Étudiants
app.use('/api/etudiants', etudiantRoutes);

// Module 2 : Matières
app.use('/api/matieres', matiereRoutes);

// Module 3 : Notes
app.use('/api/notes', noteRoutes);

// Routes spécifiques avec sécurité RBAC stricte :
// Un étudiant ne peut consulter que ses propres notes et sa propre moyenne !
app.get('/api/etudiants/:id/notes', authenticateToken, checkEtudiantAccess, noteController.getNotesByEtudiant);
app.get('/api/etudiants/:id/moyenne', authenticateToken, checkEtudiantAccess, noteController.getMoyenne);

// Consultation des notes d'une matière (ADMIN ou ENSEIGNANT)
app.get('/api/matieres/:id/notes', authenticateToken, requireRole('ADMIN', 'ENSEIGNANT'), noteController.getNotesByMatiere);

// ============================================================
// ROUTE DU TABLEAU DE BORD (DASHBOARD AVANCÉ & RBAC)
// ============================================================

/**
 * GET /api/dashboard
 * Rétrocompatibilité : statistiques globales de base
 */
app.get('/api/dashboard', async (req, res, next) => {
  try {
    const [nbEtudiants, nbMatieres, nbNotes] = await Promise.all([
      etudiantService.count(),
      matiereService.count(),
      noteService.count()
    ]);

    res.json({
      success: true,
      data: {
        totalEtudiants: nbEtudiants,
        totalMatieres: nbMatieres,
        totalNotes: nbNotes
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/stats
 * Statistiques avancées en temps réel selon le rôle de l'utilisateur
 */
app.get('/api/dashboard/stats', authenticateToken, async (req, res, next) => {
  try {
    const role = req.user.role;

    if (role === 'ETUDIANT') {
      // Espace Étudiant : ses propres données
      const etudiantId = req.user.etudiant_id;
      if (!etudiantId) {
        return res.json({
          success: true,
          data: {
            role: 'ETUDIANT',
            hasProfile: false,
            message: 'Aucun dossier étudiant rattaché à ce compte.'
          }
        });
      }

      const moyenneData = await noteService.calculerMoyenne(etudiantId);
      const notesData = await noteService.getNotesByEtudiant(etudiantId);

      return res.json({
        success: true,
        data: {
          role: 'ETUDIANT',
          hasProfile: true,
          etudiant: moyenneData.etudiant,
          moyenneGenerale: moyenneData.moyenneGenerale,
          statut: moyenneData.statut,
          appreciation: moyenneData.appreciation,
          totalNotes: notesData.notes.length,
          detailsMatieres: moyenneData.detailsMatieres,
          recentNotes: notesData.notes.slice(-5).reverse()
        }
      });
    }

    if (role === 'ENSEIGNANT') {
      // Espace Enseignant : ses matières, ses étudiants, ses notes saisies
      const mesMatieres = await enseignantMatiereRepository.findMatieresByEnseignant(req.user.id);
      const matieresIds = mesMatieres.map(m => m.id);

      let notesEnseignant = [];
      for (const matId of matieresIds) {
        const matNotes = await noteService.getNotesByMatiere(matId);
        notesEnseignant.push(...matNotes.notes);
      }

      const totalEtudiants = await etudiantService.count();

      return res.json({
        success: true,
        data: {
          role: 'ENSEIGNANT',
          totalMatieres: mesMatieres.length,
          totalNotes: notesEnseignant.length,
          totalEtudiants,
          mesMatieres,
          recentNotes: notesEnseignant.slice(-6).reverse()
        }
      });
    }

    // Espace Administrateur : Vue globale et analytique complète
    const [nbEtudiants, nbMatieres, nbNotes, derniersEtudiants, dernieresNotes, allEtudiants, allMatieres] = await Promise.all([
      etudiantService.count(),
      matiereService.count(),
      noteService.count(),
      etudiantService.findRecent(5),
      noteService.findRecent(5),
      etudiantService.getAll(),
      matiereService.getAll()
    ]);

    // Calculer les moyennes et la répartition des mentions pour tous les étudiants
    const mentions = {
      tresBien: 0,
      bien: 0,
      assezBien: 0,
      passable: 0,
      ajourne: 0,
      nonEvalue: 0
    };

    let sommeMoyennes = 0;
    let etudiantsAvecNotes = 0;

    for (const e of allEtudiants) {
      const resMoyenne = await noteService.calculerMoyenne(e.id);
      if (resMoyenne.moyenneGenerale !== null) {
        sommeMoyennes += resMoyenne.moyenneGenerale;
        etudiantsAvecNotes++;

        if (resMoyenne.moyenneGenerale >= 16) mentions.tresBien++;
        else if (resMoyenne.moyenneGenerale >= 14) mentions.bien++;
        else if (resMoyenne.moyenneGenerale >= 12) mentions.assezBien++;
        else if (resMoyenne.moyenneGenerale >= 10) mentions.passable++;
        else mentions.ajourne++;
      } else {
        mentions.nonEvalue++;
      }
    }

    const moyennePromo = etudiantsAvecNotes > 0
      ? Math.round((sommeMoyennes / etudiantsAvecNotes) * 100) / 100
      : null;

    const admisCount = mentions.tresBien + mentions.bien + mentions.assezBien + mentions.passable;
    const tauxReussite = etudiantsAvecNotes > 0
      ? Math.round((admisCount / etudiantsAvecNotes) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        role: 'ADMIN',
        totalEtudiants: nbEtudiants,
        totalMatieres: nbMatieres,
        totalNotes: nbNotes,
        moyennePromo,
        tauxReussite,
        mentions,
        derniersEtudiants,
        dernieresNotes,
        matieres: allMatieres
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// ROUTE POUR LE FRONTEND (SPA)
// ============================================================
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
  }
});

// ============================================================
// MIDDLEWARE DE GESTION DES ERREURS
// ============================================================
app.use(errorHandler);

module.exports = app;
