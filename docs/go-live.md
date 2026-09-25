# Puesta en marcha: dominio y cuentas finales

Lista para pasar el sitio a su dominio propio y a las cuentas definitivas del Colectivo. El código no cambia: todo se configura desde servicios y variables de entorno.

Usa `DOMINIO` como el dominio final (ej. `ingenierosjovenesjalisco.org`) y `PROYECTO` como el id del proyecto de Supabase (lo que va antes de `.supabase.co`).

## 0. Migrar la base actual a inglés (una sola vez, proyecto existente)

El proyecto de Supabase que ya está en producción se creó con las migraciones originales en español. Para pasarlo a los nombres en inglés **sin perder datos**, hazlo en este orden y en un mismo momento, porque la versión anterior de la app deja de funcionar en cuanto corre el paso 1:

1. **SQL Editor** → ejecuta `supabase/scripts/rename-schema-to-english.sql`. Renombra tablas, columnas, tipos, funciones y políticas conservando los datos, y crea el bucket `events`. Corre en una sola transacción: si algo falla, no cambia nada.
2. Mueve las fotos de eventos al bucket nuevo desde tu terminal, con la llave **secret** (Project Settings → API). No la guardes en ningún archivo:
   ```bash
   SUPABASE_URL=https://PROYECTO.supabase.co SUPABASE_SECRET_KEY=... node scripts/move-event-images.mjs          # solo lista
   SUPABASE_URL=https://PROYECTO.supabase.co SUPABASE_SECRET_KEY=... node scripts/move-event-images.mjs --apply  # copia y borra el bucket viejo
   ```
3. **SQL Editor** → ejecuta `supabase/migrations/20260924000000_member_network.sql`.
4. Despliega la versión en inglés de la app (push a `main`) y renombra en Vercel las variables `NOTIFICACIONES_CORREO` → `BOARD_NOTIFICATION_EMAILS` y `CORREO_REMITENTE` → `EMAIL_FROM` (si ya las tenías).
5. Sigue la configuración de Auth de `docs/member-network.md`: hook `hook_only_authorized_emails`, URLs `/auth/**`, plantillas de `supabase/templates/`.

Este proceso se ensayó completo en un Supabase local: el esquema resultante es idéntico al de las migraciones nuevas, los datos y las fotos se conservan y los integrantes del Consejo siguen entrando al panel.

## 1. Supabase (solo si se crea un proyecto nuevo)

Si se conserva el proyecto actual, salta al paso 2.

1. Crea el proyecto en la región **East US (North Virginia)** o la más cercana disponible.
2. En el SQL Editor, ejecuta las migraciones **en orden**:
   1. `supabase/migrations/20260914000000_membership_applications.sql`
   2. `supabase/migrations/20260915000000_board_panel.sql`
   3. `supabase/migrations/20260916000000_events.sql`
   4. `supabase/migrations/20260924000000_member_network.sql`
3. Crea las cuentas del Consejo y dales rol con el SQL de `docs/board-panel.md`.
4. Si hay datos en el proyecto anterior (solicitudes, eventos), expórtalos desde **Table Editor → Export to CSV** y cárgalos en el nuevo, en el mismo orden de las migraciones.

## 2. Dominio en Vercel

1. Vercel → proyecto → **Settings → Domains** → agrega `DOMINIO` y `www.DOMINIO`. Configura los DNS que indique Vercel y deja `www` redirigiendo al dominio principal.
2. **Settings → Environment Variables** (Production):

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://DOMINIO` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://PROYECTO.supabase.co` (si cambió) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key del proyecto (si cambió) |
| `BOARD_NOTIFICATION_EMAILS` | correos del Consejo, separados por comas |
| `RESEND_API_KEY` | API key de Resend (paso 3) |
| `EMAIL_FROM` | `Ingenieros Jóvenes de Jalisco <no-responder@DOMINIO>` |
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
3. **Emails → Templates**: pega las 6 plantillas de autenticación de `supabase/templates/` y activa y pega los 4 avisos de seguridad recomendados (tablas en `docs/member-network.md`, secciones 3b y 3c).
4. **Rate Limits**: sube *emails sent per hour* según se necesite (por defecto 30).
5. **Hooks** y **Sign In / Providers**: como indica `docs/member-network.md` (hook de registro, altas activadas, Google).

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
