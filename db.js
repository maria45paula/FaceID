// Conexión a MySQL (SCRUM-22, SCRUM-11...). Cambien TU_CLAVE por la clave de su MySQL.
const mysql = require('mysql2/promise');

module.exports = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'TU_CLAVE',
  database: 'faceaccess',
  waitForConnections: true,
  connectionLimit: 10
});
