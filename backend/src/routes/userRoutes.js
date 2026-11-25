/**
 * Routes de Gestion des Utilisateurs (ADMIN uniquement)
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Validation pour la création d'utilisateur
const validerCreationUser = [
  body('nom').trim().notEmpty().withMessage('Nom obligatoire'),
  body('prenom').trim().notEmpty().withMessage('Prénom obligatoire'),
  body('email').trim().isEmail().withMessage('Email valide obligatoire'),
  body('role').isIn(['ADMIN', 'ENSEIGNANT', 'ETUDIANT']).withMessage('Rôle invalide'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array().map(e => ({ champ: e.path, message: e.msg }))
      });
    }
    next();
  }
];

// Toutes les routes utilisateurs nécessitent d'être ADMIN
router.use(authenticateToken);
router.use(requireRole('ADMIN'));

router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.post('/', validerCreationUser, userController.create);
router.put('/:id', userController.update);
router.patch('/:id/toggle-actif', userController.toggleActif);
router.delete('/:id', userController.delete);

module.exports = router;
