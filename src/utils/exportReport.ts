import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import {
  ACTORS_LIKES_DATA,
  SLIDES,
  TOP_20_LIKES,
  formatSpanishInt,
} from '../data/coquimboData';

export interface ExportableSlideMeta {
  id: number;
  slug: string;
  shortLabel: string;
  title: string;
}

export type ExportTheme = 'light' | 'dark';

// 16:9 Widescreen executive slide dimensions in mm (13.333 in x 7.5 in)
const PDF_PAGE_W = 338.67;
const PDF_PAGE_H = 190.5;
const FOOTER_H = 10;

function waitFrames(count = 2): Promise<void> {
  return new Promise((resolve) => {
    let remaining = count;
    const step = () => {
      remaining -= 1;
      if (remaining <= 0) {
        resolve();
      } else {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  });
}

function triggerDownload(blobOrUrl: Blob | string, filename: string) {
  const url =
    typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (typeof blobOrUrl !== 'string') {
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
}

async function captureStageCanvas(
  stageEl: HTMLElement,
  theme: ExportTheme = 'light'
): Promise<HTMLCanvasElement> {
  const captureScale = Math.min(window.devicePixelRatio || 1.5, 2);
  return html2canvas(stageEl, {
    backgroundColor: theme === 'dark' ? '#060B19' : '#F4F7FB',
    scale: captureScale,
    useCORS: true,
    allowTaint: false,
    logging: false,
  });
}

function drawSlidePageInPdf(
  doc: jsPDF,
  capturedCanvas: HTMLCanvasElement,
  slideNum: number,
  totalSlides: number,
  slideLabel: string,
  issuedDate: string,
  theme: ExportTheme = 'light',
  reportSubtitle = 'Coquimbo Digital 2026 (14 oct – 14 nov)',
  unitWord = 'Lámina'
) {
  const isDark = theme === 'dark';

  // Background fill
  if (isDark) {
    doc.setFillColor(6, 11, 25);
  } else {
    doc.setFillColor(244, 247, 251);
  }
  doc.rect(0, 0, PDF_PAGE_W, PDF_PAGE_H, 'F');

  const availW = PDF_PAGE_W;
  const availH = PDF_PAGE_H - FOOTER_H;
  const srcRatio = capturedCanvas.width / capturedCanvas.height;
  const dstRatio = availW / availH;

  let drawW = availW;
  let drawH = availH;
  let offsetX = 0;
  let offsetY = 0;

  if (srcRatio > dstRatio) {
    drawW = availW;
    drawH = availW / srcRatio;
    offsetY = (availH - drawH) / 2;
  } else {
    drawH = availH;
    drawW = availH * srcRatio;
    offsetX = (availW - drawW) / 2;
  }

  const imgData = capturedCanvas.toDataURL('image/jpeg', 0.94);
  doc.addImage(imgData, 'JPEG', offsetX, offsetY, drawW, drawH, undefined, 'FAST');

  // Crisp bottom executive footer strip
  if (isDark) {
    doc.setFillColor(10, 17, 36);
    doc.rect(0, PDF_PAGE_H - FOOTER_H, PDF_PAGE_W, FOOTER_H, 'F');
    doc.setDrawColor(30, 41, 59);
  } else {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, PDF_PAGE_H - FOOTER_H, PDF_PAGE_W, FOOTER_H, 'F');
    doc.setDrawColor(226, 232, 240);
  }
  doc.setLineWidth(0.3);
  doc.line(0, PDF_PAGE_H - FOOTER_H, PDF_PAGE_W, PDF_PAGE_H - FOOTER_H);

  // Accent bar
  if (isDark) {
    doc.setFillColor(0, 240, 255);
  } else {
    doc.setFillColor(2, 132, 199);
  }
  doc.rect(10, PDF_PAGE_H - FOOTER_H + 3.2, 2.2, 3.6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  if (isDark) {
    doc.setTextColor(248, 250, 252);
  } else {
    doc.setTextColor(15, 23, 42);
  }
  doc.text('reporte.vecinoslaserena.cl', 14.5, PDF_PAGE_H - 3.6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  if (isDark) {
    doc.setTextColor(148, 163, 184);
  } else {
    doc.setTextColor(100, 116, 139);
  }
  doc.text(
    `${reportSubtitle}  ·  ${slideLabel}  ·  ${issuedDate}`,
    60,
    PDF_PAGE_H - 3.6
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  if (isDark) {
    doc.setTextColor(0, 240, 255);
  } else {
    doc.setTextColor(2, 132, 199);
  }
  doc.text(
    `${unitWord} ${String(slideNum).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}`,
    PDF_PAGE_W - 10,
    PDF_PAGE_H - 3.6,
    { align: 'right' }
  );
}

function drawAuditedTablesAppendixPage(doc: jsPDF, issuedDate: string) {
  doc.addPage([PDF_PAGE_W, PDF_PAGE_H], 'landscape');

  doc.setFillColor(244, 247, 251);
  doc.rect(0, 0, PDF_PAGE_W, PDF_PAGE_H, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(2, 132, 199);
  doc.text('ANEXO ESTADÍSTICO COMPLETO · DATOS AUDITADOS', 12, 12);

  doc.setFontSize(17);
  doc.setTextColor(15, 23, 42);
  doc.text('Detalle Íntegro de Rankings: Top 20 y 22 Actores (@Instagram)', 12, 19.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Consolidado completo sin desplazamiento de tabla para lectura ejecutiva e impresión directa.',
    12,
    24.5
  );

  const cardY = 29;
  const cardH = 148;
  const leftX = 12;
  const leftW = 152;
  const rightX = 172;
  const rightW = 154.67;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(leftX, cardY, leftW, cardH, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Ranking Top 20 Me Gusta (3.132.700 total)', leftX + 5, cardY + 7);

  const lHeadY = cardY + 13;
  doc.setFillColor(241, 245, 249);
  doc.rect(leftX + 4, lHeadY - 3.5, leftW - 8, 5.5, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('#', leftX + 6, lHeadY);
  doc.text('Perfil', leftX + 14, lHeadY);
  doc.text('Segmento', leftX + 76, lHeadY);
  doc.text('Cuota %', leftX + 123, lHeadY, { align: 'right' });
  doc.text('Me gusta', leftX + leftW - 6, lHeadY, { align: 'right' });

  TOP_20_LIKES.forEach((row, idx) => {
    const ry = lHeadY + 6.2 + idx * 6.35;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(leftX + 4, ry - 4, leftW - 8, 6, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.3);
    doc.setTextColor(100, 116, 139);
    doc.text(String(row.rank).padStart(2, '0'), leftX + 6, ry);

    doc.setTextColor(15, 23, 42);
    doc.text(row.name, leftX + 14, ry);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(row.category, leftX + 76, ry);

    doc.text(
      `${row.shareOfLikes.toFixed(2).replace('.', ',')}%`,
      leftX + 123,
      ry,
      { align: 'right' }
    );

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(2, 132, 199);
    doc.text(formatSpanishInt(row.likes), leftX + leftW - 6, ry, { align: 'right' });
  });

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightX, cardY, rightW, cardH, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Detalle por Actor @Instagram (22 cuentas · 3.107.800)', rightX + 5, cardY + 7);

  const rHeadY = cardY + 13;
  doc.setFillColor(241, 245, 249);
  doc.rect(rightX + 4, rHeadY - 3.5, rightW - 8, 5.5, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('#', rightX + 6, rHeadY);
  doc.text('Cuenta @Instagram', rightX + 13, rHeadY);
  doc.text('Seguid.', rightX + 78, rHeadY, { align: 'right' });
  doc.text('Posts', rightX + 95, rHeadY, { align: 'right' });
  doc.text('Interacc.', rightX + 115, rHeadY, { align: 'right' });
  doc.text('Rend.', rightX + 131, rHeadY, { align: 'right' });
  doc.text('Me gusta', rightX + rightW - 6, rHeadY, { align: 'right' });

  ACTORS_LIKES_DATA.forEach((actor, idx) => {
    const ry = rHeadY + 5.8 + idx * 5.85;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(rightX + 4, ry - 3.7, rightW - 8, 5.5, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.0);
    doc.setTextColor(100, 116, 139);
    doc.text(String(actor.rank).padStart(2, '0'), rightX + 6, ry);

    doc.setTextColor(15, 23, 42);
    doc.text(actor.handle, rightX + 13, ry);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(actor.followersLabel, rightX + 78, ry, { align: 'right' });
    doc.text(String(actor.posts), rightX + 95, ry, { align: 'right' });
    doc.text(actor.interactionRate, rightX + 115, ry, { align: 'right' });
    doc.text(actor.performanceIndex, rightX + 131, ry, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(actor.likes > 0 ? 2 : 148, actor.likes > 0 ? 132 : 163, actor.likes > 0 ? 199 : 184);
    doc.text(actor.likesLabel, rightX + rightW - 6, ry, { align: 'right' });
  });

  doc.setFillColor(255, 255, 255);
  doc.rect(0, PDF_PAGE_H - FOOTER_H, PDF_PAGE_W, FOOTER_H, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(0, PDF_PAGE_H - FOOTER_H, PDF_PAGE_W, PDF_PAGE_H - FOOTER_H);

  doc.setFillColor(16, 185, 129);
  doc.rect(10, PDF_PAGE_H - FOOTER_H + 3.2, 2.2, 3.6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('reporte.vecinoslaserena.cl', 14.5, PDF_PAGE_H - 3.6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Anexo Estadístico Completo · Coquimbo Digital 2026 · ${issuedDate}`,
    60,
    PDF_PAGE_H - 3.6
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(16, 185, 129);
  doc.text('Anexo 10 / 10', PDF_PAGE_W - 10, PDF_PAGE_H - 3.6, { align: 'right' });
}

export async function exportCurrentSlidePng(
  stageEl: HTMLElement,
  slideMeta: ExportableSlideMeta,
  renderCurrentFrame: () => void,
  options?: { theme?: ExportTheme; prefix?: string }
): Promise<void> {
  renderCurrentFrame();
  await waitFrames(1);
  const canvas = await captureStageCanvas(stageEl, options?.theme ?? 'light');
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png', 1.0)
  );
  if (!blob) throw new Error('No se pudo generar la imagen PNG.');
  const num = String(slideMeta.id + 1).padStart(2, '0');
  const prefix = options?.prefix ?? 'Coquimbo_Digital_Lamina';
  triggerDownload(blob, `${prefix}_${num}_${slideMeta.slug}.png`);
}

export async function exportCurrentSlidePdf(
  stageEl: HTMLElement,
  slideMeta: ExportableSlideMeta,
  renderCurrentFrame: () => void,
  options?: {
    theme?: ExportTheme;
    totalCount?: number;
    prefix?: string;
    reportSubtitle?: string;
    unitWord?: string;
  }
): Promise<void> {
  const theme = options?.theme ?? 'light';
  renderCurrentFrame();
  await waitFrames(1);
  const canvas = await captureStageCanvas(stageEl, theme);
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [PDF_PAGE_W, PDF_PAGE_H],
    compress: true,
  });

  const issuedDate = new Date().toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  drawSlidePageInPdf(
    doc,
    canvas,
    slideMeta.id + 1,
    options?.totalCount ?? SLIDES.length,
    slideMeta.title,
    issuedDate,
    theme,
    options?.reportSubtitle,
    options?.unitWord
  );

  const num = String(slideMeta.id + 1).padStart(2, '0');
  const prefix = options?.prefix ?? 'Coquimbo_Digital_Lamina';
  doc.save(`${prefix}_${num}_${slideMeta.slug}.pdf`);
}

export interface FullPdfExportOptions {
  stageEl: HTMLElement;
  slides?: ExportableSlideMeta[];
  theme?: ExportTheme;
  filename?: string;
  reportSubtitle?: string;
  unitWord?: string;
  includeAppendix?: boolean;
  prepareSlide3D: (slideIdx: number) => void;
  setActiveSlideForCapture: (slideIdx: number) => void;
  onProgress?: (current: number, total: number, slideTitle: string) => void;
}

export async function exportFullPresentationPdf({
  stageEl,
  slides = SLIDES,
  theme = 'light',
  filename = 'Reporte_Coquimbo_Digital_2026.pdf',
  reportSubtitle = 'Coquimbo Digital 2026 (14 oct – 14 nov)',
  unitWord = 'Lámina',
  includeAppendix = true,
  prepareSlide3D,
  setActiveSlideForCapture,
  onProgress,
}: FullPdfExportOptions): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [PDF_PAGE_W, PDF_PAGE_H],
    compress: true,
  });

  const issuedDate = new Date().toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    onProgress?.(i + 1, slides.length, slide.title);

    setActiveSlideForCapture(i);
    await waitFrames(3);

    prepareSlide3D(i);
    await waitFrames(1);

    const canvas = await captureStageCanvas(stageEl, theme);

    if (i > 0) {
      doc.addPage([PDF_PAGE_W, PDF_PAGE_H], 'landscape');
    }

    drawSlidePageInPdf(
      doc,
      canvas,
      i + 1,
      slides.length,
      slide.title,
      issuedDate,
      theme,
      reportSubtitle,
      unitWord
    );
  }

  if (includeAppendix) {
    drawAuditedTablesAppendixPage(doc, issuedDate);
  }

  doc.save(filename);
}
