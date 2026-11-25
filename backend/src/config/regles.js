/**
 * Configuration des règles métier
 * 
 * Ce fichier centralise toutes les constantes et seuils du projet.
 * 
 * ⚠️ IMPORTANT : Les pondérations et seuils ci-dessous sont PROVISOIRES.
 * Ils doivent être confirmés avec l'enseignant avant la version finale.
 * 
 * بالتونسي: هذا الفايل فيه القواعد متاع الحساب (المعدلات والنتائج)
 * لازم نتأكدو من الأستاذ قبل ما نسلمو المشروع
 */

const config = {
  // ============================================================
  // PONDÉRATIONS POUR LE CALCUL DE LA NOTE FINALE PAR MATIÈRE
  // ============================================================
  // 
  // HYPOTHÈSE PROVISOIRE (à confirmer avec l'enseignant) :
  //   - DS    → 25% de la note finale de la matière
  //   - EXAMEN → 60% de la note finale de la matière
  //   - TP    → 15% de la note finale de la matière
  //
  // Si un type de note n'existe pas pour une matière,
  // on redistribue les pourcentages entre les types existants.
  //
  // Exemple : si pas de TP → DS = 30%, EXAMEN = 70%
  // ============================================================
  ponderations: {
    DS: 0.25,
    EXAMEN: 0.60,
    TP: 0.15
  },

  // ============================================================
  // SEUILS D'APPRÉCIATION ET DE VALIDATION
  // ============================================================
  // 
  // VALEURS PROVISOIRES (à confirmer avec l'enseignant) :
  //   - < 10     → Ajourné (non admis)
  //   - 10 à 12  → Passable
  //   - 12 à 14  → Assez bien
  //   - 14 à 16  → Bien
  //   - >= 16    → Très bien
  // ============================================================
  seuils: {
    admission: 10,     // Seuil minimum pour être admis
    passable: 10,      // 10 <= moyenne < 12
    assezBien: 12,     // 12 <= moyenne < 14
    bien: 14,          // 14 <= moyenne < 16
    tresBien: 16       // moyenne >= 16
  },

  // Types de notes autorisés
  typesNotes: ['DS', 'EXAMEN', 'TP']
};

module.exports = config;
