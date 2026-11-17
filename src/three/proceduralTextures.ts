import * as THREE from 'three';

/**
 * Generates a soft radial contact shadow texture for grounding 3D sculptures.
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.05,
    size / 2,
    size / 2,
    size * 0.48
  );
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.24)');
  grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.09)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Generates a subtle radial architectural grid texture for the light editorial floor stage.
 */
export function createStageGridTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;

  // Subtle concentric rings
  const radii = [120, 220, 320, 420, 490];
  radii.forEach((r, idx) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle =
      idx === radii.length - 1 ? 'rgba(2, 132, 199, 0.14)' : 'rgba(15, 23, 42, 0.065)';
    ctx.lineWidth = idx === radii.length - 1 ? 2 : 1.5;
    ctx.stroke();
  });

  // Crosshair radial spokes
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 90, cy + Math.sin(angle) * 90);
    ctx.lineTo(cx + Math.cos(angle) * 490, cy + Math.sin(angle) * 490);
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.045)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(maxAnisotropy, 8);
  return texture;
}

/**
 * Generates a crisp 2D canvas sprite texture for 3D floating hashtag/label cards.
 */
export function createTagTexture(
  label: string,
  sublabel: string,
  accentHex: string
): THREE.CanvasTexture {
  const width = 512;
  const height = 192;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);

  // Rounded card backdrop
  const pad = 12;
  const r = 28;
  const w = width - pad * 2;
  const h = height - pad * 2;

  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.16)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;

  ctx.beginPath();
  ctx.moveTo(pad + r, pad);
  ctx.lineTo(pad + w - r, pad);
  ctx.quadraticCurveTo(pad + w, pad, pad + w, pad + r);
  ctx.lineTo(pad + w, pad + h - r);
  ctx.quadraticCurveTo(pad + w, pad + h, pad + w - r, pad + h);
  ctx.lineTo(pad + r, pad + h);
  ctx.quadraticCurveTo(pad, pad + h, pad, pad + h - r);
  ctx.lineTo(pad, pad + r);
  ctx.quadraticCurveTo(pad, pad, pad + r, pad);
  ctx.closePath();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
  ctx.fill();
  ctx.restore();

  // Subtle colored top accent bar inside card
  ctx.fillStyle = accentHex;
  ctx.beginPath();
  ctx.roundRect(pad + 24, pad + 20, 44, 8, 4);
  ctx.fill();

  // Border
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.12)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Tag title
  ctx.fillStyle = '#0F172A';
  ctx.font = '700 44px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, pad + 26, pad + 78);

  // Sublabel
  ctx.fillStyle = accentHex;
  ctx.font = '600 32px "JetBrains Mono", monospace';
  ctx.fillText(sublabel, pad + 26, pad + 130);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Generates a permanent vertical label texture (name vertically + % badge at bottom)
 * anchored cleanly above each 3D cylindrical bar.
 */
export function createVerticalBarLabelTexture(
  name: string,
  pctLabel: string,
  accentHex: string
): THREE.CanvasTexture {
  const width = 140;
  const height = 560;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);

  const displayName = name.length > 21 ? `${name.slice(0, 19)}…` : name;

  // Measure vertical text length to size card cleanly from bottom upward
  ctx.font = '700 25px "Plus Jakarta Sans", system-ui, sans-serif';
  const textLen = Math.min(395, ctx.measureText(displayName).width);

  const cardW = 92;
  const cardX = (width - cardW) / 2;
  const bottomY = height - 10;
  const pctBadgeH = 44;
  const cardH = pctBadgeH + textLen + 36;
  const cardY = bottomY - cardH;

  // Vertical glass-white strip with soft drop shadow
  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.14)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;

  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 16);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = 'rgba(15, 23, 42, 0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 16);
  ctx.stroke();

  // Accent % badge at bottom of the vertical flag
  const badgePad = 6;
  ctx.fillStyle = accentHex;
  ctx.beginPath();
  ctx.roundRect(
    cardX + badgePad,
    bottomY - pctBadgeH - badgePad,
    cardW - badgePad * 2,
    pctBadgeH,
    11
  );
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 21px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pctLabel, width / 2, bottomY - badgePad - pctBadgeH / 2 + 1);

  // Vertical account / bar name reading bottom-to-top
  ctx.save();
  ctx.translate(width / 2, bottomY - pctBadgeH - badgePad - 16);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#0F172A';
  ctx.font = '700 25px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(displayName, 0, 1, 395);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Generates a compact permanent floating label for 3D pie wedges / peak nodes.
 */
