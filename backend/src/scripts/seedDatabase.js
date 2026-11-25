/**
 * Script de migration et d'initialisation de la base de données
 * 
 * Permet d'initialiser ou de mettre à jour la base MySQL avec :
 * - Les tables (etudiants, matieres, notes, users, enseignants_matieres)
 * - Les données de test existantes
 * - Les comptes utilisateurs initiaux avec mots de passe hachés par bcrypt
 * - Les affectations enseignants <-> matières
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'gestion_notes';

async function seed() {
  console.log('🚀 Démarrage de l\'initialisation de la base de données...');

  let connection;
  try {
    // Connexion au serveur MySQL sans spécifier la base (pour pouvoir la créer si besoin)
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD
    });

    console.log(`✅ Connexion au serveur MySQL réussie (${DB_HOST}:${DB_PORT})`);

    // 1. Création de la base
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${DB_NAME}\`;`);
    console.log(`📁 Base de données sélectionnée : ${DB_NAME}`);

    // 2. Création des tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS etudiants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        classe VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_etudiants_email UNIQUE (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS matieres (
        id INT AUTO_INCREMENT PRIMARY KEY,
        intitule VARCHAR(150) NOT NULL,
        coefficient DECIMAL(4,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_coefficient_positif CHECK (coefficient > 0)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_etudiant INT NOT NULL,
        id_matiere INT NOT NULL,
        valeur DECIMAL(4,2) NOT NULL,
        type ENUM('DS', 'EXAMEN', 'TP') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_note_valeur CHECK (valeur >= 0 AND valeur <= 20),
        CONSTRAINT fk_notes_etudiant FOREIGN KEY (id_etudiant) REFERENCES etudiants(id) ON DELETE CASCADE,
        CONSTRAINT fk_notes_matiere FOREIGN KEY (id_matiere) REFERENCES matieres(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('ADMIN', 'ENSEIGNANT', 'ETUDIANT') NOT NULL DEFAULT 'ETUDIANT',
        actif TINYINT(1) NOT NULL DEFAULT 1,
        etudiant_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_users_etudiant FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS enseignants_matieres (
        id INT AUTO_INCREMENT PRIMARY KEY,
        enseignant_id INT NOT NULL,
        matiere_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_em_enseignant FOREIGN KEY (enseignant_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_em_matiere FOREIGN KEY (matiere_id) REFERENCES matieres(id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT uq_enseignant_matiere UNIQUE (enseignant_id, matiere_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Structure des tables vérifiée / créée.');

    // 3. Peupler les étudiants si la table est vide
    const [existingEtudiants] = await connection.query('SELECT COUNT(*) as count FROM etudiants');
    if (existingEtudiants[0].count === 0) {
      await connection.query(`
        INSERT INTO etudiants (id, nom, prenom, classe, email) VALUES
          (1, 'Ben Ali', 'Amine', '2ème Info', 'amine.benali@etudiant.tn'),
          (2, 'Trabelsi', 'Fatma', '2ème Info', 'fatma.trabelsi@etudiant.tn'),
          (3, 'Bouazizi', 'Mohamed', '3ème Info', 'mohamed.bouazizi@etudiant.tn'),
          (4, 'Mansouri', 'Sara', '2ème Info', 'sara.mansouri@etudiant.tn'),
          (5, 'Khelifi', 'Youssef', '3ème Info', 'youssef.khelifi@etudiant.tn');
      `);
      console.log('✅ 5 étudiants initiaux insérés.');
    }

    // 4. Peupler les matières si vide
    const [existingMatieres] = await connection.query('SELECT COUNT(*) as count FROM matieres');
    if (existingMatieres[0].count === 0) {
      await connection.query(`
        INSERT INTO matieres (id, intitule, coefficient) VALUES
          (1, 'Mathématiques', 3.00),
          (2, 'Programmation Web', 2.50),
          (3, 'Bases de données', 2.00),
          (4, 'Réseaux', 1.50),
          (5, 'Anglais', 1.00);
      `);
      console.log('✅ 5 matières initiales insérées.');
    }

    // 5. Peupler les notes si vide
    const [existingNotes] = await connection.query('SELECT COUNT(*) as count FROM notes');
    if (existingNotes[0].count === 0) {
      await connection.query(`
        INSERT INTO notes (id_etudiant, id_matiere, valeur, type) VALUES
          (1, 1, 14.50, 'DS'),
          (1, 1, 12.00, 'EXAMEN'),
          (1, 2, 16.00, 'DS'),
          (1, 2, 15.00, 'EXAMEN'),
          (1, 2, 17.00, 'TP'),
          (1, 3, 13.00, 'DS'),
          (1, 3, 11.50, 'EXAMEN'),
          (2, 1, 17.00, 'DS'),
          (2, 1, 18.50, 'EXAMEN'),
          (2, 2, 15.00, 'DS'),
          (2, 2, 14.00, 'EXAMEN'),
          (2, 2, 16.50, 'TP'),
          (2, 3, 19.00, 'DS'),
          (2, 3, 17.00, 'EXAMEN'),
          (2, 4, 14.00, 'DS'),
          (2, 4, 13.50, 'EXAMEN'),
          (3, 1, 8.00, 'DS'),
          (3, 1, 9.50, 'EXAMEN'),
          (3, 2, 11.00, 'DS'),
          (3, 2, 10.00, 'EXAMEN'),
          (3, 3, 7.50, 'DS'),
          (3, 3, 6.00, 'EXAMEN');
      `);
      console.log('✅ 22 notes initiales insérées.');
    }

    // 6. Peupler les utilisateurs RBAC (Admin, Enseignants, Étudiants)
    console.log('🔐 Hachage des mots de passe sécurisés avec bcrypt...');
    const adminHash = await bcrypt.hash('Admin@2026!', 10);
    const profHash = await bcrypt.hash('Prof@2026!', 10);
    const etudiantHash = await bcrypt.hash('Etudiant@2026!', 10);

    const usersToInsert = [
      {
        nom: 'Administrateur',
        prenom: 'Système',
        email: 'admin@gestion-notes.tn',
        hash: adminHash,
        role: 'ADMIN',
        etudiant_id: null
      },
      {
        nom: 'Dr. Gharbi',
        prenom: 'Kais',
        email: 'prof.math@gestion-notes.tn',
        hash: profHash,
        role: 'ENSEIGNANT',
        etudiant_id: null
      },
      {
        nom: 'Dr. Mejri',
        prenom: 'Sonia',
        email: 'prof.web@gestion-notes.tn',
        hash: profHash,
        role: 'ENSEIGNANT',
        etudiant_id: null
      },
      {
        nom: 'Ben Ali',
        prenom: 'Amine',
        email: 'amine.benali@etudiant.tn',
        hash: etudiantHash,
        role: 'ETUDIANT',
        etudiant_id: 1
      },
      {
        nom: 'Trabelsi',
        prenom: 'Fatma',
        email: 'fatma.trabelsi@etudiant.tn',
        hash: etudiantHash,
        role: 'ETUDIANT',
        etudiant_id: 2
      },
      {
        nom: 'Bouazizi',
        prenom: 'Mohamed',
        email: 'mohamed.bouazizi@etudiant.tn',
        hash: etudiantHash,
        role: 'ETUDIANT',
        etudiant_id: 3
      }
    ];

    for (const u of usersToInsert) {
      await connection.query(`
        INSERT INTO users (nom, prenom, email, password_hash, role, actif, etudiant_id)
        VALUES (?, ?, ?, ?, ?, 1, ?)
        ON DUPLICATE KEY UPDATE
          nom = VALUES(nom),
          prenom = VALUES(prenom),
          password_hash = VALUES(password_hash),
          role = VALUES(role),
          etudiant_id = VALUES(etudiant_id),
          actif = 1;
      `, [u.nom, u.prenom, u.email, u.hash, u.role, u.etudiant_id]);
    }
    console.log('✅ Comptes utilisateurs initialisés :');
    console.log('   - Admin      : admin@gestion-notes.tn / Admin@2026!');
    console.log('   - Enseignant : prof.math@gestion-notes.tn / Prof@2026!');
    console.log('   - Enseignant : prof.web@gestion-notes.tn / Prof@2026!');
    console.log('   - Étudiant   : amine.benali@etudiant.tn / Etudiant@2026!');
    console.log('   - Étudiant   : fatma.trabelsi@etudiant.tn / Etudiant@2026!');
    console.log('   - Étudiant   : mohamed.bouazizi@etudiant.tn / Etudiant@2026!');

    // 7. Affectations Enseignants <-> Matières
    // Récupérer les IDs des enseignants
    const [rowsProfMath] = await connection.query('SELECT id FROM users WHERE email = ?', ['prof.math@gestion-notes.tn']);
    const [rowsProfWeb] = await connection.query('SELECT id FROM users WHERE email = ?', ['prof.web@gestion-notes.tn']);

    if (rowsProfMath.length > 0 && rowsProfWeb.length > 0) {
      const idProfMath = rowsProfMath[0].id;
      const idProfWeb = rowsProfWeb[0].id;

      // Prof Math enseigne Mathématiques (1) et Réseaux (4)
      await connection.query(`
        INSERT IGNORE INTO enseignants_matieres (enseignant_id, matiere_id) VALUES
          (?, 1),
          (?, 4);
      `, [idProfMath, idProfMath]);

      // Prof Web enseigne Web (2) et BDD (3)
      await connection.query(`
        INSERT IGNORE INTO enseignants_matieres (enseignant_id, matiere_id) VALUES
          (?, 2),
          (?, 3);
      `, [idProfWeb, idProfWeb]);

      console.log('✅ Affectations Enseignants <-> Matières créées.');
    }

    console.log('🎉 INITIALISATION DE LA BASE DE DONNÉES TERMINÉE AVEC SUCCÈS !');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation :', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seed;
