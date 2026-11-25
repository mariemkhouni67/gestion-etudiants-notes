/**
 * Contrôleur des Matières
 * 
 * بالتونسي: يستقبل الطلبات HTTP ويتعامل مع المواد الدراسية
 */

const matiereService = require('../services/matiereService');

const matiereController = {

  /**
   * GET /api/matieres
   */
  async getAll(req, res, next) {
    try {
      const matieres = await matiereService.getAll();
      res.json({
        success: true,
        data: matieres,
        total: matieres.length
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/matieres/:id
   */
  async getById(req, res, next) {
    try {
      const matiere = await matiereService.getById(req.params.id);
      res.json({
        success: true,
        data: matiere
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/matieres
   */
  async create(req, res, next) {
    try {
      const matiere = await matiereService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Matière ajoutée avec succès',
        data: matiere
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/matieres/:id
   */
  async update(req, res, next) {
    try {
      const matiere = await matiereService.update(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Matière modifiée avec succès',
        data: matiere
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/matieres/:id
   */
  async delete(req, res, next) {
    try {
      const result = await matiereService.delete(req.params.id);
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = matiereController;
