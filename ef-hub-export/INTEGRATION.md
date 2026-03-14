# Integración del módulo Gestión en el EF Hub

## Qué es
El módulo **Gestión** (ex-Benja/Control Hub) es un panel de control operativo y financiero semanal con IA integrada (Centro). Se integra como una ruta más dentro del EF Hub.

## Estructura de archivos

Copiá estos archivos a tu proyecto EF Hub:

```
ef-hub-export/
├── app/(hub)/gestion/          → src/app/(hub)/gestion/
│   ├── layout.jsx              (sub-nav del módulo)
│   ├── page.jsx                (dashboard con KPIs)
│   ├── plan/page.jsx           (planificación semanal)
│   ├── operativo/page.jsx      (tracking de tareas)
│   ├── financiero/page.jsx     (ingresos y gastos)
│   └── centro/page.jsx         (chat IA)
├── api/gestion/                → src/app/api/gestion/
│   └── centro/chat/route.ts    (endpoint streaming Claude)
├── lib/gestion/                → src/lib/gestion/
│   ├── styles.js               (inline styles compartidos)
│   ├── system-prompt.ts        (personalidad de Centro)
│   └── context-builder.ts      (construye contexto para IA)
├── types/gestion.ts            → src/types/gestion.ts
├── supabase/gestion_schema.sql → ejecutar en Supabase
└── gestion-variables.css       → merge con globals.css
```

## Pasos de integración

### 1. Base de datos
Ejecutá `supabase/gestion_schema.sql` en tu proyecto Supabase.
Las tablas están prefijadas con `gestion_` para no pisar las existentes.

### 2. CSS Variables
Revisá `gestion-variables.css`. Si tu EF Hub ya tiene variables equivalentes
(ej: `--color-bg`, `--color-surface`), no necesitás agregar nada.
Si no, mergealas en tu `globals.css`.

### 3. Copiar archivos
Copiá las carpetas a las ubicaciones indicadas arriba.

### 4. Agregar a la navegación del Hub
En tu Sidebar.jsx, agregá un item para Gestión:

```jsx
{ href: "/gestion", label: "Gestión", icon: "chart-bar" }
```

### 5. Variables de entorno
Asegurate de tener en tu `.env`:
```
ANTHROPIC_API_KEY=tu_api_key
```
(Supabase URL y keys ya deberían estar configuradas en el Hub)

### 6. Dependencia
El módulo usa `@anthropic-ai/sdk` para el chat de Centro.
Si no la tenés:
```bash
npm install @anthropic-ai/sdk
```

## Notas importantes

- **Sin Tailwind**: Todo usa inline styles via `lib/gestion/styles.js`
- **Sin shadcn/ui**: Componentes UI están inline, sin dependencias externas
- **Dark mode**: Funciona con `data-theme="dark"` en el HTML
- **RLS**: Las policies de Supabase ya están incluidas en el schema
- **Prefijo**: Todas las tablas usan `gestion_` para evitar conflictos
- **Auth**: Usa la autenticación existente del EF Hub (Supabase Auth)

## Permisos
Este módulo es solo para Diego (admin). Para restringir acceso, podés:
- Checkear el `user_id` en el layout contra una lista de admins
- Usar tags de GHL como hacés con los otros módulos
