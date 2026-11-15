import React, { useMemo, useState } from 'react';
import { ArrowUpDown, Search, Sparkles } from 'lucide-react';
import {
  ACTORS_LIKES_DATA,
  AccountCategory,
  ECOSYSTEM_SEGMENT_SUMMARY,
  FORMATS_DATA,
  HASHTAGS_DATA,
  LIKES_PIE_DATA,
  REACH_SHARE_DATA,
  SENTIMENT_SERIES,
  SLIDES,
  TOP_20_LIKES,
  TOP_ENGAGEMENT_DATA,
  TOP_FOLLOWERS_DATA,
  VIRAL_MILESTONES,
  formatSpanishInt,
} from '../data/coquimboData';
import { formatSpanishDecimal, useCountUp } from '../hooks/useCountUp';

interface SlideOverlaysProps {
  activeSlide: number;
  highlightedRank: number | null;
  onHoverRank: (rank: number | null) => void;
  hudCollapsed: boolean;
  instantNumbers?: boolean;
}

const AnimatedInteger: React.FC<{ target: number; triggerKey: number; instant?: boolean }> = ({
  target,
  triggerKey,
  instant,
}) => {
  const val = useCountUp({ target, durationMs: 850, decimals: 0, triggerKey, instant });
  return <>{formatSpanishInt(val)}</>;
};

const AnimatedDecimal: React.FC<{
  target: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  triggerKey: number;
  instant?: boolean;
}> = ({ target, decimals = 2, suffix = '', prefix = '', triggerKey, instant }) => {
  const val = useCountUp({ target, durationMs: 900, decimals, triggerKey, instant });
  return (
    <>
      {prefix}
      {formatSpanishDecimal(val, decimals)}
      {suffix}
    </>
  );
};

