# EDU WEB - Documentación Técnica Completa

## Índice
1. [Resumen del Proyecto](#resumen-del-proyecto)
2. [Arquitectura General](#arquitectura-general)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Backend API](#backend-api)
5. [Frontend](#frontend)
6. [Base de Datos](#base-de-datos)
7. [Autenticación y Seguridad](#autenticación-y-seguridad)
8. [Despliegue y Configuración](#despliegue-y-configuración)
9. [Guía de Desarrollo](#guía-de-desarrollo)
10. [Testing](#testing)
11. [CI/CD](#cicd)
12. [Funcionalidades Principales](#funcionalidades-principales)

---

## Resumen del Proyecto

**EDU WEB** es una plataforma educativa completa desarrollada para **EVO GLOBAL**, diseñada para gestionar contenido educativo con una estructura jerárquica de Cursos → Módulos → Lessons. La aplicación implementa un sistema avanzado de gestión de contenido con funcionalidades como seguimiento de progreso, contenido con goteo (drip content), sistema de favoritos y panel de administración completo.

### Características Principales
- **Gestión Jerárquica de Contenido**: Estructura Curso → Módulo → Lección
- **Panel de Administración**: Interfaz completa para gestión de contenido
- **Sistema de Progreso**: Seguimiento granular de progreso del usuario
- **Contenido con Goteo**: Sistema de liberación temporizada de Lessons
- **Sistema de Favoritos**: Multi-tipo (cursos, módulos, Lessons)
- **Autenticación Completa**: Integración con Supabase Auth
- **API RESTful**: Backend robusto con validación completa
- **Diseño Responsivo**: UI moderna con Tailwind CSS

---

## Arquitectura General

El proyecto sigue una arquitectura de microservicios moderna con separación clara entre frontend y backend:

```
┌─────────────────────┐     HTTP/REST API     ┌──────────────────────┐
│   Frontend React    │ ←──────────────────→  │   Backend Express    │
│   (Puerto 5173)     │      (Puerto 3001)    │      + Validación    │
└─────────────────────┘                       └──────────────────────┘
           │                                             │
           │                                             │
           ▼                                             ▼
┌─────────────────────┐                       ┌──────────────────────┐
│  Supabase Auth UI   │                       │  Supabase Database   │
│   + Manejo Estado   │                       │    (PostgreSQL)     │
└─────────────────────┘                       └──────────────────────┘
           │                                             │
           └─────────────────┬───────────────────────────┘
                             ▼
                  ┌──────────────────────┐
                  │   GitHub Actions     │
                  │   (CI/CD Pipeline)   │
                  └──────────────────────┘
```

### Flujo de Datos
1. **Frontend** envía peticiones HTTP al Backend
2. **Backend** valida datos con Joi y consulta Supabase
3. **Supabase** maneja autenticación y almacenamiento
4. **GitHub Actions** ejecuta testing y despliegue automático

---

## Stack Tecnológico

### Backend
```json
{
  "runtime": "Node.js 18+",
  "framework": "Express.js 4.18+",
  "database": "Supabase (PostgreSQL)",
  "validation": "Joi 17.11+",
  "testing": "Jest 29.7+ con Supertest",
  "security": "Helmet + CORS + Morgan",
  "development": "Nodemon"
}
```

### Frontend
```json
{
  "library": "React 19.1+",
  "build": "Vite 7.1+",
  "styling": "Tailwind CSS 3.4+",
  "routing": "React Router DOM 7.8+",
  "auth": "Supabase Auth UI",
  "linting": "ESLint con configuración moderna"
}
```

### DevOps & Infraestructura
```json
{
  "ci_cd": "GitHub Actions",
  "testing": "Matrix Testing (Node 18.x, 20.x)",
  "package_manager": "NPM con lock files",
  "version_control": "Git (main/edgarS-dev branches)"
}
```

---

## Backend API

### Estructura del Servidor

El servidor principal se encuentra en `server.js` y implementa:

```javascript
// Configuración del servidor
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de seguridad
app.use(helmet()); // Headers de seguridad HTTP
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173']
}));
app.use(morgan('combined')); // Logging de peticiones

// Parsing de datos
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

### Configuración de Base de Datos

```javascript
// Configuración Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false // Deshabilitado en backend
    }
  }
);
```

### Endpoints de la API

#### **Cursos** (`/api/courses`)
```javascript
GET    /api/courses          // Listar cursos con paginación
POST   /api/courses          // Crear nuevo curso
GET    /api/courses/:id      // Obtener curso específico
PUT    /api/courses/:id      // Actualizar curso
DELETE /api/courses/:id      // Eliminar curso (cascade)
GET    /api/courses/:id/modules // Módulos de un curso
```

**Esquema de Curso:**
```javascript
{
  id: "integer",
  title: "string (requerido)",
  slug: "string (URL-safe, único)",
  description: "string",
  author: "string",
  language: "string",
  category_id: "integer (referencia a categories)",
  order: "integer",
  cover_images: ["array de URLs"],
  is_locked: "boolean (default: false)"
}
```

#### **Módulos** (`/api/modules`)
```javascript
GET    /api/modules          // Listar módulos
POST   /api/modules          // Crear nuevo módulo
GET    /api/modules/:id      // Obtener módulo específico
PUT    /api/modules/:id      // Actualizar módulo
DELETE /api/modules/:id      // Eliminar módulo (cascade)
GET    /api/modules/:id/lessons // Lessons de un módulo
```

**Esquema de Módulo:**
```javascript
{
  id: "integer",
  course_id: "integer (requerido, referencia a courses)",
  title: "string (requerido)",
  description: "string",
  module_images: ["array de URLs"],
  order: "integer",
  is_locked: "boolean (default: false)"
}
```

#### **Lessons** (`/api/lessons`)
```javascript
GET    /api/lessons          // Listar Lessons
POST   /api/lessons          // Crear nueva lección
GET    /api/lessons/:id      // Obtener lección específica
PUT    /api/lessons/:id      // Actualizar lección
DELETE /api/lessons/:id      // Eliminar lección
```

**Esquema de Lección:**
```javascript
{
  id: "integer",
  module_id: "integer (requerido, referencia a modules)",
  title: "string (requerido)",
  video_url: "string (URL válida)",
  support_content: "string (HTML permitido)",
  order: "integer",
  drip_delay_minutes: "integer (para contenido con goteo)"
}
```

#### **Progreso de Usuario** (`/api/user_progress`)
```javascript
GET    /api/user_progress    // Progreso del usuario actual
POST   /api/user_progress    // Marcar lección como completada
GET    /api/user_progress/:userId // Progreso de usuario específico
```

#### **Favoritos** (`/api/favorites`)
```javascript
GET    /api/favorites        // Favoritos del usuario
POST   /api/favorites        // Añadir a favoritos
DELETE /api/favorites/:id    // Remover de favoritos
```

**Sistema Multi-tipo:**
```javascript
{
  item_type: "course | module | lesson",
  item_id: "integer (ID del elemento)",
  user_id: "UUID (usuario de Supabase)"
}
```

#### **Categorías** (`/api/categories`)
```javascript
GET    /api/categories       // Listar categorías
POST   /api/categories       // Crear categoría
PUT    /api/categories/:id   // Actualizar categoría
DELETE /api/categories/:id   // Eliminar categoría
```

#### **Health Check** (`/health`)
```javascript
GET    /health              // Estado del sistema y base de datos
```

### Sistema de Validación

Todas las peticiones son validadas usando **Joi** con esquemas detallados:

```javascript
// Ejemplo de validación de curso
const courseSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  slug: Joi.string().pattern(/^[a-z0-9-]+$/).max(255),
  description: Joi.string().allow(''),
  author: Joi.string().max(255),
  language: Joi.string().max(50),
  category_id: Joi.number().integer().positive(),
  order: Joi.number().integer().min(0),
  cover_images: Joi.array().items(Joi.string().uri()),
  is_locked: Joi.boolean()
});
```

### Características Avanzadas de la API

#### **Paginación**
Todos los endpoints de listado soportan paginación:
```javascript
GET /api/courses?limit=10&offset=0
// Respuesta incluye metadata de paginación
{
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

#### **Filtrado Avanzado**
```javascript
GET /api/courses?category_id=1&is_locked=false&author=John
GET /api/lessons?module_id=5&limit=20
```

#### **Operaciones en Cascada**
La eliminación en cascada verifica dependencias:
```javascript
DELETE /api/courses/1
// Elimina automáticamente todos los módulos y Lessons asociados
// Verifica conflictos antes de proceder
```

#### **Manejo de Errores**
Respuestas estructuradas de error:
```javascript
{
  "error": "Validation Error",
  "details": {
    "field": "title",
    "message": "Title is required"
  },
  "status": 400
}
```

---

## Frontend

### Arquitectura de Componentes

El frontend está organizado siguiendo principios de React moderno:

```
src/
├── components/           # Componentes reutilizables
│   ├── Layout.jsx       # Layout principal con navegación
│   ├── ProtectedRoute.jsx # Guard para rutas protegidas
│   ├── CoursesTable.jsx # Tabla avanzada de cursos
│   ├── CourseModal.jsx  # Modal crear/editar curso
│   ├── ModuleModal.jsx  # Modal crear/editar módulo
│   ├── LessonModal.jsx  # Modal crear/editar lección
│   └── ImageUpload.jsx  # Componente subida de imágenes
├── contexts/            # Contextos React
│   └── AuthContext.jsx  # Manejo estado autenticación
├── pages/              # Páginas principales
│   ├── Dashboard.jsx   # Panel principal con estadísticas
│   ├── Login.jsx       # Página de login
│   ├── Register.jsx    # Página de registro
│   └── Categories.jsx  # Gestión de categorías
├── lib/                # Utilidades y servicios
│   ├── api.js         # Cliente API
│   ├── supabase.js    # Configuración Supabase
│   └── storage.js     # Utilidades de almacenamiento
└── App.jsx            # Componente raíz con routing
```

### Componente Principal - App.jsx

```javascript
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/categories" element={
            <ProtectedRoute>
              <Layout><Categories /></Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
```

### Sistema de Autenticación

#### AuthContext
Maneja el estado global de autenticación:

```javascript
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email, password) => {
    return await supabase.auth.signUp({ email, password });
  };

  const signOut = async () => {
    return await supabase.auth.signOut();
  };

  const resetPassword = async (email) => {
    return await supabase.auth.resetPasswordForEmail(email);
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading, signIn, signUp, signOut, resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Cliente API

El archivo `lib/api.js` implementa una clase `ApiClient` completa:

```javascript
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await this.parseResponse(response);
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await this.parseResponse(response);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Métodos CRUD completos
  async getCourses(params = {}) { /* ... */ }
  async createCourse(courseData) { /* ... */ }
  async updateCourse(id, courseData) { /* ... */ }
  async deleteCourse(id) { /* ... */ }
  
  // Similar para modules, lessons, categories, etc.
}
```

### Componentes Avanzados

#### CoursesTable.jsx
Tabla avanzada con funcionalidades completas:

```javascript
function CoursesTable() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Funcionalidades:
  // - Paginación avanzada
  // - Búsqueda en tiempo real
  // - Ordenamiento por columnas
  // - Acciones CRUD inline
  // - Modales de edición
  // - Confirmación de eliminación
  // - Actualización automática de datos
}
```

#### ImageUpload.jsx
Componente de subida de imágenes con funcionalidades:

```javascript
function ImageUpload({ onImagesChange, existingImages = [] }) {
  // Características:
  // - Drag & drop
  // - Vista previa de imágenes
  // - Validación de tipos de archivo
  // - Límite de tamaño
  // - Eliminación de imágenes existentes
  // - Indicador de progreso de subida
}
```

### Sistema de Estilos

#### Configuración Tailwind
Configuración personalizada con colores de EVO GLOBAL:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf5ff',
          500: '#8b5cf6',  // Purple principal
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95'
        },
        secondary: {
          500: '#0ea5e9',  // Blue secundario
          600: '#0284c7',
          700: '#0369a1'
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #8b5cf6 0%, #4c1d95 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #0ea5e9 0%, #0c4a6e 100%)'
      }
    }
  }
}
```

#### Componentes de UI Reutilizables
```javascript
// Botones con variantes
const Button = ({ variant = 'primary', size = 'md', children, ...props }) => {
  const baseClasses = 'font-medium rounded-lg transition-colors duration-200';
  const variants = {
    primary: 'bg-gradient-primary text-white hover:opacity-90',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };
  // ...
};
```

---

## Base de Datos

### Esquema de Base de Datos

La base de datos implementa una estructura jerárquica completa:

```sql
-- Tabla de categorías para organización
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) UNIQUE,
  description TEXT,
  color VARCHAR(7), -- Código hexadecimal
  icon VARCHAR(100),
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla principal de cursos
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  description TEXT,
  author VARCHAR(255),
  language VARCHAR(50),
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  order_index INTEGER DEFAULT 0,
  cover_images TEXT[], -- Array de URLs de imágenes
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de módulos (pertenecen a cursos)
CREATE TABLE modules (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  module_images TEXT[], -- Array de URLs de imágenes
  order_index INTEGER DEFAULT 0,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Lessons (pertenecen a módulos)
CREATE TABLE lessons (
  id SERIAL PRIMARY KEY,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  video_url TEXT,
  support_content TEXT, -- Contenido HTML de soporte
  order_index INTEGER DEFAULT 0,
  drip_delay_minutes INTEGER DEFAULT 0, -- Minutos de retraso para liberación
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de progreso de usuario
CREATE TABLE user_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL, -- UUID de Supabase Auth
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, lesson_id)
);

-- Sistema de favoritos multi-tipo
CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL, -- UUID de Supabase Auth
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('course', 'module', 'lesson')),
  item_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, item_type, item_id)
);
```

### Índices y Optimizaciones

```sql
-- Índices para optimización de consultas
CREATE INDEX idx_courses_category_id ON courses(category_id);
CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_modules_course_id ON modules(course_id);
CREATE INDEX idx_lessons_module_id ON lessons(module_id);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_lesson_id ON user_progress(lesson_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_item ON favorites(item_type, item_id);

-- Índices compuestos para consultas complejas
CREATE INDEX idx_user_progress_user_lesson ON user_progress(user_id, lesson_id);
CREATE INDEX idx_courses_category_order ON courses(category_id, order_index);
CREATE INDEX idx_modules_course_order ON modules(course_id, order_index);
CREATE INDEX idx_lessons_module_order ON lessons(module_id, order_index);
```

### Triggers y Funciones

```sql
-- Función para actualizar timestamp de actualización
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para auto-actualizar updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Políticas RLS (Row Level Security)

Supabase implementa políticas de seguridad a nivel de fila:

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Política para user_progress (usuarios solo ven su progreso)
CREATE POLICY "Users can view own progress" ON user_progress
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para favoritos (usuarios solo ven sus favoritos)
CREATE POLICY "Users can view own favorites" ON favorites
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own favorites" ON favorites
    FOR ALL USING (auth.uid() = user_id);

-- Contenido público visible para usuarios autenticados
CREATE POLICY "Authenticated users can view courses" ON courses
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view modules" ON modules
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view lessons" ON lessons
    FOR SELECT USING (auth.role() = 'authenticated');
```

### Consultas Complejas Típicas

#### Obtener estructura completa de curso
```sql
WITH course_structure AS (
  SELECT 
    c.id as course_id,
    c.title as course_title,
    c.description as course_description,
    c.cover_images,
    c.is_locked as course_locked,
    m.id as module_id,
    m.title as module_title,
    m.description as module_description,
    m.is_locked as module_locked,
    l.id as lesson_id,
    l.title as lesson_title,
    l.video_url,
    l.drip_delay_minutes,
    up.is_completed,
    up.completed_at
  FROM courses c
  LEFT JOIN modules m ON c.id = m.course_id
  LEFT JOIN lessons l ON m.id = l.module_id
  LEFT JOIN user_progress up ON l.id = up.lesson_id 
    AND up.user_id = $1 -- UUID del usuario
  WHERE c.id = $2
  ORDER BY c.order_index, m.order_index, l.order_index
)
SELECT * FROM course_structure;
```

#### Estadísticas de progreso por usuario
```sql
SELECT 
  c.id as course_id,
  c.title as course_title,
  COUNT(l.id) as total_lessons,
  COUNT(CASE WHEN up.is_completed = true THEN 1 END) as completed_lessons,
  ROUND(
    (COUNT(CASE WHEN up.is_completed = true THEN 1 END)::float / 
     NULLIF(COUNT(l.id), 0)) * 100, 2
  ) as completion_percentage
FROM courses c
LEFT JOIN modules m ON c.id = m.course_id
LEFT JOIN lessons l ON m.id = l.module_id
LEFT JOIN user_progress up ON l.id = up.lesson_id 
  AND up.user_id = $1 -- UUID del usuario
GROUP BY c.id, c.title
ORDER BY c.title;
```

---

## Autenticación y Seguridad

### Sistema de Autenticación Supabase

#### Configuración Frontend
```javascript
// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
```

#### Configuración Backend
```javascript
// config/database.js
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false // Importante: deshabilitado en backend
    }
  }
);
```

### Flujo de Autenticación

#### Registro de Usuario
```javascript
const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        email_confirm: true
      }
    }
  });
  
  if (error) throw error;
  return data;
};
```

#### Inicio de Sesión
```javascript
const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
};
```

#### Manejo de Sesión
```javascript
useEffect(() => {
  // Obtener sesión inicial
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  });

  // Listener para cambios de autenticación
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      console.log('Auth state changed:', event, session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

### Protección de Rutas

#### ProtectedRoute Component
```javascript
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

### Seguridad Backend

#### Middleware de Seguridad
```javascript
// Helmet para headers de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configurado por entorno
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

#### Validación de Entrada
```javascript
// Middleware de validación con Joi
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate({
      body: req.body,
      query: req.query,
      params: req.params
    }, { allowUnknown: true });

    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    next();
  };
};
```

#### Sanitización de Datos
```javascript
const sanitizeHtml = require('sanitize-html');

// Limpiar contenido HTML en lessons
const sanitizeLessonContent = (content) => {
  return sanitizeHtml(content, {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'],
    allowedAttributes: {
      'a': ['href'],
      'img': ['src', 'alt']
    },
    disallowedTagsMode: 'discard'
  });
};
```

### Políticas de Seguridad

#### Variables de Entorno
```bash
# Backend .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Frontend .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://api.yourdomain.com/api
```

#### Manejo de Errores Seguro
```javascript
const handleError = (error, req, res, next) => {
  console.error('Error:', error);

  // En producción, no exponer detalles internos
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Something went wrong'
    });
  } else {
    res.status(error.status || 500).json({
      error: error.name || 'Error',
      message: error.message,
      stack: error.stack
    });
  }
};
```

---

## Despliegue y Configuración

### Configuración de Entornos

#### Desarrollo Local
```bash
# Backend - Puerto 3001
cd backend
npm install
npm run dev

