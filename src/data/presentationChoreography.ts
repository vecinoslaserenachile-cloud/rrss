import { ConurbanoDuelMode } from '../three/benchmarkBuilders';

export interface ChoreographyCue {
  /** Playback progress threshold [0..1] when this camera/focus cue activates */
  atProgress: number;
  /** Concise live focus label shown in the teleprompter during Auto-Present */
  focusBadge: string;
  /** Optional synchronized rank highlight (highlights 3D bar/pie slice + matching table row) */
  highlightRank?: number | null;
  /** Optional duel mode toggle for Benchmark Chapter 2 */
  duelMode?: ConurbanoDuelMode;
  /** Target 3D camera position & lookAt coordinates (calibrated with headroom so #1 tall columns & labels never clip) */
  camera: {
    position: [number, number, number];
    target: [number, number, number];
  };
}

export const PRESENTATION_CHOREOGRAPHY: Record<string, ChoreographyCue[]> = {
  // =========================================================
  // REPORTE 1: LA SERENA DIGITAL 2026 · ECOSISTEMA (9 LÁMINAS)
  // =========================================================
  'ecosistema-0': [
    {
      atProgress: 0,
      focusBadge: 'Panorama del Ecosistema Regional',
      camera: { position: [0.45, 5.2, 12.6], target: [0.45, 2.15, 0] },
    },
    {
      atProgress: 0.28,
      focusBadge: '20 Cuentas Monitoreadas',
      camera: { position: [-2.75, 3.6, 6.8], target: [-2.95, 2.1, -1.35] },
    },
    {
      atProgress: 0.52,
      focusBadge: '3,13M Me Gusta · Top 5 Líderes',
      camera: { position: [-0.8, 3.8, 9.6], target: [-0.6, 2.05, 1.25] },
    },
    {
      atProgress: 0.72,
      focusBadge: 'Engagement Rate Promedio 1,06%',
      camera: { position: [0.45, 3.55, 6.4], target: [0.45, 2.05, -1.35] },
    },
    {
      atProgress: 0.86,
      focusBadge: 'Crecimiento +2,63% · 6,0 Posts/Día',
      camera: { position: [3.65, 3.55, 6.6], target: [3.85, 2.05, -1.35] },
    },
  ],

  'ecosistema-1': [
    {
      atProgress: 0,
      focusBadge: 'Distribución Regional de Alcance',
      camera: { position: [0.3, 5.1, 13.2], target: [0.3, 2.9, 0] },
    },
    {
      atProgress: 0.2,
      // #1 Mi Radio height + permanent badge reaches y ≈ 7.06: frame comfortably with D ≈ 11.2 & target.y = 3.25
      focusBadge: 'Mi Radio · 1,30M int. (36,3%)',
      camera: { position: [-3.1, 4.9, 10.8], target: [-4.05, 3.25, 0] },
    },
    {
      atProgress: 0.45,
      focusBadge: 'Diario El Día · 886k int. (24,7%)',
      camera: { position: [-1.6, 4.5, 9.8], target: [-2.35, 2.8, 0] },
    },
    {
      atProgress: 0.68,
      focusBadge: 'Guayacán · La Serena 4 · Infórmate',
      camera: { position: [1.6, 4.2, 9.8], target: [0.7, 2.25, 0] },
    },
  ],

  'ecosistema-2': [
    {
      atProgress: 0,
      focusBadge: 'Seguidores vs. Tasa de Respuesta',
      camera: { position: [6.2, 5.7, 11.4], target: [0.2, 2.6, 0] },
    },
    {
      atProgress: 0.28,
      focusBadge: 'Audiencia: El Día 278k · Mi Radio 271k',
      camera: { position: [-1.8, 4.3, 9.4], target: [-2.55, 2.45, 1.4] },
    },
    {
      atProgress: 0.56,
      // Papaya TV back row 28% reaches y ≈ 6.53: keep D ≈ 9.8 & target.y = 3.05 so crown + label stay visible
      focusBadge: 'Papaya TV · 28% Engagement Líder',
      camera: { position: [-2.0, 4.8, 8.0], target: [-3.35, 3.05, -1.65] },
    },
    {
      atProgress: 0.8,
      focusBadge: 'Crecimiento Promedio +2,63%',
      camera: { position: [5.4, 3.5, 7.2], target: [4.8, 2.25, 0] },
    },
  ],

  'ecosistema-3': [
    {
      atProgress: 0,
      focusBadge: 'Tabla Auditada Top 20 Me Gusta',
      highlightRank: null,
      camera: { position: [2.85, 5.7, 12.4], target: [1.5, 2.6, 0] },
    },
    {
      atProgress: 0.3,
      // #1 Mi Radio reaches y ≈ 6.40: gentle 3/4 focus with full headroom
      focusBadge: '#1 Mi Radio · 1,20M Me Gusta',
      highlightRank: 1,
      camera: { position: [0.4, 4.8, 8.6], target: [-0.25, 2.95, -1.55] },
    },
    {
      atProgress: 0.48,
      focusBadge: '#2 Diario El Día · 798k Me Gusta',
      highlightRank: 2,
      camera: { position: [1.1, 4.6, 8.0], target: [0.35, 2.65, -2.25] },
    },
    {
      atProgress: 0.65,
      focusBadge: '#3 Guayacán CL · 261k Me Gusta',
      highlightRank: 3,
      camera: { position: [2.1, 4.4, 7.6], target: [1.35, 2.35, -2.5] },
    },
    {
      atProgress: 0.82,
      focusBadge: '#6 Papaya TV · Fidelidad Territorial',
      highlightRank: 6,
      camera: { position: [4.3, 4.1, 7.2], target: [3.55, 2.0, -2.35] },
    },
  ],

  'ecosistema-4': [
    {
      atProgress: 0,
      focusBadge: 'Agenda Temática e Hitos Virales',
      camera: { position: [0.8, 3.8, 9.6], target: [1.0, 2.1, 0] },
    },
    {
      atProgress: 0.28,
      focusBadge: 'Hashtags: #afp (45%) · #tocopilla (23%)',
      camera: { position: [1.8, 3.7, 7.8], target: [1.7, 2.55, 0] },
    },
    {
      atProgress: 0.62,
      focusBadge: 'Hito: Embalse La Paloma (78,7k int.)',
      camera: { position: [5.5, 3.8, 7.8], target: [4.35, 2.05, 1.0] },
    },
  ],

  'ecosistema-5': [
    {
      atProgress: 0,
      focusBadge: 'Radar de Tensión Ciudadana',
      camera: { position: [0.3, 3.6, 10.2], target: [0.3, 2.0, 0] },
    },
    {
      atProgress: 0.22,
      focusBadge: '21 Oct · 43% Pérdidas Multifondos',
      camera: { position: [-2.1, 4.0, 8.0], target: [-2.15, 2.75, 0] },
    },
    {
      atProgress: 0.44,
      // 23 oct 52% peak flag reaches y ≈ 6.48: frame full flag and red beacon cleanly
      focusBadge: '23 Oct · Pico 52% Crisis Urgencias',
      camera: { position: [-0.9, 4.4, 8.8], target: [-0.92, 3.1, 0] },
    },
    {
      atProgress: 0.66,
      focusBadge: '30–31 Oct · 36% Paro Ruta 5',
      camera: { position: [1.5, 3.7, 7.8], target: [1.52, 2.5, 0] },
    },
    {
      atProgress: 0.84,
      focusBadge: '9 Nov · 38% Cortes Internet y Salud',
      camera: { position: [3.9, 3.7, 7.8], target: [3.95, 2.55, 0] },
    },
  ],

  'ecosistema-6': [
    {
      atProgress: 0,
      focusBadge: 'Ingeniería de Formatos y Audiencia',
      camera: { position: [0.4, 4.7, 11.8], target: [0.4, 2.4, 0] },
    },
    {
      atProgress: 0.2,
      focusBadge: 'Volumen: 2.800 Imágenes vs. 1.800 Videos',
      camera: { position: [-1.8, 4.5, 9.2], target: [-2.0, 2.75, 0] },
    },
    {
      atProgress: 0.42,
      focusBadge: 'Reels · 1,36% Interacción (2,5x)',
      camera: { position: [-0.8, 4.4, 7.8], target: [-0.8, 2.75, -0.5] },
    },
    {
      atProgress: 0.68,
      focusBadge: 'Audiencia 35–54 años · 52% M / 48% H',
      camera: { position: [4.15, 3.3, 7.4], target: [4.15, 2.35, 0] },
    },
  ],

  'ecosistema-7': [
    {
      atProgress: 0,
      focusBadge: 'Auditoría de 22 Identidades Reales',
      highlightRank: null,
      camera: { position: [2.8, 5.6, 12.4], target: [1.55, 2.6, 0] },
    },
    {
      atProgress: 0.34,
      // #1 @miradiols reaches y ≈ 6.45
      focusBadge: '#1 @miradiols · 1,2M Me Gusta',
      highlightRank: 1,
      camera: { position: [-0.4, 4.7, 8.6], target: [-0.85, 3.0, -0.95] },
    },
    {
      atProgress: 0.52,
      focusBadge: 'Podio 72,7% · @guayacancl',
      highlightRank: 3,
      camera: { position: [0.9, 4.4, 8.0], target: [0.5, 2.65, -0.95] },
    },
    {
      atProgress: 0.68,
      focusBadge: '@papayatv_ls · 4,31% Eficiencia',
      highlightRank: 6,
      camera: { position: [3.2, 4.1, 7.6], target: [2.85, 2.3, -0.95] },
    },
  ],

  'ecosistema-8': [
    {
      atProgress: 0,
      focusBadge: 'Pastel 3D · 90,3% en 6 Actores',
      highlightRank: null,
      camera: { position: [2.3, 5.5, 8.6], target: [1.1, 0.8, 0] },
    },
    {
      atProgress: 0.28,
      focusBadge: 'Mi Radio · 38,6% Aprobación',
      highlightRank: 1,
      camera: { position: [1.6, 4.9, 7.2], target: [1.9, 1.15, -0.3] },
    },
    {
      atProgress: 0.45,
      focusBadge: 'Diario El Día · 25,6% Aprobación',
      highlightRank: 2,
      camera: { position: [3.6, 4.9, 7.2], target: [2.6, 1.15, 0.2] },
    },
    {
      atProgress: 0.68,
      focusBadge: 'Transición → Benchmark 3D (28 Días)',
      highlightRank: null,
      camera: { position: [2.3, 6.0, 9.6], target: [1.4, 1.0, 0] },
    },
  ],

  // =========================================================
  // REPORTE 2: BENCHMARK 3D · 28 DÍAS (7 CAPÍTULOS)
  // =========================================================
  'benchmark-0': [
    {
      atProgress: 0,
      focusBadge: 'Telemetría Regional · 26 Cuentas',
      camera: { position: [1.3, 5.2, 12.2], target: [0.8, 2.3, 0] },
    },
    {
      atProgress: 0.3,
      focusBadge: 'Núcleo: 478,5k Interacciones · 1,97% ER',
      camera: { position: [1.3, 4.3, 8.6], target: [1.3, 2.45, 0] },
    },
    {
      atProgress: 0.66,
      // La Serena 142k & Coquimbo 120k sit at rear-left (z ≈ -2.0..-3.3, top ≈ 5.69): pull back smoothly so both crowns & badges fit
      focusBadge: 'La Serena 142k · Coquimbo 120k seg.',
      camera: { position: [-0.4, 4.7, 7.2], target: [-0.6, 2.85, -2.4] },
    },
  ],

  'benchmark-1': [
    {
      atProgress: 0,
      focusBadge: 'Dona 3D · Top 5 Acapara 50,1%',
      highlightRank: null,
      camera: { position: [2.1, 5.8, 8.8], target: [1.0, 0.95, 0] },
    },
    {
      atProgress: 0.32,
      focusBadge: '#1 @municipalidaddecoquimbo · 15,5%',
      highlightRank: 1,
      camera: { position: [3.2, 4.9, 7.2], target: [2.4, 1.1, -0.4] },
    },
    {
      atProgress: 0.54,
      focusBadge: '#2 @muni_laserena · 10,1%',
      highlightRank: 2,
      camera: { position: [2.1, 4.9, 7.2], target: [1.6, 1.1, -0.3] },
    },
    {
      atProgress: 0.72,
      focusBadge: '#3 Illapel (8,5%) · #4 Daniela (8,1%)',
      highlightRank: 4,
      camera: { position: [1.4, 5.0, 7.4], target: [1.6, 1.05, 0.3] },
    },
  ],

  'benchmark-2': [
    {
      atProgress: 0,
      focusBadge: 'Duelo Conurbado · Métricas Totales',
      duelMode: 'totals',
      camera: { position: [0.5, 5.2, 12.2], target: [0.5, 2.3, 0] },
    },
    {
      atProgress: 0.18,
      // Coquimbo 68,9k top badge reaches y ≈ 5.83
      focusBadge: 'Coquimbo 68,9k vs. La Serena 41,8k',
      duelMode: 'totals',
      camera: { position: [0.5, 4.8, 10.6], target: [0.5, 2.7, 0] },
    },
    {
      atProgress: 0.46,
      focusBadge: 'Cambio en vivo → Ratios de Eficiencia',
      duelMode: 'efficiency',
      camera: { position: [1.4, 4.8, 10.4], target: [1.3, 2.65, 0] },
    },
    {
      atProgress: 0.68,
      // Manouchehri reaches y ≈ 6.03
      focusBadge: '@manouchehri19 · 2.789 L/Post · 3,51% ER',
      duelMode: 'efficiency',
      camera: { position: [4.1, 4.7, 9.2], target: [3.95, 2.85, 0] },
    },
  ],

  'benchmark-3': [
    {
      atProgress: 0,
      focusBadge: 'Mapa 3D Crecimiento vs. Engagement',
      camera: { position: [2.4, 4.9, 11.5], target: [1.0, 2.35, 0] },
    },
    {
      atProgress: 0.2,
      // Alcalde Ahumada at (0.61, 4.17, -1.6), badge top y ≈ 5.15
      focusBadge: '@alcaldeahumada · +2.100 seg (Cochiguaz)',
      camera: { position: [0.8, 4.9, 6.6], target: [0.6, 3.45, -1.4] },
    },
    {
      atProgress: 0.44,
      focusBadge: 'La Serena +1.750 · Daniela 9,12% ER',
      camera: { position: [-1.3, 4.5, 7.4], target: [-1.35, 3.0, -0.6] },
    },
    {
      atProgress: 0.72,
      focusBadge: 'Outliers: Monte Patria 50% · Illapel 52%',
      camera: { position: [4.6, 4.2, 7.4], target: [4.35, 2.4, -0.2] },
    },
  ],

  'benchmark-4': [
    {
      atProgress: 0,
      focusBadge: 'Formatos vs. Sentimiento (1.913 posts)',
      camera: { position: [0.2, 5.1, 12.6], target: [0.2, 2.35, 0] },
    },
    {
      atProgress: 0.2,
      focusBadge: 'Carruseles 0,70% vs. Reels 2,08% ER (3x)',
      camera: { position: [-2.8, 4.5, 8.8], target: [-2.85, 2.7, 0] },
    },
    {
      atProgress: 0.6,
      // Sentimiento Positivo 75,4% top reaches y ≈ 6.49
      focusBadge: 'Sentimiento Positivo 75,4% (1.443)',
      camera: { position: [3.1, 4.7, 9.2], target: [3.0, 2.9, 0] },
    },
  ],

  'benchmark-5': [
    {
      atProgress: 0,
      focusBadge: 'Matriz Horaria 7 Días × 8 Bloques',
      camera: { position: [1.1, 6.2, 10.6], target: [0.3, 1.4, 0.1] },
    },
    {
      atProgress: 0.2,
      focusBadge: 'Saturación: Lun–Vie 12:00–18:00',
      camera: { position: [2.0, 5.5, 7.6], target: [1.1, 1.65, -1.0] },
    },
    {
      atProgress: 0.44,
      focusBadge: 'Ventana Óptima: Vie–Dom 21–00h y Dom 09h',
      camera: { position: [4.2, 5.1, 8.0], target: [2.0, 1.4, 1.2] },
    },
    {
      atProgress: 0.72,
      focusBadge: 'Hoja de Ruta · 3 Acciones Directivas',
      camera: { position: [1.1, 6.4, 11.0], target: [0.3, 1.45, 0.1] },
    },
  ],

  'benchmark-6': [
    {
      atProgress: 0,
      focusBadge: 'Síntesis Comparativa · Ambos Reportes',
      camera: { position: [0, 5.1, 11.8], target: [0, 2.45, 0] },
    },
    {
      atProgress: 0.22,
      focusBadge: 'Reporte 01 · 3,13M Likes · 1,06% ER',
      camera: { position: [-2.7, 4.5, 8.6], target: [-2.7, 2.6, 0] },
    },
    {
      atProgress: 0.48,
      focusBadge: 'Reporte 02 · 478,5k Int. · 1,97% ER',
      camera: { position: [2.7, 4.5, 8.6], target: [2.7, 2.6, 0] },
    },
    {
      atProgress: 0.76,
      focusBadge: 'Regla Unificada: Reels 3x + 21:00 hrs',
      camera: { position: [0, 4.7, 9.8], target: [0, 2.55, 0] },
    },
  ],
};

export function resolveActiveCue(
  slideKey: string,
  progress: number
): ChoreographyCue | null {
  const cues = PRESENTATION_CHOREOGRAPHY[slideKey];
  if (!cues || !cues.length) return null;
  let active = cues[0];
  for (let i = 1; i < cues.length; i++) {
    if (progress >= cues[i].atProgress) {
      active = cues[i];
    } else {
      break;
    }
  }
  return active;
}
