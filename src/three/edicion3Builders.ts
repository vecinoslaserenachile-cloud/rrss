import * as THREE from 'three';
import {
  EDICION3_AUTHORITIES,
  EDICION3_FORMATS,
  EDICION3_SENTIMENT,
  EDICION3_TOP_HASHTAGS,
} from '../data/edicion3Data';
import {
  createDarkDestelloFlareTexture,
  createDarkFloatingBadgeTexture,
  createDarkFullWidthStairBannerTexture,
  createDarkVerticalBarLabelTexture,
} from './proceduralTextures';
import { BuiltSlideScene, HoverPayload } from './slideBuilders';

export type Edicion3DuelMode = 'totals' | 'efficiency';

export interface SpiralStepFocusMeta {
  rank: number;
  worldAnchor: [number, number, number];
  focusCamera: {
    position: [number, number, number];
    target: [number, number, number];
  };
  stairSprite: THREE.Sprite;
  destelloFlare: THREE.Sprite;
  flashRing: THREE.Mesh;
  flashRingOuter: THREE.Mesh;
  highlightHalo: THREE.Mesh;
  baseSpriteScale: [number, number, number];
}

export interface SpiralBaseTimeSeriesRef {
  group: THREE.Group;
  baseY: number;
  maxBarHeight: number;
  xPositions: number[];
  currentBars: THREE.Mesh[];
  prevBars: THREE.Mesh[];
  currentDots: THREE.Mesh[];
  prevDots: THREE.Mesh[];
  currentLineSegs: THREE.Mesh[];
  prevLineSegs: THREE.Mesh[];
  titleSprite: THREE.Sprite;
  hitBox: THREE.Mesh;
  activeRank: number;
  currentBarHeights: number[];
  prevBarHeights: number[];
  currentColor: THREE.Color;
}

function calcVariancePct(value: number, average: number): number {
  if (average === 0) return 0;
  return ((value - average) / average) * 100;
}

function makeEditorialMaterial(colorHex: string, emissiveIntensity = 0.24, opacity = 1) {
  const c = new THREE.Color(colorHex);
  return new THREE.MeshPhysicalMaterial({
    color: c,
    roughness: 0.18,
    metalness: 0.45,
    clearcoat: 0.85,
    clearcoatRoughness: 0.14,
    emissive: c,
    emissiveIntensity,
    transparent: opacity < 1,
    opacity,
  });
}

function registerHoverable(
  obj: THREE.Object3D,
  hoverables: THREE.Object3D[],
  payload: HoverPayload,
  targetMatMesh?: THREE.Mesh
) {
  obj.layers.enable(1);
  obj.userData.tooltip = payload;
  obj.userData.highlightMesh = targetMatMesh ?? obj;
  obj.userData.baseEmissiveIntensity =
    targetMatMesh?.material instanceof THREE.MeshStandardMaterial
      ? targetMatMesh.material.emissiveIntensity
      : 0.24;
  hoverables.push(obj);
}

function createColumnBar(options: {
  radius: number;
  height: number;
  color: string;
  position: [number, number, number];
  payload: HoverPayload;
  hoverables: THREE.Object3D[];
  labelName: string;
  labelMetric: string;
  crown?: boolean;
  labelScale?: number;
}): { barGroup: THREE.Group; shaft: THREE.Mesh } {
  const {
    radius,
    height,
    color,
    position,
    payload,
    hoverables,
    labelName,
    labelMetric,
    crown = false,
    labelScale = 0.84,
  } = options;

  const barGroup = new THREE.Group();
  barGroup.position.set(position[0], position[1], position[2]);

  const safeH = Math.max(0.24, height);

  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 1.18, radius * 1.28, 0.12, 32),
    new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.35, metalness: 0.82 })
  );
  collar.position.y = 0.06;
  barGroup.add(collar);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 1.22, 0.018, 10, 36),
    new THREE.MeshBasicMaterial({ color })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.12;
  barGroup.add(rim);

  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.92, radius, safeH, 36),
    makeEditorialMaterial(color, 0.22, 0.96)
  );
  shaft.position.y = 0.12 + safeH / 2;
  barGroup.add(shaft);

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.72, radius * 0.92, 0.08, 32),
    new THREE.MeshStandardMaterial({
      color: '#F8FAFC',
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.38,
      roughness: 0.2,
      metalness: 0.6,
    })
  );
  cap.position.y = 0.12 + safeH + 0.04;
  barGroup.add(cap);

  if (crown) {
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 1.4, 0.042, 16, 48),
      makeEditorialMaterial(color, 0.5)
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.12 + safeH + 0.36;
    barGroup.add(halo);
    registerHoverable(halo, hoverables, payload, shaft);
  }

  const stemBaseY = crown ? 0.12 + safeH + 0.42 : 0.12 + safeH + 0.08;
  const stemH = 0.16;
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, stemH, 8),
    new THREE.MeshBasicMaterial({ color })
  );
  stem.position.y = stemBaseY + stemH / 2;
  barGroup.add(stem);

  const tex = createDarkVerticalBarLabelTexture(labelName, labelMetric, color);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  const spriteH = 2.05 * labelScale;
  const spriteW = spriteH * (148 / 560);
  sprite.scale.set(spriteW, spriteH, 1);
  sprite.position.set(0, stemBaseY + stemH + spriteH * 0.5, 0);
  barGroup.add(sprite);

  registerHoverable(shaft, hoverables, payload, shaft);
  registerHoverable(collar, hoverables, payload, shaft);

  return { barGroup, shaft };
}

/**
 * Computes zero-collision coordinates along a wide ascending conical spiral staircase for all 13 actors:
 * i = 0 (#13 base foreground) ascending up to i = 12 (#01 supreme crown apex).
 */
