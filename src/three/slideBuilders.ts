import * as THREE from 'three';
import {
  ACTORS_LIKES_DATA,
  FORMATS_DATA,
  HASHTAGS_DATA,
  LIKES_PIE_DATA,
  REACH_SHARE_DATA,
  SENTIMENT_SERIES,
  TOP_20_LIKES,
  TOP_ENGAGEMENT_DATA,
  TOP_FOLLOWERS_DATA,
  VIRAL_MILESTONES,
  formatSpanishInt,
} from '../data/coquimboData';
import {
  createPieSliceLabelTexture,
  createTagTexture,
  createVerticalBarLabelTexture,
} from './proceduralTextures';

export interface HoverPayload {
  title: string;
  metric: string;
  subtitle: string;
  color: string;
  rank?: number;
  variancePct?: number;
  averageLabel?: string;
}

function calcVariancePct(value: number, average: number): number {
  if (average === 0) return 0;
  return ((value - average) / average) * 100;
}

export interface BuiltSlideScene {
  group: THREE.Group;
  hoverables: THREE.Object3D[];
  animatedObjects: {
    rings?: THREE.Mesh[];
    floatingNodes?: { obj: THREE.Object3D; baseY: number; phase: number; speed: number }[];
    wordGroup?: THREE.Group;
    gyroRings?: THREE.Mesh[];
    rankBars?: { rank: number; group: THREE.Group; mesh: THREE.Mesh; baseColor: THREE.Color }[];
    pieSlices?: {
      rank: number;
      mesh: THREE.Mesh;
      baseColor: THREE.Color;
      bisectorAngle: number;
      baseY: number;
    }[];
  };
  cameraPreset: {
    position: [number, number, number];
    target: [number, number, number];
  };
}

function makeBarMaterial(colorHex: string, roughness = 0.24, metalness = 0.18) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colorHex),
    roughness,
    metalness,
    clearcoat: 0.72,
    clearcoatRoughness: 0.14,
  });
}

function makeCollarMaterial() {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color('#E2E8F0'),
    roughness: 0.48,
    metalness: 0.68,
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
  hoverables.push(obj);
}

/**
 * Helper to create a composite multi-part cylindrical bar pivoted at bottom-center (y = 0)
 */
function createCompositeCylinderBar(options: {
  radius: number;
  height: number;
  color: string;
  position: [number, number, number];
  payload: HoverPayload;
  hoverables: THREE.Object3D[];
  addTopRing?: boolean;
  ringColor?: string;
  permanentLabel?: {
    name: string;
    pctLabel: string;
    scale?: number;
  };
}): { barGroup: THREE.Group; shaftMesh: THREE.Mesh; topRing?: THREE.Mesh } {
  const {
    radius,
    height,
    color,
    position,
    payload,
    hoverables,
    addTopRing,
    ringColor,
    permanentLabel,
  } = options;

  const barGroup = new THREE.Group();
  barGroup.position.set(position[0], position[1], position[2]);

  const safeH = Math.max(0.14, height);

  // 1. Metallic grounded base collar
  const collarGeo = new THREE.CylinderGeometry(radius * 1.15, radius * 1.24, 0.12, 32);
  const collarMat = makeCollarMaterial();
  const collar = new THREE.Mesh(collarGeo, collarMat);
  collar.position.y = 0.06;
  collar.castShadow = true;
  collar.receiveShadow = true;
  barGroup.add(collar);

  // 2. Main glossy cylindrical shaft
  const shaftGeo = new THREE.CylinderGeometry(radius * 0.94, radius, safeH, 36);
  const shaftMat = makeBarMaterial(color);
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.position.y = 0.12 + safeH / 2;
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  barGroup.add(shaft);

  // 3. Upper chamfered crown cap
  const capGeo = new THREE.CylinderGeometry(radius * 0.72, radius * 0.94, 0.09, 32);
  const capMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#FFFFFF'),
    roughness: 0.28,
    metalness: 0.35,
  });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = 0.12 + safeH + 0.045;
  cap.castShadow = true;
  barGroup.add(cap);

  let topRing: THREE.Mesh | undefined;
  if (addTopRing) {
    const torusGeo = new THREE.TorusGeometry(radius * 1.38, 0.055, 16, 48);
    const torusMat = makeBarMaterial(ringColor || color, 0.18, 0.45);
    topRing = new THREE.Mesh(torusGeo, torusMat);
    topRing.rotation.x = Math.PI / 2;
    topRing.position.y = 0.12 + safeH + 0.42;
    topRing.castShadow = true;
    barGroup.add(topRing);
    registerHoverable(topRing, hoverables, payload, shaft);
  }

  // 4. Permanent vertical name + % label rising above the bar regardless of hover
  if (permanentLabel) {
    const labelScale = permanentLabel.scale ?? 0.9;
    const stemBaseY = addTopRing ? 0.12 + safeH + 0.5 : 0.12 + safeH + 0.09;
    const stemH = 0.16;

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, stemH, 8),
      new THREE.MeshStandardMaterial({ color: '#94A3B8', roughness: 0.4, metalness: 0.5 })
    );
    stem.position.y = stemBaseY + stemH / 2;
    barGroup.add(stem);

    const tex = createVerticalBarLabelTexture(
      permanentLabel.name,
      permanentLabel.pctLabel,
      color
    );
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
      })
    );
    sprite.center.set(0.5, 0);
    sprite.scale.set(0.56 * labelScale, 2.24 * labelScale, 1);
    sprite.position.y = stemBaseY + stemH;
    barGroup.add(sprite);
    registerHoverable(sprite, hoverables, payload, shaft);
  }

  registerHoverable(shaft, hoverables, payload, shaft);

  return { barGroup, shaftMesh: shaft, topRing };
}

