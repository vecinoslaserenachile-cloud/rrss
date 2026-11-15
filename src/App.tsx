import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FileDown,
  Orbit,
  RotateCcw,
} from 'lucide-react';
import { ExportMode, ExportReportModal } from './components/ExportReportModal';
import { Scene3DCanvas, Scene3DHandle } from './components/Scene3DCanvas';
import { SlideOverlays } from './components/SlideOverlays';
import { SLIDES } from './data/coquimboData';
import {
  exportCurrentSlidePdf,
  exportCurrentSlidePng,
  exportFullPresentationPdf,
} from './utils/exportReport';

function resolveInitialSlide(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const params = new URLSearchParams(window.location.search);
    const param = params.get('lamina') || params.get('slide');
    if (param) {
      const bySlug = SLIDES.findIndex((s) => s.slug === param.toLowerCase());
      if (bySlug >= 0) return bySlug;
      const numeric = Number(param);
      if (Number.isInteger(numeric) && numeric >= 1 && numeric <= SLIDES.length) {
        return numeric - 1;
      }
    }
  } catch {
    // Ignore malformed query string
  }
  return 0;
}

export default function App() {
  const [activeSlide, setActiveSlide] = useState<number>(resolveInitialSlide);
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
  const scene3DRef = useRef<Scene3DHandle | null>(null);

  // Keep URL query parameter synchronized for shareable deep links on reporte.vecinoslaserena.cl
  useEffect(() => {
    if (typeof window === 'undefined' || isExporting) return;
    try {
      const url = new URL(window.location.href);
      const slug = SLIDES[activeSlide]?.slug;
      if (slug) {
        if (activeSlide === 0) {
          url.searchParams.delete('lamina');
        } else {
          url.searchParams.set('lamina', slug);
        }
        window.history.replaceState(null, '', url.toString());
      }
    } catch {
      // Safe fallback in restricted iframe contexts
    }
  }, [activeSlide, isExporting]);

  const goToSlide = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, index));
    setActiveSlide(clamped);
    setHighlightedRank(null);
  }, []);

  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    setHighlightedRank(null);
  }, []);

  const prevSlide = useCallback(() => {
    setActiveSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
    setHighlightedRank(null);
  }, []);

  const handleResetCamera = useCallback(() => {
    setFreeOrbitMode(false);
    setResetCameraNonce((n) => n + 1);
  }, []);

  const handleExport = useCallback(
    async (mode: ExportMode) => {
      const stageEl = captureStageRef.current;
      const sceneHandle = scene3DRef.current;
      if (!stageEl || !sceneHandle) return;

      setExportError(null);
      setIsExporting(true);
      setExportProgress(null);

      const previousSlide = activeSlide;
      const previousHud = hudCollapsed;

      try {
        if (mode === 'current-png') {
          await exportCurrentSlidePng(stageEl, SLIDES[activeSlide], () =>
            sceneHandle.renderCurrentFrame()
          );
        } else if (mode === 'current-pdf') {
          await exportCurrentSlidePdf(stageEl, SLIDES[activeSlide], () =>
            sceneHandle.renderCurrentFrame()
          );
        } else {
          if (previousHud) setHudCollapsed(false);
          await exportFullPresentationPdf({
            stageEl,
            prepareSlide3D: (idx) => sceneHandle.prepareSlideForCapture(idx),
            setActiveSlideForCapture: (idx) => {
              setHighlightedRank(null);
              setActiveSlide(idx);
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
          setActiveSlide(previousSlide);
          setHudCollapsed(previousHud);
          sceneHandle.prepareSlideForCapture(previousSlide);
        }
        setIsExporting(false);
        setExportProgress(null);
      }
    },
    [activeSlide, hudCollapsed]
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

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        goToSlide(Number(e.key) - 1);
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
  }, [goToSlide, handleResetCamera, isExporting, nextSlide, prevSlide]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#F4F7FB] text-[#0F172A]">
      {/* Capturable Stage: WebGL 3D Viewport + Editorial Bento-Grid Overlays */}
      <div ref={captureStageRef} className="relative h-full w-full">
        <Scene3DCanvas
          ref={scene3DRef}
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
      </div>

      {/* Top Navigation Bar (Strict 3-Zone Contract) */}
      <header
        data-html2canvas-ignore="true"
        className="glass-panel fixed top-0 right-0 left-0 z-30 flex h-14 items-center justify-between gap-8 border-t-0 border-r-0 border-l-0 px-6 lg:px-10"
      >
        {/* Zone 1: Single-line Wordmark */}
        <button
          type="button"
          onClick={() => goToSlide(0)}
          className="font-display text-base font-bold tracking-tight text-[#0F172A] whitespace-nowrap shrink-0 hover:text-[#0284C7] transition-colors"
        >
          Coquimbo Digital 2026
        </button>

        {/* Zone 2: Slide Text Navigation Links */}
        <nav
          aria-label="Láminas de la presentación"
          className="hidden lg:flex items-center gap-4 text-xs font-medium"
        >
          {SLIDES.map((slide) => {
            const isActive = slide.id === activeSlide;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => goToSlide(slide.id)}
                className={`relative py-1 transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'font-semibold text-[#0284C7]'
                    : 'text-slate-600 hover:text-[#0F172A]'
                }`}
              >
                {slide.shortLabel}
                {isActive && (
                  <span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-[#0284C7]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setFreeOrbitMode((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              freeOrbitMode
                ? 'bg-[#0284C7] text-white'
                : 'bg-[#0F172A] text-white hover:bg-slate-800'
            }`}
          >
            <Orbit className="h-3.5 w-3.5" />
            {freeOrbitMode ? 'Órbita 3D Activa' : 'Explorar 3D'}
          </button>
        </div>
      </header>

      {/* Unified Floating Bottom Presentation Dock */}
      <div
        data-html2canvas-ignore="true"
        className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2"
      >
        <div className="glass-panel flex items-center gap-1.5 rounded-2xl px-2.5 py-1.5">
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Lámina anterior"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-900/5 hover:text-[#0F172A]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Slide Indicators */}
          <div className="flex items-center gap-1 px-1">
            {SLIDES.map((s) => {
              const active = s.id === activeSlide;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goToSlide(s.id)}
                  title={`${s.id + 1}. ${s.shortLabel}`}
                  aria-label={`Ir a lámina ${s.id + 1}: ${s.shortLabel}`}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    active
                      ? 'w-7 bg-[#0284C7]'
                      : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              );
            })}
          </div>

          <span className="font-mono-tabular px-2 text-xs font-semibold text-[#0F172A] whitespace-nowrap shrink-0">
            {String(activeSlide + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
          </span>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Siguiente lámina"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-900/5 hover:text-[#0F172A]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="mx-1 h-4 w-px bg-slate-900/10" />

          <button
            type="button"
            onClick={() => setHudCollapsed((prev) => !prev)}
            title="Alternar paneles (H)"
            className="inline-flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-900/5 hover:text-[#0F172A] whitespace-nowrap shrink-0"
          >
            {hudCollapsed ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{hudCollapsed ? 'Mostrar datos' : 'Solo 3D'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetCamera}
            title="Restablecer vista 3D (R)"
            aria-label="Restablecer vista 3D"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-900/5 hover:text-[#0F172A]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <div className="mx-1 h-4 w-px bg-slate-900/10" />

          <button
            type="button"
            onClick={() => {
              setExportError(null);
              setExportOpen(true);
            }}
            title="Exportar reporte PDF/PNG o copiar enlace (E)"
            className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-[#0284C7]/10 px-3 text-xs font-semibold text-[#0284C7] transition-colors hover:bg-[#0284C7] hover:text-white whitespace-nowrap shrink-0"
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
        activeSlideMeta={SLIDES[activeSlide]}
        isExporting={isExporting}
        progress={exportProgress}
        errorMsg={exportError}
        onExport={handleExport}
      />
    </main>
  );
}
