-- ============================================================
-- BASE DE DONNÉES : gestion_notes
-- Module : SOA et Services Web
-- Architecture : REST / Micro-modules / RBAC
-- ============================================================

CREATE DATABASE IF NOT EXISTS gestion_notes
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE gestion_notes;

-- ============================================================
-- TABLE : etudiants (Module 1)
-- ============================================================
CREATE TABLE IF NOT EXISTS etudiants (
  id        INT           AUTO_INCREMENT PRIMARY KEY,
  nom       VARCHAR(100)  NOT NULL,
  prenom    VARCHAR(100)  NOT NULL,
  classe    VARCHAR(50)   NOT NULL,
  email     VARCHAR(255)  NOT NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_etudiants_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE : matieres (Module 2)
-- ============================================================
CREATE TABLE IF NOT EXISTS matieres (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  intitule    VARCHAR(150)  NOT NULL,
  coefficient DECIMAL(4,2)  NOT NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT chk_coefficient_positif CHECK (coefficient > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE : notes (Module 3)
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  id_etudiant INT           NOT NULL,
  id_matiere  INT           NOT NULL,
  valeur      DECIMAL(4,2)  NOT NULL,
  type        ENUM('DS', 'EXAMEN', 'TP') NOT NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT chk_note_valeur CHECK (valeur >= 0 AND valeur <= 20),

  CONSTRAINT fk_notes_etudiant
    FOREIGN KEY (id_etudiant) REFERENCES etudiants(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_notes_matiere
    FOREIGN KEY (id_matiere) REFERENCES matieres(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE : users (Sécurité et Authentification RBAC)
-- ============================================================
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

-- ============================================================
-- TABLE : enseignants_matieres (Affectations des enseignants)
-- ============================================================
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

-- Index pour accélérer les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_notes_etudiant ON notes(id_etudiant);
CREATE INDEX IF NOT EXISTS idx_notes_matiere ON notes(id_matiere);
