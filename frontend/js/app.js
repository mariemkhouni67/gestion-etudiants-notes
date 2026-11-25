/**
 * Application Frontend — Architecture SOA, RBAC & Expérience Utilisateur
 * 
 * Gestion de l'état, navigation dynamique, contrôle d'accès par rôle (Admin, Enseignant, Étudiant),
 * modales fluides, graphiques statistiques et intégration temps réel MySQL.
 */

// ============================================================
// ÉTAT GLOBAL DE L'APPLICATION
// ============================================================

const appState = {
  currentUser: null,
  activePage: 'dashboard',
  etudiants: [],
  matieres: [],
  classes: new Set(),
  theme: localStorage.getItem('app_theme') || 'dark',
  pendingDeleteAction: null
};

let mentionsChartInstance = null;

// ============================================================
// NAVIGATION & CONTRÔLE D'ACCÈS (RBAC)
// ============================================================

/**
 * Naviguer vers une page
 */
function navigateTo(pageName) {
  const user = appState.currentUser;

  // Contrôles de sécurité RBAC côté client (en plus du backend)
  if (user) {
    if (user.role === 'ETUDIANT') {
      const allowedStudentPages = ['espace-etudiant', 'dashboard', 'mon-profil'];
      if (!allowedStudentPages.includes(pageName)) {
        pageName = 'espace-etudiant';
      }
    } else if (user.role === 'ENSEIGNANT') {
      const forbiddenTeacherPages = ['utilisateurs', 'affectations'];
      if (forbiddenTeacherPages.includes(pageName)) {
        showToast('Accès réservé aux administrateurs', 'error');
        pageName = 'dashboard';
      }
    }
  }

  // Cacher toutes les sections
  document.querySelectorAll('.page-section').forEach(section => {
    section.classList.remove('active');
  });

  // Désactiver tous les liens de navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  // Afficher la section demandée
  let targetSection = document.getElementById(`page-${pageName}`);
  if (!targetSection) {
    targetSection = document.getElementById('page-404');
    pageName = '404';
  }
  targetSection.classList.add('active');

  // Activer le lien correspondant
  const activeNavItem = document.querySelector(`[data-page="${pageName}"]`);
  if (activeNavItem) {
    activeNavItem.classList.add('active');
  }

  // Mettre à jour le fil d'Ariane
  const breadcrumb = document.getElementById('topbarBreadcrumb');
  if (breadcrumb) {
    const titles = {
      dashboard: 'Tableau de bord',
      'espace-etudiant': 'Mon Bulletin & Notes',
      etudiants: 'Étudiants',
      matieres: 'Matières',
      notes: 'Saisie des Notes',
      resultats: 'Résultats & Moyennes',
      affectations: 'Affectations Enseignants',
      utilisateurs: 'Gestion des Utilisateurs',
      'mon-profil': 'Mon Profil & Sécurité'
    };
    breadcrumb.textContent = titles[pageName] || 'Tableau de bord';
  }

  appState.activePage = pageName;

  // Fermer le sidebar sur mobile
  closeSidebar();

  // Charger les données de la section
  loadSectionData(pageName);
}

/**
 * Charger les données selon la section active
 */
