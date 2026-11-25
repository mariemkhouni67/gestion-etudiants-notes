/**
 * Contrôleur des Affectations Enseignants <-> Matières
 */

const enseignantMatiereRepository = require('../repositories/enseignantMatiereRepository');
const userRepository = require('../repositories/userRepository');
const matiereRepository = require('../repositories/matiereRepository');

const affectationController = {

  /**
   * GET /api/affectations
   */
  async getAll(req, res, next) {
    try {
      if (req.user.role === 'ENSEIGNANT') {
        const matieres = await enseignantMatiereRepository.findMatieresByEnseignant(req.user.id);
        return res.json({
          success: true,
          data: matieres
        });
      }

      // Pour l'administrateur, retourner toutes les affectations
      const affectations = await enseignantMatiereRepository.findAll();
      res.json({
        success: true,
        data: affectations
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/affectations
   */
  async create(req, res, next) {
    try {
      const { enseignant_id, matiere_id } = req.body;
      if (!enseignant_id || !matiere_id) {
        return res.status(400).json({
          success: false,
          message: 'L\'identifiant de l\'enseignant et de la matière sont obligatoires.'
        });
      }

      const enseignant = await userRepository.findById(enseignant_id);
      if (!enseignant || enseignant.role !== 'ENSEIGNANT') {
        return res.status(400).json({
          success: false,
          message: 'L\'utilisateur sélectionné n\'existe pas ou n\'est pas un enseignant.'
        });
      }

      const matiere = await matiereRepository.findById(matiere_id);
      if (!matiere) {
        return res.status(404).json({
          success: false,
          message: 'La matière spécifiée est introuvable.'
        });
      }

      const alreadyAssigned = await enseignantMatiereRepository.isAssigned(enseignant_id, matiere_id);
      if (alreadyAssigned) {
        return res.status(409).json({
          success: false,
          message: 'Cet enseignant est déjà affecté à cette matière.'
        });
      }

      const created = await enseignantMatiereRepository.assign(enseignant_id, matiere_id);
      res.status(201).json({
        success: true,
        message: 'Matière affectée à l\'enseignant avec succès',
        data: created
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/affectations/:id
   */
  async delete(req, res, next) {
    try {
      const success = await enseignantMatiereRepository.deleteById(req.params.id);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Affectation introuvable.'
        });
      }

      res.json({
        success: true,
        message: 'Affectation supprimée avec succès.'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = affectationController;
