# 🎓 Système de Gestion des Étudiants et des Notes
### Application Web Full-Stack — Module : **Architecture SOA, Services Web & Sécurité RBAC**

---

## 📖 1. Présentation du Projet

Ce projet est une application web moderne, complète et sécurisée permettant la **gestion des étudiants, des matières, des notes, le calcul automatisé des moyennes pondérées**, ainsi qu'une **gestion granulaire des accès basée sur les rôles (RBAC - Role-Based Access Control)**.

Développée dans le cadre universitaire du module **SOA et Services Web**, l'application implémente :
- Une architecture orientée services (SOA) en couches étanches : Routes, Contrôleurs, Logique Métier (Services), Accès aux Données (Repositories avec requêtes SQL préparées).
- Un système d'authentification robuste par jetons **JWT (JSON Web Tokens)** et hachage cryptographique **bcrypt**.
- Un contrôle d'accès strict côté backend (**RBAC**) distinguant 3 profils : **Administrateur**, **Enseignant** et **Étudiant**.
- Une interface utilisateur moderne, réactive et animée (thèmes Sombre & Clair, tableaux interactifs, formulaires réactifs, notifications toast, modales dynamiques, graphiques analytiques et relevé de notes imprimable).

---

## 🏛️ 2. Architecture & Choix Techniques

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Client Web SPA)                       │
│      HTML5 Sémantique • CSS Moderne (Variables, Dark/Light, Print)    │
│        JavaScript ES6+ Moderne (Async/Await, Fetch, Modules API)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Requêtes HTTP REST (JSON)
                                    │ Header: Authorization: Bearer <JWT>
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       BACKEND (Node.js & Express)                      │
│                                                                        │
│  [Middlewares Globaux & Sécurité]                                      │
│    ├── CORS, Parser JSON Express                                       │
│    ├── authenticateToken (Vérification signature & expiration JWT)     │
│    ├── requireRole('ADMIN', 'ENSEIGNANT', ...)                         │
│    ├── checkEtudiantAccess (Isolation stricte des dossiers étudiants)  │
│    ├── checkNoteCreationAccess (Contrôle d'affectation enseignant)     │
│    ├── express-validator (Validation stricte entrées clientes)         │
│    └── errorHandler (Gestion centralisée des erreurs HTTP)             │
│                                                                        │
│  [Contrôleurs REST (Controllers)]                                      │
│    ├── authController        ── /api/auth                              │
│    ├── userController        ── /api/users (Admin)                     │
│    ├── affectationController ── /api/affectations                      │
│    ├── etudiantController    ── /api/etudiants                         │
│    ├── matiereController     ── /api/matieres                          │
│    └── noteController        ── /api/notes & /api/dashboard            │
│                                                                        │
│  [Logique Métier (Services)]                                           │
│    ├── authService (Hachage bcrypt, login, inscription, profil)        │
│    ├── userService (Gestion des comptes, activation/désactivation)     │
│    ├── etudiantService / matiereService                                │
│    └── noteService (Calculs des moyennes, coefficients, mentions)      │
│                                                                        │
│  [Accès aux Données (Repositories)]                                    │
│    ├── Requêtes préparées SQL (Protection contre Injections SQL)       │
│    └── Pool de connexions mysql2/promise                               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ MySQL Protocol
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    BASE DE DONNÉES (MySQL InnoDB)                      │
│       users ──< enseignants_matieres >── matieres                      │
│         │                                    │                         │
│         └──> etudiants ──────────────<     notes                       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 3. Rôles et Autorisations (RBAC)

> **⚠️ RÈGLE DE SÉCURITÉ ESSENTIELLE :**  
> Les autorisations sont **strictement contrôlées côté serveur** par des middlewares Express (`authenticateToken`, `requireRole`, `checkEtudiantAccess`, `checkNoteCreationAccess`). Un utilisateur ne peut en aucun cas contourner les restrictions en appelant directement l'API REST.

| Fonctionnalité | 👑 Administrateur | 👨‍🏫 Enseignant | 🎓 Étudiant |
|---|:---:|:---:|:---:|
| **Tableau de bord général & stats de promotion** | ✅ Accès total | ✅ Vue Enseignant | ✅ Espace Personnel |
| **Gestion des comptes & rôles (CRUD)** | ✅ Oui | ❌ HTTP 403 | ❌ HTTP 403 |
| **Activer / Désactiver un compte utilisateur** | ✅ Oui | ❌ HTTP 403 | ❌ HTTP 403 |
| **Affecter des enseignants à des matières** | ✅ Oui | ❌ HTTP 403 | ❌ HTTP 403 |
| **Gestion des étudiants (Ajouter, Modifier, Supprimer)** | ✅ Oui | ❌ Lecture seule | ❌ HTTP 403 |
| **Gestion des matières (Ajouter, Modifier, Supprimer)** | ✅ Oui | ❌ Lecture seule | ❌ Lecture seule |
| **Saisie de notes pour ses matières affectées** | ✅ Toutes matières | ✅ Ses matières uniquement | ❌ HTTP 403 |
| **Consulter les notes d'autres étudiants** | ✅ Oui | ✅ Oui | ❌ **Strictement Interdit (HTTP 403)** |
| **Consulter son propre bulletin & ses notes** | ✅ Oui | ✅ Oui | ✅ **Son propre dossier** |
| **Gérer son profil & changer son mot de passe** | ✅ Oui | ✅ Oui | ✅ Oui |

---

## 🗄️ 4. Schéma de la Base de Données

La base de données MySQL `gestion_notes` comprend 5 tables reliées par clés étrangères sous moteur **InnoDB** :

1. **`users`** :
   - `id` (INT PK AI), `nom`, `prenom`, `email` (UNIQUE), `password_hash` (bcrypt), `role` (`ADMIN`, `ENSEIGNANT`, `ETUDIANT`), `actif` (BOOLEAN), `etudiant_id` (FK NULL vers `etudiants.id`), `created_at`, `updated_at`.
2. **`enseignants_matieres`** :
   - `id` (INT PK AI), `enseignant_id` (FK vers `users.id`), `matiere_id` (FK vers `matieres.id`), contrainte `UNIQUE(enseignant_id, matiere_id)`.
3. **`etudiants`** :
   - `id` (INT PK AI), `nom`, `prenom`, `classe`, `email` (UNIQUE).
4. **`matieres`** :
   - `id` (INT PK AI), `intitule`, `coefficient` (`CHECK (coefficient > 0)`).
5. **`notes`** :
   - `id` (INT PK AI), `id_etudiant` (FK vers `etudiants.id` ON DELETE CASCADE), `id_matiere` (FK vers `matieres.id` ON DELETE RESTRICT), `valeur` (`CHECK (valeur >= 0 AND valeur <= 20)`), `type` (`ENUM('DS', 'EXAMEN', 'TP')`).

---

## 📡 5. Documentation des Endpoints REST

### Authentification & Profil (`/api/auth`)
- `POST /api/auth/login` : Connexion avec email et mot de passe, renvoie le token JWT et les informations de l'utilisateur.
- `POST /api/auth/register` : Inscription d'un nouvel utilisateur (étudiant).
- `GET /api/auth/me` : Récupération du profil connecté (*Authentification requise*).
- `PUT /api/auth/profile` : Mise à jour du nom et prénom.
- `PUT /api/auth/change-password` : Modification sécurisée du mot de passe avec vérification de l'ancien mot de passe.
- `POST /api/auth/logout` : Déconnexion.

### Administration des Utilisateurs (`/api/users`) — *Admin uniquement (HTTP 403 sinon)*
- `GET /api/users` : Liste tous les utilisateurs.
- `GET /api/users/:id` : Détails d'un utilisateur.
- `POST /api/users` : Création d'un compte (Admin, Enseignant, Étudiant).
- `PUT /api/users/:id` : Modification d'un compte.
- `PATCH /api/users/:id/toggle-actif` : Activation / Désactivation instantanée.
- `DELETE /api/users/:id` : Suppression d'un compte.

### Affectations Enseignants-Matières (`/api/affectations`)
- `GET /api/affectations` : Liste les affectations (toutes pour l'Admin, ses propres matières pour l'Enseignant).
- `POST /api/affectations` : Affecter une matière à un enseignant (*Admin uniquement*).
- `DELETE /api/affectations/:id` : Retirer une affectation (*Admin uniquement*).

### Module 1 : Étudiants (`/api/etudiants`)
- `GET /api/etudiants` : Liste tous les étudiants (*Admin & Enseignant*).
- `GET /api/etudiants/:id` : Détail d'un étudiant (*Admin, Enseignant, ou l'étudiant lui-même*).
- `POST /api/etudiants` : Ajouter un étudiant (*Admin uniquement*).
- `PUT /api/etudiants/:id` : Modifier un étudiant (*Admin uniquement*).
- `DELETE /api/etudiants/:id` : Supprimer un étudiant (*Admin uniquement*).

