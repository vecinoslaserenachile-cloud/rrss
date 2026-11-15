export interface BenchmarkChapterMeta {
  id: number;
  slug: string;
  shortLabel: string;
  kicker: string;
  title: string;
  subtitle: string;
}

export const BENCHMARK_CHAPTERS: BenchmarkChapterMeta[] = [
  {
    id: 0,
    slug: 'ecosistema-28d',
    shortLabel: 'Ecosistema',
    kicker: 'Capítulo 01 · Telemetría Regional (28 Días)',
    title: 'Ecosistema Regional de Cuentas Públicas',
    subtitle:
      'Monitoreo de 26 cuentas institucionales y liderazgos locales: 1.965 publicaciones y 478,5k interacciones.',
  },
  {
    id: 1,
    slug: 'cuota-alcance',
    shortLabel: 'Alcance',
    kicker: 'Capítulo 02 · Concentración de Conversación',
    title: 'Cuota de Alcance e Interacciones',
    subtitle:
      'El Top 5 concentra el 50,1% de todas las interacciones regionales frente a otras 21 cuentas monitoreadas.',
  },
  {
    id: 2,
    slug: 'duelo-conurbado',
    shortLabel: 'Duelo',
    kicker: 'Capítulo 03 · La Serena vs. Coquimbo',
    title: 'Duelo Conurbado: Volumen vs. Eficiencia',
    subtitle:
      'Contraste directo entre municipios y liderazgos políticos de la conurbación en métricas totales y ratios por post.',
  },
  {
    id: 3,
    slug: 'outliers-hitos',
    shortLabel: 'Outliers',
    kicker: 'Capítulo 04 · Dispersión 3D Crecimiento vs. ER',
    title: 'Crecimiento vs. Engagement: Outliers e Hitos',
    subtitle:
      'Mapa tridimensional de casos atípicos de alta eficiencia (hasta 52% ER) y expansión orgánica de comunidad.',
  },
  {
    id: 4,
    slug: 'formatos-sentimiento',
    shortLabel: 'Formatos',
    kicker: 'Capítulo 05 · Rentabilidad Creativa & Tono',
    title: 'Rentabilidad de Formatos y Sentimiento',
    subtitle:
      'Videos/Reels multiplican por 3x la tasa de interacción frente a carruseles, con 75,4% de sentimiento positivo.',
  },
  {
    id: 5,
    slug: 'matriz-horaria',
    shortLabel: 'Matriz',
    kicker: 'Capítulo 06 · Mapa de Calor 7×8 y Hoja de Ruta',
    title: 'Matriz Horaria Óptima y Estrategia',
    subtitle:
      'Oportunidad nocturna y de fin de semana: menor saturación de publicaciones y máxima eficacia de respuesta.',
  },
  {
    id: 6,
    slug: 'resumen-comparativo',
    shortLabel: 'Resumen',
    kicker: 'Capítulo 07 · Síntesis Final Integrada',
    title: 'Resumen Ejecutivo de Ambos Reportes',
    subtitle:
      'Comparativa consolidada entre el Ecosistema Regional de Medios (31 días) y el Benchmark de Cuentas Públicas (28 días).',
  },
];

export const BENCHMARK_KPIS = [
  { label: 'Cuentas Monitoreadas', value: '26', detail: 'Municipios y liderazgos', color: '#00F0FF' },
  { label: 'Publicaciones', value: '1.965', detail: 'Volumen en 28 días', color: '#FFB800' },
  { label: 'Interacciones Totales', value: '478,5k', detail: 'Likes + comentarios', color: '#10B981' },
  { label: 'Engagement Rate Prom.', value: '1,97%', detail: 'Tasa media del período', color: '#FF2E93' },
  { label: 'Crecimiento Promedio', value: '+3,09%', detail: 'Expansión de seguidores', color: '#00F0FF' },
  { label: 'Cadencia Media', value: '2,7', detail: 'Posts / día por cuenta', color: '#FFB800' },
];

export interface BenchmarkFollowerRank {
  rank: number;
  handle: string;
  followers: number;
  followersLabel: string;
  role: string;
  color: string;
}

