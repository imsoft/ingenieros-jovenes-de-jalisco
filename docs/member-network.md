# Red de miembros

Zona privada donde los miembros del Colectivo inician sesión (correo/contraseña o Google), crean su perfil y ven el directorio.

- Rutas: `/ingresar`, `/registro`, `/recuperar`, `/restablecer`, `/acceso-restringido`, `/miembros`, `/miembros/[id]`, `/mi-perfil`.
- **Miembro** = correo con solicitud de afiliación **aprobada**, correo en `private.authorized_emails`, o integrante activo del Consejo.
- Solo miembros pueden **crear cuenta** (lo bloquea el Auth Hook en el registro con correo y con Google) y **ver perfiles** (lo bloquea RLS). Las cuentas creadas a mano desde el dashboard de Supabase se saltan el hook, pero sin correo autorizado no ven nada. Si se rechaza una solicitud, esa persona pierde el acceso de inmediato.

## Configuración (una sola vez)

### 1. Migración

Ejecuta en el SQL Editor, en orden, `supabase/migrations/20260924000000_member_network.sql`, `supabase/migrations/20260925000000_member_companies_and_contact.sql` (empresas y contacto directo), `supabase/migrations/20260926000000_company_address_and_social.sql` (dirección y redes de las empresas, servicios sin límite) y `supabase/migrations/20260927000000_member_badges.sql` (cargos del Consejo y distintivos). **Si tu proyecto ya tenía las migraciones anteriores en español**, primero sigue la sección "Migrar la base actual a inglés" de `docs/go-live.md`.

### 2. Activar el filtro de registro

Dashboard → **Authentication → Hooks** → *Before User Created* → tipo **Postgres** → función `public.hook_only_authorized_emails` → Enable.

Luego, en **Authentication → Sign In / Providers**, activa **Allow new users to sign up** (el hook se encarga de filtrar).

### 3. URLs permitidas

**Authentication → URL Configuration**:

- Site URL: `https://ingenieros-jovenes-de-jalisco-azure.vercel.app`
- Redirect URLs:
  - `https://ingenieros-jovenes-de-jalisco-azure.vercel.app/auth/**`
  - `http://localhost:3000/auth/**`

`/auth/callback` termina el ingreso con Google. `/auth/confirm` recibe los enlaces de los correos (confirmación, recuperación, invitación). Funciona aunque el correo se abra en otro dispositivo.

### 3b. Plantillas de correo

En **Authentication → Emails → Templates**, pega el HTML de `supabase/templates/` (el asunto viene en la primera línea de cada archivo):

| Plantilla de Supabase | Archivo |
|---|---|
| Confirm sign up | `confirm-signup.html` |
| Invite user | `invite-user.html` |
| Magic link or OTP | `magic-link.html` |
| Change email address | `change-email.html` |
| Reset password | `reset-password.html` |
| Reauthentication | `reauthentication.html` |

La app no usa enlace mágico ni reautenticación, pero Supabase puede enviarlos (por ejemplo, si alguien pide un enlace mágico directo a la API), así que también llevan la marca.

### 3c. Avisos de seguridad

En la misma página, sección **Security notifications**: activa estos cuatro y pega su plantilla (el asunto viene en la primera línea de cada archivo):

| Aviso de Supabase | Archivo | Cuándo llega |
|---|---|---|
| Password changed | `password-changed.html` | Al cambiar o restablecer la contraseña |
| Email address changed | `email-changed.html` | Al correo **anterior**, cuando se completa un cambio de correo |
| Sign-in method linked | `sign-in-method-linked.html` | Cuando un miembro que se registró con contraseña entra por primera vez con Google |
| Sign-in method removed | `sign-in-method-removed.html` | Si se desvincula Google de la cuenta |

Todos incluyen el botón "No fui yo: proteger mi cuenta", que lleva a `/recuperar`.

Los otros tres (`phone-changed.html`, `mfa-method-added.html`, `mfa-method-removed.html`) quedan listos con la marca, pero no se activan: el sitio no usa teléfono ni verificación en dos pasos.

> Para probarlos con Supabase local se necesita un CLI reciente (`pnpm dlx supabase@latest`): la versión 2.84 carga las plantillas de avisos pero no los activa.

Los enlaces y el logo usan `{{ .SiteURL }}`: al cambiar el Site URL al dominio final, los correos apuntan solos al dominio nuevo.

Estas plantillas **se generan** con el mismo diseño que los correos de la app (logo, colores, pie). No se editan a mano: se cambia `src/lib/email/auth-templates.ts` (o el diseño común en `templates.ts`), se corre `pnpm emails:supabase` y se vuelven a pegar en Supabase. `pnpm test` falla si quedaron desfasadas.

### 4. Google

1. En [Google Cloud Console](https://console.cloud.google.com/) → APIs y servicios → **Pantalla de consentimiento OAuth**: tipo *Externo*, nombre "Ingenieros Jóvenes de Jalisco", logo y correo de soporte. Publícala (*In production*).
2. **Credenciales → Crear credenciales → ID de cliente de OAuth** → *Aplicación web*:
   - Orígenes autorizados: `https://ingenieros-jovenes-de-jalisco-azure.vercel.app`, `http://localhost:3000`
   - URI de redirección: `https://zfprqviurefzslfyqncz.supabase.co/auth/v1/callback`
3. Copia el Client ID y el Client Secret en Supabase → **Authentication → Sign In / Providers → Google** → Enable.

### 5. Correos de autenticación con Resend (obligatorio para registro con correo)

Sin SMTP propio, Supabase solo envía correos a los miembros del equipo del proyecto (2 por hora). Mientras tanto, solo funciona el ingreso con Google.

1. En Resend, verifica el dominio (registros DNS) y crea una API key.
2. Supabase → **Authentication → Emails → SMTP Settings**:
   - Host `smtp.resend.com`, puerto `465`, usuario `resend`, contraseña = API key.
   - Remitente: `no-responder@<dominio>`, nombre "Ingenieros Jóvenes de Jalisco".
3. En **Rate Limits**, sube el límite de correos si hace falta (por defecto 30/h).

## Qué puede hacer un miembro

- Crear cuenta (correo o Google) solo con el correo aprobado.
- Crear y editar **su** perfil y su foto; ocultarse del directorio.
- Registrar hasta **5 empresas o emprendimientos**, cada uno con logo, su relación (dueño, socio, colaborador o independiente), puesto, giro, descripción, servicios, municipio y sitio web.
- Compartir su **contacto directo** (WhatsApp y correo) con los demás miembros, solo si lo activa. Vive en una tabla aparte (`profile_contacts`) para que la base de datos lo oculte aunque alguien consulte directo.
- Ver el directorio (con filtros por especialidad, giro y municipio), la vista de **Empresas** (quién del Colectivo trabaja en cada una) y los perfiles visibles de otros miembros. Solo ve el WhatsApp o correo de quien decidió compartirlo.
- **Eliminar su cuenta** desde `/mi-perfil` (borra cuenta, perfil y foto).

Si su solicitud deja de estar aprobada, pierde el acceso y su perfil desaparece del directorio al instante. La moderación de perfiles y los roles del Consejo están en `docs/board-panel.md`.

## Administración

```sql
-- Dar acceso sin solicitud aprobada (pruebas, casos especiales; el Consejo se agrega desde el panel)
insert into private.authorized_emails (email, reason) values ('persona@correo.com', 'Pruebas');

-- Quitarlo
delete from private.authorized_emails where email = 'persona@correo.com';

```

Las fotos viven en el bucket público `profiles`, en `{user_id}/{uuid}.ext`. Cada miembro solo puede escribir en su carpeta.
