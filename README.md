# 🎓 EDU WEB - Plataforma Educativa Completa

[![CI](https://github.com/javierdici/eduweb-db/workflows/CI/badge.svg)](https://github.com/javierdici/eduweb-db/actions)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18%2B-blue.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19%2B-blue.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Ready-orange.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Sistema educativo full-stack completo desarrollado para **Evo Global**. Incluye administrador web con autenticación, API REST robusta, y base de datos relacional con funcionalidades avanzadas como drip content, sistema de favoritos y seguimiento de progreso estudiantil.

## 🏗️ Arquitectura del Sistema

```
Frontend (React + Vite + Tailwind)
           ↕️ HTTP API
Backend (Express.js + Joi + Jest)
           ↕️ SQL Queries  
Database (Supabase PostgreSQL)
           ↕️ Automated
CI/CD Pipeline (GitHub Actions)
```

## ✅ Estado del Proyecto - COMPLETADO

Todos los issues han sido implementados exitosamente:

- [x] **Issue #1**: ✅ Express scaffold + GET `/courses` básico
- [x] **Issue #2**: ✅ CRUD completo `/courses /modules /lessons` con Supabase (20+ endpoints)
- [x] **Issue #3**: ✅ Admin Panel React con autenticación y tabla de cursos
- [x] **Issue #4**: ✅ Formularios dependientes (Module/Lesson) con validaciones
- [x] **Issue #5**: ✅ Pipeline CI/CD con GitHub Actions y deploy automático

## 🚀 Quick Start

### Prerrequisitos

- Node.js 18+ 
- Cuenta en Supabase
- Git

### 1. Clonar y configurar

```bash
git clone https://github.com/javierdici/eduweb-db.git
cd eduweb-db
```

### 2. Backend (API REST)

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
```

**Configurar `.env`:**
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Server Configuration
PORT=3001
NODE_ENV=development
```

```bash
# Iniciar servidor de desarrollo
npm run dev

# Servidor corriendo en http://localhost:3001
```

### 3. Frontend (Admin Panel)

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
```

**Configurar `frontend/.env`:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

```bash
# Iniciar desarrollo
npm run dev

# Panel admin en http://localhost:5173
```

### 4. Acceso al Sistema

- **API Backend**: http://localhost:3001
- **Admin Panel**: http://localhost:5173
- **Health Check**: http://localhost:3001/health

## 📊 Base de Datos (Supabase)

### Estructura de Tablas

```sql
-- Cursos principales
CREATE TABLE courses (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  category_id BIGINT,
  "order" INTEGER DEFAULT 0,
  cover_images TEXT[],
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Módulos dentro de cursos
CREATE TABLE modules (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  "order" INTEGER DEFAULT 0,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Lecciones dentro de módulos  
CREATE TABLE lessons (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  module_id BIGINT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  video_url TEXT,
  support_content TEXT,
  "order" INTEGER DEFAULT 0,
  drip_delay_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Progreso del usuario
CREATE TABLE user_progress (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL,
  lesson_id BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Sistema de favoritos multi-tipo
CREATE TABLE favorites (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL,
  item_type VARCHAR(20) CHECK (item_type IN ('course', 'module', 'lesson')),
  item_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);
```

## 🔧 API Endpoints

### Cursos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/courses` | Listar cursos con paginación |
| GET | `/api/courses/:id` | Obtener curso específico |
| POST | `/api/courses` | Crear nuevo curso |
| PUT | `/api/courses/:id` | Actualizar curso |
| DELETE | `/api/courses/:id` | Eliminar curso (con cascade) |
| GET | `/api/courses/:id/modules` | Módulos de un curso |

### Módulos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/modules` | Listar módulos |
| GET | `/api/modules/:id` | Obtener módulo específico |
| POST | `/api/modules` | Crear nuevo módulo |
| PUT | `/api/modules/:id` | Actualizar módulo |
| DELETE | `/api/modules/:id` | Eliminar módulo |
| GET | `/api/modules/:id/lessons` | Lecciones de un módulo |

### Lecciones
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/lessons` | Listar lecciones |
| GET | `/api/lessons/:id` | Obtener lección específica |
| POST | `/api/lessons` | Crear nueva lección |
| PUT | `/api/lessons/:id` | Actualizar lección |
| DELETE | `/api/lessons/:id` | Eliminar lección |

### Progreso y Favoritos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/user-progress` | Progreso del usuario |
| POST | `/api/user-progress` | Marcar lección completada |
| GET | `/api/favorites` | Favoritos del usuario |
| POST | `/api/favorites` | Agregar a favoritos |
| DELETE | `/api/favorites/:id` | Remover de favoritos |

## 🎯 Funcionalidades Implementadas

### Backend (Express.js)
- ✅ **API REST completa** con 20+ endpoints
- ✅ **Validaciones Joi** en todas las rutas
- ✅ **Conexión Supabase** con queries optimizados
- ✅ **Paginación** y filtros avanzados
- ✅ **Cascade delete** para integridad referencial
- ✅ **Tests automatizados** con Jest
- ✅ **Logging detallado** para debugging
- ✅ **CORS y Helmet** para seguridad

### Frontend (React Admin Panel)
- ✅ **Autenticación Supabase Auth** completa
- ✅ **Dashboard** con estadísticas
- ✅ **CRUD Courses** con tabla, paginación y búsqueda
- ✅ **Modal Add Course** con validación
- ✅ **Modal Add Module** con dropdown de cursos
- ✅ **Modal Add Lesson** con dropdowns dependientes
- ✅ **Delete con confirmación** y cascade option
- ✅ **UI responsive** con Tailwind CSS
- ✅ **Diseño Evo Global** con gradientes púrpura

### DevOps & CI/CD
- ✅ **GitHub Actions** pipeline
- ✅ **Tests automatizados** en Node.js 18.x y 20.x
- ✅ **Build frontend** automático
- ✅ **Deploy simulation** configurado
- ✅ **Badge de estado** en README

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js 18+** - Runtime JavaScript
- **Express.js 4.18+** - Framework web
- **Supabase** - Base de datos PostgreSQL
- **Joi** - Validación de schemas
- **Jest** - Testing framework
- **Helmet** - Seguridad HTTP
- **CORS** - Cross-Origin Resource Sharing
- **Morgan** - HTTP request logger

### Frontend  
- **React 19+** - Biblioteca UI
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework CSS utility-first
- **React Router** - Enrutamiento SPA
- **Supabase Auth UI** - Componentes de autenticación
- **ESLint** - Linter JavaScript

### DevOps
- **GitHub Actions** - CI/CD pipeline
- **Node.js Matrix** - Testing multi-versión

## 📁 Estructura del Proyecto

```
eduweb-db/
├── 📁 backend/                 # Express.js API
│   ├── 📄 server.js           # Servidor principal
│   ├── 📄 package.json        # Dependencies backend
│   ├── 📁 config/
│   │   └── 📄 database.js     # Configuración Supabase
│   ├── 📁 routes/
│   │   ├── 📄 courses.js      # CRUD cursos
│   │   ├── 📄 modules.js      # CRUD módulos  
│   │   ├── 📄 lessons.js      # CRUD lecciones
│   │   ├── 📄 user_progress.js # Progreso usuario
│   │   └── 📄 favorites.js    # Sistema favoritos
│   ├── 📁 middleware/
│   │   └── 📄 validation.js   # Validaciones Joi
│   └── 📁 validators/
│       └── 📄 schemas.js      # Schemas Joi
├── 📁 frontend/                # React Admin Panel
│   ├── 📄 package.json        # Dependencies frontend  
│   ├── 📄 index.html          # HTML entry point
│   ├── 📄 vite.config.js      # Configuración Vite
│   ├── 📁 src/
│   │   ├── 📄 App.jsx          # Componente principal
│   │   ├── 📄 main.jsx         # Entry point React
│   │   ├── 📄 index.css        # Estilos Tailwind
│   │   ├── 📁 pages/
│   │   │   ├── 📄 Dashboard.jsx # Panel principal
│   │   │   ├── 📄 Login.jsx    # Página login
│   │   │   └── 📄 Register.jsx # Página registro
│   │   ├── 📁 components/
│   │   │   ├── 📄 Layout.jsx       # Layout principal
│   │   │   ├── 📄 CoursesTable.jsx # Tabla cursos
│   │   │   ├── 📄 CourseModal.jsx  # Modal CRUD curso
│   │   │   ├── 📄 ModuleModal.jsx  # Modal CRUD módulo
│   │   │   ├── 📄 LessonModal.jsx  # Modal CRUD lección
│   │   │   └── 📄 DeleteCourseModal.jsx # Confirmación delete
│   │   ├── 📁 contexts/
│   │   │   └── 📄 AuthContext.jsx  # Context autenticación
│   │   └── 📁 lib/
│   │       ├── 📄 api.js           # Cliente API REST
│   │       └── 📄 supabase.js      # Cliente Supabase
├── 📁 .github/workflows/       # CI/CD Pipeline
│   └── 📄 ci.yml              # GitHub Actions workflow
├── 📄 README.md               # Esta documentación
├── 📄 CLAUDE.md               # Guía para Claude Code
└── 📄 package.json            # Root dependencies
```

## 🔧 Scripts Disponibles

### Backend
```bash
npm start      # Producción
npm run dev    # Desarrollo con nodemon  
npm test       # Ejecutar tests Jest
```

### Frontend
```bash
npm run dev    # Desarrollo con Vite
npm run build  # Build para producción
npm run lint   # Linter ESLint
npm test       # Placeholder tests
npm run preview # Preview build
```

## 🌟 Características Destacadas

### 🔒 Drip Content System
- Lecciones se desbloquean progresivamente según `drip_delay_minutes`
- Control granular de acceso temporal

### ⭐ Sistema de Favoritos Multi-tipo  
- Marcar cursos, módulos o lecciones como favoritas
- Flexibilidad total en preferencias de usuario

### 📊 Seguimiento de Progreso
- Progreso granular por lección completada
- Timestamps de finalización
- Dashboard con métricas

### 🔐 Control de Acceso Avanzado
- Sistema `is_locked` a nivel curso/módulo/lección
- Autenticación Supabase integrada
- Rutas protegidas en frontend

### 🖼️ Gestión de Medios Rica
- Múltiples portadas por curso estilo Netflix
- Videos embebidos por lección
- Contenido HTML enriquecido

### 🎨 UI/UX Profesional
- Diseño responsive mobile-first
- Branding Evo Global (gradientes púrpura)
- Componentes reutilizables
- Feedback visual completo

## 🧪 Testing

### Backend Tests (Jest)
```bash
cd backend
npm test
```

### CI/CD Testing
- ✅ Matrix testing en Node.js 18.x y 20.x
- ✅ Install dependencies (backend + frontend)
- ✅ Run all tests
- ✅ Build frontend
- ✅ Deploy simulation

## 📈 Performance & Escalabilidad

- **Paginación optimizada** en todas las listas
- **Queries SQL eficientes** con joins optimizados
- **Validación en capas** (frontend + backend)
- **Caching de dependencias** en CI/CD
- **Bundle splitting** con Vite
- **Lazy loading** de componentes React

## 🔐 Seguridad

- **Helmet.js** para headers de seguridad
- **CORS** configurado apropiadamente
- **Validación Joi** en todas las entradas
- **Sanitización** de inputs del usuario
- **Autenticación JWT** vía Supabase
- **Row Level Security** en base de datos

## 📱 Responsividad

- ✅ **Mobile-first** design approach
- ✅ **Breakpoints Tailwind** xs, sm, md, lg, xl
- ✅ **Navigation responsive** con hamburger menu
- ✅ **Tablas adaptables** con scroll horizontal
- ✅ **Modales optimizados** para móvil

## 🚧 Próximos Pasos (Roadmap)

### Phase 2 - Funcionalidades Avanzadas
- [ ] Sistema de notificaciones push
- [ ] Analytics avanzado de progreso
- [ ] Certificados automáticos de completación
- [ ] Sistema de comentarios en lecciones
- [ ] Integración con Zoom/Meet para clases en vivo

### Phase 3 - Escalabilidad  
- [ ] Microservicios architecture
- [ ] Redis caching layer
- [ ] CDN para assets multimedia
- [ ] Load balancing con Docker
- [ ] Monitoring con Prometheus

## 📄 Licencia

MIT - Ver archivo [LICENSE](LICENSE) para más detalles.

---

## 🏆 Desarrollo Completado

**Desarrollado para Evo Global**  
Proyecto educativo full-stack con todas las funcionalidades implementadas exitosamente.

**Tecnologías:** Node.js • Express • React • Supabase • Tailwind CSS • GitHub Actions  
**Funcionalidades:** CRUD Completo • Autenticación • Admin Panel • CI/CD Pipeline  
**Estado:** ✅ **COMPLETADO** - Todos los issues implementados

[![CI Status](https://github.com/javierdici/eduweb-db/workflows/CI/badge.svg)](https://github.com/javierdici/eduweb-db/actions)
