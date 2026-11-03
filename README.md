# Red de Iglesias de Mérida — Plataforma Web & Sistema de Gestión (ChMS)

[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_PostgreSQL-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![pnpm](https://img.shields.io/badge/pnpm-12.3-orange?style=flat-square&logo=pnpm)](https://pnpm.io/)

Plataforma web integral y sistema de gestión parroquial multi-sede (*multi-tenant*) diseñado para la preservación, difusión y administración del patrimonio sacro, acervo histórico documental y operaciones litúrgicas y financieras de la **Red de Iglesias Históricas de Mérida, Yucatán**.

---

## 🏛️ Descripción General

El sistema unifica en una sola solución modular dos experiencias interconectadas:

1. **Portal Ciudadano & Cultural (Acceso Público):** Espacio digital para consultar la historia, arquitectura, acervo patrimonial sacro, documentos históricos digitalizados en PDF y horarios de culto de los templos de Mérida.
2. **Panel Administrativo Parroquial (ChMS & Archivo):** Entorno protegido con control de acceso por roles (RBAC) y aislamiento estricto por iglesia (*Row Level Security*), permitiendo gestionar documentos antiguos, intenciones de misa con hojas imprimibles para el altar, finanzas, criptas/urnas y tarifas de servicios.

---

## ✨ Características Principales

### 1. Portal Público de la Red de Iglesias
* **Portada de la Red (`/`):** Vista panorámica de las sedes con selector interactivo, horarios de misa del día y accesos directos al acervo cultural.
* **Fichas de Sede (`/iglesias/[slug]`):** Perfil individual de cada iglesia con reseña histórica, galería fotográfica, coordenadas, horarios de servicios litúrgicos y tarifas públicas.
* **Archivo Histórico Digitalizado (`/archivo`):** Catálogo de documentos antiguos y expedientes con **visor PDF integrado** (`pdf.js`), filtros por siglo/tipo de documento y buscador de texto.
* **Patrimonio Sacro & Imaginería (`/patrimonio`):** Registro catalogado de objetos litúrgicos de valor artístico/histórico y directorio de santos patronos con reseñas devocionales.
* **Buscador de Horarios de Culto (`/horarios`):** Localizador de misas dominicales, misas diarias, confesiones, bautizos y catequesis con alertas de excepciones por solemnidades.
* **Tarifario de Servicios Parroquiales (`/iglesias/[slug]/servicios`):** Consulta transparente de aportaciones sugeridas para sacramentos (bautizos, matrimonios, XV años, intenciones).
* **Búsqueda Global (`/buscar`):** Motor de búsqueda indexado sobre documentos, patrimonio e iglesias.
* **Experiencia de Usuario:** Diseño tipográfico editorial (*Cormorant Garamond* y *Manrope*), tema claro/oscuro persistente y optimización SEO (`sitemap.xml`, `robots.txt`).

---

### 2. Panel Administrativo Parroquial Multi-Tenant (`/panel`)

#### Control de Acceso Basado en Roles (RBAC por Sede y de Red)
* **`super_admin`:** Control total de la red, gestión de todas las sedes (`/panel/red/iglesias`), consolidado financiero global y administración de usuarios.
* **`parroco`:** Supervisión integral de su parroquia (historia, finanzas, intenciones, urnas y patrimonio).
* **`vicario`:** Apoyo pastoral y administrativo de la sede asignada.
* **`secretaria`:** Gestión de horarios, intenciones de misa, eventos y catálogo de servicios.
* **`tesorero`:** Control de ingresos (colectas, diezmos, donativos, intenciones, urnas), egresos, contratos de criptas y balances mensuales.
* **`archivista`:** Catalogación de documentos históricos, carga de archivos PDF con metadatos y supervisión de cola OCR.
* **`consulta`:** Acceso de solo lectura para investigación o auditoría interna.

#### Módulos Operativos
* **Dashboard Parroquial (`/panel/[slug]`):** Métricas clave en tiempo real, misas activas del día, balance del mes y estado del archivo.
* **Archivo y Documentos (`/panel/[slug]/documentos`):** Subida de manuscritos y actas, control de visibilidad (*Público*, *Interno*, *Reservado*), registro de auditoría de descargas y simulación de procesamiento OCR.
* **Patrimonio y Santos (`/panel/[slug]/patrimonio` y `.../santos`):** Inventario de bienes muebles sacros (con avalúo protegido por RLS visible únicamente para administración) e imágenes religiosas.
* **Horarios y Calendario Litúrgico (`/panel/[slug]/horarios`):** Programación semanal recurrente y excepciones específicas (cancelaciones o misas especiales por fiesta patronal).
* **Intenciones de Misa (`/panel/[slug]/intenciones`):**
  * Registro de sufragios (difuntos), acción de gracias y peticiones de salud.
  * Vinculación automática con el libro contable de estipendios.
  * **Hoja Imprimible para el Altar:** Generación de guion limpio y tipográfico listo para imprimir y entregar al sacerdote celebrante.
* **Criptas y Urnas (`/panel/[slug]/urnas`):**
  * Control de nichos y capacidades.
  * Registro de contratos por temporalidad o perpetuidad.
  * Registro de difuntos y seguimiento de pagos totales o parciales con alerta de adeudos.
* **Finanzas Parroquiales (`/panel/[slug]/finanzas`):**
  * Libro de ingresos categorizado (colectas, donativos, estipendios de misa, contratos de urnas).
  * Control de egresos y balance mensual neto.
  * Generación y exportación de reportes a formato **CSV/Excel** (UTF-8 con BOM).
* **Consolidado de Red (`/panel/red`):** Conmutador entre sedes y métricas financieras agregadas para la diócesis o administración central.

---

## 🏛️ Sedes Integradas (Mérida, Yucatán)

El sistema soporta escalabilidad dinámica de iglesias y viene precargado con 10 sedes históricas:

| # | Iglesia | Slug |
|---|---|---|
| 1 | Catedral de San Ildefonso | `catedral-san-ildefonso` |
| 2 | Iglesia de Jesús (Tercera Orden) | `jesus-tercera-orden` |
| 3 | Iglesia de la Candelaria | `la-candelaria` |
| 4 | Iglesia de Santa Lucía | `santa-lucia` |
| 5 | Iglesia de San Juan de Dios | `san-juan-de-dios` |
| 6 | Iglesia de Santa Ana | `santa-ana` |
| 7 | Iglesia de La Mejorada | `la-mejorada` |
| 8 | Iglesia de San Cristóbal | `san-cristobal` |
| 9 | Iglesia de Santiago | `santiago` |
| 10 | Ermita de Santa Isabel | `santa-isabel` |

---

## 🛠️ Stack Tecnológico

* **Framework:** [Next.js 16.4.3](https://nextjs.org/) (App Router, Turbopack)
* **Librería UI:** [React 19](https://react.dev/)
* **Lenguaje:** [TypeScript 5.7](https://www.typescriptlang.org/)
* **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/) & `tw-animate-css`
* **Componentes UI:** [shadcn/ui](https://ui.shadcn.com/) / [Base UI](https://base-ui.com/)
* **Iconografía:** [Lucide React](https://lucide.dev/)
* **Visualización de Datos:** [Recharts 3.8](https://recharts.org/)
* **Visor de Manuscritos:** [PDF.js](https://mozilla.github.io/pdf.js/) (`pdfjs-dist`)
* **Base de Datos & Seguridad:** [Supabase](https://supabase.com/) (PostgreSQL 15+, Row Level Security, Storage Buckets, Edge Functions)
* **Gestor de Paquetes:** [pnpm](https://pnpm.io/)

---

## 🚀 Inicio Rápido y Ejecución

El proyecto está preparado para ejecutarse en dos modalidades: **Modo Prototipo / Demostración** (sin necesidad de configurar base de datos) o **Modo Producción con Supabase** (con persistencia real y seguridad RLS).

### Requisitos Previos
* [Node.js](https://nodejs.org/) v20.9 o superior
* [pnpm](https://pnpm.io/) v9 o superior (o `npx pnpm`)

---

### Opción A: Modo Prototipo / Demostración (Recomendado para revisión rápida)

Este modo utiliza un catálogo completo de datos semilla tipados (`lib/mock/seed.ts`), simula operaciones en memoria y `localStorage`, y habilita botones de acceso rápido con un clic para todos los roles.

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/YADIERPT/Web-app-Iglesia.git
   cd Web-app-Iglesia
   ```

2. **Instalar dependencias:**
   ```bash
   pnpm install
   ```

3. **Configurar el entorno en modo demo:**
   Copia el archivo de variables y activa el modo prototipo:
   ```bash
   cp .env.example .env.local
   ```
   Asegúrate de que en `.env.local` esté configurado:
   ```env
   NEXT_PUBLIC_DEMO_MODE=true
   ```

4. **Iniciar el servidor de desarrollo:**
   ```bash
   pnpm dev
   ```

5. **Abrir en el navegador:**
   Visita [http://localhost:3000](http://localhost:3000).
   * **Sitio público:** Navega por la portada, iglesias, archivo con visor PDF, patrimonio y horarios.
   * **Acceso al Panel:** Ve a `/ingresar` y utiliza los botones directos de acceso de prueba (*Administrador*, *Archivista*, *Tesorero*, *Consulta*).

---

### Opción B: Modo Producción con Supabase (Persistencia y RLS real)

1. **Clonar e instalar dependencias:**
   ```bash
   git clone https://github.com/YADIERPT/Web-app-Iglesia.git
   cd Web-app-Iglesia
   pnpm install
   ```

2. **Configurar variables de entorno (`.env.local`):**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu-anon-key
   NEXT_PUBLIC_DEMO_MODE=false
   ```

3. **Aplicar migraciones de la base de datos:**
   Con [Supabase CLI](https://supabase.com/docs/guides/cli):
   ```bash
   # Si utilizas Supabase local con Docker:
   supabase start
   supabase db reset

   # Si vinculas un proyecto remoto de Supabase:
   supabase link --project-ref TU_PROYECTO_REF
   supabase db push
   ```

4. **Desplegar la Edge Function para alta de usuarios:**
   ```bash
   supabase secrets set APP_ORIGIN=http://localhost:3000
   supabase functions deploy create-user
   ```

5. **Cuentas de prueba preconfiguradas para entorno local:**
   Al aplicar el seed de desarrollo (`supabase/seed.sql`), quedan disponibles las siguientes cuentas de prueba:

   | Correo | Contraseña | Rol Asignado | Sede / Ámbito |
   |---|---|---|---|
   | `admin@iglesia.local` | `IglesiaLocal2026!` | `super_admin` | Red completa de iglesias |
   | `parroco@iglesia.local` | `IglesiaLocal2026!` | `parroco` | Catedral de San Ildefonso |
   | `vicario@iglesia.local` | `IglesiaLocal2026!` | `vicario` | Catedral de San Ildefonso |
   | `secretaria@iglesia.local` | `IglesiaLocal2026!` | `secretaria` | Catedral de San Ildefonso |
   | `tesorero@iglesia.local` | `IglesiaLocal2026!` | `tesorero` | Catedral de San Ildefonso |
   | `archivista@iglesia.local` | `IglesiaLocal2026!` | `archivista` | Catedral de San Ildefonso |
   | `consulta@iglesia.local` | `IglesiaLocal2026!` | `consulta` | Catedral de San Ildefonso |

6. **Iniciar el servidor:**
   ```bash
   pnpm dev
   ```

---

## 🔒 Arquitectura de Seguridad y Pruebas RLS

La plataforma implementa una política de **Row Level Security (RLS)** exhaustiva en PostgreSQL para garantizar que:
* Usuarios no autenticados solo lean contenido expresamente marcado como `publico` y `publicado`.
* El personal de una iglesia no pueda consultar ni modificar datos, finanzas o documentos privados de otra sede.
* Datos sensibles (como el avalúo económico de objetos sacros o datos de contratos de urnas) no sean accesibles públicamente ni viajen a clientes no autorizados.

Para verificar la integridad de las políticas de seguridad:
```bash
# Ejecutar suite de pruebas de aislamiento RLS
supabase db query --file supabase/tests/phase-1-foundation.sql
supabase db query --file supabase/tests/phase-5-finance-isolation.sql
supabase db query --file supabase/tests/phase-6-public-isolation.sql
```

---

## 📂 Estructura del Directorio

```text
Web-app-Iglesia/
├── app/
│   ├── layout.tsx                   # Layout raíz con proveedores (Theme, ChurchStore)
│   ├── globals.css                  # Variables de diseño, tokens OKLCH y Tailwind v4
│   ├── page.tsx                     # Portada de la Red de Iglesias
│   ├── acerca/                      # Página institucional y objetivos del acervo
│   ├── archivo/                     # Catálogo y visor de documentos históricos
│   ├── buscar/                      # Búsqueda global en el acervo
│   ├── horarios/                    # Buscador público de misas y cultos
│   ├── patrimonio/                  # Catálogo de objetos sacros e imaginería
│   ├── iglesias/[slug]/             # Fichas individuales por templo
│   │   ├── horarios/                # Horarios específicos de la sede
│   │   └── servicios/               # Tarifario parroquial público
│   ├── ingresar/                    # Inicio de sesión con selector de demo
│   ├── panel/                       # Panel administrativo
│   │   ├── page.tsx                 # Enrutador inteligente según rol del usuario
│   │   ├── [slug]/                  # Módulos administrativos por sede (finanzas, intenciones, etc.)
│   │   └── red/                     # Consolidado de red y gestión de sedes
│   ├── robots.ts                    # Configuración para motores de búsqueda
│   └── sitemap.ts                   # Mapa del sitio dinámico para SEO
├── components/
│   ├── auth/                        # Componente de autenticación y acceso demo
│   ├── panel/                       # Vistas modulares del panel (dashboard, finanzas, urnas, etc.)
│   ├── site/                        # Componentes del portal público (visores, tarjetas, shell)
│   └── ui/                          # Componentes base de interfaz (shadcn / Base UI)
├── lib/
│   ├── data/                        # Capa unificada de abstracción de datos
│   ├── mock/                        # Semilla y generadores de datos muestra para modo demo
│   ├── permissions.ts               # Matriz de permisos RBAC
│   ├── store.tsx                    # Contexto global y gestión de sesión
│   ├── supabase.ts                  # Cliente del navegador para Supabase
│   └── types.ts                     # Definiciones e interfaces de TypeScript
├── public/                          # Recursos estáticos, imágenes de templos y documentos muestra
└── supabase/
    ├── functions/create-user/       # Edge Function para creación protegida de cuentas
    ├── migrations/                  # Migraciones SQL incrementales con RLS
    ├── seed.sql                     # Datos semilla para desarrollo local
    └── tests/                       # Suite de pruebas automatizadas SQL de seguridad RLS
```

---

## 📦 Scripts Disponibles

* `pnpm dev`: Inicia el entorno de desarrollo local con Turbopack.
* `pnpm build`: Compila y valida los tipos de TypeScript y rutas para producción.
* `pnpm start`: Inicia el servidor de producción optimizado.

---

## 📄 Licencia

Este proyecto es de uso exclusivo y reservado para la conservación patrimonial y administración de la red parroquial. Todos los derechos reservados.
