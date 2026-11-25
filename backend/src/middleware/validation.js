/**
 * Middleware de validation
 * 
 * Utilise express-validator pour valider les données reçues.
 * 
 * بالتونسي: هذا الفايل يتأكد أن البيانات اللي جات صحيحة
 * قبل ما يبعثهم للكونترولور
 */

const { body, validationResult } = require('express-validator');
const config = require('../config/regles');

/**
 * Middleware qui vérifie les résultats de validation
 * Si des erreurs existent, retourne HTTP 400 avec les détails
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array().map(err => ({
        champ: err.path,
        message: err.msg
      }))
    });
  }
  next();
}

/**
 * Règles de validation pour un étudiant
 */
const validerEtudiant = [
  body('nom')
    .trim()
    .notEmpty().withMessage('Le nom est obligatoire')
    .isLength({ max: 100 }).withMessage('Le nom ne doit pas dépasser 100 caractères'),
  
  body('prenom')
    .trim()
    .notEmpty().withMessage('Le prénom est obligatoire')
    .isLength({ max: 100 }).withMessage('Le prénom ne doit pas dépasser 100 caractères'),
  
  body('classe')
    .trim()
    .notEmpty().withMessage('La classe est obligatoire')
    .isLength({ max: 50 }).withMessage('La classe ne doit pas dépasser 50 caractères'),
  
  body('email')
    .trim()
    .notEmpty().withMessage("L'email est obligatoire")
    .isEmail().withMessage("Le format de l'email est invalide (exemple: nom@domaine.com)")
    .normalizeEmail(),
  
  validate
];

/**
 * Règles de validation pour une matière
 */
const validerMatiere = [
  body('intitule')
    .trim()
    .notEmpty().withMessage("L'intitulé de la matière est obligatoire")
    .isLength({ max: 150 }).withMessage("L'intitulé ne doit pas dépasser 150 caractères"),
  
  body('coefficient')
    .notEmpty().withMessage('Le coefficient est obligatoire')
    .isFloat({ gt: 0 }).withMessage('Le coefficient doit être un nombre strictement positif (> 0)'),
  
  validate
];

/**
 * Règles de validation pour une note
 */
const validerNote = [
  body('id_etudiant')
    .notEmpty().withMessage("L'identifiant de l'étudiant est obligatoire")
    .isInt({ min: 1 }).withMessage("L'identifiant de l'étudiant doit être un entier positif"),
  
  body('id_matiere')
    .notEmpty().withMessage("L'identifiant de la matière est obligatoire")
    .isInt({ min: 1 }).withMessage("L'identifiant de la matière doit être un entier positif"),
  
  body('valeur')
    .notEmpty().withMessage('La valeur de la note est obligatoire')
    .isFloat({ min: 0, max: 20 }).withMessage('La note doit être comprise entre 0 et 20'),
  
  body('type')
    .trim()
    .notEmpty().withMessage('Le type de note est obligatoire')
    .isIn(config.typesNotes).withMessage(`Le type doit être l'un des suivants : ${config.typesNotes.join(', ')}`),
  
  validate
];

module.exports = { validerEtudiant, validerMatiere, validerNote };
