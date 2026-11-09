// SCRUM-22 (iniciar sesión) y SCRUM-25 (cerrar sesión)
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

// Iniciar sesión
router.post('/login', async (req, res) => {
  const { usuario, contrasena } = req.body || {};
  if (!usuario || !contrasena) {
    return res.status(400).json({ error: 'Complete usuario y contraseña' });
  }
  try {
    // Los "?" evitan la inyección SQL
    const [rows] = await db.query(
      'SELECT * FROM usuarios WHERE usuario = ? AND activo = TRUE', [usuario]);
    const u = rows[0];
    // Se compara con el hash guardado: la contraseña nunca está en texto plano
    if (!u || !bcrypt.compareSync(contrasena, u.contrasena_hash)) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    req.session.usuario = { id: u.id, nombre: u.nombre, rol: u.rol };
    res.json({ ok: true, nombre: u.nombre, rol: u.rol });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Cerrar sesión
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// Saber si hay sesión activa (lo usa el panel para redirigir al login)
router.get('/me', (req, res) => {
  if (!req.session.usuario) {
    return res.status(401).json({ error: 'Debe iniciar sesión' });
  }
  res.json(req.session.usuario);
});

module.exports = router;
