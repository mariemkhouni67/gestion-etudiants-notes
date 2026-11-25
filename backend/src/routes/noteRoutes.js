/**
 * Routes des Notes — Protégées par RBAC
 * 
 * - Saisie (POST) : ADMIN ou ENSEIGNANT affecté à la matière
 * - Modification (PUT) : ADMIN ou ENSEIGNANT affecté à la matière
 * - Suppression (DELETE) : ADMIN uniquement
 * - L'ÉTUDIANT ne peut pas saisir ni modifier de notes (HTTP 403)
 */

const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { validerNote } = require('../middleware/validation');
const { authenticateToken, requireRole, checkNoteCreationAccess } = require('../middleware/auth');

router.use(authenticateToken);

// POST /api/notes — Enregistrer une note (avec validation et contrôle de matière)
router.post('/', checkNoteCreationAccess, validerNote, noteController.create);

// GET /api/notes/:id — Consulter une note spécifique
router.get('/:id', noteController.getById);

// PUT /api/notes/:id — Modifier une note
router.put('/:id', checkNoteCreationAccess, noteController.update);

// DELETE /api/notes/:id — Supprimer une note (ADMIN uniquement)
router.delete('/:id', requireRole('ADMIN'), noteController.delete);

module.exports = router;
