/**
 * Service des Matières — Logique métier
 * 
 * بالتونسي: المنطق متاع التعامل مع المواد الدراسية
 */

const matiereRepository = require('../repositories/matiereRepository');

const matiereService = {

  /**
   * Récupérer toutes les matières
   */
  async getAll() {
    return await matiereRepository.findAll();
  },

  /**
   * Récupérer une matière par ID
   * @throws {Error} Si la matière n'existe pas
   */
  async getById(id) {
    const matiere = await matiereRepository.findById(id);
    if (!matiere) {
      const error = new Error(`Matière avec l'ID ${id} introuvable`);
      error.status = 404;
      throw error;
    }
    return matiere;
  },

  /**
   * Créer une nouvelle matière
   */
  async create(data) {
    return await matiereRepository.create(data);
  },

  /**
   * Modifier une matière
   * @throws {Error} Si la matière n'existe pas
   */
  async update(id, data) {
    const matiere = await matiereRepository.findById(id);
    if (!matiere) {
      const error = new Error(`Matière avec l'ID ${id} introuvable`);
      error.status = 404;
      throw error;
    }

    await matiereRepository.update(id, data);
    return { id: parseInt(id), ...data };
  },

  /**
   * Supprimer une matière
   * @throws {Error} Si la matière n'existe pas ou a des notes
   */
  async delete(id) {
    const matiere = await matiereRepository.findById(id);
    if (!matiere) {
      const error = new Error(`Matière avec l'ID ${id} introuvable`);
      error.status = 404;
      throw error;
    }

    // Vérifier si des notes sont associées
    const hasNotes = await matiereRepository.hasNotes(id);
    if (hasNotes) {
      const error = new Error(
        `Impossible de supprimer la matière "${matiere.intitule}" car des notes y sont associées. ` +
        `Supprimez d'abord les notes liées à cette matière.`
      );
      error.status = 409; // Conflict
      throw error;
    }

    await matiereRepository.delete(id);
    return { message: `Matière "${matiere.intitule}" supprimée avec succès` };
  },

  /**
   * Compter le nombre total de matières
   */
  async count() {
    return await matiereRepository.count();
  }
};

module.exports = matiereService;
