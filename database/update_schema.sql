-- ============================================================
-- SCRIPT DE MISE À JOUR : AUTHENTIFICATION ET RBAC
-- Projet : Gestion des étudiants et des notes (SOA)
-- ============================================================

USE gestion_notes;

-- 1. Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nom           VARCHAR(100) NOT NULL,
  prenom        VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('ADMIN', 'ENSEIGNANT', 'ETUDIANT') NOT NULL DEFAULT 'ETUDIANT',
  actif         TINYINT(1) NOT NULL DEFAULT 1,
  etudiant_id   INT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_users_etudiant
    FOREIGN KEY (etudiant_id) REFERENCES etudiants(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table d'affectation des enseignants aux matières
CREATE TABLE IF NOT EXISTS enseignants_matieres (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  enseignant_id INT NOT NULL,
  matiere_id    INT NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_em_enseignant
    FOREIGN KEY (enseignant_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_em_matiere
    FOREIGN KEY (matiere_id) REFERENCES matieres(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT uq_enseignant_matiere UNIQUE (enseignant_id, matiere_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Index d'optimisation
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_notes_etudiant ON notes(id_etudiant);
CREATE INDEX IF NOT EXISTS idx_notes_matiere ON notes(id_matiere);
