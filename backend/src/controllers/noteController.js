/**
 * Contrôleur des Notes et Moyennes
 * 
 * بالتونسي: يستقبل الطلبات ويتعامل مع النقاط والمعدلات
 */

const noteService = require('../services/noteService');

const noteController = {

  /**
   * POST /api/notes
   * Enregistrer une nouvelle note
   */
  async create(req, res, next) {
    try {
      const note = await noteService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Note enregistrée avec succès',
        data: note
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/etudiants/:id/notes
   * Consulter les notes d'un étudiant
   */
  async getNotesByEtudiant(req, res, next) {
    try {
      const result = await noteService.getNotesByEtudiant(req.params.id);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/etudiants/:id/moyenne
   * Calculer la moyenne générale d'un étudiant
   */
  async getMoyenne(req, res, next) {
    try {
      const result = await noteService.calculerMoyenne(req.params.id);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/matieres/:id/notes
   * Consulter les notes d'une matière
   */
  async getNotesByMatiere(req, res, next) {
    try {
      const result = await noteService.getNotesByMatiere(req.params.id);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/notes/:id
   */
  async getById(req, res, next) {
    try {
      const note = await noteService.getById(req.params.id);
      res.json({
        success: true,
        data: note
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/notes/:id
   */
  async update(req, res, next) {
    try {
      const updated = await noteService.update(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Note modifiée avec succès',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/notes/:id
   */
  async delete(req, res, next) {
    try {
      const result = await noteService.delete(req.params.id);
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = noteController;
