/**
 * Middleware de gestion centralisée des erreurs
 * 
 * Toutes les erreurs passent par ici pour une réponse uniforme.
 * 
 * بالتونسي: هذا الفايل يمسك كل الأخطاء ويرد رسالة واضحة للمستخدم
 * بدل ما يظهر خطأ مش مفهوم
 */

function errorHandler(err, req, res, next) {
  // Log de l'erreur pour le développeur
  console.error('❌ Erreur:', err.message);
  
  // Déterminer le code HTTP
  const status = err.status || 500;
  
  // Message pour le client
  const response = {
    success: false,
    message: err.message || 'Erreur interne du serveur'
  };

  // En mode développement, ajouter les détails de l'erreur
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  // Cas spécial : erreur MySQL de clé étrangère (RESTRICT)
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    response.message = 'Impossible de supprimer cet élément car il est référencé par d\'autres données';
    return res.status(409).json(response);
  }

  // Cas spécial : email en double côté MySQL
  if (err.code === 'ER_DUP_ENTRY') {
    response.message = 'Cette valeur existe déjà (doublon détecté)';
    return res.status(409).json(response);
  }

  res.status(status).json(response);
}

module.exports = errorHandler;