export const BENCHMARK_FOLLOWERS_TOP: BenchmarkFollowerRank[] = [
  { rank: 1, handle: '@muni_laserena', followers: 142000, followersLabel: '142k', role: 'Municipio Capital', color: '#00F0FF' },
  { rank: 2, handle: '@municipalidaddecoquimbo', followers: 120000, followersLabel: '120k', role: 'Municipio Puerto', color: '#10B981' },
  { rank: 3, handle: '@manouchehri19', followers: 86700, followersLabel: '86,7k', role: 'Liderazgo Político', color: '#FF2E93' },
  { rank: 4, handle: '@daniela.laserena', followers: 66300, followersLabel: '66,3k', role: 'Alcaldía La Serena', color: '#FFB800' },
  { rank: 5, handle: '@muniovalle', followers: 48800, followersLabel: '48,8k', role: 'Municipio Limarí', color: '#00F0FF' },
  { rank: 6, handle: '@munivicuna', followers: 30500, followersLabel: '30,5k', role: 'Municipio Elqui', color: '#10B981' },
  { rank: 7, handle: '@munilosvilos', followers: 29300, followersLabel: '29,3k', role: 'Municipio Choapa', color: '#FFB800' },
  { rank: 8, handle: '@municipalidadillapel', followers: 24000, followersLabel: '24,0k', role: 'Municipio Choapa', color: '#00F0FF' },
  { rank: 9, handle: '@munimpatria', followers: 22500, followersLabel: '22,5k', role: 'Municipio Limarí', color: '#10B981' },
  { rank: 10, handle: '@munisalamanca', followers: 19600, followersLabel: '19,6k', role: 'Municipio Choapa', color: '#FF2E93' },
];

export interface BenchmarkReachSlice {
  rank: number;
  handle: string;
  interactions: number;
  interactionsLabel: string;
  sharePct: number;
  color: string;
  note: string;
}

export const BENCHMARK_REACH_SLICES: BenchmarkReachSlice[] = [
  {
    rank: 1,
    handle: '@municipalidaddecoquimbo',
    interactions: 74400,
    interactionsLabel: '74,4k',
    sharePct: 15.5,
    color: '#00F0FF',
    note: 'Primer actor regional por volumen total de interacciones',
  },
  {
    rank: 2,
    handle: '@muni_laserena',
    interactions: 48100,
    interactionsLabel: '48,1k',
    sharePct: 10.1,
    color: '#10B981',
    note: 'Alta respuesta comunitaria sobre base de 142k seguidores',
  },
  {
    rank: 3,
    handle: '@municipalidadillapel',
    interactions: 40500,
    interactionsLabel: '40,5k',
    sharePct: 8.5,
    color: '#FFB800',
    note: 'Fuerte tracción provincial desde la provincia del Choapa',
  },
  {
    rank: 4,
    handle: '@daniela.laserena',
    interactions: 38600,
    interactionsLabel: '38,6k',
    sharePct: 8.1,
    color: '#FF2E93',
    note: 'Liderazgo personal con alta conversación directa',
  },
  {
    rank: 5,
    handle: '@muniovalle',
    interactions: 37900,
    interactionsLabel: '37,9k',
    sharePct: 7.9,
    color: '#38BDF8',
    note: 'Completa el Top 5 que acapara el 50,1% del ecosistema',
  },
  {
    rank: 6,
    handle: 'Otras 21 cuentas',
    interactions: 239000,
    interactionsLabel: '239,0k',
    sharePct: 49.9,
    color: '#475569',
    note: 'Suma combinada de los restantes 21 perfiles monitoreados',
  },
];

export interface ConurbanoActor {
  handle: string;
  city: 'La Serena' | 'Coquimbo';
  role: 'Institucional' | 'Autoridad';
  followers: number;
  followersLabel: string;
  posts: number;
  likes: number;
  likesLabel: string;
  comments: number;
  commentsLabel: string;
  er: number;
  erLabel: string;
  likesPerPost: number;
  likesPerPostLabel: string;
  commentsPerPost: number;
  commentsPerPostLabel: string;
  color: string;
}

