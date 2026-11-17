import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Maximize2,
  Network,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  AuthorityRoleCategory,
  EDICION3_AUTHORITIES,
  EDICION3_EXECUTIVE_KPIS,
  EDICION3_FORMATS,
  EDICION3_INSTITUTIONAL,
  EDICION3_SENTIMENT,
  EDICION3_SLIDES,
  EDICION3_TOP_HASHTAGS,
  Edicion3Authority,
} from '../data/edicion3Data';
import { EDICION3_TOP_POSTS } from '../data/edicion3WordNetwork';
import { Edicion3DuelMode } from '../three/edicion3Builders';

type SortField = 'rank' | 'followers' | 'posts' | 'likes' | 'comments' | 'erPct' | 'ppiPct';

interface Edicion3OverlaysProps {
  activeSlide: number;
  duelMode: Edicion3DuelMode;
  onDuelModeChange: (mode: Edicion3DuelMode) => void;
  highlightedRank: number | null;
  selectedRank: number | null;
  onHoverRank: (rank: number | null) => void;
  onSelectRank: (rank: number | null, origin?: { x: number; y: number }) => void;
  hudCollapsed: boolean;
  accessLogCount: number;
  onOpenWordNetwork: () => void;
  onOpenAccessLogs: () => void;
}

function formatPctEs(value: number): string {
  const decimals = value >= 10 ? 1 : 2;
  return `${value.toFixed(decimals).replace('.', ',')}%`;
}