# Frontend - Puerto 5173  
cd frontend
npm install
npm run dev
```

#### Configuración de Variables de Entorno

**Backend (.env):**
```bash
# Base de datos Supabase
SUPABASE_URL=https://mppfxkhpkxdqtupwgrzz.supabase.co
SUPABASE_ANON_KEY=tu-clave-anonima
SUPABASE_SERVICE_ROLE_KEY=tu-clave-service-role

# Configuración del servidor
PORT=3001
NODE_ENV=development

# CORS - Orígenes permitidos
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Frontend (.env):**
```bash
# Configuración Supabase
VITE_SUPABASE_URL=https://mppfxkhpkxdqtupwgrzz.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima

# API Backend
VITE_API_URL=http://localhost:3001/api
```

### Scripts de NPM

#### Backend
```json
{
  "scripts": {
    "start": "node server.js",           // Producción
    "dev": "nodemon server.js",          // Desarrollo con auto-reload
    "test": "jest",                      // Ejecutar tests
    "test:watch": "jest --watch",        // Tests en modo watch
    "test:coverage": "jest --coverage"   // Tests con cobertura
  }
}
```

#### Frontend
```json
{
  "scripts": {
    "dev": "vite",                      // Servidor de desarrollo
    "build": "vite build",              // Build de producción
    "preview": "vite preview",          // Preview del build
    "lint": "eslint .",                 // Linting
    "lint:fix": "eslint . --fix"       // Auto-fix de linting
  }
}
```