export function getSpiralPodiumCoordinates(
  indexFromBottom: number,
  total = 13,
  variant: 'podium' | 'ranking' = 'podium'
): {
  x: number;
  y: number;
  z: number;
  theta: number;
  t: number;
  rx: number;
  rz: number;
} {
  const t = total > 1 ? indexFromBottom / (total - 1) : 1;
  const isRanking = variant === 'ranking';
  const offsetX = isRanking ? 4.2 : 3.1;
  const rx0 = isRanking ? 9.0 : 9.8;
  const rx1 = isRanking ? 4.9 : 5.2;
  const rz0 = isRanking ? 3.2 : 3.4;
  const rz1 = isRanking ? 1.9 : 2.0;
  const y0 = 0.75;
  const y1 = isRanking ? 11.5 : 11.6;

  const theta = Math.PI * 0.92 - t * (Math.PI * 2 * 1.22);
  const rx = rx0 + (rx1 - rx0) * t;
  const rz = rz0 + (rz1 - rz0) * t;
  const x = offsetX + Math.cos(theta) * rx;
  const z = Math.sin(theta) * rz;
  const y = y0 + (y1 - y0) * Math.pow(t, 0.95);
  return { x, y, z, theta, t, rx, rz };
}

export function getSpiralStepFocusCamera(
  x: number,
  y: number,
  z: number,
  variant: 'podium' | 'ranking' = 'podium'
): { position: [number, number, number]; target: [number, number, number] } {
  const offsetX = variant === 'ranking' ? 4.2 : 3.1;
  const dx = x - offsetX;
  const norm = Math.hypot(dx, z) || 1;
  // Position close-up camera slightly outward & forward, looking down slightly so stair sits above bottom UI
  const camX = x + (dx / norm) * 1.5;
  const camZ = z + 7.4;
  const camY = y + 1.85;
  const targetY = Math.max(0.3, y + 0.15);
  return {
    position: [Number(camX.toFixed(2)), Number(camY.toFixed(2)), Number(camZ.toFixed(2))],
    target: [Number(x.toFixed(2)), Number(targetY.toFixed(2)), Number(z.toFixed(2))],
  };
}

function getSpecialDetailLabel(rank: number): string | undefined {
  if (rank === 1) return 'Líder Me Gusta y Com.';
  if (rank === 2) return 'Mayor Base · 149k seg';
  if (rank === 3) return 'Récord 57% ER · 100% PPI';
  if (rank === 4) return 'Alc. Coquimbo · 86.8k seg';
  if (rank === 5) return 'Alc. La Serena · 76% PPI';
  if (rank === 6) return 'Mayor Ritmo · 60 posts';
  if (rank === 7) return 'Techo 100% PPI';
  return undefined;
}