/**
 * SLIDE 0: Portada 3D — Escultura de datos orbital + espiras de métricas
 */
export function buildSlide0Hero(): BuiltSlideScene {
  const group = new THREE.Group();
  const hoverables: THREE.Object3D[] = [];
  const gyroRings: THREE.Mesh[] = [];
  const floatingNodes: { obj: THREE.Object3D; baseY: number; phase: number; speed: number }[] = [];

  // Offset right slightly so left editorial title & KPIs breathe
  const sculpture = new THREE.Group();
  sculpture.position.set(2.3, 0, 0);
  group.add(sculpture);

  // Ground architectural base disc (3 parts)
  const plinthOuter = new THREE.Mesh(
    new THREE.CylinderGeometry(3.4, 3.6, 0.14, 64),
    new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.55, metalness: 0.25 })
  );
  plinthOuter.position.y = 0.07;
  plinthOuter.receiveShadow = true;
  sculpture.add(plinthOuter);

  const plinthInner = new THREE.Mesh(
    new THREE.CylinderGeometry(2.65, 2.75, 0.18, 64),
    new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.35, metalness: 0.45 })
  );
  plinthInner.position.y = 0.15;
  plinthInner.receiveShadow = true;
  sculpture.add(plinthInner);

  // Central glass-like optical sphere core
  const coreGeo = new THREE.IcosahedronGeometry(0.85, 3);
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#0284C7'),
    roughness: 0.12,
    metalness: 0.2,
    clearcoat: 1.0,
    emissive: new THREE.Color('#0284C7'),
    emissiveIntensity: 0.18,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.y = 2.45;
  core.castShadow = true;
  sculpture.add(core);
  registerHoverable(
    core,
    hoverables,
    {
      title: 'Ecosistema Regional Coquimbo',
      metric: '3,13M Me gusta',
      subtitle: '20 cuentas monitoreadas · 14 oct – 14 nov 2026',
      color: '#0284C7',
    },
    core
  );

  // 3 Concentric Orbital Rings (Cyan, Coral, Emerald)
  const ringConfigs = [
    { radius: 1.65, tube: 0.065, color: '#0284C7', tiltX: 0.9, tiltZ: 0.3, label: '3,13M Likes Totales', sub: 'Volumen acumulado en 31 días' },
    { radius: 2.15, tube: 0.055, color: '#F97316', tiltX: -0.7, tiltZ: 0.8, label: '1,06% Engagement Medio', sub: 'Tasa promedio sobre seguidores' },
    { radius: 2.65, tube: 0.048, color: '#10B981', tiltX: 0.4, tiltZ: -0.9, label: '6,0 Posts / Día', sub: 'Ritmo medio por cuenta activa' },
  ];

  ringConfigs.forEach((cfg) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(cfg.radius, cfg.tube, 24, 96),
      makeBarMaterial(cfg.color, 0.2, 0.55)
    );
    ring.position.y = 2.45;
    ring.rotation.set(cfg.tiltX, 0, cfg.tiltZ);
    ring.castShadow = true;
    sculpture.add(ring);
    gyroRings.push(ring);
    registerHoverable(
      ring,
      hoverables,
      {
        title: cfg.label,
        metric: cfg.color === '#0284C7' ? '3,13M' : cfg.color === '#F97316' ? '1,06%' : '6,0/día',
        subtitle: cfg.sub,
        color: cfg.color,
      },
      ring
    );
  });

  // 12 Radial cylindrical spires around perimeter
  const spireHeights = [1.8, 1.35, 0.95, 1.55, 2.2, 1.15, 0.85, 1.7, 1.25, 0.9, 1.45, 2.05];
  const avgSpireVal =
    spireHeights.reduce((acc, h) => acc + Math.round(h * 145), 0) / spireHeights.length;
  const spireColors = ['#0284C7', '#0F172A', '#10B981', '#F97316'];
  spireHeights.forEach((h, i) => {
    const angle = (i / spireHeights.length) * Math.PI * 2;
    const r = 3.0;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const col = spireColors[i % spireColors.length];
    const valK = Math.round(h * 145);
    const { barGroup } = createCompositeCylinderBar({
      radius: 0.16,
      height: h,
      color: col,
      position: [x, 0.14, z],
      payload: {
        title: `Nodo de Conversación #${i + 1}`,
        metric: `${valK}k interacciones`,
        subtitle: 'Actividad radial del ecosistema Coquimbo',
        color: col,
        variancePct: calcVariancePct(valK, avgSpireVal),
        averageLabel: `${Math.round(avgSpireVal)}k prom.`,
      },
      hoverables,
    });
    sculpture.add(barGroup);
  });

  // Floating spherical data nodes
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 24, 24),
      makeBarMaterial(i % 2 === 0 ? '#F97316' : '#10B981', 0.18, 0.4)
    );
    const yBase = 1.6 + (i % 3) * 0.75;
    node.position.set(Math.cos(ang) * 2.35, yBase, Math.sin(ang) * 2.35);
    node.castShadow = true;
    sculpture.add(node);
    floatingNodes.push({ obj: node, baseY: yBase, phase: i * 1.1, speed: 1.4 });
  }

  return {
    group,
    hoverables,
    animatedObjects: { gyroRings, floatingNodes },
    cameraPreset: { position: [0.5, 4.1, 10.6], target: [0.8, 1.9, 0] },
  };
}

/**
 * SLIDE 1: Cuota de Alcance (Gráfico de Barras Cilíndricas 3D + Anillos flotantes)
 */
