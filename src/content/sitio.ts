// Contenido editable del sitio. Los textos marcados como provisionales deben validarse con el Consejo.

export const sitio = {
  nombre: "Colectivo de Ingenieros Jóvenes de Jalisco A.C.",
  nombreCorto: "Ingenieros Jóvenes de Jalisco",
  lema: "¡Cuando la ingeniería se une, Jalisco avanza!",
  descripcion:
    "El 1 de enero de 2016 se creó el Colectivo de Ingenieros Jóvenes de Jalisco con el fin de integrar un equipo académico, técnico y de ingeniería.",
  fundacion: 2016,
  consejosDirectivos: 7,
  consejoActual: "VII Consejo Directivo",
  redes: {
    instagram: "https://www.instagram.com/colectivo_jalisco/",
    facebook: "https://www.facebook.com/COLECTIVOJALISCO/",
  },
} as const

// Las anclas llevan "/" para funcionar también desde otras páginas (p. ej. /eventos).
export const navegacion = [
  { href: "/#nosotros", etiqueta: "Nosotros" },
  { href: "/#pilares", etiqueta: "Pilares" },
  { href: "/eventos", etiqueta: "Eventos" },
  { href: "/#beneficios", etiqueta: "Beneficios" },
  { href: "/#preguntas", etiqueta: "Preguntas" },
] as const

// Provisional: redactado a partir de las redes sociales.
export const pilares = [
  {
    clave: "empresarial",
    titulo: "Empresarial",
    resumen: "Negocios, empleo y emprendimiento",
    descripcion:
      "Vinculamos a ingenieros con empresas y emprendedores para generar oportunidades de negocio, empleo y crecimiento profesional.",
    enfoques: [
      "Networking con empresas y cámaras",
      "Oportunidades laborales y de negocio",
      "Emprendimiento en ingeniería",
    ],
    imagen: "/images/stock/empresarial-estrategia.jpg",
  },
  {
    clave: "gremial",
    titulo: "Gremial",
    resumen: "Unión entre especialidades",
    descripcion:
      "Fortalecemos la unión del gremio con espacios de convivencia y colaboración entre todas las especialidades de la ingeniería.",
    enfoques: [
      "Encuentros entre especialidades",
      "Colaboración con colegios y asociaciones",
      "Sentido de pertenencia",
    ],
    imagen: "/images/stock/reunion-gremial.jpg",
  },
  {
    clave: "academico",
    titulo: "Académico",
    resumen: "Formación y actualización",
    descripcion:
      "Acercamos a estudiantes y egresados a universidades, capacitaciones y espacios de actualización profesional.",
    enfoques: [
      "Vinculación con universidades",
      "Capacitación y actualización",
      "Acompañamiento a estudiantes",
    ],
    imagen: "/images/stock/academico-conferencia.jpg",
  },
  {
    clave: "politico",
    titulo: "Político",
    resumen: "Voz en lo público",
    descripcion:
      "Participamos en la conversación pública para que la voz de la ingeniería joven influya en las decisiones que construyen Jalisco.",
    enfoques: [
      "Participación en foros públicos",
      "Propuestas para el desarrollo del estado",
      "Representación de la ingeniería joven",
    ],
    imagen: "/images/stock/politico-sala-consejo.jpg",
  },
  {
    clave: "tecnico",
    titulo: "Técnico",
    resumen: "Conocimiento aplicado",
    descripcion:
      "Compartimos conocimiento práctico, buenas prácticas y soluciones de ingeniería pensadas para las necesidades de nuestra región.",
    enfoques: [
      "Pláticas y talleres técnicos",
      "Divulgación de buenas prácticas",
      "Soluciones para la región",
    ],
    imagen: "/images/stock/tecnico-planos.jpg",
  },
] as const