### Configuración de Producción

#### Backend - Optimizaciones
```javascript
// server.js - Configuración para producción
if (process.env.NODE_ENV === 'production') {
  // Compresión gzip
  app.use(compression());
  
  // Rate limiting
  const rateLimit = require('express-rate-limit');
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por ventana
    message: 'Too many requests from this IP'
  });
  app.use('/api', limiter);

  // Logging estructurado
  app.use(morgan('combined'));
  
  // Trust proxy para headers correctos
  app.set('trust proxy', 1);
}
```

#### Frontend - Build Optimizations
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false, // Deshabilitado en producción
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true // Para acceso desde red local
  }
});
```

### Docker Configuration

#### Backend Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Usuario no-root para seguridad
USER node

CMD ["npm", "start"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Servidor nginx para servir archivos estáticos
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### docker-compose.yml
```yaml
version: '3.8'
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    env_file:
      - ./backend/.env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

### Monitoreo y Logs

#### Configuración de Logging
```javascript
// Backend logging configuration
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

#### Health Check Endpoint
```javascript
app.get('/health', async (req, res) => {
  try {
    // Verificar conexión a base de datos
    const { data, error } = await supabase
      .from('courses')
      .select('count')
      .limit(1);
    
    if (error) throw error;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});
```

---

## Testing

### Configuración de Testing Backend

#### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'routes/**/*.js',
    'middleware/**/*.js',
    'validators/**/*.js',
    '!node_modules/**'
  ],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
```

#### Test Setup
```javascript
// tests/setup.js
const { supabase } = require('../config/database');

// Mock para tests
jest.mock('../config/database', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      insert: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      update: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      delete: jest.fn(() => Promise.resolve({ data: {}, error: null }))
    }))
  }
}));

// Limpiar mocks después de cada test
afterEach(() => {
  jest.clearAllMocks();
});
```

#### Ejemplo de Tests
```javascript
// tests/courses.test.js
const request = require('supertest');
const app = require('../server');

describe('Courses API', () => {
  describe('GET /api/courses', () => {
    test('should return courses list', async () => {
      const response = await request(app)
        .get('/api/courses')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/courses?limit=5&offset=10')
        .expect(200);

      expect(response.body.pagination).toHaveProperty('limit', 5);
      expect(response.body.pagination).toHaveProperty('offset', 10);
    });
  });

  describe('POST /api/courses', () => {
    test('should create new course', async () => {
      const courseData = {
        title: 'Test Course',
        description: 'Test Description',
        author: 'Test Author'
      };

      const response = await request(app)
        .post('/api/courses')
        .send(courseData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(courseData.title);
    });

    test('should validate required fields', async () => {
      const invalidData = {
        description: 'Missing title'
      };

      const response = await request(app)
        .post('/api/courses')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Validation Error');
    });
  });
});
```

#### Health Check Tests
```javascript
// tests/health.test.js
describe('Health Check', () => {
  test('should return healthy status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('database');
  });
});
```

### Testing Frontend

#### Configuración para React Testing Library
```javascript
// vite.config.js - configuración para tests
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
});
```

#### Setup para Tests Frontend
```javascript
// src/test/setup.js
import '@testing-library/jest-dom';

// Mock para Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ 
        data: { session: null }, 
        error: null 
      })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    }
  }
}));
```

### Comandos de Testing

```bash
# Backend
npm test                    # Ejecutar todos los tests
npm run test:watch         # Tests en modo watch
npm run test:coverage     # Tests con reporte de cobertura

# Frontend
npm run test              # Tests de React
npm run test:ui          # UI para tests (si está configurado)
```

---

## CI/CD

### GitHub Actions Configuration

#### Workflow Principal (.github/workflows/ci.yml)
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - name: Checkout código
      uses: actions/checkout@v4

    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    # Backend Testing
    - name: Cache Backend Dependencies
      uses: actions/cache@v3
      with:
        path: backend/node_modules
        key: backend-deps-${{ runner.os }}-${{ hashFiles('backend/package-lock.json') }}

    - name: Install Backend Dependencies
      working-directory: ./backend
      run: npm ci

    - name: Run Backend Tests
      working-directory: ./backend
      run: npm test

    # Frontend Testing
    - name: Cache Frontend Dependencies
      uses: actions/cache@v3
      with:
        path: frontend/node_modules
        key: frontend-deps-${{ runner.os }}-${{ hashFiles('frontend/package-lock.json') }}

    - name: Install Frontend Dependencies
      working-directory: ./frontend
      run: npm ci

    - name: Run Frontend Linting
      working-directory: ./frontend
      run: npm run lint

    - name: Build Frontend
      working-directory: ./frontend
      run: npm run build

    - name: Run Frontend Tests
      working-directory: ./frontend
      run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - name: Checkout código
      uses: actions/checkout@v4

    - name: Deploy to Production
      run: |
        echo "🚀 Deploying to production..."
        # Aquí irían los comandos específicos de deployment
```

### Configuración de Staging y Production

#### Environment Variables en GitHub
```yaml
# En GitHub Secrets
SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

#### Workflow para Deployments
```yaml
name: Deploy

on:
  release:
    types: [published]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
    - name: Deploy to Staging
      run: |
        echo "Deploying to staging environment..."
        # Comandos de deployment a staging

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    
    steps:
    - name: Deploy to Production
      run: |
        echo "Deploying to production environment..."
        # Comandos de deployment a producción
```

### Quality Gates

#### Configuración de Quality Checks
```yaml
    - name: Run Quality Checks
      run: |
        # Coverage mínimo
        npm run test:coverage -- --coverage-threshold="{'global': {'branches': 80, 'functions': 80, 'lines': 80, 'statements': 80}}"
        
        # Security audit
        npm audit --audit-level moderate
        
        # Bundle size check
        npm run build
        node scripts/check-bundle-size.js
```

#### Pre-commit Hooks
```javascript
// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Linting
npm run lint

# Tests
npm test

# Build check
npm run build
```

---

## Funcionalidades Principales

### 1. Gestión de Contenido Educativo

#### Estructura Jerárquica
El sistema implementa una estructura de tres niveles:

```
📚 CURSO
├── 📖 Módulo 1
│   ├── 📹 Lección 1.1
│   ├── 📹 Lección 1.2
│   └── 📹 Lección 1.3
├── 📖 Módulo 2
│   ├── 📹 Lección 2.1
│   └── 📹 Lección 2.2
└── 📖 Módulo 3
    └── 📹 Lección 3.1
```

#### Características de Cursos
- **Metadatos Completos**: Título, slug, descripción, autor, idioma
- **Categorización**: Sistema de categorías con colores e íconos
- **Imágenes Múltiples**: Array de imágenes de portada
- **Sistema de Orden**: Ordenamiento manual personalizable
- **Control de Acceso**: Sistema de bloqueo/desbloqueo

#### Características de Módulos
- **Relación con Curso**: Pertenencia obligatoria a un curso
- **Descripción Rica**: Contenido descriptivo detallado
- **Imágenes Propias**: Array de imágenes específicas del módulo
- **Ordenamiento**: Orden personalizable dentro del curso

#### Características de Lessons
- **Video Integrado**: URL de video (YouTube, Vimeo, etc.)
- **Contenido de Soporte**: HTML rico para material adicional
- **Sistema de Goteo**: Retraso temporal para liberación progresiva
- **Ordenamiento**: Secuencia lógica dentro del módulo

### 2. Sistema de Progreso de Usuario

#### Seguimiento Granular
```javascript
const trackLessonCompletion = async (userId, lessonId) => {
  const { data, error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      is_completed: true,
      completed_at: new Date().toISOString()
    });
  
  return { data, error };
};
```

#### Cálculo de Progreso
```javascript
const calculateCourseProgress = async (userId, courseId) => {
  // Obtener todas las Lessons del curso
  const { data: lessons } = await supabase
    .from('lessons')
    .select(`
      id,
      modules!inner(
        course_id
      )
    `)
    .eq('modules.course_id', courseId);

  // Obtener progreso del usuario
  const { data: progress } = await supabase
    .from('user_progress')
    .select('lesson_id, is_completed')
    .eq('user_id', userId)
    .in('lesson_id', lessons.map(l => l.id));

  const totalLessons = lessons.length;
  const completedLessons = progress.filter(p => p.is_completed).length;
  
  return {
    total: totalLessons,
    completed: completedLessons,
    percentage: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0
  };
};
```

### 3. Sistema de Drip Content

#### Configuración de Retraso
```javascript
const checkLessonAvailability = (lesson, userProgress) => {
  if (lesson.drip_delay_minutes === 0) {
    return { available: true, reason: 'no_delay' };
  }

  // Buscar lección anterior completada
  const previousLesson = findPreviousLesson(lesson);
  if (!previousLesson) {
    return { available: true, reason: 'first_lesson' };
  }

  const previousProgress = userProgress.find(p => p.lesson_id === previousLesson.id);
  if (!previousProgress || !previousProgress.is_completed) {
    return { available: false, reason: 'previous_not_completed' };
  }

  // Calcular tiempo de espera
  const completedAt = new Date(previousProgress.completed_at);
  const availableAt = new Date(completedAt.getTime() + (lesson.drip_delay_minutes * 60000));
  const now = new Date();

  if (now < availableAt) {
    return { 
      available: false, 
      reason: 'drip_delay',
      availableAt: availableAt
    };
  }

  return { available: true, reason: 'delay_passed' };
};
```

### 4. Sistema de Favoritos Multi-tipo

#### Implementación Polimórfica
```javascript
const addToFavorites = async (userId, itemType, itemId) => {
  // Validar tipo de ítem
  const validTypes = ['course', 'module', 'lesson'];
  if (!validTypes.includes(itemType)) {
    throw new Error('Invalid item type');
  }

  // Verificar que el ítem existe
  const { data: item } = await supabase
    .from(itemType === 'course' ? 'courses' : 
          itemType === 'module' ? 'modules' : 'lessons')
    .select('id')
    .eq('id', itemId)
    .single();

  if (!item) {
    throw new Error(`${itemType} not found`);
  }

  // Añadir a favoritos
  const { data, error } = await supabase
    .from('favorites')
    .insert({
      user_id: userId,
      item_type: itemType,
      item_id: itemId
    });

  return { data, error };
};
```

#### Consulta de Favoritos
```javascript
const getUserFavorites = async (userId) => {
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      id,
      item_type,
      item_id,
      created_at
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return { error };

  // Enriquecer con datos de los ítems
  const enrichedFavorites = await Promise.all(
    data.map(async (favorite) => {
      const tableName = favorite.item_type === 'course' ? 'courses' :
                       favorite.item_type === 'module' ? 'modules' : 'lessons';
      
      const { data: itemData } = await supabase
        .from(tableName)
        .select('title, slug')
        .eq('id', favorite.item_id)
        .single();

      return {
        ...favorite,
        item_data: itemData
      };
    })
  );

  return { data: enrichedFavorites, error: null };
};
```

### 5. Panel de Administración Avanzado

#### Dashboard con Estadísticas
```javascript
const getDashboardStats = async () => {
  // Obtener estadísticas concurrentemente
  const [coursesResult, modulesResult, lessonsResult, categoriesResult] = 
    await Promise.all([
      supabase.from('courses').select('count', { count: 'exact' }),
      supabase.from('modules').select('count', { count: 'exact' }),
      supabase.from('lessons').select('count', { count: 'exact' }),
      supabase.from('categories').select('count', { count: 'exact' })
    ]);

  return {
    courses: coursesResult.count || 0,
    modules: modulesResult.count || 0,
    lessons: lessonsResult.count || 0,
    categories: categoriesResult.count || 0
  };
};
```

#### Tablas Interactivas
Las tablas del admin incluyen:
- **Paginación Avanzada**: Con navegación rápida
- **Búsqueda en Tiempo Real**: Filtrado dinámico
- **Ordenamiento**: Por múltiples columnas
- **Acciones en Línea**: Editar/Eliminar/Ver
- **Confirmaciones**: Para acciones destructivas
- **Actualización Automática**: Después de cambios

#### Modales de Edición
```javascript
const CourseModal = ({ course, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: course?.title || '',
    description: course?.description || '',
    author: course?.author || '',
    language: course?.language || '',
    category_id: course?.category_id || '',
    cover_images: course?.cover_images || []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (course?.id) {
        await api.updateCourse(course.id, formData);
      } else {
        await api.createCourse(formData);
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving course:', error);
      // Mostrar error al usuario
    }
  };

  return (
    <Modal isOpen onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {/* Campos del formulario */}
        <input 
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
        />
        {/* Más campos... */}
        
        <button type="submit">
          {course?.id ? 'Actualizar' : 'Crear'} Curso
        </button>
      </form>
    </Modal>
  );
};
```

### 6. Sistema de Categorías

#### Organización Visual
```javascript
const categorySchema = {
  name: "string (único)",
  slug: "string (URL-safe)",
  description: "text",
  color: "string (hex color #FFFFFF)",
  icon: "string (icon class/name)",
  order_index: "integer",
  is_active: "boolean"
};
```

#### Implementación con Colores
```javascript
const CategoryBadge = ({ category }) => (
  <span 
    className="px-3 py-1 rounded-full text-white text-sm font-medium"
    style={{ backgroundColor: category.color }}
  >
    {category.icon && <i className={category.icon} />}
    {category.name}
  </span>
);
```

### 7. Validación Completa con Joi

#### Esquemas de Validación
```javascript
// Validación de curso completa
const courseValidation = {
  body: Joi.object({
    title: Joi.string().min(1).max(255).required()
      .messages({
        'string.empty': 'El título es requerido',
        'string.max': 'El título no puede exceder 255 caracteres'
      }),
    
    slug: Joi.string()
      .pattern(/^[a-z0-9-]+$/)
      .max(255)
      .messages({
        'string.pattern.base': 'El slug solo puede contener letras minúsculas, números y guiones'
      }),
    
    description: Joi.string().allow('').max(2000),
    
    author: Joi.string().max(255),
    
    language: Joi.string().max(50),
    
    category_id: Joi.number().integer().positive()
      .messages({
        'number.positive': 'Debe seleccionar una categoría válida'
      }),
    
    order: Joi.number().integer().min(0).default(0),
    
    cover_images: Joi.array().items(
      Joi.string().uri().messages({
        'string.uri': 'Las imágenes deben ser URLs válidas'
      })
    ).max(5).messages({
      'array.max': 'Máximo 5 imágenes permitidas'
    }),
    
    is_locked: Joi.boolean().default(false)
  }),
  
  params: Joi.object({
    id: Joi.number().integer().positive().when('$isUpdate', {
      is: true,
      then: Joi.required()
    })
  }),
  
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
    category_id: Joi.number().integer().positive(),
    is_locked: Joi.boolean(),
    search: Joi.string().max(255)
  })
};
```

### 8. Sistema de Subida de Imágenes

#### Componente ImageUpload
```javascript
const ImageUpload = ({ onImagesChange, existingImages = [], maxImages = 5 }) => {
  const [images, setImages] = useState(existingImages);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (files) => {
    if (images.length + files.length > maxImages) {
      alert(`Máximo ${maxImages} imágenes permitidas`);
      return;
    }

    setUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} no es una imagen válida`);
        }
        
        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} es muy grande (máximo 5MB)`);
        }

        // Subir a Supabase Storage
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('course-images')
          .upload(fileName, file);
          
        if (error) throw error;
        
        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('course-images')
          .getPublicUrl(fileName);
          
        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const newImages = [...images, ...uploadedUrls];
      
      setImages(newImages);
      onImagesChange(newImages);
      
    } catch (error) {
      console.error('Error uploading images:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove) => {
    const newImages = images.filter((_, index) => index !== indexToRemove);
    setImages(newImages);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Area */}
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          {uploading ? (
            <div>Subiendo imágenes...</div>
          ) : (
            <div>
              <p>Arrastra imágenes aquí o haz clic para seleccionar</p>
              <p className="text-sm text-gray-500 mt-2">
                Máximo {maxImages} imágenes, hasta 5MB cada una
              </p>
            </div>
          )}
        </label>
      </div>

      {/* Preview de imágenes */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <img 
                src={imageUrl} 
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## Conclusión

**EDU WEB** representa una solución completa y robusta para la gestión de contenido educativo, implementada con tecnologías modernas y mejores prácticas de desarrollo. El proyecto incluye:

### ✅ **Características Técnicas Destacadas**
- **Arquitectura Escalable**: Separación clara frontend/backend
- **Base de Datos Robusta**: Esquema relacional bien diseñado
- **API RESTful Completa**: 20+ endpoints con validación completa
- **Interfaz Moderna**: React con Tailwind CSS y componentes reutilizables
- **Autenticación Segura**: Integración completa con Supabase Auth
- **Testing Automatizado**: Jest y CI/CD con GitHub Actions
- **Documentación Completa**: Código bien documentado y estructurado

### ✅ **Funcionalidades de Negocio Avanzadas**
- **Gestión Jerárquica**: Sistema Curso → Módulo → Lección
- **Drip Content**: Liberación temporal de contenido
- **Progreso Granular**: Seguimiento detallado por usuario
- **Sistema de Favoritos**: Multi-tipo y personalizable
- **Panel Admin Completo**: Gestión visual e intuitiva
- **Categorización**: Organización con colores e íconos
- **Subida de Imágenes**: Sistema drag-drop integrado

### 🎯 **Listo para Producción**
El proyecto está completamente implementado y listo para ser desplegado en producción, con todas las características de una aplicación empresarial moderna:

- **Seguridad**: Headers de seguridad, validación completa, sanitización
- **Performance**: Optimizaciones de build, caching, compresión
- **Monitoreo**: Health checks, logging estructurado, error tracking  
- **Escalabilidad**: Arquitectura preparada para crecimiento
- **Mantenibilidad**: Código limpio, testing, documentación completa

Esta documentación proporciona a cualquier desarrollador toda la información necesaria para entender, mantener y extender el proyecto **EDU WEB** de **EVO GLOBAL**.