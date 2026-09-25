import { z } from "zod"

export const addBoardMemberSchema = z.object({
  fullName: z.string().trim().min(2, "Escribe su nombre.").max(120, "Máximo 120 caracteres."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "El correo es demasiado largo.")
    .pipe(z.email("Escribe un correo válido.")),
  role: z.enum(["admin", "reviewer"], { error: "Elige un rol." }),
})

export type AddBoardMemberField = keyof z.input<typeof addBoardMemberSchema>

export type AddBoardMemberFormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; errors: Partial<Record<AddBoardMemberField, string[]>> }

// Errors raised by the database (P0001) and the message shown to the board.
export const boardErrorMessages: Record<string, string> = {
  LAST_ADMIN: "El Consejo debe tener al menos un administrador activo. Nombra a otro antes de hacer este cambio.",
  ADMINS_ONLY: "Solo un administrador puede hacer esto.",
  NOT_FOUND: "No encontramos a esa persona. Recarga la página.",
}

export function getBoardErrorMessage(rawMessage: string, fallback: string) {
  const code = Object.keys(boardErrorMessages).find((key) => rawMessage.includes(key))
  return code ? boardErrorMessages[code] : fallback
}