### Module 2 : Matières (`/api/matieres`)
- `GET /api/matieres` : Liste toutes les matières (*Tous utilisateurs authentifiés*).
- `GET /api/matieres/:id` : Détail d'une matière.
- `POST /api/matieres` : Ajouter une matière (*Admin uniquement*).
- `PUT /api/matieres/:id` : Modifier une matière (*Admin uniquement*).
- `DELETE /api/matieres/:id` : Supprimer une matière (*Admin uniquement*).

### Module 3 : Notes et Moyennes (`/api/notes`)
- `POST /api/notes` : Enregistrer une note (*Admin ou Enseignant affecté à la matière*).
- `GET /api/notes/:id` : Détail d'une note.
- `PUT /api/notes/:id` : Modifier une note (*Admin ou Enseignant affecté*).
- `DELETE /api/notes/:id` : Supprimer une note (*Admin uniquement*).
- `GET /api/etudiants/:id/notes` : Notes d'un étudiant (*Isolation stricte étudiant*).
- `GET /api/etudiants/:id/moyenne` : Calcul officiel de la moyenne générale pondérée, statut (Admis/Ajourné) et mention (*Isolation stricte étudiant*).
- `GET /api/matieres/:id/notes` : Notes d'une matière (*Admin & Enseignant*).

