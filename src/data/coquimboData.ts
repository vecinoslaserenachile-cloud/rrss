export interface SlideMeta {
  id: number;
  slug: string;
  shortLabel: string;
  kicker: string;
  title: string;
  subtitle: string;
}

export const SLIDES: SlideMeta[] = [
  {
    id: 0,
    slug: 'resumen-ejecutivo',
    shortLabel: 'Resumen',
    kicker: 'Capítulo 01 · Dashboard de Resumen Ejecutivo (14 oct – 14 nov 2026)',
    title: 'Dashboard de Resumen Ejecutivo',
    subtitle:
      'Indicadores clave de rendimiento (KPIs), crecimiento neto, engagement rate medio y participación de los 20 perfiles monitoreados en Coquimbo.',
  },
  {
    id: 1,
    slug: 'alcance',
    shortLabel: 'Alcance',
    kicker: 'Lámina 02 · Distribución de Interacciones',
    title: 'Cuota de Alcance por Medio',
    subtitle:
      'Concentración del ecosistema: dos medios líderes capturan el 61% de todas las interacciones regionales del período.',
  },
  {
    id: 2,
    slug: 'comparativa',
    shortLabel: 'Comparativa',
    kicker: 'Lámina 03 · Volumen vs. Intensidad',
    title: 'Seguidores vs. Engagement',
    subtitle:
      'Las audiencias más grandes no garantizan mayor tasa de respuesta: creadores ágiles lideran la conversación.',
  },
  {
    id: 3,
    slug: 'ranking',
    shortLabel: 'Top 20',
    kicker: 'Lámina 04 · Tabla Completa Auditada',
    title: 'Ranking Top 20 Me Gusta',
    subtitle:
      'Desglose de los 3.132.700 Me gusta acumulados entre medios informativos, cuentas ciudadanas e instituciones.',
  },
  {
    id: 4,
    slug: 'agenda',
    shortLabel: 'Agenda',
    kicker: 'Lámina 05 · Esfera Temática e Hitos',
    title: 'Agenda Temática y Hashtags',
    subtitle:
      'Contingencia previsional, hitos hídricos regionales y cultura pop marcaron las mayores tasas de conversación.',
  },
  {
    id: 5,
    slug: 'sentimiento',
    shortLabel: 'Sentimiento',
    kicker: 'Lámina 06 · Curva de Tensión Ciudadana',
    title: 'Radar de Sentimiento Negativo',
    subtitle:
      'Cuatro episodios críticos elevaron la negatividad sobre el 36%, alcanzando un techo de 52% el 23 de octubre.',
  },
  {
    id: 6,
    slug: 'formatos',
    shortLabel: 'Formatos',
    kicker: 'Lámina 07 · Estrategia y Cierre',
    title: 'Ingeniería de Formatos y Audiencia',
    subtitle:
      'La brecha entre lo que se publica y lo que conecta define la hoja de ruta editorial para 2027.',
  },
  {
    id: 7,
    slug: 'actores-megusta',
    shortLabel: 'Me Gusta',
    kicker: 'Lámina 08 · Detalle Exclusivo por Cuenta',
    title: 'Me Gusta del Período por Actor',
    subtitle:
      'Desglose individual de las 22 cuentas monitoreadas en Instagram (@handles) ordenado por volumen de Me gusta.',
  },
  {
    id: 8,
    slug: 'cuota-influencia-pastel',
    shortLabel: 'Pastel 3D',
    kicker: 'Lámina 09 · Cuota de Influencia en Me Gusta',
    title: 'Cuota de Influencia por Actor Principal',
    subtitle:
      'Gráfico de pastel 3D interactivo sobre 3.107.800 Me gusta: seis perfiles principales concentran el 90,3% de la aprobación regional.',
  },
];

export interface ReachShareItem {
  id: string;
  name: string;
  interactions: number;
  interactionsLabel: string;
  sharePct: number;
  color: string;
  note: string;
}

