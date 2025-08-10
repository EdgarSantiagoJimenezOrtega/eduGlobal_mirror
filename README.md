# 🎓 EDU WEB - Plataforma Educativa

[![CI](https://github.com/javierdici/eduweb-db/workflows/CI/badge.svg)](https://github.com/javierdici/eduweb-db/actions)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18%2B-blue.svg)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Ready-orange.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Plataforma educativa full-stack con sistema de cursos, módulos y lecciones. Incluye funcionalidades avanzadas como drip content, sistema de favoritos y seguimiento de progreso.

## 🏗️ Arquitectura

```
Frontend (React+Vite) ↔ Express API ↔ Supabase Postgres
```

## 📋 Issues de Desarrollo

- [x] **Issue #1**: ✅ Scaffold Express + GET `/courses` básico
- [x] **Issue #2**: ✅ CRUD completo `/courses /modules /lessons` con Supabase
- [x] **Issue #3**: ✅ Admin panel React con tabla de cursos
- [x] **Issue #4**: ✅ Formularios dependientes y validaciones
- [x] **Issue #5**: ✅ Pipeline CI/CD con GitHub Actions

## 🚀 Quick Start

### Backend (Issue #1 - ACTUAL)

```bash
# 1. Instalar dependencias
cd backend
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Verificar endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/courses
```

### Frontend (Próximamente - Issue #3)

```bash
cd frontend
npm install
npm run dev
```

## 📚 Base de Datos (Supabase)

### Estructura de Tablas

```sql
-- Cursos principales
courses: id(PK), title, slug, description, category_id(FK), order, cover_images[], is_locked

-- Módulos dentro de cursos
modules: id(PK), course_id(FK), title, description, order, is_locked

-- Lecciones dentro de módulos
lessons: id(PK), module_id(FK), title, video_url, support_content(HTML), order, drip_delay_minutes

-- Progreso del usuario
user_progress: id(PK), user_id(FK), lesson_id(FK), is_completed, completed_at

-- Sistema de favoritos multi-tipo
favorites: id(PK), user_id(FK), item_type('course'|'module'|'lesson'), item_id
```

## 🎯 Funcionalidades Clave

- **🔒 Drip Content**: Lecciones se desbloquean progresivamente según `drip_delay_minutes`
- **⭐ Favoritos Multi-tipo**: Marcar cursos, módulos o lecciones como favoritas
- **📊 Progreso de Usuario**: Seguimiento granular de completación de lecciones  
- **🔐 Control de Acceso**: Sistema `is_locked` para condicionar visibilidad
- **🖼️ Múltiples Portadas**: Array `cover_images[]` estilo Netflix
- **📝 Contenido Rico**: `support_content` con HTML, imágenes y enlaces

## 🛠️ Tecnologías

**Backend:**
- Node.js 18+
- Express.js 4.18+
- Supabase (PostgreSQL)
- Helmet, CORS, Morgan
- Joi (validaciones)

**Frontend (Próximamente):**
- React 18+
- Vite
- TailwindCSS
- Axios/Fetch API

## 📁 Estructura del Proyecto

```
eduweb-db/
├── backend/           # Express API
│   ├── server.js      # Servidor principal  
│   ├── package.json   # Dependencias backend
│   ├── .env.example   # Variables de entorno template
│   └── .gitignore     # Archivos ignorados
├── frontend/          # React Admin Panel (Issue #3)
├── .github/workflows/ # CI/CD Pipeline (Issue #5)
├── README.md          # Esta documentación
├── chatlog.md         # Log de conversaciones desarrollo
└── CLAUDE.md          # Guía para Claude Code
```

## 🔧 Scripts Disponibles

**Backend:**
- `npm start` - Producción
- `npm run dev` - Desarrollo con nodemon
- `npm test` - Ejecutar tests

## 🌐 Endpoints API (Issue #1)

| Método | Endpoint | Descripción | Estado |
|--------|----------|-------------|---------|
| GET | `/health` | Health check del servidor | ✅ Listo |
| GET | `/api/courses` | Lista demo de cursos | ✅ Listo |

**Ejemplo Response:**
```json
[{"id": 1, "title": "Demo"}]
```

## 🚧 Próximos Pasos

1. **Issue #2**: Conectar endpoints a Supabase real
2. **Issue #3**: Crear admin panel React
3. **Issue #4**: Implementar formularios con dependencias
4. **Issue #5**: Setup CI/CD pipeline

## 📄 Licencia

MIT - Ver archivo [LICENSE](LICENSE) para más detalles.