export function buildSlide1ReachShare(): BuiltSlideScene {
  const group = new THREE.Group();
  const hoverables: THREE.Object3D[] = [];
  const rings: THREE.Mesh[] = [];
  const floatingNodes: { obj: THREE.Object3D; baseY: number; phase: number; speed: number }[] = [];

  // Subtle stepped stage base
  const stageBase = new THREE.Mesh(
    new THREE.BoxGeometry(11.6, 0.14, 4.2),
    new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.65, metalness: 0.15 })
  );
  stageBase.position.set(0.3, 0.07, 0);
  stageBase.receiveShadow = true;
  group.add(stageBase);

  const maxInteractions = 1300000;
  const avgReachInteractions =
    REACH_SHARE_DATA.reduce((sum, item) => sum + item.interactions, 0) /
    REACH_SHARE_DATA.length;
  const spacing = 1.82;
  const startX = -((REACH_SHARE_DATA.length - 1) * spacing) / 2 + 0.3;

  REACH_SHARE_DATA.forEach((item, idx) => {
    const normH = (item.interactions / maxInteractions) * 4.15;
    const x = startX + idx * spacing;

    const { barGroup, topRing } = createCompositeCylinderBar({
      radius: 0.46,
      height: normH,
      color: item.color,
      position: [x, 0.14, 0],
      payload: {
        title: item.name,
        metric: `${item.interactionsLabel} interacciones (${item.sharePct.toFixed(1).replace('.', ',')}%)`,
        subtitle: item.note,
        color: item.color,
        variancePct: calcVariancePct(item.interactions, avgReachInteractions),
        averageLabel: '598,2k prom.',
      },
      hoverables,
      addTopRing: true,
      ringColor: item.color,
      permanentLabel: {
        name: item.name,
        pctLabel: `${item.sharePct.toFixed(1).replace('.', ',')}%`,
        scale: 0.95,
      },
    });

    group.add(barGroup);
    if (topRing) {
      rings.push(topRing);
      floatingNodes.push({
        obj: topRing,
        baseY: topRing.position.y,
        phase: idx * 0.8,
        speed: 1.8,
      });
    }
  });

  return {
    group,
    hoverables,
    animatedObjects: { rings, floatingNodes },
    cameraPreset: { position: [0.3, 5.1, 13.2], target: [0.3, 2.9, 0] },
  };
}

/**
 * SLIDE 2: Seguidores vs. Engagement (Comparativa 3D en doble fila)
 */
export function buildSlide2FollowersVsEngagement(): BuiltSlideScene {
  const group = new THREE.Group();
  const hoverables: THREE.Object3D[] = [];
  const rings: THREE.Mesh[] = [];
  const floatingNodes: { obj: THREE.Object3D; baseY: number; phase: number; speed: number }[] = [];

  // Two opposing sleek platforms
  const leftDeck = new THREE.Mesh(
    new THREE.BoxGeometry(8.8, 0.14, 2.4),
    new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.6, metalness: 0.2 })
  );
  leftDeck.position.set(0, 0.07, 1.65);
  leftDeck.receiveShadow = true;
  group.add(leftDeck);

  const rightDeck = new THREE.Mesh(
    new THREE.BoxGeometry(8.8, 0.14, 2.4),
    new THREE.MeshStandardMaterial({ color: '#CBD5E1', roughness: 0.55, metalness: 0.25 })
  );
  rightDeck.position.set(0, 0.07, -1.65);
  rightDeck.receiveShadow = true;
  group.add(rightDeck);

  // Front row: Top Seguidores
  const spacing = 1.38;
  const startX = -((TOP_FOLLOWERS_DATA.length - 1) * spacing) / 2;
  const avgFollowers =
    TOP_FOLLOWERS_DATA.reduce((sum, item) => sum + item.followers, 0) /
    TOP_FOLLOWERS_DATA.length;
  const avgTopEngagement =
    TOP_ENGAGEMENT_DATA.reduce((sum, item) => sum + item.engagement, 0) /
    TOP_ENGAGEMENT_DATA.length;

  const totalTop6Followers = TOP_FOLLOWERS_DATA.reduce((sum, item) => sum + item.followers, 0);

  TOP_FOLLOWERS_DATA.forEach((item, idx) => {
    const normH = (item.followers / 278000) * 2.95;
    const x = startX + idx * spacing;
    const sharePct = (item.followers / totalTop6Followers) * 100;
    const { barGroup } = createCompositeCylinderBar({
      radius: 0.34,
      height: normH,
      color: item.color,
      position: [x, 0.14, 1.65],
      payload: {
        title: `${item.name} · Seguidores`,
        metric: `${item.label} seguidores`,
        subtitle: `Ranking #${idx + 1} en tamaño de comunidad (${sharePct.toFixed(1).replace('.', ',')}% del Top 6)`,
        color: item.color,
        variancePct: calcVariancePct(item.followers, avgFollowers),
        averageLabel: '205k prom.',
      },
      hoverables,
      permanentLabel: {
        name: item.name,
        pctLabel: `${sharePct.toFixed(1).replace('.', ',')}%`,
        scale: 0.8,
      },
    });
    group.add(barGroup);
  });

  // Back row: Top Engagement (with floating rings)
  TOP_ENGAGEMENT_DATA.forEach((item, idx) => {
    const normH = (item.engagement / 28) * 3.9;
    const x = startX + idx * spacing;
    const { barGroup, topRing } = createCompositeCylinderBar({
      radius: 0.34,
      height: normH,
      color: item.color,
      position: [x, 0.14, -1.65],
      payload: {
        title: `${item.name} · Engagement`,
        metric: `${item.label} tasa`,
        subtitle: `Ranking #${idx + 1} en intensidad de respuesta`,
        color: item.color,
        variancePct: calcVariancePct(item.engagement, avgTopEngagement),
        averageLabel: '15,4% prom.',
      },
      hoverables,
      addTopRing: true,
      ringColor: item.color,
      permanentLabel: {
        name: item.name,
        pctLabel: item.label,
        scale: 0.8,
      },
    });
    group.add(barGroup);
    if (topRing) {
      rings.push(topRing);
      floatingNodes.push({
        obj: topRing,
        baseY: topRing.position.y,
        phase: idx * 0.7,
        speed: 2.0,
      });
    }
  });

  // Central floating emerald growth ring (+2,63%)
  const growthRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.08, 20, 64),
    makeBarMaterial('#10B981', 0.18, 0.5)
  );
  growthRing.position.set(5.4, 2.3, 0);
  growthRing.rotation.y = Math.PI / 4;
  growthRing.castShadow = true;
  group.add(growthRing);
  rings.push(growthRing);
  registerHoverable(
    growthRing,
    hoverables,
    {
      title: 'Crecimiento Neto Promedio',
      metric: '+2,63%',
      subtitle: 'Expansión orgánica media de seguidores en el período',
      color: '#10B981',
    },
    growthRing
  );

  return {
    group,
    hoverables,
    animatedObjects: { rings, floatingNodes },
    cameraPreset: { position: [6.2, 5.7, 11.4], target: [0.2, 2.6, 0] },
  };
}