export const REACH_SHARE_DATA: ReachShareItem[] = [
  {
    id: 'mi-radio',
    name: 'Mi Radio',
    interactions: 1300000,
    interactionsLabel: '1,30M',
    sharePct: 36.3,
    color: '#0284C7',
    note: 'Líder absoluto en volumen y ritmo de cobertura regional.',
  },
  {
    id: 'diario-el-dia',
    name: 'Diario El Día',
    interactions: 886000,
    interactionsLabel: '886k',
    sharePct: 24.7,
    color: '#0F172A',
    note: 'Segundo actor principal con fuerte respaldo de comunidad.',
  },
  {
    id: 'guayacan-cl',
    name: 'Guayacán CL',
    interactions: 355000,
    interactionsLabel: '355k',
    sharePct: 9.9,
    color: '#10B981',
    note: 'Alto retorno por publicación y conexión ciudadana directa.',
  },
  {
    id: 'la-serena-4',
    name: 'La Serena 4',
    interactions: 284000,
    interactionsLabel: '284k',
    sharePct: 7.9,
    color: '#F97316',
    note: 'Cobertura hiperlocal con rápida tracción viral.',
  },
  {
    id: 'informate-serena',
    name: 'Infórmate Serena',
    interactions: 216000,
    interactionsLabel: '216k',
    sharePct: 6.0,
    color: '#38BDF8',
    note: 'Consolidado en noticias de servicio y contingencia.',
  },
  {
    id: 'otros-15',
    name: 'Otros 15 perfiles',
    interactions: 548000,
    interactionsLabel: '548k',
    sharePct: 15.2,
    color: '#64748B',
    note: 'Suma combinada de medios locales, municipios y figuras.',
  },
];

export interface FollowersItem {
  name: string;
  followers: number;
  label: string;
  color: string;
}

export const TOP_FOLLOWERS_DATA: FollowersItem[] = [
  { name: 'Diario El Día', followers: 278000, label: '278k', color: '#0F172A' },
  { name: 'Mi Radio', followers: 271000, label: '271k', color: '#0284C7' },
  { name: 'La Serena Online', followers: 211000, label: '211k', color: '#334155' },
  { name: 'Infórmate Serena', followers: 169000, label: '169k', color: '#38BDF8' },
  { name: 'Prensa Cuarta', followers: 159000, label: '159k', color: '#475569' },
  { name: 'I. Municipalidad La Serena', followers: 142000, label: '142k', color: '#64748B' },
];

export interface EngagementItem {
  name: string;
  engagement: number;
  label: string;
  color: string;
}

export const TOP_ENGAGEMENT_DATA: EngagementItem[] = [
  { name: 'Papaya TV', engagement: 28, label: '28%', color: '#F97316' },
  { name: 'Mi Radio', engagement: 18, label: '18%', color: '#0284C7' },
  { name: 'Guayacán CL', engagement: 14, label: '14%', color: '#10B981' },
  { name: 'RSB Chile', engagement: 14, label: '14%', color: '#34D399' },
  { name: 'Diario El Día', engagement: 11, label: '11%', color: '#0F172A' },
  { name: 'Gobierno Regional', engagement: 7.37, label: '7,37%', color: '#FB923C' },
];

export type AccountCategory = 'Medio Informativo' | 'Comunidad / Viral' | 'Institucional / Figura';

export interface Top20Account {
  rank: number;
  name: string;
  likes: number;
  category: AccountCategory;
  shareOfLikes: number;
}