async function loadSectionData(pageName) {
  try {
    switch (pageName) {
      case 'dashboard':
        await loadDashboard();
        break;
      case 'espace-etudiant':
        await loadMonEspaceEtudiant();
        break;
      case 'etudiants':
        await loadEtudiants();
        break;
      case 'matieres':
        await loadMatieres();
        break;
      case 'notes':
        await loadNotesPage();
        break;
      case 'resultats':
        await loadResultatsPage();
        break;
      case 'affectations':
        await loadAffectations();
        break;
      case 'utilisateurs':
        await loadUtilisateurs();
        break;
      case 'mon-profil':
        await loadProfil();
        break;
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

/**
 * Configurer l'interface selon le rôle de l'utilisateur
 */
function configureUIForRole(user) {
  if (!user) return;

  const role = user.role;

  // Badges et textes de profil
  const initials = `${user.prenom ? user.prenom[0] : ''}${user.nom ? user.nom[0] : ''}`.toUpperCase() || 'U';
  document.getElementById('sidebarAvatar').textContent = initials;
  document.getElementById('topbarAvatar').textContent = initials;
  document.getElementById('sidebarUserName').textContent = `${user.prenom} ${user.nom}`;
  document.getElementById('topbarUserName').textContent = `${user.prenom} ${user.nom}`;
  document.getElementById('dropdownUserName').textContent = `${user.prenom} ${user.nom}`;
  document.getElementById('dropdownUserEmail').textContent = user.email;

  // Rôle stylisé
  const sidebarRoleBadge = document.getElementById('sidebarUserRole');
  sidebarRoleBadge.textContent = role;
  sidebarRoleBadge.className = `user-role-badge role-${role.toLowerCase()}`;

  // Réglage de visibilité des menus selon le rôle
  const adminNav = document.getElementById('adminNavSection');
  const navEspaceEtudiant = document.getElementById('nav-espace-etudiant');
  const navEtudiants = document.getElementById('nav-etudiants');
  const navMatieres = document.getElementById('nav-matieres');
  const navNotes = document.getElementById('nav-notes');
  const navResultats = document.getElementById('nav-resultats');

  const btnAddEtudiant = document.getElementById('btnAddEtudiant');
  const btnAddMatiere = document.getElementById('btnAddMatiere');

  if (role === 'ETUDIANT') {
    if (adminNav) adminNav.style.display = 'none';
    if (navEspaceEtudiant) navEspaceEtudiant.style.display = 'flex';
    if (navEtudiants) navEtudiants.style.display = 'none';
    if (navMatieres) navMatieres.style.display = 'none';
    if (navNotes) navNotes.style.display = 'none';
    if (navResultats) navResultats.style.display = 'none';
  } else if (role === 'ENSEIGNANT') {
    if (adminNav) adminNav.style.display = 'none';
    if (navEspaceEtudiant) navEspaceEtudiant.style.display = 'none';
    if (navEtudiants) navEtudiants.style.display = 'flex';
    if (navMatieres) navMatieres.style.display = 'flex';
    if (navNotes) navNotes.style.display = 'flex';
    if (navResultats) navResultats.style.display = 'flex';

    // Cacher les boutons de création pour les enseignants
    if (btnAddEtudiant) btnAddEtudiant.style.display = 'none';
    if (btnAddMatiere) btnAddMatiere.style.display = 'none';
  } else {
    // ADMIN : Accès complet
    if (adminNav) adminNav.style.display = 'block';
    if (navEspaceEtudiant) navEspaceEtudiant.style.display = 'none';
    if (navEtudiants) navEtudiants.style.display = 'flex';
    if (navMatieres) navMatieres.style.display = 'flex';
    if (navNotes) navNotes.style.display = 'flex';
    if (navResultats) navResultats.style.display = 'flex';

    if (btnAddEtudiant) btnAddEtudiant.style.display = 'inline-flex';
    if (btnAddMatiere) btnAddMatiere.style.display = 'inline-flex';
  }
}

// ============================================================
// GESTION DU DASHBOARD ANALYTIQUE
// ============================================================

async function loadDashboard() {
  const user = appState.currentUser;
  const welcomeTitle = document.getElementById('dashWelcomeTitle');
  const roleNotice = document.getElementById('dashRoleNotice');

  if (user) {
    welcomeTitle.textContent = `Bienvenue, ${user.prenom} ${user.nom}`;
    roleNotice.innerHTML = `<span class="badge role-${user.role.toLowerCase()}">Espace ${user.role}</span>`;
  }

  try {
    const res = await dashboardAPI.getAdvancedStats();
    const data = res.data;

    // Si c'est un étudiant, adapter l'affichage du dashboard
    if (data.role === 'ETUDIANT') {
      document.getElementById('stat-etudiants').textContent = '1';
      document.getElementById('stat-matieres').textContent = data.detailsMatieres ? data.detailsMatieres.length : 0;
      document.getElementById('stat-notes').textContent = data.totalNotes || 0;
      document.getElementById('stat-moyenne').textContent = data.moyenneGenerale !== null ? `${data.moyenneGenerale.toFixed(2)}/20` : '—';
      document.getElementById('stat-taux').textContent = data.statut || '—';

      renderStudentDashboard(data);
      return;
    }

    // Affichage pour Enseignant ou Administrateur
    document.getElementById('stat-etudiants').textContent = data.totalEtudiants ?? '—';
    document.getElementById('stat-matieres').textContent = data.totalMatieres ?? '—';
    document.getElementById('stat-notes').textContent = data.totalNotes ?? '—';
    document.getElementById('stat-moyenne').textContent = data.moyennePromo !== null && data.moyennePromo !== undefined ? `${data.moyennePromo.toFixed(2)}/20` : '—';
    document.getElementById('stat-taux').textContent = data.tauxReussite !== undefined ? `${data.tauxReussite}%` : '—';

    // Rendu visuel des mentions (barres progressives)
    if (data.mentions) {
      renderMentionsBars(data.mentions, data.totalEtudiants);
    }

    // Rendu des dernières notes
    renderRecentNotes(data.recentNotes || data.dernieresNotes || []);

    // Rendu des derniers étudiants
    renderRecentEtudiants(data.derniersEtudiants || []);
  } catch (error) {
    console.error('Erreur chargement dashboard:', error);
  }
}

function renderStudentDashboard(data) {
  const container = document.getElementById('mentionsVisualBars');
  if (!container) return;

  const isAdmis = data.statut === 'Admis';
  container.innerHTML = `
    <div style="background: var(--bg-input); padding: 1.5rem; border-radius: var(--radius-md); text-align: center;">
      <div style="font-size: 2.5rem; font-weight: 900; color: ${isAdmis ? 'var(--success)' : 'var(--danger)'};">
        ${data.moyenneGenerale !== null ? data.moyenneGenerale.toFixed(2) : '—'}/20
      </div>
      <div style="font-size: 1.1rem; font-weight: 700; margin-top: 0.5rem;">
        Statut : ${isAdmis ? '✅ Admis' : '❌ Ajourné'}
      </div>
      <p style="margin-top: 0.25rem;">Mention : <strong>${data.appreciation}</strong></p>
      <button class="btn btn-primary" onclick="navigateTo('espace-etudiant')" style="margin-top: 1rem;">
        Consulter mon bulletin complet →
      </button>
    </div>
  `;

  renderRecentNotes(data.recentNotes || []);
}

function renderMentionsBars(mentions, total) {
  const container = document.getElementById('mentionsVisualBars');
  const canvas = document.getElementById('mentionsChartCanvas');

  const items = [
    { label: 'Très bien (>= 16)', count: mentions.tresBien || 0, hex: '#10b981', color: 'var(--success)' },
    { label: 'Bien (14 à 16)', count: mentions.bien || 0, hex: '#38bdf8', color: '#38bdf8' },
    { label: 'Assez bien (12 à 14)', count: mentions.assezBien || 0, hex: '#818cf8', color: 'var(--primary-light)' },
    { label: 'Passable (10 à 12)', count: mentions.passable || 0, hex: '#f59e0b', color: 'var(--warning)' },
    { label: 'Ajourné (< 10)', count: mentions.ajourne || 0, hex: '#ef4444', color: 'var(--danger)' }
  ];

  // 1. Rendu avec Chart.js si disponible
  if (window.Chart && canvas) {
    try {
      if (mentionsChartInstance) {
        mentionsChartInstance.destroy();
      }

      const isAllZero = items.every(i => i.count === 0);
      const dataValues = isAllZero ? [1] : items.map(i => i.count);
      const bgColors = isAllZero ? ['#334155'] : items.map(i => i.hex);
      const labels = isAllZero ? ['Aucune donnée'] : items.map(i => i.label);

      mentionsChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: dataValues,
            backgroundColor: bgColors,
            borderWidth: 2,
            borderColor: document.documentElement.getAttribute('data-theme') === 'light' ? '#ffffff' : '#1e293b'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                color: document.documentElement.getAttribute('data-theme') === 'light' ? '#475569' : '#94a3b8',
                font: { family: 'Inter', size: 11 }
              }
            }
          },
          cutout: '65%'
        }
      });
    } catch (e) {
      console.warn('Chart.js render error:', e);
    }
  }

  // 2. Barres de détails sous le graphique
  if (container) {
    const max = Math.max(...items.map(i => i.count), 1);
    container.innerHTML = items.map(item => {
      const pct = Math.round((item.count / max) * 100);
      return `
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 3px;">
            <span>${item.label}</span>
            <strong>${item.count} étudiant(s)</strong>
          </div>
          <div style="background: var(--bg-input); height: 8px; border-radius: var(--radius-full); overflow: hidden;">
            <div style="background: ${item.color}; width: ${pct}%; height: 100%; border-radius: var(--radius-full); transition: width 0.8s ease;"></div>
          </div>
        </div>
      `;
    }).join('');
  }
}