export const CONURBANO_DUEL_DATA: ConurbanoActor[] = [
  {
    handle: '@muni_laserena',
    city: 'La Serena',
    role: 'Institucional',
    followers: 142000,
    followersLabel: '142k',
    posts: 75,
    likes: 41800,
    likesLabel: '41,8k',
    comments: 4000,
    commentsLabel: '4,0k',
    er: 0.46,
    erLabel: '0,46%',
    likesPerPost: 557.3,
    likesPerPostLabel: '557,3',
    commentsPerPost: 53.3,
    commentsPerPostLabel: '53,3',
    color: '#00F0FF',
  },
  {
    handle: '@municipalidaddecoquimbo',
    city: 'Coquimbo',
    role: 'Institucional',
    followers: 120000,
    followersLabel: '120k',
    posts: 152,
    likes: 68900,
    likesLabel: '68,9k',
    comments: 2100,
    commentsLabel: '2,1k',
    er: 0.41,
    erLabel: '0,41%',
    likesPerPost: 453.3,
    likesPerPostLabel: '453,3',
    commentsPerPost: 13.8,
    commentsPerPostLabel: '13,8',
    color: '#10B981',
  },
  {
    handle: '@daniela.laserena',
    city: 'La Serena',
    role: 'Autoridad',
    followers: 66300,
    followersLabel: '66,3k',
    posts: 37,
    likes: 33800,
    likesLabel: '33,8k',
    comments: 3300,
    commentsLabel: '3,3k',
    er: 1.59,
    erLabel: '1,59%',
    likesPerPost: 913.5,
    likesPerPostLabel: '913,5',
    commentsPerPost: 89.2,
    commentsPerPostLabel: '89,2',
    color: '#FFB800',
  },
  {
    handle: '@manouchehri19',
    city: 'Coquimbo',
    role: 'Autoridad',
    followers: 86700,
    followersLabel: '86,7k',
    posts: 9,
    likes: 25100,
    likesLabel: '25,1k',
    comments: 1000,
    commentsLabel: '1,0k',
    er: 3.51,
    erLabel: '3,51%',
    likesPerPost: 2788.9,
    likesPerPostLabel: '2.788,9',
    commentsPerPost: 111.1,
    commentsPerPostLabel: '111,1',
    color: '#FF2E93',
  },
];

export interface BenchmarkOutlierNode {
  id: string;
  handle: string;
  erPct: number;
  erLabel: string;
  growthAbs: number;
  growthLabel: string;
  interactions: number;
  interactionsLabel: string;
  milestone: string;
  color: string;
}

export const BENCHMARK_OUTLIERS: BenchmarkOutlierNode[] = [
  {
    id: 'ahumada',
    handle: '@alcaldeahumada',
    erPct: 22.0,
    erLabel: '~22% crec.',
    growthAbs: 2100,
    growthLabel: '+2.100 seg',
    interactions: 18500,
    interactionsLabel: 'Viral OVNI Cochiguaz',
    color: '#00F0FF',
    milestone: 'Mayor crecimiento absoluto (+2.100 seg / ~22% crec.) impulsado por viral OVNI Cochiguaz',
  },
  {
    id: 'muni-ls',
    handle: '@muni_laserena',
    erPct: 4.6,
    erLabel: '10,7k hito',
    growthAbs: 1750,
    growthLabel: '+1.750 seg',
    interactions: 48100,
    interactionsLabel: '48,1k int. (Av. del Mar 10,7k)',
    color: '#10B981',
    milestone: 'Hito Av. del Mar (10,7k int.) dispara expansión institucional',
  },
  {
    id: 'muni-coq',
    handle: '@municipalidaddecoquimbo',
    erPct: 4.1,
    erLabel: '74,4k total',
    growthAbs: 1650,
    growthLabel: '+1.650 seg',
    interactions: 74400,
    interactionsLabel: '74,4k interacciones',
    color: '#38BDF8',
    milestone: 'Líder en volumen absoluto de interacciones (74,4k) y crecimiento sólido',
  },
  {
    id: 'daniela',
    handle: '@daniela.laserena',
    erPct: 9.12,
    erLabel: '9,12% ER pico',
    growthAbs: 1550,
    growthLabel: '+1.550 seg',
    interactions: 38600,
    interactionsLabel: '38,6k int.',
    color: '#FFB800',
    milestone: 'Recuperación urbana alcanza 9,12% ER y +1.550 nuevos seguidores',
  },
  {
    id: 'vega',
    handle: '@hector_vega_campusano',
    erPct: 16.0,
    erLabel: '16% ER',
    growthAbs: 820,
    growthLabel: 'Hito hídrico',
    interactions: 14200,
    interactionsLabel: 'Embalse La Paloma',
    color: '#A855F7',
    milestone: '16% Engagement Rate impulsado por contingencia Embalse La Paloma',
  },
  {
    id: 'mpatria',
    handle: '@munimpatria',
    erPct: 50.0,
    erLabel: '50% ER',
    growthAbs: 980,
    growthLabel: 'Post #1 Paloma',
    interactions: 11200,
    interactionsLabel: '11,2k int.',
    color: '#FF2E93',
    milestone: '50% ER en publicación #1 del Embalse La Paloma (11,2k interacciones)',
  },
  {
    id: 'denis',
    handle: '@denis_alcalde.de.illapel',
    erPct: 52.0,
    erLabel: '52% ER',
    growthAbs: 1120,
    growthLabel: 'Reel Leo Rey',
    interactions: 16800,
    interactionsLabel: 'Reel Leo Rey',
    color: '#FF2E93',
    milestone: 'Techo de eficacia del período: 52% ER con Reel viral junto a Leo Rey',
  },
];

