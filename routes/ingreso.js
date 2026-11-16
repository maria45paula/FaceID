const router = require('express').Router();
const db = require('../db');

// Distancia máxima para aceptar un rostro. Más bajo = más estricto; más alto = deja pasar a más gente.
// 0.6 es el valor típico de face-api; ajústenlo probando con ustedes mismos.
const UMBRAL = 0.6;

// Distancia euclidiana entre dos descriptores de 128 números
function distancia(a, b) {
  let suma = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    suma += d * d;
  }
  return Math.sqrt(suma);
}

function descriptorValido(d) {
  return Array.isArray(d) && d.length === 128 &&
         d.every(n => typeof n === 'number' && Number.isFinite(n));
}

router.post('/verificar', async (req, res) => {
  const { descriptor } = req.body || {};
  if (!descriptorValido(descriptor)) {
    return res.status(400).json({ error: 'No se recibió un rostro válido' });
  }

  try {
    // Solo estudiantes activos que tengan descriptor guardado
    const [filas] = await db.query(
      `SELECT e.id, e.nombre, r.descriptor
       FROM rostros r JOIN estudiantes e ON e.id = r.estudiante_id
       WHERE r.descriptor IS NOT NULL AND e.activo = TRUE`);

    // Se busca el rostro registrado más parecido
    let mejor = null;
    let mejorDistancia = Infinity;
    for (const fila of filas) {
      let guardado;
      try { guardado = JSON.parse(fila.descriptor); } catch (e) { continue; }
      if (!descriptorValido(guardado)) continue;
      const d = distancia(descriptor, guardado);
      if (d < mejorDistancia) { mejorDistancia = d; mejor = fila; }
    }

    const permitido = mejor !== null && mejorDistancia < UMBRAL;
    const resultado = permitido ? 'permitido' : 'denegado';
    const estudianteId = permitido ? mejor.id : null;   // NULL si no se reconoció

    // Sirve para ajustar el umbral mientras prueban
    console.log('Verificación:', resultado, '| distancia:', mejorDistancia.toFixed(3));

    // SCRUM-18: guardar el intento (también los denegados)
    try {
      await db.query(
        'INSERT INTO ingresos (estudiante_id, metodo, resultado) VALUES (?, ?, ?)',
        [estudianteId, 'rostro', resultado]);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'No se pudo guardar el intento. Intente de nuevo' });
    }

    res.json({ resultado, nombre: permitido ? mejor.nombre : null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;