import React, { useMemo, useRef, useState } from 'react';
import {
  ChevronRight,
  GitBranch,
  Hash,
  Layers,
  Maximize2,
  MessageSquareText,
  Network,
  RotateCcw,
  Search,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  EDICION3_TOP_POSTS,
  SEMANTIC_EDGES,
  SEMANTIC_NODES,
  SemanticCloudKind,
  SemanticNode,
} from '../data/edicion3WordNetwork';

interface Edicion3WordCloudNetworkProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PositionedNode extends SemanticNode {
  x: number;
  y: number;
  childCount: number;
  isExpanded: boolean;
}

const SVG_W = 1140;
const SVG_H = 740;
const CX = SVG_W / 2;
const CY = 386;

const normalizeToken = (raw: string) =>
  raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^#/, '');

export const Edicion3WordCloudNetwork: React.FC<Edicion3WordCloudNetworkProps> = ({
  isOpen,
  onClose,
}) => {
  // Progressive expansion: starts at Level 1 (cores), user opens branches interactively
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(['root-ecosistema']));
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3 | 'custom'>(1);
  const [cloudFilter, setCloudFilter] = useState<'both' | 'palabra' | 'hashtag'>('both');
  const [selectedId, setSelectedId] = useState<string>('root-ecosistema');
  const [query, setQuery] = useState('');

  // Interactive zoom & pan state for inspecting dense Tier-3 branches cleanly
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    origPanX: number;
    origPanY: number;
    moved: boolean;
  }>({ active: false, startX: 0, startY: 0, origPanX: 0, origPanY: 0, moved: false });

  const childrenByParent = useMemo(() => {
    const map = new Map<string, SemanticNode[]>();
    for (const node of SEMANTIC_NODES) {
      for (const pid of node.parentIds) {
        const arr = map.get(pid) ?? [];
        arr.push(node);
        map.set(pid, arr);
      }
    }
    return map;
  }, []);

  const visibleNodes = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = new Set<string>(['root-ecosistema']);

    if (q) {
      const byId = new Map(SEMANTIC_NODES.map((n) => [n.id, n]));
      const revealAncestors = (id: string) => {
        visible.add(id);
        const node = byId.get(id);
        if (!node) return;
        node.parentIds.forEach((pid) => revealAncestors(pid));
      };
      SEMANTIC_NODES.forEach((n) => {
        if (
          n.label.toLowerCase().includes(q) ||
          n.cluster.toLowerCase().includes(q) ||
          (n.relatedPostHint?.toLowerCase().includes(q) ?? false)
        ) {
          revealAncestors(n.id);
        }
      });
    } else {
      expandedIds.forEach((pid) => {
        const kids = childrenByParent.get(pid) ?? [];
        kids.forEach((k) => visible.add(k.id));
      });
    }

    return SEMANTIC_NODES.filter((n) => {
      if (!visible.has(n.id)) return false;
      if (n.kind === 'hub') return true;
      if (cloudFilter !== 'both' && n.kind !== cloudFilter) return false;
      return true;
    });
  }, [childrenByParent, cloudFilter, expandedIds, query]);

  const positionedNodes: PositionedNode[] = useMemo(() => {
    const t1 = visibleNodes.filter((n) => n.tier === 1 && n.kind !== 'hub');
    const t2 = visibleNodes.filter((n) => n.tier === 2);
    const t3 = visibleNodes.filter((n) => n.tier === 3);

    const placeArc = (
      items: SemanticNode[],
      radiusX: number,
      radiusY: number,
      splitBySide: boolean
    ): Map<string, { x: number; y: number; homeX: number; homeY: number }> => {
      const coords = new Map<string, { x: number; y: number; homeX: number; homeY: number }>();
      if (!splitBySide) {
        items.forEach((item, idx) => {
          const angle = (idx / Math.max(1, items.length)) * Math.PI * 2 - Math.PI / 2;
          const x = CX + Math.cos(angle) * radiusX;
          const y = CY + Math.sin(angle) * radiusY;
          coords.set(item.id, { x, y, homeX: x, homeY: y });
        });
        return coords;
      }

      const words = items.filter((n) => n.kind === 'palabra');
      const tags = items.filter((n) => n.kind === 'hashtag');
      const span = Math.PI * 0.78;

      words.forEach((item, idx) => {
        const t = words.length === 1 ? 0.5 : idx / (words.length - 1);
        const angle = Math.PI - span / 2 + t * span; // Left hemisphere
        const x = CX + Math.cos(angle) * radiusX;
        const y = CY + Math.sin(angle) * radiusY;
        coords.set(item.id, { x, y, homeX: x, homeY: y });
      });

      tags.forEach((item, idx) => {
        const t = tags.length === 1 ? 0.5 : idx / (tags.length - 1);
        const angle = -span / 2 + t * span; // Right hemisphere
        const x = CX + Math.cos(angle) * radiusX;
        const y = CY + Math.sin(angle) * radiusY;
        coords.set(item.id, { x, y, homeX: x, homeY: y });
      });

      return coords;
    };

    const splitSides = cloudFilter === 'both';
    const c1 = placeArc(t1, 178, 128, splitSides);
    const c2 = placeArc(t2, 332, 212, splitSides);
    const c3 = placeArc(t3, 476, 268, splitSides);

    interface SimNode {
      node: SemanticNode;
      x: number;
      y: number;
      homeX: number;
      homeY: number;
      halfW: number;
      halfH: number;
      pinned: boolean;
    }

    const simNodes: SimNode[] = visibleNodes.map((n) => {
      if (n.kind === 'hub') {
        return {
          node: n,
          x: CX,
          y: CY,
          homeX: CX,
          homeY: CY,
          halfW: 108,
          halfH: 42,
          pinned: true,
        };
      }
      const p = c1.get(n.id) ?? c2.get(n.id) ?? c3.get(n.id) ?? {
        x: CX,
        y: CY,
        homeX: CX,
        homeY: CY,
      };
      const charW = n.tier === 1 ? 7.3 : n.tier === 2 ? 6.5 : 5.9;
      const halfW = Math.max(40, (n.label.length * charW) / 2 + 12);
      const halfH = n.tier === 1 ? 26 : n.tier === 2 ? 21 : 18;
      return {
        node: n,
        x: p.x,
        y: p.y,
        homeX: p.homeX,
        homeY: p.homeY,
        halfW,
        halfH,
        pinned: false,
      };
    });

    // Deterministic bounding-box relaxation pass to prevent label/node collisions
    for (let iter = 0; iter < 48; iter++) {
      for (let i = 0; i < simNodes.length; i++) {
        const a = simNodes[i];
        if (!a.pinned) {
          // Gentle anchor spring back toward home orbital coordinates
          a.x += (a.homeX - a.x) * 0.08;
          a.y += (a.homeY - a.y) * 0.08;
        }
        for (let j = i + 1; j < simNodes.length; j++) {
          const b = simNodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const reqX = a.halfW + b.halfW + 10;
          const reqY = a.halfH + b.halfH + 8;

          if (Math.abs(dx) < reqX && Math.abs(dy) < reqY) {
            const overlapX = reqX - Math.abs(dx);
            const overlapY = reqY - Math.abs(dy);

            // Resolve along axis of smallest penetration for natural spacing
            if (overlapY <= overlapX) {
              const pushY = overlapY * 0.45 * (dy >= 0 ? 1 : -1 || (i % 2 === 0 ? 1 : -1));
              if (!a.pinned) a.y -= b.pinned ? pushY * 1.4 : pushY * 0.5;
              if (!b.pinned) b.y += a.pinned ? pushY * 1.4 : pushY * 0.5;
            } else {
              const pushX = overlapX * 0.42 * (dx >= 0 ? 1 : -1 || (i % 2 === 0 ? 1 : -1));
              if (!a.pinned) a.x -= b.pinned ? pushX * 1.4 : pushX * 0.5;
              if (!b.pinned) b.x += a.pinned ? pushX * 1.4 : pushX * 0.5;
            }
          }
        }
      }

      // Enforce safe margins away from hemisphere headers (top >= 88) & canvas bounds
      for (const s of simNodes) {
        if (s.pinned) continue;
        s.x = Math.max(82 + s.halfW * 0.45, Math.min(SVG_W - 82 - s.halfW * 0.45, s.x));
        s.y = Math.max(92, Math.min(SVG_H - 46, s.y));
      }
    }

    return simNodes.map((s) => ({
      ...s.node,
      x: s.x,
      y: s.y,
      childCount: (childrenByParent.get(s.node.id) ?? []).length,
      isExpanded: expandedIds.has(s.node.id),
    }));
  }, [childrenByParent, cloudFilter, expandedIds, visibleNodes]);

  const posMap = useMemo(() => new Map(positionedNodes.map((n) => [n.id, n])), [positionedNodes]);

  const visibleEdges = useMemo(
    () => SEMANTIC_EDGES.filter((e) => posMap.has(e.source) && posMap.has(e.target)),
    [posMap]
  );

  const selectedNode = useMemo(
    () => SEMANTIC_NODES.find((n) => n.id === selectedId) ?? SEMANTIC_NODES[0],
    [selectedId]
  );

  const selectedConnectedNodes = useMemo(() => {
    const connectedIds = new Set<string>();
    SEMANTIC_EDGES.forEach((e) => {
      if (e.source === selectedNode.id) connectedIds.add(e.target);
      if (e.target === selectedNode.id) connectedIds.add(e.source);
    });
    return SEMANTIC_NODES.filter((n) => connectedIds.has(n.id));
  }, [selectedNode]);

  // Rank & match top viral posts contextually to the selected node or its connected neighbors
  const contextualViralPosts = useMemo(() => {
    if (selectedNode.id === 'root-ecosistema') {
      return { isContextual: false, posts: EDICION3_TOP_POSTS.slice(0, 6) };
    }
    const tokens = new Set<string>();
    tokens.add(normalizeToken(selectedNode.label));
    selectedNode.cluster
      .split(/[\s,&]+/)
      .filter((t) => t.length > 3)
      .forEach((t) => tokens.add(normalizeToken(t)));
    selectedConnectedNodes.forEach((cn) => {
      if (cn.kind !== 'hub') tokens.add(normalizeToken(cn.label));
    });

    const scored = EDICION3_TOP_POSTS.map((post) => {
      let score = 0;
      const excerptNorm = normalizeToken(post.excerpt);
      tokens.forEach((tok) => {
        if (!tok || tok.length < 3) return;
        if (post.keywords.includes(tok)) score += 3;
        else if (excerptNorm.includes(tok)) score += 2;
      });
      return { post, score };
    })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
      return { isContextual: false, posts: EDICION3_TOP_POSTS.slice(0, 5) };
    }
    return { isContextual: true, posts: scored.slice(0, 6).map((s) => s.post) };
  }, [selectedConnectedNodes, selectedNode]);

  if (!isOpen) return null;

  const toggleExpandNode = (nodeId: string) => {
    setSelectedId(nodeId);
    const hasKids = (childrenByParent.get(nodeId) ?? []).length > 0;
    if (!hasKids) return;
    setActiveLevel('custom');
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId) && nodeId !== 'root-ecosistema') {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandToTier = (level: 1 | 2 | 3) => {
    const next = new Set<string>(['root-ecosistema']);
    if (level >= 2) {
      SEMANTIC_NODES.filter((n) => n.tier === 1).forEach((n) => next.add(n.id));
    }
    if (level >= 3) {
      SEMANTIC_NODES.filter((n) => n.tier <= 2).forEach((n) => next.add(n.id));
    }
    setActiveLevel(level);
    setExpandedIds(next);
  };

  const resetViewportTransform = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const getNodeColor = (kind: SemanticCloudKind, tier: number) => {
    if (kind === 'hub') return '#F59E0B';
    if (kind === 'palabra') return tier === 1 ? '#00F0FF' : tier === 2 ? '#38BDF8' : '#7DD3FC';
    return tier === 1 ? '#FF2E93' : tier === 2 ? '#A855F7' : '#C084FC';
  };

  const wordCountActive = visibleNodes.filter((n) => n.kind === 'palabra').length;
  const tagCountActive = visibleNodes.filter((n) => n.kind === 'hashtag').length;

  return (
    <div
      data-html2canvas-ignore="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Red Semántica Interconectada de Palabras y Hashtags"
        onClick={(e) => e.stopPropagation()}
        className="dark-glass-panel flex h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#070D1B] text-white shadow-2xl"
      >
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-[#F59E0B] uppercase">
              <Network className="h-3.5 w-3.5 shrink-0" />
              <span>Red Semántica Interactiva · Ambas Nubes Integradas</span>
            </div>
            <h2 className="font-display mt-0.5 text-base font-bold text-white sm:text-lg">
              Del Núcleo Temático al Detalle Territorial ({visibleNodes.length} nodos ·{' '}
              <span className="text-[#38BDF8]">{wordCountActive} palabras</span> /{' '}
              <span className="text-[#FF2E93]">{tagCountActive} hashtags</span>)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Progressive Open Level Controls with explicit active indicator */}
            <div className="flex items-center gap-0.5 rounded-lg border border-white/15 bg-white/[0.04] p-1 text-[11px]">
              <button
                type="button"
                onClick={() => expandToTier(1)}
                className={`min-h-[34px] rounded-md px-2.5 font-semibold transition-colors whitespace-nowrap ${
                  activeLevel === 1
                    ? 'bg-white text-[#060B19]'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                Nivel 1 (Núcleos)
              </button>
              <button
                type="button"
                onClick={() => expandToTier(2)}
                className={`min-h-[34px] rounded-md px-2.5 font-semibold transition-colors whitespace-nowrap ${
                  activeLevel === 2
                    ? 'bg-[#00F0FF] text-[#060B19]'
                    : 'text-[#00F0FF] hover:bg-[#00F0FF]/15'
                }`}
              >
                Nivel 2 (Temas)
              </button>
              <button
                type="button"
                onClick={() => expandToTier(3)}
                className={`min-h-[34px] rounded-md px-2.5 font-semibold transition-colors whitespace-nowrap ${
                  activeLevel === 3
                    ? 'bg-[#F59E0B] text-[#060B19]'
                    : 'text-[#F59E0B] hover:bg-[#F59E0B]/15'
                }`}
              >
                Abrir Todo
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar red semántica"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Sub-Toolbar: Cloud Filters + Search */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/[0.02] px-4 py-2.5 sm:px-6">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {(
              [
                { id: 'both', label: 'Ambas Nubes Interconectadas', icon: GitBranch },
                { id: 'palabra', label: 'Solo Palabras', icon: MessageSquareText },
                { id: 'hashtag', label: 'Solo Hashtags', icon: Hash },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = cloudFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCloudFilter(tab.id)}
                  className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#00F0FF] text-[#060B19]'
                      : 'border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-52 sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar palabra o #hashtag..."
                className="min-h-[36px] w-full rounded-lg border border-white/15 bg-white/[0.05] py-1 pr-2.5 pl-8 text-xs text-white placeholder:text-slate-500 focus:border-[#00F0FF] focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCloudFilter('both');
                expandToTier(1);
                setSelectedId('root-ecosistema');
                resetViewportTransform();
              }}
              title="Reiniciar árbol y encuadre"
              className="flex min-h-[36px] items-center gap-1 rounded-lg border border-white/15 bg-white/[0.04] px-2.5 text-xs text-slate-300 hover:bg-white/10"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Main Split Workspace: Interactive Node Graph + Side Inspector */}
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-12">
          {/* Interactive SVG Network Graph Column */}
          <div className="flex min-h-[320px] flex-col bg-[#050A16] lg:col-span-8">
            <div
              className="relative flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
              onWheel={(e) => {
                e.preventDefault();
                const factor = e.deltaY < 0 ? 1.12 : 0.9;
                setZoom((prev) => Math.max(0.75, Math.min(2.4, Number((prev * factor).toFixed(2)))));
              }}
              onPointerDown={(e) => {
                if ((e.target as HTMLElement).closest('g[data-node]')) return;
                dragRef.current = {
                  active: true,
                  startX: e.clientX,
                  startY: e.clientY,
                  origPanX: pan.x,
                  origPanY: pan.y,
                  moved: false,
                };
              }}
              onPointerMove={(e) => {
                if (!dragRef.current.active) return;
                const dx = e.clientX - dragRef.current.startX;
                const dy = e.clientY - dragRef.current.startY;
                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
                setPan({
                  x: dragRef.current.origPanX + dx,
                  y: dragRef.current.origPanY + dy,
                });
              }}
              onPointerUp={() => {
                dragRef.current.active = false;
              }}
              onPointerLeave={() => {
                dragRef.current.active = false;
              }}
            >
              {/* Fixed Hemisphere Titles Strip outside scaled SVG nodes so headers NEVER overlap nodes */}
              {cloudFilter === 'both' && (
                <div className="pointer-events-none absolute top-2.5 right-4 left-4 z-10 flex items-center justify-between text-[11px] font-bold tracking-wider uppercase">
                  <span className="text-[#38BDF8]">Nube de Palabras (Frecuencia → Detalle)</span>
                  <span className="text-[#FF2E93]">Nube de Hashtags (Tracción → Territorio)</span>
                </div>
              )}

              {/* Zoom & Fit Floating Controls */}
              <div className="absolute right-3 bottom-3 z-10 flex items-center gap-1 rounded-xl border border-white/15 bg-[#070D1B]/90 p-1">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.4, Number((z + 0.2).toFixed(2))))}
                  title="Acercar grafo"
                  aria-label="Acercar grafo"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <span className="font-mono-tabular px-1.5 text-[11px] font-semibold text-slate-300">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.75, Number((z - 0.2).toFixed(2))))}
                  title="Alejar grafo"
                  aria-label="Alejar grafo"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                {(zoom !== 1 || pan.x !== 0 || pan.y !== 0) && (
                  <button
                    type="button"
                    onClick={resetViewportTransform}
                    title="Centrar vista"
                    aria-label="Centrar vista"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#00F0FF] transition-colors hover:bg-[#00F0FF]/15"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {query.trim() && visibleNodes.length <= 1 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                  <p className="text-sm font-medium text-slate-300">
                    No se encontraron palabras o hashtags para «{query.trim()}».
                  </p>
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="min-h-[38px] rounded-xl border border-[#00F0FF]/40 bg-[#00F0FF]/12 px-4 text-xs font-semibold text-[#00F0FF] hover:bg-[#00F0FF] hover:text-[#060B19]"
                  >
                    Limpiar búsqueda
                  </button>
                </div>
              ) : (
                <svg
                  viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                  className="h-full w-full select-none"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <g
                    transform={`translate(${CX + pan.x}, ${CY + pan.y}) scale(${zoom}) translate(${-CX}, ${-CY})`}
                  >
                    {/* Concentric hierarchy guides */}
                    <ellipse
                      cx={CX}
                      cy={CY}
                      rx={178}
                      ry={128}
                      fill="none"
                      stroke="rgba(0, 240, 255, 0.11)"
                      strokeDasharray="4 6"
                    />
                    <ellipse
                      cx={CX}
                      cy={CY}
                      rx={332}
                      ry={212}
                      fill="none"
                      stroke="rgba(168, 85, 247, 0.11)"
                      strokeDasharray="4 6"
                    />
                    <ellipse
                      cx={CX}
                      cy={CY}
                      rx={476}
                      ry={268}
                      fill="none"
                      stroke="rgba(245, 158, 11, 0.1)"
                      strokeDasharray="4 6"
                    />

                    {/* Connection Edges */}
                    {visibleEdges.map((edge) => {
                      const s = posMap.get(edge.source);
                      const t = posMap.get(edge.target);
                      if (!s || !t) return null;
                      const isSelectedEdge =
                        selectedId === edge.source || selectedId === edge.target;
                      return (
                        <line
                          key={`${edge.source}-${edge.target}`}
                          x1={s.x}
                          y1={s.y}
                          x2={t.x}
                          y2={t.y}
                          stroke={
                            isSelectedEdge
                              ? '#F59E0B'
                              : edge.crossCloud
                                ? 'rgba(245, 158, 11, 0.42)'
                                : 'rgba(148, 163, 184, 0.22)'
                          }
                          strokeWidth={isSelectedEdge ? 2.2 : edge.crossCloud ? 1.45 : 0.95}
                          strokeDasharray={edge.crossCloud ? '5 4' : undefined}
                        />
                      );
                    })}

                    {/* Interactive Nodes */}
                    {positionedNodes.map((node) => {
                      const isSelected = node.id === selectedId;
                      const col = getNodeColor(node.kind, node.tier);
                      const r =
                        node.kind === 'hub'
                          ? 23
                          : node.tier === 1
                            ? 15.5
                            : node.tier === 2
                              ? 10.5
                              : 7.5;
                      const fontSize =
                        node.kind === 'hub'
                          ? 12.5
                          : node.tier === 1
                            ? 12
                            : node.tier === 2
                              ? 10.8
                              : 9.8;

                      return (
                        <g
                          key={node.id}
                          data-node={node.id}
                          transform={`translate(${node.x}, ${node.y})`}
                          onClick={() => toggleExpandNode(node.id)}
                          className="cursor-pointer"
                        >
                          {(isSelected || node.isExpanded) && (
                            <circle
                              r={r + 5.5}
                              fill="none"
                              stroke={isSelected ? '#FFFFFF' : col}
                              strokeOpacity={isSelected ? 0.88 : 0.38}
                              strokeWidth={isSelected ? 2 : 1.4}
                            />
                          )}
                          <circle
                            r={r}
                            fill={col}
                            fillOpacity={node.tier === 1 ? 0.94 : 0.85}
                            stroke="#050A16"
                            strokeWidth={2}
                          />
                          {node.childCount > 0 && (
                            <text
                              textAnchor="middle"
                              dy="0.34em"
                              fill="#060B19"
                              fontSize={node.tier === 1 ? 10 : 8.8}
                              fontWeight="800"
                            >
                              {node.isExpanded ? '−' : `+${node.childCount}`}
                            </text>
                          )}
                          <text
                            y={r + 14}
                            textAnchor="middle"
                            fill={isSelected ? '#FFFFFF' : '#E2E8F0'}
                            fontSize={fontSize}
                            fontWeight={node.tier === 1 || isSelected ? '700' : '500'}
                            stroke="#050A16"
                            strokeWidth={4}
                            strokeLinejoin="round"
                            style={{ paintOrder: 'stroke' }}
                          >
                            {node.label}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              )}
            </div>

            {/* Dedicated Quiet Footer Bar below SVG so legend never collides with nodes */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-white/[0.02] px-4 py-2 text-[11px] text-slate-400">
              <span>
                Toca cualquier nodo con <strong className="text-slate-200">+N</strong> para abrir o
                contraer su subnube · Rueda/arrastre para hacer zoom
              </span>
              <span className="font-mono-tabular text-[#F59E0B]">
                Línea dorada discontinua = vínculo cruzado Palabra ↔ Hashtag
              </span>
            </div>
          </div>

          {/* Right Side Node Inspector & Matched Viral Posts */}
          <div className="editorial-scroll flex min-h-0 flex-col gap-4 overflow-y-auto border-t border-white/10 p-4 lg:col-span-4 lg:border-t-0 lg:border-l">
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[#00F0FF]">
                  {selectedNode.kind === 'hub'
                    ? 'Núcleo Central'
                    : selectedNode.kind === 'palabra'
                      ? `Palabra · Nivel ${selectedNode.tier}`
                      : `Hashtag · Nivel ${selectedNode.tier}`}
                </span>
                <span>{selectedNode.cluster}</span>
              </div>
              <h3 className="font-display mt-1 text-xl font-bold text-white">
                {selectedNode.label}
              </h3>

              <div className="mt-3 grid grid-cols-2 gap-2 border-y border-white/10 py-2.5 text-xs">
                <div>
                  <div className="text-[11px] text-slate-400">Peso / Mención</div>
                  <div className="font-mono-tabular text-base font-bold text-[#F59E0B]">
                    {selectedNode.importance}/100
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Tracción ER</div>
                  <div className="font-mono-tabular text-base font-bold text-[#10B981]">
                    {selectedNode.erScore}/100
                  </div>
                </div>
              </div>

              {selectedNode.relatedPostHint && (
                <p className="mt-2.5 text-xs leading-relaxed text-slate-300">
                  {selectedNode.relatedPostHint}
                </p>
              )}
            </div>

            {/* Connected Nodes List */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <span className="inline-flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-[#00F0FF]" />
                  Nodos Conectados ({selectedConnectedNodes.length})
                </span>
                {(childrenByParent.get(selectedNode.id) ?? []).length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleExpandNode(selectedNode.id)}
                    className="text-[11px] font-semibold text-[#F59E0B] hover:underline"
                  >
                    {expandedIds.has(selectedNode.id) ? 'Contraer rama' : 'Abrir subnube'}
                  </button>
                )}
              </div>

              <div className="mt-2 space-y-1">
                {selectedConnectedNodes.map((cn) => (
                  <button
                    key={cn.id}
                    type="button"
                    onClick={() => toggleExpandNode(cn.id)}
                    className="flex w-full items-center justify-between rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-2 text-left text-xs transition-colors hover:bg-white/[0.08]"
                  >
                    <span className="flex items-center gap-2 font-medium text-white">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: getNodeColor(cn.kind, cn.tier) }}
                      />
                      <span className="truncate">{cn.label}</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-mono-tabular text-[11px] text-slate-400 shrink-0">
                      <span>N{cn.tier}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Contextual Verified Viral Posts */}
            <div className="border-t border-white/10 pt-3">
              <div className="flex items-center justify-between gap-2 text-xs font-semibold text-white">
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#F59E0B]" />
                  <span>
                    {contextualViralPosts.isContextual
                      ? 'Publicaciones Virales Relacionadas'
                      : 'Top Vídeos / Imágenes (28d)'}
                  </span>
                </span>
              </div>
              <div className="mt-2 space-y-2">
                {contextualViralPosts.posts.map((p) => (
                  <div
                    key={`${p.format}-${p.rank}`}
                    className="border-b border-white/8 pb-2 text-xs last:border-b-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#00F0FF]">{p.handle}</span>
                      <span className="font-mono-tabular font-bold text-[#10B981] shrink-0">
                        {p.erLabel} ER · {p.format === 'video' ? 'Video' : 'Imagen'}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-300">{p.excerpt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
