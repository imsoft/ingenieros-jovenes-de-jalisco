"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { ImagePlusIcon, MapPinIcon, Trash2Icon } from "lucide-react"
import { cn } from "cn"

import { createProfilePhotoUpload, saveProfile } from "@/actions/profile"
import { MemberAvatar } from "@/components/members/member-avatar"
import { Notice } from "@/components/site/notice"
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
import { suggestedMunicipalities } from "@/content/site"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"
import type { ProfileField, ProfileFormState } from "@/lib/validations/profile"

const initialState: ProfileFormState = { status: "idle" }
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_BYTES = 2 * 1024 * 1024

const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
const matchesMunicipality = (municipality: string, query: string) => normalize(municipality).includes(normalize(query))

export type ProfileFormValues = {
  fullName: string
  headline: string
  specialty: string
  company: string
  jobTitle: string
  municipality: string
  bio: string
  linkedinUrl: string
  instagramHandle: string
  websiteUrl: string
  isVisible: boolean
  photoPath: string
}

type TextFieldProps = React.ComponentProps<"input"> & {
  name: ProfileField
  label: string
  errors: Partial<Record<ProfileField, string[]>>
  description?: string
}

function TextField({ name, label, errors, description, className, ...props }: TextFieldProps) {
  const error = errors[name]?.[0]
  return (
    <Field data-invalid={error ? true : undefined} className={className}>
      <FieldLabel htmlFor={`profile-${name}`}>{label}</FieldLabel>
      <Input
        id={`profile-${name}`}
        name={name}
        className="h-11 rounded-xl px-4"
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError>{error}</FieldError>
    </Field>
  )
}

function PhotoPicker({
  name,
  photoUrl,
  onChange,
}: {
  name: string
  photoUrl: string | null
  onChange: (photo: { path: string; url: string } | null) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSelect(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) return setError("Usa una imagen JPG, PNG o WebP.")
    if (file.size > MAX_BYTES) return setError("La foto pesa más de 2 MB.")

    setError(null)
    setUploading(true)
    const upload = await createProfilePhotoUpload(file.type)
    if (!upload.ok) {
      setUploading(false)
      return setError(upload.message)
    }

    const { error: uploadError } = await createBrowserSupabaseClient()
      .storage.from("profiles")
      .uploadToSignedUrl(upload.path, upload.token, file, { contentType: file.type, cacheControl: "31536000" })
    setUploading(false)

    if (uploadError) return setError("No se pudo subir la foto. Inténtalo de nuevo.")
    onChange({ path: upload.path, url: URL.createObjectURL(file) })
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <span className="relative shrink-0 rounded-full ring-4 ring-brand-orange/20">
        <MemberAvatar name={name} photoUrl={photoUrl} size={112} />
        {uploading ? (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-brand-navy/60">
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
              uploading && "pointer-events-none opacity-50"
            )}
          >
            <ImagePlusIcon data-icon="inline-start" aria-hidden />
            {photoUrl ? "Cambiar foto" : "Subir foto"}
            <input
              type="file"
              accept={ALLOWED_TYPES.join(",")}
              disabled={uploading}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ""
                if (file) void handleSelect(file)
              }}
            />
          </label>
          {photoUrl ? (
            <Button type="button" variant="ghost" size="lg" className="h-10 text-destructive" disabled={uploading} onClick={() => onChange(null)}>
              <Trash2Icon data-icon="inline-start" aria-hidden />
              Quitar
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">JPG, PNG o WebP de hasta 2 MB. Se guarda al guardar tu perfil.</p>
        {error ? <Notice variant="error">{error}</Notice> : null}
      </div>
    </div>
  )
}

