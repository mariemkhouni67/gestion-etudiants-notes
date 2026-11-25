/**
 * Repository des Affectations Enseignants <-> Matières
 * 
 * Permet de gérer et vérifier quelles matières sont attribuées à quels enseignants.
 */

const { pool } = require('../config/database');

const enseignantMatiereRepository = {

  /**
   * Lister toutes les affectations (pour l'administrateur)
   */
  async findAll() {
    const [rows] = await pool.execute(
      `SELECT em.id, em.enseignant_id, em.matiere_id, em.created_at,
              u.nom AS enseignant_nom, u.prenom AS enseignant_prenom, u.email AS enseignant_email,
              m.intitule AS matiere_intitule, m.coefficient AS matiere_coefficient
       FROM enseignants_matieres em
       JOIN users u ON em.enseignant_id = u.id
       JOIN matieres m ON em.matiere_id = m.id
       ORDER BY u.nom, m.intitule`
    );
    return rows;
  },

  /**
   * Trouver les matières attribuées à un enseignant spécifique
   * @param {number} enseignantId
   */
  async findMatieresByEnseignant(enseignantId) {
    const [rows] = await pool.execute(
      `SELECT m.id, m.intitule, m.coefficient, em.id AS affectation_id, em.created_at AS affectation_date
       FROM matieres m
       JOIN enseignants_matieres em ON m.id = em.matiere_id
       WHERE em.enseignant_id = ?
       ORDER BY m.intitule`,
      [enseignantId]
    );
    return rows;
  },

  /**
   * Vérifier si un enseignant est affecté à une matière spécifique
   * @param {number} enseignantId
   * @param {number} matiereId
   * @returns {boolean}
   */
  async isAssigned(enseignantId, matiereId) {
    const [rows] = await pool.execute(
      `SELECT id FROM enseignants_matieres 
       WHERE enseignant_id = ? AND matiere_id = ?`,
      [enseignantId, matiereId]
    );
    return rows.length > 0;
  },

  /**
   * Affecter un enseignant à une matière
   * @param {number} enseignantId
   * @param {number} matiereId
   */
  async assign(enseignantId, matiereId) {
    const [result] = await pool.execute(
      `INSERT INTO enseignants_matieres (enseignant_id, matiere_id) VALUES (?, ?)`,
      [enseignantId, matiereId]
    );
    return { id: result.insertId, enseignant_id: enseignantId, matiere_id: matiereId };
  },

  /**
   * Retirer une affectation par ID
   * @param {number} id
   */
  async deleteById(id) {
    const [result] = await pool.execute(
      `DELETE FROM enseignants_matieres WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Retirer une affectation spécifique
   * @param {number} enseignantId
   * @param {number} matiereId
   */
  async remove(enseignantId, matiereId) {
    const [result] = await pool.execute(
      `DELETE FROM enseignants_matieres WHERE enseignant_id = ? AND matiere_id = ?`,
      [enseignantId, matiereId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = enseignantMatiereRepository;
