"use server"

import { randomUUID } from "node:crypto"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { isoDesdeHoraLocal, slugParaEvento, type ValoresEvento } from "@/lib/eventos/formulario"
import { esEstadoRegistro, type EstadoRegistro } from "@/lib/eventos/registros"
import { exigirMiembroConsejo } from "@/lib/panel/sesion"
import { crearClienteSupabaseConSesion } from "@/lib/supabase/sesion"
import { esquemaEvento, type EstadoFormularioEvento } from "@/lib/validaciones/evento-panel"

const BUCKET = "eventos"
const EXTENSIONES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const

type Resultado = { ok: true } | { ok: false; mensaje: string }

const esUuid = (valor: string) => z.uuid().safeParse(valor).success

// Refresca el sitio público y el panel después de cualquier cambio en eventos.
function revalidarEventos(...slugs: (string | null | undefined)[]) {
  revalidatePath("/")
  revalidatePath("/eventos")
  revalidatePath("/sitemap.xml")
  for (const slug of new Set(slugs)) if (slug) revalidatePath(`/eventos/${slug}`)
  revalidatePath("/panel", "layout")
}

function leerValores(formData: FormData): ValoresEvento {
  const texto = (campo: string) => {
    const valor = formData.get(campo)
    return typeof valor === "string" ? valor : ""
  }
  return {
    titulo: texto("titulo"),
    // La dirección no se captura: se genera en el servidor al crear el evento.
    slug: "",
    resumen: texto("resumen"),
    descripcion: texto("descripcion"),
    fecha: texto("fecha"),
    horaInicio: texto("horaInicio"),
    horaFin: texto("horaFin"),
    lugar: texto("lugar"),
    direccion: texto("direccion"),
    mapaUrl: texto("mapaUrl"),
    precioPublico: texto("precioPublico"),
    precioMiembro: texto("precioMiembro"),
    cupo: texto("cupo"),
    instruccionesPago: texto("instruccionesPago"),
    registroAbierto: formData.get("registroAbierto") === "on",
    publicado: formData.get("publicado") === "on",
  }
}

const esSlugDuplicado = (error: { code?: string; message: string }) =>
  error.code === "23505" && error.message.includes("slug")

function errorAlGuardar(error: { code?: string; message: string }, valores: ValoresEvento): EstadoFormularioEvento {
  console.error("[panel] No se pudo guardar el evento:", error.code, error.message)
  return { tipo: "error", mensaje: "No se pudo guardar el evento. Inténtalo de nuevo.", errores: {}, valores }
}

export async function guardarEvento(
  eventoId: string | null,
  _estadoPrevio: EstadoFormularioEvento,
  formData: FormData
): Promise<EstadoFormularioEvento> {
  const miembro = await exigirMiembroConsejo()
  const valores = leerValores(formData)

  if (eventoId !== null && !esUuid(eventoId)) {
    return { tipo: "error", mensaje: "Evento no válido.", errores: {}, valores }
  }

  const resultado = esquemaEvento.safeParse(valores)
  if (!resultado.success) {
    return {
      tipo: "error",
      mensaje: "Revisa los campos marcados.",
      errores: z.flattenError(resultado.error).fieldErrors,
      valores,
    }
  }

  const datos = resultado.data

  const fila = {
    titulo: datos.titulo,
    resumen: datos.resumen,
    descripcion: datos.descripcion,
    inicia_en: isoDesdeHoraLocal(datos.fecha, datos.horaInicio),
    termina_en: datos.horaFin ? isoDesdeHoraLocal(datos.fecha, datos.horaFin) : null,
    lugar: datos.lugar,
    direccion: datos.direccion,
    mapa_url: datos.mapaUrl,
    precio_publico: datos.precioPublico,
    precio_miembro: datos.precioMiembro,
    cupo: datos.cupo,
    instrucciones_pago: datos.instruccionesPago,
    registro_abierto: datos.registroAbierto,
    publicado: datos.publicado,
  }

  const supabase = await crearClienteSupabaseConSesion()

  if (eventoId === null) {
    // La dirección se genera del título y el año; si ya existe, se agrega un número (-2, -3…).
    const base = slugParaEvento(datos.titulo, datos.fecha)
    if (!base) {
      return {
        tipo: "error",
        mensaje: "Revisa los campos marcados.",
        errores: { titulo: ["El título debe incluir letras o números."] },
        valores,
      }
    }

    for (let intento = 1; intento <= 20; intento++) {
      const slug = intento === 1 ? base : `${base.slice(0, 76).replace(/-+$/, "")}-${intento}`
      const { data, error } = await supabase
        .from("eventos")
        .insert({ ...fila, slug, creado_por: miembro.usuarioId })
        .select("id")
        .single()

      if (error && esSlugDuplicado(error)) continue
      if (error) return errorAlGuardar(error, valores)

      revalidarEventos(slug)
      redirect(`/panel/eventos/${data.id}?creado=1`)
    }

    return {
      tipo: "error",
      mensaje: "Ya hay muchos eventos con ese título. Cámbialo un poco para distinguirlo.",
      errores: { titulo: ["Usa un título más específico."] },
      valores,
    }
  }

  // Al editar, la dirección no cambia para no romper enlaces ya compartidos.
  const { data, error } = await supabase.from("eventos").update(fila).eq("id", eventoId).select("id, slug")
  if (error) return errorAlGuardar(error, valores)
  if (!data?.length) {
    return { tipo: "error", mensaje: "No encontramos el evento o ya no tienes permiso para editarlo.", errores: {}, valores }
  }

  revalidarEventos(data[0].slug)
  return {
    tipo: "exito",
    mensaje: datos.publicado ? "Cambios guardados y publicados en el sitio." : "Cambios guardados. El evento sigue como borrador.",
  }
}

