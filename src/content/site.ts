// Editable site content. Texts marked as provisional must be validated with the Board.

export const site = {
  name: "Colectivo de Ingenieros Jóvenes de Jalisco A.C.",
  shortName: "Ingenieros Jóvenes de Jalisco",
  tagline: "¡Cuando la ingeniería se une, Jalisco avanza!",
  description:
    "El 1 de enero de 2016 se creó el Colectivo de Ingenieros Jóvenes de Jalisco con el fin de integrar un equipo académico, técnico y de ingeniería.",
  foundedYear: 2016,
  boardTerms: 7,
  currentBoard: "VII Consejo Directivo",
  social: {
    instagram: "https://www.instagram.com/colectivo_jalisco/",
    facebook: "https://www.facebook.com/COLECTIVOJALISCO/",
  },
} as const

// Anchors are prefixed with "/" so they also work from other pages (e.g. /eventos).
export const navigation = [
  { href: "/#nosotros", label: "Nosotros" },
  { href: "/#pilares", label: "Pilares" },
  { href: "/eventos", label: "Eventos" },
  { href: "/#beneficios", label: "Beneficios" },
  { href: "/#preguntas", label: "Preguntas" },
] as const

// Provisional: written from the social media accounts.
export const pillars = [
  {
    key: "business",
    title: "Empresarial",
    summary: "Negocios, empleo y emprendimiento",
    description:
      "Vinculamos a ingenieros con empresas y emprendedores para generar oportunidades de negocio, empleo y crecimiento profesional.",
    focusAreas: [
      "Networking con empresas y cámaras",
      "Oportunidades laborales y de negocio",
      "Emprendimiento en ingeniería",
    ],
    image: "/images/stock/business-strategy.jpg",
  },
  {
    key: "guild",
    title: "Gremial",
    summary: "Unión entre especialidades",
    description:
      "Fortalecemos la unión del gremio con espacios de convivencia y colaboración entre todas las especialidades de la ingeniería.",
    focusAreas: [
      "Encuentros entre especialidades",
      "Colaboración con colegios y asociaciones",
      "Sentido de pertenencia",
    ],
    image: "/images/stock/guild-meeting.jpg",
  },
  {
    key: "academic",
    title: "Académico",
    summary: "Formación y actualización",
    description:
      "Acercamos a estudiantes y egresados a universidades, capacitaciones y espacios de actualización profesional.",
    focusAreas: [
      "Vinculación con universidades",
      "Capacitación y actualización",
      "Acompañamiento a estudiantes",
    ],
    image: "/images/stock/academic-conference.jpg",
  },
  {
    key: "policy",
    title: "Político",
    summary: "Voz en lo público",
    description:
      "Participamos en la conversación pública para que la voz de la ingeniería joven influya en las decisiones que construyen Jalisco.",
    focusAreas: [
      "Participación en foros públicos",
      "Propuestas para el desarrollo del estado",
      "Representación de la ingeniería joven",
    ],
    image: "/images/stock/policy-council-room.jpg",
  },
  {
    key: "technical",
    title: "Técnico",
    summary: "Conocimiento aplicado",
    description:
      "Compartimos conocimiento práctico, buenas prácticas y soluciones de ingeniería pensadas para las necesidades de nuestra región.",
    focusAreas: [
      "Pláticas y talleres técnicos",
      "Divulgación de buenas prácticas",
      "Soluciones para la región",
    ],
    image: "/images/stock/technical-blueprints.jpg",
  },
] as const

// Provisional: based on the Instagram story highlights.
export const activities = [
  {
    title: "Eventos y networking",
    description:
      "Encuentros como Jalisco al Grito, donde la convivencia también construye comunidad y nuevas oportunidades.",
    image: "/images/stock/team-table.jpg",
  },
  {
    title: "Reuniones de trabajo",
    description: "Sesiones del Consejo y de comisiones donde se organizan los proyectos del Colectivo.",
    image: "/images/stock/team-collaborating.jpg",
  },
  {
    title: "Podcast y divulgación",
    description: "Conversaciones y cápsulas como “¿Sabías que?” para acercar la ingeniería a más personas.",
    image: "/images/stock/outreach-team.jpg",
  },
  {
    title: "Conmemoraciones",
    description: "Reconocemos a la ingeniería y a quienes la practican en las fechas importantes del gremio.",
    image: "/images/stock/city-construction.jpg",
  },
] as const