function renderRecentNotes(notes) {
  const container = document.getElementById('recentNotesContainer');
  if (!container) return;

  if (notes.length === 0) {
    container.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-dim); text-align: center; padding: 1rem;">Aucune note récente enregistrée.</p>`;
    return;
  }

  container.innerHTML = notes.map(n => {
    const noteVal = parseFloat(n.valeur);
    const noteClass = noteVal >= 14 ? 'good' : (noteVal >= 10 ? 'average' : 'poor');
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.85rem; background: var(--bg-input); border-radius: var(--radius-md); border: 1px solid var(--border);">
        <div>
          <div style="font-size: 0.88rem; font-weight: 600;">${escapeHtml(n.etudiant_nom || n.nom || 'Étudiant')} ${escapeHtml(n.etudiant_prenom || n.prenom || '')}</div>
          <div style="font-size: 0.75rem; color: var(--text-dim);">${escapeHtml(n.matiere_intitule || n.matiere || '')} — <span class="badge badge-type-${(n.type || '').toLowerCase()}">${n.type}</span></div>
        </div>
        <div class="note-badge ${noteClass}">${noteVal.toFixed(2)}/20</div>
      </div>
    `;
  }).join('');
}

function renderRecentEtudiants(etudiants) {
  const tbody = document.getElementById('dashRecentEtudiantsBody');
  if (!tbody) return;

  if (etudiants.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-dim);">Aucun étudiant enregistré</td></tr>`;
    return;
  }

  tbody.innerHTML = etudiants.map(e => `
    <tr>
      <td><strong>#${e.id}</strong></td>
      <td><strong>${escapeHtml(e.nom)} ${escapeHtml(e.prenom)}</strong></td>
      <td><span class="badge badge-classe">${escapeHtml(e.classe)}</span></td>
      <td style="color: var(--text-muted); font-size: 0.85rem;">${escapeHtml(e.email)}</td>
    </tr>
  `).join('');
}

// ============================================================
// MODULE ÉTUDIANTS (Module 1)
// ============================================================

