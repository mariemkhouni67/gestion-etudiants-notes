/**
 * Tests Unitaires & Intégration : Authentification et RBAC
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authService = require('../src/services/authService');
const userRepository = require('../src/repositories/userRepository');
const enseignantMatiereRepository = require('../src/repositories/enseignantMatiereRepository');
const { requireRole, checkEtudiantAccess, checkNoteCreationAccess } = require('../src/middleware/auth');
const jwtConfig = require('../src/config/jwt');

describe('Système d\'Authentification et Contrôle d\'Accès (RBAC)', () => {

  describe('authService.login', () => {

    test('Connexion réussie avec un mot de passe valide', async () => {
      const password = 'Password@2026';
      const hash = await bcrypt.hash(password, 10);
      const userMock = {
        id: 10,
        nom: 'Ben Salah',
        prenom: 'Ali',
        email: 'ali@test.tn',
        password_hash: hash,
        role: 'ENSEIGNANT',
        actif: 1,
        etudiant_id: null
      };

      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(userMock);

      const result = await authService.login('ali@test.tn', password);

      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('ali@test.tn');
      expect(result.user.role).toBe('ENSEIGNANT');
      expect(result.user).not.toHaveProperty('password_hash');

      // Vérifier la validité du token JWT généré
      const decoded = jwt.verify(result.token, jwtConfig.secret);
      expect(decoded.id).toBe(10);
      expect(decoded.role).toBe('ENSEIGNANT');

      userRepository.findByEmail.mockRestore();
    });

    test('Rejette la connexion si le mot de passe est incorrect', async () => {
      const hash = await bcrypt.hash('CorrectPassword', 10);
      const userMock = {
        id: 11,
        email: 'test@test.tn',
        password_hash: hash,
        actif: 1
      };

      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(userMock);

      await expect(authService.login('test@test.tn', 'WrongPassword'))
        .rejects
        .toThrow('Identifiants invalides');

      userRepository.findByEmail.mockRestore();
    });

    test('Rejette la connexion si le compte est inactif', async () => {
      const hash = await bcrypt.hash('Pass@123', 10);
      const userMock = {
        id: 12,
        email: 'inactif@test.tn',
        password_hash: hash,
        actif: 0 // Compte bloqué
      };

      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(userMock);

      await expect(authService.login('inactif@test.tn', 'Pass@123'))
        .rejects
        .toThrow('Ce compte a été désactivé');

      userRepository.findByEmail.mockRestore();
    });

  });

  describe('Middleware RBAC — requireRole', () => {

    test('Autorise l\'accès si l\'utilisateur a le bon rôle', () => {
      const req = { user: { role: 'ADMIN' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      const middleware = requireRole('ADMIN', 'ENSEIGNANT');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('Renvoie HTTP 403 si l\'utilisateur n\'a pas le rôle requis', () => {
      const req = { user: { role: 'ETUDIANT' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      const middleware = requireRole('ADMIN');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('Accès interdit')
      }));
      expect(next).not.toHaveBeenCalled();
    });

  });

  describe('Middleware RBAC — checkEtudiantAccess', () => {

    test('Autorise un étudiant à consulter son propre dossier', () => {
      const req = {
        user: { role: 'ETUDIANT', etudiant_id: 5 },
        params: { id: '5' }
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      checkEtudiantAccess(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('Refuse strictement l\'accès si un étudiant tente de consulter les notes d\'un autre étudiant (HTTP 403)', () => {
      const req = {
        user: { role: 'ETUDIANT', etudiant_id: 5 },
        params: { id: '9' } // Essai de consulter l'étudiant ID 9
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      checkEtudiantAccess(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test('Autorise l\'administrateur à consulter n\'importe quel étudiant', () => {
      const req = {
        user: { role: 'ADMIN' },
        params: { id: '9' }
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      checkEtudiantAccess(req, res, next);
      expect(next).toHaveBeenCalled();
    });

  });

  describe('Middleware RBAC — checkNoteCreationAccess', () => {

    test('Refuse à un étudiant de saisir des notes (HTTP 403)', async () => {
      const req = {
        user: { role: 'ETUDIANT', id: 3 },
        body: { id_matiere: 1, valeur: 15 }
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await checkNoteCreationAccess(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test('Refuse à un enseignant de saisir une note pour une matière qui ne lui est pas attribuée (HTTP 403)', async () => {
      const req = {
        user: { role: 'ENSEIGNANT', id: 2 },
        body: { id_matiere: 5, valeur: 14 }
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      jest.spyOn(enseignantMatiereRepository, 'isAssigned').mockResolvedValue(false);

      await checkNoteCreationAccess(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();

      enseignantMatiereRepository.isAssigned.mockRestore();
    });

    test('Autorise un enseignant à saisir une note pour une matière qui lui est attribuée', async () => {
      const req = {
        user: { role: 'ENSEIGNANT', id: 2 },
        body: { id_matiere: 2, valeur: 16 }
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      jest.spyOn(enseignantMatiereRepository, 'isAssigned').mockResolvedValue(true);

      await checkNoteCreationAccess(req, res, next);

      expect(next).toHaveBeenCalled();

      enseignantMatiereRepository.isAssigned.mockRestore();
    });

    test('Autorise l\'administrateur à saisir une note dans n\'importe quelle matière', async () => {
      const req = {
        user: { role: 'ADMIN', id: 1 },
        body: { id_matiere: 3, valeur: 18 }
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await checkNoteCreationAccess(req, res, next);

      expect(next).toHaveBeenCalled();
    });

  });

});
