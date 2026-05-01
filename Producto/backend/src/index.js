const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const db = require('./config/db');

const app = express();
const PORT = 3000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

const usuarioRoutes = require('./routes/usuarioRoutes');
const authRoutes = require('./routes/authRoutes');
const cursoRoutes = require('./routes/cursoRoutes');
const alumnoRoutes = require('./routes/alumnoRoutes');
const asistenciaRoutes = require('./routes/asistenciaRoutes');
const calificacionRoutes = require('./routes/calificacionRoutes');
const muroAvisosRoutes = require('./routes/muroAvisosRoutes');
const horarioRoutes = require('./routes/horarioRoutes');
const evaluacionRoutes  = require('./routes/evaluacionRoutes');
const anotacionRoutes   = require('./routes/anotacionRoutes');

app.get('/', (req, res) => {
  res.json({ mensaje: 'API de EduSync funcionando en el puerto 3000' });
});

app.use('/api/usuarios', usuarioRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cursos', cursoRoutes);
app.use('/api/alumnos', alumnoRoutes);
app.use('/api/asistencia', asistenciaRoutes);
app.use('/api/notas', calificacionRoutes);
app.use('/api/avisos', muroAvisosRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/evaluaciones',  evaluacionRoutes);
app.use('/api/anotaciones',   anotacionRoutes);

// Middleware de manejo de errores (siempre al final)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  }
});

// Adjuntar io a app para acceso en rutas/controladores
app.set('io', io);

io.on('connection', (socket) => {
  console.log('📡 Usuario conectado al sistema Real-Time:', socket.id);
  socket.on('disconnect', () => {
    console.log('🔌 Usuario desconectado');
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor EduSync (Express + Socket.io) corriendo en http://localhost:${PORT}`);
});

module.exports = { app, db, io };
