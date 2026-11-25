/**
 * Tests des middlewares de validation des entrées (express-validator)
 * 
 * Vérifie :
 * 1. Validation Étudiant (champs requis, format d'email invalide)
 * 2. Validation Matière (coefficient <= 0, intitulé vide)
 * 3. Validation Note (note < 0 ou > 20, type invalide, identifiants manquants)
 */

const request = require('supertest');
const express = require('express');
const { validerEtudiant, validerMatiere, validerNote } = require('../src/middleware/validation');

// Application express minimale pour tester les middlewares isolément sans base de données
function createTestApp() {
  const app = express();
  app.use(express.json());

  app.post('/test/etudiant', validerEtudiant, (req, res) => {
    res.status(200).json({ success: true });
  });

  app.post('/test/matiere', validerMatiere, (req, res) => {
    res.status(200).json({ success: true });
  });

  app.post('/test/note', validerNote, (req, res) => {
    res.status(200).json({ success: true });
  });

  return app;
}

describe('Middlewares de validation des requêtes', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('Validation Étudiant', () => {
    test('Rejette un étudiant avec des champs manquants', async () => {
      const res = await request(app)
        .post('/test/etudiant')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
      
      const champsEnErreur = res.body.errors.map(e => e.champ);
      expect(champsEnErreur).toContain('nom');
      expect(champsEnErreur).toContain('prenom');
      expect(champsEnErreur).toContain('classe');
      expect(champsEnErreur).toContain('email');
    });

    test('Rejette un format d\'email invalide', async () => {
      const res = await request(app)
        .post('/test/etudiant')
        .send({
          nom: 'Ben Salah',
          prenom: 'Ali',
          classe: '2ème Info',
          email: 'ceci-nest-pas-un-email'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      const emailError = res.body.errors.find(e => e.champ === 'email');
      expect(emailError).toBeDefined();
      expect(emailError.message).toContain('format');
    });

    test('Accepte des données d\'étudiant valides', async () => {
      const res = await request(app)
        .post('/test/etudiant')
        .send({
          nom: 'Ben Salah',
          prenom: 'Ali',
          classe: '2ème Info',
          email: 'ali.bensalah@etudiant.tn'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Validation Matière', () => {
    test('Rejette une matière avec un coefficient négatif ou nul (<= 0)', async () => {
      const res = await request(app)
        .post('/test/matiere')
        .send({
          intitule: 'Algorithmique',
          coefficient: 0
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      const coeffError = res.body.errors.find(e => e.champ === 'coefficient');
      expect(coeffError).toBeDefined();
    });

    test('Rejette un intitulé vide', async () => {
      const res = await request(app)
        .post('/test/matiere')
        .send({
          intitule: '   ',
          coefficient: 2.5
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('Accepte une matière valide', async () => {
      const res = await request(app)
        .post('/test/matiere')
        .send({
          intitule: 'Programmation Web',
          coefficient: 2.5
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Validation Note', () => {
    test('Rejette une note supérieure à 20', async () => {
      const res = await request(app)
        .post('/test/note')
        .send({
          id_etudiant: 1,
          id_matiere: 1,
          valeur: 21,
          type: 'EXAMEN'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      const valError = res.body.errors.find(e => e.champ === 'valeur');
      expect(valError).toBeDefined();
    });

    test('Rejette une note inférieure à 0', async () => {
      const res = await request(app)
        .post('/test/note')
        .send({
          id_etudiant: 1,
          id_matiere: 1,
          valeur: -2,
          type: 'DS'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      const valError = res.body.errors.find(e => e.champ === 'valeur');
      expect(valError).toBeDefined();
    });

    test('Rejette un type de note inconnu', async () => {
      const res = await request(app)
        .post('/test/note')
        .send({
          id_etudiant: 1,
          id_matiere: 1,
          valeur: 15,
          type: 'PROJET_INCONNU'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      const typeError = res.body.errors.find(e => e.champ === 'type');
      expect(typeError).toBeDefined();
    });

    test('Accepte une note valide', async () => {
      const res = await request(app)
        .post('/test/note')
        .send({
          id_etudiant: 1,
          id_matiere: 2,
          valeur: 16.5,
          type: 'TP'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

});
