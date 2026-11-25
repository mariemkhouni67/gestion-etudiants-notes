/**
 * Service des Étudiants — Logique métier
 * 
 * Ce fichier contient la logique métier pour les étudiants.
 * Il utilise le repository pour accéder aux données.
 * 
 * Architecture en couches :
 *   Route → Contrôleur → Service (ici) → Repository → MySQL
 * 
 * بالتونسي: هذا الفايل فيه القواعد والمنطق متاع التعامل مع الطلبة
 */

const etudiantRepository = require('../repositories/etudiantRepository');

const etudiantService = {

  /**
   * Récupérer tous les étudiants
   */
  async getAll() {
    return await etudiantRepository.findAll();
  },

  /**
   * Récupérer un étudiant par ID
   * @throws {Error} Si l'étudiant n'existe pas
   */
  async getById(id) {
    const etudiant = await etudiantRepository.findById(id);
    if (!etudiant) {
      const error = new Error(`Étudiant avec l'ID ${id} introuvable`);
      error.status = 404;
      throw error;
    }
    return etudiant;
  },

  /**
   * Créer un nouvel étudiant
   * @throws {Error} Si l'email existe déjà
   */
  async create(data) {
    // Vérifier si l'email existe déjà
    const emailExiste = await etudiantRepository.emailExists(data.email);
    if (emailExiste) {
      const error = new Error(`L'email "${data.email}" est déjà utilisé par un autre étudiant`);
      error.status = 409; // 409 Conflict
      throw error;
    }

    return await etudiantRepository.create(data);
  },

  /**
   * Modifier un étudiant
   * @throws {Error} Si l'étudiant n'existe pas ou si l'email est en double
   */
  async update(id, data) {
    // Vérifier que l'étudiant existe
    const etudiant = await etudiantRepository.findById(id);
    if (!etudiant) {
      const error = new Error(`Étudiant avec l'ID ${id} introuvable`);
      error.status = 404;
      throw error;
    }

    // Vérifier que le nouvel email n'est pas déjà pris par un autre étudiant
    const emailExiste = await etudiantRepository.emailExists(data.email, id);
    if (emailExiste) {
      const error = new Error(`L'email "${data.email}" est déjà utilisé par un autre étudiant`);
      error.status = 409;
      throw error;
    }

    await etudiantRepository.update(id, data);
    return { id: parseInt(id), ...data };
  },

  /**
   * Supprimer un étudiant
   * Les notes associées seront supprimées automatiquement (CASCADE)
   * @throws {Error} Si l'étudiant n'existe pas
   */
  async delete(id) {
    const etudiant = await etudiantRepository.findById(id);
    if (!etudiant) {
      const error = new Error(`Étudiant avec l'ID ${id} introuvable`);
      error.status = 404;
      throw error;
    }

    await etudiantRepository.delete(id);
    return { message: `Étudiant "${etudiant.prenom} ${etudiant.nom}" supprimé avec succès` };
  },

  /**
   * Compter le nombre total d'étudiants
   */
  async count() {
    return await etudiantRepository.count();
  },

  /**
   * Obtenir les derniers étudiants
   */
  async findRecent(limit = 5) {
    return await etudiantRepository.findRecent(limit);
  }
};

module.exports = etudiantService;
