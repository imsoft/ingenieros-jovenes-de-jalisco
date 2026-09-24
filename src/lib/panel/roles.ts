// Qué puede hacer cada rol del Consejo. La base de datos es la que lo hace cumplir;
// esto solo lo explica en el panel.
export const descripcionRoles = {
  revisor: {
    nombre: "Revisor",
    resumen: "Revisa solicitudes, crea y edita eventos y da seguimiento a los registros.",
  },
  admin: {
    nombre: "Administrador",
    resumen: "Todo lo del revisor, más gestionar al Consejo, eliminar eventos y moderar perfiles.",
  },
} as const