function createSpiralBaseTimeSeriesPlinth(
  position: [number, number, number],
  hoverables: THREE.Object3D[]
): SpiralBaseTimeSeriesRef {
  const defaultAuth = EDICION3_AUTHORITIES[0];
  const group = new THREE.Group();
  group.position.set(position[0], position[1], position[2]);

  const baseY = 0.44;
  const maxBarHeight = 1.52;
  const xPositions = [-0.72, -0.24, 0.24, 0.72];

  // Obsidian stepped stage pedestal grounded at spiral threshold
  const lowerBase = new THREE.Mesh(
    new THREE.BoxGeometry(2.68, 0.28, 1.48),
    new THREE.MeshStandardMaterial({
      color: '#070E1E',
      roughness: 0.35,
      metalness: 0.82,
    })
  );
  lowerBase.position.y = 0.14;
  group.add(lowerBase);

  const stageDeck = new THREE.Mesh(
    new THREE.BoxGeometry(2.44, 0.16, 1.28),
    new THREE.MeshStandardMaterial({
      color: '#0D1730',
      roughness: 0.28,
      metalness: 0.75,
    })
  );
  stageDeck.position.y = 0.36;
  group.add(stageDeck);

  const neonTrim = new THREE.Mesh(
    new THREE.BoxGeometry(2.48, 0.032, 1.32),
    new THREE.MeshBasicMaterial({ color: '#00F0FF', transparent: true, opacity: 0.75 })
  );
  neonTrim.position.y = 0.445;
  group.add(neonTrim);

  // Subtle divider track between Ciclo Actual (front) and Mes Anterior (back)
  const midGuide = new THREE.Mesh(
    new THREE.BoxGeometry(2.12, 0.015, 0.025),
    new THREE.MeshBasicMaterial({ color: '#475569', transparent: true, opacity: 0.7 })
  );
  midGuide.position.set(0, baseY + 0.01, 0);
  group.add(midGuide);

  const maxSeries = Math.max(
    0.5,
    ...defaultAuth.erSeries.map((pt) => Math.max(pt.currentPct, pt.prevPct))
  );

  const currentBars: THREE.Mesh[] = [];
  const prevBars: THREE.Mesh[] = [];
  const currentDots: THREE.Mesh[] = [];
  const prevDots: THREE.Mesh[] = [];
  const currentLineSegs: THREE.Mesh[] = [];
  const prevLineSegs: THREE.Mesh[] = [];
  const currentBarHeights: number[] = [];
  const prevBarHeights: number[] = [];

  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const currSphereGeo = new THREE.SphereGeometry(0.085, 16, 16);
  const prevSphereGeo = new THREE.SphereGeometry(0.068, 14, 14);
  const unitSegGeo = new THREE.CylinderGeometry(1, 1, 1, 10);

  xPositions.forEach((bx, idx) => {
    const pt = defaultAuth.erSeries[idx];
    const currH = Math.max(0.18, (pt.currentPct / maxSeries) * maxBarHeight);
    const prevH = Math.max(0.18, (pt.prevPct / maxSeries) * maxBarHeight);
    currentBarHeights.push(currH);
    prevBarHeights.push(prevH);

    // Current month track (front z = +0.23)
    const cBar = new THREE.Mesh(
      unitBox,
      makeEditorialMaterial(defaultAuth.color, 0.45, 0.96)
    );
    cBar.scale.set(0.18, currH, 0.18);
    cBar.position.set(bx, baseY + currH * 0.5, 0.23);
    group.add(cBar);
    currentBars.push(cBar);

    const cDot = new THREE.Mesh(
      currSphereGeo,
      new THREE.MeshBasicMaterial({ color: '#FFFFFF' })
    );
    cDot.position.set(bx, baseY + currH + 0.04, 0.23);
    group.add(cDot);
    currentDots.push(cDot);

    // Prior month track (back z = -0.23)
    const pBar = new THREE.Mesh(
      unitBox,
      makeEditorialMaterial('#94A3B8', 0.2, 0.78)
    );
    pBar.scale.set(0.16, prevH, 0.16);
    pBar.position.set(bx, baseY + prevH * 0.5, -0.23);
    group.add(pBar);
    prevBars.push(pBar);

    const pDot = new THREE.Mesh(
      prevSphereGeo,
      new THREE.MeshBasicMaterial({ color: '#CBD5E1' })
    );
    pDot.position.set(bx, baseY + prevH + 0.04, -0.23);
    group.add(pDot);
    prevDots.push(pDot);
  });

  for (let i = 0; i < xPositions.length - 1; i++) {
    const x0 = xPositions[i];
    const x1 = xPositions[i + 1];
    const dx = x1 - x0;

    // Current trend connecting cylinder
    const cy0 = baseY + currentBarHeights[i] + 0.04;
    const cy1 = baseY + currentBarHeights[i + 1] + 0.04;
    const cdy = cy1 - cy0;
    const cLen = Math.hypot(dx, cdy);
    const cSeg = new THREE.Mesh(
      unitSegGeo,
      new THREE.MeshBasicMaterial({ color: defaultAuth.color })
    );
    cSeg.scale.set(0.028, cLen, 0.028);
    cSeg.position.set((x0 + x1) * 0.5, (cy0 + cy1) * 0.5, 0.23);
    cSeg.rotation.z = -Math.atan2(dx, cdy);
    group.add(cSeg);
    currentLineSegs.push(cSeg);

    // Prior month trend connecting cylinder
    const py0 = baseY + prevBarHeights[i] + 0.04;
    const py1 = baseY + prevBarHeights[i + 1] + 0.04;
    const pdy = py1 - py0;
    const pLen = Math.hypot(dx, pdy);
    const pSeg = new THREE.Mesh(
      unitSegGeo,
      new THREE.MeshBasicMaterial({ color: '#94A3B8', transparent: true, opacity: 0.72 })
    );
    pSeg.scale.set(0.018, pLen, 0.018);
    pSeg.position.set((x0 + x1) * 0.5, (py0 + py1) * 0.5, -0.23);
    pSeg.rotation.z = -Math.atan2(dx, pdy);
    group.add(pSeg);
    prevLineSegs.push(pSeg);
  }

  const badgeTex = createDarkFloatingBadgeTexture(
    `Serie ER% · ${defaultAuth.shortName}`,
    `Nov ${defaultAuth.erLabel} vs Oct ${defaultAuth.prevMonthErLabel}`,
    defaultAuth.color
  );
  const titleSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: badgeTex, transparent: true, depthWrite: false })
  );
  titleSprite.scale.set(2.35, 0.62, 1);
  titleSprite.position.set(0, baseY + maxBarHeight + 0.44, 0.08);
  titleSprite.renderOrder = 32;
  group.add(titleSprite);

  // Invisible hover proxy covering the plinth
  const hitBox = new THREE.Mesh(
    new THREE.BoxGeometry(2.55, 2.25, 1.35),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  hitBox.position.set(0, baseY + 1.0, 0);
  group.add(hitBox);

  const deltaPts = defaultAuth.erPct - defaultAuth.prevMonthErPct;
  const deltaSign = deltaPts >= 0 ? '+' : '';
  registerHoverable(
    hitBox,
    hoverables,
    {
      title: `Evolución Histórica ER% · ${defaultAuth.shortName}`,
      metric: `${defaultAuth.erLabel} (Nov) vs ${defaultAuth.prevMonthErLabel} (Oct)`,
      subtitle: `Variación mensual: ${deltaSign}${deltaPts.toFixed(2)} pts porcentuales · Sem 1 → Sem 4`,
      color: defaultAuth.color,
      rank: defaultAuth.rank,
    },
    stageDeck
  );

  return {
    group,
    baseY,
    maxBarHeight,
    xPositions,
    currentBars,
    prevBars,
    currentDots,
    prevDots,
    currentLineSegs,
    prevLineSegs,
    titleSprite,
    hitBox,
    activeRank: defaultAuth.rank,
    currentBarHeights,
    prevBarHeights,
    currentColor: new THREE.Color(defaultAuth.color),
  };
}

