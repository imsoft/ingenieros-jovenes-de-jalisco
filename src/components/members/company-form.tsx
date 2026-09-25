"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ImagePlusIcon, MapPinIcon, TagIcon, Trash2Icon } from "lucide-react"
import { cn } from "cn"

import { createCompanyLogoUpload, saveCompany } from "@/actions/company"
import { CompanyLogo } from "@/components/members/company-card"
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
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { companySectors, suggestedMunicipalities } from "@/content/site"
import { companyRoleLabels, companyRoles, MAX_SERVICE_LENGTH, type CompanyField, type CompanyFormState, type CompanyRole } from "@/lib/validations/company"

import { CharacterCount, HandleInput, TagInput } from "./form-inputs"
import { ACCEPTED_IMAGE_TYPES, useImageUpload } from "./use-image-upload"

const initialState: CompanyFormState = { status: "idle" }
const DESCRIPTION_MAX = 600

const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
const matches = (option: string, query: string) => normalize(option).includes(normalize(query))

export type CompanyFormValues = {
  name: string
  role: CompanyRole
  jobTitle: string
  sector: string
  description: string
  services: string[]
  municipality: string
  address: string
  websiteUrl: string
  linkedinUrl: string
  instagramHandle: string
  facebookUrl: string
  logoPath: string
}

const roleHints: Record<CompanyRole, string> = {
  owner: "La fundaste o la diriges.",
  partner: "Tienes participación en ella.",
  employee: "Trabajas ahí.",
  freelance: "Das servicios por tu cuenta.",
}

type Errors = Partial<Record<CompanyField, string[]>>

function TextField({ name, label, errors, description, ...props }: React.ComponentProps<"input"> & { name: CompanyField; label: string; errors: Errors; description?: string }) {
  const error = errors[name]?.[0]
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={`company-${name}`}>{label}</FieldLabel>
      <Input id={`company-${name}`} name={name} className="h-11 rounded-xl px-4" aria-invalid={error ? true : undefined} {...props} />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError>{error}</FieldError>
    </Field>
  )
}

// Free-text field with suggestions (sector, municipality).
function SuggestField({
  name,
  label,
  errors,
  options,
  defaultValue,
  placeholder,
  icon: Icon,
}: {
  name: CompanyField
  label: string
  errors: Errors
  options: readonly string[]
  defaultValue: string
  placeholder: string
  icon: typeof MapPinIcon
}) {
  const [value, setValue] = useState(defaultValue)
  const error = errors[name]?.[0]
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={`company-${name}`}>{label}</FieldLabel>
      <Autocomplete items={[...options]} value={value} onValueChange={setValue} filter={matches} openOnInputClick>
        <AutocompleteInput
          id={`company-${name}`}
          name={name}
          autoComplete="off"
          maxLength={80}
          placeholder={placeholder}
          className="h-11 rounded-xl px-4"
          aria-invalid={error ? true : undefined}
        />
        <AutocompleteContent>
          <AutocompleteEmpty>Puedes escribir cualquier valor.</AutocompleteEmpty>
          <AutocompleteList>
            {(option: string) => (
              <AutocompleteItem key={option} value={option}>
                <Icon aria-hidden />
                {option}
              </AutocompleteItem>
            )}
          </AutocompleteList>
        </AutocompleteContent>
      </Autocomplete>
      <FieldError>{error}</FieldError>
    </Field>
  )
}

