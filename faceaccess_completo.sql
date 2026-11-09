-- =====================================================
-- FaceAccess - Base de datos completa (MySQL)
-- Parte 1: crear tablas | Parte 2: datos de prueba
-- =====================================================
DROP DATABASE IF EXISTS faceaccess;
CREATE DATABASE faceaccess CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE faceaccess;

-- Personal que inicia sesión (RF12, RF15)
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  usuario VARCHAR(50) NOT NULL UNIQUE,
  contrasena_hash VARCHAR(255) NOT NULL,
  rol ENUM('administrador','porteria') NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Estudiantes registrados (RF1, RF4, RF9)
CREATE TABLE estudiantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  documento VARCHAR(20) NOT NULL UNIQUE,
  codigo_qr VARCHAR(100) UNIQUE,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Rostro de cada estudiante (RF2, RF6)
CREATE TABLE rostros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT NOT NULL UNIQUE,
  descriptor TEXT NOT NULL,
  foto_ruta VARCHAR(255),
  fecha_captura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE
);

-- Consentimiento de uso de datos (RF3)
CREATE TABLE autorizaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT NOT NULL UNIQUE,
  aceptada BOOLEAN NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE
);

-- Historial de intentos de ingreso (RF8, RF13, RF14)
CREATE TABLE ingresos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT NULL,
  metodo ENUM('rostro','qr','documento') NOT NULL,
  resultado ENUM('permitido','denegado') NOT NULL,
  fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE SET NULL
);

-- ================== DATOS DE PRUEBA ==================
-- Contraseñas: admin / admin123  y  porteria / porteria123
INSERT INTO usuarios (nombre, usuario, contrasena_hash, rol) VALUES
('Administrador Prueba', 'admin', '$2b$10$eXV5ejf3YZNsyN8gpwM2i.I/yeuMuizzg1RILxCYFaZUZV.NPKNna', 'administrador'),
('Portero Prueba', 'porteria', '$2b$10$TwIIdhLGeutqcUAxDA8tSejG1.ifAh.sNkqDEdbWUVameCgT0Rl9W', 'porteria');

INSERT INTO estudiantes (nombre, documento, codigo_qr) VALUES
('Mariana Gutiérrez Calle', '1054864691', 'QR-0001'),
('Alejandro Castro Romero', '1056123361', 'QR-0002'),
('Daniel Yepes Carvajal', '1055752134', 'QR-0003'),
('Maria Paula Agudelo Ceballos', '1058138331', 'QR-0004');

INSERT INTO autorizaciones (estudiante_id, aceptada) VALUES
(1, TRUE), (2, TRUE), (3, TRUE), (4, TRUE);

INSERT INTO ingresos (estudiante_id, metodo, resultado, fecha_hora) VALUES
(1, 'rostro',    'permitido', '2026-11-09 07:30:00'),
(2, 'rostro',    'permitido', '2026-11-09 07:45:00'),
(NULL, 'rostro', 'denegado',  '2026-11-09 08:00:00'),
(3, 'qr',        'permitido', '2026-11-09 08:10:00'),
(4, 'documento', 'permitido', '2026-11-10 07:20:00'),
(1, 'rostro',    'permitido', '2026-11-10 07:35:00');

-- Verificación
SHOW TABLES;
SELECT e.nombre, i.metodo, i.resultado, i.fecha_hora
FROM ingresos i LEFT JOIN estudiantes e ON e.id = i.estudiante_id
ORDER BY i.fecha_hora;