export async function eliminarEvento(eventoId: string): Promise<Resultado> {
  const miembro = await exigirMiembroConsejo()
  if (miembro.rol !== "admin") return { ok: false, mensaje: "Solo un administrador puede eliminar eventos." }
  if (!esUuid(eventoId)) return { ok: false, mensaje: "Evento no válido." }

  const supabase = await crearClienteSupabaseConSesion()
  const { data: evento } = await supabase
    .from("eventos")
    .select("slug, portada_ruta, fotos:eventos_fotos(ruta)")
    .eq("id", eventoId)
    .maybeSingle()
  if (!evento) return { ok: false, mensaje: "No encontramos el evento." }

  const { data, error } = await supabase.from("eventos").delete().eq("id", eventoId).select("id")
  if (error) {
    if (error.code === "23503") {
      return {
        ok: false,
        mensaje: "Este evento ya tiene registros, así que no se puede borrar. Despublícalo para ocultarlo del sitio.",
      }
    }
    console.error("[panel] No se pudo eliminar el evento:", error.message)
    return { ok: false, mensaje: "No se pudo eliminar el evento. Inténtalo de nuevo." }
  }
  if (!data?.length) return { ok: false, mensaje: "No tienes permiso para eliminar este evento." }

  const rutas = [evento.portada_ruta, ...((evento.fotos ?? []) as { ruta: string }[]).map((foto) => foto.ruta)].filter(
    (ruta): ruta is string => Boolean(ruta)
  )
  if (rutas.length > 0) await supabase.storage.from(BUCKET).remove(rutas)

  revalidarEventos(evento.slug)
  redirect("/panel/eventos")
}

// Paso 1 de la subida: autoriza al navegador a subir un archivo directo a Storage.
export async function crearSubidaImagen(
  eventoId: string,
  destino: "portada" | "galeria",
  tipoMime: string
): Promise<{ ok: true; ruta: string; token: string } | { ok: false; mensaje: string }> {
  await exigirMiembroConsejo()
  if (!esUuid(eventoId) || (destino !== "portada" && destino !== "galeria")) {
    return { ok: false, mensaje: "Solicitud de subida no válida." }
  }

  const extension = EXTENSIONES[tipoMime as keyof typeof EXTENSIONES]
  if (!extension) return { ok: false, mensaje: "Formato no permitido. Usa JPG, PNG o WebP." }

  const supabase = await crearClienteSupabaseConSesion()
  const ruta = `${eventoId}/${destino}/${randomUUID()}.${extension}`
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(ruta)

  if (error || !data) {
    console.error("[panel] No se pudo crear la URL de subida:", error?.message)
    return { ok: false, mensaje: "No se pudo preparar la subida. Inténtalo de nuevo." }
  }
  return { ok: true, ruta: data.path, token: data.token }
}

const formatoRuta = (eventoId: string, destino: "portada" | "galeria") =>
  new RegExp(`^${eventoId}/${destino}/[0-9a-f-]{36}\\.(jpg|png|webp)$`)

