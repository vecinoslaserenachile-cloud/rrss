import React, { useMemo, useState } from 'react';
import { ArrowRight, Cpu, Home, Play, Search, Sparkles } from 'lucide-react';
import {
  BENCHMARK_CHAPTERS,
  BENCHMARK_FOLLOWERS_TOP,
  BENCHMARK_FORMATS,
  BENCHMARK_KPIS,
  BENCHMARK_OUTLIERS,
  BENCHMARK_REACH_SLICES,
  BENCHMARK_RECOMMENDATIONS,
  BENCHMARK_SENTIMENT,
  CONURBANO_DUEL_DATA,
  EXECUTIVE_DUAL_SUMMARY,
} from '../data/benchmarkData';
import {
  GLOBAL_ACTORS_RANKING,
  GlobalActorCategory,
} from '../data/globalActorsData';
import { ConurbanoDuelMode } from '../three/benchmarkBuilders';
import { ActorEmblem } from './ActorEmblem';

interface BenchmarkOverlaysProps {
  activeChapter: number;
  duelMode: ConurbanoDuelMode;
  onDuelModeChange: (mode: ConurbanoDuelMode) => void;
  highlightedRank: number | null;
  onHoverRank: (rank: number | null) => void;
  hudCollapsed: boolean;
  onNavigateReportStart?: (report: 'ecosistema' | 'benchmark', startKeynote?: boolean) => void;
}

