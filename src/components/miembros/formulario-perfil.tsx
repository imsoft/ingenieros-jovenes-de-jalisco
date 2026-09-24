"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { ImagePlusIcon, MapPinIcon, Trash2Icon } from "lucide-react"
import { cn } from "cn"

import { crearSubidaFotoPerfil, guardarPerfil } from "@/acciones/perfil"
import { AvatarMiembro } from "@/components/miembros/avatar-miembro"
import { Aviso } from "@/components/sitio/aviso"
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from "@/components/ui/autocomplete"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { municipiosSugeridos } from "@/content/sitio"
import { crearClienteSupabaseNavegador } from "@/lib/supabase/navegador"
import type { CampoPerfil, EstadoFormularioPerfil } from "@/lib/validaciones/perfil"

const estadoInicial: EstadoFormularioPerfil = { tipo: "inicial" }
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"]
const MAXIMO_BYTES = 2 * 1024 * 1024

const normalizar = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
const coincideMunicipio = (municipio: string, consulta: string) => normalizar(municipio).includes(normalizar(consulta))

export type ValoresPerfil = {
  nombre: string
  ocupacion: string
  especialidad: string
  empresa: string
  puesto: string
  municipio: string
  biografia: string
  linkedin_url: string
  instagram: string
  sitio_web: string
  visible: boolean
  foto_ruta: string
}

type PropsCampo = React.ComponentProps<"input"> & {
  nombre: CampoPerfil
  etiqueta: string
  errores: Partial<Record<CampoPerfil, string[]>>
  descripcion?: string
}

function Campo({ nombre, etiqueta, errores, descripcion, className, ...props }: PropsCampo) {
  const error = errores[nombre]?.[0]
  return (
    <Field data-invalid={error ? true : undefined} className={className}>
      <FieldLabel htmlFor={`perfil-${nombre}`}>{etiqueta}</FieldLabel>
      <Input
        id={`perfil-${nombre}`}
        name={nombre}
        className="h-11 rounded-xl px-4"
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {descripcion ? <FieldDescription>{descripcion}</FieldDescription> : null}
      <FieldError>{error}</FieldError>
    </Field>
  )
}

function SelectorFoto({
  nombre,
  fotoUrl,
  alCambiar,
}: {
  nombre: string
  fotoUrl: string | null
  alCambiar: (foto: { ruta: string; url: string } | null) => void
}) {
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function alElegir(archivo: File) {
    if (!TIPOS_PERMITIDOS.includes(archivo.type)) return setError("Usa una imagen JPG, PNG o WebP.")
    if (archivo.size > MAXIMO_BYTES) return setError("La foto pesa más de 2 MB.")

    setError(null)
    setSubiendo(true)
    const permiso = await crearSubidaFotoPerfil(archivo.type)
    if (!permiso.ok) {
      setSubiendo(false)
      return setError(permiso.mensaje)
    }

    const { error: errorSubida } = await crearClienteSupabaseNavegador()
      .storage.from("perfiles")
      .uploadToSignedUrl(permiso.ruta, permiso.token, archivo, { contentType: archivo.type, cacheControl: "31536000" })
    setSubiendo(false)

    if (errorSubida) return setError("No se pudo subir la foto. Inténtalo de nuevo.")
    alCambiar({ ruta: permiso.ruta, url: URL.createObjectURL(archivo) })
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <span className="relative shrink-0 rounded-full ring-4 ring-naranja/20">
        <AvatarMiembro nombre={nombre} fotoUrl={fotoUrl} tamano={112} />
        {subiendo ? (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-azul-profundo/60">
            <Spinner className="size-6 text-white" />
          </span>
        ) : null}
      </span>

      <div className="flex flex-col items-center gap-2 sm:items-start">
        <div className="flex flex-wrap justify-center gap-2">
          <label
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-10 cursor-pointer focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
              subiendo && "pointer-events-none opacity-50"
            )}
          >
            <ImagePlusIcon data-icon="inline-start" aria-hidden />
            {fotoUrl ? "Cambiar foto" : "Subir foto"}
            <input
              type="file"
              accept={TIPOS_PERMITIDOS.join(",")}
              disabled={subiendo}
              className="sr-only"
              onChange={(evento) => {
                const archivo = evento.target.files?.[0]
                evento.target.value = ""
                if (archivo) void alElegir(archivo)
              }}
            />
          </label>
          {fotoUrl ? (
            <Button type="button" variant="ghost" size="lg" className="h-10 text-destructive" disabled={subiendo} onClick={() => alCambiar(null)}>
              <Trash2Icon data-icon="inline-start" aria-hidden />
              Quitar
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">JPG, PNG o WebP de hasta 2 MB. Se guarda al guardar tu perfil.</p>
        {error ? <Aviso tipo="error">{error}</Aviso> : null}
      </div>
    </div>
  )
}