/**
 * SLIDE 3: Ranking Top 20 Me Gusta (Anfiteatro 3D de 20 pilares cilíndricos sincronizados)
 */
export function buildSlide3Top20Ranking(): BuiltSlideScene {
  const group = new THREE.Group();
  const hoverables: THREE.Object3D[] = [];
  const rankBars: { rank: number; group: THREE.Group; mesh: THREE.Mesh; baseColor: THREE.Color }[] = [];

  // Position slightly to the right so the interactive filterable table sits cleanly on the left
  const stage = new THREE.Group();
  stage.position.set(2.85, 0, 0);
  group.add(stage);

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(4.4, 4.6, 0.12, 64),
    new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.6, metalness: 0.2 })
  );
  plinth.position.y = 0.06;
  plinth.receiveShadow = true;
  stage.add(plinth);

  const maxLikes = 1200000;
  const avgTop20Likes =
    TOP_20_LIKES.reduce((sum, acc) => sum + acc.likes, 0) / TOP_20_LIKES.length;

  TOP_20_LIKES.forEach((acc, idx) => {
    // 20 pillars arranged along a graceful descending spiral arc
    const t = idx / (TOP_20_LIKES.length - 1);
    const angle = -Math.PI * 0.85 + t * Math.PI * 1.7;
    const radius = 3.55 - t * 1.4;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Sqrt scaling so smaller ranks (#6–#19) remain visually legible alongside #1
    const scaledH = acc.likes === 0 ? 0.14 : 0.25 + Math.sqrt(acc.likes / maxLikes) * 4.05;

    const color =
      idx === 0
        ? '#0284C7'
        : idx === 1
          ? '#0F172A'
          : idx < 5
            ? '#10B981'
            : idx < 10
              ? '#F97316'
              : '#64748B';

    const { barGroup, shaftMesh } = createCompositeCylinderBar({
      radius: 0.24,
      height: scaledH,
      color,
      position: [x, 0.12, z],
      payload: {
        title: `#${acc.rank} · ${acc.name}`,
        metric: `${formatSpanishInt(acc.likes)} Me gusta`,
        subtitle: `${acc.category} · ${acc.shareOfLikes.toFixed(2).replace('.', ',')}% del total`,
        color,
        rank: acc.rank,
        variancePct: calcVariancePct(acc.likes, avgTop20Likes),
        averageLabel: '156,6k prom.',
      },
      hoverables,
      permanentLabel: {
        name: `${acc.rank}. ${acc.name}`,
        pctLabel: `${acc.shareOfLikes.toFixed(1).replace('.', ',')}%`,
        scale: 0.72,
      },
    });

    stage.add(barGroup);
    rankBars.push({
      rank: acc.rank,
      group: barGroup,
      mesh: shaftMesh,
      baseColor: new THREE.Color(color),
    });
  });

  return {
    group,
    hoverables,
    animatedObjects: { rankBars },
    cameraPreset: { position: [2.85, 5.7, 12.4], target: [1.5, 2.6, 0] },
  };
}

/**
 * SLIDE 4: Agenda Temática y Hashtags (Esfera/Nube 3D de Palabras + Barras Orbitales)
 */
