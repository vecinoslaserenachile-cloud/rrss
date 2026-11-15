import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  FileDown,
  FileSpreadsheet,
  Globe,
  Image as ImageIcon,
  Loader2,
  Printer,
  X,
} from 'lucide-react';
import { SLIDES, SlideMeta } from '../data/coquimboData';

export type ExportMode = 'full-pdf' | 'current-pdf' | 'current-png';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSlideMeta: SlideMeta;
  isExporting: boolean;
  progress: { current: number; total: number; title: string } | null;
  errorMsg: string | null;
  onExport: (mode: ExportMode) => void;
}

const CLOUDFLARE_REPORT_ORIGIN = 'https://reporte.vecinoslaserena.cl';

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  activeSlideMeta,
  isExporting,
  progress,
  errorMsg,
  onExport,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCopiedLink(false);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExporting) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isExporting, onClose]);

  if (!isOpen) return null;

  const shareUrl = `${CLOUDFLARE_REPORT_ORIGIN}/?lamina=${activeSlideMeta.slug}`;
  const progressPct =
    progress && progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(false);
    }
  };

  return (
    <div
      data-html2canvas-ignore="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4"
      onClick={() => {
        if (!isExporting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="glass-panel w-full max-w-lg rounded-2xl border border-slate-900/12 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-900/10 pb-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#0284C7]">
              REPORTE.VECINOSLASERENA.CL · EXPORTACIÓN Y ENVÍO
            </p>
            <h2
              id="export-modal-title"
              className="font-display mt-1 text-xl font-bold text-[#0F172A]"
            >
              Compartir o Descargar Reporte
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Comparte el enlace directo en Cloudflare o descarga un reporte estático en PDF/PNG con las escenas 3D renderizadas y tablas auditadas.
            </p>
          </div>
          <button
            type="button"
            disabled={isExporting}
            onClick={onClose}
            aria-label="Cerrar ventana de exportación"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#0F172A] disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Shareable Cloudflare Web URL Bar */}
        <div className="mt-4 rounded-xl border border-slate-900/10 bg-slate-50/90 p-3">
          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-[#0284C7]" />
              Enlace directo de lámina para terceros
            </span>
            <span className="text-[#10B981]">Cloudflare Web</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <code className="font-mono-tabular flex-1 truncate rounded-lg border border-slate-900/10 bg-white px-2.5 py-1.5 text-xs text-[#0F172A]">
              {shareUrl}
            </code>
            <button
              type="button"
              onClick={handleCopyShareLink}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                copiedLink
                  ? 'bg-[#10B981] text-white'
                  : 'bg-[#0F172A] text-white hover:bg-slate-800'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copiar URL
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          {/* Option 1: Full 9-slide executive PDF + audited tables appendix */}
          <button
            type="button"
            disabled={isExporting}
            onClick={() => onExport('full-pdf')}
            className="group flex w-full items-start gap-3.5 rounded-xl border border-[#0284C7]/25 bg-[#0284C7]/[0.06] p-3.5 text-left transition-all hover:border-[#0284C7]/50 hover:bg-[#0284C7]/10 disabled:cursor-wait disabled:opacity-60"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0284C7] text-white shadow-sm">
              <FileDown className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-sm font-bold text-[#0F172A]">
                  Reporte Ejecutivo Completo (PDF)
                </span>
                <span className="font-mono-tabular rounded-md bg-[#0284C7] px-2 py-0.5 text-[11px] font-semibold text-white">
                  {SLIDES.length} láminas + anexo
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Captura las {SLIDES.length} visualizaciones 3D en formato apaisado 16:9 e incluye página anexa con los rankings completos del Top 20 y 22 actores.
              </p>
            </div>
          </button>

          {/* Option 2: Current slide state PDF */}
          <button
            type="button"
            disabled={isExporting}
            onClick={() => onExport('current-pdf')}
            className="flex w-full items-start gap-3.5 rounded-xl border border-slate-900/10 bg-white p-3.5 text-left transition-all hover:border-slate-900/25 hover:bg-slate-50/80 disabled:cursor-wait disabled:opacity-60"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0F172A] text-white">
              <Printer className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-sm font-bold text-[#0F172A]">
                  Lámina Actual en PDF (Estado Activo)
                </span>
                <span className="font-mono-tabular text-[11px] font-semibold text-slate-500">
                  Lámina {String(activeSlideMeta.id + 1).padStart(2, '0')}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Guarda exactamente el ángulo 3D actual, filtros aplicados en tabla y métricas activas de «{activeSlideMeta.shortLabel}».
              </p>
            </div>
          </button>

          {/* Option 3: Current slide PNG */}
          <button
            type="button"
            disabled={isExporting}
            onClick={() => onExport('current-png')}
            className="flex w-full items-start gap-3.5 rounded-xl border border-slate-900/10 bg-white p-3.5 text-left transition-all hover:border-slate-900/25 hover:bg-slate-50/80 disabled:cursor-wait disabled:opacity-60"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#10B981] text-white">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-sm font-bold text-[#0F172A]">
                  Captura Imagen PNG Alta Resolución
                </span>
                <span className="font-mono-tabular text-[11px] font-semibold text-[#10B981]">
                  2x Retina
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Descarga instantánea en PNG lista para compartir por WhatsApp, correo o incrustar en presentaciones.
              </p>
            </div>
          </button>
        </div>

        {/* Live Progress Bar */}
        {isExporting && (
          <div className="mt-4 rounded-xl border border-[#0284C7]/20 bg-sky-50/80 p-3.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-semibold text-[#0F172A]">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0284C7]" />
                <span>
                  {progress
                    ? `Capturando lámina ${progress.current} de ${progress.total}: ${progress.title}`
                    : 'Renderizando escena 3D y componiendo archivo...'}
                </span>
              </div>
              {progress && (
                <span className="font-mono-tabular font-bold text-[#0284C7]">
                  {progressPct}%
                </span>
              )}
            </div>
            {progress && (
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#0284C7] transition-all duration-200"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
            <FileSpreadsheet className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
