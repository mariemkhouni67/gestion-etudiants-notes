/**
 * Contrôleur Utilisateurs (Administration RBAC)
 */

const userService = require('../services/userService');

const userController = {

  /**
   * GET /api/users
   */
  async getAll(req, res, next) {
    try {
      const users = await userService.getAll();
      res.json({
        success: true,
        data: users,
        total: users.length
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/users/:id
   */
  async getById(req, res, next) {
    try {
      const user = await userService.getById(req.params.id);
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/users
   */
  async create(req, res, next) {
    try {
      const newUser = await userService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès',
        data: newUser
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/users/:id
   */
  async update(req, res, next) {
    try {
      const updatedUser = await userService.update(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Utilisateur mis à jour avec succès',
        data: updatedUser
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/users/:id/toggle-actif
   */
  async toggleActif(req, res, next) {
    try {
      const result = await userService.toggleActif(req.params.id);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/users/:id
   */
  async delete(req, res, next) {
    try {
      // Empêcher l'administrateur de supprimer son propre compte
      if (parseInt(req.params.id) === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Vous ne pouvez pas supprimer votre propre compte administrateur.'
        });
      }

      const result = await userService.delete(req.params.id);
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;