// Provisional: validate with the Board.
export const benefits = [
  {
    key: "network",
    title: "Red de contactos",
    description:
      "Conecta con ingenieros de distintas especialidades, empresas e instituciones de todo Jalisco.",
  },
  {
    key: "growth",
    title: "Crecimiento profesional",
    description: "Entérate de oportunidades laborales y de negocio que circulan dentro de la comunidad.",
  },
  {
    key: "events",
    title: "Eventos del gremio",
    description: "Participa en encuentros, reuniones y celebraciones, con precio preferente para miembros.",
  },
  {
    key: "learning",
    title: "Aprendizaje continuo",
    description: "Pláticas, podcast y contenido de divulgación para mantenerte actualizado.",
  },
  {
    key: "voice",
    title: "Voz en lo público",
    description: "Súmate a propuestas y foros donde la ingeniería joven aporta al desarrollo del estado.",
  },
  {
    key: "belonging",
    title: "Comunidad con historia",
    description: "Forma parte de un colectivo con más de diez años de trayectoria y un propósito común.",
  },
] as const

export const membershipSteps = [
  {
    title: "Envía tu solicitud",
    description: "Llena el formulario con tus datos básicos. Solo necesitas ser mayor de 18 años.",
  },
  {
    title: "El Consejo la revisa",
    description: "El Consejo Directivo valida tu solicitud y prepara tu integración.",
  },
  {
    title: "Te damos la bienvenida",
    description: "Te contactamos por correo o WhatsApp para sumarte a la comunidad.",
  },
] as const

// Provisional: answers written with the information confirmed so far.
export const faqs = [
  {
    question: "¿Quién puede unirse al Colectivo?",
    answer:
      "Si tienes 18 años o más y te interesa la ingeniería, puedes enviar tu solicitud: es el único requisito.",
  },
  {
    question: "¿Cómo es el proceso de afiliación?",
    answer:
      "Envías la solicitud desde este sitio, el Consejo Directivo la revisa y te contacta por correo o WhatsApp con los siguientes pasos.",
  },
  {
    question: "¿La membresía tiene costo?",
    answer: "El Consejo Directivo te compartirá los detalles de la membresía al revisar tu solicitud.",
  },
  {
    question: "¿Tengo que vivir en Guadalajara?",
    answer:
      "No. Recibimos solicitudes de todo Jalisco; en el formulario solo te pedimos tu municipio.",
  },
  {
    question: "¿Qué actividades organiza el Colectivo?",
    answer:
      "Eventos de networking, reuniones de trabajo, podcast, contenido de divulgación y conmemoraciones del gremio, entre otras.",
  },
  {
    question: "¿Cómo me entero de los próximos eventos?",
    answer: "Publicamos todas las convocatorias en nuestras cuentas de Instagram y Facebook.",
  },
] as const

// Main municipalities for autocomplete; the field accepts any municipality.
export const suggestedMunicipalities = [
  "Guadalajara",
  "Zapopan",
  "San Pedro Tlaquepaque",
  "Tonalá",
  "Tlajomulco de Zúñiga",
  "El Salto",
  "Juanacatlán",
  "Ixtlahuacán de los Membrillos",
  "Zapotlanejo",
  "Puerto Vallarta",
  "Lagos de Moreno",
  "Tepatitlán de Morelos",
  "Ciudad Guzmán (Zapotlán el Grande)",
  "Ocotlán",
  "Chapala",
  "Autlán de Navarro",
  "Ameca",
  "Tequila",
] as const