// SLIDE 0: RESUMEN EJECUTIVO (13 AUTORIDADES · 28 DÍAS)
export function buildEdicion3Slide0Overview(): BuiltSlideScene {
  const group = new THREE.Group();
  const hoverables: THREE.Object3D[] = [];
  const gyroRings: THREE.Mesh[] = [];
  const floatingNodes: { obj: THREE.Object3D; baseY: number; phase: number; speed: number }[] = [];

  // Central institutional telemetry core
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.72, 1),
    makeEditorialMaterial('#F59E0B', 0.42)
  );
  core.position.set(0, 2.35, 0);
  group.add(core);

  registerHoverable(
    core,
    hoverables,
    {
      title: 'Reporte Digital Noviembre 2026 · Ed. N° 3',
      metric: '676,6k Me Gusta · 13 Autoridades',
      subtitle: '43.431 comentarios ciudadanos · 363 piezas clasificadas (28 días)',
      color: '#F59E0B',
    },
    core
  );

  const ringConfigs = [
    { r: 1.35, color: '#00F0FF', tiltX: 0.6, tiltZ: 0.25 },
    { r: 1.72, color: '#F59E0B', tiltX: -0.45, tiltZ: 0.5 },
    { r: 2.1, color: '#10B981', tiltX: 0.3, tiltZ: -0.55 },
  ];
  ringConfigs.forEach((rc) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(rc.r, 0.032, 16, 64),
      makeEditorialMaterial(rc.color, 0.45)
    );
    ring.position.set(0, 2.35, 0);
    ring.rotation.set(rc.tiltX, 0, rc.tiltZ);
    group.add(ring);
    gyroRings.push(ring);
  });

  // 13 orbital satellite podium columns around base representing ALL 13 measured authorities
  EDICION3_AUTHORITIES.forEach((auth, idx) => {
    const angle = (idx / EDICION3_AUTHORITIES.length) * Math.PI * 2 - Math.PI / 2;
    const radius = 3.95;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius * 0.74;
    const h = Math.max(0.45, (Math.log10(Math.max(1000, auth.likes)) - 2.6) * 0.92);

    const { barGroup } = createColumnBar({
      radius: 0.22,
      height: h,
      color: auth.color,
      position: [x, 0, z],
      payload: {
        title: `${auth.name} (${auth.handle})`,
        metric: `${auth.likesLabel} likes · ${auth.ppiLabel} PPI`,
        subtitle: `${auth.followersLabel} seg · ${auth.posts} posts · ${auth.erLabel} ER`,
        color: auth.color,
        rank: auth.rank,
      },
      hoverables,
      labelName: `${String(auth.rank).padStart(2, '0')} ${auth.shortName}`,
      labelMetric: auth.likesLabel,
      crown: auth.rank <= 3,
      labelScale: 0.6,
    });
    group.add(barGroup);
  });

  // Floating sentiment triad on the right flank
  EDICION3_SENTIMENT.forEach((s, idx) => {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.28 + (s.pct / 100) * 0.35, 28, 28),
      makeEditorialMaterial(s.color, 0.38)
    );
    const baseY = 1.2 + idx * 0.95;
    orb.position.set(5.3, baseY, -0.8 + idx * 0.7);
    group.add(orb);
    floatingNodes.push({ obj: orb, baseY, phase: idx * 1.1, speed: 1.5 });

    const badgeTex = createDarkFloatingBadgeTexture(
      `Sentimiento ${s.label}`,
      `${s.posts} posts (${s.pct.toFixed(1).replace('.', ',')}%)`,
      s.color
    );
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: badgeTex, transparent: true, depthWrite: false })
    );
    sprite.scale.set(1.85, 0.5, 1);
    sprite.position.set(5.3, baseY + 0.58, -0.8 + idx * 0.7);
    group.add(sprite);
    floatingNodes.push({ obj: sprite, baseY: baseY + 0.58, phase: idx * 1.1, speed: 1.5 });

    registerHoverable(
      orb,
      hoverables,
      {
        title: `Sentimiento ${s.label}`,
        metric: `${s.posts} publicaciones`,
        subtitle: `${s.pct.toFixed(1).replace('.', ',')}% de 357 piezas analizadas`,
        color: s.color,
      },
      orb
    );
  });

  return {
    group,
    hoverables,
    animatedObjects: { gyroRings, floatingNodes },
    cameraPreset: {
      position: [0.8, 5.4, 12.8],
      target: [0.4, 2.35, 0],
    },
  };
}

