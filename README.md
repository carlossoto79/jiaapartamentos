# JIA Apartamentos - Sistema de Seguimiento de Mantenimiento

Sistema web para gestionar y dar seguimiento a reparaciones y mantenimiento en apartamentos en arriendo en Colombia.

## 🎯 Características

✅ **Registro de unidades** - Lista de 75+ apartamentos  
✅ **Tickets de mantenimiento** - Crear, editar y seguimiento de boletas  
✅ **Detección de problemas repetidos** - Alertas automáticas cuando se repite un daño  
✅ **Gestión de costos** - Registro de mano de obra y materiales en COP  
✅ **Adjuntos** - Fotos antes/después y recibos  
✅ **Búsqueda y filtros** - Buscar por unidad, categoría, fecha, costo  
✅ **Exportación a CSV** - Para contabilidad  
✅ **100% en español** - Totalmente localizado para Colombia  

## 🛠️ Stack Técnico

- **Frontend:** React + Vite (⚡ Ultra rápido)
- **Backend:** Supabase (PostgreSQL + Auth)
- **Hosting:** Vercel (automático desde GitHub)
- **Autenticación:** Magic link (sin contraseñas)

## 📋 Prerrequisitos

- Cuenta de GitHub
- Cuenta de Supabase (gratis)
- Navegador moderno

## 🚀 Instalación Rápida

### 1. Clonar el repositorio y preparar localmente

```bash
git clone https://github.com/tu-usuario/jia-apartamentos.git
cd jia-apartamentos

npm install
npm run dev
```

La app abrirá en http://localhost:5173

### 2. Configurar Supabase

#### 2.1 Crear proyecto en Supabase
- Ir a https://supabase.com
- Crear un nuevo proyecto (nombre: "JIA-apartamentos")
- Copiar `Project URL` y `Anon Key`

#### 2.2 Ejecutar SQL para crear tablas
- En Supabase, ir a **SQL Editor**
- Crear nueva consulta
- Copiar todo el contenido de `supabase_schema.sql`
- Ejecutar (botón ▶)

Esto crea:
- Tabla `units` (apartamentos)
- Tabla `tickets` (boletas)
- Tabla `ticket_attachments` (fotos y recibos)
- Storage buckets (`maintenance-photos`, `maintenance-receipts`)
- RLS policies (seguridad)

#### 2.3 Configurar variables de entorno localmente
- Copiar `.env.local.example` a `.env.local`
- Reemplazar con tus valores de Supabase:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-aqui
```

#### 2.4 Crear Storage buckets en Supabase
- En Supabase, ir a **Storage**
- Crear bucket público: `maintenance-photos`
- Crear bucket público: `maintenance-receipts`

### 3. Desplegar en Vercel (automático desde GitHub)

#### 3.1 Crear repositorio en GitHub
```bash
git remote set-url origin https://github.com/tu-usuario/jia-apartamentos.git
git push origin main
```

#### 3.2 Conectar Vercel
- Ir a https://vercel.com/new
- Conectar GitHub
- Seleccionar repo `jia-apartamentos`
- En **Environment Variables**, agregar:
  ```
  VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
  VITE_SUPABASE_ANON_KEY=tu-clave-anon-aqui
  ```
- Click "Deploy"

¡Listo! Vercel te dará una URL como `jia-apartamentos.vercel.app`

Cada vez que hagas `git push`, Vercel redeploya automáticamente.

## 📱 Usar la app

### Login
- Ingresa correo (ej: carlossoto79@gmail.com)
- Se envía enlace mágico a tu correo
- Abre el enlace → entra al sistema (¡sin contraseña!)

### Navegación principal
- **📊 Dashboard** - Resumen y alertas
- **➕ Nueva Boleta** - Crear ticket
- **🔍 Buscar** - Filtrar y exportar
- **📋 Unidades** - Registro de apartamentos

### Crear una boleta
1. Click "Nueva Boleta"
2. Seleccionar unidad (ej: 4B)
3. ⚠️ **Verás alertas automáticas** si el problema se repitió
4. Seleccionar categoría (plomería, eléctrico, etc.)
5. Describir el problema
6. Agregar costos (mano de obra + materiales)
7. Crear boleta

### Gestionar una boleta
- Click en boleta para ver/editar
- Cambiar estado: Abierto → Asignado → Reparado → Verificado
- Agregar fotos antes/después
- Adjuntar recibos
- Solicitar verificación de inmobiliaria

### Buscar y exportar
- Filtrar por unidad, fecha, costo, categoría
- Click "Exportar a CSV"
- Archivo listo para tu contador

## 📊 Base de datos

### Tablas principales
```
units (apartamentos)
├─ id
├─ unit_number (ej: "4B")
├─ building (ej: "Edificio Norte")
├─ floor (piso)
└─ notes (notas)

tickets (boletas)
├─ id
├─ unit_id (referencia)
├─ report_date
├─ category (plomería, eléctrico, etc.)
├─ description
├─ status (abierto/asignado/reparado/verificado)
├─ labor_cost (COP)
├─ materials_cost (COP)
├─ tax_amount (auto-calculado)
└─ verification_status

ticket_attachments
├─ ticket_id
├─ type (foto|recibo)
└─ file_url
```

## 🔒 Seguridad

- ✅ Autenticación con magic link (Supabase Auth)
- ✅ Row-level security (RLS) en todas las tablas
- ✅ HTTPS automático (Vercel + Supabase)
- ✅ Solo usuario autenticado puede ver datos
- ✅ Recibos y fotos en buckets seguros

## 🌐 Dominio personalizado (opcional)

Si quieres tu propio dominio en lugar de `vercel.app`:

1. Comprar dominio (GoDaddy, Namecheap, etc.)
2. En Vercel, ir a **Settings** → **Domains**
3. Agregar tu dominio
4. Seguir instrucciones para DNS
5. Listo en ~5 minutos

## 📈 Próximas mejoras (Fase 2+)

- [ ] Formulario para inmobiliaria (registrar tickets directamente)
- [ ] Recordatorios de mantenimiento preventivo
- [ ] Reportes gráficos (gasto por mes, trabajador, etc.)
- [ ] Integración con WhatsApp
- [ ] Historial de cambios con auditoría

## 🐛 Troubleshooting

### "Error: Missing Supabase credentials"
- Verificar `.env.local` existe con valores correctos
- Reiniciar servidor (`npm run dev`)

### "Error uploading file"
- Verificar buckets públicos creados en Supabase
- Verificar RLS policies configuradas

### "Auth email not received"
- Revisar spam
- En Supabase, verificar email provider está habilitado

## 📞 Soporte

Preguntas o problemas:
- Revisar logs en navegador (F12 → Console)
- Verificar Supabase dashboard
- Contactar al desarrollador

## 📄 Licencia

Privado - Solo para JIA Apartamentos

---

**Creado para:** Sistema de mantenimiento de apartamentos en Colombia  
**Última actualización:** Junio 2024
