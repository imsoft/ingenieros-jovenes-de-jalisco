-- Escenarios de permisos: público, miembros, ex miembros, revisor y administrador del Consejo.
-- Se corre con `pnpm test:db` (ver supabase/pruebas/correr.sh).
\set ON_ERROR_STOP 1
set client_min_messages = notice;

create schema pruebas;
create function pruebas.ok(condicion boolean, descripcion text) returns void language plpgsql as $$
begin
  if condicion is not true then raise exception 'FALLÓ: %', descripcion; end if;
  raise notice 'ok  %', descripcion;
end $$;
grant usage on schema pruebas to authenticated, anon;
grant execute on function pruebas.ok(boolean, text) to authenticated;

-- Cambia la sesión simulada a un usuario (o a anónimo si p_id es null).
create function pruebas.como(p_id uuid) returns void language plpgsql security definer as $$
declare v_correo text;
begin
  select email into v_correo from auth.users where id = p_id;
  perform set_config('request.jwt.claim.sub', coalesce(p_id::text, ''), false);
  perform set_config('request.jwt.claims', json_build_object('sub', p_id, 'email', v_correo)::text, false);
end $$;

-- Espera que una sentencia falle con un texto dado.
create function pruebas.falla(p_sql text, p_texto text, p_descripcion text) returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'FALLÓ (no lanzó error): %', p_descripcion;
exception when others then
  if position(p_texto in sqlerrm) = 0 then
    raise exception 'FALLÓ: % (error inesperado: %)', p_descripcion, sqlerrm;
  end if;
  raise notice 'ok  %', p_descripcion;
end $$;
grant execute on function pruebas.falla(text, text, text) to authenticated;

-- ---------------------------------------------------------------- datos
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@cijj.mx'),
  ('00000000-0000-0000-0000-00000000000b', 'revisor@cijj.mx'),
  ('00000000-0000-0000-0000-000000000001', 'm1@correo.mx'),
  ('00000000-0000-0000-0000-000000000002', 'm2@correo.mx'),
  ('00000000-0000-0000-0000-000000000003', 'ex@correo.mx'),
  ('00000000-0000-0000-0000-000000000009', 'intruso@correo.mx');

insert into public.miembros_consejo (usuario_id, nombre, rol) values
  ('00000000-0000-0000-0000-00000000000a', 'Admin', 'admin'),
  ('00000000-0000-0000-0000-00000000000b', 'Revisor', 'revisor');

insert into public.solicitudes_afiliacion (nombre, correo, telefono, municipio, confirma_mayoria_edad, acepta_aviso_privacidad, estado, revisado_en)
select n, c, '3312345678', 'Zapopan', true, true, 'aprobada', now()
from (values ('Miembro Uno', 'M1@correo.mx'), ('Miembro Dos', 'm2@correo.mx'), ('Ex Miembro', 'ex@correo.mx')) v(n, c);

insert into public.perfiles (usuario_id, nombre, visible) values
  ('00000000-0000-0000-0000-000000000001', 'Miembro Uno', true),
  ('00000000-0000-0000-0000-000000000002', 'Miembro Dos', false),
  ('00000000-0000-0000-0000-000000000003', 'Ex Miembro', true);

insert into public.eventos (slug, titulo, resumen, inicia_en, lugar) values
  ('evento-uno', 'Evento uno', 'Resumen del evento uno', now() + interval '10 days', 'Guadalajara'),
  ('evento-dos', 'Evento dos', 'Resumen del evento dos', now() + interval '10 days', 'Guadalajara');

-- ---------------------------------------------------------------- filtro de registro
select pruebas.ok(public.hook_solo_correos_autorizados('{"user":{"email":"M1@Correo.mx"}}') = '{}', 'hook: acepta correo aprobado sin importar mayúsculas');
select pruebas.ok(public.hook_solo_correos_autorizados('{"user":{"email":"intruso@correo.mx"}}') ? 'error', 'hook: rechaza correo sin solicitud aprobada');
select pruebas.ok(public.hook_solo_correos_autorizados('{"user":{}}') ? 'error', 'hook: rechaza evento sin correo');

set role authenticated;

-- ---------------------------------------------------------------- miembros
select pruebas.como('00000000-0000-0000-0000-000000000001');
select pruebas.ok(public.soy_miembro(), 'M1 es miembro');
select pruebas.ok((select count(*) from public.perfiles) = 2, 'M1 ve su perfil y el de Ex (visible); no el oculto de M2');
select pruebas.ok(not exists (select 1 from public.perfiles where usuario_id = '00000000-0000-0000-0000-000000000002'), 'M1 no ve el perfil oculto de M2');

