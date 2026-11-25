/**
 * Repository des Utilisateurs
 * 
 * Gestion de l'accès aux données pour l'authentification et les utilisateurs.
 * Utilise les requêtes préparées pour se prémunir des injections SQL.
 */

const { pool } = require('../config/database');

const userRepository = {

  /**
   * Trouver un utilisateur par son adresse email
   * @param {string} email
   * @returns {Object|null}
   */
  async findByEmail(email) {
    const [rows] = await pool.execute(
      `SELECT u.*, e.classe 
       FROM users u 
       LEFT JOIN etudiants e ON u.etudiant_id = e.id 
       WHERE u.email = ?`,
      [email]
    );
    return rows[0] || null;
  },

  /**
   * Trouver un utilisateur par son identifiant
   * @param {number} id
   * @returns {Object|null}
   */
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.nom, u.prenom, u.email, u.role, u.actif, u.etudiant_id, u.created_at, u.updated_at,
              e.classe
       FROM users u
       LEFT JOIN etudiants e ON u.etudiant_id = e.id
       WHERE u.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Trouver un utilisateur par son ID avec le hash de mot de passe (pour vérification)
   * @param {number} id
   * @returns {Object|null}
   */
  async findByIdWithPassword(id) {
    const [rows] = await pool.execute(
      `SELECT u.*, e.classe 
       FROM users u 
       LEFT JOIN etudiants e ON u.etudiant_id = e.id 
       WHERE u.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Lister tous les utilisateurs (pour l'administrateur)
   * @returns {Array}
   */
  async findAll() {
    const [rows] = await pool.execute(
      `SELECT u.id, u.nom, u.prenom, u.email, u.role, u.actif, u.etudiant_id, u.created_at,
              e.classe,
              (SELECT COUNT(*) FROM enseignants_matieres em WHERE em.enseignant_id = u.id) AS nb_matieres_affectees
       FROM users u
       LEFT JOIN etudiants e ON u.etudiant_id = e.id
       ORDER BY u.role, u.nom, u.prenom`
    );
    return rows;
  },

  /**
   * Créer un utilisateur
   * @param {Object} userData
   * @returns {Object}
   */
  async create(userData) {
    const { nom, prenom, email, password_hash, role, actif = 1, etudiant_id = null } = userData;
    const [result] = await pool.execute(
      `INSERT INTO users (nom, prenom, email, password_hash, role, actif, etudiant_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nom, prenom, email, password_hash, role, actif, etudiant_id]
    );
    return {
      id: result.insertId,
      nom,
      prenom,
      email,
      role,
      actif,
      etudiant_id
    };
  },

  /**
   * Mettre à jour les informations d'un utilisateur
   * @param {number} id
   * @param {Object} data
   * @returns {boolean}
   */
  async update(id, data) {
    const { nom, prenom, email, role, actif, etudiant_id } = data;
    const [result] = await pool.execute(
      `UPDATE users 
       SET nom = ?, prenom = ?, email = ?, role = ?, actif = ?, etudiant_id = ?
       WHERE id = ?`,
      [nom, prenom, email, role, actif, etudiant_id !== undefined ? etudiant_id : null, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Mettre à jour le profil de base (par l'utilisateur lui-même)
   * @param {number} id
   * @param {Object} data
   */
  async updateProfile(id, { nom, prenom }) {
    const [result] = await pool.execute(
      `UPDATE users SET nom = ?, prenom = ? WHERE id = ?`,
      [nom, prenom, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Mettre à jour le mot de passe
   * @param {number} id
   * @param {string} passwordHash
   * @returns {boolean}
   */
  async updatePassword(id, passwordHash) {
    const [result] = await pool.execute(
      `UPDATE users SET password_hash = ? WHERE id = ?`,
      [passwordHash, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Basculer l'état actif/inactif d'un compte
   * @param {number} id
   * @param {number|boolean} actif
   * @returns {boolean}
   */
  async toggleActif(id, actif) {
    const [result] = await pool.execute(
      `UPDATE users SET actif = ? WHERE id = ?`,
      [actif ? 1 : 0, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Supprimer un compte utilisateur
   * @param {number} id
   * @returns {boolean}
   */
  async delete(id) {
    const [result] = await pool.execute(`DELETE FROM users WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  },

  /**
   * Compter le nombre d'utilisateurs par rôle
   */
  async countByRole() {
    const [rows] = await pool.execute(
      `SELECT role, COUNT(*) as count FROM users GROUP BY role`
    );
    return rows;
  }
};

module.exports = userRepository;
