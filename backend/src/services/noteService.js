/**
 * Service des Notes et Moyennes — Logique métier
 * 
 * Ce fichier contient la logique la plus importante du projet :
 * - Enregistrement des notes avec validation
 * - Calcul de la note finale par matière
 * - Calcul de la moyenne générale pondérée
 * - Attribution de l'appréciation et du statut
 * 
 * بالتونسي: هذا أهم فايل في المشروع — فيه حساب المعدلات والنتائج
 * 
 * ⚠️ HYPOTHÈSES PROVISOIRES — À CONFIRMER AVEC L'ENSEIGNANT
 */

const noteRepository = require('../repositories/noteRepository');
const etudiantRepository = require('../repositories/etudiantRepository');
const matiereRepository = require('../repositories/matiereRepository');
const config = require('../config/regles');

const noteService = {

  /**
   * Enregistrer une nouvelle note
   * Vérifie que l'étudiant et la matière existent
   * @throws {Error} Si l'étudiant ou la matière n'existe pas
   */
  async create(data) {
    // Vérifier que l'étudiant existe
    const etudiant = await etudiantRepository.findById(data.id_etudiant);
    if (!etudiant) {
      const error = new Error(`Étudiant avec l'ID ${data.id_etudiant} introuvable`);
      error.status = 404;
      throw error;
    }

    // Vérifier que la matière existe
    const matiere = await matiereRepository.findById(data.id_matiere);
    if (!matiere) {
      const error = new Error(`Matière avec l'ID ${data.id_matiere} introuvable`);
      error.status = 404;
      throw error;
    }

    return await noteRepository.create(data);
  },

  /**
   * Récupérer les notes d'un étudiant
   * @throws {Error} Si l'étudiant n'existe pas
   */
  async getNotesByEtudiant(idEtudiant) {
    // Vérifier que l'étudiant existe
    const etudiant = await etudiantRepository.findById(idEtudiant);
    if (!etudiant) {
      const error = new Error(`Étudiant avec l'ID ${idEtudiant} introuvable`);
      error.status = 404;
      throw error;
    }

    const notes = await noteRepository.findByEtudiant(idEtudiant);
    return { etudiant, notes };
  },

  /**
   * Récupérer les notes d'une matière
   * @throws {Error} Si la matière n'existe pas
   */
  async getNotesByMatiere(idMatiere) {
    const matiere = await matiereRepository.findById(idMatiere);
    if (!matiere) {
      const error = new Error(`Matière avec l'ID ${idMatiere} introuvable`);
      error.status = 404;
      throw error;
    }

    const notes = await noteRepository.findByMatiere(idMatiere);
    return { matiere, notes };
  },

  /**
   * ============================================================
   * CALCUL DE LA NOTE FINALE D'UNE MATIÈRE
   * ============================================================
   * 
   * Cette fonction calcule la note finale d'une matière
   * à partir des notes DS, EXAMEN et TP.
   * 
   * HYPOTHÈSE PROVISOIRE (à confirmer avec l'enseignant) :
   *   - DS     → 25%
   *   - EXAMEN → 60%
   *   - TP     → 15%
   * 
   * Si un type de note manque, on redistribue les pourcentages
   * proportionnellement entre les types existants.
   * 
   * Si plusieurs notes du même type existent, on prend la moyenne.
   * 
   * @param {Array} notes - Les notes d'une matière pour un étudiant
   * @returns {number} La note finale calculée
   */
  calculerNoteFinaleMatiere(notes) {
    // Regrouper les notes par type et calculer la moyenne de chaque type
    const moyenneParType = {};
    const notesByType = {};

    for (const note of notes) {
      if (!notesByType[note.type]) {
        notesByType[note.type] = [];
      }
      notesByType[note.type].push(note.valeur);
    }

    // Calculer la moyenne de chaque type
    for (const [type, vals] of Object.entries(notesByType)) {
      moyenneParType[type] = vals.reduce((sum, v) => sum + v, 0) / vals.length;
    }

    // Récupérer les pondérations depuis la config
    const ponderations = config.ponderations;
    
    // Calculer les pondérations effectives (redistribution si type manquant)
    let totalPonderation = 0;
    const typesPresents = Object.keys(moyenneParType);
    
    for (const type of typesPresents) {
      if (ponderations[type]) {
        totalPonderation += ponderations[type];
      }
    }

    // Si aucune pondération trouvée, faire une moyenne simple
    if (totalPonderation === 0) {
      const allValues = Object.values(moyenneParType);
      return allValues.reduce((sum, v) => sum + v, 0) / allValues.length;
    }

    // Calculer la note finale avec redistribution des pondérations
    let noteFinale = 0;
    for (const type of typesPresents) {
      const ponderation = ponderations[type] || 0;
      const ponderationEffective = ponderation / totalPonderation;
      noteFinale += moyenneParType[type] * ponderationEffective;
    }

    return Math.round(noteFinale * 100) / 100; // Arrondir à 2 décimales
  },

  /**
   * ============================================================
   * DÉTERMINER L'APPRÉCIATION
   * ============================================================
   * 
   * SEUILS PROVISOIRES (à confirmer avec l'enseignant) :
   *   - < 10     → (pas d'appréciation, Ajourné)
   *   - 10 à 12  → Passable
   *   - 12 à 14  → Assez bien
   *   - 14 à 16  → Bien
   *   - >= 16    → Très bien
   * 
   * @param {number} moyenne - La moyenne générale
   * @returns {string} L'appréciation
   */
  getAppreciation(moyenne) {
    const s = config.seuils;
    if (moyenne >= s.tresBien) return 'Très bien';
    if (moyenne >= s.bien) return 'Bien';
    if (moyenne >= s.assezBien) return 'Assez bien';
    if (moyenne >= s.passable) return 'Passable';
    return 'Insuffisant';
  },

  /**
   * Déterminer le statut (Admis ou Ajourné)
   * @param {number} moyenne - La moyenne générale
   * @returns {string} Le statut
   */
  getStatut(moyenne) {
    return moyenne >= config.seuils.admission ? 'Admis' : 'Ajourné';
  },

  /**
   * ============================================================
   * CALCUL DE LA MOYENNE GÉNÉRALE PONDÉRÉE
   * ============================================================
   * 
   * Formule :
   *   Moyenne = Σ(note_finale_matière × coefficient) / Σ(coefficients)
   * 
   * Étapes :
   * 1. Récupérer toutes les notes de l'étudiant
   * 2. Grouper par matière
   * 3. Calculer la note finale de chaque matière
   * 4. Appliquer les coefficients
   * 5. Calculer la moyenne pondérée
   * 
   * @param {number} idEtudiant - L'identifiant de l'étudiant
   * @returns {Object} Résultat complet avec détails par matière
   */
  async calculerMoyenne(idEtudiant) {
    // Vérifier que l'étudiant existe
    const etudiant = await etudiantRepository.findById(idEtudiant);
    if (!etudiant) {
      const error = new Error(`Étudiant avec l'ID ${idEtudiant} introuvable`);
      error.status = 404;
      throw error;
    }

    // Récupérer toutes les notes
    const notes = await noteRepository.findByEtudiantGrouped(idEtudiant);

    if (notes.length === 0) {
      return {
        etudiant,
        detailsMatieres: [],
        moyenneGenerale: null,
        appreciation: 'Aucune note disponible',
        statut: 'Non évalué',
        avertissement: '⚠️ Les pondérations et seuils sont PROVISOIRES — à confirmer avec l\'enseignant'
      };
    }

    // Grouper les notes par matière
    const notesParMatiere = {};
    for (const note of notes) {
      if (!notesParMatiere[note.id_matiere]) {
        notesParMatiere[note.id_matiere] = {
          matiere: note.matiere,
          coefficient: parseFloat(note.coefficient),
          notes: []
        };
      }
      notesParMatiere[note.id_matiere].notes.push({
        valeur: parseFloat(note.valeur),
        type: note.type
      });
    }

    // Calculer la note finale de chaque matière
    let sommeNotesCoeff = 0;
    let sommeCoeff = 0;
    const detailsMatieres = [];

    for (const [idMat, data] of Object.entries(notesParMatiere)) {
      const noteFinale = this.calculerNoteFinaleMatiere(data.notes);
      
      sommeNotesCoeff += noteFinale * data.coefficient;
      sommeCoeff += data.coefficient;

      detailsMatieres.push({
        matiere: data.matiere,
        coefficient: data.coefficient,
        noteFinale: noteFinale,
        notes: data.notes
      });
    }

    // Calculer la moyenne générale pondérée
    const moyenneGenerale = sommeCoeff > 0
      ? Math.round((sommeNotesCoeff / sommeCoeff) * 100) / 100
      : 0;

    return {
      etudiant,
      detailsMatieres,
      moyenneGenerale,
      appreciation: this.getAppreciation(moyenneGenerale),
      statut: this.getStatut(moyenneGenerale),
      avertissement: '⚠️ Les pondérations et seuils sont PROVISOIRES — à confirmer avec l\'enseignant'
    };
  },

  /**
   * Trouver une note par ID
   */
  async getById(id) {
    const note = await noteRepository.findById(id);
    if (!note) {
      const error = new Error(`Note avec l'ID ${id} introuvable`);
      error.status = 404;
      throw error;
    }
    return note;
  },

  /**
   * Modifier une note existante
   */
  async update(id, data) {
    const note = await noteRepository.findById(id);
    if (!note) {
      const error = new Error(`Note avec l'ID ${id} introuvable`);
      error.status = 404;
      throw error;
    }

    if (data.valeur !== undefined) {
      const v = parseFloat(data.valeur);
      if (isNaN(v) || v < 0 || v > 20) {
        const error = new Error('La note doit être comprise entre 0 et 20');
        error.status = 400;
        throw error;
      }
    }

    if (data.type && !config.typesNotes.includes(data.type)) {
      const error = new Error(`Le type doit être l'un des suivants : ${config.typesNotes.join(', ')}`);
      error.status = 400;
      throw error;
    }

    await noteRepository.update(id, {
      valeur: data.valeur !== undefined ? parseFloat(data.valeur) : note.valeur,
      type: data.type || note.type
    });

    return await noteRepository.findById(id);
  },

  /**
   * Supprimer une note
   */
  async delete(id) {
    const note = await noteRepository.findById(id);
    if (!note) {
      const error = new Error(`Note avec l'ID ${id} introuvable`);
      error.status = 404;
      throw error;
    }

    await noteRepository.delete(id);
    return { success: true, message: 'Note supprimée avec succès' };
  },

  /**
   * Récupérer les dernières notes saisies
   */
  async findRecent(limit = 5) {
    return await noteRepository.findRecent(limit);
  },

  /**
   * Compter le nombre total de notes
   */
  async count() {
    return await noteRepository.count();
  }
};

module.exports = noteService;