with u as (update public.perfiles set nombre = 'Hackeado' where usuario_id = '00000000-0000-0000-0000-000000000002' returning 1)
select pruebas.ok((select count(*) from u) = 0, 'M1 no puede editar el perfil de M2');
with u as (update public.perfiles set nombre = 'Miembro Uno Editado' where usuario_id = '00000000-0000-0000-0000-000000000001' returning 1)
select pruebas.ok((select count(*) from u) = 1, 'M1 edita su propio perfil');
select pruebas.falla($$update public.perfiles set suspendido = false where usuario_id = auth.uid()$$, 'permission denied', 'M1 no puede tocar la columna suspendido');
select pruebas.falla($$insert into public.perfiles (usuario_id, nombre) values ('00000000-0000-0000-0000-000000000009', 'Falso')$$, 'row-level security', 'M1 no puede crear el perfil de otra persona');
select pruebas.falla($$select public.moderar_perfil('00000000-0000-0000-0000-000000000002', true)$$, 'SOLO_ADMINISTRADORES', 'M1 no puede moderar');
select pruebas.falla($$select public.listar_consejo()$$, 'SOLO_ADMINISTRADORES', 'M1 no puede ver al Consejo');
select pruebas.ok((select count(*) from public.solicitudes_afiliacion) = 0, 'M1 no ve solicitudes');
select pruebas.ok((select count(*) from public.registros_evento) = 0, 'M1 no ve registros de eventos');

-- Storage
insert into storage.objects (bucket_id, name) values ('perfiles', '00000000-0000-0000-0000-000000000001/foto.jpg');
select pruebas.ok(true, 'M1 sube foto a su carpeta');
select pruebas.falla($$insert into storage.objects (bucket_id, name) values ('perfiles', '00000000-0000-0000-0000-000000000002/foto.jpg')$$, 'row-level security', 'M1 no sube a la carpeta de M2');

-- ---------------------------------------------------------------- quien dejó de ser miembro
reset role;
update public.solicitudes_afiliacion set estado = 'rechazada' where correo = 'ex@correo.mx';
set role authenticated;
select pruebas.como('00000000-0000-0000-0000-000000000001');
select pruebas.ok(not exists (select 1 from public.perfiles where usuario_id = '00000000-0000-0000-0000-000000000003'), 'el perfil de quien dejó de ser miembro desaparece del directorio');
select pruebas.como('00000000-0000-0000-0000-000000000003');
select pruebas.ok(not public.soy_miembro(), 'el ex miembro pierde el acceso');
select pruebas.ok((select count(*) from public.perfiles) = 0, 'el ex miembro no ve ningún perfil');

-- ---------------------------------------------------------------- sin membresía
select pruebas.como('00000000-0000-0000-0000-000000000009');
select pruebas.ok(not public.soy_miembro(), 'una cuenta sin aprobación no es miembro');
select pruebas.ok((select count(*) from public.perfiles) = 0, 'una cuenta sin aprobación no ve perfiles');
select pruebas.falla($$insert into public.perfiles (usuario_id, nombre) values (auth.uid(), 'Intruso')$$, 'row-level security', 'una cuenta sin aprobación no crea perfil');
select pruebas.falla($$insert into storage.objects (bucket_id, name) values ('perfiles', '00000000-0000-0000-0000-000000000009/foto.jpg')$$, 'row-level security', 'una cuenta sin aprobación no sube fotos');

-- ---------------------------------------------------------------- revisor
select pruebas.como('00000000-0000-0000-0000-00000000000b');
select pruebas.ok(public.soy_miembro(), 'el revisor cuenta como miembro');
select pruebas.ok((select count(*) from public.solicitudes_afiliacion) = 3, 'el revisor ve solicitudes');
with u as (update public.eventos set titulo = 'Evento uno editado' where slug = 'evento-uno' returning 1)
select pruebas.ok((select count(*) from u) = 1, 'el revisor edita eventos');
with d as (delete from public.eventos where slug = 'evento-uno' returning 1)
select pruebas.ok((select count(*) from d) = 0, 'el revisor NO puede borrar eventos');
select pruebas.falla($$select public.agregar_consejo('x@correo.mx', 'Equis', 'revisor')$$, 'SOLO_ADMINISTRADORES', 'el revisor no gestiona al Consejo');
select pruebas.falla($$select public.moderar_perfil('00000000-0000-0000-0000-000000000001', true)$$, 'SOLO_ADMINISTRADORES', 'el revisor no modera perfiles');
select pruebas.falla($$select public.eliminar_mi_cuenta()$$, 'ES_CONSEJO', 'un integrante del Consejo no puede borrar su cuenta sin darse de baja');

-- ---------------------------------------------------------------- administrador
select pruebas.como('00000000-0000-0000-0000-00000000000a');
with d as (delete from public.eventos where slug = 'evento-dos' returning 1)
select pruebas.ok((select count(*) from d) = 1, 'el admin borra eventos');

