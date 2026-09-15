# Panel del Consejo

Guía para quien administre el acceso al panel de solicitudes del Colectivo.

- **Dirección:** `/panel` del sitio (por ejemplo, `https://ingenieros-jovenes-de-jalisco.vercel.app/panel`).
- **Qué permite:** ver las solicitudes de afiliación, filtrarlas por estado, buscarlas, contactar por WhatsApp o correo, aprobarlas, rechazarlas o regresarlas a pendiente, y guardar notas internas.
- **Quién entra:** solo integrantes activos del Consejo dados de alta aquí. No existe registro público.

## 1. Preparación (una sola vez)

1. En Supabase → **SQL Editor**, ejecuta `supabase/migrations/20260915000000_panel_consejo.sql`.
2. En Supabase → **Authentication → Sign In / Providers**, desactiva **Allow new users to sign up**. El panel ya bloquea a cualquier cuenta que no sea del Consejo, pero así nadie más puede crear cuentas.

## 2. Dar acceso a un integrante

1. Supabase → **Authentication → Users → Add user → Create new user**.
   - Escribe su correo y una contraseña temporal.
   - Marca **Auto Confirm User**.
2. Supabase → **SQL Editor**, cambia el correo, el nombre y el rol, y ejecuta:

```sql
insert into public.miembros_consejo (usuario_id, nombre, rol)
select id, 'Nombre Apellido', 'admin'   -- 'admin' o 'revisor'
from auth.users
where email = 'correo@ejemplo.com';
```

3. Comparte la dirección del panel y la contraseña temporal por un medio privado.

**Roles**

| Rol | Hoy puede |
| --- | --- |
| `admin` | Todo lo del panel. Reservado para futuras funciones de administración (gestionar miembros, eventos). |
| `revisor` | Ver y revisar solicitudes. |

## 3. Quitar el acceso

Cuando alguien deja el Consejo, desactívalo (conserva el historial de quién revisó qué):

```sql
update public.miembros_consejo
set activo = false
where usuario_id = (select id from auth.users where email = 'correo@ejemplo.com');
```

Su sesión deja de tener acceso al panel de inmediato. Si además quieres cerrar su cuenta, elimínala en **Authentication → Users**.

## 4. Consultar quién tiene acceso

```sql
select m.nombre, u.email, m.rol, m.activo, m.created_at
from public.miembros_consejo m
join auth.users u on u.id = m.usuario_id
order by m.activo desc, m.nombre;
```

## Seguridad

- Las reglas de acceso viven en la base de datos (RLS): aunque alguien tuviera la llave pública del sitio, no puede leer solicitudes sin ser miembro activo.
- El público solo puede **crear** solicitudes; no puede verlas, modificarlas ni borrarlas.
- Los miembros solo pueden cambiar el estado, las notas y los datos de revisión; no pueden alterar los datos del solicitante ni borrar solicitudes.
- `/panel` no aparece en buscadores.
