/**
 * Repository des Notes
 * 
 * Requêtes SQL pour la gestion des notes.
 * 
 * بالتونسي: هذا الفايل يتكلم مع MySQL على النقاط متاع الطلبة
 */

const { pool } = require('../config/database');

const noteRepository = {

  /**
   * Ajouter une nouvelle note
   * @param {Object} note - Les données de la note
   * @returns {Object} La note créée avec son ID
   */
  async create(note) {
    const { id_etudiant, id_matiere, valeur, type } = note;
    const [result] = await pool.execute(
      'INSERT INTO notes (id_etudiant, id_matiere, valeur, type) VALUES (?, ?, ?, ?)',
      [id_etudiant, id_matiere, valeur, type]
    );
    return { id: result.insertId, id_etudiant, id_matiere, valeur, type };
  },

  /**
   * Récupérer toutes les notes d'un étudiant
   * Avec le nom de la matière et son coefficient (jointure)
   * @param {number} idEtudiant - L'identifiant de l'étudiant
   * @returns {Array} Liste des notes avec détails des matières
   */
  async findByEtudiant(idEtudiant) {
    const [rows] = await pool.execute(
      `SELECT n.id, n.id_etudiant, n.id_matiere, n.valeur, n.type,
              m.intitule AS matiere, m.coefficient
       FROM notes n
       JOIN matieres m ON n.id_matiere = m.id
       WHERE n.id_etudiant = ?
       ORDER BY m.intitule, n.type`,
      [idEtudiant]
    );
    return rows;
  },

  /**
   * Récupérer toutes les notes d'une matière
   * Avec le nom de l'étudiant (jointure)
   * @param {number} idMatiere - L'identifiant de la matière
   * @returns {Array} Liste des notes avec détails des étudiants
   */
  async findByMatiere(idMatiere) {
    const [rows] = await pool.execute(
      `SELECT n.id, n.id_etudiant, n.id_matiere, n.valeur, n.type,
              e.nom, e.prenom, e.classe
       FROM notes n
       JOIN etudiants e ON n.id_etudiant = e.id
       WHERE n.id_matiere = ?
       ORDER BY e.nom, e.prenom, n.type`,
      [idMatiere]
    );
    return rows;
  },

  /**
   * Récupérer les notes d'un étudiant groupées par matière
   * Utilisé pour le calcul de la moyenne générale
   * @param {number} idEtudiant - L'identifiant de l'étudiant
   * @returns {Array} Notes avec matières et coefficients
   */
  async findByEtudiantGrouped(idEtudiant) {
    const [rows] = await pool.execute(
      `SELECT n.valeur, n.type, n.id_matiere,
              m.intitule AS matiere, m.coefficient
       FROM notes n
       JOIN matieres m ON n.id_matiere = m.id
       WHERE n.id_etudiant = ?
       ORDER BY m.id, n.type`,
      [idEtudiant]
    );
    return rows;
  },

  /**
   * Trouver une note par son identifiant
   * @param {number} id
   */
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT n.*, m.intitule as matiere, e.nom as etudiant_nom, e.prenom as etudiant_prenom
       FROM notes n
       JOIN matieres m ON n.id_matiere = m.id
       JOIN etudiants e ON n.id_etudiant = e.id
       WHERE n.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Modifier une note existante
   * @param {number} id
   * @param {Object} note
   */
  async update(id, note) {
    const { valeur, type } = note;
    const [result] = await pool.execute(
      'UPDATE notes SET valeur = ?, type = ? WHERE id = ?',
      [valeur, type, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Supprimer une note
   * @param {number} id
   */
  async delete(id) {
    const [result] = await pool.execute('DELETE FROM notes WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  /**
   * Récupérer les dernières notes saisies (pour le Dashboard)
   * @param {number} limit
   */
  async findRecent(limit = 5) {
    const [rows] = await pool.execute(
      `SELECT n.id, n.valeur, n.type, n.created_at,
              e.id AS id_etudiant, e.nom AS etudiant_nom, e.prenom AS etudiant_prenom, e.classe,
              m.id AS id_matiere, m.intitule AS matiere_intitule, m.coefficient
       FROM notes n
       JOIN etudiants e ON n.id_etudiant = e.id
       JOIN matieres m ON n.id_matiere = m.id
       ORDER BY n.id DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  },

  /**
   * Compter le nombre total de notes
   * @returns {number} Le nombre de notes
   */
  async count() {
    const [rows] = await pool.execute('SELECT COUNT(*) as total FROM notes');
    return rows[0].total;
  }
};

module.exports = noteRepository;
