# Panel del Consejo

Guía para quien administre el acceso al panel de solicitudes del Colectivo.

- **Dirección:** `/panel` del sitio (por ejemplo, `https://ingenieros-jovenes-de-jalisco.vercel.app/panel`).
- **Qué permite:** ver las solicitudes de afiliación, filtrarlas por estado, buscarlas, contactar por WhatsApp o correo, aprobarlas, rechazarlas o regresarlas a pendiente, y guardar notas internas.
- **Quién entra:** solo integrantes activos del Consejo. Se agregan desde el propio panel (**Consejo**, solo administradores).

## 1. Roles

| | Revisor | Administrador |
| --- | :---: | :---: |
| Ver, aprobar, rechazar y anotar solicitudes | ✓ | ✓ |
| Crear, editar y publicar eventos; subir fotos | ✓ | ✓ |
| Ver registros a eventos, marcar pagos, exportar CSV | ✓ | ✓ |
| Usar la red de miembros | ✓ | ✓ |
| **Eliminar eventos** | | ✓ |
| **Agregar, cambiar de rol y dar de baja integrantes del Consejo** | | ✓ |
| **Ocultar perfiles inapropiados del directorio (moderación)** | | ✓ |

Nadie puede editar los datos que envió un solicitante ni borrar solicitudes o registros. El Consejo nunca se queda sin administradores: la base de datos impide quitarle el rol o dar de baja al último administrador activo.

## 2. Primer administrador (una sola vez)

Aplica las migraciones (ver `docs/go-live.md`). Luego, el primer administrador crea su cuenta en `/registro` (con un correo autorizado, ver `docs/member-network.md`) y se le da el rol desde **SQL Editor**:

```sql
insert into public.board_members (user_id, full_name, role)
select id, 'Nombre Apellido', 'admin'
from auth.users
where email = 'correo@ejemplo.com'
on conflict (user_id) do update set role = 'admin', is_active = true
returning *;
```

Si no devuelve ninguna fila, el correo no coincide con ninguna cuenta. A partir de ahí, todo se hace desde el panel.

## 3. Agregar integrantes

**Panel → Consejo → Agregar integrante**: nombre, correo y rol.

- Si esa persona **ya tiene cuenta**, entra al panel de inmediato.
- Si **no tiene cuenta**, queda como *invitación pendiente* (y recibe un correo, cuando Resend esté configurado). Al crear su cuenta en `/registro` con ese correo, o entrar con Google, pasa a ser integrante con el rol elegido. No necesita tener solicitud de afiliación.

## 4. Cambiar rol o quitar el acceso

En **Panel → Consejo**, cada integrante tiene **Hacer administrador/revisor** y **Dar de baja**. Dar de baja quita el acceso de inmediato y conserva el historial de quién revisó qué; se puede **Reactivar** después.

Para que un integrante pueda eliminar su propia cuenta, primero hay que darlo de baja del Consejo.

## Moderación de perfiles

Un administrador puede abrir cualquier perfil del directorio y usar **Ocultar (moderación)**. El perfil deja de verse en el directorio; su dueño lo sigue viendo y editando, pero no puede volver a mostrarlo. Los perfiles ocultos se listan en **Panel → Consejo**, con la opción **Restaurar**.

## 5. Eventos

### Preparación (una sola vez)

En Supabase → **SQL Editor**, ejecuta `supabase/migrations/20260916000000_events.sql`. Crea las tablas de eventos, fotos y registros, la función de registro y el espacio de imágenes (bucket `events`).

### Crear y publicar un evento

1. Panel → **Eventos → Nuevo evento**.
2. Llena título, resumen, fecha, hora y lugar. Opcional: descripción, dirección, enlace de Google Maps, precios, cupo e instrucciones de pago.
   - **Precio público vacío** = entrada libre.
   - **Precio miembros vacío** = los miembros pagan lo mismo que el público.
   - **Cupo vacío** = sin límite.
3. Guarda. Se crea como **borrador** (no aparece en el sitio).
4. Sube la **portada** (horizontal, hasta 5 MB) y, si quieres, fotos a la **galería**.
5. Marca **Publicado** y guarda. Aparece en `/eventos` y en la portada del sitio.

### Cómo funciona el registro

- La persona se registra en la página del evento y recibe un **folio**, el **monto** que le toca y las **instrucciones de pago**.
- Si su correo tiene una **solicitud de afiliación aprobada**, se aplica automáticamente el precio de miembro.
- El registro se cierra solo cuando se llena el cupo o empieza el evento. También puedes cerrarlo desmarcando **Registro abierto**.

### Dar seguimiento

Panel → **Eventos → Registros** del evento:

- **Marcar pagado** cuando recibas el pago; **Cancelar** libera el lugar; **Reactivar** lo vuelve a ocupar.
- **Descargar CSV** para la lista de asistencia o para abrirla en Excel.

Después del evento, sube fotos a la galería: el evento pasa solo a **Eventos anteriores** en el sitio.

> Un evento con registros no se puede eliminar (para no perder el historial); despublícalo si necesitas ocultarlo.

## Seguridad

- Las reglas de acceso viven en la base de datos (RLS): aunque alguien tuviera la llave pública del sitio, no puede leer solicitudes sin ser miembro activo.
- El público solo puede **crear** solicitudes; no puede verlas, modificarlas ni borrarlas.
- Los integrantes del Consejo solo pueden cambiar el estado, las notas y los datos de revisión; no pueden alterar los datos del solicitante ni borrar solicitudes.
- Los permisos por rol se prueban con `pnpm test:db` (escenarios en `supabase/tests/permissions.sql`).
- `/panel` no aparece en buscadores.