export const TOP_20_LIKES: Top20Account[] = [
  { rank: 1, name: 'Mi Radio', likes: 1200000, category: 'Medio Informativo', shareOfLikes: 38.31 },
  { rank: 2, name: 'Diario El Día', likes: 798000, category: 'Medio Informativo', shareOfLikes: 25.47 },
  { rank: 3, name: 'Guayacán CL', likes: 261000, category: 'Medio Informativo', shareOfLikes: 8.33 },
  { rank: 4, name: 'La Serena 4', likes: 250000, category: 'Comunidad / Viral', shareOfLikes: 7.98 },
  { rank: 5, name: 'Infórmate Serena', likes: 195000, category: 'Comunidad / Viral', shareOfLikes: 6.22 },
  { rank: 6, name: 'Papaya TV', likes: 115000, category: 'Comunidad / Viral', shareOfLikes: 3.67 },
  { rank: 7, name: 'Vecinos La Serena', likes: 51200, category: 'Comunidad / Viral', shareOfLikes: 1.63 },
  { rank: 8, name: 'I. Municipalidad La Serena', likes: 42600, category: 'Institucional / Figura', shareOfLikes: 1.36 },
  { rank: 9, name: 'RSB Chile', likes: 36300, category: 'Comunidad / Viral', shareOfLikes: 1.16 },
  { rank: 10, name: 'Daniela Norambuena', likes: 34200, category: 'Institucional / Figura', shareOfLikes: 1.09 },
  { rank: 11, name: 'Diario La Región', likes: 32800, category: 'Medio Informativo', shareOfLikes: 1.05 },
  { rank: 12, name: 'El Observatodo', likes: 27800, category: 'Medio Informativo', shareOfLikes: 0.89 },
  { rank: 13, name: 'Radio Montecarlo', likes: 22400, category: 'Medio Informativo', shareOfLikes: 0.72 },
  { rank: 14, name: 'La Serena Online', likes: 20900, category: 'Comunidad / Viral', shareOfLikes: 0.67 },
  { rank: 15, name: 'Serena Televisión', likes: 15900, category: 'Medio Informativo', shareOfLikes: 0.51 },
  { rank: 16, name: 'La Serena Institucional', likes: 14300, category: 'Institucional / Figura', shareOfLikes: 0.46 },
  { rank: 17, name: 'Coquimbo Comunicaciones', likes: 9700, category: 'Medio Informativo', shareOfLikes: 0.31 },
  { rank: 18, name: 'Las Compañías', likes: 3400, category: 'Comunidad / Viral', shareOfLikes: 0.11 },
  { rank: 19, name: 'Sin Censura', likes: 1200, category: 'Comunidad / Viral', shareOfLikes: 0.04 },
  { rank: 20, name: 'La Serena Turismo', likes: 0, category: 'Institucional / Figura', shareOfLikes: 0.0 },
];

export interface HashtagItem {
  tag: string;
  interactionPct: number;
  color: string;
  topic: string;
}

export const HASHTAGS_DATA: HashtagItem[] = [
  { tag: '#afp', interactionPct: 45, color: '#F97316', topic: 'Debate previsional y multifondos' },
  { tag: '#tocopilla', interactionPct: 23, color: '#0284C7', topic: 'Contingencia y alcance interregional' },
  { tag: '#lapaloma', interactionPct: 18, color: '#10B981', topic: 'Crisis hídrica y recuperación' },
  { tag: '#embalselapaloma', interactionPct: 18, color: '#0F172A', topic: 'Hito histórico tras 29 años' },
  { tag: '#avdelmar', interactionPct: 17, color: '#38BDF8', topic: 'Borde costero y vida urbana' },
  { tag: '#montepatria', interactionPct: 15, color: '#10B981', topic: 'Actualidad provincial Limarí' },
];

export interface ViralMilestone {
  id: string;
  title: string;
  interactions: number;
  interactionsLabel: string;
  extra?: string;
  color: string;
  category: string;
}