export interface BenchmarkFormatItem {
  format: string;
  posts: number;
  volumePct: number;
  erPct: number;
  erLabel: string;
  note: string;
  color: string;
}

export const BENCHMARK_FORMATS: BenchmarkFormatItem[] = [
  {
    format: 'Videos / Reels',
    posts: 515,
    volumePct: 26.2,
    erPct: 2.08,
    erLabel: '2,08% ER',
    note: 'Domina 17 del Top 20 publicaciones',
    color: '#00F0FF',
  },
  {
    format: 'Carruseles',
    posts: 970,
    volumePct: 49.4,
    erPct: 0.7,
    erLabel: '0,70% ER',
    note: 'Mayor volumen emitido con menor retorno',
    color: '#FFB800',
  },
  {
    format: 'Imágenes',
    posts: 480,
    volumePct: 24.4,
    erPct: 0.66,
    erLabel: '0,66% ER',
    note: 'Formato tradicional de baja fricción',
    color: '#FF2E93',
  },
];

export interface BenchmarkSentimentItem {
  label: string;
  posts: number;
  pct: number;
  detail: string;
  color: string;
}

export const BENCHMARK_SENTIMENT: BenchmarkSentimentItem[] = [
  {
    label: 'Positivo',
    posts: 1443,
    pct: 75.4,
    detail: 'Gestión territorial, cultura y buenas noticias',
    color: '#10B981',
  },
  {
    label: 'Neutral',
    posts: 442,
    pct: 23.1,
    detail: 'Avisos operativos y difusión informativa',
    color: '#00F0FF',
  },
  {
    label: 'Negativo',
    posts: 28,
    pct: 1.5,
    detail: 'Emergencias puntuales y condolencias',
    color: '#FF2E93',
  },
];

export const HEATMAP_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;
export const HEATMAP_HOURS = [
  '00:00',
  '03:00',
  '06:00',
  '09:00',
  '12:00',
  '15:00',
  '18:00',
  '21:00',
] as const;

export interface HeatmapCell {
  dayIdx: number;
  day: string;
  hourIdx: number;
  hour: string;
  volumeIndex: number; // 0..100 publication density (peaks Mon-Fri 12:00-18:00)
  interactionEfficacy: number; // 0..100 engagement efficiency (peaks Fri-Sun 21:00-00:00 & Sun 09:00)
  windowType: string;
}

export const BENCHMARK_HEATMAP_MATRIX: HeatmapCell[] = (() => {
  const cells: HeatmapCell[] = [];
  for (let d = 0; d < HEATMAP_DAYS.length; d++) {
    for (let h = 0; h < HEATMAP_HOURS.length; h++) {
      const isWeekday = d < 5;
      const isWeekend = d >= 5;
      const isDayPeak = h >= 4 && h <= 6; // 12:00 - 18:00
      const isNightPrime = h === 7 || h === 0; // 21:00 - 00:00
      const isSunMorning = d === 6 && h === 3; // Dom 09:00

      // Publication Volume: heaviest Mon-Fri 12:00-18:00
      let volume = 18;
      if (isWeekday && isDayPeak) volume = 82 + ((d + h) % 3) * 6;
      else if (isWeekday && h === 3) volume = 58 + (d % 3) * 5;
      else if (isWeekend && isDayPeak) volume = 40 + (h % 2) * 8;
      else if (h === 7) volume = isWeekday ? 34 : 26;
      else if (h <= 2) volume = 10 + ((d + h) % 4) * 3;

      // Interaction Efficacy: highest Fri-Sun 21:00-00:00 and Sun 09:00
      let efficacy = 28;
      if ((d >= 4 && isNightPrime) || isSunMorning) {
        efficacy = d === 6 && h === 7 ? 98 : isSunMorning ? 94 : 88 + (d % 2) * 5;
      } else if (isNightPrime) {
        efficacy = 68 + (d % 3) * 4;
      } else if (isWeekend && h === 4) {
        efficacy = 62;
      } else if (isWeekday && isDayPeak) {
        efficacy = 36 + (h % 2) * 6; // saturated window
      } else if (h === 3) {
        efficacy = 48;
      }

      const windowType =
        efficacy >= 85
          ? 'Ventana Óptima · Baja competencia / Máximo ER'
          : volume >= 75
            ? 'Franja Saturada · Alto volumen publicado'
            : 'Franja Moderada';

      cells.push({
        dayIdx: d,
        day: HEATMAP_DAYS[d],
        hourIdx: h,
        hour: HEATMAP_HOURS[h],
        volumeIndex: Math.min(100, volume),
        interactionEfficacy: Math.min(100, efficacy),
        windowType,
      });
    }
  }
  return cells;
})();