// SLIDE 1: ESCALERA ANCHA EN ESPIRAL CÓNICA 3D (13 AUTORIDADES · LECTURA SIEMPRE FRONTAL Y ENFOQUE INTERACTIVO)
export function buildEdicion3Slide1Podium(): BuiltSlideScene {
  const group = new THREE.Group();
  const hoverables: THREE.Object3D[] = [];
  const rankBars: { rank: number; group: THREE.Group; mesh: THREE.Mesh; baseColor: THREE.Color }[] = [];

  const avgLikes =
    EDICION3_AUTHORITIES.reduce((acc, a) => acc + a.likes, 0) / EDICION3_AUTHORITIES.length;

  const coreX = 3.1;
  const spireHeight = 12.8;

  // Sleek translucent central architectural spire (never blocks foreground readability)
  const centralCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.72, spireHeight, 32),
    new THREE.MeshStandardMaterial({
      color: '#0C1630',
      roughness: 0.28,
      metalness: 0.82,
      emissive: new THREE.Color('#0E2954'),
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.78,
    })
  );
  centralCore.position.set(coreX, spireHeight / 2, 0);
  group.add(centralCore);

  [2.5, 6.2, 9.8, 12.4].forEach((ringY, idx) => {
    const coreHalo = new THREE.Mesh(
      new THREE.TorusGeometry(0.95 - idx * 0.11, 0.028, 12, 48),
      makeEditorialMaterial(idx >= 2 ? '#F59E0B' : '#00F0FF', 0.48, 0.85)
    );
    coreHalo.rotation.x = Math.PI / 2;
    coreHalo.position.set(coreX, ringY, 0);
    group.add(coreHalo);
  });

  const ascending = [...EDICION3_AUTHORITIES].reverse();
  const innerSpinePoints: THREE.Vector3[] = [];
  const outerHandrailPoints: THREE.Vector3[] = [];

  ascending.forEach((auth, idx) => {
    const { x, y, z, theta } = getSpiralPodiumCoordinates(idx, ascending.length, 'podium');

    innerSpinePoints.push(new THREE.Vector3(coreX + (x - coreX) * 0.78, y - 0.08, z * 0.78));
    outerHandrailPoints.push(
      new THREE.Vector3(
        x + Math.cos(theta) * 0.88,
        y + 0.16,
        z + Math.sin(theta) * 0.45
      )
    );

    const payload: HoverPayload = {
      title: `#${String(auth.rank).padStart(2, '0')} ${auth.name} (${auth.handle})`,
      metric: `${auth.likesLabel} Me gusta · ${auth.commentsLabel} com.`,
      subtitle: `${auth.followersLabel} seg · ${auth.posts} posts · ${auth.erLabel} ER · ${auth.ppiLabel} PPI`,
      color: auth.color,
      rank: auth.rank,
      variancePct: calcVariancePct(auth.likes, avgLikes),
      averageLabel: '52,0k prom. 13 autor.',
    };

    const stepGroup = new THREE.Group();
    stepGroup.position.set(x, 0, z);

    const stepYaw = -Math.sin(theta) * 0.28;
    const stairMeshGroup = new THREE.Group();
    stairMeshGroup.rotation.y = stepYaw;

    const treadWidth = 2.65;
    const treadDepth = 1.42;
    const isTop3 = auth.rank <= 3;

    // Sleek stepped dark titanium pedestal riser
    const riserH = Math.max(0.24, y);
    const riser = new THREE.Mesh(
      new THREE.BoxGeometry(treadWidth - 0.34, riserH, treadDepth * 0.56),
      new THREE.MeshStandardMaterial({
        color: '#0A1328',
        roughness: 0.36,
        metalness: 0.78,
        transparent: true,
        opacity: 0.9,
      })
    );
    riser.position.y = riserH / 2;
    stairMeshGroup.add(riser);

    // Wide luminous metallic stair deck
    const topDeck = new THREE.Mesh(
      new THREE.BoxGeometry(treadWidth, 0.18, treadDepth),
      makeEditorialMaterial(auth.color, isTop3 ? 0.46 : 0.26, 0.96)
    );
    topDeck.position.y = y + 0.09;
    stairMeshGroup.add(topDeck);

    // Bright front edge accent bar on stair nosing
    const nosingStrip = new THREE.Mesh(
      new THREE.BoxGeometry(treadWidth + 0.04, 0.06, 0.08),
      new THREE.MeshBasicMaterial({ color: isTop3 ? '#F59E0B' : auth.color })
    );
    nosingStrip.position.set(0, y + 0.16, treadDepth * 0.5);
    stairMeshGroup.add(nosingStrip);

    // Crown trophy pylon beside top-3 summit steps
    if (isTop3) {
      const pylonH = auth.rank === 1 ? 0.65 : auth.rank === 2 ? 0.48 : 0.34;
      const trophyPylon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.14, pylonH, 24),
        makeEditorialMaterial('#F59E0B', 0.6, 0.96)
      );
      trophyPylon.position.set(-treadWidth * 0.44, y + 0.18 + pylonH / 2, -0.35);
      stairMeshGroup.add(trophyPylon);
      registerHoverable(trophyPylon, hoverables, payload, topDeck);
    }

    stepGroup.add(stairMeshGroup);

    // Expanding 3D Shockwave Flash Rings around the step deck (destello al seleccionar)
    const flashRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.55, 0.065, 12, 48),
      new THREE.MeshBasicMaterial({
        color: '#FFFFFF',
        transparent: true,
        opacity: 0,
      })
    );
    flashRing.rotation.x = Math.PI / 2;
    flashRing.position.set(0, y + 0.2, 0);
    stepGroup.add(flashRing);

    const flashRingOuter = new THREE.Mesh(
      new THREE.TorusGeometry(1.75, 0.048, 12, 48),
      new THREE.MeshBasicMaterial({
        color: '#F59E0B',
        transparent: true,
        opacity: 0,
      })
    );
    flashRingOuter.rotation.x = Math.PI / 2;
    flashRingOuter.position.set(0, y + 0.2, 0);
    stepGroup.add(flashRingOuter);

    // Sustained Position Halo Ring cradling the selected stair
    const highlightHalo = new THREE.Mesh(
      new THREE.TorusGeometry(1.42, 0.045, 12, 48),
      new THREE.MeshBasicMaterial({
        color: auth.color,
        transparent: true,
        opacity: 0,
      })
    );
    highlightHalo.rotation.x = Math.PI / 2;
    highlightHalo.position.set(0, y + 0.22, 0);
    stepGroup.add(highlightHalo);

    // Additive 3D Starburst Destello Flare cradling the selected stair & banner
    const flareTex = createDarkDestelloFlareTexture(auth.color);
    const destelloFlare = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: flareTex,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    destelloFlare.scale.set(3.8, 2.2, 1);
    destelloFlare.position.set(0, y + 0.72, 0);
    destelloFlare.renderOrder = 55;
    stepGroup.add(destelloFlare);

    // Short luminous vertical stem connecting stair surface to upright Sprite Marquee
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.022, 0.34, 8),
      new THREE.MeshBasicMaterial({ color: isTop3 ? '#F59E0B' : auth.color })
    );
    stem.position.set(0, y + 0.35, 0);
    stepGroup.add(stem);

    // ALWAYS-UPRIGHT Wide Full-Width Stair Marquee Sprite (100% readable from any 360° orbit angle!)
    const detail = getSpecialDetailLabel(auth.rank);
    const bannerTex = createDarkFullWidthStairBannerTexture(
      `#${String(auth.rank).padStart(2, '0')}`,
      auth.shortName,
      auth.handle,
      `${auth.likesLabel} likes · ${auth.erLabel} ER · ${auth.ppiLabel} PPI`,
      detail,
      auth.color,
      isTop3
    );

    const stairSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: bannerTex,
        transparent: true,
        depthWrite: false,
      })
    );
    const baseSpriteScale: [number, number, number] = [3.3, 0.9, 1];
    stairSprite.scale.set(...baseSpriteScale);
    stairSprite.position.set(0, y + 0.9, 0);
    stairSprite.renderOrder = 10 + (13 - auth.rank);
    stepGroup.add(stairSprite);

    const focusMeta: SpiralStepFocusMeta = {
      rank: auth.rank,
      worldAnchor: [x, y + 0.9, z],
      focusCamera: getSpiralStepFocusCamera(x, y, z, 'podium'),
      stairSprite,
      destelloFlare,
      flashRing,
      flashRingOuter,
      highlightHalo,
      baseSpriteScale,
    };
    stepGroup.userData.focusMeta = focusMeta;

    registerHoverable(riser, hoverables, payload, topDeck);
    registerHoverable(topDeck, hoverables, payload, topDeck);
    registerHoverable(stairSprite, hoverables, payload, topDeck);

    group.add(stepGroup);
    rankBars.push({
      rank: auth.rank,
      group: stepGroup,
      mesh: topDeck,
      baseColor: new THREE.Color(auth.color),
    });
  });

  // Smooth continuous inner cyan helical structural stringer
  if (innerSpinePoints.length >= 2) {
    const innerCurve = new THREE.CatmullRomCurve3(innerSpinePoints);
    group.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(innerCurve, 128, 0.085, 12, false),
        makeEditorialMaterial('#00F0FF', 0.36, 0.85)
      )
    );
  }

  // Smooth continuous outer golden ascending handrail crowning the spiral
  if (outerHandrailPoints.length >= 2) {
    const railCurve = new THREE.CatmullRomCurve3(outerHandrailPoints);
    group.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(railCurve, 128, 0.065, 12, false),
        makeEditorialMaterial('#F59E0B', 0.5, 0.92)
      )
    );
  }

  // Dynamic 3D Historical ER% Time-Series Plinth seated cleanly at spiral threshold
  const baseTimeSeries = createSpiralBaseTimeSeriesPlinth([-0.1, 0, 4.4], hoverables);
  group.add(baseTimeSeries.group);
  group.userData.baseTimeSeries = baseTimeSeries;

  return {
    group,
    hoverables,
    animatedObjects: { rankBars },
    cameraPreset: {
      position: [0.2, 6.2, 30.2],
      target: [0.2, 4.25, 0.0],
    },
  };
}