export function createPieSliceLabelTexture(
  name: string,
  pctLabel: string,
  accentHex: string
): THREE.CanvasTexture {
  const width = 380;
  const height = 104;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.16)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  ctx.roundRect(10, 10, width - 20, height - 20, 18);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = 'rgba(15, 23, 42, 0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(10, 10, width - 20, height - 20, 18);
  ctx.stroke();

  // Left color swatch
  ctx.fillStyle = accentHex;
  ctx.beginPath();
  ctx.roundRect(24, 26, 10, height - 52, 5);
  ctx.fill();

  // Name
  ctx.fillStyle = '#0F172A';
  ctx.font = '700 26px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const shortName = name.length > 18 ? `${name.slice(0, 16)}…` : name;
  ctx.fillText(shortName, 46, 40);

  // Percentage
  ctx.fillStyle = accentHex;
  ctx.font = '700 24px "JetBrains Mono", monospace';
  ctx.fillText(pctLabel, 46, 70);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Generates a subtle sci-fi telemetry radial + orthogonal dark floor grid texture.
 */
export function createDarkTelemetryGridTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  const step = 64;
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= size; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  const cx = size / 2;
  const cy = size / 2;
  [140, 260, 380, 480].forEach((r, idx) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle =
      idx === 3 ? 'rgba(255, 46, 147, 0.22)' : 'rgba(0, 240, 255, 0.16)';
    ctx.lineWidth = idx === 3 ? 2 : 1.5;
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(maxAnisotropy, 8);
  return texture;
}

/**
 * Generates a dark glassmorphism vertical bar label texture for Benchmark 3D bars.
 */
export function createDarkVerticalBarLabelTexture(
  name: string,
  pctLabel: string,
  accentHex: string
): THREE.CanvasTexture {
  const width = 148;
  const height = 560;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);

  const displayName = name.length > 22 ? `${name.slice(0, 20)}…` : name;
  ctx.font = '700 24px "Plus Jakarta Sans", system-ui, sans-serif';
  const textLen = Math.min(390, ctx.measureText(displayName).width);

  const cardW = 94;
  const cardX = (width - cardW) / 2;
  const bottomY = height - 10;
  const pctBadgeH = 44;
  const cardH = pctBadgeH + textLen + 36;
  const cardY = bottomY - cardH;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;

  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 16);
  ctx.fillStyle = 'rgba(11, 18, 36, 0.9)';
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 16);
  ctx.stroke();

  const badgePad = 6;
  ctx.fillStyle = accentHex;
  ctx.beginPath();
  ctx.roundRect(
    cardX + badgePad,
    bottomY - pctBadgeH - badgePad,
    cardW - badgePad * 2,
    pctBadgeH,
    11
  );
  ctx.fill();

  ctx.fillStyle = '#060B19';
  ctx.font = '700 21px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pctLabel, width / 2, bottomY - badgePad - pctBadgeH / 2 + 1);

  ctx.save();
  ctx.translate(width / 2, bottomY - pctBadgeH - badgePad - 16);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#F8FAFC';
  ctx.font = '700 24px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(displayName, 0, 1, 390);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Generates a dark glass floating badge for 3D scatter nodes, donut slices, and axis ticks.
 */
