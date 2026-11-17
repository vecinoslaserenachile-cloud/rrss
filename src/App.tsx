import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Cpu,
  Eye,
  EyeOff,
  FileDown,
  Focus,
  Home,
  LayoutGrid,
  Loader2,
  Lock,
  Maximize2,
  Minimize2,
  Orbit,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Square,
  Volume2,
  X,
} from 'lucide-react';
import { BenchmarkOverlays } from './components/BenchmarkOverlays';
import { BenchmarkSceneCanvas } from './components/BenchmarkSceneCanvas';
import {
  EDICION3_SESSION_STORAGE_KEY,
  Edicion3AccessGate,
  Edicion3AccessLogEntry,
  Edicion3AccessLogModal,
  Edicion3SessionState,
  loadLocalAccessLogs,
  mergeAccessLogs,
} from './components/Edicion3AccessGate';
import { Edicion3Overlays } from './components/Edicion3Overlays';
import { Edicion3SceneCanvas, Edicion3SignalOrigin } from './components/Edicion3SceneCanvas';
import { Edicion3WordCloudNetwork } from './components/Edicion3WordCloudNetwork';
import { ExportMode, ExportReportModal } from './components/ExportReportModal';
import { Scene3DCanvas, Scene3DHandle } from './components/Scene3DCanvas';
import { SlideOverlays } from './components/SlideOverlays';
import { BENCHMARK_CHAPTERS } from './data/benchmarkData';
import { SLIDES } from './data/coquimboData';
import { EDICION3_AUTHORITIES, EDICION3_SLIDES } from './data/edicion3Data';
import {
  BENCHMARK_NARRATIONS,
  ECOSYSTEM_NARRATIONS,
  EDICION3_NARRATIONS,
} from './data/narrationScripts';
import { resolveActiveCue } from './data/presentationChoreography';
import { useSlideNarration } from './hooks/useSlideNarration';
import { ConurbanoDuelMode } from './three/benchmarkBuilders';
import { Edicion3DuelMode } from './three/edicion3Builders';
import {
  exportCurrentSlidePdf,
  exportCurrentSlidePng,
  exportFullPresentationPdf,
} from './utils/exportReport';

type ReportType = 'ecosistema' | 'benchmark' | 'edicion3';

