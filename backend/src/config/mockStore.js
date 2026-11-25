/**
 * Magasin de Données de Secours en Mémoire (Fallback Store)
 * 
 * Permet à l'application de fonctionner sans interruption immédiate
 * même si le serveur MySQL local de l'examinateur n'est pas encore démarré.
 * Dès que MySQL est en ligne, le système utilise 100% MySQL.
 */

const bcrypt = require('bcryptjs');

class MockStore {
  constructor() {
    this.initData();
  }

  initData() {
    const adminHash = bcrypt.hashSync('Admin@2026!', 10);
    const profHash = bcrypt.hashSync('Prof@2026!', 10);
    const etudiantHash = bcrypt.hashSync('Etudiant@2026!', 10);

    this.etudiants = [
      { id: 1, nom: 'Ben Ali', prenom: 'Amine', classe: '2ème Info', email: 'amine.benali@etudiant.tn' },
      { id: 2, nom: 'Trabelsi', prenom: 'Fatma', classe: '2ème Info', email: 'fatma.trabelsi@etudiant.tn' },
      { id: 3, nom: 'Bouazizi', prenom: 'Mohamed', classe: '3ème Info', email: 'mohamed.bouazizi@etudiant.tn' },
      { id: 4, nom: 'Mansouri', prenom: 'Sara', classe: '2ème Info', email: 'sara.mansouri@etudiant.tn' },
      { id: 5, nom: 'Khelifi', prenom: 'Youssef', classe: '3ème Info', email: 'youssef.khelifi@etudiant.tn' }
    ];

    this.matieres = [
      { id: 1, intitule: 'Mathématiques', coefficient: 3.00 },
      { id: 2, intitule: 'Programmation Web', coefficient: 2.50 },
      { id: 3, intitule: 'Bases de données', coefficient: 2.00 },
      { id: 4, intitule: 'Réseaux', coefficient: 1.50 },
      { id: 5, intitule: 'Anglais', coefficient: 1.00 }
    ];

    this.notes = [
      { id: 1, id_etudiant: 1, id_matiere: 1, valeur: 14.50, type: 'DS' },
      { id: 2, id_etudiant: 1, id_matiere: 1, valeur: 12.00, type: 'EXAMEN' },
      { id: 3, id_etudiant: 1, id_matiere: 2, valeur: 16.00, type: 'DS' },
      { id: 4, id_etudiant: 1, id_matiere: 2, valeur: 15.00, type: 'EXAMEN' },
      { id: 5, id_etudiant: 1, id_matiere: 2, valeur: 17.00, type: 'TP' },
      { id: 6, id_etudiant: 1, id_matiere: 3, valeur: 13.00, type: 'DS' },
      { id: 7, id_etudiant: 1, id_matiere: 3, valeur: 11.50, type: 'EXAMEN' },
      { id: 8, id_etudiant: 2, id_matiere: 1, valeur: 17.00, type: 'DS' },
      { id: 9, id_etudiant: 2, id_matiere: 1, valeur: 18.50, type: 'EXAMEN' },
      { id: 10, id_etudiant: 2, id_matiere: 2, valeur: 15.00, type: 'DS' },
      { id: 11, id_etudiant: 2, id_matiere: 2, valeur: 14.00, type: 'EXAMEN' },
      { id: 12, id_etudiant: 2, id_matiere: 2, valeur: 16.50, type: 'TP' },
      { id: 13, id_etudiant: 2, id_matiere: 3, valeur: 19.00, type: 'DS' },
      { id: 14, id_etudiant: 2, id_matiere: 3, valeur: 17.00, type: 'EXAMEN' },
      { id: 15, id_etudiant: 2, id_matiere: 4, valeur: 14.00, type: 'DS' },
      { id: 16, id_etudiant: 2, id_matiere: 4, valeur: 13.50, type: 'EXAMEN' },
      { id: 17, id_etudiant: 3, id_matiere: 1, valeur: 8.00, type: 'DS' },
      { id: 18, id_etudiant: 3, id_matiere: 1, valeur: 9.50, type: 'EXAMEN' },
      { id: 19, id_etudiant: 3, id_matiere: 2, valeur: 11.00, type: 'DS' },
      { id: 20, id_etudiant: 3, id_matiere: 2, valeur: 10.00, type: 'EXAMEN' },
      { id: 21, id_etudiant: 3, id_matiere: 3, valeur: 7.50, type: 'DS' },
      { id: 22, id_etudiant: 3, id_matiere: 3, valeur: 6.00, type: 'EXAMEN' }
    ];

    this.users = [
      { id: 1, nom: 'Administrateur', prenom: 'Système', email: 'admin@gestion-notes.tn', password_hash: adminHash, role: 'ADMIN', actif: 1, etudiant_id: null, created_at: new Date() },
      { id: 2, nom: 'Dr. Gharbi', prenom: 'Kais', email: 'prof.math@gestion-notes.tn', password_hash: profHash, role: 'ENSEIGNANT', actif: 1, etudiant_id: null, created_at: new Date() },
      { id: 3, nom: 'Dr. Mejri', prenom: 'Sonia', email: 'prof.web@gestion-notes.tn', password_hash: profHash, role: 'ENSEIGNANT', actif: 1, etudiant_id: null, created_at: new Date() },
      { id: 4, nom: 'Ben Ali', prenom: 'Amine', email: 'amine.benali@etudiant.tn', password_hash: etudiantHash, role: 'ETUDIANT', actif: 1, etudiant_id: 1, classe: '2ème Info', created_at: new Date() },
      { id: 5, nom: 'Trabelsi', prenom: 'Fatma', email: 'fatma.trabelsi@etudiant.tn', password_hash: etudiantHash, role: 'ETUDIANT', actif: 1, etudiant_id: 2, classe: '2ème Info', created_at: new Date() },
      { id: 6, nom: 'Bouazizi', prenom: 'Mohamed', email: 'mohamed.bouazizi@etudiant.tn', password_hash: etudiantHash, role: 'ETUDIANT', actif: 1, etudiant_id: 3, classe: '3ème Info', created_at: new Date() }
    ];

    this.enseignants_matieres = [
      { id: 1, enseignant_id: 2, matiere_id: 1, created_at: new Date() },
      { id: 2, enseignant_id: 2, matiere_id: 4, created_at: new Date() },
      { id: 3, enseignant_id: 3, matiere_id: 2, created_at: new Date() },
      { id: 4, enseignant_id: 3, matiere_id: 3, created_at: new Date() }
    ];
  }

