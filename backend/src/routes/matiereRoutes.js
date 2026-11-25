/**
 * Routes des Matières — Protégées par RBAC
 * 
 * - Tous les utilisateurs connectés peuvent consulter les matières
 * - Seul l'ADMIN peut ajouter, modifier ou supprimer des matières
 */

const express = require('express');
const router = express.Router();
const matiereController = require('../controllers/matiereController');
const { validerMatiere } = require('../middleware/validation');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/matieres — Afficher toutes les matières (ADMIN, ENSEIGNANT, ETUDIANT)
router.get('/', matiereController.getAll);

// GET /api/matieres/:id — Afficher une matière
router.get('/:id', matiereController.getById);

// POST /api/matieres — Ajouter une matière (ADMIN uniquement)
router.post('/', requireRole('ADMIN'), validerMatiere, matiereController.create);

// PUT /api/matieres/:id — Modifier une matière (ADMIN uniquement)
router.put('/:id', requireRole('ADMIN'), validerMatiere, matiereController.update);

// DELETE /api/matieres/:id — Supprimer une matière (ADMIN uniquement)
router.delete('/:id', requireRole('ADMIN'), matiereController.delete);

module.exports = router;
