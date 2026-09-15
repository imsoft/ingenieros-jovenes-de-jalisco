# SEO del sitio del Colectivo

Guía para quien administre el sitio y las redes del Colectivo de Ingenieros Jóvenes de Jalisco A.C.

## Qué ya hace el sitio

- **Títulos y descripciones** pensados para búsquedas como “ingenieros jóvenes Jalisco” o “colectivo de ingenieros Guadalajara”.
- **Imagen para compartir** (1200×630) con logo y lema al pegar el enlace en WhatsApp, Facebook, LinkedIn o X.
- **`/sitemap.xml` y `/robots.txt`** para que Google encuentre todas las páginas.
- **URL canónica** en cada página para evitar contenido duplicado.
- **Datos estructurados** (schema.org): la organización como ONG con fundación en 2016, redes y área de servicio en Jalisco, más las preguntas frecuentes.
- **Las vistas previas de Vercel no se indexan**; solo el sitio de producción aparece en buscadores.

## Pasos pendientes (una sola vez)

### 1. Dominio

Mientras no haya dominio, el sitio usa la URL de producción de Vercel. Cuando se compre uno:

1. Conéctalo en Vercel → Project → Settings → Domains.
2. En Vercel → Settings → Environment Variables, define `NEXT_PUBLIC_SITE_URL` con el dominio completo (`https://…`) y vuelve a desplegar.

### 2. Google Search Console

1. Entra a <https://search.google.com/search-console> con la cuenta de Google del Colectivo.
2. Agrega una propiedad:
   - **Dominio** (recomendado si ya hay dominio propio): verifica con el registro DNS que te indique Google.
   - **Prefijo de URL** (para la URL de Vercel): elige “Etiqueta HTML”, copia solo el valor de `content` y guárdalo en Vercel como `GOOGLE_SITE_VERIFICATION`. Vuelve a desplegar y presiona “Verificar”.
3. En **Sitemaps**, envía `sitemap.xml`.
4. Usa **Inspección de URLs** en la página principal y solicita la indexación.

### 3. Perfil de Google Business (opcional)

Útil para aparecer en Google Maps y en búsquedas locales. Crea el perfil como organización sin fines de lucro; si no hay oficina abierta al público, configúralo como “negocio de área de servicio” en Jalisco y oculta la dirección. Usa exactamente el mismo nombre que en el sitio: **Colectivo de Ingenieros Jóvenes de Jalisco A.C.**

## Hábitos que mejoran el posicionamiento

- **Enlaza el sitio desde las redes**: bio de Instagram, botón de Facebook y publicaciones de eventos.
- **Pide enlaces de aliados**: universidades, colegios de ingenieros, cámaras y dependencias con las que colaboren. Un enlace desde un sitio `.edu.mx` o `.gob.mx` vale mucho.
- **Mismo nombre en todas partes**: sitio, redes, Google Business y comunicados.
- **Contenido nuevo y útil**: cuando existan las secciones de eventos y blog, cada evento y artículo tendrá su propia página indexable, que es lo que más atrae búsquedas.
- **Revisa Search Console una vez al mes**: consultas por las que aparecen, clics y errores de indexación.

## Validar los datos estructurados

- Prueba de resultados enriquecidos: <https://search.google.com/test/rich-results>
- Validador de schema.org: <https://validator.schema.org>

> Google hoy muestra resultados enriquecidos de preguntas frecuentes principalmente para sitios de gobierno y salud. Aun así, los datos ayudan a que buscadores y asistentes de IA entiendan y citen correctamente la información del Colectivo.
