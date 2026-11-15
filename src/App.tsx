import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Cpu,
  Eye,
  EyeOff,
  FileDown,
  Orbit,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { BenchmarkOverlays } from './components/BenchmarkOverlays';
import { BenchmarkSceneCanvas } from './components/BenchmarkSceneCanvas';
import { ExportMode, ExportReportModal } from './components/ExportReportModal';
import { Scene3DCanvas, Scene3DHandle } from './components/Scene3DCanvas';
import { SlideOverlays } from './components/SlideOverlays';
import { BENCHMARK_CHAPTERS } from './data/benchmarkData';
import { SLIDES } from './data/coquimboData';
import { ConurbanoDuelMode } from './three/benchmarkBuilders';
import {
  exportCurrentSlidePdf,
  exportCurrentSlidePng,
  exportFullPresentationPdf,
} from './utils/exportReport';

type ReportType = 'ecosistema' | 'benchmark';

function resolveInitialReportState(): {
  report: ReportType;
  ecoSlide: number;
  benchChapter: number;
} {
  if (typeof window === 'undefined') {
    return { report: 'ecosistema', ecoSlide: 0, benchChapter: 0 };
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const repParam = params.get('reporte');
    const isBench = repParam === 'benchmark';

    let ecoSlide = 0;
    const laminaParam = params.get('lamina') || params.get('slide');
    if (laminaParam) {
      const idx = SLIDES.findIndex((s) => s.slug === laminaParam.toLowerCase());
      if (idx >= 0) ecoSlide = idx;
      else if (Number.isInteger(Number(laminaParam))) {
        const n = Number(laminaParam);
        if (n >= 1 && n <= SLIDES.length) ecoSlide = n - 1;
      }
    }

    let benchChapter = 0;
    const capParam = params.get('capitulo');
    if (capParam) {
      const idx = BENCHMARK_CHAPTERS.findIndex((c) => c.slug === capParam.toLowerCase());
      if (idx >= 0) benchChapter = idx;
      else if (Number.isInteger(Number(capParam))) {
        const n = Number(capParam);
        if (n >= 1 && n <= BENCHMARK_CHAPTERS.length) benchChapter = n - 1;
      }
    }

    return {
      report: isBench ? 'benchmark' : 'ecosistema',
      ecoSlide,
      benchChapter,
    };
  } catch {
    return { report: 'ecosistema', ecoSlide: 0, benchChapter: 0 };
  }
}