export const BENCHMARK_RECOMMENDATIONS = [
  {
    num: '01',
    title: 'Migrar carruseles a Reels cortos (Factor 3x ER)',
    detail:
      'Los carruseles representan el 49,4% del volumen con apenas 0,70% ER. Priorizar Reels cortos (2,08% ER, dominan 17 del Top 20) triplica el retorno por pieza.',
    accent: '#00F0FF',
  },
  {
    num: '02',
    title: 'Publicar hitos urbanos en ventanas nocturnas y fin de semana',
    detail:
      'Trasladar estrenos estratégicos desde la saturación de Lun–Vie 12:00–18:00 hacia Vie–Dom 21:00–00:00 y Dom 09:00 para capturar máxima eficacia.',
    accent: '#FF2E93',
  },
  {
    num: '03',
    title: 'Capitalizar hitos territoriales compartidos',
    detail:
      'Casos como Embalse La Paloma (50% ER en @munimpatria y 16% ER en @hector_vega_campusano) prueban el poder viral de narrativas provinciales conjuntas.',
    accent: '#10B981',
  },
];

export interface ExecutiveReportSummaryCard {
  id: 'ecosistema' | 'benchmark';
  badge: string;
  title: string;
  period: string;
  accent: string;
  stats: { label: string; value: string }[];
  leaders: string;
  keyInsight: string;
}

export const EXECUTIVE_DUAL_SUMMARY: ExecutiveReportSummaryCard[] = [
  {
    id: 'ecosistema',
    badge: 'REPORTE 01 · ECOSISTEMA INSTAGRAM',
    title: 'Medios, Comunidad e Influencia Regional',
    period: '14 Oct – 14 Nov 2026 (31 días · 9 láminas)',
    accent: '#38BDF8',
    stats: [
      { label: 'Cuentas Auditadas', value: '20 (22 actores)' },
      { label: 'Me Gusta Totales', value: '3,13M' },
      { label: 'Engagement Medio', value: '1,06%' },
      { label: 'Crecimiento Neto', value: '+2,63%' },
    ],
    leaders: 'Mi Radio (36,3%) · El Día (24,7%) · Papaya TV (28% ER máx.)',
    keyInsight:
      'Solo 6 actores concentran el 90,3% de los Me Gusta. Los Reels duplican el retorno de las gráficas estáticas (1,36% vs 0,53%).',
  },
  {
    id: 'benchmark',
    badge: 'REPORTE 02 · BENCHMARK 3D',
    title: 'Municipios y Liderazgos Públicos',
    period: 'Últimos 28 días · 7 capítulos',
    accent: '#FF2E93',
    stats: [
      { label: 'Cuentas Públicas', value: '26 cuentas' },
      { label: 'Interacciones', value: '478,5k (1.965 posts)' },
      { label: 'Engagement Medio', value: '1,97%' },
      { label: 'Crecimiento Neto', value: '+3,09%' },
    ],
    leaders: 'Coquimbo (15,5%) · La Serena (10,1%) · Manouchehri (3,51% ER)',
    keyInsight:
      '75,4% de sentimiento positivo. Migrar carruseles (49,4% vol.) a Reels cortos triplica el ER (2,08%) y Vie–Dom 21–00h lidera en eficacia.',
  },
];

