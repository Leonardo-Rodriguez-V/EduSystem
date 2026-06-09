const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(new Error('CORS no permitido'));
    }
  },
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
const auraRoutes        = require('./routes/auraRoutes');
const reporteRoutes     = require('./routes/reporteRoutes');
const contactoRoutes    = require('./routes/contactoRoutes');
const colegioRoutes     = require('./routes/colegioRoutes');
const importRoutes      = require('./routes/importRoutes');
const pagoRoutes        = require('./routes/pagoRoutes');

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
app.use('/api/aura',          auraRoutes);
app.use('/api/reportes',      reporteRoutes);
app.use('/api/contacto',      contactoRoutes);
app.use('/api/colegios',      colegioRoutes);
app.use('/api/colegios/:id',  importRoutes);
app.use('/api/pagos',         pagoRoutes);

// Middleware de manejo de errores (siempre al final)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer, {
  cors: {
    origin: allowedOrigins,
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

// Migración: asegurar que el rol 'alumno' esté permitido en la tabla usuarios
async function ensureRolAlumno() {
  try {
    // Elimina el constraint existente (si lo hay) y lo recrea incluyendo 'alumno'
    await db.query(`
      ALTER TABLE usuarios
        DROP CONSTRAINT IF EXISTS usuarios_rol_check,
        DROP CONSTRAINT IF EXISTS users_rol_check;
    `);
    await db.query(`
      ALTER TABLE usuarios
        ADD CONSTRAINT usuarios_rol_check
        CHECK (rol IN ('director','profesor','apoderado','superadmin','alumno'));
    `);
    console.log('✅ Constraint usuarios_rol_check actualizado (incluye alumno)');
  } catch (err) {
    console.error('[MIGRACIÓN] Error al actualizar constraint rol:', err.message);
  }
}
ensureRolAlumno();

httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor EduSync (Express + Socket.io) corriendo en http://localhost:${PORT}`);
});

module.exports = { app, db, io };
