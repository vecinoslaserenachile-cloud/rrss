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