export function buildSlide4TopicSphere(): BuiltSlideScene {
  const group = new THREE.Group();
  const hoverables: THREE.Object3D[] = [];
  const floatingNodes: { obj: THREE.Object3D; baseY: number; phase: number; speed: number }[] = [];

  const wordGroup = new THREE.Group();
  wordGroup.position.set(1.7, 2.55, 0);
  group.add(wordGroup);

  // Outer sleek wireframe latitude/longitude sphere guides
  const globeWire = new THREE.Mesh(
    new THREE.SphereGeometry(2.4, 18, 12),
    new THREE.MeshBasicMaterial({
      color: '#0284C7',
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    })
  );
  wordGroup.add(globeWire);

  // Central inner core
  const innerCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 24, 24),
    makeBarMaterial('#0F172A', 0.25, 0.6)
  );
  wordGroup.add(innerCore);

  // 6 Hashtags arranged in 3D sphere using Fibonacci distribution
  const sphereRadius = 2.35;
  const avgHashtagPct =
    HASHTAGS_DATA.reduce((sum, t) => sum + t.interactionPct, 0) / HASHTAGS_DATA.length;
  const avgMilestoneVal =
    VIRAL_MILESTONES.reduce((sum, m) => sum + m.interactions, 0) / VIRAL_MILESTONES.length;

  HASHTAGS_DATA.forEach((tag, idx) => {
    const phi = Math.acos(1 - (2 * (idx + 0.5)) / HASHTAGS_DATA.length);
    const theta = Math.PI * (1 + Math.sqrt(5)) * idx;

    const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
    const y = sphereRadius * Math.cos(phi) * 0.82;
    const z = sphereRadius * Math.sin(phi) * Math.sin(theta);

    const tex = createTagTexture(
      tag.tag,
      `${tag.interactionPct}% interacción`,
      tag.color
    );
    const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    const scaleBase = 1.65 + (tag.interactionPct / 45) * 0.85;
    sprite.scale.set(scaleBase, scaleBase * 0.375, 1);
    sprite.position.set(x, y, z);
    wordGroup.add(sprite);

    // Anchor pin sphere at surface
    const pin = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 16, 16),
      makeBarMaterial(tag.color, 0.2, 0.3)
    );
    pin.position.set(x * 0.78, y * 0.78, z * 0.78);
    wordGroup.add(pin);

    const payload: HoverPayload = {
      title: tag.tag,
      metric: `${tag.interactionPct}% de interacción`,
      subtitle: tag.topic,
      color: tag.color,
      variancePct: calcVariancePct(tag.interactionPct, avgHashtagPct),
      averageLabel: '22,7% prom.',
    };
    registerHoverable(sprite, hoverables, payload, pin);
    registerHoverable(pin, hoverables, payload, pin);
  });

  // 4 Viral Milestone Orbs orbiting the base ring
  const totalMilestones = VIRAL_MILESTONES.reduce((sum, m) => sum + m.interactions, 0);
  VIRAL_MILESTONES.forEach((m, idx) => {
    const angle = (idx / VIRAL_MILESTONES.length) * Math.PI * 2 + 0.4;
    const r = 3.25;
    const bx = 1.7 + Math.cos(angle) * r;
    const bz = Math.sin(angle) * r;
    const h = 0.65 + (m.interactions / 78700) * 1.45;
    const sharePct = (m.interactions / totalMilestones) * 100;

    const { barGroup } = createCompositeCylinderBar({
      radius: 0.26,
      height: h,
      color: m.color,
      position: [bx, 0, bz],
      payload: {
        title: m.title,
        metric: m.extra ? `${m.interactionsLabel} (${m.extra})` : `${m.interactionsLabel} interacciones`,
        subtitle: m.category,
        color: m.color,
        variancePct: calcVariancePct(m.interactions, avgMilestoneVal),
        averageLabel: '67,1k prom.',
      },
      hoverables,
      addTopRing: true,
      permanentLabel: {
        name: m.title,
        pctLabel: m.id === 'afp-papaya' ? '273%' : `${sharePct.toFixed(1).replace('.', ',')}%`,
        scale: 0.72,
      },
    });
    group.add(barGroup);
  });

  return {
    group,
    hoverables,
    animatedObjects: { wordGroup, floatingNodes },
    cameraPreset: { position: [0.8, 3.8, 9.6], target: [1.0, 2.1, 0] },
  };
}

/**
 * SLIDE 5: Radar de Sentimiento Negativo (Curva 3D con Picos Anotados)
 */
export function buildSlide5SentimentCurve(): BuiltSlideScene {
  const group = new THREE.Group();
  const hoverables: THREE.Object3D[] = [];
  const rings: THREE.Mesh[] = [];
  const floatingNodes: { obj: THREE.Object3D; baseY: number; phase: number; speed: number }[] = [];

  // Long architectural base rail
  const rail = new THREE.Mesh(
    new THREE.BoxGeometry(11.4, 0.14, 2.2),
    new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.6, metalness: 0.2 })
  );
  rail.position.set(0.3, 0.07, 0);
  rail.receiveShadow = true;
  group.add(rail);

  const points3D: THREE.Vector3[] = [];
  const spanX = 9.8;
  const startX = -spanX / 2 + 0.3;

  SENTIMENT_SERIES.forEach((pt, idx) => {
    const x = startX + (idx / (SENTIMENT_SERIES.length - 1)) * spanX;
    const y = 0.25 + (pt.negativity / 55) * 4.2;
    points3D.push(new THREE.Vector3(x, y, 0));
  });

  const curve = new THREE.CatmullRomCurve3(points3D, false, 'catmullrom', 0.35);

  // Smooth 3D Tube curve
  const tubeGeo = new THREE.TubeGeometry(curve, 128, 0.085, 16, false);
  const tubeMat = makeBarMaterial('#F97316', 0.22, 0.35);
  const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
  tubeMesh.castShadow = true;
  group.add(tubeMesh);

  // Translucent area wall under curve
  const sampled = curve.getPoints(90);
  const shape = new THREE.Shape();
  shape.moveTo(sampled[0].x, 0.14);
  sampled.forEach((p) => shape.lineTo(p.x, p.y));
  shape.lineTo(sampled[sampled.length - 1].x, 0.14);
  shape.closePath();

  const areaGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: false });
  areaGeo.translate(0, 0, -0.09);
  const areaMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#FB923C'),
    transparent: true,
    opacity: 0.28,
    roughness: 0.35,
    metalness: 0.1,
  });
  const areaMesh = new THREE.Mesh(areaGeo, areaMat);
  group.add(areaMesh);

  // Nodes & Peak Beacons
  const avgSentiment =
    SENTIMENT_SERIES.reduce((sum, pt) => sum + pt.negativity, 0) /
    SENTIMENT_SERIES.length;

  SENTIMENT_SERIES.forEach((pt, idx) => {
    const pos = points3D[idx];
    const color = pt.negativity >= 50 ? '#DC2626' : pt.isPeak ? '#F97316' : '#0284C7';
    const nodeRadius = pt.isPeak ? 0.22 : 0.12;

    // Vertical support pillar down to base
    const mastH = pos.y - 0.14;
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.055, mastH, 16),
      new THREE.MeshStandardMaterial({
        color: pt.isPeak ? color : '#94A3B8',
        roughness: 0.4,
        metalness: 0.5,
      })
    );
    mast.position.set(pos.x, 0.14 + mastH / 2, 0);
    mast.castShadow = true;
    group.add(mast);

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(nodeRadius, 24, 24),
      makeBarMaterial(color, 0.15, 0.35)
    );
    sphere.position.copy(pos);
    sphere.castShadow = true;
    group.add(sphere);

    if (pt.isPeak) {
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.36, 0.035, 16, 48),
        makeBarMaterial(color, 0.2, 0.45)
      );
      halo.position.copy(pos);
      group.add(halo);
      rings.push(halo);
      floatingNodes.push({ obj: halo, baseY: pos.y, phase: idx * 0.9, speed: 2.2 });

      // Permanent vertical flag over each crisis peak
      const peakSprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: createVerticalBarLabelTexture(
            `${pt.date} · ${pt.label ?? ''}`,
            `${pt.negativity}%`,
            color
          ),
          transparent: true,
          depthWrite: false,
        })
      );
      peakSprite.center.set(0.5, 0);
      peakSprite.scale.set(0.46, 1.84, 1);
      peakSprite.position.set(pos.x, pos.y + 0.42, pos.z);
      group.add(peakSprite);
    }

    registerHoverable(
      sphere,
      hoverables,
      {
        title: pt.label ? `${pt.date} · ${pt.label}` : `Medición ${pt.date}`,
        metric: `${pt.negativity}% sentimiento negativo`,
        subtitle: pt.detail ?? 'Nivel basal de conversación regional',
        color,
        variancePct: calcVariancePct(pt.negativity, avgSentiment),
        averageLabel: '30,1% prom.',
      },
      sphere
    );
  });

  return {
    group,
    hoverables,
    animatedObjects: { rings, floatingNodes },
    cameraPreset: { position: [0.3, 3.6, 10.2], target: [0.3, 2.0, 0] },
  };
}