### Tableau de bord (`/api/dashboard`)
- `GET /api/dashboard/stats` : Statistiques avancées en temps réel selon le rôle connecté.

---

## ⚡ 6. Comptes de Démonstration (Prêts pour la Soutenance)

Pour faciliter la présentation, des boutons de **connexion rapide en un clic** sont intégrés sur la page de connexion, ou utilisables avec ces identifiants :

| Rôle | Email | Mot de passe | Description des droits |
|---|---|---|---|
| 👑 **Administrateur** | `admin@gestion-notes.tn` | `Admin@2026!` | Accès total : gestion des utilisateurs, rôles, affectations, étudiants, matières, notes. |
| 👨‍🏫 **Enseignant 1** | `prof.math@gestion-notes.tn` | `Prof@2026!` | Affecté aux matières : *Mathématiques* & *Réseaux*. Peut saisir uniquement les notes de ces matières. |
| 👨‍🏫 **Enseignant 2** | `prof.web@gestion-notes.tn` | `Prof@2026!` | Affecté aux matières : *Programmation Web* & *Bases de données*. |
| 🎓 **Étudiant 1** | `amine.benali@etudiant.tn` | `Etudiant@2026!` | Rattaché à l'étudiant #1 (*Amine Ben Ali*). Peut consulter uniquement ses notes et son bulletin. |
| 🎓 **Étudiant 2** | `fatma.trabelsi@etudiant.tn` | `Etudiant@2026!` | Rattaché à l'étudiant #2 (*Fatma Trabelsi*). |

---

## 🚀 7. Guide d'Installation & Démarrage

### Prérequis :
- **Node.js** (v18+)
- **MySQL** (XAMPP, WampServer, Laragon ou service MySQL local sur le port 3306)

### Étape 1 : Configurer `.env`
Vérifiez le fichier `backend/.env` :
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=gestion_notes

JWT_SECRET=super_secret_jwt_soa_gestion_notes_2026_universitaire_key
JWT_EXPIRES_IN=24h
```

### Étape 2 : Initialiser la Base de Données & Créer les Comptes
Démarrez votre serveur MySQL (ex: dans XAMPP, activez MySQL), puis lancez la commande automatique suivante depuis le dossier `backend/` :
```bash
npm run init-db
```
*Cette commande crée la base `gestion_notes`, toutes les tables nécessaires, les données initiales d'étudiants/matières/notes, hache les mots de passe avec bcrypt et crée les affectations.*

*(Alternative manuelle : exécuter `database/schema.sql` puis `database/update_schema.sql` dans phpMyAdmin ou MySQL Workbench).*

### Étape 3 : Exécuter la Suite de Tests Automatisés
```bash
npm test
```
*Résultat : **4 suites de tests passées avec succès**, totalisant **45 tests validés** (Calculs des moyennes, validations, authentification, contrôles RBAC).*

### Étape 4 : Lancer l'Application
```bash
npm start
```
- Ouvrez votre navigateur sur : **`http://localhost:3000`**

---

## 🧪 8. Résultats des Tests Automatisés

