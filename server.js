// Servidor principal de FaceAccess
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();

// Carpeta de fotos: está FUERA de "public", así nadie las abre escribiendo la URL (SCRUM-29)
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

app.use(express.json({ limit: '5mb' }));   // la foto viaja como texto base64
app.use(session({
  secret: 'cambien-esta-frase-secreta',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 30 }   // la sesión dura 30 minutos
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/estudiantes', require('./routes/estudiantes'));

app.listen(3000, () => console.log('FaceAccess en http://localhost:3000/login.html'));
