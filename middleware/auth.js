// SCRUM-29: protección de datos. Estas funciones bloquean el acceso sin sesión o sin permiso.
function requireLogin(req, res, next) {
  if (!req.session.usuario) {
    return res.status(401).json({ error: 'Debe iniciar sesión' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (req.session.usuario.rol !== 'administrador') {
    return res.status(403).json({ error: 'No tiene permisos para esta acción' });
  }
  next();
}

module.exports = { requireLogin, requireAdmin };