async function loadEtudiants() {
  const tbody = document.getElementById('etudiantsTableBody');
  tbody.innerHTML = `<tr><td colspan="6" class="loading"><div class="spinner"></div> Chargement des étudiants...</td></tr>`;

  try {
    const res = await etudiantsAPI.getAll();
    appState.etudiants = res.data;

    // Extraire les classes uniques pour le filtre
    appState.classes = new Set(appState.etudiants.map(e => e.classe).filter(Boolean));
    const selectFilter = document.getElementById('filterClasseEtudiant');
    if (selectFilter) {
      selectFilter.innerHTML = '<option value="">Toutes les classes</option>' +
        Array.from(appState.classes).map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    }

    renderEtudiants(appState.etudiants);
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="icon">❌</div><p>${error.message}</p></div></td></tr>`;
  }
}

function renderEtudiants(etudiants) {
  const tbody = document.getElementById('etudiantsTableBody');
  const user = appState.currentUser;
  const isAdmin = user && user.role === 'ADMIN';

  if (!etudiants || etudiants.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="icon">👩‍🎓</div><h3>Aucun étudiant trouvé</h3></div></td></tr>`;
    return;
  }

  tbody.innerHTML = etudiants.map(e => `
    <tr>
      <td><strong>#${e.id}</strong></td>
      <td><strong>${escapeHtml(e.nom)}</strong></td>
      <td>${escapeHtml(e.prenom)}</td>
      <td><span class="badge badge-classe">${escapeHtml(e.classe)}</span></td>
      <td style="color: var(--text-muted); font-size: 0.85rem;">${escapeHtml(e.email)}</td>
      <td>
        <div class="actions">
          <button class="btn-icon" onclick="consulterBulletinEtudiant(${e.id})" title="Voir le bulletin">📊</button>
          ${isAdmin ? `
            <button class="btn-icon edit" onclick="openEditEtudiant(${e.id})" title="Modifier">✏️</button>
            <button class="btn-icon delete" onclick="confirmDeleteEtudiant(${e.id}, '${escapeHtml(e.prenom)} ${escapeHtml(e.nom)}')" title="Supprimer">🗑️</button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function filterEtudiants() {
  const query = (document.getElementById('searchEtudiant').value || '').toLowerCase();
  const classe = document.getElementById('filterClasseEtudiant').value;

  const filtered = appState.etudiants.filter(e => {
    const matchQuery = e.nom.toLowerCase().includes(query) ||
      e.prenom.toLowerCase().includes(query) ||
      e.email.toLowerCase().includes(query) ||
      e.classe.toLowerCase().includes(query);
    const matchClasse = !classe || e.classe === classe;
    return matchQuery && matchClasse;
  });

  renderEtudiants(filtered);
}

function openAddEtudiant() {
  document.getElementById('etudiantId').value = '';
  document.getElementById('formEtudiant').reset();
  document.getElementById('modalEtudiantTitle').textContent = '➕ Ajouter un nouvel étudiant';
  document.getElementById('submitEtudiant').textContent = 'Enregistrer';
  openModal('modalEtudiant');
}

async function openEditEtudiant(id) {
  try {
    const res = await etudiantsAPI.getById(id);
    const e = res.data;
    document.getElementById('etudiantId').value = e.id;
    document.getElementById('etudiantNom').value = e.nom;
    document.getElementById('etudiantPrenom').value = e.prenom;
    document.getElementById('etudiantClasse').value = e.classe;
    document.getElementById('etudiantEmail').value = e.email;

    document.getElementById('modalEtudiantTitle').textContent = '✏️ Modifier l\'étudiant';
    document.getElementById('submitEtudiant').textContent = 'Mettre à jour';
    openModal('modalEtudiant');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function handleEtudiantSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('etudiantId').value;
  const data = {
    nom: document.getElementById('etudiantNom').value.trim(),
    prenom: document.getElementById('etudiantPrenom').value.trim(),
    classe: document.getElementById('etudiantClasse').value.trim(),
    email: document.getElementById('etudiantEmail').value.trim()
  };

  try {
    if (id) {
      await etudiantsAPI.update(id, data);
      showToast('Étudiant modifié avec succès !', 'success');
    } else {
      await etudiantsAPI.create(data);
      showToast('Étudiant ajouté avec succès !', 'success');
    }
    closeModal('modalEtudiant');
    loadEtudiants();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function confirmDeleteEtudiant(id, name) {
  showConfirmModal('Supprimer cet étudiant ?', `Attention : La suppression de "${name}" effacera également toutes ses notes enregistrées (CASCADE).`, async () => {
    try {
      await etudiantsAPI.delete(id);
      showToast(`Étudiant "${name}" supprimé avec succès.`, 'success');
      loadEtudiants();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

// ============================================================
// MODULE MATIÈRES (Module 2)
// ============================================================

async function loadMatieres() {
  const tbody = document.getElementById('matieresTableBody');
  tbody.innerHTML = `<tr><td colspan="4" class="loading"><div class="spinner"></div> Chargement des matières...</td></tr>`;

  try {
    const res = await matieresAPI.getAll();
    appState.matieres = res.data;
    renderMatieres(appState.matieres);
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><div class="icon">❌</div><p>${error.message}</p></div></td></tr>`;
  }
}

function renderMatieres(matieres) {
  const tbody = document.getElementById('matieresTableBody');
  const user = appState.currentUser;
  const isAdmin = user && user.role === 'ADMIN';

  if (!matieres || matieres.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><div class="icon">📚</div><h3>Aucune matière trouvée</h3></div></td></tr>`;
    return;
  }

  tbody.innerHTML = matieres.map(m => `
    <tr>
      <td><strong>#${m.id}</strong></td>
      <td><strong>${escapeHtml(m.intitule)}</strong></td>
      <td><span class="badge" style="background: var(--bg-input); border: 1px solid var(--border);">Coeff. ${parseFloat(m.coefficient).toFixed(2)}</span></td>
      <td>
        <div class="actions">
          ${isAdmin ? `
            <button class="btn-icon edit" onclick="openEditMatiere(${m.id})" title="Modifier">✏️</button>
            <button class="btn-icon delete" onclick="confirmDeleteMatiere(${m.id}, '${escapeHtml(m.intitule)}')" title="Supprimer">🗑️</button>
          ` : '<span style="color: var(--text-dim); font-size: 0.8rem;">Lecture seule</span>'}
        </div>
      </td>
    </tr>
  `).join('');
}

function openAddMatiere() {
  document.getElementById('matiereId').value = '';
  document.getElementById('formMatiere').reset();
  document.getElementById('modalMatiereTitle').textContent = '➕ Ajouter une matière';
  document.getElementById('submitMatiere').textContent = 'Enregistrer';
  openModal('modalMatiere');
}

async function openEditMatiere(id) {
  try {
    const res = await matieresAPI.getById(id);
    const m = res.data;
    document.getElementById('matiereId').value = m.id;
    document.getElementById('matiereIntitule').value = m.intitule;
    document.getElementById('matiereCoefficient').value = m.coefficient;

    document.getElementById('modalMatiereTitle').textContent = '✏️ Modifier la matière';
    document.getElementById('submitMatiere').textContent = 'Mettre à jour';
    openModal('modalMatiere');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function handleMatiereSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('matiereId').value;
  const data = {
    intitule: document.getElementById('matiereIntitule').value.trim(),
    coefficient: parseFloat(document.getElementById('matiereCoefficient').value)
  };

  try {
    if (id) {
      await matieresAPI.update(id, data);
      showToast('Matière mise à jour avec succès', 'success');
    } else {
      await matieresAPI.create(data);
      showToast('Matière ajoutée avec succès', 'success');
    }
    closeModal('modalMatiere');
    loadMatieres();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function confirmDeleteMatiere(id, intitule) {
  showConfirmModal('Supprimer cette matière ?', `Êtes-vous sûr de vouloir supprimer "${intitule}" ? (Refusé si des notes sont liées).`, async () => {
    try {
      await matieresAPI.delete(id);
      showToast(`Matière "${intitule}" supprimée.`, 'success');
      loadMatieres();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

// ============================================================
// MODULE NOTES & SAISIE (Module 3)
// ============================================================

async function loadNotesPage() {
  await loadSelectOptions();
  await loadRecentNotesTable();
}

async function loadSelectOptions() {
  try {
    // 1. Charger les étudiants
    const resEtudiants = await etudiantsAPI.getAll();
    const etudiants = resEtudiants.data;

    const selectNoteEtudiant = document.getElementById('noteEtudiant');
    const selectResEtudiant = document.getElementById('resultatEtudiant');

    if (selectNoteEtudiant) {
      selectNoteEtudiant.innerHTML = '<option value="">— Choisir un étudiant —</option>' +
        etudiants.map(e => `<option value="${e.id}">${e.nom} ${e.prenom} (${e.classe})</option>`).join('');
    }

    if (selectResEtudiant) {
      selectResEtudiant.innerHTML = '<option value="">— Choisir un étudiant —</option>' +
        etudiants.map(e => `<option value="${e.id}">${e.nom} ${e.prenom} — ${e.classe}</option>`).join('');
    }

    // 2. Charger les matières autorisées pour cet utilisateur
    const user = appState.currentUser;
    let matieres = [];

    if (user && user.role === 'ENSEIGNANT') {
      // Pour l'enseignant : seulement ses matières attribuées !
      const resAff = await affectationsAPI.getAll();
      matieres = resAff.data;
    } else {
      const resMat = await matieresAPI.getAll();
      matieres = resMat.data;
    }

    const selectNoteMatiere = document.getElementById('noteMatiere');
    if (selectNoteMatiere) {
      if (matieres.length === 0 && user && user.role === 'ENSEIGNANT') {
        selectNoteMatiere.innerHTML = '<option value="">⚠️ Aucune matière ne vous est affectée</option>';
      } else {
        selectNoteMatiere.innerHTML = '<option value="">— Choisir une matière —</option>' +
          matieres.map(m => `<option value="${m.id}">${m.intitule} (Coeff. ${m.coefficient})</option>`).join('');
      }
    }
  } catch (error) {
    console.error('Erreur chargement sélecteurs:', error);
  }
}

async function loadRecentNotesTable() {
  const tbody = document.getElementById('tableNotesRecentesBody');
  if (!tbody) return;

  try {
    const res = await dashboardAPI.getAdvancedStats();
    const notes = res.data.recentNotes || res.data.dernieresNotes || [];

    if (notes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-dim);">Aucune note saisie récemment</td></tr>`;
      return;
    }

    tbody.innerHTML = notes.map(n => {
      const val = parseFloat(n.valeur);
      const noteClass = val >= 14 ? 'good' : (val >= 10 ? 'average' : 'poor');
      return `
        <tr>
          <td><strong>${escapeHtml(n.etudiant_nom || n.nom || '')} ${escapeHtml(n.etudiant_prenom || n.prenom || '')}</strong></td>
          <td>${escapeHtml(n.matiere_intitule || n.matiere || '')}</td>
          <td><span class="badge badge-type-${(n.type || '').toLowerCase()}">${n.type}</span></td>
          <td><span class="note-badge ${noteClass}">${val.toFixed(2)}/20</span></td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--danger);">Erreur chargement</td></tr>`;
  }
}

async function handleNoteSubmit(e) {
  e.preventDefault();
  const idEtudiant = parseInt(document.getElementById('noteEtudiant').value);
  const idMatiere = parseInt(document.getElementById('noteMatiere').value);
  const type = document.getElementById('noteType').value;
  const valeur = parseFloat(document.getElementById('noteValeur').value);

  if (!idEtudiant || !idMatiere || !type || isNaN(valeur)) {
    showToast('Veuillez remplir tous les champs obligatoires.', 'error');
    return;
  }

  if (valeur < 0 || valeur > 20) {
    showToast('La note doit être strictement comprise entre 0 et 20.', 'error');
    return;
  }

  try {
    await notesAPI.create({
      id_etudiant: idEtudiant,
      id_matiere: idMatiere,
      type,
      valeur
    });

    showToast('Note enregistrée avec succès dans la base MySQL ! ✅', 'success');
    document.getElementById('formNote').reset();
    await loadRecentNotesTable();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ============================================================
// MODULE RÉSULTATS & BULLETIN (SOA)
// ============================================================

async function loadResultatsPage() {
  await loadSelectOptions();
}

function consulterBulletinEtudiant(etudiantId) {
  navigateTo('resultats');
  const sel = document.getElementById('resultatEtudiant');
  if (sel) {
    sel.value = etudiantId;
    voirResultats();
  }
}

async function voirResultats() {
  const sel = document.getElementById('resultatEtudiant');
  const idEtudiant = sel ? sel.value : null;

  if (!idEtudiant) {
    showToast('Veuillez choisir un étudiant.', 'warning');
    return;
  }

  const container = document.getElementById('resultatContent');
  container.innerHTML = `<div class="loading"><div class="spinner"></div> Calcul officiel de la moyenne pondérée...</div>`;

  try {
    const res = await notesAPI.getMoyenne(idEtudiant);
    renderBulletin(res.data, container, false);
  } catch (error) {
    container.innerHTML = `<div class="empty-state"><div class="icon">❌</div><h3>Erreur</h3><p>${error.message}</p></div>`;
  }
}

// ============================================================
// ESPACE PERSONNEL ÉTUDIANT (BULLETIN & NOTES)
// ============================================================

async function loadMonEspaceEtudiant() {
  const container = document.getElementById('monEspaceEtudiantContent');
  container.innerHTML = `<div class="loading"><div class="spinner"></div> Chargement de votre bulletin officiel...</div>`;

  const user = appState.currentUser;
  if (!user || !user.etudiant_id) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">ℹ️</div>
        <h3>Dossier étudiant non rattaché</h3>
        <p>Votre compte n'est pas encore associé à un dossier étudiant. Contactez l'administrateur.</p>
      </div>
    `;
    return;
  }

  try {
    const res = await notesAPI.getMoyenne(user.etudiant_id);
    renderBulletin(res.data, container, true);
  } catch (error) {
    container.innerHTML = `<div class="empty-state"><div class="icon">❌</div><h3>Erreur</h3><p>${error.message}</p></div>`;
  }
}

/**
 * Rendu visuel d'un bulletin de notes officiel (avec export et impression)
 */
function renderBulletin(data, targetContainer, isStudentPersonalView = false) {
  if (!data.detailsMatieres || data.detailsMatieres.length === 0) {
    targetContainer.innerHTML = `
      <div class="empty-state">
        <div class="icon">📝</div>
        <h3>Aucune note enregistrée</h3>
        <p>Cet étudiant n'a pas encore d'évaluations enregistrées pour calculer une moyenne.</p>
      </div>
    `;
    return;
  }

  const isAdmis = data.statut === 'Admis';
  const statusClass = isAdmis ? 'admis' : 'ajourne';

  targetContainer.innerHTML = `
    <div class="bulletin-container">
      <div class="bulletin-header">
        <div class="bulletin-school-info">
          <h3>🏛️ UNIVERSITÉ — RELEVÉ DE NOTES OFFICIEL</h3>
          <p>Module : SOA & Services Web — Année Universitaire 2025/2026</p>
        </div>
        <div class="bulletin-student-badge">
          <div style="font-size: 1.1rem; font-weight: 800;">${escapeHtml(data.etudiant.nom)} ${escapeHtml(data.etudiant.prenom)}</div>
          <div style="color: var(--text-dim); font-size: 0.85rem;">Classe : <strong>${escapeHtml(data.etudiant.classe)}</strong> — ID : #${data.etudiant.id}</div>
        </div>
      </div>

      <!-- Synthese Moyenne -->
      <div class="moyenne-hero-display">
        <div>
          <div style="font-size: 0.85rem; text-transform: uppercase; font-weight: 700; color: var(--text-dim); letter-spacing: 0.1em;">Moyenne Générale Pondérée</div>
          <div class="moyenne-score ${statusClass}">
            ${data.moyenneGenerale !== null ? data.moyenneGenerale.toFixed(2) : '—'}<span style="font-size: 1.25rem; font-weight: 600; color: var(--text-dim);"> / 20</span>
          </div>
        </div>
        <div style="text-align: right;">
          <span class="badge ${isAdmis ? 'badge-admis' : 'badge-ajourne'}" style="font-size: 1rem; padding: 0.5rem 1.25rem;">
            ${isAdmis ? '✅ ADMIS' : '❌ AJOURNÉ'}
          </span>
          <div style="font-size: 0.95rem; font-weight: 700; margin-top: 0.5rem; color: var(--text-main);">
            Mention : <span style="color: var(--primary-light);">${data.appreciation}</span>
          </div>
        </div>
      </div>

      <!-- Table détail des matières -->
      <h4 style="margin-bottom: 1rem; font-size: 1.05rem;">📚 Détail des résultats par matière</h4>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Matière</th>
              <th>Coeff.</th>
              <th>Évaluations (DS 25%, Examen 60%, TP 15%)</th>
              <th style="text-align: right;">Note Finale</th>
            </tr>
          </thead>
          <tbody>
            ${data.detailsMatieres.map(m => {
              const val = m.noteFinale;
              const valClass = val >= 14 ? 'good' : (val >= 10 ? 'average' : 'poor');
              return `
                <tr>
                  <td><strong>${escapeHtml(m.matiere)}</strong></td>
                  <td><strong>${parseFloat(m.coefficient).toFixed(2)}</strong></td>
                  <td>
                    <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                      ${m.notes.map(n => `
                        <span class="badge badge-type-${(n.type || '').toLowerCase()}">
                          ${n.type} : ${parseFloat(n.valeur).toFixed(2)}
                        </span>
                      `).join('')}
                    </div>
                  </td>
                  <td style="text-align: right;">
                    <span class="note-badge ${valClass}" style="font-size: 1rem;">${val.toFixed(2)}/20</span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div class="avertissement" style="margin-top: 0; flex: 1;">
          ${data.avertissement || 'Pondérations et règles conformes au sujet du projet SOA'}
        </div>
        <button class="btn btn-primary" onclick="window.print()">
          🖨️ Imprimer le bulletin
        </button>
      </div>
    </div>
  `;
}

// ============================================================
// MODULE AFFECTATIONS ENSEIGNANTS <-> MATIÈRES (Admin)
// ============================================================

async function loadAffectations() {
  const tbody = document.getElementById('affectationsTableBody');
  tbody.innerHTML = `<tr><td colspan="5" class="loading"><div class="spinner"></div> Chargement des affectations...</td></tr>`;

  try {
    // 1. Charger la liste des affectations
    const resAff = await affectationsAPI.getAll();
    renderAffectations(resAff.data);

    // 2. Charger les listes déroulantes (Enseignants et Matières)
    const [resUsers, resMat] = await Promise.all([
      usersAPI.getAll(),
      matieresAPI.getAll()
    ]);

    const enseignants = resUsers.data.filter(u => u.role === 'ENSEIGNANT');
    const selectProf = document.getElementById('affEnseignant');
    const selectMat = document.getElementById('affMatiere');

    if (selectProf) {
      selectProf.innerHTML = '<option value="">— Choisir un enseignant —</option>' +
        enseignants.map(p => `<option value="${p.id}">${p.nom} ${p.prenom} (${p.email})</option>`).join('');
    }

    if (selectMat) {
      selectMat.innerHTML = '<option value="">— Choisir une matière —</option>' +
        resMat.data.map(m => `<option value="${m.id}">${m.intitule} (Coeff. ${m.coefficient})</option>`).join('');
    }
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="icon">❌</div><p>${error.message}</p></div></td></tr>`;
  }
}

function renderAffectations(list) {
  const tbody = document.getElementById('affectationsTableBody');
  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="icon">🔗</div><p>Aucune affectation active pour le moment.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(a => `
    <tr>
      <td><strong>${escapeHtml(a.enseignant_nom)} ${escapeHtml(a.enseignant_prenom)}</strong></td>
      <td style="color: var(--text-dim); font-size: 0.85rem;">${escapeHtml(a.enseignant_email)}</td>
      <td><span class="badge" style="background: var(--primary-bg); color: var(--primary-light);">📚 ${escapeHtml(a.matiere_intitule)}</span></td>
      <td><strong>Coeff. ${parseFloat(a.matiere_coefficient).toFixed(2)}</strong></td>
      <td>
        <button class="btn-icon delete" onclick="confirmDeleteAffectation(${a.id})" title="Retirer l'affectation">🗑️</button>
      </td>
    </tr>
  `).join('');
}

async function handleAffectationSubmit(e) {
  e.preventDefault();
  const enseignant_id = parseInt(document.getElementById('affEnseignant').value);
  const matiere_id = parseInt(document.getElementById('affMatiere').value);

  if (!enseignant_id || !matiere_id) {
    showToast('Veuillez sélectionner un enseignant et une matière.', 'error');
    return;
  }

  try {
    await affectationsAPI.create({ enseignant_id, matiere_id });
    showToast('Matière affectée à l\'enseignant avec succès !', 'success');
    document.getElementById('formAffectation').reset();
    loadAffectations();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function confirmDeleteAffectation(id) {
  showConfirmModal('Retirer cette affectation ?', 'L\'enseignant ne pourra plus saisir ni modifier de notes pour cette matière.', async () => {
    try {
      await affectationsAPI.delete(id);
      showToast('Affectation retirée.', 'success');
      loadAffectations();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

// ============================================================
// MODULE GESTION DES UTILISATEURS (Admin)
// ============================================================

async function loadUtilisateurs() {
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = `<tr><td colspan="7" class="loading"><div class="spinner"></div> Chargement des utilisateurs...</td></tr>`;

  try {
    const res = await usersAPI.getAll();
    renderUtilisateurs(res.data);
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="icon">❌</div><p>${error.message}</p></div></td></tr>`;
  }
}

function renderUtilisateurs(users) {
  const tbody = document.getElementById('usersTableBody');
  if (!users || users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="icon">👥</div><p>Aucun utilisateur trouvé.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => `
    <tr>
      <td><strong>#${u.id}</strong></td>
      <td><strong>${escapeHtml(u.nom)} ${escapeHtml(u.prenom)}</strong></td>
      <td style="color: var(--text-muted); font-size: 0.85rem;">${escapeHtml(u.email)}</td>
      <td><span class="user-role-badge role-${u.role.toLowerCase()}">${u.role}</span></td>
      <td>
        <label class="toggle-switch">
          <input type="checkbox" ${u.actif ? 'checked' : ''} onchange="toggleUserActive(${u.id}, this)">
          <span class="toggle-slider"></span>
        </label>
      </td>
      <td style="color: var(--text-dim); font-size: 0.8rem;">${new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
      <td>
        <div class="actions">
          <button class="btn-icon delete" onclick="confirmDeleteUser(${u.id}, '${escapeHtml(u.prenom)} ${escapeHtml(u.nom)}')" title="Supprimer le compte">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function toggleUserActive(id, checkbox) {
  try {
    const res = await usersAPI.toggleActif(id);
    showToast(res.data.message || 'Statut mis à jour', 'success');
  } catch (error) {
    checkbox.checked = !checkbox.checked; // Annuler visuellement
    showToast(error.message, 'error');
  }
}

function openAddUser() {
  document.getElementById('userId').value = '';
  document.getElementById('formUser').reset();
  document.getElementById('modalUserTitle').textContent = '➕ Créer un compte utilisateur';
  document.getElementById('groupUserPassword').style.display = 'block';
  openModal('modalUser');
}

async function handleUserSubmit(e) {
  e.preventDefault();
  const data = {
    nom: document.getElementById('userNom').value.trim(),
    prenom: document.getElementById('userPrenom').value.trim(),
    email: document.getElementById('userEmail').value.trim(),
    role: document.getElementById('userRole').value,
    password: document.getElementById('userPassword').value
  };

  try {
    await usersAPI.create(data);
    showToast('Compte créé avec succès !', 'success');
    closeModal('modalUser');
    loadUtilisateurs();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function confirmDeleteUser(id, name) {
  showConfirmModal('Supprimer ce compte ?', `Confirmez-vous la suppression du compte de "${name}" ?`, async () => {
    try {
      await usersAPI.delete(id);
      showToast(`Compte de "${name}" supprimé.`, 'success');
      loadUtilisateurs();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

// ============================================================
// MODULE PROFIL & SÉCURITÉ
// ============================================================

async function loadProfil() {
  try {
    const res = await authAPI.getProfile();
    const u = res.data;
    appState.currentUser = u;

    document.getElementById('profilNom').value = u.nom || '';
    document.getElementById('profilPrenom').value = u.prenom || '';
    document.getElementById('profilEmail').value = u.email || '';

    const roleBadge = document.getElementById('profilRoleBadge');
    roleBadge.textContent = u.role;
    roleBadge.className = `user-role-badge role-${u.role.toLowerCase()}`;
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function handleProfileSubmit(e) {
  e.preventDefault();
  const data = {
    nom: document.getElementById('profilNom').value.trim(),
    prenom: document.getElementById('profilPrenom').value.trim()
  };

  try {
    await authAPI.updateProfile(data);
    showToast('Vos informations ont été mises à jour ! ✅', 'success');
    configureUIForRole(appState.currentUser);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function handleChangePasswordSubmit(e) {
  e.preventDefault();
  const oldPassword = document.getElementById('pwdOld').value;
  const newPassword = document.getElementById('pwdNew').value;
  const confirm = document.getElementById('pwdConfirm').value;

  if (newPassword !== confirm) {
    showToast('La confirmation ne correspond pas au nouveau mot de passe.', 'error');
    return;
  }

  try {
    const res = await authAPI.changePassword(oldPassword, newPassword);
    showToast(res.message || 'Mot de passe modifié avec succès ! ✅', 'success');
    document.getElementById('formChangePassword').reset();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ============================================================
// AUTHENTIFICATION (LOGIN, REGISTER, LOGOUT)
// ============================================================

function fillQuickLogin(email, password) {
  document.getElementById('loginEmail').value = email;
  document.getElementById('loginPassword').value = password;
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btnSubmit = document.getElementById('btnLoginSubmit');

  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Connexion en cours...';

  try {
    const res = await authAPI.login(email, password);
    showToast(`Bienvenue, ${res.data.user.prenom} ! 👋`, 'success');
    appState.currentUser = res.data.user;

    document.getElementById('authWrapper').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';

    configureUIForRole(appState.currentUser);
    const startPage = res.data.user.role === 'ETUDIANT' ? 'espace-etudiant' : 'dashboard';
    navigateTo(startPage);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Se connecter';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const data = {
    nom: document.getElementById('regNom').value.trim(),
    prenom: document.getElementById('regPrenom').value.trim(),
    email: document.getElementById('regEmail').value.trim(),
    password: document.getElementById('regPassword').value,
    role: 'ETUDIANT'
  };

  try {
    const res = await authAPI.register(data);
    showToast('Compte étudiant créé avec succès ! Bienvenue 👋', 'success');
    appState.currentUser = res.data.user;

    document.getElementById('authWrapper').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';

    configureUIForRole(appState.currentUser);
    navigateTo('espace-etudiant');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function handleLogout() {
  await authAPI.logout();
  appState.currentUser = null;
  document.getElementById('appContainer').style.display = 'none';
  document.getElementById('authWrapper').style.display = 'flex';
  showToast('Vous avez été déconnecté.', 'info');
}

// ============================================================
// MODALES & CONFIRMATIONS
// ============================================================

function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('active');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('active');
}

function showConfirmModal(title, message, onConfirm) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = message;
  appState.pendingDeleteAction = onConfirm;
  openModal('modalConfirm');
}

// ============================================================
// NOTIFICATIONS TOAST
// ============================================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span style="font-size: 1.15rem;">${icons[type] || 'ℹ️'}</span>
    <span style="flex: 1; font-weight: 500;">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

// ============================================================
// THÈME & SIDEBAR MOBILE
// ============================================================

function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('app_theme', next);
  document.getElementById('btnThemeToggle').textContent = next === 'dark' ? '🌙' : '☀️';
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
}

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

// ============================================================
// INITIALISATION DE L'APPLICATION
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Appliquer le thème
  const savedTheme = localStorage.getItem('app_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.getElementById('btnThemeToggle').textContent = savedTheme === 'dark' ? '🌙' : '☀️';
  document.getElementById('btnThemeToggle').addEventListener('click', toggleTheme);

  // 2. Gestion des onglets Login / Register
  document.getElementById('tabLogin').addEventListener('click', () => {
    document.getElementById('formLogin').style.display = 'block';
    document.getElementById('formRegister').style.display = 'none';
    document.getElementById('tabLogin').style.background = 'var(--primary)';
    document.getElementById('tabLogin').style.color = '#fff';
    document.getElementById('tabRegister').style.background = 'transparent';
    document.getElementById('tabRegister').style.color = 'var(--text-muted)';
  });

  document.getElementById('tabRegister').addEventListener('click', () => {
    document.getElementById('formLogin').style.display = 'none';
    document.getElementById('formRegister').style.display = 'block';
    document.getElementById('tabRegister').style.background = 'var(--primary)';
    document.getElementById('tabRegister').style.color = '#fff';
    document.getElementById('tabLogin').style.background = 'transparent';
    document.getElementById('tabLogin').style.color = 'var(--text-muted)';
  });

  // Afficher / masquer mot de passe
  document.getElementById('toggleLoginPassword').addEventListener('click', () => {
    const input = document.getElementById('loginPassword');
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  // 3. Formulaires d'authentification
  document.getElementById('formLogin').addEventListener('submit', handleLogin);
  document.getElementById('formRegister').addEventListener('submit', handleRegister);

  // Déconnexion
  document.getElementById('btnSidebarLogout').addEventListener('click', handleLogout);
  document.getElementById('dropdownLogout').addEventListener('click', handleLogout);

  // 4. Menu Profil Topbar
  const profileTrigger = document.getElementById('btnProfileTrigger');
  const profileMenu = document.getElementById('profileDropdownMenu');
  profileTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    profileMenu.classList.toggle('active');
  });
  document.addEventListener('click', () => profileMenu.classList.remove('active'));

  // 5. Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.getAttribute('data-page');
      if (page) navigateTo(page);
    });
  });

  // 6. Mobile Sidebar
  document.getElementById('hamburgerBtn').addEventListener('click', openSidebar);

  // 7. Modales & Formulaires Métier
  document.getElementById('btnAddEtudiant').addEventListener('click', openAddEtudiant);
  document.getElementById('closeModalEtudiant').addEventListener('click', () => closeModal('modalEtudiant'));
  document.getElementById('cancelEtudiant').addEventListener('click', () => closeModal('modalEtudiant'));
  document.getElementById('formEtudiant').addEventListener('submit', handleEtudiantSubmit);

  document.getElementById('btnAddMatiere').addEventListener('click', openAddMatiere);
  document.getElementById('closeModalMatiere').addEventListener('click', () => closeModal('modalMatiere'));
  document.getElementById('cancelMatiere').addEventListener('click', () => closeModal('modalMatiere'));
  document.getElementById('formMatiere').addEventListener('submit', handleMatiereSubmit);

  const btnAddUser = document.getElementById('btnAddUser');
  if (btnAddUser) btnAddUser.addEventListener('click', openAddUser);
  document.getElementById('closeModalUser').addEventListener('click', () => closeModal('modalUser'));
  document.getElementById('cancelUser').addEventListener('click', () => closeModal('modalUser'));
  document.getElementById('formUser').addEventListener('submit', handleUserSubmit);

  // Saisie Note & Affectation
  document.getElementById('formNote').addEventListener('submit', handleNoteSubmit);
  const formAffectation = document.getElementById('formAffectation');
  if (formAffectation) formAffectation.addEventListener('submit', handleAffectationSubmit);

  // Profil & Password
  document.getElementById('formMonProfil').addEventListener('submit', handleProfileSubmit);
  document.getElementById('formChangePassword').addEventListener('submit', handleChangePasswordSubmit);

  // Recherche & Filtres
  document.getElementById('searchEtudiant').addEventListener('input', filterEtudiants);
  document.getElementById('filterClasseEtudiant').addEventListener('change', filterEtudiants);
  document.getElementById('btnVoirResultats').addEventListener('click', voirResultats);

  // Modal Confirmation
  document.getElementById('btnCancelConfirm').addEventListener('click', () => closeModal('modalConfirm'));
  document.getElementById('btnOkConfirm').addEventListener('click', async () => {
    if (appState.pendingDeleteAction) {
      await appState.pendingDeleteAction();
      appState.pendingDeleteAction = null;
    }
    closeModal('modalConfirm');
  });

  // Fermer les modales en cliquant sur l'overlay
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });

  // Événement session expirée
  window.addEventListener('auth:expired', () => {
    showToast('Votre session a expiré. Veuillez vous reconnecter.', 'warning');
    handleLogout();
  });

  // 8. Vérifier la session au démarrage
  if (authStorage.isAuthenticated()) {
    try {
      const res = await authAPI.getProfile();
      appState.currentUser = res.data;
      authStorage.setUser(res.data);

      document.getElementById('authWrapper').style.display = 'none';
      document.getElementById('appContainer').style.display = 'flex';

      configureUIForRole(appState.currentUser);
      const startPage = appState.currentUser.role === 'ETUDIANT' ? 'espace-etudiant' : 'dashboard';
      navigateTo(startPage);
    } catch {
      handleLogout();
    }
  } else {
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('authWrapper').style.display = 'flex';
  }

  // 9. Heartbeat de surveillance de l'état du serveur API
  function checkApiHealth() {
    dashboardAPI.getStats()
      .then(() => {
        const pill = document.getElementById('apiStatusPill');
        const text = document.getElementById('apiStatusText');
        if (pill) pill.classList.remove('offline');
        if (text) text.textContent = 'En ligne';
      })
      .catch(() => {
        const pill = document.getElementById('apiStatusPill');
        const text = document.getElementById('apiStatusText');
        if (pill) pill.classList.add('offline');
        if (text) text.textContent = 'Hors ligne';
      });
  }
  checkApiHealth();
  setInterval(checkApiHealth, 20000);
});
