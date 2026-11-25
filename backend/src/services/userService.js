/**
 * Service Utilisateurs (Administration)
 * 
 * Gestion des comptes utilisateurs, attributions des rôles,
 * activation / désactivation des comptes.
 */

const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const etudiantRepository = require('../repositories/etudiantRepository');

const userService = {

  /**
   * Lister tous les utilisateurs
   */
  async getAll() {
    return await userRepository.findAll();
  },

  /**
   * Trouver un utilisateur par ID
   */
  async getById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      const error = new Error(`Utilisateur avec l'ID ${id} introuvable.`);
      error.status = 404;
      throw error;
    }
    return user;
  },

  /**
   * Créer un compte utilisateur par l'administrateur
   */
  async create(data) {
    const { nom, prenom, email, password, role = 'ENSEIGNANT', actif = 1, etudiant_id = null } = data;

    const existing = await userRepository.findByEmail(email.trim().toLowerCase());
    if (existing) {
      const error = new Error('Un compte avec cet email existe déjà.');
      error.status = 409;
      throw error;
    }

    if (etudiant_id) {
      const etudiant = await etudiantRepository.findById(etudiant_id);
      if (!etudiant) {
        const error = new Error(`Étudiant ID ${etudiant_id} introuvable.`);
        error.status = 404;
        throw error;
      }
    }

    const password_hash = await bcrypt.hash(password || 'Pass@2026!', 10);
    return await userRepository.create({
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.trim().toLowerCase(),
      password_hash,
      role,
      actif: actif ? 1 : 0,
      etudiant_id
    });
  },

  /**
   * Mettre à jour un compte utilisateur
   */
  async update(id, data) {
    const user = await userRepository.findById(id);
    if (!user) {
      const error = new Error(`Utilisateur avec l'ID ${id} introuvable.`);
      error.status = 404;
      throw error;
    }

    if (data.email && data.email.toLowerCase() !== user.email.toLowerCase()) {
      const existing = await userRepository.findByEmail(data.email.trim().toLowerCase());
      if (existing) {
        const error = new Error('Cet email est déjà utilisé par un autre compte.');
        error.status = 409;
        throw error;
      }
    }

    await userRepository.update(id, {
      nom: data.nom !== undefined ? data.nom.trim() : user.nom,
      prenom: data.prenom !== undefined ? data.prenom.trim() : user.prenom,
      email: data.email !== undefined ? data.email.trim().toLowerCase() : user.email,
      role: data.role !== undefined ? data.role : user.role,
      actif: data.actif !== undefined ? (data.actif ? 1 : 0) : user.actif,
      etudiant_id: data.etudiant_id !== undefined ? data.etudiant_id : user.etudiant_id
    });

    // Si un nouveau mot de passe a été fourni par l'admin
    if (data.password && data.password.trim().length >= 6) {
      const newHash = await bcrypt.hash(data.password.trim(), 10);
      await userRepository.updatePassword(id, newHash);
    }

    return await userRepository.findById(id);
  },

  /**
   * Basculer l'état actif / inactif
   */
  async toggleActif(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      const error = new Error(`Utilisateur avec l'ID ${id} introuvable.`);
      error.status = 404;
      throw error;
    }

    const nouvelEtat = user.actif ? 0 : 1;
    await userRepository.toggleActif(id, nouvelEtat);
    return { id, actif: nouvelEtat, message: `Compte ${nouvelEtat ? 'activé' : 'désactivé'} avec succès.` };
  },

  /**
   * Supprimer un compte
   */
  async delete(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      const error = new Error(`Utilisateur avec l'ID ${id} introuvable.`);
      error.status = 404;
      throw error;
    }

    await userRepository.delete(id);
    return { success: true, message: `Utilisateur "${user.prenom} ${user.nom}" supprimé.` };
  }
};

module.exports = userService;