select public.moderar_perfil('00000000-0000-0000-0000-000000000001', true);
select pruebas.ok(exists (select 1 from public.perfiles where usuario_id = '00000000-0000-0000-0000-000000000001' and suspendido), 'el admin suspende un perfil y lo sigue viendo para restaurarlo');
select pruebas.ok(not exists (select 1 from public.perfiles where usuario_id = '00000000-0000-0000-0000-000000000002'), 'el admin tampoco ve perfiles que su dueño ocultó');

select pruebas.como('00000000-0000-0000-0000-00000000000b');
select pruebas.ok(not exists (select 1 from public.perfiles where usuario_id = '00000000-0000-0000-0000-000000000001'), 'el revisor ya no ve el perfil suspendido');
select pruebas.como('00000000-0000-0000-0000-000000000001');
select pruebas.ok(exists (select 1 from public.perfiles where usuario_id = auth.uid() and suspendido), 'el dueño ve su perfil suspendido');
with u as (update public.perfiles set visible = true where usuario_id = auth.uid() returning suspendido)
select pruebas.ok((select bool_and(suspendido) from u), 'el dueño no puede quitarse la suspensión');

select pruebas.como('00000000-0000-0000-0000-00000000000a');
select public.moderar_perfil('00000000-0000-0000-0000-000000000001', false);

-- Gestión del Consejo
select pruebas.ok(public.agregar_consejo('M1@correo.mx', 'Miembro Uno', 'revisor') = 'activo', 'agregar a alguien con cuenta lo activa de inmediato');
select pruebas.ok(public.agregar_consejo('Nueva@Correo.mx', 'Nueva Persona', 'admin') = 'invitado', 'agregar a alguien sin cuenta crea una invitación');
select pruebas.ok((select count(*) from public.listar_consejo()) = 4, 'el admin ve integrantes e invitaciones');
select pruebas.ok((select correo from public.listar_consejo() where estado = 'invitado') = 'nueva@correo.mx', 'la invitación guarda el correo normalizado');
select pruebas.falla($$select public.actualizar_consejo('00000000-0000-0000-0000-00000000000a', 'revisor', true)$$, 'ULTIMO_ADMINISTRADOR', 'el único admin no puede quitarse el rol');
select pruebas.falla($$select public.actualizar_consejo('00000000-0000-0000-0000-00000000000a', 'admin', false)$$, 'ULTIMO_ADMINISTRADOR', 'el único admin no puede darse de baja');
select public.actualizar_consejo('00000000-0000-0000-0000-00000000000b', 'revisor', false);
select pruebas.ok((select estado from public.listar_consejo() where usuario_id = '00000000-0000-0000-0000-00000000000b') = 'baja', 'el admin da de baja a un revisor');

reset role;
select pruebas.ok(public.hook_solo_correos_autorizados('{"user":{"email":"nueva@correo.mx"}}') = '{}', 'hook: acepta a una persona invitada al Consejo');
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000c', 'nueva@correo.mx');
select pruebas.ok(exists (select 1 from public.miembros_consejo where usuario_id = '00000000-0000-0000-0000-00000000000c' and rol = 'admin' and activo), 'al crear su cuenta, la invitada entra al Consejo con su rol');
select pruebas.ok(not exists (select 1 from privado.invitaciones_consejo), 'la invitación se consume');

set role authenticated;
select pruebas.como('00000000-0000-0000-0000-00000000000b');
select pruebas.ok(not public.soy_miembro(), 'un revisor dado de baja y sin solicitud pierde el acceso a la red');
select pruebas.ok((select count(*) from public.solicitudes_afiliacion) = 0, 'un revisor dado de baja ya no ve solicitudes');

select pruebas.como('00000000-0000-0000-0000-00000000000a');
select public.actualizar_consejo('00000000-0000-0000-0000-00000000000a', 'revisor', true);
select pruebas.ok(true, 'con otra admin activa, el admin sí puede cambiar su propio rol');

-- ---------------------------------------------------------------- eliminar cuenta
select pruebas.como('00000000-0000-0000-0000-000000000002');
select public.eliminar_mi_cuenta();
reset role;
select pruebas.ok(not exists (select 1 from auth.users where id = '00000000-0000-0000-0000-000000000002'), 'un miembro borra su cuenta');
select pruebas.ok(not exists (select 1 from public.perfiles where usuario_id = '00000000-0000-0000-0000-000000000002'), 'su perfil se borra en cascada');

set role anon;
select pruebas.falla($$select public.eliminar_mi_cuenta()$$, 'permission denied', 'anónimo no puede llamar eliminar_mi_cuenta');
select pruebas.falla($$select * from public.perfiles$$, 'permission denied', 'anónimo no puede leer perfiles');
reset role;

\echo TODAS LAS PRUEBAS PASARON
