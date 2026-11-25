/**
 * Repository des Matières
 * 
 * Requêtes SQL pour la gestion des matières.
 * 
 * بالتونسي: هذا الفايل يتكلم مع MySQL على المواد الدراسية
 */

const { pool } = require('../config/database');

const matiereRepository = {

  /**
   * Récupérer toutes les matières
   * @returns {Array} Liste de toutes les matières
   */
  async findAll() {
    const [rows] = await pool.execute('SELECT * FROM matieres ORDER BY intitule');
    return rows;
  },

  /**
   * Récupérer une matière par son ID
   * @param {number} id - L'identifiant de la matière
   * @returns {Object|null} La matière trouvée ou null
   */
  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM matieres WHERE id = ?', [id]);
    return rows[0] || null;
  },

  /**
   * Ajouter une nouvelle matière
   * @param {Object} matiere - Les données de la matière
   * @returns {Object} La matière créée avec son ID
   */
  async create(matiere) {
    const { intitule, coefficient } = matiere;
    const [result] = await pool.execute(
      'INSERT INTO matieres (intitule, coefficient) VALUES (?, ?)',
      [intitule, coefficient]
    );
    return { id: result.insertId, intitule, coefficient };
  },

  /**
   * Modifier une matière existante
   * @param {number} id - L'identifiant de la matière
   * @param {Object} matiere - Les nouvelles données
   * @returns {boolean} true si la modification a réussi
   */
  async update(id, matiere) {
    const { intitule, coefficient } = matiere;
    const [result] = await pool.execute(
      'UPDATE matieres SET intitule = ?, coefficient = ? WHERE id = ?',
      [intitule, coefficient, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Supprimer une matière
   * Échouera si des notes sont associées (ON DELETE RESTRICT)
   * @param {number} id - L'identifiant de la matière
   * @returns {boolean} true si la suppression a réussi
   */
  async delete(id) {
    const [result] = await pool.execute('DELETE FROM matieres WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  /**
   * Vérifier si une matière a des notes associées
   * @param {number} id - L'identifiant de la matière
   * @returns {boolean} true si des notes existent
   */
  async hasNotes(id) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as total FROM notes WHERE id_matiere = ?',
      [id]
    );
    return rows[0].total > 0;
  },

  /**
   * Compter le nombre total de matières
   * @returns {number} Le nombre de matières
   */
  async count() {
    const [rows] = await pool.execute('SELECT COUNT(*) as total FROM matieres');
    return rows[0].total;
  }
};

module.exports = matiereRepository;
