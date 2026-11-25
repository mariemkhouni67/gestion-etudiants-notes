/**
 * Routes des Étudiants — Protégées par RBAC
 * 
 * - ADMIN : Accès complet (lecture, création, modification, suppression)
 * - ENSEIGNANT : Lecture des étudiants
 * - ETUDIANT : Consultation stricte de son propre profil uniquement
 */

const express = require('express');
const router = express.Router();
const etudiantController = require('../controllers/etudiantController');
const { validerEtudiant } = require('../middleware/validation');
const { authenticateToken, requireRole, checkEtudiantAccess } = require('../middleware/auth');

// Toutes les requêtes nécessitent d'être authentifié
router.use(authenticateToken);

// GET /api/etudiants — Consultation de la liste (ADMIN et ENSEIGNANT)
router.get('/', requireRole('ADMIN', 'ENSEIGNANT'), etudiantController.getAll);

// GET /api/etudiants/:id — Consultation d'un étudiant (ADMIN, ENSEIGNANT, ou l'étudiant lui-même)
router.get('/:id', checkEtudiantAccess, etudiantController.getById);

// POST /api/etudiants — Ajouter un étudiant (ADMIN uniquement)
router.post('/', requireRole('ADMIN'), validerEtudiant, etudiantController.create);

// PUT /api/etudiants/:id — Modifier un étudiant (ADMIN uniquement)
router.put('/:id', requireRole('ADMIN'), validerEtudiant, etudiantController.update);

// DELETE /api/etudiants/:id — Supprimer un étudiant (ADMIN uniquement)
router.delete('/:id', requireRole('ADMIN'), etudiantController.delete);

module.exports = router;
