---
name: cijj-convenciones
description: Convenciones del sitio del Colectivo de Ingenieros Jóvenes de Jalisco (CIJJ). Cárgala ANTES de crear o modificar páginas, componentes, textos, estilos, server actions o validaciones en este repositorio — nombres en español, dónde vive el contenido, tokens de marca, patrones de formularios y particularidades de Next.js 16.
---

# Convenciones del proyecto CIJJ

Sitio web del **Colectivo de Ingenieros Jóvenes de Jalisco A.C.** (fundado el 1 de enero de 2016, VII Consejo Directivo). Stack: Next.js 16 (App Router, Turbopack, React Compiler), React 19, Tailwind CSS 4, shadcn/ui estilo `base-nova` sobre **Base UI** (no Radix), Zod 4, Supabase, despliegue en Vercel.

## Idioma

- Todo el texto visible está en **español de México** (`lang="es-MX"`), con acentos y signos de apertura (¡ ¿).
- Identificadores propios en español: componentes (`Encabezado`, `FormularioAfiliacion`), funciones (`enviarSolicitudAfiliacion`), variables, tablas y columnas (`solicitudes_afiliacion`, `confirma_mayoria_edad`). Los componentes generados por shadcn en `src/components/ui/` se quedan en inglés.
- Comentarios breves y en español, solo cuando expliquen el porqué.

## Estructura

| Qué | Dónde |
| --- | --- |
| Textos, pilares, actividades, requisitos, redes | `src/content/sitio.ts` — nunca hardcodear contenido repetido en componentes |
| Secciones y piezas del sitio público | `src/components/sitio/` |
| Primitivas shadcn | `src/components/ui/` (añadir con `pnpm dlx shadcn@latest add <componente>`) |
| Server actions (`"use server"`) | `src/acciones/` |
| Esquemas Zod y tipos de estado de formularios | `src/lib/validaciones/` |
| Clientes de Supabase | `src/lib/supabase/` (importan `server-only` si son de servidor) |
| Migraciones SQL | `supabase/migrations/` (ver skill `supabase-migraciones`) |
| Imágenes | `public/images/` (stock provisional en `public/images/stock/`), marca en `public/brand/` |

## Landing y patrones de UI

- La página de inicio (`src/app/page.tsx`) solo compone secciones de `src/components/sitio/secciones/` en este orden: Portada → Cifras → Nosotros → Pilares → Actividades → Beneficios → Preguntas → Únete. Cada sección con ancla tiene un `id` que coincide con `navegacion` en `sitio.ts`; la portada es `#inicio` y la tarjeta del formulario es `#unete` (la usan el encabezado y la barra móvil).
- Títulos de sección con `EncabezadoSeccion` (props `claro` para fondos oscuros y `centrado`).
- Animación sutil: envolver bloques en `Revelar` (usa `como="li"` dentro de listas y `retraso` para escalonar) y cifras en `Contador`. Todo movimiento debe respetar `prefers-reduced-motion` (`motion-safe:` o las reglas de `globals.css`).
- Botones de marca con variantes propias de `button.tsx`: `variant="acento"` (naranja, CTA principal), `variant="claro"` (sobre fondos azules) y `size="xl"`. No sobrescribir colores de botones con `className`.
- Navegación móvil con `Sheet` (Base UI: triggers con `render={<Button />}`, enlaces con `render={<a />}` + `nativeButton={false}`).
- Formularios con `FieldGroup` + `Field` + `FieldLabel` + `FieldError`; `data-invalid` en `Field` y `aria-invalid` en el control.
- Iconos de Instagram y Facebook desde `iconos-redes.tsx` (lucide no incluye marcas); textura del puente con `DecoracionPuente`.
- Responsive: diseñar primero para ~360–500px. Contenido alterno por breakpoint (p. ej. pilares en carrusel con scroll-snap en móvil y pestañas verticales en `lg`) es válido si ambos comparten los datos de `sitio.ts`.

## Marca

- Colores del logo, expuestos como utilidades de Tailwind: `azul` (`#10436f`), `azul-profundo` (`#0a2c4a`), `naranja` (`#e27227`). Úsalos como `bg-azul`, `text-naranja`, `ring-azul/10`. `--primary` apunta al azul. No introducir otros colores de marca.
- Tipografías: `font-heading` = Oswald (títulos, en mayúsculas), `font-sans` = Source Sans 3 (cuerpo).
- Lema: “¡Cuando la ingeniería se une, Jalisco avanza!”. Pilares: Empresarial, Gremial, Académico, Político, Técnico.
- `public/brand/logo.svg` es una recreación provisional del logo oficial.

## Contenido provisional

- Todo texto, imagen o dato que no haya confirmado el Consejo se marca con un comentario `// Provisional: …` (o una nota visible si es un documento legal).
- No inventar cifras, nombres de consejeros, correos ni teléfonos. Si falta un dato, dejarlo configurable y preguntar.
- Requisito real de afiliación confirmado: ser mayor de 18 años.

## Next.js 16

- Antes de usar una API de Next, leer la guía correspondiente en `node_modules/next/dist/docs/` (ver `AGENTS.md`).
- `next/image`: `priority` está deprecado; usar `loading="eager"` y `fetchPriority="high"` (o `preload`). La calidad por defecto permitida es solo `75`.
- Tipos globales `LayoutProps<"/ruta">` y `PageProps<"/ruta">` para layouts y páginas.

## Formularios y server actions

1. Esquema Zod 4 en `src/lib/validaciones/` con mensajes en español; exportar el tipo de estado como unión discriminada por `tipo` (`"inicial" | "exito" | "error"`).
2. La action recibe `(estadoPrevio, formData)`, valida con `safeParse` y devuelve errores con `z.flattenError(error).fieldErrors` (no el `.flatten()` deprecado), además de los `valores` enviados para repoblar el formulario.
3. El formulario es Client Component con `useActionState`; los campos usan `defaultValue={valores?.campo}`, `aria-invalid` y `aria-describedby` hacia el mensaje de error.
4. Formularios públicos incluyen el campo trampa `sitio_web` contra bots.
5. Nunca confiar en el cliente: validar y autorizar dentro de cada action. Nunca usar la service role key de Supabase en código que llegue al navegador.

## Despliegue (prevalece sobre `deploy-to-vercel`)

- Pedir confirmación explícita antes de cada `vercel link`, `git commit`, `git push` o `vercel deploy`. Elegir el equipo no cuenta como confirmación para vincular.
- **Nunca** usar el “no-auth fallback” (`resources/deploy.sh` o `deploy-codex.sh`): sube el proyecto a un endpoint anónimo. Si la CLI no está autenticada, pedir al usuario que ejecute `vercel login`.
- Nunca `git add .` a ciegas: revisar `git status` y agregar archivos concretos; jamás subir `.env.local`.
- Despliegues de producción solo si el usuario lo pide; por defecto, preview.

## Herramientas

- Gestor de paquetes: **pnpm** fijado en `package.json` (`packageManager`). No usar npm ni yarn para dependencias.
- **TypeScript 6.0** y **ESLint 9** a propósito: `typescript-eslint` exige `typescript <6.1` y `eslint-plugin-react` (vía `eslint-config-next`) no soporta ESLint 10. No actualizarlos sin comprobar que `pnpm lint` siga funcionando.
- Verificación: ver skill `correr-y-verificar`.