const HistoricalErTimeSeriesCard: React.FC<{
  authority: Edicion3Authority;
  compact?: boolean;
}> = ({ authority, compact = false }) => {
  const [hoveredWeekIdx, setHoveredWeekIdx] = useState<number | null>(null);

  const deltaPts = authority.erPct - authority.prevMonthErPct;
  const relDeltaPct =
    authority.prevMonthErPct > 0 ? (deltaPts / authority.prevMonthErPct) * 100 : 0;
  const isPositive = deltaPts >= 0;

  const chartW = 280;
  const chartH = compact ? 82 : 90;
  const padL = 34;
  const padR = 12;
  const padT = 12;
  const padB = 22;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const allVals = authority.erSeries.flatMap((pt) => [pt.currentPct, pt.prevPct]);
  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals);
  const span = Math.max(0.15, rawMax - rawMin);
  const minVal = Math.max(0, rawMin - span * 0.28);
  const maxVal = rawMax + span * 0.22;
  const valRange = Math.max(0.1, maxVal - minVal);

  const toX = (idx: number) =>
    padL + (authority.erSeries.length > 1 ? (idx / (authority.erSeries.length - 1)) * plotW : plotW / 2);
  const toY = (val: number) => padT + plotH - ((val - minVal) / valRange) * plotH;

  const currPoints = authority.erSeries.map((pt, idx) => ({
    x: toX(idx),
    y: toY(pt.currentPct),
    pt,
  }));
  const prevPoints = authority.erSeries.map((pt, idx) => ({
    x: toX(idx),
    y: toY(pt.prevPct),
    pt,
  }));

  const currLinePath = currPoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const prevLinePath = prevPoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const currAreaPath = `${currLinePath} L ${currPoints[currPoints.length - 1].x.toFixed(1)} ${(padT + plotH).toFixed(1)} L ${currPoints[0].x.toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;

  const gradId = `ed3-er-grad-${authority.rank}`;
  const activeWeek = hoveredWeekIdx !== null ? authority.erSeries[hoveredWeekIdx] : null;

  return (
    <div className="dark-glass-panel rounded-2xl border border-white/15 bg-[#070E20]/92 p-3 text-slate-100 shadow-2xl">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-mono-tabular text-[10px] font-semibold tracking-wider text-[#00F0FF] uppercase">
            Evolución ER% · Base Escalera
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span
              className="font-mono-tabular text-xs font-extrabold"
              style={{ color: authority.color }}
            >
              #{String(authority.rank).padStart(2, '0')}
            </span>
            <span className="truncate font-display text-sm font-bold text-white">
              {authority.shortName}
            </span>
          </div>
        </div>

        <div
          className={`font-mono-tabular inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${
            isPositive
              ? 'bg-[#10B981]/15 text-[#10B981]'
              : 'bg-[#FB7185]/15 text-[#FB7185]'
          }`}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3 shrink-0" />
          ) : (
            <TrendingDown className="h-3 w-3 shrink-0" />
          )}
          <span>
            {isPositive ? '+' : ''}
            {deltaPts.toFixed(2).replace('.', ',')} pts
          </span>
        </div>
      </div>

      {/* Comparative KPI bar: Current Cycle vs Prior Month */}
      <div className="mt-2 grid grid-cols-3 gap-2 border-y border-white/10 py-2 text-[11px]">
        <div>
          <div className="text-[10px] text-slate-400">Nov 2026</div>
          <div
            className="font-mono-tabular text-sm font-bold"
            style={{ color: authority.color }}
          >
            {authority.erLabel}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400">Oct 2026</div>
          <div className="font-mono-tabular text-sm font-semibold text-slate-300">
            {authority.prevMonthErLabel}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400">Var. Mensual</div>
          <div
            className={`font-mono-tabular text-xs font-bold ${
              isPositive ? 'text-[#10B981]' : 'text-[#FB7185]'
            }`}
          >
            {relDeltaPct >= 0 ? '+' : ''}
            {relDeltaPct.toFixed(1).replace('.', ',')}%
          </div>
        </div>
      </div>

      {/* Interactive SVG Time-Series Line + Gradient Area Chart */}
      <div className="mt-2">
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="h-auto w-full overflow-visible"
          role="img"
          aria-label={`Serie temporal de ER% para ${authority.shortName}: Noviembre vs Octubre 2026`}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={authority.color} stopOpacity="0.38" />
              <stop offset="100%" stopColor={authority.color} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Horizontal Y gridlines & labels */}
          {[0, 0.5, 1].map((frac) => {
            const val = minVal + valRange * frac;
            const y = toY(val);
            return (
              <g key={frac}>
                <line
                  x1={padL}
                  y1={y}
                  x2={chartW - padR}
                  y2={y}
                  stroke="rgba(148, 163, 184, 0.16)"
                  strokeDasharray="3 3"
                />
                <text
                  x={padL - 5}
                  y={y + 3}
                  textAnchor="end"
                  fill="#94A3B8"
                  fontSize="8.5"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {formatPctEs(val)}
                </text>
              </g>
            );
          })}

          {/* Area under Current Month curve */}
          <path d={currAreaPath} fill={`url(#${gradId})`} />

          {/* Prior Month (Oct) dashed comparative trajectory */}
          <path
            d={prevLinePath}
            fill="none"
            stroke="#94A3B8"
            strokeWidth="1.8"
            strokeDasharray="4 3"
            strokeLinecap="round"
          />
          {prevPoints.map((p, idx) => (
            <circle
              key={`prev-${idx}`}
              cx={p.x}
              cy={p.y}
              r={hoveredWeekIdx === idx ? 3.8 : 2.6}
              fill="#CBD5E1"
              stroke="#070E20"
              strokeWidth="1.2"
            />
          ))}

          {/* Current Month (Nov) primary curve */}
          <path
            d={currLinePath}
            fill="none"
            stroke={authority.color}
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {currPoints.map((p, idx) => {
            const active = hoveredWeekIdx === idx;
            return (
              <g key={`curr-${idx}`}>
                {active && (
                  <line
                    x1={p.x}
                    y1={padT}
                    x2={p.x}
                    y2={padT + plotH}
                    stroke={authority.color}
                    strokeOpacity="0.4"
                    strokeDasharray="2 2"
                  />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={active ? 4.8 : 3.4}
                  fill="#FFFFFF"
                  stroke={authority.color}
                  strokeWidth="2.2"
                />
                <text
                  x={p.x}
                  y={chartH - 5}
                  textAnchor="middle"
                  fill={active ? '#FFFFFF' : '#94A3B8'}
                  fontSize="9"
                  fontWeight={active ? 700 : 500}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {p.pt.label}
                </text>
                {/* Invisible wider pointer hit column per week */}
                <rect
                  x={p.x - plotW / 8}
                  y={padT - 4}
                  width={plotW / 4}
                  height={plotH + padB}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredWeekIdx(idx)}
                  onMouseLeave={() => setHoveredWeekIdx(null)}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer: Hover breakdown or Legend */}
      <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-white/10 pt-1.5 text-[10px]">
        {activeWeek ? (
          <div className="font-mono-tabular flex w-full items-center justify-between text-slate-200">
            <span className="font-bold text-white">{activeWeek.label}:</span>
            <span>
              <span style={{ color: authority.color }} className="font-bold">
                Nov {formatPctEs(activeWeek.currentPct)}
              </span>{' '}
              <span className="text-slate-500">vs</span>{' '}
              <span className="text-slate-300">Oct {formatPctEs(activeWeek.prevPct)}</span>
            </span>
          </div>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5 text-slate-200">
              <span
                className="inline-block h-0.5 w-3.5 rounded-full"
                style={{ backgroundColor: authority.color }}
              />
              Ciclo Nov
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <span className="inline-block h-0.5 w-3.5 border-t border-dashed border-slate-400" />
              Mes ant. (Oct)
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export const Edicion3Overlays: React.FC<Edicion3OverlaysProps> = ({
  activeSlide,
  duelMode,
  onDuelModeChange,
  highlightedRank,
  selectedRank,
  onHoverRank,
  onSelectRank,
  hudCollapsed,
  accessLogCount,
  onOpenWordNetwork,
  onOpenAccessLogs,
}) => {
  const [roleFilter, setRoleFilter] = useState<'all' | AuthorityRoleCategory>('all');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('rank');
  const [sortAsc, setSortAsc] = useState(true);
  const [slide2Tab, setSlide2Tab] = useState<'formats' | 'viral'>('formats');

  const sortedAuthorities = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = EDICION3_AUTHORITIES.filter((a) => {
      if (roleFilter !== 'all' && a.role !== roleFilter) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.handle.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.highlightNote.toLowerCase().includes(q)
      );
    });
    return [...filtered].sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      return sortAsc ? av - bv : bv - av;
    });
  }, [query, roleFilter, sortAsc, sortBy]);

  if (hudCollapsed) return null;

  const meta = EDICION3_SLIDES[activeSlide] ?? EDICION3_SLIDES[0];
  const selectedAuthority =
    selectedRank !== null
      ? EDICION3_AUTHORITIES.find((a) => a.rank === selectedRank) ?? null
      : null;
  const timeSeriesAuthority = useMemo(() => {
    const targetRank = selectedRank ?? highlightedRank ?? 1;
    return EDICION3_AUTHORITIES.find((a) => a.rank === targetRank) ?? EDICION3_AUTHORITIES[0];
  }, [highlightedRank, selectedRank]);
  const showDetailSpotlight =
    Boolean(selectedAuthority) && (activeSlide === 1 || activeSlide === 4);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortBy(field);
      setSortAsc(field === 'rank');
    }
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col pt-16 pb-[4.5rem] lg:justify-between lg:px-10 lg:pt-20 lg:pb-24">
      {/* Header Row */}
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4 px-4 lg:px-0">
        <div className="pointer-events-auto max-w-xl">
          <p className="font-mono-tabular text-[11px] font-semibold tracking-wider text-[#F59E0B] uppercase sm:text-xs">
            {meta.kicker}
          </p>
          <h1
            className="font-display mt-0.5 text-xl font-bold tracking-tight text-white sm:text-2xl lg:mt-1 lg:text-[2.1rem] lg:leading-[1.12]"
            style={{ textWrap: 'balance' }}
          >
            {meta.title}
          </h1>
          <p className="mt-1 line-clamp-2 max-w-lg text-xs leading-relaxed text-slate-300 sm:text-sm lg:mt-1.5 lg:line-clamp-none">
            {meta.subtitle}
          </p>
        </div>

        {/* Right Header Institutional Action Strip (clean buttons, zero static pills) */}
        <div
          data-html2canvas-ignore="true"
          className="pointer-events-auto flex flex-col items-end gap-2.5"
        >
          <div className="flex flex-wrap items-center justify-end gap-2">
            {showDetailSpotlight && (
              <button
                type="button"
                onClick={() => onSelectRank(null)}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#F59E0B]/55 bg-[#F59E0B]/20 px-3 text-xs font-semibold text-[#FDE68A] transition-colors hover:bg-[#F59E0B] hover:text-[#060B19]"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Ver Escalera Completa (13)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenWordNetwork}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#00F0FF]/45 bg-[#00F0FF]/12 px-3.5 text-xs font-semibold text-[#00F0FF] transition-colors hover:bg-[#00F0FF] hover:text-[#060B19]"
            >
              <Network className="h-4 w-4" />
              <span>Nube de Nodos (Palabras + Hashtags)</span>
            </button>

            <button
              type="button"
              onClick={onOpenAccessLogs}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/15"
              title="Consultar bitácora de accesos registrados"
            >
              <ClipboardList className="h-3.5 w-3.5 text-[#F59E0B]" />
              <span>Bitácora ({accessLogCount})</span>
            </button>
          </div>

          {/* Focused Authority Detail Card when user taps a bottom card / 3D stair */}
          {showDetailSpotlight && selectedAuthority && (
            <div className="dark-glass-panel w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-[#F59E0B]/45 bg-[#070E20]/95 p-3.5 text-left shadow-2xl">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono-tabular inline-flex items-center rounded-md px-2 py-0.5 text-xs font-extrabold text-[#060B19]"
                      style={{ backgroundColor: selectedAuthority.color }}
                    >
                      POS #{String(selectedAuthority.rank).padStart(2, '0')}
                    </span>
                    <span className="truncate text-[11px] font-medium text-slate-400">
                      {selectedAuthority.role}
                    </span>
                  </div>
                  <h2 className="font-display mt-1.5 truncate text-base font-bold text-white">
                    {selectedAuthority.name}
                  </h2>
                  <p className="font-mono-tabular truncate text-[11px] text-[#00F0FF]">
                    {selectedAuthority.handle}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectRank(null)}
                  aria-label="Cerrar enfoque"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/15 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-2.5 grid grid-cols-3 gap-2 border-y border-white/10 py-2.5 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Me gusta</div>
                  <div
                    className="font-mono-tabular font-bold"
                    style={{ color: selectedAuthority.color }}
                  >
                    {selectedAuthority.likesLabel}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Comentarios</div>
                  <div className="font-mono-tabular font-bold text-white">
                    {selectedAuthority.commentsLabel}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Seguidores</div>
                  <div className="font-mono-tabular font-bold text-slate-200">
                    {selectedAuthority.followersLabel}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Posts (28d)</div>
                  <div className="font-mono-tabular font-bold text-white">
                    {selectedAuthority.posts}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Tasa ER</div>
                  <div className="font-mono-tabular font-bold text-[#00F0FF]">
                    {selectedAuthority.erLabel}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Índice PPI</div>
                  <div className="font-mono-tabular font-bold text-[#10B981]">
                    {selectedAuthority.ppiLabel}
                  </div>
                </div>
              </div>

              <p className="mt-2 text-xs leading-snug text-slate-200">
                {selectedAuthority.highlightNote}
              </p>

              <div className="mt-2.5 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const prevRank =
                      selectedAuthority.rank > 1 ? selectedAuthority.rank - 1 : 13;
                    onSelectRank(prevRank);
                  }}
                  className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border border-white/15 bg-white/[0.05] px-2 text-[11px] font-semibold text-slate-200 hover:bg-white/15"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Subir (#{String(selectedAuthority.rank > 1 ? selectedAuthority.rank - 1 : 13).padStart(2, '0')})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextRank =
                      selectedAuthority.rank < 13 ? selectedAuthority.rank + 1 : 1;
                    onSelectRank(nextRank);
                  }}
                  className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border border-white/15 bg-white/[0.05] px-2 text-[11px] font-semibold text-slate-200 hover:bg-white/15"
                >
                  <span>Bajar (#{String(selectedAuthority.rank < 13 ? selectedAuthority.rank + 1 : 1).padStart(2, '0')})</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Unobstructed Mobile 3D Showcase Window */}
      <div className="h-[30vh] min-h-[175px] max-h-[270px] shrink-0 pointer-events-none lg:hidden" />

      {/* Bottom Interactive Overlays */}
      <div className="editorial-scroll pointer-events-auto min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-8 lg:mt-auto lg:flex-none lg:overflow-visible lg:px-0 lg:pt-0 lg:pb-0 lg:pointer-events-none">
        {/* SLIDE 0: RESUMEN EJECUTIVO */}
        {activeSlide === 0 && (
          <div className="space-y-3">
            <div className="pointer-events-auto grid grid-cols-2 gap-3 lg:grid-cols-4">
              {EDICION3_EXECUTIVE_KPIS.map((kpi) => (
                <div
                  key={kpi.label}
                  className="dark-glass-panel rounded-2xl p-3.5 sm:p-4"
                >
                  <div className="text-[11px] font-medium text-slate-400">{kpi.label}</div>
                  <div
                    className="font-mono-tabular mt-1 text-xl font-bold tracking-tight sm:text-2xl"
                    style={{ color: kpi.color }}
                  >
                    {kpi.value}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-300">{kpi.detail}</div>
                </div>
              ))}
            </div>

            <div className="dark-glass-panel pointer-events-auto flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 text-xs">
              <div>
                <span className="font-semibold text-white">
                  {EDICION3_INSTITUTIONAL.project}
                </span>
                <span className="mx-2 text-slate-600">·</span>
                <span className="text-slate-300">
                  Dirección Institucional: {EDICION3_INSTITUTIONAL.director} ({EDICION3_INSTITUTIONAL.organization})
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[11px]">
                {EDICION3_SENTIMENT.map((s) => (
                  <span key={s.label} className="font-mono-tabular text-slate-200">
                    <span className="font-bold" style={{ color: s.color }}>
                      {s.label}
                    </span>{' '}
                    {s.posts} ({s.pct.toFixed(1).replace('.', ',')}%)
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 1: PODIO DE INTERACCIONES (LOS 13 ACTORES MEDIDOS + SERIE TEMPORAL HISTÓRICA ER% EN LA BASE) */}
        {activeSlide === 1 && (
          <>
            {/* Desktop Left Stair-Base Pocket: Unobstructed Historical ER% Time-Series Widget */}
            <div className="pointer-events-auto hidden lg:fixed lg:top-[13.4rem] lg:left-10 lg:z-20 lg:block lg:w-[19.5rem] xl:top-[14.5rem] xl:w-[20.5rem]">
              <HistoricalErTimeSeriesCard authority={timeSeriesAuthority} compact />
            </div>

            {/* Mobile / Tablet Compact Stack Above Cards */}
            <div className="pointer-events-auto mb-3 lg:hidden">
              <HistoricalErTimeSeriesCard authority={timeSeriesAuthority} compact />
            </div>

            <div className="pointer-events-auto grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7">
              {EDICION3_AUTHORITIES.map((auth) => {
                const isSelected = selectedRank === auth.rank;
                const isHovered = highlightedRank === auth.rank;
                return (
                  <button
                    type="button"
                    key={auth.handle}
                    data-ed3-rank={auth.rank}
                    onMouseEnter={() => onHoverRank(auth.rank)}
                    onMouseLeave={() => onHoverRank(null)}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      onSelectRank(isSelected ? null : auth.rank, {
                        x: rect.left + rect.width / 2,
                        y: rect.top + 2,
                      });
                    }}
                    className={`dark-glass-panel cursor-pointer rounded-xl px-2.5 py-2 text-left transition-all ${
                      isSelected
                        ? '-translate-y-1 border-[#F59E0B] bg-[#F59E0B]/22 ring-2 ring-[#F59E0B]/70 shadow-lg shadow-[#F59E0B]/20'
                        : isHovered
                          ? 'border-white/40 bg-white/10'
                          : 'hover:-translate-y-0.5 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono-tabular font-bold" style={{ color: auth.color }}>
                        #{String(auth.rank).padStart(2, '0')}
                      </span>
                      <span className="font-mono-tabular text-slate-400">{auth.followersLabel} seg</span>
                    </div>
                    <div className="mt-0.5 truncate font-display text-[11px] font-bold text-white">
                      {auth.shortName}
                    </div>
                    <div className="truncate text-[10px] text-slate-400">{auth.handle}</div>
                    <div className="mt-1.5 flex items-baseline justify-between gap-1 border-t border-white/10 pt-1">
                      <span
                        className="font-mono-tabular text-xs font-bold"
                        style={{ color: auth.color }}
                      >
                        {auth.likesLabel}
                      </span>
                      <span className="font-mono-tabular text-[10px] text-slate-300">
                        {auth.posts}p · {auth.ppiLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* SLIDE 2: EFICIENCIA ALGORÍTMICA (PPI 100%, FORMATOS, NUBE & TOP VIRALES) */}
        {activeSlide === 2 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Left: Twin 100% PPI Efficiency Cards */}
            <div className="dark-glass-panel pointer-events-auto rounded-2xl p-4 lg:col-span-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h2 className="font-display text-sm font-semibold text-white">
                  Eficiencia Algorítmica (PPI &amp; ER)
                </h2>
                <span className="font-mono-tabular text-xs font-bold text-[#F59E0B]">
                  Techo 100% PPI
                </span>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2.5 text-xs">
                {[
                  EDICION3_AUTHORITIES[2], // Bernardo Salinas
                  EDICION3_AUTHORITIES[6], // Eileen Patricia
                  EDICION3_AUTHORITIES[0], // Carolina Tello
                  EDICION3_AUTHORITIES[1], // Daniel Manoucheri
                ].map((auth) => (
                  <div
                    key={auth.handle}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5"
                  >
                    <div className="truncate font-semibold text-white">{auth.shortName}</div>
                    <div className="mt-1 flex items-baseline justify-between font-mono-tabular">
                      <span className="text-base font-bold" style={{ color: auth.color }}>
                        {auth.ppiLabel} PPI
                      </span>
                      <span className="font-semibold text-slate-200">{auth.erLabel} ER</span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-400">
                      {auth.followersLabel} seg · {auth.posts} posts
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Formats ROI + Viral Posts / Word Cloud Launcher */}
            <div className="dark-glass-panel pointer-events-auto rounded-2xl p-4 lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSlide2Tab('formats')}
                    className={`min-h-[32px] rounded-lg px-2.5 font-semibold transition-colors ${
                      slide2Tab === 'formats'
                        ? 'bg-[#00F0FF] text-[#060B19]'
                        : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    Formatos &amp; Top Hashtags
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlide2Tab('viral')}
                    className={`min-h-[32px] rounded-lg px-2.5 font-semibold transition-colors ${
                      slide2Tab === 'viral'
                        ? 'bg-[#F59E0B] text-[#060B19]'
                        : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    Top Vídeos &amp; Imágenes
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onOpenWordNetwork}
                  className="inline-flex min-h-[32px] items-center gap-1.5 text-xs font-semibold text-[#00F0FF] hover:underline"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Abrir Nube Interconectada
                </button>
              </div>

              {slide2Tab === 'formats' ? (
                <div className="mt-2.5 space-y-2.5">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {EDICION3_FORMATS.map((fmt) => (
                      <div
                        key={fmt.format}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5"
                      >
                        <div className="truncate font-semibold text-white">{fmt.format}</div>
                        <div
                          className="font-mono-tabular mt-0.5 text-lg font-bold"
                          style={{ color: fmt.color }}
                        >
                          {fmt.erLabel} ER
                        </div>
                        <div className="font-mono-tabular text-[11px] text-slate-300">
                          {fmt.posts} posts ({fmt.sharePct.toFixed(1).replace('.', ',')}%)
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/10 pt-2 text-[11px] text-slate-300">
                    <span className="font-semibold text-slate-400">Top Hashtags ER:</span>
                    {EDICION3_TOP_HASHTAGS.slice(0, 6).map((t) => (
                      <span key={t.tag} className="font-mono-tabular">
                        <span className="text-white">{t.tag}</span>{' '}
                        <span className="font-bold text-[#00F0FF]">{t.erPct}%</span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="editorial-scroll mt-2.5 grid max-h-[172px] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {EDICION3_TOP_POSTS.slice(0, 6).map((p) => (
                    <div
                      key={`${p.format}-${p.rank}`}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#00F0FF]">{p.handle}</span>
                        <span className="font-mono-tabular font-bold text-[#F59E0B] shrink-0">
                          {p.erLabel} ER · {p.format === 'video' ? 'Video' : 'Img'}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-slate-300">{p.excerpt}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SLIDE 3: DUELO MUNICIPAL CONURBACIÓN */}
        {activeSlide === 3 && (
          <div className="space-y-3">
            <div className="pointer-events-auto flex justify-start">
              <div className="dark-glass-panel inline-flex items-center gap-1 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => onDuelModeChange('totals')}
                  className={`min-h-[38px] rounded-lg px-3.5 text-xs font-semibold transition-colors ${
                    duelMode === 'totals'
                      ? 'bg-[#10B981] text-[#060B19]'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Volumen &amp; Frecuencia (34 vs 10 posts)
                </button>
                <button
                  type="button"
                  onClick={() => onDuelModeChange('efficiency')}
                  className={`min-h-[38px] rounded-lg px-3.5 text-xs font-semibold transition-colors ${
                    duelMode === 'efficiency'
                      ? 'bg-[#FF2E93] text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Eficiencia (PPI vs ER)
                </button>
              </div>
            </div>

            <div className="pointer-events-auto grid grid-cols-1 gap-3.5 lg:grid-cols-2">
              {[EDICION3_AUTHORITIES[4], EDICION3_AUTHORITIES[3]].map((mayor) => (
                <div key={mayor.handle} className="dark-glass-panel rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold" style={{ color: mayor.color }}>
                        {mayor.role} · {mayor.handle}
                      </span>
                      <h2 className="font-display text-base font-bold text-white sm:text-lg">
                        {mayor.name}
                      </h2>
                    </div>
                    <div className="text-right font-mono-tabular">
                      <div className="text-xl font-bold" style={{ color: mayor.color }}>
                        {mayor.ppiLabel} PPI
                      </div>
                      <div className="text-[11px] text-slate-400">{mayor.erLabel} ER</div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2 border-t border-white/10 pt-3 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400">Seguidores</div>
                      <div className="font-mono-tabular font-bold text-white">
                        {mayor.followersLabel}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Posts (28d)</div>
                      <div className="font-mono-tabular font-bold text-[#00F0FF]">{mayor.posts}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Me gusta</div>
                      <div className="font-mono-tabular font-bold text-white">
                        {mayor.likesLabel}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Comentarios</div>
                      <div className="font-mono-tabular font-bold text-[#10B981]">
                        {mayor.commentsLabel}
                      </div>
                    </div>
                  </div>
                  <p className="mt-2.5 text-xs text-slate-300">{mayor.highlightNote}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SLIDE 4: TABLERO CONSOLIDADO INTERACTIVO (13 AUTORIDADES) */}
        {activeSlide === 4 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="dark-glass-panel pointer-events-auto rounded-2xl p-4 lg:col-span-8 xl:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(['all', 'Diputado/a', 'Senador', 'Alcalde/sa'] as const).map((tab) => {
                    const active = roleFilter === tab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setRoleFilter(tab)}
                        className={`min-h-[34px] rounded-lg px-2.5 text-xs font-semibold transition-colors ${
                          active
                            ? 'bg-[#F59E0B] text-[#060B19]'
                            : 'border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        {tab === 'all' ? 'Todos (13)' : tab}
                      </button>
                    );
                  })}
                </div>

                <div className="relative w-full sm:w-52">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filtrar autoridad..."
                    className="min-h-[34px] w-full rounded-lg border border-white/15 bg-white/[0.05] pr-2.5 pl-8 text-xs text-white placeholder:text-slate-500 focus:border-[#00F0FF] focus:outline-none"
                  />
                </div>
              </div>

              <div className="editorial-scroll mt-2.5 max-h-[275px] overflow-x-auto overflow-y-auto">
                <table className="w-full min-w-[600px] text-left text-xs">
                  <thead className="sticky top-0 bg-[#0B1326] text-[11px] text-slate-400">
                    <tr className="border-b border-white/10">
                      <th className="py-2 pr-2">
                        <button type="button" onClick={() => handleSort('rank')} className="inline-flex items-center gap-1 hover:text-white">
                          # <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="py-2 pr-3">Autoridad</th>
                      <th className="py-2 pr-2 text-right">
                        <button type="button" onClick={() => handleSort('followers')} className="inline-flex items-center gap-1 hover:text-white">
                          Seg. <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="py-2 pr-2 text-right">
                        <button type="button" onClick={() => handleSort('posts')} className="inline-flex items-center gap-1 hover:text-white">
                          Posts <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="py-2 pr-2 text-right">
                        <button type="button" onClick={() => handleSort('likes')} className="inline-flex items-center gap-1 hover:text-white">
                          Likes <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="py-2 pr-2 text-right">
                        <button type="button" onClick={() => handleSort('comments')} className="inline-flex items-center gap-1 hover:text-white">
                          Com. <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="py-2 pr-2 text-right">
                        <button type="button" onClick={() => handleSort('erPct')} className="inline-flex items-center gap-1 hover:text-white">
                          ER <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="py-2 text-right">
                        <button type="button" onClick={() => handleSort('ppiPct')} className="inline-flex items-center gap-1 hover:text-white">
                          PPI <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/8">
                    {sortedAuthorities.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                          <p>No se encontraron autoridades con los filtros actuales.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setRoleFilter('all');
                              setQuery('');
                            }}
                            className="mt-2 inline-flex min-h-[34px] items-center rounded-lg border border-[#F59E0B]/40 bg-[#F59E0B]/12 px-3 text-xs font-semibold text-[#F59E0B] hover:bg-[#F59E0B] hover:text-[#060B19]"
                          >
                            Restablecer filtros
                          </button>
                        </td>
                      </tr>
                    ) : (
                      sortedAuthorities.map((a) => {
                        const isSelected = selectedRank === a.rank;
                        const active = isSelected || highlightedRank === a.rank;
                        return (
                          <tr
                            key={a.handle}
                            data-ed3-rank={a.rank}
                            onMouseEnter={() => onHoverRank(a.rank)}
                            onMouseLeave={() => onHoverRank(null)}
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              onSelectRank(isSelected ? null : a.rank, {
                                x: rect.right - 12,
                                y: rect.top + rect.height / 2,
                              });
                            }}
                            className={`cursor-pointer transition-colors ${
                              active ? 'bg-[#F59E0B]/18' : 'hover:bg-white/[0.05]'
                            }`}
                          >
                            <td className="font-mono-tabular py-2 pr-2 font-bold" style={{ color: a.color }}>
                              {String(a.rank).padStart(2, '0')}
                            </td>
                            <td className="py-2 pr-3">
                              <div className="font-semibold text-white">{a.name}</div>
                              <div className="text-[10px] text-slate-400">{a.handle}</div>
                            </td>
                            <td className="font-mono-tabular py-2 pr-2 text-right text-slate-300">
                              {a.followersLabel}
                            </td>
                            <td className="font-mono-tabular py-2 pr-2 text-right text-slate-300">
                              {a.posts}
                            </td>
                            <td className="font-mono-tabular py-2 pr-2 text-right font-bold text-white">
                              {a.likesLabel}
                            </td>
                            <td className="font-mono-tabular py-2 pr-2 text-right text-slate-300">
                              {a.commentsLabel}
                            </td>
                            <td className="font-mono-tabular py-2 pr-2 text-right font-semibold text-[#00F0FF]">
                              {a.erLabel}
                            </td>
                            <td className="font-mono-tabular py-2 text-right font-bold text-[#10B981]">
                              {a.ppiLabel}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="pointer-events-auto lg:col-span-4 lg:flex lg:flex-col lg:justify-end xl:col-span-5">
              <HistoricalErTimeSeriesCard authority={timeSeriesAuthority} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
