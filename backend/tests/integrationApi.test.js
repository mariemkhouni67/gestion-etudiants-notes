/**
 * Tests d'Intégration REST API & Sécurité RBAC avec Supertest
 */

const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userRepository = require('../src/repositories/userRepository');
const etudiantRepository = require('../src/repositories/etudiantRepository');
const matiereRepository = require('../src/repositories/matiereRepository');
const noteRepository = require('../src/repositories/noteRepository');
const enseignantMatiereRepository = require('../src/repositories/enseignantMatiereRepository');
const jwtConfig = require('../src/config/jwt');

describe('Tests d\'Intégration API REST (SOA & RBAC)', () => {

  const adminToken = jwt.sign({ id: 1, email: 'admin@test.tn', role: 'ADMIN' }, jwtConfig.secret, { expiresIn: '1h' });
  const profToken = jwt.sign({ id: 2, email: 'prof@test.tn', role: 'ENSEIGNANT' }, jwtConfig.secret, { expiresIn: '1h' });
  const etudiantToken = jwt.sign({ id: 3, email: 'etudiant@test.tn', role: 'ETUDIANT', etudiant_id: 10 }, jwtConfig.secret, { expiresIn: '1h' });

  beforeEach(() => {
    // Mocker findById pour les tokens d'authentification
    jest.spyOn(userRepository, 'findById').mockImplementation(async (id) => {
      if (id === 1) return { id: 1, nom: 'Admin', prenom: 'Sys', email: 'admin@test.tn', role: 'ADMIN', actif: 1 };
      if (id === 2) return { id: 2, nom: 'Prof', prenom: 'Math', email: 'prof@test.tn', role: 'ENSEIGNANT', actif: 1 };
      if (id === 3) return { id: 3, nom: 'Etudiant', prenom: 'Amine', email: 'etudiant@test.tn', role: 'ETUDIANT', actif: 1, etudiant_id: 10 };
      return null;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Sécurité & Authentification', () => {

    test('Refuse l\'accès à /api/etudiants sans jeton (HTTP 401)', async () => {
      const res = await request(app).get('/api/etudiants');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('Refuse la connexion avec un mot de passe incorrect (HTTP 401)', async () => {
      const hash = await bcrypt.hash('CorrectPass', 10);
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue({
        id: 1,
        email: 'test@domain.tn',
        password_hash: hash,
        actif: 1
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@domain.tn', password: 'WrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Identifiants invalides');
    });

    test('Connexion réussie avec bons identifiants (HTTP 200)', async () => {
      const hash = await bcrypt.hash('BonMotDePasse', 10);
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue({
        id: 1,
        nom: 'Admin',
        prenom: 'User',
        email: 'test@domain.tn',
        password_hash: hash,
        role: 'ADMIN',
        actif: 1
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@domain.tn', password: 'BonMotDePasse' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.role).toBe('ADMIN');
    });

  });

  describe('2. Contrôles RBAC par Rôle', () => {

    test('Un étudiant ne peut PAS accéder aux comptes utilisateurs (HTTP 403)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${etudiantToken}`);

      expect(res.status).toBe(403);
    });

    test('Un enseignant ne peut PAS accéder aux comptes utilisateurs (HTTP 403)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${profToken}`);

      expect(res.status).toBe(403);
    });

    test('Un administrateur peut accéder à la liste des utilisateurs (HTTP 200)', async () => {
      jest.spyOn(userRepository, 'findAll').mockResolvedValue([
        { id: 1, nom: 'Admin', email: 'admin@test.tn', role: 'ADMIN', actif: 1 }
      ]);

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('Un étudiant ne peut PAS consulter les notes d\'un autre étudiant (HTTP 403)', async () => {
      // L'étudiant connecté a etudiant_id = 10, il tente de consulter l'ID 99
      const res = await request(app)
        .get('/api/etudiants/99/notes')
        .set('Authorization', `Bearer ${etudiantToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Accès interdit');
    });

    test('Un étudiant peut consulter son propre dossier (HTTP 200)', async () => {
      jest.spyOn(etudiantRepository, 'findById').mockResolvedValue({ id: 10, nom: 'Amine' });
      jest.spyOn(noteRepository, 'findByEtudiant').mockResolvedValue([]);

      const res = await request(app)
        .get('/api/etudiants/10/notes')
        .set('Authorization', `Bearer ${etudiantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

  });

  describe('3. Validation des Données Métier & Saisie des Notes', () => {

    test('Refuse une note > 20 avec HTTP 400', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          id_etudiant: 1,
          id_matiere: 1,
          type: 'DS',
          valeur: 25 // Invalide !
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('Refuse une note < 0 avec HTTP 400', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          id_etudiant: 1,
          id_matiere: 1,
          type: 'DS',
          valeur: -5 // Invalide !
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('Un enseignant ne peut pas saisir de note pour une matière non affectée (HTTP 403)', async () => {
      jest.spyOn(enseignantMatiereRepository, 'isAssigned').mockResolvedValue(false);

      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${profToken}`)
        .send({
          id_etudiant: 1,
          id_matiere: 99,
          type: 'DS',
          valeur: 15
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('pas affecté');
    });

  });

});
