import * as THREE from 'three';
import { ActorEmblemKind } from '../data/globalActorsData';

function drawEmblemArtwork(
  ctx: CanvasRenderingContext2D,
  kind: ActorEmblemKind,
  cx: number,
  cy: number,
  accent: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  switch (kind) {
    case 'faro-laserena': {
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-26, 28);
      ctx.lineTo(26, 28);
      ctx.stroke();
      ctx.fillStyle = '#F8FAFC';
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-16, 28);
      ctx.lineTo(-10, -8);
      ctx.lineTo(10, -8);
      ctx.lineTo(16, 28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.fillRect(-9, -16, 18, 8);
      ctx.fillStyle = '#FFB800';
      ctx.beginPath();
      ctx.arc(0, -23, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFB800';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-26, -23);
      ctx.lineTo(-12, -23);
      ctx.moveTo(12, -23);
      ctx.lineTo(26, -23);
      ctx.stroke();
      break;
    }

    case 'cruz-coquimbo': {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(0, 22);
      ctx.moveTo(-19, -12);
      ctx.lineTo(19, -12);
      ctx.stroke();
      ctx.strokeStyle = '#F8FAFC';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.lineTo(0, 18);
      ctx.moveTo(-15, -12);
      ctx.lineTo(15, -12);
      ctx.stroke();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 14, 18, 0.25, Math.PI - 0.25);
      ctx.stroke();
      break;
    }

    case 'valle-ovalle': {
      ctx.fillStyle = '#FFB800';
      ctx.beginPath();
      ctx.arc(0, -16, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 22, 18, Math.PI, 0);
      ctx.stroke();
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(-28, 22);
      ctx.quadraticCurveTo(-14, 10, 0, 22);
      ctx.quadraticCurveTo(14, 34, 28, 22);
      ctx.stroke();
      break;
    }

    case 'astro-vicuna': {
      ctx.fillStyle = '#FFB800';
      ctx.beginPath();
      ctx.arc(-20, -22, 3.5, 0, Math.PI * 2);
      ctx.arc(20, -18, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1E293B';
      ctx.strokeStyle = accent;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 14, 20, Math.PI, 0);
      ctx.lineTo(20, 26);
      ctx.lineTo(-20, 26);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(14, -22);
      ctx.stroke();
      break;
    }

    case 'embalse-mpatria': {
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-28, -2);
      ctx.lineTo(-10, -22);
      ctx.lineTo(4, -10);
      ctx.lineTo(18, -24);
      ctx.lineTo(28, -2);
      ctx.stroke();
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-24, 6);
      ctx.lineTo(24, 6);
      ctx.lineTo(16, 26);
      ctx.lineTo(-16, 26);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-20, 16);
      ctx.lineTo(20, 16);
      ctx.stroke();
      break;
    }

    case 'costa-losvilos':
    case 'oro-illapel':
    case 'cordillera-salamanca': {
      ctx.fillStyle = '#FFB800';
      ctx.beginPath();
      ctx.arc(16, -18, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1E293B';
      ctx.strokeStyle = accent;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-28, 22);
      ctx.lineTo(-8, -10);
      ctx.lineTo(4, 5);
      ctx.lineTo(16, -12);
      ctx.lineTo(28, 22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'radio-wave': {
      ctx.strokeStyle = '#F8FAFC';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-12, 26);
      ctx.lineTo(0, -12);
      ctx.lineTo(12, 26);
      ctx.moveTo(-7, 13);
      ctx.lineTo(7, 13);
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(0, -16, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, -16, 15, Math.PI * 0.75, Math.PI * 1.25);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -16, 15, -Math.PI * 0.25, Math.PI * 0.25);
      ctx.stroke();
      break;
    }

    case 'press-sheet': {
      ctx.fillStyle = '#F8FAFC';
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(-22, -24, 44, 48, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.fillRect(-15, -16, 30, 9);
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(-15, -2, 14, 19);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(4, 2);
      ctx.lineTo(15, 2);
      ctx.moveTo(4, 9);
      ctx.lineTo(15, 9);
      ctx.moveTo(4, 16);
      ctx.lineTo(13, 16);
      ctx.stroke();
      break;
    }

    case 'sound-leaf':
    case 'cam-urban':
    case 'papaya-tv':
    case 'neighbors': {
      ctx.fillStyle = '#1E293B';
      ctx.strokeStyle = accent;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(-24, -18, 48, 36, 9);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(-7, -9);
      ctx.lineTo(12, 0);
      ctx.lineTo(-7, 9);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'persona-alcaldesa':
    case 'persona-diputado':
    case 'persona-ahumada':
    case 'persona-denis':
    case 'persona-vega': {
      // Stylized character bust portrait with civic sash / tie + distinct motif
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 32, 24, Math.PI, 0);
      ctx.fill();
      ctx.stroke();

      // Sash or Tie
      if (kind === 'persona-diputado') {
        ctx.fillStyle = '#FF2E93';
        ctx.beginPath();
        ctx.moveTo(-4, 10);
        ctx.lineTo(4, 10);
        ctx.lineTo(0, 27);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.strokeStyle = kind === 'persona-alcaldesa' ? '#0284C7' : accent;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-12, 11);
        ctx.lineTo(11, 29);
        ctx.stroke();
      }

      // Hair / Head silhouette
      if (kind === 'persona-alcaldesa') {
        ctx.fillStyle = '#92400E';
        ctx.beginPath();
        ctx.roundRect(-15, -24, 30, 28, 12);
        ctx.fill();
      }

      ctx.fillStyle = '#FED7AA';
      ctx.beginPath();
      ctx.arc(0, -8, 11.5, 0, Math.PI * 2);
      ctx.fill();

      if (kind !== 'persona-alcaldesa') {
        ctx.fillStyle = kind === 'persona-diputado' ? '#0F172A' : '#334155';
        ctx.beginPath();
        ctx.arc(0, -12, 12, Math.PI, 0);
        ctx.fill();
      } else {
        ctx.fillStyle = '#92400E';
        ctx.beginPath();
        ctx.arc(0, -13, 11.5, Math.PI, 0);
        ctx.fill();
      }

      // Special emblem pin
      if (kind === 'persona-ahumada') {
        ctx.fillStyle = '#00F0FF';
        ctx.beginPath();
        ctx.ellipse(22, -20, 9, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === 'persona-denis') {
        ctx.fillStyle = '#FF2E93';
        ctx.beginPath();
        ctx.arc(21, -18, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === 'persona-vega') {
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.arc(21, -18, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
  }

  ctx.restore();
}

/**
 * Creates a crisp 3D medallion sprite texture featuring a character portrait or
 * city/institution crest above a compact rank + handle + metric pill.
 */
export function createActorEmblemTexture(options: {
  rank: number;
  name: string;
  metric: string;
  color: string;
  emblemKind: ActorEmblemKind;
}): THREE.CanvasTexture {
  const { rank, name, metric, color, emblemKind } = options;
  const width = 256;
  const height = 280;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);

  const cx = width / 2;
  const cy = 96;
  const radius = 64;

  // Outer glowing circular medallion
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#091124';
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.stroke();

  // Draw crisp character or landmark crest inside the circle
  drawEmblemArtwork(ctx, emblemKind, cx, cy, color);

  // Rank chip at top-right of medallion
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(cx + 28, cy - 66, 52, 30, 10);
  ctx.fill();
  ctx.fillStyle = '#060B19';
  ctx.font = '800 20px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`#${rank}`, cx + 54, cy - 50);

  // Bottom dark glass name + metric pill
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.roundRect(12, 174, width - 24, 92, 18);
  ctx.fillStyle = 'rgba(10, 17, 34, 0.94)';
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(12, 174, width - 24, 92, 18);
  ctx.stroke();

  ctx.fillStyle = '#F8FAFC';
  ctx.font = '700 24px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const shortName = name.length > 17 ? `${name.slice(0, 15)}…` : name;
  ctx.fillText(shortName, cx, 204);

  ctx.fillStyle = color;
  ctx.font = '700 22px "JetBrains Mono", monospace';
  ctx.fillText(metric, cx, 240);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