export function createDarkFloatingBadgeTexture(
  title: string,
  sublabel: string,
  accentHex: string
): THREE.CanvasTexture {
  const width = 420;
  const height = 112;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  ctx.roundRect(10, 10, width - 20, height - 20, 18);
  ctx.fillStyle = 'rgba(10, 17, 34, 0.92)';
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(10, 10, width - 20, height - 20, 18);
  ctx.stroke();

  ctx.fillStyle = accentHex;
  ctx.beginPath();
  ctx.roundRect(24, 26, 10, height - 52, 5);
  ctx.fill();

  ctx.fillStyle = '#F8FAFC';
  ctx.font = '700 25px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const shortTitle = title.length > 23 ? `${title.slice(0, 21)}…` : title;
  ctx.fillText(shortTitle, 46, 42);

  ctx.fillStyle = accentHex;
  ctx.font = '700 22px "JetBrains Mono", monospace';
  ctx.fillText(sublabel, 46, 74);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Generates a wide horizontal podium nameplate texture ("a lo ancho") for 3D spiral staircase tiers,
 * displaying full rank + authority name on the top row and metrics/distinction below without truncation.
 */
export function createDarkWidePodiumPlacaTexture(
  rankLabel: string,
  fullName: string,
  metricsLine: string,
  detailLine: string | undefined,
  accentHex: string
): THREE.CanvasTexture {
  const width = 680;
  const height = detailLine ? 228 : 172;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.78)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 5;
  ctx.beginPath();
  ctx.roundRect(10, 10, width - 20, height - 20, 22);
  ctx.fillStyle = 'rgba(7, 13, 28, 0.96)';
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = accentHex;
  ctx.globalAlpha = 0.72;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.roundRect(10, 10, width - 20, height - 20, 22);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Rank pill box on left side
  ctx.fillStyle = accentHex;
  ctx.beginPath();
  ctx.roundRect(26, 26, 86, 48, 12);
  ctx.fill();

  ctx.fillStyle = '#060B19';
  ctx.font = '800 28px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(rankLabel, 69, 51);

  // Full authority name horizontally across the full width of the plaque
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 35px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(fullName, 128, 51, width - 154);

  // Divider accent hairline
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.fillRect(26, 88, width - 52, 2);

  // Metrics line horizontally below
  ctx.fillStyle = accentHex;
  ctx.font = '700 27px "JetBrains Mono", monospace';
  ctx.fillText(metricsLine, 26, detailLine ? 124 : 126, width - 52);

  // Optional record/detail line across bottom
  if (detailLine) {
    ctx.fillStyle = '#E2E8F0';
    ctx.font = '600 24px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(detailLine, 26, 174, width - 52);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Generates an illuminated engraved stair tread texture spanning across the full radial width
 * of each wide 3D spiral stair step, showing rank, full name, and key podium metrics directly on the step.
 */
export function createDarkStairTreadNameTexture(
  rankLabel: string,
  fullName: string,
  metricsLine: string,
  accentHex: string
): THREE.CanvasTexture {
  const width = 768;
  const height = 224;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#091124');
  grad.addColorStop(0.55, '#0F1A36');
  grad.addColorStop(1, '#081020');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Left & top stair nosing metallic trim
  ctx.fillStyle = accentHex;
  ctx.fillRect(0, 0, 14, height);
  ctx.globalAlpha = 0.7;
  ctx.fillRect(0, height - 10, width, 10);
  ctx.globalAlpha = 1;

  // Inner rank medallion
  ctx.fillStyle = accentHex;
  ctx.beginPath();
  ctx.roundRect(34, 34, 104, 62, 14);
  ctx.fill();

  ctx.fillStyle = '#060B19';
  ctx.font = '800 34px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(rankLabel, 86, 66);

  // Authority name written cleanly across the wide stair tread
  ctx.fillStyle = '#F8FAFC';
  ctx.font = '800 44px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(fullName, 160, 68, width - 190);

  // Podium metrics spanning the bottom stair band
  ctx.fillStyle = accentHex;
  ctx.font = '700 30px "JetBrains Mono", monospace';
  ctx.fillText(metricsLine, 36, 152, width - 72);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Generates an ultra-crisp 1024x272 full-width fascia marquee for always-upright 3D spiral stair sprites,
 * maximizing legibility with oversized rank badge, bold full authority name, and high-contrast key metrics.
 */
export function createDarkFullWidthStairBannerTexture(
  rankLabel: string,
  fullName: string,
  handle: string,
  metricsLine: string,
  distinction: string | undefined,
  accentHex: string,
  isPodiumTop3: boolean
): THREE.CanvasTexture {
  const width = 1024;
  const height = 272;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);

  // Executive high-contrast obsidian backdrop with crisp bevel shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.88)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 6;
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#050A18');
  bgGrad.addColorStop(0.55, '#0B142B');
  bgGrad.addColorStop(1, '#070E20');
  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.roundRect(8, 8, width - 16, height - 16, 26);
  ctx.fill();
  ctx.restore();

  // Bright outer perimeter border
  ctx.strokeStyle = isPodiumTop3 ? '#F59E0B' : accentHex;
  ctx.lineWidth = isPodiumTop3 ? 7 : 5;
  ctx.beginPath();
  ctx.roundRect(8, 8, width - 16, height - 16, 26);
  ctx.stroke();

  // Top luminous accent bar
  ctx.fillStyle = isPodiumTop3 ? '#F59E0B' : accentHex;
  ctx.beginPath();
  ctx.roundRect(24, 14, width - 48, 6, 3);
  ctx.fill();

  // Giant Rank badge block on far left
  ctx.fillStyle = accentHex;
  ctx.beginPath();
  ctx.roundRect(24, 30, 144, height - 60, 18);
  ctx.fill();

  ctx.fillStyle = '#050914';
  ctx.font = '800 58px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(rankLabel, 96, height / 2 + 2);

  // Giant ultra-crisp full authority name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 54px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(fullName, 192, 82, width - 224);

  // Handle / distinction subtitle row
  ctx.fillStyle = isPodiumTop3 ? '#FDE68A' : '#CBD5E1';
  ctx.font = '600 30px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(distinction ? `${distinction}  ·  ${handle}` : handle, 192, 138, width - 224);

  // Divider rule
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.fillRect(192, 168, width - 224, 3);

  // Scannable large key metrics row
  ctx.fillStyle = accentHex;
  ctx.font = '800 38px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(metricsLine, 192, 214, width - 224);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates an additive radial starburst glow texture ("destello") for 3D selected stair bursts.
 */
export function createDarkDestelloFlareTexture(accentHex: string): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, size * 0.48);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.18, 'rgba(253, 224, 71, 0.92)');
  grad.addColorStop(0.42, `${accentHex}99`);
  grad.addColorStop(0.75, `${accentHex}28`);
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Crisp horizontal & vertical star glint rays
  ctx.save();
  ctx.translate(cx, cy);
  const hRay = ctx.createLinearGradient(-cx * 0.92, 0, cx * 0.92, 0);
  hRay.addColorStop(0, 'rgba(255,255,255,0)');
  hRay.addColorStop(0.5, 'rgba(255,255,255,0.85)');
  hRay.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hRay;
  ctx.fillRect(-cx * 0.92, -3, size * 0.92, 6);

  const vRay = ctx.createLinearGradient(0, -cy * 0.72, 0, cy * 0.72);
  vRay.addColorStop(0, 'rgba(255,255,255,0)');
  vRay.addColorStop(0.5, 'rgba(255,255,255,0.75)');
  vRay.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = vRay;
  ctx.fillRect(-3, -cy * 0.72, 6, size * 0.72);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}