export const VIRAL_MILESTONES: ViralMilestone[] = [
  {
    id: 'paloma',
    title: 'Embalse La Paloma tras 29 años',
    interactions: 78700,
    interactionsLabel: '78,7k',
    color: '#10B981',
    category: 'Hito Hídrico',
  },
  {
    id: 'emilia',
    title: 'Emilia Dides',
    interactions: 73500,
    interactionsLabel: '73,5k',
    color: '#0284C7',
    category: 'Cultura & Tendencia',
  },
  {
    id: 'adopcion',
    title: 'Adopción en La Serena',
    interactions: 61600,
    interactionsLabel: '61,6k',
    color: '#0F172A',
    category: 'Impacto Social',
  },
  {
    id: 'afp-papaya',
    title: 'Debate AFP · Papaya TV',
    interactions: 54700,
    interactionsLabel: '54,7k',
    extra: '273% interacción',
    color: '#F97316',
    category: 'Contingencia Viral',
  },
];

export interface SentimentPoint {
  date: string;
  shortDate: string;
  negativity: number;
  isPeak: boolean;
  label?: string;
  detail?: string;
}

export const SENTIMENT_SERIES: SentimentPoint[] = [
  { date: '14 oct', shortDate: '14 oct', negativity: 18, isPeak: false },
  { date: '17 oct', shortDate: '17 oct', negativity: 21, isPeak: false },
  {
    date: '21 oct',
    shortDate: '21 oct',
    negativity: 43,
    isPeak: true,
    label: 'Pérdidas multifondos',
    detail: 'Fuerte malestar ciudadano ante caída en fondos previsionales.',
  },
  {
    date: '23 oct',
    shortDate: '23 oct',
    negativity: 52,
    isPeak: true,
    label: 'Crisis de urgencias médicas',
    detail: 'Pico máximo del período por colapso y tiempos de espera en urgencias.',
  },
  { date: '26 oct', shortDate: '26 oct', negativity: 24, isPeak: false },
  {
    date: '30-31 oct',
    shortDate: '30-31 oct',
    negativity: 36,
    isPeak: true,
    label: 'Paro camioneros Ruta 5',
    detail: 'Tensión vial y cortes intermitentes en accesos a la conurbación.',
  },
  { date: '4 nov', shortDate: '4 nov', negativity: 20, isPeak: false },
  {
    date: '9 nov',
    shortDate: '9 nov',
    negativity: 38,
    isPeak: true,
    label: 'Cortes de internet y salud',
    detail: 'Reclamos simultáneos por fallas de conectividad y atención primaria.',
  },
  { date: '14 nov', shortDate: '14 nov', negativity: 19, isPeak: false },
];

export interface FormatComparison {
  format: string;
  volume: number;
  volumeLabel: string;
  engagementRate: number;
  engagementLabel: string;
  color: string;
}

export const FORMATS_DATA: FormatComparison[] = [
  {
    format: 'Imágenes',
    volume: 2800,
    volumeLabel: '2.800',
    engagementRate: 0.53,
    engagementLabel: '0,53%',
    color: '#0F172A',
  },
  {
    format: 'Videos / Reels',
    volume: 1800,
    volumeLabel: '1.800',
    engagementRate: 1.36,
    engagementLabel: '1,36%',
    color: '#10B981',
  },
  {
    format: 'Carruseles',
    volume: 694,
    volumeLabel: '694',
    engagementRate: 0.39,
    engagementLabel: '0,39%',
    color: '#F97316',
  },
];

export interface ActorLikesMetric {
  rank: number;
  handle: string;
  likes: number;
  likesLabel: string;
  followersLabel: string;
  posts: number;
  commentsLabel: string;
  interactionRate: string;
  performanceIndex: string;
}

