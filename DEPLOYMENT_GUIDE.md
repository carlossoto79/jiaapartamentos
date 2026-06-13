# 🚀 Guía de Despliegue - JIA Apartamentos

Sigue estos pasos exactos para tener el sistema funcionando completamente.

## PASO 1: Configurar Supabase (10 minutos)

### 1.1 Crear cuenta en Supabase
1. Ir a https://supabase.com
2. Click "Sign Up" → Usar GitHub o email
3. Crear organización (ej: "JIA")

### 1.2 Crear nuevo proyecto
1. Click "New Project"
2. **Name:** JIA-apartamentos
3. **Database Password:** Usa algo seguro (ej: JIA2024ApartamentosDB!)
4. **Region:** Dejar default
5. Esperar ~2 minutos a que se cree

### 1.3 Copiar credenciales
1. Ir a **Project Settings** → **API**
2. Copiar y guardar:
   - `Project URL` (ej: `https://xxxxx.supabase.co`)
   - `anon public` key (ej: `eyJhbGciOi...`)
3. **IMPORTANTE:** Guarda estos valores, los necesitarás después

### 1.4 Crear las tablas de base de datos
1. En Supabase, ir a **SQL Editor** (lado izquierdo)
2. Click "New Query"
3. Copiar todo el contenido del archivo `supabase_schema.sql`
4. Pegarlo en el editor
5. Click **▶ Run** (botón verde arriba)
6. Esperar a que complete ✅

### 1.5 Crear Storage buckets
1. Ir a **Storage** (lado izquierdo)
2. Click **Create a new bucket**
   - Name: `maintenance-photos`
   - Make it public: ✅ SÍ
   - Create bucket
3. Repetir para `maintenance-receipts`
   - Name: `maintenance-receipts`
   - Make it public: ✅ SÍ
   - Create bucket

**Resultado esperado:** 2 buckets públicos creados ✅

---

## PASO 2: Configuración Local (10 minutos)

### 2.1 Preparar proyecto en tu computadora

```bash
# Abrir terminal en la carpeta del proyecto
cd ~/jia-apartamentos

# Instalar dependencias
npm install

# Esto descarga React, Vite, y todo lo necesario (~200MB)
```

### 2.2 Crear archivo de variables de entorno

1. En la carpeta raíz (`jia-apartamentos/`), crear archivo `.env.local`
2. Copiar esto (reemplaza con tus valores de Supabase):

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

3. Guardar archivo

**IMPORTANTE:** Este archivo NO va a GitHub (está en `.gitignore`)

### 2.3 Probar localmente

```bash
npm run dev
```

Abrirá http://localhost:5173 en el navegador.

**Pruebas:**
1. Ingresa tu email (ej: carlossoto79@gmail.com)
2. Revisa tu bandeja de entrada
3. Click en enlace del email
4. ¡Deberías ver el Dashboard! ✅

Si hay error:
- Revisar console del navegador (F12 → Console)
- Verificar `.env.local` tiene valores correctos
- Reiniciar servidor (Ctrl+C, luego `npm run dev` de nuevo)

---

## PASO 3: GitHub (5 minutos)

### 3.1 Crear repositorio en GitHub

1. Ir a https://github.com/new
2. **Repository name:** `jia-apartamentos`
3. **Description:** Sistema de mantenimiento de apartamentos
4. Seleccionar **Public** (para poder usar Vercel gratis)
5. Click "Create repository"

### 3.2 Subir código

```bash
# En terminal, en la carpeta del proyecto:

git config --global user.email "tu-email@ejemplo.com"
git config --global user.name "Tu Nombre"

git init
git add .
git commit -m "Initial commit: Sistema de mantenimiento"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/jia-apartamentos.git
git push -u origin main
```

**Resultado:** Tu código está en GitHub ✅

---

## PASO 4: Desplegar en Vercel (5 minutos)

### 4.1 Conectar Vercel

1. Ir a https://vercel.com/new
2. Autorizar con GitHub
3. Buscar `jia-apartamentos`
4. Click "Import"

### 4.2 Configurar variables de entorno

1. **Environment Variables:** Agregar:
   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   ```
   (Usa los mismos valores que en `.env.local`)

2. Click "Deploy"

**Esperado:** Vercel construye y despliega (~2 minutos)

### 4.3 Tu URL en vivo

Vercel te da una URL como:
```
https://jia-apartamentos.vercel.app
```

¡YA ESTÁ EN PRODUCCIÓN! 🎉

---

## PASO 5: Probar Sistema Completo (15 minutos)

### 5.1 Crear unidades de prueba

1. Ir a la app (https://jia-apartamentos.vercel.app)
2. Login con tu email
3. Ir a **📋 Unidades**
4. Las unidades ya están precargadas (4B, 7C, 12, 3A, 5D)

### 5.2 Crear una boleta de prueba

1. Click **➕ Nueva Boleta**
2. Seleccionar unidad: "4B"
3. Categoría: "Plomería"
4. Descripción: "Test - Gotera en baño"
5. Mano de obra: 150000
6. Materiales: 85000
7. Crear boleta ✅

### 5.3 Verificar repetición automática

1. Click **➕ Nueva Boleta** de nuevo
2. Seleccionar unidad: "4B"
3. Categoría: "Plomería"
4. **DEBE APARECER ALERTA** ⚠️ sobre la boleta anterior

Este es el core del sistema funcionando ✅

### 5.4 Subir fotos

1. Buscar la boleta creada
2. Click **Ver**
3. Agregar foto "Antes"
4. Agregar foto "Después"
5. Las fotos aparecen en **🔗 Fotos** ✅

### 5.5 Buscar y exportar

1. Click **🔍 Buscar**
2. Debería mostrar las boletas que creaste
3. Click **Exportar a CSV**
4. Descarga un archivo `boletas-FECHA.csv` ✅

---

## PASO 6: Mantenimiento (Ongoing)

### Cambios locales → Vercel automático

```bash
# Hacer cambio en código
# Editar archivo

git add .
git commit -m "Descripción del cambio"
git push origin main
```

**Vercel redeploya automáticamente** (~1 minuto) ✅

### Ver logs en Vercel

1. Ir a https://vercel.com
2. Seleccionar proyecto `jia-apartamentos`
3. Tab **Deployments**
4. Click deployment → **Logs**

---

## 🎯 Checklist Final

- [ ] Supabase proyecto creado
- [ ] Tablas SQL ejecutadas
- [ ] Storage buckets creados
- [ ] `.env.local` configurado
- [ ] `npm run dev` funciona localmente
- [ ] GitHub repo creado
- [ ] Código subido a GitHub
- [ ] Vercel desplegado
- [ ] URL en vivo funciona
- [ ] Puedo crear boletas
- [ ] Alertas de repetición funcionan
- [ ] Puedo subir fotos
- [ ] Puedo exportar a CSV

Si todo está ✅, ¡**Sistema listo para producción!**

---

## 🆘 Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| "Missing env vars" | Verificar `.env.local` existe y tiene valores correctos |
| "Can't upload files" | Verificar buckets públicos en Supabase Storage |
| "Auth email error" | Revisar spam, o re-crear en Supabase Email Templates |
| "Database connection error" | Verificar Supabase project está "Active" |
| "Vercel deployment fails" | Ver logs en Vercel, generalmente es variable de entorno |

---

## 📞 ¿Preguntas?

Si algo no funciona:
1. Revisar console del navegador (F12)
2. Revisar logs de Vercel
3. Verificar dashboard de Supabase
4. Contactar desarrollador con screenshot del error

¡Éxito! 🚀