/**
 * SLIDE 6: Ingeniería de Formatos, Audiencia y Cierre (Barras Volumen + Anillos Engagement + Dona Audiencia)
 */
export function buildSlide6FormatsAndAudience(): BuiltSlideScene {
  const group = new THREE.Group();
  const hoverables: THREE.Object3D[] = [];
  const rings: THREE.Mesh[] = [];
  const floatingNodes: { obj: THREE.Object3D; baseY: number; phase: number; speed: number }[] = [];

  // Stage platform
  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(11.6, 0.14, 4.4),
    new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.6, metalness: 0.18 })
  );
  platform.position.set(0.3, 0.07, 0);
  platform.receiveShadow = true;
  group.add(platform);

  // Left-center: 3 Volume Cylinders + 3 Engagement Floating Rings
  const xPositions = [-3.1, -0.8, 1.5];
  const totalVolume = FORMATS_DATA.reduce((sum, f) => sum + f.volume, 0);
  const avgVolume = totalVolume / FORMATS_DATA.length;
  const avgEngagementFmt =
    FORMATS_DATA.reduce((sum, f) => sum + f.engagementRate, 0) / FORMATS_DATA.length;

  FORMATS_DATA.forEach((f, idx) => {
    const volH = (f.volume / 2800) * 3.5;
    const x = xPositions[idx];
    const volSharePct = (f.volume / totalVolume) * 100;

    // Volume Tower
    const { barGroup } = createCompositeCylinderBar({
      radius: 0.48,
      height: volH,
      color: f.color,
      position: [x, 0.14, 0.55],
      payload: {
        title: `${f.format} · Volumen`,
        metric: `${f.volumeLabel} publicaciones`,
        subtitle: `Participación de volumen: ${volSharePct.toFixed(1).replace('.', ',')}% · Engagement: ${f.engagementLabel}`,
        color: f.color,
        variancePct: calcVariancePct(f.volume, avgVolume),
        averageLabel: '1.765 prom.',
      },
      hoverables,
      permanentLabel: {
        name: f.format,
        pctLabel: `${volSharePct.toFixed(1).replace('.', ',')}%`,
        scale: 0.92,
      },
    });
    group.add(barGroup);

    // Floating Engagement Ring proportional to Engagement Rate (Reels 1.36% stands tallest!)
    const ringRadius = 0.42 + (f.engagementRate / 1.36) * 0.52;
    const ringY = 1.6 + (f.engagementRate / 1.36) * 2.0;
    const engRing = new THREE.Mesh(
      new THREE.TorusGeometry(ringRadius, 0.095, 20, 56),
      makeBarMaterial(f.color, 0.18, 0.45)
    );
    engRing.position.set(x, ringY, -1.05);
    engRing.castShadow = true;
    group.add(engRing);
    rings.push(engRing);
    floatingNodes.push({ obj: engRing, baseY: ringY, phase: idx * 1.1, speed: 1.7 });

    const ringLabel = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createPieSliceLabelTexture(`${f.format} (Eng.)`, f.engagementLabel, f.color),
        transparent: true,
        depthWrite: false,
      })
    );
    ringLabel.scale.set(1.55, 0.42, 1);
    ringLabel.position.set(x, ringY + ringRadius + 0.36, -1.05);
    group.add(ringLabel);

    registerHoverable(
      engRing,
      hoverables,
      {
        title: `${f.format} · Engagement`,
        metric: `${f.engagementLabel} tasa`,
        subtitle: `${f.volumeLabel} piezas publicadas en el período`,
        color: f.color,
        variancePct: calcVariancePct(f.engagementRate, avgEngagementFmt),
        averageLabel: '0,76% prom.',
      },
      engRing
    );
  });

  // Right side: Bipartite 3D Audience Donut (52% Mujeres / 48% Hombres)
  const audienceGroup = new THREE.Group();
  audienceGroup.position.set(4.15, 2.25, 0);
  group.add(audienceGroup);

  const womenArc = Math.PI * 2 * 0.52;
  const menArc = Math.PI * 2 * 0.48;

  const womenMesh = new THREE.Mesh(
    new THREE.TorusGeometry(1.18, 0.24, 24, 64, womenArc - 0.08),
    makeBarMaterial('#0284C7', 0.2, 0.35)
  );
  womenMesh.castShadow = true;
  audienceGroup.add(womenMesh);
  registerHoverable(
    womenMesh,
    hoverables,
    {
      title: 'Audiencia · Mujeres',
      metric: '52%',
      subtitle: 'Núcleo etario principal: 35–54 años',
      color: '#0284C7',
      variancePct: calcVariancePct(52, 50),
      averageLabel: '50,0% paridad',
    },
    womenMesh
  );

  const menMesh = new THREE.Mesh(
    new THREE.TorusGeometry(1.18, 0.24, 24, 64, menArc - 0.08),
    makeBarMaterial('#0F172A', 0.24, 0.4)
  );
  menMesh.rotation.z = womenArc;
  menMesh.castShadow = true;
  audienceGroup.add(menMesh);
  registerHoverable(
    menMesh,
    hoverables,
    {
      title: 'Audiencia · Hombres',
      metric: '48%',
      subtitle: 'Núcleo etario principal: 35–54 años',
      color: '#0F172A',
      variancePct: calcVariancePct(48, 50),
      averageLabel: '50,0% paridad',
    },
    menMesh
  );

  const audLabel = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createPieSliceLabelTexture('Audiencia 35–54', '52% M · 48% H', '#0284C7'),
      transparent: true,
      depthWrite: false,
    })
  );
  audLabel.scale.set(1.75, 0.48, 1);
  audLabel.position.set(0, 1.78, 0);
  audienceGroup.add(audLabel);

  floatingNodes.push({ obj: audienceGroup, baseY: 2.25, phase: 0.4, speed: 1.3 });

  return {
    group,
    hoverables,
    animatedObjects: { rings, floatingNodes },
    cameraPreset: { position: [0.4, 4.7, 11.8], target: [0.4, 2.4, 0] },
  };
}