// SLIDE 2: EFICIENCIA ALGORÍTMICA (100% PPI) & RENTABILIDAD DE FORMATOS
export function buildEdicion3Slide2Efficiency(): BuiltSlideScene {
  const group = new THREE.Group();
  const hoverables: THREE.Object3D[] = [];
  const floatingNodes: { obj: THREE.Object3D; baseY: number; phase: number; speed: number }[] = [];

  // Left Wing: Efficiency & PPI Leaders
  const effLeaders = [
    EDICION3_AUTHORITIES[2], // Bernardo Salinas (57% ER, 100% PPI)
    EDICION3_AUTHORITIES[6], // Eileen Patricia (14% ER, 100% PPI)
    EDICION3_AUTHORITIES[1], // Daniel Manoucheri (8.08% ER, 85% PPI)
    EDICION3_AUTHORITIES[0], // Carolina Tello (31% ER, 59% PPI)
  ];

  effLeaders.forEach((auth, idx) => {
    const x = -4.4 + idx * 1.38;
    const h = 0.65 + (auth.ppiPct / 100) * 3.55;
    const { barGroup } = createColumnBar({
      radius: 0.36,
      height: h,
      color: auth.color,
      position: [x, 0, -0.35],
      payload: {
        title: `${auth.name} (${auth.handle})`,
        metric: `${auth.ppiLabel} PPI · ${auth.erLabel} ER`,
        subtitle: auth.highlightNote,
        color: auth.color,
        rank: auth.rank,
      },
      hoverables,
      labelName: auth.shortName,
      labelMetric: `${auth.ppiLabel} PPI`,
      crown: auth.ppiPct === 100,
      labelScale: 0.78,
    });
    group.add(barGroup);
  });

  // Right Wing: 3 Formats ROI (Videos/Reels 14%, Imágenes 3,06%, Carrusels 1,28%)
  EDICION3_FORMATS.forEach((fmt, idx) => {
    const x = 1.65 + idx * 1.48;
    const h = 0.6 + (fmt.erPct / 14) * 3.4;
    const { barGroup } = createColumnBar({
      radius: 0.38,
      height: h,
      color: fmt.color,
      position: [x, 0, 0.25],
      payload: {
        title: fmt.format,
        metric: `${fmt.erLabel} ER · ${fmt.posts} posts`,
        subtitle: `${fmt.sharePct.toFixed(1).replace('.', ',')}% del volumen total · ${fmt.detail}`,
        color: fmt.color,
      },
      hoverables,
      labelName: fmt.format.split(' ')[0],
      labelMetric: fmt.erLabel,
      crown: idx === 0,
      labelScale: 0.78,
    });
    group.add(barGroup);
  });

  // Top 3 Hashtags floating badges above center
  EDICION3_TOP_HASHTAGS.slice(0, 3).forEach((tag, idx) => {
    const badgeTex = createDarkFloatingBadgeTexture(
      tag.tag,
      `${tag.erPct}% ER promedio`,
      idx === 0 ? '#00F0FF' : idx === 1 ? '#A855F7' : '#14B8A6'
    );
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: badgeTex, transparent: true, depthWrite: false })
    );
    const bx = -1.6 + idx * 2.1;
    const by = 4.9 + (idx === 1 ? 0.45 : 0);
    sprite.scale.set(1.9, 0.52, 1);
    sprite.position.set(bx, by, -1.6);
    group.add(sprite);
    floatingNodes.push({ obj: sprite, baseY: by, phase: idx * 0.9, speed: 1.4 });
  });

  return {
    group,
    hoverables,
    animatedObjects: { floatingNodes },
    cameraPreset: {
      position: [0.3, 5.2, 12.6],
      target: [0.3, 2.5, 0],
    },
  };
}