export default function App() {
  const initial = resolveInitialReportState();

  const [activeReport, setActiveReport] = useState<ReportType>(initial.report);
  const [activeSlide, setActiveSlide] = useState<number>(initial.ecoSlide);
  const [activeBenchChapter, setActiveBenchChapter] = useState<number>(initial.benchChapter);
  const [duelMode, setDuelMode] = useState<ConurbanoDuelMode>('totals');
  const [autoPresent, setAutoPresent] = useState<boolean>(false);

  const [highlightedRank, setHighlightedRank] = useState<number | null>(null);
  const [freeOrbitMode, setFreeOrbitMode] = useState<boolean>(false);
  const [hudCollapsed, setHudCollapsed] = useState<boolean>(false);
  const [resetCameraNonce, setResetCameraNonce] = useState<number>(0);

  // Static export & share modal state
  const [exportOpen, setExportOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<{
    current: number;
    total: number;
    title: string;
  } | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const captureStageRef = useRef<HTMLDivElement | null>(null);
  const ecoSceneRef = useRef<Scene3DHandle | null>(null);
  const benchSceneRef = useRef<Scene3DHandle | null>(null);

  const isBenchmark = activeReport === 'benchmark';

  // Auto-advance chapters gently in Benchmark Auto Presentation mode
  useEffect(() => {
    if (!isBenchmark || !autoPresent || isExporting) return;
    const timer = window.setInterval(() => {
      setActiveBenchChapter((prev) => (prev + 1) % BENCHMARK_CHAPTERS.length);
      setHighlightedRank(null);
    }, 12000);
    return () => window.clearInterval(timer);
  }, [isBenchmark, autoPresent, isExporting]);

  // Synchronize URL query parameters cleanly for reporte.vecinoslaserena.cl
  useEffect(() => {
    if (typeof window === 'undefined' || isExporting) return;
    try {
      const url = new URL(window.location.href);
      if (isBenchmark) {
        url.searchParams.set('reporte', 'benchmark');
        url.searchParams.delete('lamina');
        const capSlug = BENCHMARK_CHAPTERS[activeBenchChapter]?.slug;
        if (capSlug) url.searchParams.set('capitulo', capSlug);
      } else {
        url.searchParams.delete('reporte');
        url.searchParams.delete('capitulo');
        const slug = SLIDES[activeSlide]?.slug;
        if (slug) {
          if (activeSlide === 0) url.searchParams.delete('lamina');
          else url.searchParams.set('lamina', slug);
        }
      }
      window.history.replaceState(null, '', url.toString());
    } catch {
      // Safe fallback in restricted iframe contexts
    }
  }, [activeReport, activeSlide, activeBenchChapter, isBenchmark, isExporting]);

  const switchReport = useCallback((target: ReportType) => {
    setActiveReport(target);
    setHighlightedRank(null);
    setFreeOrbitMode(false);
    setAutoPresent(false);
    setResetCameraNonce((n) => n + 1);
  }, []);

  const goToIndex = useCallback(
    (index: number) => {
      setHighlightedRank(null);
      if (isBenchmark) {
        setActiveBenchChapter(Math.max(0, Math.min(BENCHMARK_CHAPTERS.length - 1, index)));
      } else {
        setActiveSlide(Math.max(0, Math.min(SLIDES.length - 1, index)));
      }
    },
    [isBenchmark]
  );

  const nextItem = useCallback(() => {
    setHighlightedRank(null);
    if (isBenchmark) {
      setActiveBenchChapter((prev) => (prev + 1) % BENCHMARK_CHAPTERS.length);
    } else {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }
  }, [isBenchmark]);

  const prevItem = useCallback(() => {
    setHighlightedRank(null);
    if (isBenchmark) {
      setActiveBenchChapter(
        (prev) => (prev - 1 + BENCHMARK_CHAPTERS.length) % BENCHMARK_CHAPTERS.length
      );
    } else {
      setActiveSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
    }
  }, [isBenchmark]);

  const handleResetCamera = useCallback(() => {
    setFreeOrbitMode(false);
    setAutoPresent(false);
    setResetCameraNonce((n) => n + 1);
  }, []);

  const handleExport = useCallback(
    async (mode: ExportMode) => {
      const stageEl = captureStageRef.current;
      const sceneHandle = isBenchmark ? benchSceneRef.current : ecoSceneRef.current;
      if (!stageEl || !sceneHandle) return;

      setExportError(null);
      setIsExporting(true);
      setExportProgress(null);

      const previousIdx = isBenchmark ? activeBenchChapter : activeSlide;
      const previousHud = hudCollapsed;
      const currentMeta = isBenchmark
        ? BENCHMARK_CHAPTERS[activeBenchChapter]
        : SLIDES[activeSlide];

      try {
        if (mode === 'current-png') {
          await exportCurrentSlidePng(
            stageEl,
            currentMeta,
            () => sceneHandle.renderCurrentFrame(),
            {
              theme: isBenchmark ? 'dark' : 'light',
              prefix: isBenchmark ? 'Coquimbo_Benchmark_Cap' : 'Coquimbo_Digital_Lamina',
            }
          );
        } else if (mode === 'current-pdf') {
          await exportCurrentSlidePdf(
            stageEl,
            currentMeta,
            () => sceneHandle.renderCurrentFrame(),
            {
              theme: isBenchmark ? 'dark' : 'light',
              totalCount: isBenchmark ? BENCHMARK_CHAPTERS.length : SLIDES.length,
              prefix: isBenchmark ? 'Coquimbo_Benchmark_Cap' : 'Coquimbo_Digital_Lamina',
              reportSubtitle: isBenchmark
                ? 'Coquimbo Digital Benchmark 3D (28 días · 26 cuentas)'
                : 'Coquimbo Digital 2026 (14 oct – 14 nov)',
              unitWord: isBenchmark ? 'Capítulo' : 'Lámina',
            }
          );
        } else {
          if (previousHud) setHudCollapsed(false);
          await exportFullPresentationPdf({
            stageEl,
            slides: isBenchmark ? BENCHMARK_CHAPTERS : SLIDES,
            theme: isBenchmark ? 'dark' : 'light',
            filename: isBenchmark
              ? 'Reporte_Coquimbo_Benchmark_3D.pdf'
              : 'Reporte_Coquimbo_Digital_2026.pdf',
            reportSubtitle: isBenchmark
              ? 'Coquimbo Digital Benchmark 3D (28 días · 26 cuentas)'
              : 'Coquimbo Digital 2026 (14 oct – 14 nov)',
            unitWord: isBenchmark ? 'Capítulo' : 'Lámina',
            includeAppendix: !isBenchmark,
            prepareSlide3D: (idx) => sceneHandle.prepareSlideForCapture(idx),
            setActiveSlideForCapture: (idx) => {
              setHighlightedRank(null);
              if (isBenchmark) setActiveBenchChapter(idx);
              else setActiveSlide(idx);
            },
            onProgress: (current, total, title) => {
              setExportProgress({ current, total, title });
            },
          });
        }
        setExportOpen(false);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'No se pudo completar la captura del reporte.';
        setExportError(message);
      } finally {
        if (mode === 'full-pdf') {
          if (isBenchmark) setActiveBenchChapter(previousIdx);
          else setActiveSlide(previousIdx);
          setHudCollapsed(previousHud);
          sceneHandle.prepareSlideForCapture(previousIdx);
        }
        setIsExporting(false);
        setExportProgress(null);
      }
    },
    [activeBenchChapter, activeSlide, hudCollapsed, isBenchmark]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isExporting) return;
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;
      if (isInput) return;

      const maxNum = isBenchmark ? BENCHMARK_CHAPTERS.length : SLIDES.length;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        nextItem();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevItem();
      } else if (e.key >= '1' && e.key <= String(maxNum)) {
        e.preventDefault();
        goToIndex(Number(e.key) - 1);
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setHudCollapsed((prev) => !prev);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleResetCamera();
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        setExportOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToIndex, handleResetCamera, isBenchmark, isExporting, nextItem, prevItem]);

  const itemsList = isBenchmark ? BENCHMARK_CHAPTERS : SLIDES;
  const currentIdx = isBenchmark ? activeBenchChapter : activeSlide;

  return (
    <main
      className={`relative h-screen w-screen overflow-hidden ${
        isBenchmark ? 'bg-[#060B19] text-white' : 'bg-[#F4F7FB] text-[#0F172A]'
      }`}
    >
      {/* Capturable Stage: Active 3D Viewport + Active Overlays */}
      <div ref={captureStageRef} className="relative h-full w-full">
        {isBenchmark ? (
          <>
            <BenchmarkSceneCanvas
              ref={benchSceneRef}
              activeChapter={activeBenchChapter}
              duelMode={duelMode}
              highlightedRank={highlightedRank}
              resetCameraNonce={resetCameraNonce}
              freeOrbitMode={freeOrbitMode}
              autoPresent={autoPresent}
              onHoverRank={setHighlightedRank}
            />
            <BenchmarkOverlays
              activeChapter={activeBenchChapter}
              duelMode={duelMode}
              onDuelModeChange={setDuelMode}
              highlightedRank={highlightedRank}
              onHoverRank={setHighlightedRank}
              hudCollapsed={hudCollapsed}
            />
          </>
        ) : (
          <>
            <Scene3DCanvas
              ref={ecoSceneRef}
              activeSlide={activeSlide}
              highlightedRank={highlightedRank}
              resetCameraNonce={resetCameraNonce}
              freeOrbitMode={freeOrbitMode}
              onHoverRank={setHighlightedRank}
            />
            <SlideOverlays
              activeSlide={activeSlide}
              highlightedRank={highlightedRank}
              onHoverRank={setHighlightedRank}
              hudCollapsed={hudCollapsed}
              instantNumbers={isExporting}
            />
          </>
        )}
      </div>

      {/* Top Navigation Bar */}
      <header
        data-html2canvas-ignore="true"
        className={`fixed top-0 right-0 left-0 z-30 flex h-14 items-center justify-between gap-4 border-t-0 border-r-0 border-l-0 px-5 lg:px-9 ${
          isBenchmark ? 'dark-glass-panel border-b border-white/10' : 'glass-panel'
        }`}
      >
        {/* Zone 1: Wordmark */}
        <button
          type="button"
          onClick={() => goToIndex(0)}
          className={`font-display text-base font-bold tracking-tight whitespace-nowrap shrink-0 transition-colors ${
            isBenchmark
              ? 'text-white hover:text-[#00F0FF]'
              : 'text-[#0F172A] hover:text-[#0284C7]'
          }`}
        >
          {isBenchmark ? 'Coquimbo Benchmark 3D' : 'Coquimbo Digital 2026'}
        </button>

        {/* Zone 2: Navigation Links */}
        <nav
          aria-label="Navegación de secciones"
          className="hidden lg:flex items-center gap-4 text-xs font-medium"
        >
          {itemsList.map((item) => {
            const isActive = item.id === currentIdx;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => goToIndex(item.id)}
                className={`relative py-1 transition-colors whitespace-nowrap shrink-0 ${
                  isBenchmark
                    ? isActive
                      ? 'font-semibold text-[#00F0FF]'
                      : 'text-slate-400 hover:text-white'
                    : isActive
                      ? 'font-semibold text-[#0284C7]'
                      : 'text-slate-600 hover:text-[#0F172A]'
                }`}
              >
                {item.shortLabel}
                {isActive && (
                  <span
                    className={`absolute right-0 bottom-0 left-0 h-0.5 rounded-full ${
                      isBenchmark ? 'bg-[#00F0FF]' : 'bg-[#0284C7]'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Report Complement Switcher + Interactive Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Complement Switcher Button */}
          <button
            type="button"
            onClick={() => switchReport(isBenchmark ? 'ecosistema' : 'benchmark')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              isBenchmark
                ? 'border border-white/15 bg-white/10 text-white hover:bg-white/20'
                : 'border border-[#00F0FF]/40 bg-[#060B19] text-[#00F0FF] shadow-sm hover:bg-[#0F172A]'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>
              {isBenchmark ? 'Ecosistema Regional (9L)' : 'Benchmark 3D (28d)'}
            </span>
          </button>

          {isBenchmark && (
            <button
              type="button"
              onClick={() => setAutoPresent((prev) => !prev)}
              className={`hidden sm:inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                autoPresent
                  ? 'bg-[#FF2E93] text-white'
                  : 'border border-white/15 bg-slate-800/80 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {autoPresent ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {autoPresent ? 'Auto Activo' : 'Presentación Auto'}
            </button>
          )}

          <button
            type="button"
            onClick={() => setFreeOrbitMode((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              isBenchmark
                ? freeOrbitMode
                  ? 'bg-[#00F0FF] text-[#060B19]'
                  : 'border border-[#00F0FF]/35 bg-[#00F0FF]/12 text-[#00F0FF] hover:bg-[#00F0FF]/20'
                : freeOrbitMode
                  ? 'bg-[#0284C7] text-white'
                  : 'bg-[#0F172A] text-white hover:bg-slate-800'
            }`}
          >
            <Orbit className="h-3.5 w-3.5" />
            {freeOrbitMode ? 'Órbita Libre Activa' : isBenchmark ? 'Órbita Libre' : 'Explorar 3D'}
          </button>
        </div>
      </header>

      {/* Unified Floating Bottom Presentation Dock */}
      <div
        data-html2canvas-ignore="true"
        className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2"
      >
        <div
          className={`flex items-center gap-1.5 rounded-2xl px-2.5 py-1.5 ${
            isBenchmark ? 'dark-glass-panel' : 'glass-panel'
          }`}
        >
          <button
            type="button"
            onClick={prevItem}
            aria-label="Anterior"
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
              isBenchmark
                ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                : 'text-slate-700 hover:bg-slate-900/5 hover:text-[#0F172A]'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Indicators */}
          <div className="flex items-center gap-1 px-1">
            {itemsList.map((s) => {
              const active = s.id === currentIdx;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goToIndex(s.id)}
                  title={`${s.id + 1}. ${s.shortLabel}`}
                  aria-label={`Ir a ${s.id + 1}: ${s.shortLabel}`}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    isBenchmark
                      ? active
                        ? 'w-7 bg-[#00F0FF]'
                        : 'w-2 bg-slate-600 hover:bg-slate-400'
                      : active
                        ? 'w-7 bg-[#0284C7]'
                        : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              );
            })}
          </div>

          <span
            className={`font-mono-tabular px-2 text-xs font-semibold whitespace-nowrap shrink-0 ${
              isBenchmark ? 'text-white' : 'text-[#0F172A]'
            }`}
          >
            {String(currentIdx + 1).padStart(2, '0')} / {String(itemsList.length).padStart(2, '0')}
          </span>

          <button
            type="button"
            onClick={nextItem}
            aria-label="Siguiente"
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
              isBenchmark
                ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                : 'text-slate-700 hover:bg-slate-900/5 hover:text-[#0F172A]'
            }`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div
            className={`mx-1 h-4 w-px ${isBenchmark ? 'bg-white/15' : 'bg-slate-900/10'}`}
          />

          <button
            type="button"
            onClick={() => setHudCollapsed((prev) => !prev)}
            title="Alternar paneles (H)"
            className={`inline-flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              isBenchmark
                ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                : 'text-slate-700 hover:bg-slate-900/5 hover:text-[#0F172A]'
            }`}
          >
            {hudCollapsed ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{hudCollapsed ? 'Mostrar datos' : 'Solo 3D'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetCamera}
            title="Restablecer vista 3D (R)"
            aria-label="Restablecer vista 3D"
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
              isBenchmark
                ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                : 'text-slate-700 hover:bg-slate-900/5 hover:text-[#0F172A]'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <div
            className={`mx-1 h-4 w-px ${isBenchmark ? 'bg-white/15' : 'bg-slate-900/10'}`}
          />

          <button
            type="button"
            onClick={() => {
              setExportError(null);
              setExportOpen(true);
            }}
            title="Exportar reporte PDF/PNG o copiar enlace (E)"
            className={`inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              isBenchmark
                ? 'bg-[#00F0FF]/15 text-[#00F0FF] hover:bg-[#00F0FF] hover:text-[#060B19]'
                : 'bg-[#0284C7]/10 text-[#0284C7] hover:bg-[#0284C7] hover:text-white'
            }`}
          >
            <FileDown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Static Export & Cloudflare Deep-Link Modal */}
      <ExportReportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        reportType={activeReport}
        totalItems={itemsList.length}
        activeSlideMeta={itemsList[currentIdx]}
        isExporting={isExporting}
        progress={exportProgress}
        errorMsg={exportError}
        onExport={handleExport}
      />
    </main>
  );
}
