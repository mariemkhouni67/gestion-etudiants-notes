

require('dotenv').config();

const app = require('./src/app');
const { testConnection } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

async function startServer() {
  console.log('');
  console.log('🎓 ═══════════════════════════════════════════════');
  console.log('   Gestion des Étudiants et des Notes');
  console.log('   Projet SOA et Services Web');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // Tester la connexion à MySQL
  const dbConnected = await testConnection();

  if (!dbConnected) {
    console.log('');
    console.log('⚠️  Le serveur va démarrer mais la base de données n\'est pas disponible.');
    console.log('💡 Étapes pour résoudre :');
    console.log('   1. Lance MySQL (XAMPP, WAMP, ou MySQL Server)');
    console.log('   2. Exécute le script database/schema.sql');
    console.log('   3. Vérifie le fichier .env');
    console.log('   4. Redémarre le serveur');
    console.log('');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
    console.log(`📡 API disponible sur http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend disponible sur http://localhost:${PORT}`);
    console.log('');
    console.log('Endpoints disponibles :');
    console.log('  🔐 POST   /api/auth/login');
    console.log('  📝 POST   /api/auth/register');
    console.log('  👤 GET    /api/auth/me');
    console.log('  👥 GET    /api/users (Admin)');
    console.log('  🔗 GET    /api/affectations');
    console.log('  📋 GET    /api/etudiants');
    console.log('  ➕ POST   /api/etudiants');
    console.log('  📋 GET    /api/matieres');
    console.log('  ➕ POST   /api/matieres');
    console.log('  ➕ POST   /api/notes');
    console.log('  📋 GET    /api/etudiants/:id/notes');
    console.log('  📊 GET    /api/etudiants/:id/moyenne');
    console.log('  📈 GET    /api/dashboard/stats');
    console.log('💡 Astuce : Exécutez "npm run init-db" pour initialiser automatiquement MySQL.');

    // Ouverture automatique du navigateur
    if (process.env.NODE_ENV !== 'test') {
      const { exec } = require('child_process');
      const url = `http://localhost:${PORT}`;
      const startCmd = process.platform === 'win32' ? `start ${url}` : (process.platform === 'darwin' ? `open ${url}` : `xdg-open ${url}`);
      exec(startCmd, () => {
        console.log(`🌐 Ouverture automatique du navigateur sur ${url}...`);
      });
    }
  });
}

startServer();
