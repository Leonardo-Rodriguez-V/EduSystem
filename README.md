# EduSync — Sistema de Gestión Educativa

Plataforma SaaS multi-tenant para colegios chilenos. Conecta superadministradores, directores, profesores, apoderados y alumnos en un solo sistema. Incluye gestión académica completa, comunicación en tiempo real y un asistente de inteligencia artificial integrado.

---

## Demo

| Servicio | URL |
|----------|-----|
| Frontend | https://edu-system-r3bw.vercel.app |
| Backend  | https://edusystem-production-b7f3.up.railway.app |

---

## Funcionalidades por rol

| Módulo               | Superadmin | Director | Profesor | Apoderado | Alumno |
|----------------------|:----------:|:--------:|:--------:|:---------:|:------:|
| Panel de colegios    | ✅         | —        | —        | —         | —      |
| Dashboard            | —          | ✅       | ✅       | ✅        | ✅     |
| Gestión de usuarios  | —          | ✅       | —        | —         | —      |
| Gestión de alumnos   | —          | ✅       | —        | —         | —      |
| Libro de notas       | —          | ✅       | ✅       | 👁️ lectura | 👁️ lectura |
| Asistencia           | —          | ✅       | ✅       | —         | —      |
| Informe de curso     | —          | ✅       | ✅       | —         | —      |
| Horarios             | —          | ✅       | ✅       | ✅        | ✅     |
| Calendario escolar   | —          | ✅       | ✅       | ✅        | ✅     |
| Muro de avisos       | —          | ✅       | ✅       | ✅        | —      |
| Libro de anotaciones | —          | ✅       | ✅       | 👁️ lectura | —      |
| Perfil del hijo      | —          | —        | —        | ✅        | —      |
| AURA (IA)            | —          | ✅       | ✅       | ✅        | ✅     |

---

## Características destacadas

- **Arquitectura multi-tenant** — Cada colegio tiene sus propios usuarios, alumnos y cursos completamente aislados. El `colegio_id` viaja en el JWT y se aplica automáticamente a todas las consultas.
- **Panel Superadmin** — Gestión centralizada de todos los colegios: crear, editar, activar/desactivar, asignar plan (básico/profesional/enterprise) con fecha de vencimiento, crear o editar el director directamente desde el panel, exportar CSV.
- **AURA** — Asistente de IA contextual por rol. Usa datos reales de la base de datos: el director ve estadísticas globales, el profesor sus cursos, el apoderado sus hijos.
- **Notificaciones en tiempo real** vía Socket.IO con toasts animados y campana de notificaciones.
- **Contacto por email** — Formulario de la landing page envía correos transaccionales con Resend.
- **Recuperación de contraseña** — Flujo completo de reset via enlace por correo.
- **Modo oscuro / claro** persistente en `localStorage`.
- **Responsive** — Sidebar overlay para móvil, diseño adaptativo completo.
- **Exportar reportes** — Generación de PDF (pdfkit) y Word (docx) desde el backend.

---

## Stack tecnológico

### Frontend

| Tecnología        | Uso                           |
|-------------------|-------------------------------|
| React 19 + Vite 8 | Framework y bundler           |
| React Router v7   | Navegación SPA                |
| Framer Motion     | Animaciones de página y UI    |
| Recharts          | Gráficos estadísticos         |
| Lucide React      | Iconografía                   |
| Socket.IO Client  | Notificaciones en tiempo real |

### Backend

| Tecnología  | Uso                                  |
|-------------|--------------------------------------|
| Node.js     | Entorno de ejecución                 |
| Express 5   | Framework HTTP                       |
| Socket.IO   | Comunicación en tiempo real          |
| PostgreSQL  | Base de datos relacional             |
| JWT         | Autenticación stateless multi-tenant |
| bcryptjs    | Hash de contraseñas                  |
| Resend      | Envío de emails transaccionales      |
| pdfkit      | Generación de reportes PDF           |
| docx        | Generación de reportes Word          |
| Groq API    | LLM para AURA (llama-3.3-70b)        |

### Infraestructura

| Servicio  | Rol                        |
|-----------|----------------------------|
| Vercel    | Frontend (SPA estático)    |
| Railway   | Backend (Express + WS)     |
| Supabase  | Hosting de PostgreSQL      |

---

## Estructura del repositorio

```
EduSystem/
├── Producto/
│   ├── frontend/
│   │   └── src/
│   │       ├── components/        # Layout, Sidebar, Topbar, AuraPanel, AuraOrb…
│   │       ├── pages/             # Dashboard, Notas, Asistencia, SuperAdminPanel…
│   │       ├── hooks/             # useAura, useIsMobile, useScrollReveal
│   │       └── context/           # NotificationContext (Socket.IO)
│   └── backend/
│       └── src/
│           ├── controllers/       # auth, usuarios, alumnos, cursos, colegios, aura…
│           ├── routes/            # Rutas REST por recurso
│           ├── middleware/        # verificarToken, verificarRol, verificarTenant
│           ├── services/          # emailService (Resend)
│           └── config/            # DB pool, scripts de seeds
├── Gestion/                       # Documentación de gestión del proyecto
├── Documentacion/                 # Documentación técnica
└── vercel.json                    # Config de build raíz
```