/**
 * SLIDE 7: Me Gusta del Período por Actor (22 cuentas @Instagram)
 */
export function buildSlide7ActorsLikes(): BuiltSlideScene {
  const group = new THREE.Group();
  const hoverables: THREE.Object3D[] = [];
  const rings: THREE.Mesh[] = [];
  const floatingNodes: { obj: THREE.Object3D; baseY: number; phase: number; speed: number }[] = [];
  const rankBars: { rank: number; group: THREE.Group; mesh: THREE.Mesh; baseColor: THREE.Color }[] = [];

  // Offset to the right so the interactive 22-actor Bento table sits unobstructed on the left
  const stage = new THREE.Group();
  stage.position.set(2.85, 0, 0);
  group.add(stage);

  const podium = new THREE.Mesh(
    new THREE.BoxGeometry(9.4, 0.14, 4.4),
    new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.62, metalness: 0.2 })
  );
  podium.position.set(0, 0.07, 0);
  podium.receiveShadow = true;
  stage.add(podium);

  const maxLikes = 1200000;
  const totalActorsLikes = ACTORS_LIKES_DATA.reduce((sum, a) => sum + a.likes, 0);
  const avgActorLikes = totalActorsLikes / ACTORS_LIKES_DATA.length;
  const colsPerRow = 11;
  const spacingX = 0.78;
  const startX = -((colsPerRow - 1) * spacingX) / 2;

  ACTORS_LIKES_DATA.forEach((actor, idx) => {
    const isBackRow = idx < colsPerRow;
    const colIdx = idx % colsPerRow;
    const x = startX + colIdx * spacingX;
    const z = isBackRow ? -0.95 : 1.05;

    const scaledH =
      actor.likes === 0 ? 0.14 : 0.28 + Math.sqrt(actor.likes / maxLikes) * 3.9;
    const sharePct = (actor.likes / totalActorsLikes) * 100;

    const color =
      idx === 0
        ? '#0284C7'
        : idx === 1
          ? '#0F172A'
          : idx === 2
            ? '#10B981'
            : idx < 6
              ? '#F97316'
              : actor.likes > 0
                ? '#38BDF8'
                : '#94A3B8';

    const { barGroup, shaftMesh, topRing } = createCompositeCylinderBar({
      radius: 0.25,
      height: scaledH,
      color,
      position: [x, 0.14, z],
      payload: {
        title: `#${actor.rank} · ${actor.handle}`,
        metric: `${actor.likesLabel} Me gusta (${formatSpanishInt(actor.likes)})`,
        subtitle: `Seguidores: ${actor.followersLabel} · Posts: ${actor.posts} · Interacción: ${actor.interactionRate}`,
        color,
        rank: actor.rank,
        variancePct: calcVariancePct(actor.likes, avgActorLikes),
        averageLabel: '141,3k prom.',
      },
      hoverables,
      addTopRing: idx < 3,
      ringColor: color,
      permanentLabel: {
        name: actor.handle,
        pctLabel: `${sharePct.toFixed(1).replace('.', ',')}%`,
        scale: 0.7,
      },
    });

    stage.add(barGroup);

    if (topRing) {
      rings.push(topRing);
      floatingNodes.push({
        obj: topRing,
        baseY: topRing.position.y,
        phase: idx * 0.8,
        speed: 1.9,
      });
    }

    rankBars.push({
      rank: actor.rank,
      group: barGroup,
      mesh: shaftMesh,
      baseColor: new THREE.Color(color),
    });
  });

  return {
    group,
    hoverables,
    animatedObjects: { rings, floatingNodes, rankBars },
    cameraPreset: { position: [2.8, 5.6, 12.4], target: [1.55, 2.6, 0] },
  };
}

