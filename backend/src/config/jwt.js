/**
 * Configuration JWT (JSON Web Tokens)
 */

require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'secret_key_gestion_notes_soa_fallback_2026',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h'
};
