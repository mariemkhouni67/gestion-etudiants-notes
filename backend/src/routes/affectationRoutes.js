/**
 * Routes des Affectations Enseignants-Matières
 */

const express = require('express');
const router = express.Router();
const affectationController = require('../controllers/affectationController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

// Consultation : ADMIN ou ENSEIGNANT (qui voit ses matières)
router.get('/', requireRole('ADMIN', 'ENSEIGNANT'), affectationController.getAll);

// Création et suppression : ADMIN uniquement
router.post('/', requireRole('ADMIN'), affectationController.create);
router.delete('/:id', requireRole('ADMIN'), affectationController.delete);

module.exports = router;