export const BenchmarkOverlays: React.FC<BenchmarkOverlaysProps> = ({
  activeChapter,
  duelMode,
  onDuelModeChange,
  highlightedRank,
  onHoverRank,
  hudCollapsed,
  onNavigateReportStart,
}) => {
  const [actorFilter, setActorFilter] = useState<'all' | GlobalActorCategory>('all');
  const [actorQuery, setActorQuery] = useState('');

  const filteredActors = useMemo(() => {
    const q = actorQuery.trim().toLowerCase();
    return GLOBAL_ACTORS_RANKING.filter((a) => {
      if (actorFilter !== 'all' && a.category !== actorFilter) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.handle.toLowerCase().includes(q) ||
        a.territory.toLowerCase().includes(q) ||
        a.categoryLabel.toLowerCase().includes(q)
      );
    });
  }, [actorFilter, actorQuery]);

  if (hudCollapsed) return null;

  const meta = BENCHMARK_CHAPTERS[activeChapter] ?? BENCHMARK_CHAPTERS[0];

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col pt-16 pb-[4.5rem] lg:justify-between lg:px-10 lg:pt-20 lg:pb-24">
      {/* Chapter Header */}
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4 px-4 lg:px-0">
        <div className="pointer-events-auto max-w-xl">
          <p className="font-mono-tabular text-[11px] font-semibold tracking-wider text-[#00F0FF] uppercase sm:text-xs">
            {meta.kicker}
          </p>
          <h1
            className="font-display mt-0.5 text-xl font-bold tracking-tight text-white sm:text-2xl lg:mt-1 lg:text-[2.15rem] lg:leading-[1.12]"
            style={{ textWrap: 'balance' }}
          >
            {meta.title}
          </h1>
          <p className="mt-1 line-clamp-2 max-w-lg text-xs leading-relaxed text-slate-300 sm:text-sm lg:mt-1.5 lg:line-clamp-none">
            {meta.subtitle}
          </p>
        </div>

        {/* Chapter 2 Desktop Interactive Toggle */}
        {activeChapter === 2 && (
          <div className="dark-glass-panel pointer-events-auto hidden items-center gap-1 rounded-xl p-1.5 lg:flex">
            <button
              type="button"
              onClick={() => onDuelModeChange('totals')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                duelMode === 'totals'
                  ? 'bg-[#00F0FF] text-[#060B19] shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Métricas Totales
            </button>
            <button
              type="button"
              onClick={() => onDuelModeChange('efficiency')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                duelMode === 'efficiency'
                  ? 'bg-[#FF2E93] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Ratios de Eficiencia por Post
            </button>
          </div>
        )}

        {/* Chapter 1 Desktop Top-right summary pill */}
        {activeChapter === 1 && (
          <div className="dark-glass-panel pointer-events-auto hidden rounded-2xl px-5 py-3.5 text-right lg:block">
            <div className="text-xs font-medium text-slate-400">Insight Clave</div>
            <div className="font-mono-tabular mt-0.5 text-xl font-bold text-[#00F0FF]">
              50,1% del ecosistema
            </div>
            <div className="mt-0.5 text-xs text-slate-300">
              Acaparado por las Top 5 cuentas
            </div>
          </div>
        )}

        {/* Chapter 6 Desktop Top-right Territorial Landmark Key */}
        {activeChapter === 6 && (
          <div className="dark-glass-panel pointer-events-auto hidden rounded-2xl px-4 py-3 text-right lg:block">
            <div className="text-[11px] font-medium text-slate-400">
              Anfiteatro 3D · Hitos Comunales
            </div>
            <div className="font-mono-tabular mt-0.5 text-sm font-bold text-[#00F0FF]">
              18 Actores · Retratos &amp; Símbolos
            </div>
            <div className="mt-1 flex items-center justify-end gap-2 text-[11px] text-slate-300">
              <span className="text-[#00F0FF]">● Medios</span>
              <span className="text-[#10B981]">● Municipios</span>
              <span className="text-[#FF2E93]">● Personajes</span>
            </div>
          </div>
        )}

        {/* Chapter 7 (Capítulo 08) Desktop Unified Callout & Full Keynote Replay */}
        {activeChapter === 7 && onNavigateReportStart && (
          <div
            data-html2canvas-ignore="true"
            className="dark-glass-panel pointer-events-auto hidden items-center gap-3 rounded-2xl px-4 py-3 lg:flex"
          >
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#10B981]">
                <Sparkles className="h-3.5 w-3.5" /> Regla Unificada 2026
              </div>
              <div className="font-display text-sm font-bold text-white">
                Reels Cortos (2,5x–3x ER) + Ventana 21:00h
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateReportStart('ecosistema', true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#10B981] px-3.5 py-2 text-xs font-semibold text-[#060B19] transition-colors hover:bg-emerald-400 whitespace-nowrap"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Repetir Keynote
            </button>
          </div>
        )}
      </div>

      {/* Unobstructed 3D Telemetry Showcase Window on Mobile Portrait */}
      <div className="h-[32vh] min-h-[185px] max-h-[290px] shrink-0 pointer-events-none lg:hidden" />

      {/* Bottom Bento Panels per Chapter (Scrollable Sheet on <lg, Floating Bento on lg+) */}
      <div className="editorial-scroll pointer-events-auto min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-8 lg:mt-auto lg:flex-none lg:overflow-visible lg:px-0 lg:pt-0 lg:pb-0 lg:pointer-events-none">
        <div
          data-html2canvas-ignore="true"
          className="mb-2.5 flex items-center justify-center gap-2 lg:hidden"
        >
          <span className="h-1 w-9 rounded-full bg-white/25" />
          <span className="text-[10px] font-medium tracking-wide text-slate-400 uppercase">
            Telemetría · Desliza
          </span>
        </div>
        {activeChapter === 1 && (
          <div className="dark-glass-panel mb-3 flex items-center justify-between rounded-xl px-3.5 py-2.5 lg:hidden">
            <span className="text-[11px] font-medium text-slate-300">
              Insight: Top 5 acapara
            </span>
            <span className="font-mono-tabular text-sm font-bold text-[#00F0FF]">
              50,1% del ecosistema
            </span>
          </div>
        )}

        {activeChapter === 2 && (
          <div className="dark-glass-panel mb-3 grid grid-cols-2 gap-1.5 rounded-xl p-1.5 lg:hidden">
            <button
              type="button"
              onClick={() => onDuelModeChange('totals')}
              className={`rounded-lg px-2.5 py-2 text-xs font-semibold transition-all ${
                duelMode === 'totals'
                  ? 'bg-[#00F0FF] text-[#060B19] shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Métricas Totales
            </button>
            <button
              type="button"
              onClick={() => onDuelModeChange('efficiency')}
              className={`rounded-lg px-2.5 py-2 text-xs font-semibold transition-all ${
                duelMode === 'efficiency'
                  ? 'bg-[#FF2E93] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Eficiencia / Post
            </button>
          </div>
        )}
        {/* CHAPTER 0: ECOSISTEMA REGIONAL (28 DÍAS) */}
        {activeChapter === 0 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="pointer-events-auto grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:col-span-7">
              {BENCHMARK_KPIS.map((kpi) => (
                <div
                  key={kpi.label}
                  className="dark-glass-panel rounded-2xl p-3.5 transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div className="text-[11px] font-medium text-slate-400">{kpi.label}</div>
                  <div
                    className="font-mono-tabular mt-1 text-2xl font-bold tracking-tight"
                    style={{ color: kpi.color }}
                  >
                    {kpi.value}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-400">{kpi.detail}</div>
                </div>
              ))}
            </div>

            <div className="dark-glass-panel pointer-events-auto rounded-2xl p-4 lg:col-span-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-display text-xs font-semibold text-white">
                  Top Seguidores en Monumento 3D
                </span>
                <span className="font-mono-tabular text-[11px] text-[#00F0FF]">
                  10 líderes auditados
                </span>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                {BENCHMARK_FOLLOWERS_TOP.map((acc) => (
                  <div
                    key={acc.handle}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="truncate text-slate-300">
                      <span className="font-mono-tabular text-slate-500">
                        {String(acc.rank).padStart(2, '0')}
                      </span>{' '}
                      {acc.handle}
                    </span>
                    <span
                      className="font-mono-tabular shrink-0 font-semibold"
                      style={{ color: acc.color }}
                    >
                      {acc.followersLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CHAPTER 1: CUOTA DE ALCANCE E INTERACCIONES */}
        {activeChapter === 1 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="dark-glass-panel pointer-events-auto rounded-2xl p-4 lg:col-span-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h2 className="font-display text-sm font-semibold text-white">
                  Desglose Dona 3D · 478,5k Interacciones
                </h2>
                <span className="text-[11px] text-slate-400">Hover sincronizado</span>
              </div>
              <div className="mt-2.5 space-y-2">
                {BENCHMARK_REACH_SLICES.map((slice) => {
                  const active = highlightedRank === slice.rank;
                  return (
                    <div
                      key={slice.handle}
                      onMouseEnter={() => onHoverRank(slice.rank)}
                      onMouseLeave={() => onHoverRank(null)}
                      className={`cursor-pointer rounded-xl border px-3 py-2 text-xs transition-all ${
                        active
                          ? 'border-[#00F0FF]/50 bg-[#00F0FF]/12'
                          : 'border-white/8 bg-white/[0.03] hover:bg-white/[0.07]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-sm"
                            style={{ backgroundColor: slice.color }}
                          />
                          <span className="truncate font-semibold text-white">
                            {slice.handle}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-baseline gap-3">
                          <span className="font-mono-tabular text-slate-300">
                            {slice.interactionsLabel}
                          </span>
                          <span
                            className="font-mono-tabular w-12 text-right font-bold"
                            style={{ color: slice.color }}
                          >
                            {slice.sharePct.toFixed(1).replace('.', ',')}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="hidden lg:col-span-7" />
          </div>
        )}

        {/* CHAPTER 2: DUELO CONURBADO (LA SERENA VS. COQUIMBO) */}
        {activeChapter === 2 && (
          <div className="pointer-events-auto grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CONURBANO_DUEL_DATA.map((actor) => (
              <div
                key={actor.handle}
                className="dark-glass-panel rounded-2xl p-4"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold" style={{ color: actor.color }}>
                    {actor.city}
                  </span>
                  <span className="text-[11px] text-slate-400">{actor.role}</span>
                </div>
                <div className="mt-1 truncate font-display text-sm font-bold text-white">
                  {actor.handle}
                </div>
                {duelMode === 'totals' ? (
                  <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-white/10 pt-2.5 text-xs">
                    <div>
                      <div className="text-[11px] text-slate-400">Me gusta / Com.</div>
                      <div className="font-mono-tabular font-bold text-white">
                        {actor.likesLabel} / {actor.commentsLabel}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">Seg. / Posts</div>
                      <div className="font-mono-tabular font-semibold text-[#00F0FF]">
                        {actor.followersLabel} · {actor.posts}p
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-white/10 pt-2.5 text-xs">
                    <div>
                      <div className="text-[11px] text-slate-400">Likes / Post</div>
                      <div className="font-mono-tabular font-bold text-[#00F0FF]">
                        {actor.likesPerPostLabel}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">ER · Com/Post</div>
                      <div className="font-mono-tabular font-bold text-[#FF2E93]">
                        {actor.erLabel} · {actor.commentsPerPostLabel}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CHAPTER 3: CRECIMIENTO VS ENGAGEMENT (OUTLIERS & HITOS) */}
        {activeChapter === 3 && (
          <div className="pointer-events-auto grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
            {BENCHMARK_OUTLIERS.map((node) => (
              <div
                key={node.id}
                className="dark-glass-panel rounded-xl p-3"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: node.color }}
                  />
                  <span className="truncate text-[11px] font-bold text-white">
                    {node.handle}
                  </span>
                </div>
                <div
                  className="font-mono-tabular mt-1.5 text-sm font-bold"
                  style={{ color: node.color }}
                >
                  {node.erLabel}
                </div>
                <div className="font-mono-tabular text-[11px] text-slate-300">
                  {node.growthLabel}
                </div>
                <div className="mt-1 truncate text-[10px] text-slate-400">
                  {node.interactionsLabel}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CHAPTER 4: RENTABILIDAD DE FORMATOS Y SENTIMIENTO */}
        {activeChapter === 4 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="dark-glass-panel pointer-events-auto rounded-2xl p-4 lg:col-span-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h2 className="font-display text-sm font-semibold text-white">
                  Rentabilidad por Formato (1.965 posts)
                </h2>
                <span className="font-mono-tabular text-xs text-[#00F0FF]">
                  Reels = 3x ER
                </span>
              </div>
              <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {BENCHMARK_FORMATS.map((f) => (
                  <div
                    key={f.format}
                    className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs"
                  >
                    <div className="font-semibold text-white">{f.format}</div>
                    <div
                      className="font-mono-tabular mt-1 text-lg font-bold"
                      style={{ color: f.color }}
                    >
                      {f.erLabel}
                    </div>
                    <div className="font-mono-tabular text-[11px] text-slate-300">
                      {f.posts} posts ({f.volumePct.toFixed(1).replace('.', ',')}%)
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400">{f.note}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dark-glass-panel pointer-events-auto rounded-2xl p-4 lg:col-span-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h2 className="font-display text-sm font-semibold text-white">
                  Sentimiento del Ecosistema (1.913 posts)
                </h2>
                <span className="font-mono-tabular text-xs text-[#10B981]">
                  75,4% Positivo
                </span>
              </div>
              <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {BENCHMARK_SENTIMENT.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs"
                  >
                    <div className="font-semibold text-white">{s.label}</div>
                    <div
                      className="font-mono-tabular mt-1 text-lg font-bold"
                      style={{ color: s.color }}
                    >
                      {s.pct.toFixed(1).replace('.', ',')}%
                    </div>
                    <div className="font-mono-tabular text-[11px] text-slate-300">
                      {s.posts.toLocaleString('es-CL')} posts
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400">{s.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CHAPTER 5: MATRIZ HORARIA ÓPTIMA Y 3 RECOMENDACIONES ESTRATÉGICAS */}
        {activeChapter === 5 && (
          <div className="pointer-events-auto grid grid-cols-1 gap-3 lg:grid-cols-3">
            {BENCHMARK_RECOMMENDATIONS.map((rec) => (
              <div
                key={rec.num}
                className="dark-glass-panel rounded-2xl p-4 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="font-mono-tabular text-xs font-bold"
                    style={{ color: rec.accent }}
                  >
                    ACCIÓN {rec.num}
                  </span>
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: rec.accent }}
                  />
                </div>
                <h3 className="font-display mt-1.5 text-sm font-bold leading-snug text-white">
                  {rec.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  {rec.detail}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* CHAPTER 6 (CAPÍTULO 07): RANKING GLOBAL DE ACTORES CON MINIATURAS E ICONOS */}
        {activeChapter === 6 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="dark-glass-panel pointer-events-auto rounded-2xl p-4 lg:col-span-6 xl:col-span-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                <div>
                  <h2 className="font-display text-sm font-semibold text-white">
                    Directorio Regional ({filteredActors.length} actores)
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Pasa el cursor o toca un perfil para iluminarlo en el anfiteatro 3D
                  </p>
                </div>
                <div className="relative w-full sm:w-44">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={actorQuery}
                    onChange={(e) => setActorQuery(e.target.value)}
                    placeholder="Buscar comuna o actor..."
                    className="w-full rounded-lg border border-white/15 bg-white/[0.05] py-1.5 pr-2.5 pl-8 text-xs text-white placeholder:text-slate-500 focus:border-[#00F0FF] focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'all', label: 'Todos (18)' },
                    { id: 'medio', label: 'Medios (6)' },
                    { id: 'municipio', label: 'Municipios (7)' },
                    { id: 'personaje', label: 'Personajes (5)' },
                  ] as const
                ).map((tab) => {
                  const active = actorFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActorFilter(tab.id)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        active
                          ? 'bg-[#00F0FF] text-[#060B19]'
                          : 'border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="editorial-scroll mt-2.5 space-y-2 lg:max-h-[290px] lg:overflow-y-auto lg:pr-1">
                {filteredActors.map((actor) => {
                  const isHighlighted = highlightedRank === actor.rank;
                  return (
                    <div
                      key={actor.handle}
                      onMouseEnter={() => onHoverRank(actor.rank)}
                      onMouseLeave={() => onHoverRank(null)}
                      onClick={() => onHoverRank(isHighlighted ? null : actor.rank)}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 transition-all ${
                        isHighlighted
                          ? 'border-[#00F0FF]/60 bg-[#00F0FF]/14 shadow-lg'
                          : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.07]'
                      }`}
                    >
                      <ActorEmblem
                        kind={actor.emblemKind}
                        color={actor.color}
                        size={40}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <span
                              className="font-mono-tabular shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold text-[#060B19]"
                              style={{ backgroundColor: actor.color }}
                            >
                              #{String(actor.rank).padStart(2, '0')}
                            </span>
                            <span className="truncate font-display text-xs font-bold text-white">
                              {actor.name}
                            </span>
                          </div>
                          <span
                            className="font-mono-tabular shrink-0 text-xs font-bold"
                            style={{ color: actor.color }}
                          >
                            {actor.primaryMetricLabel}
                          </span>
                        </div>

                        <div className="mt-0.5 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                          <span className="truncate text-slate-400">
                            {actor.handle} ·{' '}
                            <span className="text-slate-300">{actor.territory}</span>
                          </span>
                          <span className="font-mono-tabular shrink-0 font-semibold text-slate-200">
                            {actor.erLabel}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[10px] text-slate-400">
                          {actor.highlightNote}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {filteredActors.length === 0 && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-5 text-center text-xs text-slate-400">
                    Sin coincidencias para &ldquo;{actorQuery}&rdquo;.
                  </div>
                )}
              </div>
            </div>
            <div className="hidden lg:col-span-6 xl:col-span-7" />
          </div>
        )}

        {/* CHAPTER 7 (CAPÍTULO 08): RESUMEN EJECUTIVO DE AMBOS REPORTES */}
        {activeChapter === 7 && (
          <div className="pointer-events-auto space-y-3">
            <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
              {EXECUTIVE_DUAL_SUMMARY.map((rep) => {
                const isFirst = rep.id === 'ecosistema';
                return (
                  <div
                    key={rep.id}
                    className="dark-glass-panel flex flex-col justify-between rounded-2xl p-4 sm:p-5"
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className="font-mono-tabular text-[11px] font-bold tracking-wider uppercase"
                          style={{ color: rep.accent }}
                        >
                          {rep.badge}
                        </span>
                        <span className="text-[11px] text-slate-400">{rep.period}</span>
                      </div>

                      <h2 className="font-display mt-1 text-base font-bold text-white sm:text-lg">
                        {rep.title}
                      </h2>

                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {rep.stats.map((st) => (
                          <div
                            key={st.label}
                            className="rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2"
                          >
                            <div className="text-[10px] text-slate-400">{st.label}</div>
                            <div
                              className="font-mono-tabular mt-0.5 text-xs font-bold sm:text-sm"
                              style={{ color: rep.accent }}
                            >
                              {st.value}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-2.5 rounded-xl border border-white/8 bg-white/[0.025] px-3 py-2 text-xs">
                        <div className="font-semibold text-white">{rep.leaders}</div>
                        <p className="mt-1 leading-relaxed text-slate-300">{rep.keyInsight}</p>
                      </div>
                    </div>

                    {onNavigateReportStart && (
                      <div data-html2canvas-ignore="true" className="mt-3 pt-1">
                        <button
                          type="button"
                          onClick={() => onNavigateReportStart(rep.id)}
                          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                            isFirst
                              ? 'bg-[#38BDF8] text-[#060B19] hover:bg-sky-300'
                              : 'border border-[#FF2E93]/60 bg-[#FF2E93]/20 text-white hover:bg-[#FF2E93]'
                          }`}
                        >
                          {isFirst ? (
                            <Home className="h-3.5 w-3.5" />
                          ) : (
                            <Cpu className="h-3.5 w-3.5" />
                          )}
                          <span>
                            {isFirst
                              ? 'Ir al Inicio del Reporte 1 (Ecosistema · Lám. 01)'
                              : 'Ir al Inicio del Reporte 2 (Benchmark · Cap. 01)'}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {onNavigateReportStart && (
              <div
                data-html2canvas-ignore="true"
                className="dark-glass-panel flex items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 lg:hidden"
              >
                <span className="text-[11px] font-medium text-slate-300">
                  Regla: Reels 3x + Ventana 21:00h
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateReportStart('ecosistema', true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#10B981] px-3 py-1.5 text-xs font-semibold text-[#060B19]"
                >
                  <Play className="h-3 w-3 fill-current" />
                  Repetir Keynote
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