// SLIDE 3: DUELO CONURBADO (DANIELA NORAMBUENA VS ALÍ MANOUCHEHRI)
export function buildEdicion3Slide3Duel(): {
  scene: BuiltSlideScene;
  totalsGroup: THREE.Group;
  efficiencyGroup: THREE.Group;
  totalsHoverables: THREE.Object3D[];
  efficiencyHoverables: THREE.Object3D[];
} {
  const group = new THREE.Group();
  const hoverables: THREE.Object3D[] = [];
  const totalsGroup = new THREE.Group();
  const efficiencyGroup = new THREE.Group();
  const totalsHoverables: THREE.Object3D[] = [];
  const efficiencyHoverables: THREE.Object3D[] = [];

  const daniela = EDICION3_AUTHORITIES[4]; // Daniela Norambuena (La Serena)
  const ali = EDICION3_AUTHORITIES[3]; // Alí Manouchehri (Coquimbo)

  // Arena pedestals
  [-2.6, 2.6].forEach((x, idx) => {
    const color = idx === 0 ? daniela.color : ali.color;
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.9, 2.05, 0.16, 48),
      new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.35, metalness: 0.75 })
    );
    pad.position.set(x, 0.08, 0);
    group.add(pad);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.95, 0.025, 12, 48),
      new THREE.MeshBasicMaterial({ color })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, 0.17, 0);
    group.add(ring);
  });

  // Mode 1: Totals (Posts, Likes, Comments)
  const totalMetrics = [
    { actor: daniela, x: -3.4, label: 'Posts', val: daniela.posts, h: 3.1, text: '34 posts', col: '#10B981' },
    { actor: daniela, x: -2.6, label: 'Likes', val: daniela.likes, h: 2.95, text: '32,7k likes', col: '#34D399' },
    { actor: daniela, x: -1.8, label: 'Com.', val: daniela.comments, h: 3.45, text: '3.3k com.', col: '#00F0FF' },
    { actor: ali, x: 1.8, label: 'Posts', val: ali.posts, h: 1.15, text: '10 posts', col: '#FF2E93' },
    { actor: ali, x: 2.6, label: 'Likes', val: ali.likes, h: 3.1, text: '34,2k likes', col: '#FB7185' },
    { actor: ali, x: 3.4, label: 'Com.', val: ali.comments, h: 1.65, text: '1.4k com.', col: '#F59E0B' },
  ];

  totalMetrics.forEach((m) => {
    const { barGroup } = createColumnBar({
      radius: 0.32,
      height: m.h,
      color: m.col,
      position: [m.x, 0.16, 0],
      payload: {
        title: `${m.actor.name} · ${m.label}`,
        metric: m.text,
        subtitle: `${m.actor.followersLabel} seguidores · ${m.actor.ppiLabel} PPI`,
        color: m.col,
      },
      hoverables: totalsHoverables,
      labelName: `${m.actor.shortName.split(' ')[0]} ${m.label}`,
      labelMetric: m.text,
      labelScale: 0.72,
    });
    totalsGroup.add(barGroup);
  });

  // Mode 2: Efficiency (ER%, PPI%)
  const effMetrics = [
    { actor: daniela, x: -3.3, label: 'PPI', h: 3.35, text: '76% PPI', col: '#10B981' },
    { actor: daniela, x: -2.0, label: 'ER', h: 1.45, text: '1,68% ER', col: '#00F0FF' },
    { actor: ali, x: 2.0, label: 'PPI', h: 1.1, text: '17% PPI', col: '#FF2E93' },
    { actor: ali, x: 3.3, label: 'ER', h: 3.55, text: '4,37% ER', col: '#F59E0B' },
  ];

  effMetrics.forEach((m) => {
    const { barGroup } = createColumnBar({
      radius: 0.42,
      height: m.h,
      color: m.col,
      position: [m.x, 0.16, 0],
      payload: {
        title: `${m.actor.name} · ${m.label}`,
        metric: m.text,
        subtitle: `${m.actor.posts} posts en 28d · ${m.actor.likesLabel} Me gusta`,
        color: m.col,
      },
      hoverables: efficiencyHoverables,
      labelName: `${m.actor.shortName.split(' ')[0]} ${m.label}`,
      labelMetric: m.text,
      crown: m.h > 3.2,
      labelScale: 0.8,
    });
    efficiencyGroup.add(barGroup);
  });

  group.add(totalsGroup);
  group.add(efficiencyGroup);
  efficiencyGroup.visible = false;
  hoverables.push(...totalsHoverables);

  return {
    scene: {
      group,
      hoverables,
      animatedObjects: {},
      cameraPreset: {
        position: [0, 5.0, 11.8],
        target: [0, 2.35, 0],
      },
    },
    totalsGroup,
    efficiencyGroup,
    totalsHoverables,
    efficiencyHoverables,
  };
}