function LogoPicker({ logoUrl, onChange }: { logoUrl: string | null; onChange: (logo: { path: string; url: string } | null) => void }) {
  const { upload, uploading, error } = useImageUpload(createCompanyLogoUpload)

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <span className="relative">
        <CompanyLogo logoUrl={logoUrl} size={96} />
        {uploading ? (
          <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-brand-navy/60">
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
            {logoUrl ? "Cambiar logo" : "Subir logo"}
            <input
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              disabled={uploading}
              className="sr-only"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                event.target.value = ""
                if (!file) return
                const uploaded = await upload(file)
                if (uploaded) onChange(uploaded)
              }}
            />
          </label>
          {logoUrl ? (
            <Button type="button" variant="ghost" size="lg" className="h-10 text-destructive" disabled={uploading} onClick={() => onChange(null)}>
              <Trash2Icon data-icon="inline-start" aria-hidden />
              Quitar
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">JPG, PNG o WebP de hasta 2 MB. De preferencia con fondo blanco o transparente.</p>
        {error ? <Notice variant="error">{error}</Notice> : null}
      </div>
    </div>
  )
}

export function CompanyForm({ companyId, values, initialLogoUrl }: { companyId: string | null; values: CompanyFormValues; initialLogoUrl: string | null }) {
  const [state, formAction, pending] = useActionState(saveCompany.bind(null, companyId), initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const noticeRef = useRef<HTMLDivElement>(null)
  const [name, setName] = useState(values.name)
  const [logo, setLogo] = useState({ path: values.logoPath, url: initialLogoUrl })
  const [descriptionLength, setDescriptionLength] = useState(values.description.length)
  const errors = state.status === "error" ? state.errors : {}

  useEffect(() => {
    if (state.status !== "error") return
    const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
    ;(invalid ?? noticeRef.current)?.focus()
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-8" noValidate>
      <input type="hidden" name="logoPath" value={logo.path} />

      <LogoPicker logoUrl={logo.url} onChange={(next) => setLogo(next ?? { path: "", url: null })} />

      <FieldGroup className="gap-4">
        <TextField
          name="name"
          label="Nombre de la empresa o emprendimiento"
          errors={errors}
          required
          maxLength={120}
          autoComplete="organization"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </FieldGroup>

      <FieldSet>
        <FieldLegend variant="label">Tu relación con la empresa</FieldLegend>
        <RadioGroup name="role" defaultValue={values.role} className="grid gap-3 sm:grid-cols-2">
          {companyRoles.map((role) => (
            <FieldLabel key={role} htmlFor={`company-role-${role}`} className="rounded-2xl!">
              <Field orientation="horizontal" className="p-3.5!">
                <FieldContent>
                  <FieldTitle className="text-brand-blue">{companyRoleLabels[role]}</FieldTitle>
                  <FieldDescription>{roleHints[role]}</FieldDescription>
                </FieldContent>
                <RadioGroupItem id={`company-role-${role}`} value={role} />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
        <FieldError>{errors.role?.[0]}</FieldError>
      </FieldSet>

      <FieldGroup className="gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="jobTitle" label="Tu puesto" errors={errors} maxLength={120} autoComplete="organization-title" placeholder="Director general, residente de obra…" defaultValue={values.jobTitle} />
          <SuggestField name="sector" label="Giro" errors={errors} options={companySectors} defaultValue={values.sector} placeholder="Escribe o elige…" icon={TagIcon} />
        </div>
        <Field data-invalid={errors.description ? true : undefined}>
          <FieldLabel htmlFor="company-description">¿Qué hace la empresa?</FieldLabel>
          <Textarea
            id="company-description"
            name="description"
            rows={4}
            maxLength={DESCRIPTION_MAX}
            defaultValue={values.description}
            onChange={(event) => setDescriptionLength(event.target.value.length)}
            aria-describedby="company-description-count"
            placeholder="Cuéntale al Colectivo a qué se dedica, a quién atiende y qué la distingue."
            className="rounded-xl px-4 py-3"
            aria-invalid={errors.description ? true : undefined}
          />
          <CharacterCount id="company-description-count" length={descriptionLength} max={DESCRIPTION_MAX} />
          <FieldError>{errors.description?.[0]}</FieldError>
        </Field>
        <Field data-invalid={errors.services ? true : undefined}>
          <FieldLabel htmlFor="company-services">Servicios o productos</FieldLabel>
          <TagInput
            id="company-services"
            name="services"
            itemLabel="Servicios"
            defaultValue={values.services}
            maxLength={MAX_SERVICE_LENGTH}
            placeholder="Ej. Diseño estructural"
            describedBy="company-services-hint"
            invalid={Boolean(errors.services)}
          />
          <FieldDescription id="company-services-hint">Escribe uno y presiona Enter o Agregar. Así te encuentran en el directorio.</FieldDescription>
          <FieldError>{errors.services?.[0]}</FieldError>
        </Field>
      </FieldGroup>

      <FieldSet>
        <FieldLegend className="font-heading text-lg text-brand-blue uppercase">Ubicación</FieldLegend>
        <FieldGroup className="gap-4">
          <TextField
            name="address"
            label="Dirección"
            errors={errors}
            maxLength={200}
            autoComplete="street-address"
            placeholder="Calle, número y colonia"
            description="Solo la ven los miembros. Déjala vacía si trabajas desde casa."
            defaultValue={values.address}
          />
          <SuggestField name="municipality" label="Municipio" errors={errors} options={suggestedMunicipalities} defaultValue={values.municipality} placeholder="Escribe o elige…" icon={MapPinIcon} />
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend className="font-heading text-lg text-brand-blue uppercase">Sitio web y redes</FieldLegend>
        <FieldGroup className="gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="websiteUrl" label="Sitio web" errors={errors} type="url" inputMode="url" spellCheck={false} placeholder="tuempresa.com" defaultValue={values.websiteUrl} />
            <Field data-invalid={errors.instagramHandle ? true : undefined}>
              <FieldLabel htmlFor="company-instagramHandle">Instagram</FieldLabel>
              <HandleInput id="company-instagramHandle" name="instagramHandle" placeholder="tu_empresa" defaultValue={values.instagramHandle} invalid={Boolean(errors.instagramHandle)} />
              <FieldError>{errors.instagramHandle?.[0]}</FieldError>
            </Field>
            <TextField name="facebookUrl" label="Facebook" errors={errors} type="url" inputMode="url" spellCheck={false} placeholder="facebook.com/tuempresa" defaultValue={values.facebookUrl} />
            <TextField name="linkedinUrl" label="LinkedIn" errors={errors} type="url" inputMode="url" spellCheck={false} placeholder="linkedin.com/company/tuempresa" defaultValue={values.linkedinUrl} />
          </div>
        </FieldGroup>
      </FieldSet>

      {state.status === "error" ? (
        <Notice ref={noticeRef} tabIndex={-1} variant="error" className="outline-none">
          {state.message}
        </Notice>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href="/mi-perfil" className={cn(buttonVariants({ variant: "ghost", size: "xl" }), "w-full sm:w-fit")}>
          Cancelar
        </Link>
        <Button type="submit" variant="accent" size="xl" disabled={pending} className="w-full sm:w-fit">
          {pending ? <Spinner data-icon="inline-start" /> : null}
          {pending ? "Guardando…" : companyId ? "Guardar cambios" : "Agregar empresa"}
        </Button>
      </div>
    </form>
  )
}