/**
 * SLIDE 8: Cuota de Influencia por Actor Principal (Gráfico de Pastel 3D Interactivo)
 */
export function buildSlide8LikesPie3D(): BuiltSlideScene {
  const group = new THREE.Group();
  const hoverables: THREE.Object3D[] = [];
  const rings: THREE.Mesh[] = [];
  const pieSlices: {
    rank: number;
    mesh: THREE.Mesh;
    baseColor: THREE.Color;
    bisectorAngle: number;
    baseY: number;
  }[] = [];

  // Offset to the right so the interactive legend & breakdown sit unobstructed on the left
  const stage = new THREE.Group();
  stage.position.set(2.3, 0, 0);
  group.add(stage);

  // Grounded brushed architectural disc plinth
  const baseOuter = new THREE.Mesh(
    new THREE.CylinderGeometry(3.45, 3.65, 0.16, 64),
    new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.55, metalness: 0.28 })
  );
  baseOuter.position.y = 0.08;
  baseOuter.receiveShadow = true;
  stage.add(baseOuter);

  const baseInner = new THREE.Mesh(
    new THREE.CylinderGeometry(3.05, 3.1, 0.2, 64),
    new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.38, metalness: 0.45 })
  );
  baseInner.position.y = 0.16;
  baseInner.receiveShadow = true;
  stage.add(baseInner);

  // Outer floating cyan accent halo
  const haloRing = new THREE.Mesh(
    new THREE.TorusGeometry(3.48, 0.045, 16, 96),
    makeBarMaterial('#0284C7', 0.2, 0.5)
  );
  haloRing.rotation.x = Math.PI / 2;
  haloRing.position.y = 0.28;
  stage.add(haloRing);
  rings.push(haloRing);

  const totalLikes = LIKES_PIE_DATA.reduce((sum, s) => sum + s.likes, 0);
  const avgSliceLikes = totalLikes / LIKES_PIE_DATA.length;
  const outerRadius = 2.78;
  const innerRadius = 0.62;
  const gapAngle = 0.028;

  let currentAngle = Math.PI * 0.5;

  LIKES_PIE_DATA.forEach((slice, idx) => {
    const sweep = (slice.likes / totalLikes) * Math.PI * 2;
    const startAngle = currentAngle + gapAngle / 2;
    const endAngle = currentAngle + sweep - gapAngle / 2;
    const bisectorAngle = (startAngle + endAngle) / 2;

    // Stepped 3D depth by rank so top influencers rise above secondary actors
    const depth = Math.max(0.46, 0.92 - idx * 0.065);

    const shape = new THREE.Shape();
    shape.moveTo(Math.cos(startAngle) * innerRadius, Math.sin(startAngle) * innerRadius);
    shape.lineTo(Math.cos(startAngle) * outerRadius, Math.sin(startAngle) * outerRadius);
    shape.absarc(0, 0, outerRadius, startAngle, endAngle, false);
    shape.lineTo(Math.cos(endAngle) * innerRadius, Math.sin(endAngle) * innerRadius);
    shape.absarc(0, 0, innerRadius, endAngle, startAngle, true);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 4,
      curveSegments: 36,
    });
    // Rotate so extrusion points upward along +Y
    geo.rotateX(-Math.PI / 2);

    const mat = makeBarMaterial(slice.color, 0.2, 0.22);
    const mesh = new THREE.Mesh(geo, mat);
    const baseY = 0.3;
    mesh.position.set(0, baseY, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    stage.add(mesh);

    // Permanent floating label above each pie slice
    const labelRadius = 1.95;
    const lx = Math.cos(bisectorAngle) * labelRadius;
    const lz = -Math.sin(bisectorAngle) * labelRadius;
    const labelY = depth + 0.52 + (idx % 2 === 0 ? 0.15 : 0.48);

    const stemH = labelY - depth - 0.02;
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, stemH, 8),
      new THREE.MeshStandardMaterial({ color: '#94A3B8', roughness: 0.4, metalness: 0.5 })
    );
    stem.position.set(lx, depth + stemH / 2, lz);
    mesh.add(stem);

    const sliceLabel = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createPieSliceLabelTexture(
          slice.name,
          `${slice.sharePct.toFixed(1).replace('.', ',')}%`,
          slice.color
        ),
        transparent: true,
        depthWrite: false,
      })
    );
    sliceLabel.scale.set(1.38, 0.38, 1);
    sliceLabel.position.set(lx, labelY + 0.16, lz);
    mesh.add(sliceLabel);

    registerHoverable(
      mesh,
      hoverables,
      {
        title: `#${slice.rank} · ${slice.name} (${slice.handle})`,
        metric: `${slice.likesLabel} Me gusta (${slice.sharePct.toFixed(2).replace('.', ',')}%)`,
        subtitle: slice.role,
        color: slice.color,
        rank: slice.rank,
        variancePct: calcVariancePct(slice.likes, avgSliceLikes),
        averageLabel: '444,0k prom.',
      },
      mesh
    );

    pieSlices.push({
      rank: slice.rank,
      mesh,
      baseColor: new THREE.Color(slice.color),
      bisectorAngle,
      baseY,
    });

    currentAngle += sweep;
  });

  // Central polished metallic hub core
  const hubMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.54, 0.58, 0.72, 48),
    new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.24, metalness: 0.55 })
  );
  hubMesh.position.y = 0.62;
  hubMesh.castShadow = true;
  stage.add(hubMesh);

  return {
    group,
    hoverables,
    animatedObjects: { rings, pieSlices },
    cameraPreset: { position: [2.3, 5.5, 8.6], target: [1.1, 0.8, 0] },
  };
}