export function FormularioPerfil({
  valores,
  fotoUrlInicial,
  esNuevo,
}: {
  valores: ValoresPerfil
  fotoUrlInicial: string | null
  esNuevo: boolean
}) {
  const [estado, accion, enviando] = useActionState(guardarPerfil, estadoInicial)
  const formularioRef = useRef<HTMLFormElement>(null)
  const avisoRef = useRef<HTMLDivElement>(null)
  const [nombre, setNombre] = useState(valores.nombre)
  const [municipio, setMunicipio] = useState(valores.municipio)
  const [foto, setFoto] = useState({ ruta: valores.foto_ruta, url: fotoUrlInicial })
  const errores = estado.tipo === "error" ? estado.errores : {}

  useEffect(() => {
    if (estado.tipo === "error") {
      const invalido = formularioRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ;(invalido ?? avisoRef.current)?.focus()
    }
    if (estado.tipo === "exito") avisoRef.current?.focus()
  }, [estado])

  return (
    <form ref={formularioRef} action={accion} className="flex flex-col gap-8" noValidate>
      <input type="hidden" name="foto_ruta" value={foto.ruta} />

      <SelectorFoto
        nombre={nombre}
        fotoUrl={foto.url}
        alCambiar={(nueva) => setFoto(nueva ?? { ruta: "", url: null })}
      />

      <FieldSet>
        <FieldLegend className="font-heading text-lg text-azul uppercase">¿Quién eres?</FieldLegend>
        <FieldGroup className="gap-4">
          <Campo
            nombre="nombre"
            etiqueta="Nombre"
            errores={errores}
            autoComplete="name"
            required
            maxLength={120}
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              nombre="especialidad"
              etiqueta="Especialidad"
              errores={errores}
              maxLength={120}
              placeholder="Ingeniería civil, mecatrónica…"
              defaultValue={valores.especialidad}
            />
            <Field data-invalid={errores.municipio ? true : undefined}>
              <FieldLabel htmlFor="perfil-municipio">Municipio</FieldLabel>
              <Autocomplete
                items={municipiosSugeridos}
                value={municipio}
                onValueChange={setMunicipio}
                filter={coincideMunicipio}
                openOnInputClick
              >
                <AutocompleteInput
                  id="perfil-municipio"
                  name="municipio"
                  autoComplete="off"
                  maxLength={80}
                  placeholder="Escribe o elige…"
                  className="h-11 rounded-xl px-4"
                  aria-invalid={errores.municipio ? true : undefined}
                />
                <AutocompleteContent>
                  <AutocompleteEmpty>Puedes escribir cualquier municipio.</AutocompleteEmpty>
                  <AutocompleteList>
                    {(opcion: string) => (
                      <AutocompleteItem key={opcion} value={opcion}>
                        <MapPinIcon aria-hidden />
                        {opcion}
                      </AutocompleteItem>
                    )}
                  </AutocompleteList>
                </AutocompleteContent>
              </Autocomplete>
              <FieldError>{errores.municipio?.[0]}</FieldError>
            </Field>
          </div>
          <Field data-invalid={errores.biografia ? true : undefined}>
            <FieldLabel htmlFor="perfil-biografia">Sobre ti</FieldLabel>
            <Textarea
              id="perfil-biografia"
              name="biografia"
              rows={5}
              maxLength={1000}
              defaultValue={valores.biografia}
              placeholder="Cuéntale al Colectivo quién eres, qué te apasiona y en qué te gustaría colaborar."
              className="rounded-xl px-4 py-3"
              aria-invalid={errores.biografia ? true : undefined}
            />
            <FieldError>{errores.biografia?.[0]}</FieldError>
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend className="font-heading text-lg text-azul uppercase">¿A qué te dedicas?</FieldLegend>
        <FieldGroup className="gap-4">
          <Campo
            nombre="ocupacion"
            etiqueta="Tu trabajo en una frase"
            errores={errores}
            maxLength={160}
            placeholder="Superviso obra de infraestructura hidráulica"
            defaultValue={valores.ocupacion}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo nombre="empresa" etiqueta="Empresa" errores={errores} maxLength={120} autoComplete="organization" defaultValue={valores.empresa} />
            <Campo nombre="puesto" etiqueta="Puesto" errores={errores} maxLength={120} autoComplete="organization-title" defaultValue={valores.puesto} />
          </div>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend className="font-heading text-lg text-azul uppercase">¿Dónde encontrarte?</FieldLegend>
        <FieldGroup className="gap-4">
          <Campo
            nombre="linkedin_url"
            etiqueta="LinkedIn"
            errores={errores}
            type="url"
            inputMode="url"
            spellCheck={false}
            placeholder="linkedin.com/in/tu-usuario"
            defaultValue={valores.linkedin_url}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo nombre="instagram" etiqueta="Instagram" errores={errores} spellCheck={false} placeholder="@tu_usuario" defaultValue={valores.instagram} />
            <Campo
              nombre="sitio_web"
              etiqueta="Sitio web"
              errores={errores}
              type="url"
              inputMode="url"
              spellCheck={false}
              placeholder="tuempresa.com"
              defaultValue={valores.sitio_web}
            />
          </div>
        </FieldGroup>
      </FieldSet>

      <Field orientation="horizontal" className="rounded-2xl bg-secondary/60 p-4">
        <FieldContent>
          <FieldLabel htmlFor="perfil-visible" className="text-azul">
            Mostrar mi perfil en el directorio
          </FieldLabel>
          <FieldDescription>Solo lo ven miembros con sesión iniciada. Nunca es público.</FieldDescription>
        </FieldContent>
        <Switch id="perfil-visible" name="visible" defaultChecked={valores.visible} />
      </Field>

      {estado.tipo !== "inicial" ? (
        <Aviso ref={avisoRef} tabIndex={-1} tipo={estado.tipo} className="outline-none">
          {estado.mensaje}
        </Aviso>
      ) : null}

      <Button type="submit" variant="acento" size="xl" disabled={enviando} className="w-full sm:w-fit sm:self-end">
        {enviando ? <Spinner data-icon="inline-start" /> : null}
        {enviando ? "Guardando…" : esNuevo ? "Crear mi perfil" : "Guardar cambios"}
      </Button>
    </form>
  )
}