// Paso 2: guarda la portada recién subida y borra la anterior.
export async function confirmarPortada(eventoId: string, ruta: string): Promise<Resultado> {
  await exigirMiembroConsejo()
  if (!esUuid(eventoId) || !formatoRuta(eventoId, "portada").test(ruta)) {
    return { ok: false, mensaje: "Imagen no válida." }
  }

  const supabase = await crearClienteSupabaseConSesion()
  const { data: previo } = await supabase.from("eventos").select("slug, portada_ruta").eq("id", eventoId).maybeSingle()
  if (!previo) return { ok: false, mensaje: "No encontramos el evento." }

  const { error } = await supabase.from("eventos").update({ portada_ruta: ruta }).eq("id", eventoId)
  if (error) {
    console.error("[panel] No se pudo guardar la portada:", error.message)
    return { ok: false, mensaje: "No se pudo guardar la portada." }
  }

  if (previo.portada_ruta && previo.portada_ruta !== ruta) {
    await supabase.storage.from(BUCKET).remove([previo.portada_ruta])
  }

  revalidarEventos(previo.slug)
  return { ok: true }
}

export async function quitarPortada(eventoId: string): Promise<Resultado> {
  await exigirMiembroConsejo()
  if (!esUuid(eventoId)) return { ok: false, mensaje: "Evento no válido." }

  const supabase = await crearClienteSupabaseConSesion()
  const { data: previo } = await supabase.from("eventos").select("slug, portada_ruta").eq("id", eventoId).maybeSingle()
  if (!previo) return { ok: false, mensaje: "No encontramos el evento." }

  const { error } = await supabase.from("eventos").update({ portada_ruta: null }).eq("id", eventoId)
  if (error) return { ok: false, mensaje: "No se pudo quitar la portada." }

  if (previo.portada_ruta) await supabase.storage.from(BUCKET).remove([previo.portada_ruta])

  revalidarEventos(previo.slug)
  return { ok: true }
}

export async function agregarFoto(eventoId: string, ruta: string): Promise<Resultado> {
  await exigirMiembroConsejo()
  if (!esUuid(eventoId) || !formatoRuta(eventoId, "galeria").test(ruta)) {
    return { ok: false, mensaje: "Imagen no válida." }
  }

  const supabase = await crearClienteSupabaseConSesion()
  const [{ data: evento }, { data: ultima }] = await Promise.all([
    supabase.from("eventos").select("slug").eq("id", eventoId).maybeSingle(),
    supabase.from("eventos_fotos").select("orden").eq("evento_id", eventoId).order("orden", { ascending: false }).limit(1).maybeSingle(),
  ])
  if (!evento) return { ok: false, mensaje: "No encontramos el evento." }

  const { error } = await supabase
    .from("eventos_fotos")
    .insert({ evento_id: eventoId, ruta, orden: (ultima?.orden ?? -1) + 1 })
  if (error) {
    console.error("[panel] No se pudo agregar la foto:", error.message)
    return { ok: false, mensaje: "No se pudo agregar la foto a la galería." }
  }

  revalidarEventos(evento.slug)
  return { ok: true }
}

export async function eliminarFoto(fotoId: string): Promise<Resultado> {
  await exigirMiembroConsejo()
  if (!esUuid(fotoId)) return { ok: false, mensaje: "Foto no válida." }

  const supabase = await crearClienteSupabaseConSesion()
  const { data: foto } = await supabase
    .from("eventos_fotos")
    .select("ruta, evento:eventos(slug)")
    .eq("id", fotoId)
    .maybeSingle()
  if (!foto) return { ok: false, mensaje: "No encontramos la foto." }

  const { error } = await supabase.from("eventos_fotos").delete().eq("id", fotoId)
  if (error) return { ok: false, mensaje: "No se pudo quitar la foto." }

  await supabase.storage.from(BUCKET).remove([foto.ruta])

  const evento = foto.evento as unknown as { slug: string } | null
  revalidarEventos(evento?.slug)
  return { ok: true }
}

export async function cambiarEstadoRegistro(registroId: string, eventoId: string, estado: EstadoRegistro): Promise<void> {
  await exigirMiembroConsejo()
  if (!esUuid(registroId) || !esUuid(eventoId) || !esEstadoRegistro(estado)) return

  const supabase = await crearClienteSupabaseConSesion()
  const { error } = await supabase
    .from("registros_evento")
    .update({ estado })
    .eq("id", registroId)
    .eq("evento_id", eventoId)

  // 23505: al reactivar, ya existe otro registro activo con el mismo correo.
  if (error) console.error("[panel] No se pudo cambiar el estado del registro:", error.code, error.message)

  const { data: evento } = await supabase.from("eventos").select("slug").eq("id", eventoId).maybeSingle()
  revalidarEventos(evento?.slug)
}
