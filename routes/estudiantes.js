// SCRUM-11 registrar, SCRUM-13 autorización, SCRUM-12 foto,
// SCRUM-14 editar, SCRUM-36 eliminar, SCRUM-29 protección
const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const db = require('../db');
const { requireLogin, requireAdmin } = require('../middleware/auth');

// SCRUM-29: todo lo que está debajo exige sesión iniciada y rol administrador
router.use(requireLogin);
router.use(requireAdmin);

const RAIZ = path.join(__dirname, '..');

// Listar estudiantes
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.id, e.nombre, e.documento, e.fecha_registro, (r.id IS NOT NULL) AS tiene_foto
       FROM estudiantes e LEFT JOIN rostros r ON r.estudiante_id = e.id
       ORDER BY e.id DESC`);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Ver la foto de un estudiante (solo con sesión; las fotos no son públicas)
router.get('/:id/foto', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT foto_ruta FROM rostros WHERE estudiante_id = ?', [req.params.id]);
    if (!rows[0] || !rows[0].foto_ruta) return res.status(404).end();
    res.sendFile(path.resolve(RAIZ, rows[0].foto_ruta));
  } catch (e) {
    res.status(500).end();
  }
});

// SCRUM-11 + SCRUM-13 + SCRUM-12: registrar estudiante con autorización y foto
router.post('/', async (req, res) => {
  const { nombre, documento, autorizacion, foto } = req.body || {};

  if (!nombre || !documento) {
    return res.status(400).json({ error: 'Complete todos los campos obligatorios' });
  }
  if (!autorizacion) {   // SCRUM-13: sin autorización no se registra
    return res.status(400).json({ error: 'Debe aceptar el uso de datos para continuar' });
  }
  if (typeof foto !== 'string' || !foto.startsWith('data:image/jpeg;base64,')) {   // SCRUM-12
    return res.status(400).json({ error: 'Debe tomar la foto del rostro' });
  }

  const conn = await db.getConnection();
  let rutaArchivo = null;
  try {
    // Transacción: se guarda todo junto o no se guarda nada
    await conn.beginTransaction();

    const [r] = await conn.query(
      'INSERT INTO estudiantes (nombre, documento, codigo_qr) VALUES (?, ?, ?)',
      [nombre.trim(), documento.trim(), 'QR-' + documento.trim()]);
    const id = r.insertId;

    await conn.query(
      'INSERT INTO autorizaciones (estudiante_id, aceptada) VALUES (?, TRUE)', [id]);

    const base64 = foto.replace(/^data:image\/jpeg;base64,/, '');
    const rutaRelativa = 'uploads/' + id + '.jpg';
    rutaArchivo = path.join(RAIZ, rutaRelativa);
    fs.writeFileSync(rutaArchivo, Buffer.from(base64, 'base64'));

    await conn.query(
      'INSERT INTO rostros (estudiante_id, foto_ruta) VALUES (?, ?)', [id, rutaRelativa]);

    await conn.commit();
    res.status(201).json({ ok: true, id });
  } catch (e) {
    await conn.rollback();
    if (rutaArchivo && fs.existsSync(rutaArchivo)) fs.unlinkSync(rutaArchivo);
    if (e.code === 'ER_DUP_ENTRY') {   // documento repetido (UNIQUE en la base de datos)
      return res.status(409).json({ error: 'El estudiante ya está registrado' });
    }
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    conn.release();
  }
});

// SCRUM-14: editar estudiante
router.put('/:id', async (req, res) => {
  const { nombre, documento } = req.body || {};
  if (!nombre || !documento) {
    return res.status(400).json({ error: 'Complete todos los campos obligatorios' });
  }
  try {
    const [r] = await db.query(
      'UPDATE estudiantes SET nombre = ?, documento = ? WHERE id = ?',
      [nombre.trim(), documento.trim(), req.params.id]);
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un estudiante con ese documento' });
    }
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// SCRUM-36: eliminar estudiante (se borran también su rostro y autorización por ON DELETE CASCADE)
router.delete('/:id', async (req, res) => {
  try {
    const [fotos] = await db.query(
      'SELECT foto_ruta FROM rostros WHERE estudiante_id = ?', [req.params.id]);
    const [r] = await db.query('DELETE FROM estudiantes WHERE id = ?', [req.params.id]);
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    // Se borra también el archivo de la foto
    if (fotos[0] && fotos[0].foto_ruta) {
      const archivo = path.join(RAIZ, fotos[0].foto_ruta);
      if (fs.existsSync(archivo)) fs.unlinkSync(archivo);
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
