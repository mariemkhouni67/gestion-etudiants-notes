/**
 * Service d'Authentification
 * 
 * Gestion de la logique de connexion, inscription, validation de mot de passe avec bcrypt,
 * et génération de jetons JWT sécurisés.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const etudiantRepository = require('../repositories/etudiantRepository');
const jwtConfig = require('../config/jwt');

const authService = {

  /**
   * Connexion d'un utilisateur
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    if (!email || !password) {
      const error = new Error('Veuillez fournir un email et un mot de passe.');
      error.status = 400;
      throw error;
    }

    const user = await userRepository.findByEmail(email.trim().toLowerCase());
    if (!user) {
      const error = new Error('Identifiants invalides (email ou mot de passe incorrect).');
      error.status = 401;
      throw error;
    }

    if (!user.actif) {
      const error = new Error('Ce compte a été désactivé par l\'administrateur.');
      error.status = 403;
      throw error;
    }

    // Vérification du mot de passe avec bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      const error = new Error('Identifiants invalides (email ou mot de passe incorrect).');
      error.status = 401;
      throw error;
    }

    // Générer le token JWT sécurisé
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      etudiant_id: user.etudiant_id
    };

    const token = jwt.sign(tokenPayload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn
    });

    return {
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        actif: user.actif,
        etudiant_id: user.etudiant_id,
        classe: user.classe || null
      }
    };
  },

  /**
   * Inscription d'un nouvel utilisateur (étudiant par défaut ou selon config)
   */
  async register(data) {
    const { nom, prenom, email, password, role = 'ETUDIANT', etudiant_id = null } = data;

    // Vérifier si l'email existe déjà dans users
    const existingUser = await userRepository.findByEmail(email.trim().toLowerCase());
    if (existingUser) {
      const error = new Error('Un compte utilisateur existe déjà avec cet email.');
      error.status = 409;
      throw error;
    }

    // Si un etudiant_id est fourni, vérifier qu'il existe
    if (etudiant_id) {
      const etudiant = await etudiantRepository.findById(etudiant_id);
      if (!etudiant) {
        const error = new Error(`Dossier étudiant ID ${etudiant_id} introuvable.`);
        error.status = 404;
        throw error;
      }
    }

    // Hachage du mot de passe
    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await userRepository.create({
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.trim().toLowerCase(),
      password_hash,
      role,
      actif: 1,
      etudiant_id
    });

    // Générer le token JWT
    const token = jwt.sign({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      etudiant_id: newUser.etudiant_id
    }, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn
    });

    return {
      token,
      user: newUser
    };
  },

  /**
   * Obtenir le profil courant d'un utilisateur
   */
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error('Utilisateur non trouvé.');
      error.status = 404;
      throw error;
    }
    return user;
  },

  /**
   * Mettre à jour le profil de l'utilisateur (nom, prénom)
   */
  async updateProfile(userId, { nom, prenom }) {
    if (!nom || !prenom) {
      const error = new Error('Le nom et le prénom sont obligatoires.');
      error.status = 400;
      throw error;
    }

    await userRepository.updateProfile(userId, { nom: nom.trim(), prenom: prenom.trim() });
    return await userRepository.findById(userId);
  },

  /**
   * Changer le mot de passe
   */
  async changePassword(userId, oldPassword, newPassword) {
    if (!oldPassword || !newPassword) {
      const error = new Error('L\'ancien et le nouveau mot de passe sont obligatoires.');
      error.status = 400;
      throw error;
    }

    if (newPassword.length < 6) {
      const error = new Error('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      error.status = 400;
      throw error;
    }

    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) {
      const error = new Error('Utilisateur introuvable.');
      error.status = 404;
      throw error;
    }

    const matches = await bcrypt.compare(oldPassword, user.password_hash);
    if (!matches) {
      const error = new Error('L\'ancien mot de passe est incorrect.');
      error.status = 400;
      throw error;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(userId, newHash);

    return { message: 'Mot de passe modifié avec succès.' };
  }
};

module.exports = authService;
