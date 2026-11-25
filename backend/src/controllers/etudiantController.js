/**
 * Contrôleur des Étudiants
 * 
 * Reçoit les requêtes HTTP, appelle le service, et renvoie les réponses.
 * C'est le "pont" entre les routes HTTP et la logique métier.
 * 
 * بالتونسي: هذا الفايل يستقبل الطلبات من الإنترنت ويرد عليهم
 */

const etudiantService = require('../services/etudiantService');

const etudiantController = {

  /**
   * GET /api/etudiants
   * Récupérer tous les étudiants
   */
  async getAll(req, res, next) {
    try {
      const etudiants = await etudiantService.getAll();
      res.json({
        success: true,
        data: etudiants,
        total: etudiants.length
      });
    } catch (error) {
      next(error); // Passer l'erreur au middleware d'erreurs
    }
  },

  /**
   * GET /api/etudiants/:id
   * Récupérer un étudiant par son ID
   */
  async getById(req, res, next) {
    try {
      const etudiant = await etudiantService.getById(req.params.id);
      res.json({
        success: true,
        data: etudiant
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/etudiants
   * Ajouter un nouvel étudiant
   */
  async create(req, res, next) {
    try {
      const etudiant = await etudiantService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Étudiant ajouté avec succès',
        data: etudiant
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/etudiants/:id
   * Modifier un étudiant
   */
  async update(req, res, next) {
    try {
      const etudiant = await etudiantService.update(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Étudiant modifié avec succès',
        data: etudiant
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/etudiants/:id
   * Supprimer un étudiant
   */
  async delete(req, res, next) {
    try {
      const result = await etudiantService.delete(req.params.id);
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = etudiantController;
