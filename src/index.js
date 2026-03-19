const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const db = require('./config/db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const usuarioRoutes = require('./routes/usuarioRoutes');
const authRoutes = require('./routes/authRoutes');

app.get('/', (req, res) => {
  res.json({ mensaje: 'API de EduSync funcionando en el puerto 3000' });
});

app.use('/api/usuarios', usuarioRoutes);
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = { app, db };
