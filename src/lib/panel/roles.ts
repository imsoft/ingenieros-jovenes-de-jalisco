// What each board role can do. The database is what enforces it;
// this only explains it in the panel.
export const roleDescriptions = {
  reviewer: {
    name: "Revisor",
    summary: "Revisa solicitudes, crea y edita eventos y da seguimiento a los registros.",
  },
  admin: {
    name: "Administrador",
    summary: "Todo lo del revisor, más gestionar al Consejo, eliminar eventos y moderar perfiles.",
  },
} as const