La suite de tests automatisés couvre l'ensemble des exigences du projet :

```text
PASS tests/integrationApi.test.js
PASS tests/authAndRbac.test.js
PASS tests/validation.test.js
PASS tests/noteService.test.js

Test Suites: 4 passed, 4 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        4.88 s
```

### Détail des tests vérifiés :
- **Tests Métier** : Ajout, modification et suppression d'étudiants et matières ; calculs des moyennes pondérées avec redistribution des types manquants (DS 25%, Examen 60%, TP 15%) ; attribution exacte des mentions (*Très bien*, *Bien*, *Assez bien*, *Passable*, *Insuffisant*) et du statut (*Admis* / *Ajourné*).
- **Tests de Validation** : Refus systématique des notes $> 20$ (HTTP 400), refus des notes $< 0$ (HTTP 400), refus des coefficients nuls ou négatifs, validation des emails institutionnels, rejet des doublons.
- **Tests d'Authentification** : Connexion réussie avec mot de passe valide, rejet d'un mauvais mot de passe (HTTP 401), rejet des comptes désactivés (HTTP 403), génération et vérification de la signature JWT.
- **Tests des Autorisations RBAC** :
  - Un étudiant ne peut **JAMAIS** consulter les notes d'un autre étudiant (HTTP 403).
  - Un étudiant ne peut **JAMAIS** saisir de note (HTTP 403).
  - Un enseignant ne peut **PAS** accéder à la gestion des utilisateurs ou modifier des rôles (HTTP 403).
  - Un enseignant ne peut **PAS** saisir de note pour une matière qui ne lui est pas affectée (HTTP 403).
  - Un administrateur dispose de tous les accès autorisés (HTTP 200).

---

## 🎤 9. Guide de Présentation pour la Soutenance Universitaire

Voici le déroulé pas-à-pas conseillé pour faire une démonstration percutante devant vos professeurs :

1. **Introduction & Architecture (2 min)** :
   - Expliquer l'architecture SOA en couches : Frontend SPA, Middlewares de sécurité, Contrôleurs REST, Services métier, Repositories avec requêtes préparées, Base MySQL.
   - Mentionner l'indépendance des trois modules métier (*Étudiants*, *Matières*, *Notes*) et l'intégration de la sécurité RBAC.
2. **Démonstration Espace Administrateur (3 min)** :
   - Cliquer sur le bouton rapide **👑 Admin** sur la page de connexion.
   - Présenter le **Tableau de bord dynamique** : les cartes KPI (effectifs, moyenne promo, taux de réussite) et le graphique analytique des mentions calculé directement depuis MySQL.
   - Aller dans **Gestion des Utilisateurs** : montrer la liste des comptes, basculer le statut d'un compte avec le switch animé (Activer / Désactiver).
   - Aller dans **Affectations Enseignants** : montrer l'affectation du Dr. Kais Gharbi aux Mathématiques et du Dr. Sonia Mejri au Web.
3. **Démonstration Espace Enseignant & Sécurité Serveur (3 min)** :
   - Se déconnecter et cliquer sur **👨‍🏫 Enseignant** (`prof.math@gestion-notes.tn`).
   - Montrer que le menu d'administration a disparu.
   - Aller dans **Saisie des Notes** : montrer que dans la liste des matières, seules ses matières affectées (*Mathématiques* et *Réseaux*) apparaissent.
   - Saisir une note valide (ex: 15.5 en DS) et montrer l'enregistrement en temps réel.
   - Expliquer au jury que même si un pirate envoyait un appel API forgé vers une matière non attribuée, le backend intercepterait l'attaque et renverrait immédiatement une erreur `HTTP 403 Forbidden`.
4. **Démonstration Espace Étudiant & Relevé de Notes (2 min)** :
   - Se connecter en tant que **🎓 Étudiant** (`amine.benali@etudiant.tn`).
   - Montrer l'espace personnel : l'étudiant voit immédiatement son bulletin officiel avec sa moyenne générale pondérée, son appréciation (*Assez bien*) et son statut (*Admis*).
   - Expliquer que l'étudiant ne peut en aucun cas modifier de notes ou voir les dossiers de ses camarades (isolation stricte par ID).
   - Cliquer sur **🖨️ Imprimer le bulletin** pour montrer la mise en page d'impression officielle prête pour l'administration.
5. **Validation & Qualité du Code (1 min)** :
   - Ouvrir un terminal et lancer `npm test` pour montrer au jury les **45 tests automatisés** réussis.