export function ProfileForm({
  values,
  initialPhotoUrl,
  isNew,
}: {
  values: ProfileFormValues
  initialPhotoUrl: string | null
  isNew: boolean
}) {
  const [state, formAction, pending] = useActionState(saveProfile, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const noticeRef = useRef<HTMLDivElement>(null)
  const [fullName, setFullName] = useState(values.fullName)
  const [municipality, setMunicipality] = useState(values.municipality)
  const [photo, setPhoto] = useState({ path: values.photoPath, url: initialPhotoUrl })
  const errors = state.status === "error" ? state.errors : {}

  useEffect(() => {
    if (state.status === "error") {
      const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ;(invalid ?? noticeRef.current)?.focus()
    }
    if (state.status === "success") noticeRef.current?.focus()
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-8" noValidate>
      <input type="hidden" name="photoPath" value={photo.path} />

      <PhotoPicker
        name={fullName}
        photoUrl={photo.url}
        onChange={(next) => setPhoto(next ?? { path: "", url: null })}
      />

      <FieldSet>
        <FieldLegend className="font-heading text-lg text-brand-blue uppercase">¿Quién eres?</FieldLegend>
        <FieldGroup className="gap-4">
          <TextField
            name="fullName"
            label="Nombre"
            errors={errors}
            autoComplete="name"
            required
            maxLength={120}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name="specialty"
              label="Especialidad"
              errors={errors}
              maxLength={120}
              placeholder="Ingeniería civil, mecatrónica…"
              defaultValue={values.specialty}
            />
            <Field data-invalid={errors.municipality ? true : undefined}>
              <FieldLabel htmlFor="profile-municipality">Municipio</FieldLabel>
              <Autocomplete
                items={suggestedMunicipalities}
                value={municipality}
                onValueChange={setMunicipality}
                filter={matchesMunicipality}
                openOnInputClick
              >
                <AutocompleteInput
                  id="profile-municipality"
                  name="municipality"
                  autoComplete="off"
                  maxLength={80}
                  placeholder="Escribe o elige…"
                  className="h-11 rounded-xl px-4"
                  aria-invalid={errors.municipality ? true : undefined}
                />
                <AutocompleteContent>
                  <AutocompleteEmpty>Puedes escribir cualquier municipio.</AutocompleteEmpty>
                  <AutocompleteList>
                    {(option: string) => (
                      <AutocompleteItem key={option} value={option}>
                        <MapPinIcon aria-hidden />
                        {option}
                      </AutocompleteItem>
                    )}
                  </AutocompleteList>
                </AutocompleteContent>
              </Autocomplete>
              <FieldError>{errors.municipality?.[0]}</FieldError>
            </Field>
          </div>
          <Field data-invalid={errors.bio ? true : undefined}>
            <FieldLabel htmlFor="profile-bio">Sobre ti</FieldLabel>
            <Textarea
              id="profile-bio"
              name="bio"
              rows={5}
              maxLength={1000}
              defaultValue={values.bio}
              placeholder="Cuéntale al Colectivo quién eres, qué te apasiona y en qué te gustaría colaborar."
              className="rounded-xl px-4 py-3"
              aria-invalid={errors.bio ? true : undefined}
            />
            <FieldError>{errors.bio?.[0]}</FieldError>
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend className="font-heading text-lg text-brand-blue uppercase">¿A qué te dedicas?</FieldLegend>
        <FieldGroup className="gap-4">
          <TextField
            name="headline"
            label="Tu trabajo en una frase"
            errors={errors}
            maxLength={160}
            placeholder="Superviso obra de infraestructura hidráulica"
            defaultValue={values.headline}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="company" label="Empresa" errors={errors} maxLength={120} autoComplete="organization" defaultValue={values.company} />
            <TextField name="jobTitle" label="Puesto" errors={errors} maxLength={120} autoComplete="organization-title" defaultValue={values.jobTitle} />
          </div>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend className="font-heading text-lg text-brand-blue uppercase">¿Dónde encontrarte?</FieldLegend>
        <FieldGroup className="gap-4">
          <TextField
            name="linkedinUrl"
            label="LinkedIn"
            errors={errors}
            type="url"
            inputMode="url"
            spellCheck={false}
            placeholder="linkedin.com/in/tu-usuario"
            defaultValue={values.linkedinUrl}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="instagramHandle" label="Instagram" errors={errors} spellCheck={false} placeholder="@tu_usuario" defaultValue={values.instagramHandle} />
            <TextField
              name="websiteUrl"
              label="Sitio web"
              errors={errors}
              type="url"
              inputMode="url"
              spellCheck={false}
              placeholder="tuempresa.com"
              defaultValue={values.websiteUrl}
            />
          </div>
        </FieldGroup>
      </FieldSet>

      <Field orientation="horizontal" className="rounded-2xl bg-secondary/60 p-4">
        <FieldContent>
          <FieldLabel htmlFor="profile-isVisible" className="text-brand-blue">
            Mostrar mi perfil en el directorio
          </FieldLabel>
          <FieldDescription>Solo lo ven miembros con sesión iniciada. Nunca es público.</FieldDescription>
        </FieldContent>
        <Switch id="profile-isVisible" name="isVisible" defaultChecked={values.isVisible} />
      </Field>

      {state.status !== "idle" ? (
        <Notice ref={noticeRef} tabIndex={-1} variant={state.status} className="outline-none">
          {state.message}
        </Notice>
      ) : null}

      <Button type="submit" variant="accent" size="xl" disabled={pending} className="w-full sm:w-fit sm:self-end">
        {pending ? <Spinner data-icon="inline-start" /> : null}
        {pending ? "Guardando…" : isNew ? "Crear mi perfil" : "Guardar cambios"}
      </Button>
    </form>
  )
}