  execute(query, params = []) {
    const q = query.trim().toUpperCase();

    // 1. ÉTUDIANTS
    if (q.startsWith('SELECT * FROM ETUDIANTS ORDER BY')) {
      const sorted = [...this.etudiants].sort((a, b) => a.nom.localeCompare(b.nom));
      return [sorted];
    }
    if (q.startsWith('SELECT * FROM ETUDIANTS WHERE ID = ?')) {
      const item = this.etudiants.find(e => e.id === parseInt(params[0]));
      return [item ? [item] : []];
    }
    if (q.startsWith('SELECT ID FROM ETUDIANTS WHERE EMAIL = ?')) {
      const email = params[0];
      const excludeId = params[1] ? parseInt(params[1]) : null;
      const found = this.etudiants.filter(e => e.email.toLowerCase() === email.toLowerCase() && (excludeId ? e.id !== excludeId : true));
      return [found];
    }
    if (q.startsWith('INSERT INTO ETUDIANTS')) {
      const [nom, prenom, classe, email] = params;
      const newId = this.etudiants.length > 0 ? Math.max(...this.etudiants.map(e => e.id)) + 1 : 1;
      const newEtudiant = { id: newId, nom, prenom, classe, email };
      this.etudiants.push(newEtudiant);
      return [{ insertId: newId, affectedRows: 1 }];
    }
    if (q.startsWith('UPDATE ETUDIANTS SET')) {
      const [nom, prenom, classe, email, id] = params;
      const target = this.etudiants.find(e => e.id === parseInt(id));
      if (target) {
        Object.assign(target, { nom, prenom, classe, email });
        return [{ affectedRows: 1 }];
      }
      return [{ affectedRows: 0 }];
    }
    if (q.startsWith('DELETE FROM ETUDIANTS WHERE ID = ?')) {
      const id = parseInt(params[0]);
      this.etudiants = this.etudiants.filter(e => e.id !== id);
      this.notes = this.notes.filter(n => n.id_etudiant !== id);
      return [{ affectedRows: 1 }];
    }
    if (q.startsWith('SELECT COUNT(*) AS TOTAL FROM ETUDIANTS')) {
      return [[{ total: this.etudiants.length }]];
    }
    if (q.includes('FROM ETUDIANTS ORDER BY ID DESC LIMIT')) {
      const limit = parseInt(params[0]) || 5;
      const reversed = [...this.etudiants].sort((a, b) => b.id - a.id).slice(0, limit);
      return [reversed];
    }

    // 2. MATIÈRES
    if (q.startsWith('SELECT * FROM MATIERES ORDER BY')) {
      const sorted = [...this.matieres].sort((a, b) => a.intitule.localeCompare(b.intitule));
      return [sorted];
    }
    if (q.startsWith('SELECT * FROM MATIERES WHERE ID = ?')) {
      const item = this.matieres.find(m => m.id === parseInt(params[0]));
      return [item ? [item] : []];
    }
    if (q.startsWith('INSERT INTO MATIERES')) {
      const [intitule, coefficient] = params;
      const newId = this.matieres.length > 0 ? Math.max(...this.matieres.map(m => m.id)) + 1 : 1;
      const newMatiere = { id: newId, intitule, coefficient: parseFloat(coefficient) };
      this.matieres.push(newMatiere);
      return [{ insertId: newId, affectedRows: 1 }];
    }
    if (q.startsWith('UPDATE MATIERES SET')) {
      const [intitule, coefficient, id] = params;
      const target = this.matieres.find(m => m.id === parseInt(id));
      if (target) {
        Object.assign(target, { intitule, coefficient: parseFloat(coefficient) });
        return [{ affectedRows: 1 }];
      }
      return [{ affectedRows: 0 }];
    }
    if (q.startsWith('DELETE FROM MATIERES WHERE ID = ?')) {
      const id = parseInt(params[0]);
      this.matieres = this.matieres.filter(m => m.id !== id);
      return [{ affectedRows: 1 }];
    }
    if (q.includes('FROM NOTES WHERE ID_MATIERE = ?')) {
      const idMat = parseInt(params[0]);
      const count = this.notes.filter(n => n.id_matiere === idMat).length;
      return [[{ total: count }]];
    }
    if (q.startsWith('SELECT COUNT(*) AS TOTAL FROM MATIERES')) {
      return [[{ total: this.matieres.length }]];
    }

    // 3. NOTES
    if (q.startsWith('INSERT INTO NOTES')) {
      const [id_etudiant, id_matiere, valeur, type] = params;
      const newId = this.notes.length > 0 ? Math.max(...this.notes.map(n => n.id)) + 1 : 1;
      const newNote = { id: newId, id_etudiant: parseInt(id_etudiant), id_matiere: parseInt(id_matiere), valeur: parseFloat(valeur), type };
      this.notes.push(newNote);
      return [{ insertId: newId, affectedRows: 1 }];
    }
    if (q.includes('FROM NOTES N') && q.includes('WHERE N.ID_ETUDIANT = ?')) {
      const idEtudiant = parseInt(params[0]);
      const etudNotes = this.notes
        .filter(n => n.id_etudiant === idEtudiant)
        .map(n => {
          const m = this.matieres.find(mat => mat.id === n.id_matiere) || {};
          return {
            id: n.id,
            id_etudiant: n.id_etudiant,
            id_matiere: n.id_matiere,
            valeur: n.valeur,
            type: n.type,
            matiere: m.intitule || '',
            coefficient: m.coefficient || 1
          };
        });
      return [etudNotes];
    }
    if (q.includes('FROM NOTES N') && q.includes('WHERE N.ID_MATIERE = ?')) {
      const idMatiere = parseInt(params[0]);
      const matNotes = this.notes
        .filter(n => n.id_matiere === idMatiere)
        .map(n => {
          const e = this.etudiants.find(et => et.id === n.id_etudiant) || {};
          return {
            id: n.id,
            id_etudiant: n.id_etudiant,
            id_matiere: n.id_matiere,
            valeur: n.valeur,
            type: n.type,
            nom: e.nom || '',
            prenom: e.prenom || '',
            classe: e.classe || ''
          };
        });
      return [matNotes];
    }
    if (q.includes('FROM NOTES N') && q.includes('ORDER BY N.ID DESC') && q.includes('LIMIT')) {
      const limit = parseInt(params[0]) || 5;
      const recent = [...this.notes].sort((a, b) => b.id - a.id).slice(0, limit).map(n => {
        const e = this.etudiants.find(et => et.id === n.id_etudiant) || {};
        const m = this.matieres.find(mat => mat.id === n.id_matiere) || {};
        return {
          id: n.id,
          valeur: n.valeur,
          type: n.type,
          created_at: new Date(),
          id_etudiant: n.id_etudiant,
          etudiant_nom: e.nom,
          etudiant_prenom: e.prenom,
          classe: e.classe,
          id_matiere: n.id_matiere,
          matiere_intitule: m.intitule,
          coefficient: m.coefficient
        };
      });
      return [recent];
    }
    if (q.startsWith('SELECT COUNT(*) AS TOTAL FROM NOTES')) {
      return [[{ total: this.notes.length }]];
    }

    // 4. USERS
    if (q.includes('FROM USERS U') && q.includes('WHERE U.EMAIL = ?')) {
      const email = params[0].toLowerCase();
      const u = this.users.find(usr => usr.email.toLowerCase() === email);
      return [u ? [u] : []];
    }
    if (q.includes('FROM USERS U') && q.includes('WHERE U.ID = ?')) {
      const id = parseInt(params[0]);
      const u = this.users.find(usr => usr.id === id);
      return [u ? [u] : []];
    }
    if (q.includes('FROM USERS U') && q.includes('ORDER BY U.ROLE')) {
      const list = this.users.map(u => ({
        ...u,
        nb_matieres_affectees: this.enseignants_matieres.filter(em => em.enseignant_id === u.id).length
      }));
      return [list];
    }
    if (q.startsWith('INSERT INTO USERS')) {
      const [nom, prenom, email, password_hash, role, actif, etudiant_id] = params;
      const newId = this.users.length > 0 ? Math.max(...this.users.map(u => u.id)) + 1 : 1;
      const newUser = { id: newId, nom, prenom, email, password_hash, role, actif: actif ? 1 : 0, etudiant_id: etudiant_id || null, created_at: new Date() };
      this.users.push(newUser);
      return [{ insertId: newId, affectedRows: 1 }];
    }
    if (q.startsWith('UPDATE USERS SET NOM = ?')) {
      const [nom, prenom, id] = params;
      const u = this.users.find(usr => usr.id === parseInt(id));
      if (u) {
        Object.assign(u, { nom, prenom });
        return [{ affectedRows: 1 }];
      }
      return [{ affectedRows: 0 }];
    }
    if (q.startsWith('UPDATE USERS SET PASSWORD_HASH = ?')) {
      const [password_hash, id] = params;
      const u = this.users.find(usr => usr.id === parseInt(id));
      if (u) {
        u.password_hash = password_hash;
        return [{ affectedRows: 1 }];
      }
      return [{ affectedRows: 0 }];
    }
    if (q.startsWith('UPDATE USERS SET ACTIF = ?')) {
      const [actif, id] = params;
      const u = this.users.find(usr => usr.id === parseInt(id));
      if (u) {
        u.actif = actif;
        return [{ affectedRows: 1 }];
      }
      return [{ affectedRows: 0 }];
    }
    if (q.startsWith('DELETE FROM USERS WHERE ID = ?')) {
      const id = parseInt(params[0]);
      this.users = this.users.filter(u => u.id !== id);
      return [{ affectedRows: 1 }];
    }

    // 5. ENSEIGNANTS_MATIERES
    if (q.includes('FROM ENSEIGNANTS_MATIERES') && q.includes('WHERE ENSEIGNANT_ID = ? AND MATIERE_ID = ?')) {
      const [ensId, matId] = params.map(p => parseInt(p));
      const match = this.enseignants_matieres.filter(em => em.enseignant_id === ensId && em.matiere_id === matId);
      return [match];
    }
    if (q.includes('FROM MATIERES M') && q.includes('JOIN ENSEIGNANTS_MATIERES EM') && q.includes('WHERE EM.ENSEIGNANT_ID = ?')) {
      const ensId = parseInt(params[0]);
      const matIds = this.enseignants_matieres.filter(em => em.enseignant_id === ensId).map(em => em.matiere_id);
      const list = this.matieres.filter(m => matIds.includes(m.id)).map(m => ({
        ...m,
        affectation_id: 1,
        affectation_date: new Date()
      }));
      return [list];
    }
    if (q.includes('FROM ENSEIGNANTS_MATIERES EM') && q.includes('JOIN USERS U')) {
      const list = this.enseignants_matieres.map(em => {
        const u = this.users.find(usr => usr.id === em.enseignant_id) || {};
        const m = this.matieres.find(mat => mat.id === em.matiere_id) || {};
        return {
          id: em.id,
          enseignant_id: em.enseignant_id,
          matiere_id: em.matiere_id,
          enseignant_nom: u.nom,
          enseignant_prenom: u.prenom,
          enseignant_email: u.email,
          matiere_intitule: m.intitule,
          matiere_coefficient: m.coefficient,
          created_at: em.created_at
        };
      });
      return [list];
    }
    if (q.startsWith('INSERT INTO ENSEIGNANTS_MATIERES')) {
      const [ensId, matId] = params.map(p => parseInt(p));
      const newId = this.enseignants_matieres.length > 0 ? Math.max(...this.enseignants_matieres.map(em => em.id)) + 1 : 1;
      this.enseignants_matieres.push({ id: newId, enseignant_id: ensId, matiere_id: matId, created_at: new Date() });
      return [{ insertId: newId, affectedRows: 1 }];
    }
    if (q.startsWith('DELETE FROM ENSEIGNANTS_MATIERES WHERE ID = ?')) {
      const id = parseInt(params[0]);
      this.enseignants_matieres = this.enseignants_matieres.filter(em => em.id !== id);
      return [{ affectedRows: 1 }];
    }

    return [[]];
  }
}

module.exports = new MockStore();