function resolveInitialReportState(): {
  report: ReportType;
  ecoSlide: number;
  benchChapter: number;
  ed3Slide: number;
} {
  if (typeof window === 'undefined') {
    return { report: 'ecosistema', ecoSlide: 0, benchChapter: 0, ed3Slide: 0 };
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const repParam = params.get('reporte');
    const report: ReportType =
      repParam === 'benchmark'
        ? 'benchmark'
        : repParam === 'edicion3'
          ? 'edicion3'
          : 'ecosistema';

    let ecoSlide = 0;
    const laminaParam = params.get('lamina') || params.get('slide');
    if (laminaParam && report === 'ecosistema') {
      const idx = SLIDES.findIndex((s) => s.slug === laminaParam.toLowerCase());
      if (idx >= 0) ecoSlide = idx;
      else if (Number.isInteger(Number(laminaParam))) {
        const n = Number(laminaParam);
        if (n >= 1 && n <= SLIDES.length) ecoSlide = n - 1;
      }
    }

    let ed3Slide = 0;
    if (laminaParam && report === 'edicion3') {
      const idx = EDICION3_SLIDES.findIndex((s) => s.slug === laminaParam.toLowerCase());
      if (idx >= 0) ed3Slide = idx;
      else if (Number.isInteger(Number(laminaParam))) {
        const n = Number(laminaParam);
        if (n >= 1 && n <= EDICION3_SLIDES.length) ed3Slide = n - 1;
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
      report,
      ecoSlide,
      benchChapter,
      ed3Slide,
    };
  } catch {
    return { report: 'ecosistema', ecoSlide: 0, benchChapter: 0, ed3Slide: 0 };
  }
}

export default function App() {
  const initial = resolveInitialReportState();

  const [activeReport, setActiveReport] = useState<ReportType>(initial.report);
  const [activeSlide, setActiveSlide] = useState<number>(initial.ecoSlide);
  const [activeBenchChapter, setActiveBenchChapter] = useState<number>(initial.benchChapter);
  const [activeEd3Slide, setActiveEd3Slide] = useState<number>(initial.ed3Slide);
  const [duelMode, setDuelMode] = useState<ConurbanoDuelMode>('totals');
  const [ed3DuelMode, setEd3DuelMode] = useState<Edicion3DuelMode>('totals');
  const [autoPresent, setAutoPresent] = useState<boolean>(false);

  // Edición N° 3 Access Gate & Audit Log State
  const [ed3Session, setEd3Session] = useState<Edicion3SessionState | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.sessionStorage.getItem(EDICION3_SESSION_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Edicion3SessionState) : null;
    } catch {
      return null;
    }
  });
  const [ed3Logs, setEd3Logs] = useState<Edicion3AccessLogEntry[]>(() => loadLocalAccessLogs());
  const [ed3LogModalOpen, setEd3LogModalOpen] = useState<boolean>(false);
  const [ed3WordNetworkOpen, setEd3WordNetworkOpen] = useState<boolean>(false);

  const [highlightedRank, setHighlightedRank] = useState<number | null>(null);
  const [selectedEd3Rank, setSelectedEd3Rank] = useState<number | null>(null);
  const [ed3SignalOrigin, setEd3SignalOrigin] = useState<Edicion3SignalOrigin | null>(null);
  const [freeOrbitMode, setFreeOrbitMode] = useState<boolean>(false);
  const [hudCollapsed, setHudCollapsed] = useState<boolean>(false);
  const [resetCameraNonce, setResetCameraNonce] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [teleprompterMinimized, setTeleprompterMinimized] = useState<boolean>(false);

  // Static export & share modal state
  const [exportOpen, setExportOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<{
    current: number;
    total: number;
    title: string;
  } | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const [presentationCompleted, setPresentationCompleted] = useState<boolean>(false);

  const captureStageRef = useRef<HTMLDivElement | null>(null);
  const ecoSceneRef = useRef<Scene3DHandle | null>(null);
  const benchSceneRef = useRef<Scene3DHandle | null>(null);
  const ed3SceneRef = useRef<Scene3DHandle | null>(null);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const autoPresentRef = useRef<boolean>(autoPresent);
  autoPresentRef.current = autoPresent;

  const isBenchmark = activeReport === 'benchmark';
  const isEdicion3 = activeReport === 'edicion3';
  const isDarkTheme = isBenchmark || isEdicion3;
  const isEdicion3Locked = isEdicion3 && !ed3Session;

  const refreshEd3Logs = useCallback(async () => {
    const local = loadLocalAccessLogs();
    if (!ed3Session?.sessionToken) {
      setEd3Logs(local);
      return;
    }
    try {
      const res = await fetch('/api/edicion3/logs', {
        headers: { 'x-edicion3-token': ed3Session.sessionToken },
      });
      if (res.ok) {
        const data = (await res.json()) as { logs?: Edicion3AccessLogEntry[] };
        setEd3Logs(mergeAccessLogs(data.logs ?? [], local));
        return;
      }
    } catch {
      // Static hosting fallback uses local logs
    }
    setEd3Logs(local);
  }, [ed3Session]);

  useEffect(() => {
    if (isEdicion3 && ed3Session) {
      void refreshEd3Logs();
    }
  }, [isEdicion3, ed3Session, refreshEd3Logs]);

  const currentNarrationScript = isEdicion3Locked
    ? ''
    : isBenchmark
      ? (BENCHMARK_NARRATIONS[activeBenchChapter] ?? '')
      : isEdicion3
        ? (EDICION3_NARRATIONS[activeEd3Slide] ?? '')
        : (ECOSYSTEM_NARRATIONS[activeSlide] ?? '');

  // Pre-fetch next slide/chapter seamlessly
  const nextPrefetchTarget = (() => {
    if (isEdicion3Locked) return { key: undefined, script: undefined };
    if (isEdicion3) {
      if (activeEd3Slide + 1 < EDICION3_SLIDES.length) {
        return {
          key: `edicion3-${activeEd3Slide + 1}`,
          script: EDICION3_NARRATIONS[activeEd3Slide + 1] ?? '',
        };
      }
      return { key: undefined, script: undefined };
    }
    if (!isBenchmark) {
      if (activeSlide + 1 < SLIDES.length) {
        return {
          key: `ecosistema-${activeSlide + 1}`,
          script: ECOSYSTEM_NARRATIONS[activeSlide + 1] ?? '',
        };
      }
      return {
        key: 'benchmark-0',
        script: BENCHMARK_NARRATIONS[0] ?? '',
      };
    }
    if (activeBenchChapter + 1 < BENCHMARK_CHAPTERS.length) {
      return {
        key: `benchmark-${activeBenchChapter + 1}`,
        script: BENCHMARK_NARRATIONS[activeBenchChapter + 1] ?? '',
      };
    }
    return { key: undefined, script: undefined };
  })();

  const clearAutoAdvanceTimer = useCallback(() => {
    if (autoAdvanceTimerRef.current) {
      window.clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  }, []);

  const handleNarrationFinished = useCallback(() => {
    if (!autoPresentRef.current || isExporting) return;
    clearAutoAdvanceTimer();

    autoAdvanceTimerRef.current = window.setTimeout(() => {
      if (!autoPresentRef.current) return;

      if (isEdicion3) {
        if (activeEd3Slide + 1 < EDICION3_SLIDES.length) {
          setHighlightedRank(null);
          setActiveEd3Slide((prev) => prev + 1);
        } else {
          setAutoPresent(false);
          setPresentationCompleted(true);
        }
      } else if (!isBenchmark) {
        if (activeSlide + 1 < SLIDES.length) {
          setHighlightedRank(null);
          setActiveSlide((prev) => prev + 1);
        } else {
          // Seamless cross-report transition: Slide 9 -> Benchmark 3D Chapter 1
          setHighlightedRank(null);
          setFreeOrbitMode(false);
          setActiveReport('benchmark');
          setActiveBenchChapter(0);
          setResetCameraNonce((n) => n + 1);
        }
      } else {
        if (activeBenchChapter + 1 < BENCHMARK_CHAPTERS.length) {
          setHighlightedRank(null);
          setActiveBenchChapter((prev) => prev + 1);
        } else {
          // Completed full two-report keynote presentation
          setAutoPresent(false);
          setPresentationCompleted(true);
        }
      }
    }, 1400);
  }, [activeBenchChapter, activeEd3Slide, activeSlide, clearAutoAdvanceTimer, isBenchmark, isEdicion3, isExporting]);

  const currentSlideKey = `${activeReport}-${
    isBenchmark ? activeBenchChapter : isEdicion3 ? activeEd3Slide : activeSlide
  }`;

  const narration = useSlideNarration({
    script: currentNarrationScript,
    slideKey: currentSlideKey,
    nextSlideKey: nextPrefetchTarget.key,
    nextScript: nextPrefetchTarget.script,
    onNarrationEnd: handleNarrationFinished,
  });

  // Resolve real-time 3D camera, rank highlight, and interactive mode cues synced to audio progress
  const activeCue =
    autoPresent && !freeOrbitMode && !isExporting && !isEdicion3Locked
      ? resolveActiveCue(currentSlideKey, narration.progress)
      : null;

  useEffect(() => {
    if (!activeCue) return;
    if (activeCue.highlightRank !== undefined) {
      setHighlightedRank(activeCue.highlightRank ?? null);
    }
    if (activeCue.duelMode) {
      setDuelMode(activeCue.duelMode);
    }
  }, [activeCue]);

  useEffect(() => () => clearAutoAdvanceTimer(), [clearAutoAdvanceTimer]);

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
      } else if (isEdicion3) {
        url.searchParams.set('reporte', 'edicion3');
        url.searchParams.delete('capitulo');
        const edSlug = EDICION3_SLIDES[activeEd3Slide]?.slug;
        if (edSlug) url.searchParams.set('lamina', edSlug);
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
  }, [activeReport, activeSlide, activeBenchChapter, activeEd3Slide, isBenchmark, isEdicion3, isExporting]);

  const handleSelectEd3Rank = useCallback(
    (rank: number | null, origin?: { x: number; y: number }) => {
      narration.unlockAudio();
      if (rank === null) {
        setSelectedEd3Rank(null);
        setEd3SignalOrigin(null);
        setHighlightedRank(null);
        setResetCameraNonce((n) => n + 1);
        return;
      }
      const auth = EDICION3_AUTHORITIES.find((a) => a.rank === rank);
      const color = auth?.color ?? '#F59E0B';
      let resolvedOrigin = origin;
      if (!resolvedOrigin && typeof document !== 'undefined') {
        const el = document.querySelector(`[data-ed3-rank="${rank}"]`);
        if (el) {
          const rect = el.getBoundingClientRect();
          const isRow = el.tagName === 'TR';
          resolvedOrigin = {
            x: isRow ? rect.right - 12 : rect.left + rect.width / 2,
            y: isRow ? rect.top + rect.height / 2 : rect.top + 2,
          };
        }
      }
      setSelectedEd3Rank(rank);
      setHighlightedRank(rank);
      setAutoPresent(false);
      setEd3SignalOrigin((prev) => ({
        rank,
        x: resolvedOrigin?.x ?? (prev?.x ?? window.innerWidth * 0.5),
        y: resolvedOrigin?.y ?? (prev?.y ?? window.innerHeight * 0.72),
        color,
        nonce: Date.now(),
      }));
    },
    [narration]
  );

  const switchReport = useCallback(
    (target: ReportType) => {
      narration.unlockAudio();
      clearAutoAdvanceTimer();
      setActiveReport(target);
      setHighlightedRank(null);
      setSelectedEd3Rank(null);
      setEd3SignalOrigin(null);
      setFreeOrbitMode(false);
      setAutoPresent(false);
      setPresentationCompleted(false);
      setEd3WordNetworkOpen(false);
      setEd3LogModalOpen(false);
      setResetCameraNonce((n) => n + 1);
    },
    [clearAutoAdvanceTimer, narration]
  );

  const toggleAutoPresentation = useCallback(() => {
    narration.unlockAudio();
    clearAutoAdvanceTimer();
    setPresentationCompleted(false);
    if (autoPresent) {
      setAutoPresent(false);
      setHighlightedRank(null);
      setResetCameraNonce((n) => n + 1);
      narration.setAutoNarrate(false);
      narration.stop();
    } else {
      const alreadyAutoNarrating = narration.autoNarrate;
      setFreeOrbitMode(false);
      setAutoPresent(true);
      narration.setAutoNarrate(true);
      if (alreadyAutoNarrating && !narration.isSpeaking && !narration.isLoadingAudio) {
        void narration.speakCurrent();
      }
    }
  }, [autoPresent, clearAutoAdvanceTimer, narration]);

  const startKeynoteFromBeginning = useCallback(() => {
    narration.unlockAudio();
    clearAutoAdvanceTimer();
    setPresentationCompleted(false);
    setHighlightedRank(null);
    setFreeOrbitMode(false);
    const alreadyAtStart = activeReport === 'ecosistema' && activeSlide === 0 && narration.autoNarrate;
    setActiveReport('ecosistema');
    setActiveSlide(0);
    setActiveBenchChapter(0);
    setResetCameraNonce((n) => n + 1);
    setAutoPresent(true);
    narration.setAutoNarrate(true);
    if (alreadyAtStart && !narration.isSpeaking && !narration.isLoadingAudio) {
      void narration.speakCurrent();
    }
  }, [activeReport, activeSlide, clearAutoAdvanceTimer, narration]);

  const navigateToReportStart = useCallback(
    (target: ReportType, startKeynote = false) => {
      clearAutoAdvanceTimer();
      setPresentationCompleted(false);
      setHighlightedRank(null);
      setFreeOrbitMode(false);
      const targetIdx =
        target === 'ecosistema'
          ? activeSlide
          : target === 'benchmark'
            ? activeBenchChapter
            : activeEd3Slide;
      setActiveReport(target);
      if (target === 'ecosistema') {
        setActiveSlide(0);
      } else if (target === 'benchmark') {
        setActiveBenchChapter(0);
      } else {
        setActiveEd3Slide(0);
      }
      setResetCameraNonce((n) => n + 1);
      if (startKeynote) {
        narration.unlockAudio();
        setAutoPresent(true);
        narration.setAutoNarrate(true);
        if (activeReport === target && targetIdx === 0 && !narration.isSpeaking) {
          void narration.speakCurrent();
        }
      } else {
        setAutoPresent(false);
      }
    },
    [activeBenchChapter, activeEd3Slide, activeReport, activeSlide, clearAutoAdvanceTimer, narration]
  );

  const jumpToFinalSummary = useCallback(() => {
    narration.unlockAudio();
    clearAutoAdvanceTimer();
    setPresentationCompleted(false);
    setHighlightedRank(null);
    setFreeOrbitMode(false);
    setAutoPresent(false);
    if (isEdicion3) {
      setActiveEd3Slide(EDICION3_SLIDES.length - 1);
    } else {
      setActiveReport('benchmark');
      setActiveBenchChapter(BENCHMARK_CHAPTERS.length - 1);
    }
    setResetCameraNonce((n) => n + 1);
  }, [clearAutoAdvanceTimer, isEdicion3, narration]);

  const handleSlideOverlayAction = useCallback(
    (action: 'restart-eco' | 'go-benchmark' | 'go-summary') => {
      if (action === 'restart-eco') {
        navigateToReportStart('ecosistema');
      } else if (action === 'go-benchmark') {
        navigateToReportStart('benchmark');
      } else {
        jumpToFinalSummary();
      }
    },
    [jumpToFinalSummary, navigateToReportStart]
  );

  const goToIndex = useCallback(
    (index: number) => {
      narration.unlockAudio();
      clearAutoAdvanceTimer();
      setPresentationCompleted(false);
      setHighlightedRank(null);
      setSelectedEd3Rank(null);
      setEd3SignalOrigin(null);
      if (isBenchmark) {
        setActiveBenchChapter(Math.max(0, Math.min(BENCHMARK_CHAPTERS.length - 1, index)));
      } else if (isEdicion3) {
        setActiveEd3Slide(Math.max(0, Math.min(EDICION3_SLIDES.length - 1, index)));
      } else {
        setActiveSlide(Math.max(0, Math.min(SLIDES.length - 1, index)));
      }
    },
    [clearAutoAdvanceTimer, isBenchmark, isEdicion3, narration]
  );

  const nextItem = useCallback(() => {
    narration.unlockAudio();
    clearAutoAdvanceTimer();
    setPresentationCompleted(false);
    setHighlightedRank(null);
    setSelectedEd3Rank(null);
    setEd3SignalOrigin(null);
    if (isBenchmark) {
      setActiveBenchChapter((prev) => (prev + 1) % BENCHMARK_CHAPTERS.length);
    } else if (isEdicion3) {
      setActiveEd3Slide((prev) => (prev + 1) % EDICION3_SLIDES.length);
    } else {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }
  }, [clearAutoAdvanceTimer, isBenchmark, isEdicion3, narration]);

  const prevItem = useCallback(() => {
    narration.unlockAudio();
    clearAutoAdvanceTimer();
    setPresentationCompleted(false);
    setHighlightedRank(null);
    setSelectedEd3Rank(null);
    setEd3SignalOrigin(null);
    if (isBenchmark) {
      setActiveBenchChapter(
        (prev) => (prev - 1 + BENCHMARK_CHAPTERS.length) % BENCHMARK_CHAPTERS.length
      );
    } else if (isEdicion3) {
      setActiveEd3Slide(
        (prev) => (prev - 1 + EDICION3_SLIDES.length) % EDICION3_SLIDES.length
      );
    } else {
      setActiveSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
    }
  }, [clearAutoAdvanceTimer, isBenchmark, isEdicion3, narration]);

  const handleResetCamera = useCallback(() => {
    clearAutoAdvanceTimer();
    setFreeOrbitMode(false);
    setAutoPresent(false);
    setSelectedEd3Rank(null);
    setEd3SignalOrigin(null);
    setHighlightedRank(null);
    setResetCameraNonce((n) => n + 1);
  }, [clearAutoAdvanceTimer]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      window.dispatchEvent(new Event('resize'));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Safe fallback if browser or iframe blocks Fullscreen API
    }
  }, []);

  const handleExport = useCallback(
    async (mode: ExportMode) => {
      const stageEl = captureStageRef.current;
      const sceneHandle = isBenchmark
        ? benchSceneRef.current
        : isEdicion3
          ? ed3SceneRef.current
          : ecoSceneRef.current;
      if (!stageEl || !sceneHandle) return;

      setExportError(null);
      setIsExporting(true);
      setExportProgress(null);

      const previousIdx = isBenchmark
        ? activeBenchChapter
        : isEdicion3
          ? activeEd3Slide
          : activeSlide;
      const previousHud = hudCollapsed;
      const currentMeta = isBenchmark
        ? BENCHMARK_CHAPTERS[activeBenchChapter]
        : isEdicion3
          ? EDICION3_SLIDES[activeEd3Slide]
          : SLIDES[activeSlide];

      const exportTheme = isDarkTheme ? 'dark' : 'light';
      const exportPrefix = isBenchmark
        ? 'LaSerena_Benchmark_Cap'
        : isEdicion3
          ? 'ReporteDigital_Nov2026_Lam'
          : 'La_Serena_Digital_Lamina';
      const exportSubtitle = isBenchmark
        ? 'La Serena Digital · Benchmark 3D (28 días · 26 cuentas)'
        : isEdicion3
          ? 'Reporte Digital Noviembre 2026 · Edición N° 3 (13 Autoridades Regionales)'
          : 'La Serena Digital 2026 (14 oct – 14 nov)';
      const exportUnit = isBenchmark ? 'Capítulo' : 'Lámina';
      const exportSlides = isBenchmark
        ? BENCHMARK_CHAPTERS
        : isEdicion3
          ? EDICION3_SLIDES
          : SLIDES;
      const exportFilename = isBenchmark
        ? 'Reporte_LaSerena_Benchmark_3D.pdf'
        : isEdicion3
          ? 'Reporte_Digital_Noviembre_2026.pdf'
          : 'Reporte_La_Serena_Digital_2026.pdf';

      try {
        if (mode === 'current-png') {
          await exportCurrentSlidePng(
            stageEl,
            currentMeta,
            () => sceneHandle.renderCurrentFrame(),
            {
              theme: exportTheme,
              prefix: exportPrefix,
            }
          );
        } else if (mode === 'current-pdf') {
          await exportCurrentSlidePdf(
            stageEl,
            currentMeta,
            () => sceneHandle.renderCurrentFrame(),
            {
              theme: exportTheme,
              totalCount: exportSlides.length,
              prefix: exportPrefix,
              reportSubtitle: exportSubtitle,
              unitWord: exportUnit,
              footerBrand: isEdicion3 ? 'Reporte Digital Noviembre 2026' : undefined,
            }
          );
        } else {
          if (previousHud) setHudCollapsed(false);
          await exportFullPresentationPdf({
            stageEl,
            slides: exportSlides,
            theme: exportTheme,
            filename: exportFilename,
            reportSubtitle: exportSubtitle,
            unitWord: exportUnit,
            footerBrand: isEdicion3 ? 'Reporte Digital Noviembre 2026' : undefined,
            includeAppendix: !isBenchmark && !isEdicion3,
            prepareSlide3D: (idx) => sceneHandle.prepareSlideForCapture(idx),
            setActiveSlideForCapture: (idx) => {
              setHighlightedRank(null);
              if (isBenchmark) setActiveBenchChapter(idx);
              else if (isEdicion3) setActiveEd3Slide(idx);
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
          else if (isEdicion3) setActiveEd3Slide(previousIdx);
          else setActiveSlide(previousIdx);
          setHudCollapsed(previousHud);
          sceneHandle.prepareSlideForCapture(previousIdx);
        }
        setIsExporting(false);
        setExportProgress(null);
      }
    },
    [activeBenchChapter, activeEd3Slide, activeSlide, hudCollapsed, isBenchmark, isDarkTheme, isEdicion3]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isExporting || isEdicion3Locked) return;
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable;
      if (isInput) return;

      const maxNum = isBenchmark
        ? BENCHMARK_CHAPTERS.length
        : isEdicion3
          ? EDICION3_SLIDES.length
          : SLIDES.length;

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
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        narration.togglePlay();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        void toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setTeleprompterMinimized((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    goToIndex,
    handleResetCamera,
    isBenchmark,
    isEdicion3,
    isEdicion3Locked,
    isExporting,
    narration,
    nextItem,
    prevItem,
    toggleFullscreen,
  ]);

  const itemsList = isBenchmark
    ? BENCHMARK_CHAPTERS
    : isEdicion3
      ? EDICION3_SLIDES
      : SLIDES;
  const currentIdx = isBenchmark
    ? activeBenchChapter
    : isEdicion3
      ? activeEd3Slide
      : activeSlide;

  return (
    <main
      className={`relative h-[100dvh] w-screen overflow-hidden ${
        isDarkTheme ? 'bg-[#060B19] text-white' : 'bg-[#F4F7FB] text-[#0F172A]'
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
              hudCollapsed={hudCollapsed}
              directorCamera={activeCue?.camera ?? null}
              onHoverRank={setHighlightedRank}
            />
            <BenchmarkOverlays
              activeChapter={activeBenchChapter}
              duelMode={duelMode}
              onDuelModeChange={setDuelMode}
              highlightedRank={highlightedRank}
              onHoverRank={setHighlightedRank}
              hudCollapsed={hudCollapsed}
              onNavigateReportStart={navigateToReportStart}
            />
          </>
        ) : isEdicion3 ? (
          isEdicion3Locked ? (
            <Edicion3AccessGate
              currentSlideSlug={EDICION3_SLIDES[activeEd3Slide]?.slug ?? 'resumen-ejecutivo'}
              onUnlocked={(session, logs) => {
                setEd3Session(session);
                setEd3Logs(logs);
                try {
                  window.sessionStorage.setItem(
                    EDICION3_SESSION_STORAGE_KEY,
                    JSON.stringify(session)
                  );
                } catch {
                  // Ignore storage errors
                }
              }}
              onBackToPublicReports={() => switchReport('ecosistema')}
            />
          ) : (
            <>
              <Edicion3SceneCanvas
                ref={ed3SceneRef}
                activeSlide={activeEd3Slide}
                duelMode={ed3DuelMode}
                highlightedRank={highlightedRank}
                selectedRank={selectedEd3Rank}
                signalOrigin={ed3SignalOrigin}
                resetCameraNonce={resetCameraNonce}
                freeOrbitMode={freeOrbitMode}
                autoPresent={autoPresent}
                hudCollapsed={hudCollapsed}
                directorCamera={activeCue?.camera ?? null}
                onHoverRank={setHighlightedRank}
                onSelectRank={handleSelectEd3Rank}
              />
              <Edicion3Overlays
                activeSlide={activeEd3Slide}
                duelMode={ed3DuelMode}
                onDuelModeChange={setEd3DuelMode}
                highlightedRank={highlightedRank}
                selectedRank={selectedEd3Rank}
                onHoverRank={setHighlightedRank}
                onSelectRank={handleSelectEd3Rank}
                hudCollapsed={hudCollapsed}
                accessLogCount={ed3Logs.length}
                onOpenWordNetwork={() => setEd3WordNetworkOpen(true)}
                onOpenAccessLogs={() => {
                  void refreshEd3Logs();
                  setEd3LogModalOpen(true);
                }}
              />
            </>
          )
        ) : (
          <>
            <Scene3DCanvas
              ref={ecoSceneRef}
              activeSlide={activeSlide}
              highlightedRank={highlightedRank}
              resetCameraNonce={resetCameraNonce}
              freeOrbitMode={freeOrbitMode}
              autoPresent={autoPresent}
              hudCollapsed={hudCollapsed}
              directorCamera={activeCue?.camera ?? null}
              onHoverRank={setHighlightedRank}
            />
            <SlideOverlays
              activeSlide={activeSlide}
              highlightedRank={highlightedRank}
              onHoverRank={setHighlightedRank}
              hudCollapsed={hudCollapsed}
              instantNumbers={isExporting}
              onNavigateAction={handleSlideOverlayAction}
            />
          </>
        )}
      </div>

      {/* Top Navigation Bar */}
      <header
        data-html2canvas-ignore="true"
        className={`fixed top-0 right-0 left-0 z-30 flex h-14 items-center justify-between gap-2 border-t-0 border-r-0 border-l-0 px-3 sm:gap-4 sm:px-5 lg:px-9 ${
          isDarkTheme ? 'dark-glass-panel border-b border-white/10' : 'glass-panel'
        }`}
      >
        {/* Zone 1: Wordmark */}
        <button
          type="button"
          onClick={() => goToIndex(0)}
          className={`font-display text-sm sm:text-base font-bold tracking-tight whitespace-nowrap shrink-0 transition-colors ${
            isEdicion3
              ? 'text-white hover:text-[#F59E0B]'
              : isBenchmark
                ? 'text-white hover:text-[#00F0FF]'
                : 'text-[#0F172A] hover:text-[#0284C7]'
          }`}
        >
          <span className="sm:hidden">
            {isEdicion3 ? 'Reporte Nov. 26' : isBenchmark ? 'Benchmark 3D' : 'La Serena Digital'}
          </span>
          <span className="hidden sm:inline">
            {isEdicion3
              ? 'Reporte Digital · Nov. 2026'
              : isBenchmark
                ? 'La Serena Benchmark 3D'
                : 'La Serena Digital 2026'}
          </span>
        </button>

        {/* Zone 2: Navigation Links */}
        {!isEdicion3Locked && (
          <nav
            aria-label="Navegación de secciones"
            className="hidden xl:flex items-center gap-3 text-xs font-medium"
          >
            {itemsList.map((item) => {
              const isActive = item.id === currentIdx;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goToIndex(item.id)}
                  className={`relative py-1 transition-colors whitespace-nowrap shrink-0 ${
                    isDarkTheme
                      ? isActive
                        ? isEdicion3
                          ? 'font-semibold text-[#F59E0B]'
                          : 'font-semibold text-[#00F0FF]'
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
                        isEdicion3
                          ? 'bg-[#F59E0B]'
                          : isBenchmark
                            ? 'bg-[#00F0FF]'
                            : 'bg-[#0284C7]'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Zone 3: 3-Report Switcher + Interactive Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Compact Report Selector Strip */}
          <div
            className={`inline-flex items-center rounded-lg p-0.5 text-[11px] font-semibold ${
              isDarkTheme
                ? 'border border-white/15 bg-white/[0.06]'
                : 'border border-slate-900/10 bg-slate-900/[0.04]'
            }`}
          >
            <button
              type="button"
              onClick={() => switchReport('ecosistema')}
              className={`rounded-md px-2 py-1 transition-colors whitespace-nowrap ${
                activeReport === 'ecosistema'
                  ? 'bg-[#0284C7] text-white'
                  : isDarkTheme
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-600 hover:text-[#0F172A]'
              }`}
            >
              <span className="sm:hidden">R1</span>
              <span className="hidden sm:inline">Ecosistema</span>
            </button>
            <button
              type="button"
              onClick={() => switchReport('benchmark')}
              className={`rounded-md px-2 py-1 transition-colors whitespace-nowrap ${
                activeReport === 'benchmark'
                  ? 'bg-[#00F0FF] text-[#060B19]'
                  : isDarkTheme
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-600 hover:text-[#0F172A]'
              }`}
            >
              <span className="sm:hidden">R2</span>
              <span className="hidden sm:inline">Benchmark 3D</span>
            </button>
            <button
              type="button"
              onClick={() => switchReport('edicion3')}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 transition-colors whitespace-nowrap ${
                activeReport === 'edicion3'
                  ? 'bg-[#F59E0B] text-[#060B19]'
                  : isDarkTheme
                    ? 'text-amber-300 hover:text-white'
                    : 'text-amber-700 hover:text-[#0F172A]'
              }`}
              title="Reporte Digital Noviembre 2026 — Edición N° 3 (Acceso con clave y bitácora)"
            >
              {!ed3Session && <Lock className="h-3 w-3 shrink-0" />}
              <span className="sm:hidden">Ed.3</span>
              <span className="hidden sm:inline">Edición N° 3</span>
            </button>
          </div>

          {!isEdicion3Locked && (
            <>
              <button
                type="button"
                onClick={toggleAutoPresentation}
                title="Presentación automática con voz neural y cámara dirigida"
                className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  autoPresent
                    ? 'bg-[#FF2E93] text-white shadow-md'
                    : isDarkTheme
                      ? 'border border-white/15 bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                      : 'border border-[#0284C7]/35 bg-[#0284C7]/10 text-[#0284C7] hover:bg-[#0284C7] hover:text-white'
                }`}
              >
                {autoPresent ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">
                  {autoPresent ? 'Detener Auto' : 'Presentación Auto'}
                </span>
                <span className="sm:hidden">{autoPresent ? 'Pausar' : 'Auto'}</span>
              </button>

              <button
                type="button"
                onClick={() => setFreeOrbitMode((prev) => !prev)}
                className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-lg px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  isDarkTheme
                    ? freeOrbitMode
                      ? 'bg-[#00F0FF] text-[#060B19]'
                      : 'border border-[#00F0FF]/35 bg-[#00F0FF]/12 text-[#00F0FF] hover:bg-[#00F0FF]/20'
                    : freeOrbitMode
                      ? 'bg-[#0284C7] text-white'
                      : 'bg-[#0F172A] text-white hover:bg-slate-800'
                }`}
              >
                <Orbit className="h-3.5 w-3.5" />
                <span className="sm:hidden">3D</span>
                <span className="hidden sm:inline">
                  {freeOrbitMode ? 'Órbita Libre Activa' : isDarkTheme ? 'Órbita Libre' : 'Explorar 3D'}
                </span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Unified Floating Bottom Presentation Dock (hidden while locked on Edición N° 3) */}
      {!isEdicion3Locked && (
      <div
        data-html2canvas-ignore="true"
        className="fixed bottom-3 sm:bottom-4 left-1/2 z-30 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-2"
      >
        <div
          className={`flex items-center gap-0.5 sm:gap-1.5 rounded-2xl px-1.5 sm:px-2.5 py-1 sm:py-1.5 ${
            isDarkTheme ? 'dark-glass-panel' : 'glass-panel'
          }`}
        >
          <button
            type="button"
            onClick={prevItem}
            aria-label="Anterior"
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
              isDarkTheme
                ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                : 'text-slate-700 hover:bg-slate-900/5 hover:text-[#0F172A]'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Indicators (Desktop/Tablet) */}
          <div className="hidden md:flex items-center gap-1 px-1">
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
                    isDarkTheme
                      ? active
                        ? isEdicion3
                          ? 'w-7 bg-[#F59E0B]'
                          : 'w-7 bg-[#00F0FF]'
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
            className={`font-mono-tabular px-1.5 sm:px-2 text-xs font-semibold whitespace-nowrap shrink-0 ${
              isDarkTheme ? 'text-white' : 'text-[#0F172A]'
            }`}
          >
            {String(currentIdx + 1).padStart(2, '0')} / {String(itemsList.length).padStart(2, '0')}
          </span>

          <button
            type="button"
            onClick={nextItem}
            aria-label="Siguiente"
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
              isDarkTheme
                ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                : 'text-slate-700 hover:bg-slate-900/5 hover:text-[#0F172A]'
            }`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => navigateToReportStart(activeReport)}
            title="Volver al inicio de esta presentación"
            aria-label="Volver al inicio"
            className={`inline-flex h-8 items-center gap-1 rounded-xl px-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              currentIdx === 0
                ? isEdicion3
                  ? 'text-[#F59E0B] bg-[#F59E0B]/12'
                  : isBenchmark
                    ? 'text-[#00F0FF] bg-[#00F0FF]/10'
                    : 'text-[#0284C7] bg-[#0284C7]/10'
                : isDarkTheme
                  ? 'text-slate-200 hover:bg-white/10 hover:text-white'
                  : 'text-slate-700 hover:bg-slate-900/8 hover:text-[#0F172A]'
            }`}
          >
            <Home className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Inicio</span>
          </button>

          <button
            type="button"
            onClick={jumpToFinalSummary}
            title={
              isEdicion3
                ? 'Ir a la lámina final con el Ranking Consolidado (13 Autoridades)'
                : 'Ir a la diapositiva final con el Resumen de Ambos Reportes'
            }
            aria-label="Resumen Final"
            className={`inline-flex h-8 items-center gap-1 rounded-xl px-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              isEdicion3 && activeEd3Slide === EDICION3_SLIDES.length - 1
                ? 'bg-[#F59E0B] text-[#060B19]'
                : isBenchmark && activeBenchChapter === BENCHMARK_CHAPTERS.length - 1
                  ? 'bg-[#10B981] text-[#060B19]'
                  : isDarkTheme
                    ? 'text-slate-200 hover:bg-white/10 hover:text-[#10B981]'
                    : 'text-slate-700 hover:bg-slate-900/8 hover:text-[#0284C7]'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Resumen</span>
          </button>

          <div
            className={`mx-0.5 sm:mx-1 h-4 w-px ${isDarkTheme ? 'bg-white/15' : 'bg-slate-900/10'}`}
          />

          <button
            type="button"
            onClick={() => setHudCollapsed((prev) => !prev)}
            title="Alternar paneles (H)"
            aria-label={hudCollapsed ? 'Mostrar datos' : 'Solo 3D'}
            className={`inline-flex h-8 items-center gap-1.5 rounded-xl px-2 sm:px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              isDarkTheme
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
              isDarkTheme
                ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                : 'text-slate-700 hover:bg-slate-900/5 hover:text-[#0F172A]'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            title={isFullscreen ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)'}
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
            className={`inline-flex h-8 items-center justify-center gap-1 rounded-xl px-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              isFullscreen
                ? isEdicion3
                  ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                  : isBenchmark
                    ? 'bg-[#00F0FF]/20 text-[#00F0FF]'
                    : 'bg-[#0284C7]/15 text-[#0284C7]'
                : isDarkTheme
                  ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                  : 'text-slate-700 hover:bg-slate-900/5 hover:text-[#0F172A]'
            }`}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
            <span className="hidden lg:inline">
              {isFullscreen ? 'Salir' : 'Pantalla Completa'}
            </span>
          </button>

          <div
            className={`mx-0.5 sm:mx-1 h-4 w-px ${isDarkTheme ? 'bg-white/15' : 'bg-slate-900/10'}`}
          />

          {narration.isSupported && (
            <button
              type="button"
              onClick={narration.togglePlay}
              title="Audio narración con voz neural humana (N)"
              aria-label={narration.isSpeaking ? 'Pausar audio' : 'Narrar lámina'}
              className={`inline-flex h-8 items-center gap-1.5 rounded-xl px-2.5 sm:px-3 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                narration.isSpeaking || narration.isLoadingAudio
                  ? isDarkTheme
                    ? 'bg-[#FF2E93] text-white'
                    : 'bg-[#0284C7] text-white'
                  : isDarkTheme
                    ? 'bg-white/10 text-slate-200 hover:bg-white/20'
                    : 'bg-slate-900/6 text-[#0F172A] hover:bg-slate-900/12'
              }`}
            >
              {narration.isLoadingAudio ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : narration.isSpeaking ? (
                <Square className="h-3 w-3 fill-current" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">
                {narration.isLoadingAudio
                  ? 'Preparando...'
                  : narration.isSpeaking
                    ? 'Pausar Audio'
                    : 'Narrar'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              narration.stop();
              setExportError(null);
              setExportOpen(true);
            }}
            title="Exportar reporte PDF/PNG o copiar enlace (E)"
            aria-label="Exportar reporte"
            className={`inline-flex h-8 items-center gap-1.5 rounded-xl px-2.5 sm:px-3 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              isEdicion3
                ? 'bg-[#F59E0B]/15 text-[#F59E0B] hover:bg-[#F59E0B] hover:text-[#060B19]'
                : isBenchmark
                  ? 'bg-[#00F0FF]/15 text-[#00F0FF] hover:bg-[#00F0FF] hover:text-[#060B19]'
                  : 'bg-[#0284C7]/10 text-[#0284C7] hover:bg-[#0284C7] hover:text-white'
            }`}
          >
            <FileDown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          <button
            type="button"
            onClick={() =>
              switchReport(
                isEdicion3 ? 'ecosistema' : isBenchmark ? 'edicion3' : 'benchmark'
              )
            }
            title={
              isEdicion3
                ? 'Volver al Reporte Ecosistema Instagram (9 Láminas)'
                : isBenchmark
                  ? 'Abrir Edición N° 3 (13 Autoridades · Acceso Restringido)'
                  : 'Abrir Dashboard Benchmark 3D (28 Días)'
            }
            className={`hidden md:inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              isEdicion3
                ? 'bg-white/12 text-white hover:bg-white/20'
                : isBenchmark
                  ? 'bg-[#F59E0B]/15 text-[#F59E0B] hover:bg-[#F59E0B] hover:text-[#060B19]'
                  : 'bg-[#060B19] text-[#00F0FF] hover:bg-[#0F172A]'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>
              {isEdicion3 ? 'Ecosistema' : isBenchmark ? 'Edición N° 3' : 'Benchmark 3D'}
            </span>
          </button>
        </div>
      </div>
      )}

      {/* Live Professional Audio Narration & Auto-Presentation Teleprompter Bar */}
      {!isEdicion3Locked && (narration.showCaption || autoPresent || presentationCompleted) &&
        (teleprompterMinimized ? (
          <div
            data-html2canvas-ignore="true"
            className="fixed bottom-[4.25rem] right-3 z-30 max-w-[calc(100vw-1.5rem)] sm:bottom-16 sm:right-6"
          >
            <div
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs shadow-xl ${
                isDarkTheme ? 'dark-glass-panel text-slate-200' : 'glass-panel text-slate-700'
              }`}
            >
              <button
                type="button"
                onClick={narration.togglePlay}
                title={narration.isSpeaking ? 'Pausar narración' : 'Reproducir narración'}
                className={`inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold transition-colors ${
                  narration.isSpeaking || narration.isLoadingAudio
                    ? 'bg-[#FF2E93] text-white'
                    : 'bg-[#0284C7] text-white'
                }`}
              >
                {narration.isLoadingAudio ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : narration.isSpeaking ? (
                  <Pause className="h-3 w-3" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
                <span>
                  {autoPresent
                    ? `Auto ${isEdicion3 ? 'Ed.3' : !isBenchmark ? '1/2' : '2/2'}`
                    : narration.isSpeaking
                      ? 'Audio'
                      : 'Pausa'}
                </span>
              </button>

              {narration.autoplayBlocked && (
                <button
                  type="button"
                  onClick={() => {
                    narration.unlockAudio();
                    void narration.speakCurrent();
                  }}
                  className="inline-flex h-6 items-center gap-1 rounded-full bg-amber-500 px-2 text-[11px] font-semibold text-white hover:bg-amber-600"
                >
                  <Volume2 className="h-3 w-3" /> Activar
                </button>
              )}

              {activeCue && (
                <div
                  className={`hidden h-1.5 w-14 overflow-hidden rounded-full sm:block ${
                    isDarkTheme ? 'bg-white/15' : 'bg-slate-200'
                  }`}
                  title={`Cámara: ${activeCue.focusBadge}`}
                >
                  <div
                    className={`h-full rounded-full transition-[width] duration-150 ${
                      isEdicion3 ? 'bg-[#F59E0B]' : isBenchmark ? 'bg-[#00F0FF]' : 'bg-[#0284C7]'
                    }`}
                    style={{ width: `${Math.round(narration.progress * 100)}%` }}
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => setTeleprompterMinimized(false)}
                title="Expandir teleprompter (M)"
                aria-label="Expandir barra de narración"
                className={`inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-semibold transition-colors ${
                  isDarkTheme
                    ? 'bg-white/10 text-[#00F0FF] hover:bg-white/20'
                    : 'bg-slate-900/6 text-[#0284C7] hover:bg-slate-900/12'
                }`}
              >
                <ChevronUp className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Expandir</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  clearAutoAdvanceTimer();
                  setAutoPresent(false);
                  setHighlightedRank(null);
                  setResetCameraNonce((n) => n + 1);
                  setPresentationCompleted(false);
                  setTeleprompterMinimized(false);
                  narration.stop();
                  narration.setAutoNarrate(false);
                  narration.setShowCaption(false);
                }}
                title="Cerrar y detener narración"
                aria-label="Cerrar barra de narración"
                className={`rounded-full p-1 transition-colors ${
                  isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-[#0F172A]'
                }`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div
            data-html2canvas-ignore="true"
            className="fixed bottom-[4.25rem] sm:bottom-16 left-1/2 z-30 w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2"
          >
            <div
              className={`rounded-2xl px-4 py-2.5 text-xs shadow-xl ${
                isDarkTheme ? 'dark-glass-panel text-slate-200' : 'glass-panel text-slate-700'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={narration.togglePlay}
                    className={`inline-flex h-6 items-center gap-1 rounded-md px-2 text-[11px] font-semibold transition-colors ${
                      narration.isSpeaking || narration.isLoadingAudio
                        ? 'bg-[#FF2E93] text-white'
                        : 'bg-[#0284C7] text-white'
                    }`}
                  >
                    {narration.isLoadingAudio ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" /> Generando voz...
                      </>
                    ) : narration.isSpeaking ? (
                      <>
                        <Pause className="h-3 w-3" /> Pausar
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3" /> Reproducir
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={narration.cycleVoice}
                    title="Cambiar locutor neural"
                    className={`inline-flex h-6 items-center gap-1 rounded-md px-2 text-[11px] font-semibold transition-colors ${
                      isDarkTheme
                        ? 'bg-[#10B981]/20 text-[#10B981] hover:bg-[#10B981]/30'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    <Sparkles className="h-3 w-3" />
                    {narration.engineMode === 'browser'
                      ? 'Voz Local'
                      : narration.voiceLabel}
                  </button>

                  <button
                    type="button"
                    onClick={() => narration.setAutoNarrate(!narration.autoNarrate)}
                    className={`h-6 rounded-md px-2 text-[11px] font-semibold transition-colors ${
                      narration.autoNarrate
                        ? 'bg-[#10B981] text-white'
                        : isDarkTheme
                          ? 'bg-white/10 text-slate-300 hover:bg-white/20'
                          : 'bg-slate-900/6 text-slate-600 hover:bg-slate-900/12'
                    }`}
                  >
                    {narration.autoNarrate ? 'Auto-narrar: ON' : 'Auto-narrar: OFF'}
                  </button>

                  <button
                    type="button"
                    onClick={narration.cycleRate}
                    className={`font-mono-tabular h-6 rounded-md px-2 text-[11px] font-semibold ${
                      isDarkTheme
                        ? 'bg-white/10 text-[#00F0FF] hover:bg-white/20'
                        : 'bg-slate-900/6 text-[#0284C7] hover:bg-slate-900/12'
                    }`}
                  >
                    {narration.rate.toFixed(2).replace(/\.00$/, '.0')}x
                  </button>

                  {autoPresent && (
                    <span
                      className={`inline-flex h-6 items-center gap-1 rounded-md px-2 text-[11px] font-semibold ${
                        isDarkTheme
                          ? 'bg-[#FF2E93]/20 text-[#FF2E93]'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      ● Auto-Keynote {isEdicion3 ? 'Ed. N° 3' : !isBenchmark ? '(1/2)' : '(2/2)'}
                    </span>
                  )}

                  {presentationCompleted && !autoPresent && (
                    <button
                      type="button"
                      onClick={startKeynoteFromBeginning}
                      className="inline-flex h-6 items-center gap-1 rounded-md bg-[#10B981] px-2 text-[11px] font-semibold text-white hover:bg-emerald-600"
                    >
                      <CheckCircle2 className="h-3 w-3" /> Recorrido completo · Repetir
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {narration.autoplayBlocked && (
                    <button
                      type="button"
                      onClick={() => {
                        narration.unlockAudio();
                        void narration.speakCurrent();
                      }}
                      className="inline-flex h-6 items-center gap-1 rounded-md bg-amber-500 px-2.5 text-[11px] font-semibold text-white hover:bg-amber-600"
                    >
                      <Volume2 className="h-3 w-3" /> Activar Audio
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setTeleprompterMinimized(true)}
                    title="Minimizar ventana sin detener el audio (M)"
                    aria-label="Minimizar barra de narración"
                    className={`inline-flex h-6 items-center gap-1 rounded-md px-2 text-[11px] font-semibold transition-colors ${
                      isDarkTheme
                        ? 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                        : 'bg-slate-900/6 text-slate-600 hover:bg-slate-900/12 hover:text-[#0F172A]'
                    }`}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Minimizar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      clearAutoAdvanceTimer();
                      setAutoPresent(false);
                      setHighlightedRank(null);
                      setResetCameraNonce((n) => n + 1);
                      setPresentationCompleted(false);
                      setTeleprompterMinimized(false);
                      narration.stop();
                      narration.setAutoNarrate(false);
                      narration.setShowCaption(false);
                    }}
                    title="Cerrar y detener narración"
                    aria-label="Cerrar barra de narración"
                    className={`rounded-md p-1 transition-colors ${
                      isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-[#0F172A]'
                    }`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {narration.errorNotice && narration.engineMode === 'browser' && (
                <p className="mt-1 text-[11px] text-amber-500">
                  Voz alternativa activa para esta pista (puedes volver a Sofía Neural HD cuando quieras).
                </p>
              )}
              {activeCue && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                      isEdicion3
                        ? 'border border-[#F59E0B]/35 bg-[#F59E0B]/12 text-[#F59E0B]'
                        : isBenchmark
                          ? 'border border-[#00F0FF]/35 bg-[#00F0FF]/12 text-[#00F0FF]'
                          : 'border border-[#0284C7]/25 bg-[#0284C7]/10 text-[#0284C7]'
                    }`}
                  >
                    <Focus className="h-3 w-3 shrink-0" />
                    <span>Cámara: {activeCue.focusBadge}</span>
                  </span>
                  <div
                    className={`h-1 flex-1 overflow-hidden rounded-full ${
                      isDarkTheme ? 'bg-white/10' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`h-full rounded-full transition-[width] duration-150 ${
                        isEdicion3 ? 'bg-[#F59E0B]' : isBenchmark ? 'bg-[#00F0FF]' : 'bg-[#0284C7]'
                      }`}
                      style={{ width: `${Math.round(narration.progress * 100)}%` }}
                    />
                  </div>
                </div>
              )}
              <p className="mt-1.5 line-clamp-2 leading-relaxed">
                {narration.activeScript}
              </p>
            </div>
          </div>
        ))}

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

      {/* Edición N° 3 Interactive Dual Word-Cloud Node Graph */}
      <Edicion3WordCloudNetwork
        isOpen={ed3WordNetworkOpen}
        onClose={() => setEd3WordNetworkOpen(false)}
      />

      {/* Edición N° 3 Access Audit Log Modal */}
      {ed3Session && (
        <Edicion3AccessLogModal
          isOpen={ed3LogModalOpen}
          onClose={() => setEd3LogModalOpen(false)}
          session={ed3Session}
          logs={ed3Logs}
          onRefreshLogs={() => void refreshEd3Logs()}
          onLockSession={() => {
            setEd3LogModalOpen(false);
            setEd3Session(null);
            narration.stop();
            setAutoPresent(false);
            try {
              window.sessionStorage.removeItem(EDICION3_SESSION_STORAGE_KEY);
            } catch {
              // Ignore storage errors
            }
          }}
        />
      )}
    </main>
  );
}