export const SlideOverlays: React.FC<SlideOverlaysProps> = ({
  activeSlide,
  highlightedRank,
  onHoverRank,
  hudCollapsed,
  instantNumbers = false,
}) => {
  const slideMeta = SLIDES[activeSlide];

  // Slide 4 (Ranking Top 20) filter & sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'Todos' | 'Top 5' | AccountCategory>('Todos');
  const [sortBy, setSortBy] = useState<'rank' | 'name'>('rank');

  // Slide 8 (Actores Me Gusta) filter states
  const [actorQuery, setActorQuery] = useState('');
  const [actorTier, setActorTier] = useState<'all' | 'top6' | 'active' | 'zero'>('all');

  const filteredTop20 = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = TOP_20_LIKES.filter((acc) => {
      const matchesQuery = q === '' || acc.name.toLowerCase().includes(q);
      if (!matchesQuery) return false;
      if (categoryFilter === 'Todos') return true;
      if (categoryFilter === 'Top 5') return acc.rank <= 5;
      return acc.category === categoryFilter;
    });

    if (sortBy === 'name') {
      return [...list].sort((a, b) => a.name.localeCompare(b.name, 'es'));
    }
    return [...list].sort((a, b) => a.rank - b.rank);
  }, [searchQuery, categoryFilter, sortBy]);

  const filteredActorsLikes = useMemo(() => {
    const q = actorQuery.trim().toLowerCase();
    return ACTORS_LIKES_DATA.filter((actor) => {
      const matchesQ = q === '' || actor.handle.toLowerCase().includes(q);
      if (!matchesQ) return false;
      if (actorTier === 'top6') return actor.likes >= 100000;
      if (actorTier === 'active') return actor.likes > 0;
      if (actorTier === 'zero') return actor.likes === 0;
      return true;
    });
  }, [actorQuery, actorTier]);

  if (hudCollapsed) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col pt-16 pb-[4.5rem] lg:justify-between lg:px-10 lg:pt-20 lg:pb-24">
      {/* Top Editorial Header for Active Slide */}
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4 px-4 lg:px-0">
        <div className="pointer-events-auto max-w-xl">
          <p className="text-[11px] font-medium tracking-wide text-[#0284C7] sm:text-xs">
            {slideMeta.kicker}
          </p>
          <h1
            className="font-display mt-0.5 text-xl font-bold tracking-tight text-[#0F172A] sm:text-2xl lg:mt-1 lg:text-[2.15rem] lg:leading-[1.12]"
            style={{ textWrap: 'balance' }}
          >
            {slideMeta.title}
          </h1>
          <p className="mt-1 line-clamp-2 max-w-lg text-xs leading-relaxed text-slate-600 sm:text-sm lg:mt-1.5 lg:line-clamp-none">
            {slideMeta.subtitle}
          </p>
        </div>

        {/* Desktop Top-Right Callout Badges (shown inside mobile sheet on <lg) */}
        {activeSlide === 0 && (
          <div className="glass-panel pointer-events-auto hidden rounded-2xl px-5 py-3.5 text-right lg:block">
            <div className="text-xs font-medium text-slate-500">
              Cobertura del Estudio
            </div>
            <div className="font-mono-tabular mt-0.5 text-2xl font-bold text-[#0284C7]">
              <AnimatedInteger target={20} instant={instantNumbers} triggerKey={activeSlide} /> perfiles
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              31 días · 6,0 posts/día por cuenta
            </div>
          </div>
        )}

        {activeSlide === 2 && (
          <div className="glass-panel pointer-events-auto hidden rounded-2xl px-5 py-3.5 lg:block">
            <div className="text-xs font-medium text-slate-500">
              Crecimiento neto promedio
            </div>
            <div className="font-mono-tabular mt-0.5 text-2xl font-bold text-[#10B981]">
              <AnimatedDecimal target={2.63} decimals={2} prefix="+" suffix="%" instant={instantNumbers} triggerKey={activeSlide} />
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              Variación orgánica · Oct–Nov 2026
            </div>
          </div>
        )}

        {activeSlide === 3 && (
          <div className="glass-panel pointer-events-auto hidden rounded-2xl px-5 py-3.5 text-right lg:block">
            <div className="text-xs font-medium text-slate-500">
              Suma auditada Top 20
            </div>
            <div className="font-mono-tabular mt-0.5 text-2xl font-bold text-[#0F172A]">
              <AnimatedInteger target={3132700} instant={instantNumbers} triggerKey={activeSlide} />
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              Me gusta totales del período
            </div>
          </div>
        )}

        {activeSlide === 7 && (
          <div className="pointer-events-auto hidden flex-wrap items-center gap-3 lg:flex">
            <div className="glass-panel rounded-2xl px-4 py-3 text-right">
              <div className="text-xs font-medium text-slate-500">
                Me gusta 22 actores
              </div>
              <div className="font-mono-tabular mt-0.5 text-2xl font-bold text-[#0284C7]">
                <AnimatedInteger target={3107800} instant={instantNumbers} triggerKey={activeSlide} />
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                19 cuentas activas · 3 sin likes
              </div>
            </div>
            <div className="glass-panel rounded-2xl px-4 py-3 text-right">
              <div className="text-xs font-medium text-slate-500">
                Concentración Top 3
              </div>
              <div className="font-mono-tabular mt-0.5 text-2xl font-bold text-[#10B981]">
                <AnimatedDecimal target={72.7} decimals={1} suffix="%" instant={instantNumbers} triggerKey={activeSlide} />
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                2,26M entre 3 cuentas líderes
              </div>
            </div>
          </div>
        )}

        {activeSlide === 8 && (
          <div className="pointer-events-auto hidden flex-wrap items-center gap-3 lg:flex">
            <div className="glass-panel rounded-2xl px-4 py-3 text-right">
              <div className="text-xs font-medium text-slate-500">
                Total Me Gusta Analizados
              </div>
              <div className="font-mono-tabular mt-0.5 text-2xl font-bold text-[#0F172A]">
                <AnimatedInteger target={3107800} instant={instantNumbers} triggerKey={activeSlide} />
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                Base 100% del gráfico de pastel 3D
              </div>
            </div>
            <div className="glass-panel rounded-2xl px-4 py-3 text-right">
              <div className="text-xs font-medium text-slate-500">
                Cuota Top 6 Actores
              </div>
              <div className="font-mono-tabular mt-0.5 text-2xl font-bold text-[#0284C7]">
                <AnimatedDecimal target={90.3} decimals={1} suffix="%" instant={instantNumbers} triggerKey={activeSlide} />
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                2,81M concentrados en 6 perfiles
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Unobstructed 3D Viewport Showcase Window on Mobile Portrait */}
      <div className="h-[32vh] min-h-[185px] max-h-[290px] shrink-0 pointer-events-none lg:hidden" />

      {/* Slide Content Bento Layouts (Native Scrollable Sheet on <lg, Bottom Floating on lg+) */}
      <div className="editorial-scroll pointer-events-auto min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-8 lg:mt-auto lg:flex-none lg:overflow-visible lg:px-0 lg:pt-0 lg:pb-0 lg:pointer-events-none">
        <div
          data-html2canvas-ignore="true"
          className="mb-2.5 flex items-center justify-center gap-2 lg:hidden"
        >
          <span className="h-1 w-9 rounded-full bg-slate-400/50" />
          <span className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">
            Datos del informe · Desliza
          </span>
        </div>
        {/* Mobile Inline Summary Badges for slides that use top-right desktop badges */}
        {activeSlide === 0 && (
          <div className="glass-panel mb-3 flex items-center justify-between rounded-xl px-3.5 py-2.5 lg:hidden">
            <div>
              <div className="text-[11px] font-medium text-slate-500">Cobertura del Estudio</div>
              <div className="text-[11px] text-slate-500">31 días · 6,0 posts/día por cta</div>
            </div>
            <div className="font-mono-tabular text-lg font-bold text-[#0284C7]">
              20 perfiles
            </div>
          </div>
        )}
        {activeSlide === 2 && (
          <div className="glass-panel mb-3 flex items-center justify-between rounded-xl px-3.5 py-2.5 lg:hidden">
            <div className="text-[11px] font-medium text-slate-600">
              Crecimiento neto promedio · Oct–Nov
            </div>
            <div className="font-mono-tabular text-base font-bold text-[#10B981]">
              +2,63%
            </div>
          </div>
        )}
        {activeSlide === 3 && (
          <div className="glass-panel mb-3 flex items-center justify-between rounded-xl px-3.5 py-2.5 lg:hidden">
            <div className="text-[11px] font-medium text-slate-600">Suma auditada Top 20</div>
            <div className="font-mono-tabular text-base font-bold text-[#0F172A]">
              3.132.700 likes
            </div>
          </div>
        )}
        {activeSlide === 7 && (
          <div className="mb-3 grid grid-cols-2 gap-2.5 lg:hidden">
            <div className="glass-panel rounded-xl px-3 py-2.5">
              <div className="text-[11px] text-slate-500">22 actores</div>
              <div className="font-mono-tabular text-base font-bold text-[#0284C7]">3.107.800</div>
            </div>
            <div className="glass-panel rounded-xl px-3 py-2.5">
              <div className="text-[11px] text-slate-500">Top 3 concentración</div>
              <div className="font-mono-tabular text-base font-bold text-[#10B981]">72,7%</div>
            </div>
          </div>
        )}
        {activeSlide === 8 && (
          <div className="mb-3 grid grid-cols-2 gap-2.5 lg:hidden">
            <div className="glass-panel rounded-xl px-3 py-2.5">
              <div className="text-[11px] text-slate-500">Total Analizado</div>
              <div className="font-mono-tabular text-base font-bold text-[#0F172A]">3.107.800</div>
            </div>
            <div className="glass-panel rounded-xl px-3 py-2.5">
              <div className="text-[11px] text-slate-500">Cuota Top 6</div>
              <div className="font-mono-tabular text-base font-bold text-[#0284C7]">90,3%</div>
            </div>
          </div>
        )}
        {/* SLIDE 0: DASHBOARD DE RESUMEN EJECUTIVO */}
        {activeSlide === 0 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* KPI Cards aligned with 3D Ring Gauges */}
            <div className="pointer-events-auto grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-8">
              <div className="glass-panel rounded-2xl p-4 transition-transform duration-200 hover:-translate-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-500">Total Cuentas</span>
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0284C7]" />
                </div>
                <div className="font-mono-tabular mt-1.5 text-2xl font-bold text-[#0F172A]">
                  <AnimatedInteger target={20} instant={instantNumbers} triggerKey={activeSlide} />
                </div>
                <p className="mt-1 text-[11px] text-slate-600">
                  19 con likes · 1 sin likes
                </p>
              </div>

              <div className="glass-panel rounded-2xl p-4 transition-transform duration-200 hover:-translate-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-500">Me Gusta Totales</span>
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0F172A]" />
                </div>
                <div className="font-mono-tabular mt-1.5 text-2xl font-bold text-[#0284C7]">
                  <AnimatedDecimal target={3.13} decimals={2} suffix="M" instant={instantNumbers} triggerKey={activeSlide} />
                </div>
                <p className="mt-1 text-[11px] text-slate-600">
                  3.132.700 reacciones totales
                </p>
              </div>

              <div className="glass-panel rounded-2xl p-4 transition-transform duration-200 hover:-translate-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-500">Engagement Rate</span>
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F97316]" />
                </div>
                <div className="font-mono-tabular mt-1.5 text-2xl font-bold text-[#F97316]">
                  <AnimatedDecimal target={1.06} decimals={2} suffix="%" instant={instantNumbers} triggerKey={activeSlide} />
                </div>
                <p className="mt-1 text-[11px] text-slate-600">
                  Reels líderes: 1,36% ER
                </p>
              </div>

              <div className="glass-panel rounded-2xl p-4 transition-transform duration-200 hover:-translate-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-500">Crecimiento Neto</span>
                  <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
                </div>
                <div className="font-mono-tabular mt-1.5 text-2xl font-bold text-[#10B981]">
                  <AnimatedDecimal target={2.63} decimals={2} prefix="+" suffix="%" instant={instantNumbers} triggerKey={activeSlide} />
                </div>
                <p className="mt-1 text-[11px] text-slate-600">
                  6,0 posts/día por cuenta
                </p>
              </div>
            </div>

            {/* Segment Distribution Summary aligned with 3D Bars & Total Cuentas Ring */}
            <div className="glass-panel pointer-events-auto rounded-2xl p-4 lg:col-span-4">
              <div className="flex items-center justify-between border-b border-slate-900/10 pb-2 text-xs">
                <span className="font-display font-semibold text-[#0F172A]">
                  Distribución por Segmento (20 Cuentas)
                </span>
                <span className="font-mono-tabular font-semibold text-[#0284C7]">
                  Top 5: 86,3%
                </span>
              </div>
              <div className="mt-2.5 space-y-2">
                {ECOSYSTEM_SEGMENT_SUMMARY.map((seg) => (
                  <div key={seg.segment} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-[#0F172A]">
                        {seg.segment}{' '}
                        <span className="text-slate-500">({seg.accounts} ctas)</span>
                      </span>
                      <span className="font-mono-tabular font-semibold text-[#0F172A]">
                        {seg.likesLabel}{' '}
                        <span style={{ color: seg.color }}>
                          ({seg.sharePct.toFixed(1).replace('.', ',')}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${seg.sharePct}%`, backgroundColor: seg.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 1: CUOTA DE ALCANCE */}
        {activeSlide === 1 && (
          <div className="pointer-events-auto grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {REACH_SHARE_DATA.map((item) => (
              <div
                key={item.id}
                className="glass-panel rounded-2xl p-4 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold text-[#0F172A]">
                    {item.name}
                  </span>
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
                <div className="font-mono-tabular mt-2 text-xl font-bold text-[#0F172A]">
                  {item.interactionsLabel}
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Cuota</span>
                  <span className="font-mono-tabular font-semibold" style={{ color: item.color }}>
                    <AnimatedDecimal
                      target={item.sharePct}
                      decimals={1}
                      suffix="%"
                      instant={instantNumbers} triggerKey={activeSlide}
                    />
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (item.sharePct / 36.3) * 100)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SLIDE 2: SEGUIDORES VS. ENGAGEMENT */}
        {activeSlide === 2 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="glass-panel pointer-events-auto rounded-2xl p-4 lg:col-span-5">
              <div className="flex items-center justify-between border-b border-slate-900/10 pb-2">
                <h2 className="font-display text-sm font-semibold text-[#0F172A]">
                  Top Seguidores (Fila Frontal 3D)
                </h2>
                <span className="text-xs text-slate-500">Audiencia base</span>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2">
                {TOP_FOLLOWERS_DATA.map((item, idx) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="truncate text-slate-700">
                      {idx + 1}. {item.name}
                    </span>
                    <span className="font-mono-tabular shrink-0 font-semibold text-[#0F172A]">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:col-span-2 lg:block" />

            <div className="glass-panel pointer-events-auto rounded-2xl p-4 lg:col-span-5">
              <div className="flex items-center justify-between border-b border-slate-900/10 pb-2">
                <h2 className="font-display text-sm font-semibold text-[#0F172A]">
                  Top Engagement (Fila Anillos 3D)
                </h2>
                <span className="text-xs text-[#F97316]">Tasa interacción</span>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2">
                {TOP_ENGAGEMENT_DATA.map((item, idx) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="truncate text-slate-700">
                      {idx + 1}. {item.name}
                    </span>
                    <span
                      className="font-mono-tabular shrink-0 font-semibold"
                      style={{ color: item.color }}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 3: RANKING TOP 20 ME GUSTA (TABLA INTERACTIVA CON FILTROS) */}
        {activeSlide === 3 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="glass-panel pointer-events-auto flex max-h-[46vh] flex-col rounded-2xl p-4 lg:col-span-6 lg:max-h-[56vh] xl:col-span-5">
              {/* Filter & Search Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900/10 pb-3">
                <div className="relative min-w-[170px] flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrar perfil..."
                    className="w-full rounded-lg border border-slate-900/10 bg-white/80 py-1.5 pr-3 pl-8 text-xs text-[#0F172A] placeholder:text-slate-400 focus:border-[#0284C7] focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setSortBy((prev) => (prev === 'rank' ? 'name' : 'rank'))}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-900/10 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
                >
                  <ArrowUpDown className="h-3.5 w-3.5 text-[#0284C7]" />
                  {sortBy === 'rank' ? 'Orden: Likes' : 'Orden: A–Z'}
                </button>
              </div>

              {/* Category Segmented Tabs */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1 rounded-lg bg-slate-100/90 p-1">
                {(['Todos', 'Top 5', 'Medio Informativo', 'Comunidad / Viral', 'Institucional / Figura'] as const).map(
                  (cat) => {
                    const active = categoryFilter === cat;
                    const shortName =
                      cat === 'Medio Informativo'
                        ? 'Medios'
                        : cat === 'Comunidad / Viral'
                          ? 'Comunidad'
                          : cat === 'Institucional / Figura'
                            ? 'Instituc.'
                            : cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoryFilter(cat)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-white text-[#0F172A] shadow-sm'
                            : 'text-slate-600 hover:text-[#0F172A]'
                        }`}
                      >
                        {shortName}
                      </button>
                    );
                  }
                )}
              </div>

              {/* Data Grid */}
              <div className="editorial-scroll mt-2.5 flex-1 overflow-y-auto pr-1">
                {filteredTop20.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No hay perfiles que coincidan con el filtro aplicado.
                  </div>
                ) : (
                  <table className="w-full border-collapse text-left text-xs">
                    <thead className="sticky top-0 bg-white/95 text-slate-500">
                      <tr className="border-b border-slate-900/10">
                        <th className="py-2 pr-2 font-medium">#</th>
                        <th className="py-2 pr-2 font-medium">Perfil</th>
                        <th className="py-2 pr-2 font-medium hidden sm:table-cell">Segmento</th>
                        <th className="py-2 text-right font-medium">Me gusta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTop20.map((row) => {
                        const isHighlighted = highlightedRank === row.rank;
                        return (
                          <tr
                            key={row.rank}
                            onMouseEnter={() => onHoverRank(row.rank)}
                            onMouseLeave={() => onHoverRank(null)}
                            className={`cursor-pointer border-b border-slate-900/5 transition-colors ${
                              isHighlighted ? 'bg-[#0284C7]/12' : 'hover:bg-slate-900/[0.03]'
                            }`}
                          >
                            <td className="font-mono-tabular py-2 pr-2 font-semibold text-slate-500">
                              {String(row.rank).padStart(2, '0')}
                            </td>
                            <td className="py-2 pr-2 font-semibold text-[#0F172A]">
                              {row.name}
                            </td>
                            <td className="py-2 pr-2 text-slate-500 hidden sm:table-cell">
                              {row.category}
                            </td>
                            <td className="font-mono-tabular py-2 text-right font-semibold text-[#0F172A]">
                              {formatSpanishInt(row.likes)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="hidden lg:col-span-6 xl:col-span-7 lg:flex items-end justify-end">
              <div
                data-html2canvas-ignore="true"
                className="glass-panel pointer-events-auto rounded-xl px-4 py-2.5 text-xs text-slate-600"
              >
                Pasa el cursor sobre cualquier fila para iluminar su pilar 3D correspondiente.
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 4: AGENDA TEMÁTICA Y HASHTAGS */}
        {activeSlide === 4 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Left Bento: Hashtags */}
            <div className="glass-panel pointer-events-auto rounded-2xl p-4 lg:col-span-5">
              <div className="flex items-center justify-between border-b border-slate-900/10 pb-2">
                <h2 className="font-display text-sm font-semibold text-[#0F172A]">
                  Hashtags con Mayor Interacción
                </h2>
                <span className="text-xs text-slate-500">Nube 3D</span>
              </div>
              <div className="mt-3 space-y-2.5">
                {HASHTAGS_DATA.map((h) => (
                  <div key={h.tag} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#0F172A]">
                        {h.tag}{' '}
                        <span className="font-normal text-slate-500">· {h.topic}</span>
                      </span>
                      <span
                        className="font-mono-tabular font-semibold"
                        style={{ color: h.color }}
                      >
                        {h.interactionPct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(h.interactionPct / 45) * 100}%`,
                          backgroundColor: h.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:col-span-2 lg:block" />

            {/* Right Bento: Hitos Virales */}
            <div className="glass-panel pointer-events-auto rounded-2xl p-4 lg:col-span-5">
              <div className="flex items-center justify-between border-b border-slate-900/10 pb-2">
                <h2 className="font-display text-sm font-semibold text-[#0F172A]">
                  Hitos Virales del Período
                </h2>
                <span className="text-xs text-[#10B981]">Mayor tracción</span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {VIRAL_MILESTONES.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-slate-900/8 bg-white/75 p-3"
                  >
                    <div className="text-[11px] font-medium text-slate-500">
                      {m.category}
                    </div>
                    <div className="mt-0.5 text-xs font-semibold leading-snug text-[#0F172A]">
                      {m.title}
                    </div>
                    <div className="mt-1.5 flex items-baseline justify-between">
                      <span
                        className="font-mono-tabular text-lg font-bold"
                        style={{ color: m.color }}
                      >
                        {m.interactionsLabel}
                      </span>
                      {m.extra && (
                        <span className="font-mono-tabular text-[11px] font-semibold text-[#F97316]">
                          {m.extra}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 5: RADAR DE SENTIMIENTO NEGATIVO */}
        {activeSlide === 5 && (
          <div className="pointer-events-auto grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SENTIMENT_SERIES.filter((s) => s.isPeak).map((peak) => {
              const isMax = peak.negativity >= 50;
              return (
                <div
                  key={peak.date}
                  className="glass-panel rounded-2xl p-4 transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500">{peak.date}</span>
                    <span
                      className={`font-medium ${
                        isMax ? 'text-[#DC2626]' : 'text-[#F97316]'
                      }`}
                    >
                      {isMax ? 'Pico máximo' : 'Estallido'}
                    </span>
                  </div>
                  <div
                    className={`font-mono-tabular mt-1.5 text-2xl font-bold ${
                      isMax ? 'text-[#DC2626]' : 'text-[#F97316]'
                    }`}
                  >
                    <AnimatedInteger target={peak.negativity} instant={instantNumbers} triggerKey={activeSlide} />%
                  </div>
                  <div className="mt-1 text-xs font-semibold text-[#0F172A]">
                    {peak.label}
                  </div>
                  <p className="mt-1 text-xs leading-snug text-slate-600">
                    {peak.detail}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* SLIDE 6: INGENIERÍA DE FORMATOS, AUDIENCIA Y CIERRE */}
        {activeSlide === 6 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Format comparison */}
            <div className="glass-panel pointer-events-auto rounded-2xl p-4 lg:col-span-5">
              <div className="flex items-center justify-between border-b border-slate-900/10 pb-2">
                <h2 className="font-display text-sm font-semibold text-[#0F172A]">
                  Volumen Publicado vs. Tasa de Interacción
                </h2>
                <span className="text-xs text-slate-500">5.294 piezas</span>
              </div>
              <div className="mt-3 space-y-2.5">
                {FORMATS_DATA.map((f) => (
                  <div
                    key={f.format}
                    className="flex items-center justify-between rounded-xl border border-slate-900/8 bg-white/75 px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[#0F172A]">{f.format}</div>
                      <div className="font-mono-tabular text-slate-500">
                        {f.volumeLabel} publicaciones
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="font-mono-tabular text-lg font-bold"
                        style={{ color: f.color }}
                      >
                        {f.engagementLabel}
                      </div>
                      <div className="text-[11px] text-slate-500">Engagement</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audience profile */}
            <div className="glass-panel pointer-events-auto rounded-2xl p-4 lg:col-span-3">
              <div className="border-b border-slate-900/10 pb-2">
                <h2 className="font-display text-sm font-semibold text-[#0F172A]">
                  Perfil de Audiencia
                </h2>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-900/8 bg-white/75 p-3">
                  <div className="text-xs text-slate-500">Mujeres</div>
                  <div className="font-mono-tabular mt-1 text-2xl font-bold text-[#0284C7]">
                    <AnimatedInteger target={52} instant={instantNumbers} triggerKey={activeSlide} />%
                  </div>
                </div>
                <div className="rounded-xl border border-slate-900/8 bg-white/75 p-3">
                  <div className="text-xs text-slate-500">Hombres</div>
                  <div className="font-mono-tabular mt-1 text-2xl font-bold text-[#0F172A]">
                    <AnimatedInteger target={48} instant={instantNumbers} triggerKey={activeSlide} />%
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-slate-900/8 bg-white/75 p-3 text-xs">
                <div className="text-slate-500">Núcleo demográfico principal</div>
                <div className="font-mono-tabular mt-1 text-base font-bold text-[#0F172A]">
                  35–54 años
                </div>
              </div>
            </div>

            {/* Executive Recommendation */}
            <div className="glass-panel-dark pointer-events-auto flex flex-col justify-between rounded-2xl p-5 text-white lg:col-span-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#38BDF8]">
                  <Sparkles className="h-4 w-4" />
                  Recomendación Estratégica Clave
                </div>
                <h3 className="font-display mt-2 text-lg font-bold leading-snug">
                  Migrar a Reels cortos y capitalizar la ventana nocturna de las 21:00 hrs
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  Los Reels generan 2,5x más interacción (1,36%) que las imágenes estáticas (0,53%), aunque hoy representan solo el 34% del volumen publicado.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-300">
                <span>Horario estelar recomendado</span>
                <span className="font-mono-tabular font-semibold text-[#10B981]">
                  21:00 hrs
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 7: ME GUSTA DEL PERÍODO POR ACTOR (22 CUENTAS) */}
        {activeSlide === 7 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="glass-panel pointer-events-auto flex max-h-[46vh] flex-col rounded-2xl p-4 lg:col-span-6 lg:max-h-[56vh] xl:col-span-5">
              {/* Search + Segmented Tier Filter */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900/10 pb-3">
                <div className="relative min-w-[160px] flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={actorQuery}
                    onChange={(e) => setActorQuery(e.target.value)}
                    placeholder="Buscar @cuenta..."
                    className="w-full rounded-lg border border-slate-900/10 bg-white/80 py-1.5 pr-3 pl-8 text-xs text-[#0F172A] placeholder:text-slate-400 focus:border-[#0284C7] focus:outline-none"
                  />
                </div>
                <span className="font-mono-tabular text-xs font-medium text-slate-500">
                  {filteredActorsLikes.length} / 22
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-1 rounded-lg bg-slate-100/90 p-1">
                {[
                  { key: 'all', label: 'Todos (22)' },
                  { key: 'top6', label: 'Top 6 (>100k)' },
                  { key: 'active', label: 'Con Me Gusta (19)' },
                  { key: 'zero', label: 'En 0 (3)' },
                ].map((tab) => {
                  const active = actorTier === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() =>
                        setActorTier(tab.key as 'all' | 'top6' | 'active' | 'zero')
                      }
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-white text-[#0F172A] shadow-sm'
                          : 'text-slate-600 hover:text-[#0F172A]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="editorial-scroll mt-2.5 flex-1 overflow-y-auto pr-1">
                {filteredActorsLikes.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No se encontraron cuentas con ese filtro.
                  </div>
                ) : (
                  <table className="w-full border-collapse text-left text-xs">
                    <thead className="sticky top-0 bg-white/95 text-slate-500">
                      <tr className="border-b border-slate-900/10">
                        <th className="py-2 pr-2 font-medium">#</th>
                        <th className="py-2 pr-2 font-medium">Actor (@Instagram)</th>
                        <th className="py-2 pr-2 text-right font-medium hidden sm:table-cell">
                          Posts
                        </th>
                        <th className="py-2 pr-2 text-right font-medium hidden sm:table-cell">
                          Interacc.
                        </th>
                        <th className="py-2 text-right font-medium">Me gusta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredActorsLikes.map((actor) => {
                        const isHighlighted = highlightedRank === actor.rank;
                        const barWidth =
                          actor.likes > 0
                            ? Math.max(3, (actor.likes / 1200000) * 100)
                            : 0;
                        const accent =
                          actor.rank === 1
                            ? '#0284C7'
                            : actor.rank === 2
                              ? '#0F172A'
                              : actor.rank === 3
                                ? '#10B981'
                                : actor.rank <= 6
                                  ? '#F97316'
                                  : '#38BDF8';
                        return (
                          <tr
                            key={actor.handle}
                            onMouseEnter={() => onHoverRank(actor.rank)}
                            onMouseLeave={() => onHoverRank(null)}
                            className={`cursor-pointer border-b border-slate-900/5 transition-colors ${
                              isHighlighted
                                ? 'bg-[#0284C7]/12'
                                : 'hover:bg-slate-900/[0.03]'
                            }`}
                          >
                            <td className="font-mono-tabular py-2 pr-2 font-semibold text-slate-500">
                              {String(actor.rank).padStart(2, '0')}
                            </td>
                            <td className="py-2 pr-2">
                              <div className="font-semibold text-[#0F172A]">
                                {actor.handle}
                              </div>
                              <div className="mt-1 h-1 w-28 overflow-hidden rounded-full bg-slate-200/80">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${barWidth}%`,
                                    backgroundColor: accent,
                                  }}
                                />
                              </div>
                            </td>
                            <td className="font-mono-tabular py-2 pr-2 text-right text-slate-500 hidden sm:table-cell">
                              {actor.posts}
                            </td>
                            <td className="font-mono-tabular py-2 pr-2 text-right text-slate-600 hidden sm:table-cell">
                              {actor.interactionRate}
                            </td>
                            <td className="font-mono-tabular py-2 text-right font-bold text-[#0F172A]">
                              {actor.likesLabel}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="hidden lg:col-span-6 xl:col-span-7 lg:flex items-end justify-end">
              <div
                data-html2canvas-ignore="true"
                className="glass-panel pointer-events-auto rounded-xl px-4 py-2.5 text-xs text-slate-600"
              >
                22 barras 3D sincronizadas · Pasa el cursor por cada columna o fila para ver seguidores, publicaciones y tasa de interacción.
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 8: PASTEL 3D CUOTA DE INFLUENCIA POR ACTOR PRINCIPAL */}
        {activeSlide === 8 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="glass-panel pointer-events-auto rounded-2xl p-4 lg:col-span-5">
              <div className="flex items-center justify-between border-b border-slate-900/10 pb-2.5">
                <h2 className="font-display text-sm font-semibold text-[#0F172A]">
                  Cuota de Influencia · Me Gusta
                </h2>
                <span className="text-xs text-slate-500">7 segmentos 3D</span>
              </div>

              <div className="mt-3 space-y-2">
                {LIKES_PIE_DATA.map((slice) => {
                  const isHighlighted = highlightedRank === slice.rank;
                  return (
                    <div
                      key={slice.rank}
                      onMouseEnter={() => onHoverRank(slice.rank)}
                      onMouseLeave={() => onHoverRank(null)}
                      className={`cursor-pointer rounded-xl border px-3 py-2 transition-all duration-150 ${
                        isHighlighted
                          ? 'border-[#0284C7]/40 bg-[#0284C7]/10 shadow-sm'
                          : 'border-slate-900/8 bg-white/75 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-sm"
                            style={{ backgroundColor: slice.color }}
                          />
                          <span className="truncate font-semibold text-[#0F172A]">
                            {slice.name}
                          </span>
                          <span className="hidden truncate text-[11px] text-slate-500 sm:inline">
                            {slice.handle}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-baseline gap-2.5">
                          <span className="font-mono-tabular font-bold text-[#0F172A]">
                            {slice.likesLabel}
                          </span>
                          <span
                            className="font-mono-tabular w-14 text-right font-semibold"
                            style={{ color: slice.color }}
                          >
                            {slice.sharePct.toFixed(1).replace('.', ',')}%
                          </span>
                        </div>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(slice.sharePct / 38.61) * 100}%`,
                            backgroundColor: slice.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="hidden lg:col-span-7 lg:flex items-end justify-end">
              <div
                data-html2canvas-ignore="true"
                className="glass-panel pointer-events-auto rounded-xl px-4 py-2.5 text-xs text-slate-600"
              >
                Pasa el cursor sobre cualquier rebanada del pastel 3D o fila de la leyenda para extraer el segmento y comparar su variación frente al promedio.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
