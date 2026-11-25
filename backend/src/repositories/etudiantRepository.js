/**
 * Repository des Étudiants
 * 
 * Ce fichier contient UNIQUEMENT les requêtes SQL pour les étudiants.
 * C'est la couche "accès aux données" — elle parle à MySQL.
 * 
 * بالتونسي: هذا الفايل هو اللي يتكلم مع قاعدة البيانات على الطلبة
 * كل حاجة تخص الـ SQL متاع الطلبة موجودة هنا
 */

const { pool } = require('../config/database');

const etudiantRepository = {

  /**
   * Récupérer tous les étudiants
   * @returns {Array} Liste de tous les étudiants
   */
  async findAll() {
    const [rows] = await pool.execute('SELECT * FROM etudiants ORDER BY nom, prenom');
    return rows;
  },

  /**
   * Récupérer un étudiant par son ID
   * @param {number} id - L'identifiant de l'étudiant
   * @returns {Object|null} L'étudiant trouvé ou null
   */
  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM etudiants WHERE id = ?', [id]);
    return rows[0] || null;  // Retourne le premier résultat ou null
  },

  /**
   * Vérifier si un email existe déjà
   * @param {string} email - L'email à vérifier
   * @param {number|null} excludeId - ID à exclure (pour la modification)
   * @returns {boolean} true si l'email existe déjà
   */
  async emailExists(email, excludeId = null) {
    let query = 'SELECT id FROM etudiants WHERE email = ?';
    const params = [email];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [rows] = await pool.execute(query, params);
    return rows.length > 0;
  },

  /**
   * Ajouter un nouvel étudiant
   * @param {Object} etudiant - Les données de l'étudiant
   * @returns {Object} L'étudiant créé avec son ID
   */
  async create(etudiant) {
    const { nom, prenom, classe, email } = etudiant;
    const [result] = await pool.execute(
      'INSERT INTO etudiants (nom, prenom, classe, email) VALUES (?, ?, ?, ?)',
      [nom, prenom, classe, email]
    );
    return { id: result.insertId, nom, prenom, classe, email };
  },

  /**
   * Modifier un étudiant existant
   * @param {number} id - L'identifiant de l'étudiant
   * @param {Object} etudiant - Les nouvelles données
   * @returns {boolean} true si la modification a réussi
   */
  async update(id, etudiant) {
    const { nom, prenom, classe, email } = etudiant;
    const [result] = await pool.execute(
      'UPDATE etudiants SET nom = ?, prenom = ?, classe = ?, email = ? WHERE id = ?',
      [nom, prenom, classe, email, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Supprimer un étudiant
   * Les notes associées seront supprimées automatiquement (ON DELETE CASCADE)
   * @param {number} id - L'identifiant de l'étudiant
   * @returns {boolean} true si la suppression a réussi
   */
  async delete(id) {
    const [result] = await pool.execute('DELETE FROM etudiants WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  /**
   * Récupérer les derniers étudiants enregistrés
   * @param {number} limit
   */
  async findRecent(limit = 5) {
    const [rows] = await pool.execute('SELECT * FROM etudiants ORDER BY id DESC LIMIT ?', [limit]);
    return rows;
  },

  /**
   * Compter le nombre total d'étudiants
   * @returns {number} Le nombre d'étudiants
   */
  async count() {
    const [rows] = await pool.execute('SELECT COUNT(*) as total FROM etudiants');
    return rows[0].total;
  }
};

module.exports = etudiantRepository;
