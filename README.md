# Frontend — Evaluación Grupal

Next.js 14 · Tailwind CSS · Google OAuth · Se despliega en Vercel.

---

## Instalación local

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env.local

# 3. Completar .env.local con tus valores
#    NEXT_PUBLIC_API_URL       → URL del backend (Railway)
#    NEXT_PUBLIC_GOOGLE_CLIENT_ID → Client ID de Google Cloud

# 4. Iniciar en modo desarrollo
npm run dev
# → http://localhost:3000
```

---

## Estructura del proyecto

```
frontend/
├── app/
│   ├── layout.js           ← layout raíz (GoogleOAuthProvider + AuthProvider)
│   ├── page.js             ← landing page / login con Google
│   ├── globals.css
│   ├── docente/
│   │   ├── layout.js       ← protege rutas con rol 'docente'
│   │   ├── page.js         ← panel principal (sesiones + historial)
│   │   ├── alumnos/
│   │   │   └── page.js     ← gestión de lista de alumnos + subir CSV
│   │   ├── sesiones/
│   │   │   ├── nueva/
│   │   │   │   └── page.js ← crear nueva sesión
│   │   │   └── [id]/
│   │   │       └── page.js ← dashboard de resultados de una sesión
│   └── alumno/
│       ├── layout.js       ← protege rutas con rol 'alumno'
│       ├── page.js         ← inicio (sesión activa + historial)
│       ├── grupo/
│       │   └── page.js     ← formar o ver grupo
│       └── evaluar/
│           └── page.js     ← formulario de evaluación
├── components/
│   ├── ProtegerRuta.js     ← HOC de autenticación y roles
│   ├── NavBar.js           ← barra de navegación superior
│   └── ui.js               ← Badge, Spinner, AlertaError, etc.
└── lib/
    ├── api.js              ← cliente HTTP centralizado
    └── AuthContext.js      ← contexto global de usuario
```

---

## Módulos pendientes (siguientes pasos)

Los layouts y la base están listos. Los módulos de páginas se construyen uno por uno:

1. `app/docente/page.js`            — panel principal del docente
2. `app/docente/alumnos/page.js`    — subir CSV y gestionar lista
3. `app/docente/sesiones/nueva/page.js` — crear sesión
4. `app/docente/sesiones/[id]/page.js`  — dashboard de resultados
5. `app/alumno/page.js`             — inicio del alumno
6. `app/alumno/grupo/page.js`       — formar grupo
7. `app/alumno/evaluar/page.js`     — formulario de evaluación

---

## Despliegue en Vercel

1. Subir el proyecto a GitHub
2. Ir a [vercel.com](https://vercel.com) → New Project → importar repo
3. En Environment Variables agregar:
   - `NEXT_PUBLIC_API_URL` → URL de Railway del backend
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` → Client ID de Google
4. Vercel detecta Next.js automáticamente y despliega

Cada `git push` a `main` publica automáticamente.
