/**
 * Module API — Communication avec le backend REST & Sécurité JWT
 * 
 * Ce fichier centralise tous les appels HTTP vers l'API Express.
 * Il injecte automatiquement le jeton d'authentification Bearer.
 */

const API_BASE = '/api';

// ============================================================
// GESTION DU TOKEN ET DE LA SESSION LOCALE
// ============================================================

const authStorage = {
  getToken: () => localStorage.getItem('auth_token'),
  setToken: (token) => localStorage.setItem('auth_token', token),
  removeToken: () => localStorage.removeItem('auth_token'),

  getUser: () => {
    try {
      const u = localStorage.getItem('auth_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem('auth_user', JSON.stringify(user)),
  removeUser: () => localStorage.removeItem('auth_user'),

  clear: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  isAuthenticated: () => !!localStorage.getItem('auth_token'),
  getUserRole: () => {
    const user = authStorage.getUser();
    return user ? user.role : null;
  }
};

/**
 * Fonction générique pour effectuer des requêtes API sécurisées
 */
async function apiRequest(url, options = {}) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Injection automatique du token Bearer
    const token = authStorage.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers
    });

    // Si la session a expiré (401), déconnecter et rediriger
    if (response.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/register')) {
      authStorage.clear();
      window.dispatchEvent(new CustomEvent('auth:expired'));
      throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      let errorMessage = data.message || `Erreur serveur (HTTP ${response.status})`;
      if (data.errors && data.errors.length > 0) {
        errorMessage = data.errors.map(e => e.message).join('. ');
      }
      const err = new Error(errorMessage);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error('Connexion au serveur impossible. Assurez-vous que le backend Express est en cours d\'exécution.');
    }
    throw error;
  }
}

// ============================================================
// API AUTHENTIFICATION
// ============================================================
const authAPI = {
  login: async (email, password) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.success && res.data) {
      authStorage.setToken(res.data.token);
      authStorage.setUser(res.data.user);
    }
    return res;
  },

  register: async (userData) => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    if (res.success && res.data) {
      authStorage.setToken(res.data.token);
      authStorage.setUser(res.data.user);
    }
    return res;
  },

  getProfile: () => apiRequest('/auth/me'),

  updateProfile: async (data) => {
    const res = await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (res.success && res.data) {
      const current = authStorage.getUser() || {};
      authStorage.setUser({ ...current, ...res.data });
    }
    return res;
  },

  changePassword: (oldPassword, newPassword) => apiRequest('/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify({ oldPassword, newPassword })
  }),

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // Nettoyage local même si l'appel échoue
    } finally {
      authStorage.clear();
    }
  }
};

// ============================================================
// API ÉTUDIANTS (Module 1)
// ============================================================
const etudiantsAPI = {
  getAll: () => apiRequest('/etudiants'),
  getById: (id) => apiRequest(`/etudiants/${id}`),
  create: (data) => apiRequest('/etudiants', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiRequest(`/etudiants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiRequest(`/etudiants/${id}`, {
    method: 'DELETE'
  })
};

// ============================================================
// API MATIÈRES (Module 2)
// ============================================================
const matieresAPI = {
  getAll: () => apiRequest('/matieres'),
  getById: (id) => apiRequest(`/matieres/${id}`),
  create: (data) => apiRequest('/matieres', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiRequest(`/matieres/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiRequest(`/matieres/${id}`, {
    method: 'DELETE'
  })
};

// ============================================================
// API NOTES & MOYENNES (Module 3)
// ============================================================
const notesAPI = {
  create: (data) => apiRequest('/notes', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getById: (id) => apiRequest(`/notes/${id}`),
  update: (id, data) => apiRequest(`/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiRequest(`/notes/${id}`, {
    method: 'DELETE'
  }),
  getByEtudiant: (id) => apiRequest(`/etudiants/${id}/notes`),
  getByMatiere: (id) => apiRequest(`/matieres/${id}/notes`),
  getMoyenne: (id) => apiRequest(`/etudiants/${id}/moyenne`)
};

// ============================================================
// API UTILISATEURS (Administration RBAC)
// ============================================================
const usersAPI = {
  getAll: () => apiRequest('/users'),
  getById: (id) => apiRequest(`/users/${id}`),
  create: (data) => apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  toggleActif: (id) => apiRequest(`/users/${id}/toggle-actif`, {
    method: 'PATCH'
  }),
  delete: (id) => apiRequest(`/users/${id}`, {
    method: 'DELETE'
  })
};

// ============================================================
// API AFFECTATIONS ENSEIGNANTS-MATIERES
// ============================================================
const affectationsAPI = {
  getAll: () => apiRequest('/affectations'),
  create: (data) => apiRequest('/affectations', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiRequest(`/affectations/${id}`, {
    method: 'DELETE'
  })
};

// ============================================================
// API DASHBOARD & STATISTIQUES EN TEMPS RÉEL
// ============================================================
const dashboardAPI = {
  getStats: () => apiRequest('/dashboard'),
  getAdvancedStats: () => apiRequest('/dashboard/stats')
};