// SLIDE 4: RANKING CONSOLIDADO DE LAS 13 AUTORIDADES EN ANFITEATRO ESPIRAL SIEMPRE LEGIBLE
export function buildEdicion3Slide4Ranking(): BuiltSlideScene {
  const group = new THREE.Group();
  const hoverables: THREE.Object3D[] = [];
  const rankBars: { rank: number; group: THREE.Group; mesh: THREE.Mesh; baseColor: THREE.Color }[] = [];

  const avgLikes =
    EDICION3_AUTHORITIES.reduce((acc, a) => acc + a.likes, 0) / EDICION3_AUTHORITIES.length;

  const ascending = [...EDICION3_AUTHORITIES].reverse();
  const spinePoints: THREE.Vector3[] = [];
  const railPoints: THREE.Vector3[] = [];
  const coreX = 4.2;

  const rankCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.72, 12.6, 32),
    new THREE.MeshStandardMaterial({
      color: '#0C1630',
      roughness: 0.25,
      metalness: 0.85,
      emissive: new THREE.Color('#0E2954'),
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.78,
    })
  );
  rankCore.position.set(coreX, 6.3, 0);
  group.add(rankCore);

  ascending.forEach((auth, idx) => {
    const { x, y, z, theta } = getSpiralPodiumCoordinates(idx, ascending.length, 'ranking');

    spinePoints.push(new THREE.Vector3(coreX + (x - coreX) * 0.78, y - 0.08, z * 0.78));
    railPoints.push(
      new THREE.Vector3(x + Math.cos(theta) * 0.82, y + 0.16, z + Math.sin(theta) * 0.42)
    );

    const payload: HoverPayload = {
      title: `#${String(auth.rank).padStart(2, '0')} ${auth.name}`,
      metric: `${auth.likesLabel} likes · ${auth.commentsLabel} com.`,
      subtitle: `${auth.handle} · ${auth.followersLabel} seg · ${auth.posts} posts · ${auth.erLabel} ER · ${auth.ppiLabel} PPI`,
      color: auth.color,
      rank: auth.rank,
      variancePct: calcVariancePct(auth.likes, avgLikes),
      averageLabel: '52,0k prom. 13 autor.',
    };

    const stepGroup = new THREE.Group();
    stepGroup.position.set(x, 0, z);

    const stepYaw = -Math.sin(theta) * 0.28;
    const stairMeshGroup = new THREE.Group();
    stairMeshGroup.rotation.y = stepYaw;

    const treadWidth = 2.4;
    const treadDepth = 1.32;
    const isTop3 = auth.rank <= 3;

    const riser = new THREE.Mesh(
      new THREE.BoxGeometry(treadWidth - 0.28, Math.max(0.24, y), treadDepth * 0.56),
      new THREE.MeshStandardMaterial({
        color: '#0A1328',
        roughness: 0.36,
        metalness: 0.78,
        transparent: true,
        opacity: 0.9,
      })
    );
    riser.position.y = Math.max(0.24, y) / 2;
    stairMeshGroup.add(riser);

    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(treadWidth, 0.16, treadDepth),
      makeEditorialMaterial(auth.color, isTop3 ? 0.46 : 0.26, 0.96)
    );
    deck.position.y = y + 0.08;
    stairMeshGroup.add(deck);

    stepGroup.add(stairMeshGroup);

    const flashRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.42, 0.06, 12, 48),
      new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0 })
    );
    flashRing.rotation.x = Math.PI / 2;
    flashRing.position.set(0, y + 0.18, 0);
    stepGroup.add(flashRing);

    const flashRingOuter = new THREE.Mesh(
      new THREE.TorusGeometry(1.62, 0.045, 12, 48),
      new THREE.MeshBasicMaterial({ color: '#F59E0B', transparent: true, opacity: 0 })
    );
    flashRingOuter.rotation.x = Math.PI / 2;
    flashRingOuter.position.set(0, y + 0.18, 0);
    stepGroup.add(flashRingOuter);

    const highlightHalo = new THREE.Mesh(
      new THREE.TorusGeometry(1.3, 0.042, 12, 48),
      new THREE.MeshBasicMaterial({ color: auth.color, transparent: true, opacity: 0 })
    );
    highlightHalo.rotation.x = Math.PI / 2;
    highlightHalo.position.set(0, y + 0.2, 0);
    stepGroup.add(highlightHalo);

    const flareTex = createDarkDestelloFlareTexture(auth.color);
    const destelloFlare = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: flareTex,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    destelloFlare.scale.set(3.6, 2.1, 1);
    destelloFlare.position.set(0, y + 0.72, 0);
    destelloFlare.renderOrder = 55;
    stepGroup.add(destelloFlare);

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.02, 0.34, 8),
      new THREE.MeshBasicMaterial({ color: isTop3 ? '#F59E0B' : auth.color })
    );
    stem.position.set(0, y + 0.34, 0);
    stepGroup.add(stem);

    const bannerTex = createDarkFullWidthStairBannerTexture(
      `#${String(auth.rank).padStart(2, '0')}`,
      auth.shortName,
      auth.handle,
      `${auth.likesLabel} likes · ${auth.erLabel} ER · ${auth.ppiLabel} PPI`,
      getSpecialDetailLabel(auth.rank),
      auth.color,
      isTop3
    );

    const stairSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: bannerTex, transparent: true, depthWrite: false })
    );
    const baseSpriteScale: [number, number, number] = [3.15, 0.86, 1];
    stairSprite.scale.set(...baseSpriteScale);
    stairSprite.position.set(0, y + 0.9, 0);
    stairSprite.renderOrder = 10 + (13 - auth.rank);
    stepGroup.add(stairSprite);

    const focusMeta: SpiralStepFocusMeta = {
      rank: auth.rank,
      worldAnchor: [x, y + 0.9, z],
      focusCamera: getSpiralStepFocusCamera(x, y, z, 'ranking'),
      stairSprite,
      destelloFlare,
      flashRing,
      flashRingOuter,
      highlightHalo,
      baseSpriteScale,
    };
    stepGroup.userData.focusMeta = focusMeta;

    registerHoverable(riser, hoverables, payload, deck);
    registerHoverable(deck, hoverables, payload, deck);
    registerHoverable(stairSprite, hoverables, payload, deck);

    group.add(stepGroup);
    rankBars.push({
      rank: auth.rank,
      group: stepGroup,
      mesh: deck,
      baseColor: new THREE.Color(auth.color),
    });
  });

  if (spinePoints.length >= 2) {
    const curve = new THREE.CatmullRomCurve3(spinePoints);
    group.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(curve, 128, 0.075, 12, false),
        makeEditorialMaterial('#00F0FF', 0.35, 0.85)
      )
    );
  }

  if (railPoints.length >= 2) {
    const rCurve = new THREE.CatmullRomCurve3(railPoints);
    group.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(rCurve, 128, 0.06, 12, false),
        makeEditorialMaterial('#F59E0B', 0.48, 0.92)
      )
    );
  }

  const baseTimeSeries = createSpiralBaseTimeSeriesPlinth([1.1, 0, 4.4], hoverables);
  group.add(baseTimeSeries.group);
  group.userData.baseTimeSeries = baseTimeSeries;

  return {
    group,
    hoverables,
    animatedObjects: { rankBars },
    cameraPreset: {
      position: [-2.4, 6.2, 31.4],
      target: [-1.6, 4.1, 0.0],
    },
  };
}