export const ACTORS_LIKES_DATA: ActorLikesMetric[] = [
  { rank: 1, handle: '@miradiols', likes: 1200000, likesLabel: '1,2M', followersLabel: '272k', posts: 783, commentsLabel: '68,2k', interactionRate: '0,62%', performanceIndex: '94%' },
  { rank: 2, handle: '@eldia.cl', likes: 796000, likesLabel: '796k', followersLabel: '278k', posts: 990, commentsLabel: '55,2k', interactionRate: '0,32%', performanceIndex: '89%' },
  { rank: 3, handle: '@guayacancl', likes: 264000, likesLabel: '264k', followersLabel: '87,5k', posts: 459, commentsLabel: '75,4k', interactionRate: '0,91%', performanceIndex: '99%' },
  { rank: 4, handle: '@laserena4', likes: 245000, likesLabel: '245k', followersLabel: '211k', posts: 114, commentsLabel: '22,6k', interactionRate: '1,16%', performanceIndex: '52%' },
  { rank: 5, handle: '@informateserena', likes: 187000, likesLabel: '187k', followersLabel: '169k', posts: 120, commentsLabel: '16,3k', interactionRate: '1,03%', performanceIndex: '17%' },
  { rank: 6, handle: '@papayatv_ls', likes: 113000, likesLabel: '113k', followersLabel: '21,8k', posts: 189, commentsLabel: '23,5k', interactionRate: '4,31%', performanceIndex: '100%' },
  { rank: 7, handle: '@vecinoslaserena2', likes: 44100, likesLabel: '44,1k', followersLabel: '42,9k', posts: 49, commentsLabel: '1,2k', interactionRate: '2,27%', performanceIndex: '48%' },
  { rank: 8, handle: '@muni_laserena', likes: 41800, likesLabel: '41,8k', followersLabel: '142k', posts: 75, commentsLabel: '4,0k', interactionRate: '0,46%', performanceIndex: '41%' },
  { rank: 9, handle: '@rsbchile', likes: 36100, likesLabel: '36,1k', followersLabel: '13,4k', posts: 287, commentsLabel: '5,1k', interactionRate: '1,13%', performanceIndex: '100%' },
  { rank: 10, handle: '@daniela.laserena', likes: 33800, likesLabel: '33,8k', followersLabel: '66,3k', posts: 37, commentsLabel: '3,3k', interactionRate: '1,59%', performanceIndex: '75%' },
  { rank: 11, handle: '@diariolaregionnoticias', likes: 32100, likesLabel: '32,1k', followersLabel: '19,3k', posts: 328, commentsLabel: '2,0k', interactionRate: '0,61%', performanceIndex: '100%' },
  { rank: 12, handle: '@elobservatodo.cl', likes: 27800, likesLabel: '27,8k', followersLabel: '128k', posts: 39, commentsLabel: '4,0k', interactionRate: '0,81%', performanceIndex: '35%' },
  { rank: 13, handle: '@montecarlocl', likes: 21900, likesLabel: '21,9k', followersLabel: '72,0k', posts: 226, commentsLabel: '5,5k', interactionRate: '0,19%', performanceIndex: '48%' },
  { rank: 14, handle: '@soydlaserena', likes: 21200, likesLabel: '21,2k', followersLabel: '24,3k', posts: 32, commentsLabel: '829', interactionRate: '2,99%', performanceIndex: '87%' },
  { rank: 15, handle: '@serena_television', likes: 15500, likesLabel: '15,5k', followersLabel: '49,4k', posts: 39, commentsLabel: '938', interactionRate: '0,89%', performanceIndex: '53%' },
  { rank: 16, handle: '@laserenaonline', likes: 15000, likesLabel: '15,0k', followersLabel: '71,3k', posts: 684, commentsLabel: '713', interactionRate: '0,034%', performanceIndex: '19%' },
  { rank: 17, handle: '@coquimbo.comunicaciones', likes: 9200, likesLabel: '9,2k', followersLabel: '11,6k', posts: 130, commentsLabel: '6,0k', interactionRate: '1,09%', performanceIndex: '91%' },
  { rank: 18, handle: '@lascompaniasteinforma', likes: 2800, likesLabel: '2,8k', followersLabel: '12,8k', posts: 28, commentsLabel: '128', interactionRate: '0,82%', performanceIndex: '37%' },
  { rank: 19, handle: '@sincensuraprensa', likes: 1500, likesLabel: '1,5k', followersLabel: '40,5k', posts: 3, commentsLabel: '115', interactionRate: '1,37%', performanceIndex: '2,00%' },
  { rank: 20, handle: '@esdeserenense', likes: 0, likesLabel: '0', followersLabel: '105k', posts: 34, commentsLabel: '656', interactionRate: '0,029%', performanceIndex: '2,00%' },
  { rank: 21, handle: '@prensacuartaregion', likes: 0, likesLabel: '0', followersLabel: '159k', posts: 64, commentsLabel: '1,7k', interactionRate: '0,047%', performanceIndex: '2,00%' },
  { rank: 22, handle: '@laserenacl', likes: 0, likesLabel: '0', followersLabel: '65,6k', posts: 0, commentsLabel: '0', interactionRate: '0%', performanceIndex: '5,00%' },
];