// Provisional: basado en las historias destacadas de Instagram.
export const actividades = [
  {
    titulo: "Eventos y networking",
    descripcion:
      "Encuentros como Jalisco al Grito, donde la convivencia también construye comunidad y nuevas oportunidades.",
    imagen: "/images/stock/equipo-mesa.jpg",
  },
  {
    titulo: "Reuniones de trabajo",
    descripcion: "Sesiones del Consejo y de comisiones donde se organizan los proyectos del Colectivo.",
    imagen: "/images/stock/equipo-colaborando.jpg",
  },
  {
    titulo: "Podcast y divulgación",
    descripcion: "Conversaciones y cápsulas como “¿Sabías que?” para acercar la ingeniería a más personas.",
    imagen: "/images/stock/divulgacion-equipo.jpg",
  },
  {
    titulo: "Conmemoraciones",
    descripcion: "Reconocemos a la ingeniería y a quienes la practican en las fechas importantes del gremio.",
    imagen: "/images/stock/ciudad-construccion.jpg",
  },
] as const

// Provisional: validar con el Consejo.
export const beneficios = [
  {
    clave: "red",
    titulo: "Red de contactos",
    descripcion:
      "Conecta con ingenieros de distintas especialidades, empresas e instituciones de todo Jalisco.",
  },
  {
    clave: "crecimiento",
    titulo: "Crecimiento profesional",
    descripcion: "Entérate de oportunidades laborales y de negocio que circulan dentro de la comunidad.",
  },
  {
    clave: "eventos",
    titulo: "Eventos del gremio",
    descripcion: "Participa en encuentros, reuniones y celebraciones, con precio preferente para miembros.",
  },
  {
    clave: "aprendizaje",
    titulo: "Aprendizaje continuo",
    descripcion: "Pláticas, podcast y contenido de divulgación para mantenerte actualizado.",
  },
  {
    clave: "voz",
    titulo: "Voz en lo público",
    descripcion: "Súmate a propuestas y foros donde la ingeniería joven aporta al desarrollo del estado.",
  },
  {
    clave: "pertenencia",
    titulo: "Comunidad con historia",
    descripcion: "Forma parte de un colectivo con más de diez años de trayectoria y un propósito común.",
  },
] as const

export const pasosAfiliacion = [
  {
    titulo: "Envía tu solicitud",
    descripcion: "Llena el formulario con tus datos básicos. Solo necesitas ser mayor de 18 años.",
  },
  {
    titulo: "El Consejo la revisa",
    descripcion: "El Consejo Directivo valida tu solicitud y prepara tu integración.",
  },
  {
    titulo: "Te damos la bienvenida",
    descripcion: "Te contactamos por correo o WhatsApp para sumarte a la comunidad.",
  },
] as const

// Provisional: respuestas redactadas con la información confirmada hasta ahora.
export const preguntasFrecuentes = [
  {
    pregunta: "¿Quién puede unirse al Colectivo?",
    respuesta:
      "Si tienes 18 años o más y te interesa la ingeniería, puedes enviar tu solicitud: es el único requisito.",
  },
  {
    pregunta: "¿Cómo es el proceso de afiliación?",
    respuesta:
      "Envías la solicitud desde este sitio, el Consejo Directivo la revisa y te contacta por correo o WhatsApp con los siguientes pasos.",
  },
  {
    pregunta: "¿La membresía tiene costo?",
    respuesta: "El Consejo Directivo te compartirá los detalles de la membresía al revisar tu solicitud.",
  },
  {
    pregunta: "¿Tengo que vivir en Guadalajara?",
    respuesta:
      "No. Recibimos solicitudes de todo Jalisco; en el formulario solo te pedimos tu municipio.",
  },
  {
    pregunta: "¿Qué actividades organiza el Colectivo?",
    respuesta:
      "Eventos de networking, reuniones de trabajo, podcast, contenido de divulgación y conmemoraciones del gremio, entre otras.",
  },
  {
    pregunta: "¿Cómo me entero de los próximos eventos?",
    respuesta: "Publicamos todas las convocatorias en nuestras cuentas de Instagram y Facebook.",
  },
] as const

// Principales municipios para autocompletar; el campo acepta cualquier municipio.
export const municipiosSugeridos = [
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
