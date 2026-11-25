

const noteService = require('../src/services/noteService');
const config = require('../src/config/regles');

describe('noteService — Logique de calcul métier', () => {

  describe('calculerNoteFinaleMatiere', () => {

    test('Calcule correctement la note avec les 3 types présents (DS: 25%, EXAM: 60%, TP: 15%)', () => {
      // DS: 14, EXAM: 16, TP: 18
      // Note attendue = (14 * 0.25) + (16 * 0.60) + (18 * 0.15) = 3.5 + 9.6 + 2.7 = 15.80
      const notes = [
        { type: 'DS', valeur: 14 },
        { type: 'EXAMEN', valeur: 16 },
        { type: 'TP', valeur: 18 }
      ];

      const noteFinale = noteService.calculerNoteFinaleMatiere(notes);
      expect(noteFinale).toBe(15.80);
    });

    test('Redistribue les poids si le TP est manquant (DS: 25/85, EXAM: 60/85)', () => {
      // Sans TP : total poids = 0.25 + 0.60 = 0.85
      // DS: 10, EXAM: 15
      // Note = 10 * (0.25 / 0.85) + 15 * (0.60 / 0.85) = 2.941 + 10.588 = 13.53
      const notes = [
        { type: 'DS', valeur: 10 },
        { type: 'EXAMEN', valeur: 15 }
      ];

      const noteFinale = noteService.calculerNoteFinaleMatiere(notes);
      expect(noteFinale).toBe(13.53);
    });

    test('Fait la moyenne si plusieurs notes du même type existent', () => {
      // Deux DS: 12 et 16 (moyenne DS = 14)
      // Un EXAM: 14
      // Pas de TP -> poids DS = 0.25/0.85, EXAM = 0.60/0.85
      // Note = 14 * (0.25/0.85) + 14 * (0.60/0.85) = 14.00
      const notes = [
        { type: 'DS', valeur: 12 },
        { type: 'DS', valeur: 16 },
        { type: 'EXAMEN', valeur: 14 }
      ];

      const noteFinale = noteService.calculerNoteFinaleMatiere(notes);
      expect(noteFinale).toBe(14.00);
    });

    test('Gère le cas où un seul type est présent', () => {
      const notes = [
        { type: 'EXAMEN', valeur: 15.5 }
      ];

      const noteFinale = noteService.calculerNoteFinaleMatiere(notes);
      expect(noteFinale).toBe(15.50);
    });

  });

  describe('getAppreciation & getStatut', () => {

    test('Attribue "Très bien" et "Admis" pour moyenne >= 16', () => {
      expect(noteService.getAppreciation(16.5)).toBe('Très bien');
      expect(noteService.getStatut(16.5)).toBe('Admis');
    });

    test('Attribue "Bien" pour 14 <= moyenne < 16', () => {
      expect(noteService.getAppreciation(14.75)).toBe('Bien');
      expect(noteService.getStatut(14.75)).toBe('Admis');
    });

    test('Attribue "Assez bien" pour 12 <= moyenne < 14', () => {
      expect(noteService.getAppreciation(13.00)).toBe('Assez bien');
      expect(noteService.getStatut(13.00)).toBe('Admis');
    });

    test('Attribue "Passable" pour 10 <= moyenne < 12', () => {
      expect(noteService.getAppreciation(10.50)).toBe('Passable');
      expect(noteService.getStatut(10.50)).toBe('Admis');
    });

    test('Attribue "Insuffisant" et "Ajourné" pour moyenne < 10', () => {
      expect(noteService.getAppreciation(8.75)).toBe('Insuffisant');
      expect(noteService.getStatut(8.75)).toBe('Ajourné');
    });

    test('Seuil exact de 10 est Admis / Passable', () => {
      expect(noteService.getAppreciation(10.00)).toBe('Passable');
      expect(noteService.getStatut(10.00)).toBe('Admis');
    });

  });

  describe('calculerMoyenne avec mocking du repository', () => {

    test('Retourne null et statut Non évalué si l\'étudiant n\'a pas de notes', async () => {
      const etudiantMock = { id: 99, nom: 'Test', prenom: 'Zero', classe: '1ère Info', email: 'zero@test.tn' };
      
      // Mock des méthodes du repository
      const etudiantRepo = require('../src/repositories/etudiantRepository');
      const noteRepo = require('../src/repositories/noteRepository');

      jest.spyOn(etudiantRepo, 'findById').mockResolvedValue(etudiantMock);
      jest.spyOn(noteRepo, 'findByEtudiantGrouped').mockResolvedValue([]);

      const resultat = await noteService.calculerMoyenne(99);

      expect(resultat.moyenneGenerale).toBeNull();
      expect(resultat.statut).toBe('Non évalué');
      expect(resultat.detailsMatieres).toHaveLength(0);

      etudiantRepo.findById.mockRestore();
      noteRepo.findByEtudiantGrouped.mockRestore();
    });

    test('Calcule la moyenne générale pondérée avec des coefficients différents', async () => {
      const etudiantMock = { id: 1, nom: 'Ben Ali', prenom: 'Amine' };
      
      // Matière 1: Math (coeff 3) -> DS=14, EXAM=12 -> note = 14*(25/85) + 12*(60/85) = 4.1176 + 8.4705 = 12.59
      // Matière 2: Web (coeff 2) -> DS=16, EXAM=15, TP=17 -> note = 16*0.25 + 15*0.60 + 17*0.15 = 4 + 9 + 2.55 = 15.55
      const notesMock = [
        { id_matiere: 1, matiere: 'Math', coefficient: 3, valeur: 14, type: 'DS' },
        { id_matiere: 1, matiere: 'Math', coefficient: 3, valeur: 12, type: 'EXAMEN' },
        { id_matiere: 2, matiere: 'Web', coefficient: 2, valeur: 16, type: 'DS' },
        { id_matiere: 2, matiere: 'Web', coefficient: 2, valeur: 15, type: 'EXAMEN' },
        { id_matiere: 2, matiere: 'Web', coefficient: 2, valeur: 17, type: 'TP' }
      ];

      const etudiantRepo = require('../src/repositories/etudiantRepository');
      const noteRepo = require('../src/repositories/noteRepository');

      jest.spyOn(etudiantRepo, 'findById').mockResolvedValue(etudiantMock);
      jest.spyOn(noteRepo, 'findByEtudiantGrouped').mockResolvedValue(notesMock);

      const resultat = await noteService.calculerMoyenne(1);

      // Math: 12.59 * 3 = 37.77
      // Web: 15.55 * 2 = 31.10
      // Total notes pondérées = 68.87
      // Total coeffs = 5
      // Moyenne générale = 68.87 / 5 = 13.77
      expect(resultat.moyenneGenerale).toBe(13.77);
      expect(resultat.statut).toBe('Admis');
      expect(resultat.appreciation).toBe('Assez bien');
      expect(resultat.detailsMatieres).toHaveLength(2);

      etudiantRepo.findById.mockRestore();
      noteRepo.findByEtudiantGrouped.mockRestore();
    });

  });

});