export interface LikesPieSlice {
  rank: number;
  name: string;
  handle: string;
  likes: number;
  likesLabel: string;
  sharePct: number;
  color: string;
  role: string;
}

export const LIKES_PIE_DATA: LikesPieSlice[] = [
  {
    rank: 1,
    name: 'Mi Radio',
    handle: '@miradiols',
    likes: 1200000,
    likesLabel: '1,20M',
    sharePct: 38.61,
    color: '#0284C7',
    role: 'Líder hegemónico · 38,6% de la aprobación',
  },
  {
    rank: 2,
    name: 'Diario El Día',
    handle: '@eldia.cl',
    likes: 796000,
    likesLabel: '796k',
    sharePct: 25.61,
    color: '#0F172A',
    role: 'Segundo pilar regional · 25,6% de cuota',
  },
  {
    rank: 3,
    name: 'Guayacán CL',
    handle: '@guayacancl',
    likes: 264000,
    likesLabel: '264k',
    sharePct: 8.49,
    color: '#10B981',
    role: 'Tercer referente informativo regional',
  },
  {
    rank: 4,
    name: 'La Serena 4',
    handle: '@laserena4',
    likes: 245000,
    likesLabel: '245k',
    sharePct: 7.88,
    color: '#F97316',
    role: 'Medio comunitario de alta tracción viral',
  },
  {
    rank: 5,
    name: 'Infórmate Serena',
    handle: '@informateserena',
    likes: 187000,
    likesLabel: '187k',
    sharePct: 6.02,
    color: '#38BDF8',
    role: 'Actor clave en noticias de servicio local',
  },
  {
    rank: 6,
    name: 'Papaya TV',
    handle: '@papayatv_ls',
    likes: 113000,
    likesLabel: '113k',
    sharePct: 3.64,
    color: '#FB923C',
    role: 'Máxima eficiencia de interacción (4,31%)',
  },
  {
    rank: 7,
    name: 'Otros 16 perfiles',
    handle: '16 cuentas restantes',
    likes: 302800,
    likesLabel: '302,8k',
    sharePct: 9.74,
    color: '#64748B',
    role: 'Suma combinada de actores #7 al #22',
  },
];

export interface EcosystemSegmentSummary {
  segment: AccountCategory;
  accounts: number;
  likes: number;
  likesLabel: string;
  sharePct: number;
  color: string;
}

export const ECOSYSTEM_SEGMENT_SUMMARY: EcosystemSegmentSummary[] = [
  {
    segment: 'Medio Informativo',
    accounts: 8,
    likes: 2367600,
    likesLabel: '2,37M',
    sharePct: 75.6,
    color: '#0284C7',
  },
  {
    segment: 'Comunidad / Viral',
    accounts: 8,
    likes: 673000,
    likesLabel: '673,0k',
    sharePct: 21.5,
    color: '#10B981',
  },
  {
    segment: 'Institucional / Figura',
    accounts: 4,
    likes: 91100,
    likesLabel: '91,1k',
    sharePct: 2.9,
    color: '#0F172A',
  },
];

export function formatSpanishInt(val: number): string {
  return Math.round(val).toLocaleString('es-CL');
}
