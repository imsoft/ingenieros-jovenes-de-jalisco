# Puesta en marcha: dominio y cuentas finales

Lista para pasar el sitio a su dominio propio y a las cuentas definitivas del Colectivo. El código no cambia: todo se configura desde servicios y variables de entorno.

Usa `DOMINIO` como el dominio final (ej. `ingenierosjovenesjalisco.org`) y `PROYECTO` como el id del proyecto de Supabase (lo que va antes de `.supabase.co`).

## 1. Supabase (solo si se crea un proyecto nuevo)

Si se conserva el proyecto actual, salta al paso 2.

1. Crea el proyecto en la región **East US (North Virginia)** o la más cercana disponible.
2. En el SQL Editor, ejecuta las migraciones **en orden**:
   1. `supabase/migrations/20260914000000_solicitudes_afiliacion.sql`
   2. `supabase/migrations/20260915000000_panel_consejo.sql`
   3. `supabase/migrations/20260916000000_eventos.sql`
   4. `supabase/migrations/20260924000000_red_de_miembros.sql`
3. Crea las cuentas del Consejo y dales rol con el SQL de `docs/panel-consejo.md`.
4. Si hay datos en el proyecto anterior (solicitudes, eventos), expórtalos desde **Table Editor → Export to CSV** y cárgalos en el nuevo, en el mismo orden de las migraciones.

## 2. Dominio en Vercel

1. Vercel → proyecto → **Settings → Domains** → agrega `DOMINIO` y `www.DOMINIO`. Configura los DNS que indique Vercel y deja `www` redirigiendo al dominio principal.
2. **Settings → Environment Variables** (Production):

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://DOMINIO` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://PROYECTO.supabase.co` (si cambió) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key del proyecto (si cambió) |
| `NOTIFICACIONES_CORREO` | correos del Consejo, separados por comas |
| `RESEND_API_KEY` | API key de Resend (paso 3) |
| `CORREO_REMITENTE` | `Ingenieros Jóvenes de Jalisco <no-responder@DOMINIO>` |
| `GOOGLE_SITE_VERIFICATION` | código de Search Console (paso 6) |

3. Vuelve a desplegar (Deployments → ⋯ → Redeploy) para que tomen efecto.

## 3. Resend

1. **Domains → Add domain** → `DOMINIO`. Agrega en el DNS los registros que muestra (MX, SPF y DKIM) y espera a que quede *Verified*.
2. **API Keys → Create** con permiso *Sending access*. Úsala en Vercel (`RESEND_API_KEY`) y en el SMTP de Supabase (paso 4).

Con esto se activan solos los correos de la app: aviso al Consejo por cada solicitud, bienvenida al aprobar y confirmación de registro a eventos.

## 4. Supabase Auth

En **Authentication**:

1. **URL Configuration**
   - Site URL: `https://DOMINIO`
   - Redirect URLs: `https://DOMINIO/auth/**` y `http://localhost:3000/auth/**`
2. **Emails → SMTP Settings**: host `smtp.resend.com`, puerto `465`, usuario `resend`, contraseña = API key, remitente `no-responder@DOMINIO`, nombre `Ingenieros Jóvenes de Jalisco`.
3. **Emails → Templates**: pega las 6 plantillas de autenticación de `supabase/plantillas/` y activa y pega los 4 avisos de seguridad recomendados (tablas en `docs/red-de-miembros.md`, secciones 3b y 3c).
4. **Rate Limits**: sube *emails sent per hour* según se necesite (por defecto 30).
5. **Hooks** y **Sign In / Providers**: como indica `docs/red-de-miembros.md` (hook de registro, altas activadas, Google).

## 5. Google OAuth

En el cliente OAuth de Google Cloud:

- Orígenes autorizados: agrega `https://DOMINIO`.
- URI de redirección: `https://PROYECTO.supabase.co/auth/v1/callback` (cambia solo si cambió el proyecto de Supabase).
- Pantalla de consentimiento: agrega `DOMINIO` en *Authorized domains* y los enlaces a `https://DOMINIO` y `https://DOMINIO/aviso-de-privacidad`.

## 6. Buscadores

1. [Search Console](https://search.google.com/search-console) → agrega la propiedad `https://DOMINIO` con el método *Etiqueta HTML* → copia el valor a `GOOGLE_SITE_VERIFICATION` y vuelve a desplegar.
2. Envía el sitemap `https://DOMINIO/sitemap.xml`.

## 7. Verificación final

- [ ] `https://DOMINIO` carga con candado y `www` redirige.
- [ ] Enviar una solicitud de afiliación → el Consejo recibe el aviso.
- [ ] Aprobarla en el panel → el solicitante recibe la bienvenida.
- [ ] Crear cuenta con ese correo → llega la confirmación y el enlace abre `/mi-perfil`.
- [ ] Crear cuenta con un correo no aprobado → se rechaza.
- [ ] Ingresar con Google → abre la red de miembros.
- [ ] Recuperar contraseña → el enlace abre `/restablecer`.
- [ ] Registrarse a un evento → llega el correo con folio.
- [ ] Compartir el enlace en WhatsApp → muestra la imagen con el dominio correcto.
