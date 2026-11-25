/**
 * Middlewares d'Authentification et de Contrôle d'Accès RBAC
 * 
 * RÈGLE DE SÉCURITÉ ESSENTIELLE :
 * Les autorisations sont vérifiées strictement côté serveur.
 * Aucune confiance n'est accordée aux requêtes clientes non signées.
 */

const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const userRepository = require('../repositories/userRepository');
const enseignantMatiereRepository = require('../repositories/enseignantMatiereRepository');

/**
 * Vérifier que la requête contient un jeton JWT valide
 * En-tête attendu : Authorization: Bearer <token>
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise. Jeton (token) manquant.'
    });
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    // Vérifier en base que l'utilisateur existe toujours et est actif
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur introuvable ou supprimé.'
      });
    }

    if (!user.actif) {
      return res.status(403).json({
        success: false,
        message: 'Votre compte a été désactivé par un administrateur.'
      });
    }

    // Attacher l'utilisateur vérifié à la requête
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Session expirée ou jeton invalide. Veuillez vous reconnecter.'
    });
  }
}

/**
 * Vérifier que l'utilisateur possède l'un des rôles requis
 * @param  {...string} roles - Ex: 'ADMIN', 'ENSEIGNANT'
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès interdit : cette action nécessite l'un des rôles suivants [${roles.join(', ')}]. Votre rôle actuel est [${req.user.role}].`
      });
    }

    next();
  };
}

/**
 * Contrôle d'accès strict pour les étudiants
 * Un étudiant ne peut JAMAIS accéder aux informations d'un autre étudiant
 */
function checkEtudiantAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise.'
    });
  }

  // L'administrateur et l'enseignant ont le droit de consulter les dossiers
  if (req.user.role === 'ADMIN' || req.user.role === 'ENSEIGNANT') {
    return next();
  }

  // Si c'est un étudiant, il ne peut accéder qu'à son propre ID étudiant
  const targetEtudiantId = parseInt(req.params.id || req.body.id_etudiant);
  if (!req.user.etudiant_id || req.user.etudiant_id !== targetEtudiantId) {
    return res.status(403).json({
      success: false,
      message: "Accès interdit : vous n'avez pas l'autorisation de consulter ou modifier les données d'un autre étudiant."
    });
  }

  next();
}

/**
 * Contrôle d'accès pour la saisie et gestion des notes par matière
 * - L'ADMIN peut saisir pour toutes les matières
 * - L'ENSEIGNANT ne peut saisir que pour les matières qui lui sont attribuées
 * - L'ÉTUDIANT ne peut JAMAIS saisir de note (HTTP 403)
 */
async function checkNoteCreationAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise.'
    });
  }

  // Refuser catégoriquement les étudiants
  if (req.user.role === 'ETUDIANT') {
    return res.status(403).json({
      success: false,
      message: 'Accès interdit : un étudiant ne peut pas saisir de notes.'
    });
  }

  // L'ADMIN a un accès complet
  if (req.user.role === 'ADMIN') {
    return next();
  }

  // Si c'est un ENSEIGNANT, vérifier qu'il est affecté à la matière
  if (req.user.role === 'ENSEIGNANT') {
    const idMatiere = parseInt(req.body.id_matiere || req.params.matiereId);
    if (!idMatiere) {
      return res.status(400).json({
        success: false,
        message: 'Identifiant de matière manquant.'
      });
    }

    const isAssigned = await enseignantMatiereRepository.isAssigned(req.user.id, idMatiere);
    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: "Accès interdit : vous n'êtes pas affecté à cette matière pour y saisir ou modifier des notes."
      });
    }

    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Rôle non autorisé.'
  });
}

module.exports = {
  authenticateToken,
  requireRole,
  checkEtudiantAccess,
  checkNoteCreationAccess
};
