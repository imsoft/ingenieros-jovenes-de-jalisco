---
name: supabase-migraciones
description: Flujo para cambios de base de datos del sitio CIJJ en Supabase. Úsala al crear o modificar tablas, columnas, enums, índices, funciones, triggers o políticas RLS, o al conectar código con una tabla nueva. Complementa a supabase-postgres-best-practices con las reglas propias de este repositorio.
---

# Migraciones de Supabase en CIJJ

Carga también la skill `supabase-postgres-best-practices` antes de escribir SQL.

## Reglas

1. **Una migración por cambio**, nunca editar una migración que ya se aplicó en un proyecto real. Si hay que corregir, crear una nueva.
2. Archivo en `supabase/migrations/` con nombre `AAAAMMDDHHMMSS_descripcion_en_snake_case.sql` (hora UTC). Ejemplo: `20260914000000_solicitudes_afiliacion.sql`.
3. Nombres en español y `snake_case`: tablas en plural (`solicitudes_afiliacion`), columnas descriptivas (`acepta_aviso_privacidad`), enums con prefijo claro (`estado_solicitud`).
4. Toda tabla lleva `id uuid primary key default gen_random_uuid()`, `created_at` y `updated_at timestamptz not null default now()`, y el trigger `public.set_updated_at()` (ya existe; no volver a crearlo).
5. **RLS obligatorio**: `alter table … enable row level security;` en la misma migración que crea la tabla, con políticas explícitas por operación (`for insert`, `for select`, …) y rol (`to anon`, `to authenticated`). Sin política = sin acceso; nunca crear políticas `using (true)` para escritura pública.
6. Restringir en la base lo que el público no debe controlar (por ejemplo, `with check (estado = 'pendiente')`), además de validarlo con Zod en la server action.
7. Agregar `check` para longitudes y valores obligatorios que ya valida Zod: la base es la última defensa.
8. Comentar la tabla con `comment on table` en español.

## Acceso desde el código

- Operaciones públicas del servidor: `crearClienteSupabasePublico()` de `src/lib/supabase/servidor.ts` (anon key, sujeto a RLS). Devuelve `null` si faltan variables de entorno; manejar ese caso.
- Inserciones públicas sin política de `select`: no encadenar `.select()` después de `.insert()`, porque RLS bloquearía la lectura.
- Código `23505` de Postgres = violación de unicidad; traducirlo a un mensaje amable en español.
- La service role key **solo** en servidor, en variables sin prefijo `NEXT_PUBLIC_`, y únicamente para tareas administrativas que no puedan resolverse con RLS.
- Cuando exista autenticación (fase 2), usar `@supabase/ssr` siguiendo la skill `supabase`.

## Aplicar migraciones

- Mientras el proyecto no esté vinculado a la CLI: copiar el SQL en **Supabase → SQL Editor** y ejecutarlo, en orden de nombre de archivo.
- Con la CLI vinculada (`supabase link --project-ref …`): `supabase db push`.
- Tras cambiar el esquema, actualizar `.env.example` si hay variables nuevas y documentar en la respuesta qué migración debe aplicar el usuario.
