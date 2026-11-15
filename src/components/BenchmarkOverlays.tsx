import React from 'react';
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
} from '../data/benchmarkData';
import { ConurbanoDuelMode } from '../three/benchmarkBuilders';

interface BenchmarkOverlaysProps {
  activeChapter: number;
  duelMode: ConurbanoDuelMode;
  onDuelModeChange: (mode: ConurbanoDuelMode) => void;
  highlightedRank: number | null;
  onHoverRank: (rank: number | null) => void;
  hudCollapsed: boolean;
}

export const BenchmarkOverlays: React.FC<BenchmarkOverlaysProps> = ({
  activeChapter,
  duelMode,
  onDuelModeChange,
  highlightedRank,
  onHoverRank,
  hudCollapsed,
}) => {
  if (hudCollapsed) return null;

  const meta = BENCHMARK_CHAPTERS[activeChapter];

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between px-6 pt-20 pb-24 lg:px-10">
      {/* Chapter Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="pointer-events-auto max-w-xl">
          <p className="font-mono-tabular text-xs font-semibold tracking-wider text-[#00F0FF] uppercase">
            {meta.kicker}
          </p>
          <h1
            className="font-display mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-[2.15rem] lg:leading-[1.12]"
            style={{ textWrap: 'balance' }}
          >
            {meta.title}
          </h1>
          <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-slate-300">
            {meta.subtitle}
          </p>
        </div>

        {/* Chapter 2 Interactive Toggle: Métricas Totales vs Ratios de Eficiencia */}
        {activeChapter === 2 && (
          <div className="dark-glass-panel pointer-events-auto flex items-center gap-1 rounded-xl p-1.5">
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

        {/* Chapter 1 Top-right summary pill */}
        {activeChapter === 1 && (
          <div className="dark-glass-panel pointer-events-auto rounded-2xl px-5 py-3.5 text-right">
            <div className="text-xs font-medium text-slate-400">Insight Clave</div>
            <div className="font-mono-tabular mt-0.5 text-xl font-bold text-[#00F0FF]">
              50,1% del ecosistema
            </div>
            <div className="mt-0.5 text-xs text-slate-300">
              Acaparado por las Top 5 cuentas
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bento Panels per Chapter */}
      <div className="mt-auto">
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
      </div>
    </div>
  );
};
