
USE gestion_notes;


INSERT INTO etudiants (nom, prenom, classe, email) VALUES
  ('Ben Ali',    'Amine',   '2ème Info',  'amine.benali@etudiant.tn'),
  ('Trabelsi',  'Fatma',   '2ème Info',  'fatma.trabelsi@etudiant.tn'),
  ('Bouazizi',  'Mohamed', '3ème Info',  'mohamed.bouazizi@etudiant.tn'),
  ('Mansouri',  'Sara',    '2ème Info',  'sara.mansouri@etudiant.tn'),
  ('Khelifi',   'Youssef', '3ème Info',  'youssef.khelifi@etudiant.tn');


INSERT INTO matieres (intitule, coefficient) VALUES
  ('Mathématiques',      3.00),
  ('Programmation Web',  2.50),
  ('Bases de données',   2.00),
  ('Réseaux',            1.50),
  ('Anglais',            1.00);



INSERT INTO notes (id_etudiant, id_matiere, valeur, type) VALUES
  (1, 1, 14.50, 'DS'),
  (1, 1, 12.00, 'EXAMEN'),
  (1, 2, 16.00, 'DS'),
  (1, 2, 15.00, 'EXAMEN'),
  (1, 2, 17.00, 'TP'),
  (1, 3, 13.00, 'DS'),
  (1, 3, 11.50, 'EXAMEN');


INSERT INTO notes (id_etudiant, id_matiere, valeur, type) VALUES
  (2, 1, 17.00, 'DS'),
  (2, 1, 18.50, 'EXAMEN'),
  (2, 2, 15.00, 'DS'),
  (2, 2, 14.00, 'EXAMEN'),
  (2, 2, 16.50, 'TP'),
  (2, 3, 19.00, 'DS'),
  (2, 3, 17.00, 'EXAMEN'),
  (2, 4, 14.00, 'DS'),
  (2, 4, 13.50, 'EXAMEN');


INSERT INTO notes (id_etudiant, id_matiere, valeur, type) VALUES
  (3, 1,  8.00, 'DS'),
  (3, 1,  9.50, 'EXAMEN'),
  (3, 2, 11.00, 'DS'),
  (3, 2, 10.00, 'EXAMEN'),
  (3, 3,  7.50, 'DS'),
  (3, 3,  6.00, 'EXAMEN');
