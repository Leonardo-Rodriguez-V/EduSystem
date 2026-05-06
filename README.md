# EduSync — Sistema de Gestión Educativa

Plataforma web educativa para colegios que conecta directores, profesores y apoderados en un solo lugar. Incluye gestión académica completa, comunicación en tiempo real y un asistente de inteligencia artificial integrado.

---

## Demo

| Servicio   | URL                                                    |
|------------|--------------------------------------------------------|
| Frontend   | https://edu-system-r3bw.vercel.app                     |
| Backend    | https://edusystem-production-b7f3.up.railway.app       |

---

## Funcionalidades principales

### Por rol

| Módulo             | Director | Profesor | Apoderado |
|--------------------|:--------:|:--------:|:---------:|
| Dashboard          | ✅       | ✅       | ✅        |
| Gestión de notas   | ✅       | ✅       | 👁️ lectura |
| Asistencia         | ✅       | ✅       | —         |
| Horarios           | ✅       | ✅       | ✅        |
| Calendario escolar | ✅       | ✅       | ✅        |
| Muro de avisos     | ✅       | ✅       | ✅        |
| Libro de anotaciones| ✅      | ✅       | 👁️ lectura |
| Gestión de usuarios| ✅       | —        | —         |
| Perfil del hijo    | —        | —        | ✅        |
| AURA (IA)          | ✅       | ✅       | ✅        |

### Características destacadas

- **AURA** — Asistente de IA contextual por rol. Usa datos reales de la base de datos: el director ve estadísticas globales, el profesor solo sus cursos, el apoderado solo sus hijos.
- **Notificaciones en tiempo real** vía Socket.IO con toasts y campana.
- **Modo oscuro / claro** persistente.
- **Responsive** — diseño adaptado para móvil con sidebar overlay.
- **Anotaciones** — creación, edición (solo el autor o director) y eliminación con confirmación.
- **Dashboard diferenciado** — cada rol ve su propio panel con métricas relevantes.

---

## Stack tecnológico

### Frontend
| Tecnología        | Uso                          |
|-------------------|------------------------------|
| React 19 + Vite 8 | Framework y bundler          |
| React Router v7   | Navegación SPA               |
| Framer Motion     | Animaciones                  |
| Recharts          | Gráficos estadísticos        |
| Lucide React      | Iconografía                  |
| Tailwind CSS v4   | Utilidades de estilos        |
| Socket.IO Client  | Notificaciones en tiempo real|

### Backend
| Tecnología    | Uso                                 |
|---------------|-------------------------------------|
| Node.js       | Entorno de ejecución                |
| Express 5     | Framework HTTP                      |
| Socket.IO     | Comunicación en tiempo real         |
| PostgreSQL    | Base de datos relacional            |
| Supabase      | Hosting de PostgreSQL               |
| JWT           | Autenticación stateless             |
| bcryptjs      | Hash de contraseñas                 |
| Groq API      | LLM para AURA (llama-3.3-70b)       |

### Infraestructura
| Servicio | Rol                        |
|----------|----------------------------|
| Vercel   | Frontend (SPA estático)    |
| Railway  | Backend (Express + WS)     |

---

## Estructura del repositorio

```
EduSystem/
├── Producto/
│   ├── frontend/          # React + Vite
│   │   ├── src/
│   │   │   ├── components/    # Layout, Sidebar, Topbar, AuraPanel…
│   │   │   ├── pages/         # Dashboard, Notas, Asistencia, Login…
│   │   │   ├── hooks/         # useAura, useIsMobile
│   │   │   ├── context/       # NotificationContext (Socket.IO)
│   │   │   └── utils/         # apiFetch
│   │   └── vercel.json        # Rewrite SPA para React Router
│   └── backend/           # Express + Socket.IO
│       ├── src/
│       │   ├── controllers/   # auth, notas, asistencia, aura…
│       │   ├── routes/        # Rutas REST
│       │   ├── middleware/     # JWT, verificarRol
│       │   └── config/        # DB pool, seeds
│       └── railway.json
├── Gestion/               # Documentación de gestión del proyecto
├── Documentacion/         # Documentación técnica
└── vercel.json            # Config raíz (build)
```

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

Crea un archivo `.env`:

```env
PORT=3000
DATABASE_URL=postgresql://usuario:password@host:5432/db
JWT_SECRET=tu_clave_secreta
GROQ_API_KEY=tu_clave_groq
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

Crea un archivo `.env`:

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
| Variable       | Descripción                        |
|----------------|------------------------------------|
| `DATABASE_URL` | Cadena de conexión PostgreSQL      |
| `JWT_SECRET`   | Clave secreta para firmar tokens   |
| `GROQ_API_KEY` | Clave de la API Groq               |
| `CORS_ORIGIN`  | URL del frontend en Vercel         |
| `PORT`         | Puerto del servidor (Railway lo asigna automáticamente) |

### Vercel (Frontend)
| Variable          | Descripción              |
|-------------------|--------------------------|
| `VITE_API_URL`    | URL del backend + `/api` |
| `VITE_SOCKET_URL` | URL base del backend     |

---

## Roles del sistema

| Rol        | Descripción                                                  |
|------------|--------------------------------------------------------------|
| `director` | Acceso total. Ve toda la institución, gestiona usuarios.     |
| `profesor` | Ve solo sus cursos asignados. Toma asistencia y pone notas.  |
| `apoderado`| Ve el perfil, notas y asistencia de sus hijos vinculados.    |

---

## Despliegue

El frontend se despliega automáticamente en **Vercel** al hacer push a `main`.  
El backend se despliega automáticamente en **Railway** desde la rama configurada.

```bash
git push origin main
```

---

*EduSync 2026 — Sistema de Gestión Educativa*