---

## Roles del sistema

| Rol          | Descripción                                                                 |
|--------------|-----------------------------------------------------------------------------|
| `superadmin` | Acceso global. Gestiona todos los colegios, planes y directores.            |
| `director`   | Acceso total dentro de su colegio. Gestiona usuarios, alumnos y cursos.     |
| `profesor`   | Ve solo sus cursos asignados. Toma asistencia, pone notas y anotaciones.    |
| `apoderado`  | Ve el perfil, notas y asistencia de sus hijos vinculados.                   |
| `alumno`     | Ve sus propias notas, horarios y calendario.                                |

---

## API — Endpoints principales

| Método | Ruta                    | Acceso       | Descripción                         |
|--------|-------------------------|--------------|-------------------------------------|
| POST   | `/api/auth/login`       | Público      | Login y obtención de JWT            |
| POST   | `/api/auth/forgot`      | Público      | Solicitar reset de contraseña       |
| POST   | `/api/auth/reset`       | Público      | Confirmar nueva contraseña          |
| POST   | `/api/contacto`         | Público      | Formulario de contacto (email)      |
| GET    | `/api/colegios`         | superadmin   | Listar todos los colegios           |
| POST   | `/api/colegios`         | superadmin   | Crear colegio (+ director opcional) |
| PUT    | `/api/colegios/:id`     | superadmin   | Editar colegio y/o su director      |
| DELETE | `/api/colegios/:id`     | superadmin   | Desactivar colegio                  |
| GET    | `/api/usuarios`         | director+    | Usuarios del colegio autenticado    |
| GET    | `/api/alumnos`          | director+    | Alumnos del colegio autenticado     |
| GET    | `/api/notas`            | todos        | Calificaciones (filtradas por rol)  |
| GET    | `/api/asistencia`       | director+    | Registros de asistencia             |
| GET    | `/api/horarios`         | todos        | Horario del colegio                 |
| GET    | `/api/avisos`           | todos        | Muro de avisos                      |
| GET    | `/api/anotaciones`      | todos        | Libro de anotaciones                |
| POST   | `/api/aura`             | todos        | Chat con asistente IA               |
| GET    | `/api/reportes/pdf`     | director+    | Exportar reporte en PDF             |

---

## Instalación local

### Requisitos
- Node.js 18+
- PostgreSQL (o cuenta Supabase)

### Backend

```bash
cd Producto/backend
npm install
```

Crea `.env`:

```env
PORT=3000
DATABASE_URL=postgresql://usuario:password@host:5432/db
JWT_SECRET=tu_clave_secreta
JWT_EXPIRES_IN=8h
GROQ_API_KEY=tu_clave_groq
RESEND_API_KEY=tu_clave_resend
EMAIL_FROM=onboarding@resend.dev
CORS_ORIGIN=http://localhost:5173
```

```bash
npm run dev
```

### Frontend

```bash
cd Producto/frontend
npm install
```

Crea `.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

```bash
npm run dev
```

---

## Variables de entorno en producción

### Railway (Backend)

| Variable        | Descripción                                      |
|-----------------|--------------------------------------------------|
| `DATABASE_URL`  | Cadena de conexión PostgreSQL                    |
| `JWT_SECRET`    | Clave secreta para firmar tokens JWT             |
| `JWT_EXPIRES_IN`| Duración del token (ej: `8h`)                    |
| `GROQ_API_KEY`  | Clave de la API Groq (para AURA)                 |
| `RESEND_API_KEY`| Clave de la API Resend (para emails)             |
| `EMAIL_FROM`    | Remitente de correos (ej: `no-reply@tudominio.cl`)|
| `CORS_ORIGIN`   | URL del frontend en Vercel                       |
| `PORT`          | Railway lo asigna automáticamente                |

### Vercel (Frontend)

| Variable          | Descripción                          |
|-------------------|--------------------------------------|
| `VITE_API_URL`    | URL del backend Railway + `/api`     |
| `VITE_SOCKET_URL` | URL base del backend Railway         |

---

## Despliegue

El frontend se despliega automáticamente en **Vercel** al hacer push a `main`.  
El backend se despliega en **Railway** — si no está configurado con auto-deploy, usar "Redeploy" desde el panel de Railway tras cada push.

```bash
git push origin main
```

---

*EduSync 2026 — Sistema de Gestión Educativa Premium*
