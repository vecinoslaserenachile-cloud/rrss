import * as THREE from 'three';
import {
  BENCHMARK_FOLLOWERS_TOP,
  BENCHMARK_FORMATS,
  BENCHMARK_HEATMAP_MATRIX,
  BENCHMARK_OUTLIERS,
  BENCHMARK_REACH_SLICES,
  BENCHMARK_SENTIMENT,
  CONURBANO_DUEL_DATA,
  HEATMAP_DAYS,
  HEATMAP_HOURS,
} from '../data/benchmarkData';
import { GLOBAL_ACTORS_RANKING } from '../data/globalActorsData';
import { createActorEmblemTexture } from './actorEmblemTextures';
import {
  createDarkFloatingBadgeTexture,
  createDarkVerticalBarLabelTexture,
} from './proceduralTextures';
import { BuiltSlideScene, HoverPayload } from './slideBuilders';

export type ConurbanoDuelMode = 'totals' | 'efficiency';

function calcVariancePct(value: number, average: number): number {
  if (average === 0) return 0;
  return ((value - average) / average) * 100;
}

function makeNeonPhysicalMaterial(
  colorHex: string,
  emissiveIntensity = 0.22,
  transmission = 0.08
) {
  const c = new THREE.Color(colorHex);
  return new THREE.MeshPhysicalMaterial({
    color: c,
    roughness: 0.18,
    metalness: 0.42,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
    emissive: c,
    emissiveIntensity,
    transparent: transmission > 0,
    opacity: transmission > 0 ? 1 - transmission * 0.25 : 1,
  });
}

function registerDarkHoverable(
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
      : 0.2;
  hoverables.push(obj);
}

function createDarkCylinderBar(options: {
  radius: number;
  height: number;
  color: string;
  position: [number, number, number];
  payload: HoverPayload;
  hoverables: THREE.Object3D[];
  addTopRing?: boolean;
  labelName: string;
  labelPct: string;
  labelScale?: number;
}): { barGroup: THREE.Group; shaft: THREE.Mesh; topRing?: THREE.Mesh } {
  const {
    radius,
    height,
    color,
    position,
    payload,
    hoverables,
    addTopRing,
    labelName,
    labelPct,
    labelScale = 0.85,
  } = options;

  const barGroup = new THREE.Group();
  barGroup.position.set(position[0], position[1], position[2]);

  const safeH = Math.max(0.2, height);

  // Dark metallic collar base
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 1.18, radius * 1.28, 0.12, 32),
    new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.35, metalness: 0.8 })
  );
  collar.position.y = 0.06;
  collar.castShadow = true;
  barGroup.add(collar);

  // Neon rim ring around base
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 1.22, 0.018, 10, 36),
    new THREE.MeshBasicMaterial({ color })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.12;
  barGroup.add(rim);

  // Main shaft
  const shaftMat = makeNeonPhysicalMaterial(color, 0.2, 0.1);
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.92, radius, safeH, 36),
    shaftMat
  );
  shaft.position.y = 0.12 + safeH / 2;
  shaft.castShadow = true;
  barGroup.add(shaft);

  // Bright top cap
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.72, radius * 0.92, 0.08, 32),
    new THREE.MeshStandardMaterial({
      color: '#E2E8F0',
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.35,
      roughness: 0.2,
      metalness: 0.6,
    })
  );
  cap.position.y = 0.12 + safeH + 0.04;
  barGroup.add(cap);

  let topRing: THREE.Mesh | undefined;
  if (addTopRing) {
    topRing = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 1.38, 0.045, 16, 48),
      makeNeonPhysicalMaterial(color, 0.45, 0)
    );
    topRing.rotation.x = Math.PI / 2;
    topRing.position.y = 0.12 + safeH + 0.38;
    barGroup.add(topRing);
    registerDarkHoverable(topRing, hoverables, payload, shaft);
  }

  // Permanent dark vertical label
  const stemBaseY = addTopRing ? 0.12 + safeH + 0.44 : 0.12 + safeH + 0.08;
  const stemH = 0.16;
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, stemH, 8),
    new THREE.MeshBasicMaterial({ color })
  );
  stem.position.y = stemBaseY + stemH / 2;
  barGroup.add(stem);

  const tex = createDarkVerticalBarLabelTexture(labelName, labelPct, color);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  sprite.center.set(0.5, 0);
  sprite.scale.set(0.58 * labelScale, 2.2 * labelScale, 1);
  sprite.position.y = stemBaseY + stemH;
  barGroup.add(sprite);

  registerDarkHoverable(sprite, hoverables, payload, shaft);
  registerDarkHoverable(shaft, hoverables, payload, shaft);

  return { barGroup, shaft, topRing };
}

/**
 * CHAPTER 0: Ecosistema Regional (28 Días) — Monumento radial 3D de seguidores
 */
export function buildBenchmarkCh0Ecosystem(): BuiltSlideScene {
  const group = new THREE.Group();
  const hoverables: THREE.Object3D[] = [];
  const gyroRings: THREE.Mesh[] = [];
  const floatingNodes: { obj: THREE.Object3D; baseY: number; phase: number; speed: number }[] = [];

  const stage = new THREE.Group();
  stage.position.set(1.3, 0, 0);
  group.add(stage);

  // Dark brushed disc platform
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(4.1, 4.35, 0.16, 64),
    new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.38, metalness: 0.72 })
  );
  plinth.position.y = 0.08;
  stage.add(plinth);

  const neonBaseRing = new THREE.Mesh(
    new THREE.TorusGeometry(4.12, 0.035, 16, 96),
    new THREE.MeshBasicMaterial({ color: '#00F0FF' })
  );
  neonBaseRing.rotation.x = Math.PI / 2;
  neonBaseRing.position.y = 0.17;
  stage.add(neonBaseRing);

  // Central holographic core
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.75, 2),
    makeNeonPhysicalMaterial('#00F0FF', 0.45, 0.18)
  );
  core.position.y = 2.4;
  stage.add(core);
  registerDarkHoverable(
    core,
    hoverables,
    {
      title: 'Telemetría Coquimbo · 28 Días',
      metric: '478,5k interacciones',
      subtitle: '26 cuentas monitoreadas · 1.965 posts · 1,97% ER medio',
      color: '#00F0FF',
    },
    core
  );

  const r1 = new THREE.Mesh(
    new THREE.TorusGeometry(1.45, 0.035, 16, 80),
    makeNeonPhysicalMaterial('#00F0FF', 0.55, 0)
  );
  r1.position.y = 2.4;
  r1.rotation.set(0.85, 0.2, 0.4);
  stage.add(r1);
  gyroRings.push(r1);

  const r2 = new THREE.Mesh(
    new THREE.TorusGeometry(1.85, 0.03, 16, 80),
    makeNeonPhysicalMaterial('#FF2E93', 0.55, 0)
  );
  r2.position.y = 2.4;
  r2.rotation.set(-0.7, 0.4, 0.9);
  stage.add(r2);
  gyroRings.push(r2);

  // Top 10 radial monument pillars sorted by followers
  const totalTopFollowers = BENCHMARK_FOLLOWERS_TOP.reduce((s, a) => s + a.followers, 0);
  const avgFollowers = totalTopFollowers / BENCHMARK_FOLLOWERS_TOP.length;
  const maxFollowers = BENCHMARK_FOLLOWERS_TOP[0].followers;

  BENCHMARK_FOLLOWERS_TOP.forEach((acc, i) => {
    const angle = -Math.PI * 0.8 + (i / BENCHMARK_FOLLOWERS_TOP.length) * Math.PI * 2;
    const radius = 3.45;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const height = 0.65 + (acc.followers / maxFollowers) * 3.1;
    const sharePct = (acc.followers / totalTopFollowers) * 100;

    const { barGroup } = createDarkCylinderBar({
      radius: 0.23,
      height,
      color: acc.color,
      position: [x, 0.16, z],
      payload: {
        title: `#${acc.rank} · ${acc.handle}`,
        metric: `${acc.followersLabel} seguidores`,
        subtitle: `${acc.role} · ${sharePct.toFixed(1).replace('.', ',')}% del Top 10`,
        color: acc.color,
        rank: acc.rank,
        variancePct: calcVariancePct(acc.followers, avgFollowers),
        averageLabel: '59,0k prom.',
      },
      hoverables,
      labelName: `${acc.rank}. ${acc.handle}`,
      labelPct: acc.followersLabel,
      labelScale: 0.72,
    });
    stage.add(barGroup);
  });

  return {
    group,
    hoverables,
    animatedObjects: { gyroRings, floatingNodes },
    cameraPreset: { position: [1.3, 5.2, 12.2], target: [0.8, 2.3, 0] },
  };
}

/**
 * CHAPTER 1: Cuota de Alcance e Interacciones — Dona 3D segmentada y extruida
 */
export function buildBenchmarkCh1ReachDonut(): BuiltSlideScene {
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

  const stage = new THREE.Group();
  stage.position.set(2.1, 0, 0);
  group.add(stage);

  const baseDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(3.45, 3.65, 0.16, 64),
    new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.4, metalness: 0.75 })
  );
  baseDisc.position.y = 0.08;
  stage.add(baseDisc);

  const outerGlowRing = new THREE.Mesh(
    new THREE.TorusGeometry(3.48, 0.035, 16, 96),
    new THREE.MeshBasicMaterial({ color: '#00F0FF' })
  );
  outerGlowRing.rotation.x = Math.PI / 2;
  outerGlowRing.position.y = 0.18;
  stage.add(outerGlowRing);
  rings.push(outerGlowRing);

  const totalInt = BENCHMARK_REACH_SLICES.reduce((s, d) => s + d.interactions, 0);
  const avgInt = totalInt / BENCHMARK_REACH_SLICES.length;
  const outerRadius = 2.85;
  const innerRadius = 1.15;
  const gapAngle = 0.035;

  let currentAngle = Math.PI * 0.45;

  BENCHMARK_REACH_SLICES.forEach((slice, idx) => {
    const sweep = (slice.interactions / totalInt) * Math.PI * 2;
    const startAngle = currentAngle + gapAngle / 2;
    const endAngle = currentAngle + sweep - gapAngle / 2;
    const bisectorAngle = (startAngle + endAngle) / 2;
    const depth = slice.rank <= 5 ? 0.96 - idx * 0.06 : 0.48;

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
    geo.rotateX(-Math.PI / 2);

    const mesh = new THREE.Mesh(geo, makeNeonPhysicalMaterial(slice.color, 0.24, 0.08));
    const baseY = 0.24;
    mesh.position.set(0, baseY, 0);
    stage.add(mesh);

    // Permanent floating label above slice
    const labelRadius = 2.05;
    const lx = Math.cos(bisectorAngle) * labelRadius;
    const lz = -Math.sin(bisectorAngle) * labelRadius;
    const labelY = depth + 0.55 + (idx % 2 === 0 ? 0.1 : 0.42);

    const stemH = labelY - depth - 0.02;
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, stemH, 8),
      new THREE.MeshBasicMaterial({ color: slice.color })
    );
    stem.position.set(lx, depth + stemH / 2, lz);
    mesh.add(stem);

    const badge = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createDarkFloatingBadgeTexture(
          slice.handle,
          `${slice.interactionsLabel} · ${slice.sharePct.toFixed(1).replace('.', ',')}%`,
          slice.color
        ),
        transparent: true,
        depthWrite: false,
      })
    );
    badge.scale.set(1.62, 0.44, 1);
    badge.position.set(lx, labelY + 0.18, lz);
    mesh.add(badge);

    registerDarkHoverable(
      mesh,
      hoverables,
      {
        title: `#${slice.rank} · ${slice.handle}`,
        metric: `${slice.interactionsLabel} interacciones (${slice.sharePct.toFixed(1).replace('.', ',')}%)`,
        subtitle: slice.note,
        color: slice.color,
        rank: slice.rank,
        variancePct: calcVariancePct(slice.interactions, avgInt),
        averageLabel: '79,8k prom.',
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

  // Central telemetry sphere inside donut hole
  const centerBeacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 24, 24),
    makeNeonPhysicalMaterial('#00F0FF', 0.45, 0.15)
  );
  centerBeacon.position.y = 0.82;
  stage.add(centerBeacon);

  return {
    group,
    hoverables,
    animatedObjects: { rings, pieSlices },
    cameraPreset: { position: [2.1, 5.8, 8.8], target: [1.0, 0.95, 0] },
  };
}

/**
 * CHAPTER 2: Duelo Conurbado (La Serena vs. Coquimbo)
 * Includes dual sub-groups inside the scene: 'totals' and 'efficiency' toggled seamlessly.
 */
export function buildBenchmarkCh2Duel(): {
  scene: BuiltSlideScene;
  totalsGroup: THREE.Group;
  efficiencyGroup: THREE.Group;
  totalsHoverables: THREE.Object3D[];
  efficiencyHoverables: THREE.Object3D[];
} {
  const group = new THREE.Group();
  const hoverables: THREE.Object3D[] = [];
  const totalsHoverables: THREE.Object3D[] = [];
  const efficiencyHoverables: THREE.Object3D[] = [];

  // Shared futuristic versus arena deck
  const arena = new THREE.Mesh(
    new THREE.BoxGeometry(11.4, 0.16, 4.6),
    new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.4, metalness: 0.72 })
  );
  arena.position.set(0.5, 0.08, 0);
  group.add(arena);

  // Center neon divider strip (La Serena left vs Coquimbo right)
  const divider = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.05, 4.4),
    new THREE.MeshBasicMaterial({ color: '#FF2E93' })
  );
  divider.position.set(0.5, 0.18, 0);
  group.add(divider);

  const totalsGroup = new THREE.Group();
  const efficiencyGroup = new THREE.Group();
  efficiencyGroup.visible = false;
  group.add(totalsGroup);
  group.add(efficiencyGroup);

  const xPositions = [-3.6, -1.25, 2.25, 4.6];
  // Reorder so La Serena (muni_laserena, daniela.laserena) faces Coquimbo (muni_coquimbo, manouchehri19)
  const ordered = [
    CONURBANO_DUEL_DATA[0], // muni_laserena
    CONURBANO_DUEL_DATA[2], // daniela.laserena
    CONURBANO_DUEL_DATA[1], // municipalidaddecoquimbo
    CONURBANO_DUEL_DATA[3], // manouchehri19
  ];

  const avgLikes = ordered.reduce((s, a) => s + a.likes, 0) / ordered.length;
  const avgPosts = ordered.reduce((s, a) => s + a.posts, 0) / ordered.length;
  const avgLikesPost = ordered.reduce((s, a) => s + a.likesPerPost, 0) / ordered.length;
  const avgEr = ordered.reduce((s, a) => s + a.er, 0) / ordered.length;

  ordered.forEach((actor, idx) => {
    const x = xPositions[idx];

    // --- MODE A: TOTALS (Likes column + Posts column) ---
    const likesH = 0.55 + (actor.likes / 68900) * 3.45;
    const { barGroup: likesBar } = createDarkCylinderBar({
      radius: 0.36,
      height: likesH,
      color: actor.color,
      position: [x - 0.38, 0.16, 0.55],
      payload: {
        title: `${actor.handle} · Me Gusta Totales`,
        metric: `${actor.likesLabel} Me gusta`,
        subtitle: `${actor.city} · ${actor.followersLabel} seg · ${actor.commentsLabel} com`,
        color: actor.color,
        variancePct: calcVariancePct(actor.likes, avgLikes),
        averageLabel: '42,4k prom.',
      },
      hoverables: totalsHoverables,
      addTopRing: true,
      labelName: `${actor.handle} · Likes`,
      labelPct: actor.likesLabel,
      labelScale: 0.78,
    });
    totalsGroup.add(likesBar);

    const postsH = 0.35 + (actor.posts / 152) * 2.85;
    const { barGroup: postsBar } = createDarkCylinderBar({
      radius: 0.26,
      height: postsH,
      color: '#94A3B8',
      position: [x + 0.42, 0.16, -0.75],
      payload: {
        title: `${actor.handle} · Publicaciones`,
        metric: `${actor.posts} posts`,
        subtitle: `${actor.city} (${actor.role}) · ER: ${actor.erLabel}`,
        color: '#94A3B8',
        variancePct: calcVariancePct(actor.posts, avgPosts),
        averageLabel: '68,3 prom.',
      },
      hoverables: totalsHoverables,
      labelName: 'Posts',
      labelPct: `${actor.posts}`,
      labelScale: 0.68,
    });
    totalsGroup.add(postsBar);

    // --- MODE B: EFFICIENCY (Likes/post column + ER% column) ---
    const lppH = 0.5 + (actor.likesPerPost / 2788.9) * 3.7;
    const { barGroup: lppBar } = createDarkCylinderBar({
      radius: 0.36,
      height: lppH,
      color: actor.color,
      position: [x - 0.38, 0.16, 0.55],
      payload: {
        title: `${actor.handle} · Likes por Post`,
        metric: `${actor.likesPerPostLabel} likes/post`,
        subtitle: `${actor.commentsPerPostLabel} com/post · ${actor.posts} posts emitidos`,
        color: actor.color,
        variancePct: calcVariancePct(actor.likesPerPost, avgLikesPost),
        averageLabel: '1.178 prom.',
      },
      hoverables: efficiencyHoverables,
      addTopRing: true,
      labelName: `${actor.handle} · L/Post`,
      labelPct: actor.likesPerPostLabel,
      labelScale: 0.78,
    });
    efficiencyGroup.add(lppBar);

    const erH = 0.45 + (actor.er / 3.51) * 3.3;
    const { barGroup: erBar } = createDarkCylinderBar({
      radius: 0.26,
      height: erH,
      color: '#00F0FF',
      position: [x + 0.42, 0.16, -0.75],
      payload: {
        title: `${actor.handle} · Engagement Rate`,
        metric: `${actor.erLabel} ER`,
        subtitle: `${actor.commentsPerPostLabel} com/post · ${actor.followersLabel} seg`,
        color: '#00F0FF',
        variancePct: calcVariancePct(actor.er, avgEr),
        averageLabel: '1,49% prom.',
      },
      hoverables: efficiencyHoverables,
      labelName: 'ER %',
      labelPct: actor.erLabel,
      labelScale: 0.68,
    });
    efficiencyGroup.add(erBar);
  });

  hoverables.push(...totalsHoverables);

  return {
    scene: {
      group,
      hoverables,
      animatedObjects: {},
      cameraPreset: { position: [0.5, 5.2, 12.2], target: [0.5, 2.3, 0] },
    },
    totalsGroup,
    efficiencyGroup,
    totalsHoverables,
    efficiencyHoverables,
  };
}

/**
 * CHAPTER 3: Crecimiento vs. Engagement (Dispersión 3D con ejes y nodos etiquetados)
 */
export function buildBenchmarkCh3OutliersScatter(): BuiltSlideScene {
  const group = new THREE.Group();
  const hoverables: THREE.Object3D[] = [];
  const floatingNodes: { obj: THREE.Object3D; baseY: number; phase: number; speed: number }[] = [];

  const scatterStage = new THREE.Group();
  scatterStage.position.set(1.2, 0, 0);
  group.add(scatterStage);

  // Dark translucent scatter base plate (X: Engagement Rate %, Y: Growth Abs, Z: Relevance)
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(8.8, 0.12, 5.2),
    new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.35, metalness: 0.75 })
  );
  plate.position.set(0, 0.06, 0);
  scatterStage.add(plate);

  // Neon X/Y/Z telemetry axes wireframe
  const axisMatX = new THREE.MeshBasicMaterial({ color: '#00F0FF' });
  const axisMatY = new THREE.MeshBasicMaterial({ color: '#10B981' });

  const xAxis = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.04, 0.04), axisMatX);
  xAxis.position.set(0, 0.14, 2.3);
  scatterStage.add(xAxis);

  const yAxis = new THREE.Mesh(new THREE.BoxGeometry(0.04, 4.4, 0.04), axisMatY);
  yAxis.position.set(-4.2, 2.34, -2.2);
  scatterStage.add(yAxis);

  const xLabel = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createDarkFloatingBadgeTexture('EJE X · Engagement Rate (%)', '4% → 52% ER', '#00F0FF'),
      transparent: true,
      depthWrite: false,
    })
  );
  xLabel.scale.set(2.3, 0.62, 1);
  xLabel.position.set(2.6, 0.45, 2.65);
  scatterStage.add(xLabel);

  const yLabel = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createDarkFloatingBadgeTexture('EJE Y · Crecimiento Seguidores', '+820 → +2.100 seg', '#10B981'),
      transparent: true,
      depthWrite: false,
    })
  );
  yLabel.scale.set(2.3, 0.62, 1);
  yLabel.position.set(-4.2, 4.85, -2.2);
  scatterStage.add(yLabel);

  const avgGrowth =
    BENCHMARK_OUTLIERS.reduce((s, n) => s + n.growthAbs, 0) / BENCHMARK_OUTLIERS.length;

  BENCHMARK_OUTLIERS.forEach((node, idx) => {
    const x = -3.6 + (node.erPct / 54) * 7.4;
    const y = 0.7 + (node.growthAbs / 2150) * 3.55;
    const z = -1.6 + (idx % 3) * 1.35;
    const radius = 0.24 + (node.interactions / 75000) * 0.26;

    // Vertical drop stem to floor
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, y - 0.12, 8),
      new THREE.MeshBasicMaterial({ color: node.color, transparent: true, opacity: 0.45 })
    );
    stem.position.set(x, 0.12 + (y - 0.12) / 2, z);
    scatterStage.add(stem);

    // Base glow ring on floor
    const floorRing = new THREE.Mesh(
      new THREE.RingGeometry(radius * 0.85, radius * 1.2, 32),
      new THREE.MeshBasicMaterial({ color: node.color, side: THREE.DoubleSide })
    );
    floorRing.rotation.x = -Math.PI / 2;
    floorRing.position.set(x, 0.13, z);
    scatterStage.add(floorRing);

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 28, 28),
      makeNeonPhysicalMaterial(node.color, 0.38, 0.15)
    );
    sphere.position.set(x, y, z);
    scatterStage.add(sphere);
    floatingNodes.push({ obj: sphere, baseY: y, phase: idx * 0.9, speed: 1.5 });

    // Permanent 3D floating label attached above each outlier sphere
    const labelSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createDarkFloatingBadgeTexture(
          node.handle,
          `${node.erLabel} · ${node.growthLabel}`,
          node.color
        ),
        transparent: true,
        depthWrite: false,
      })
    );
    labelSprite.scale.set(1.85, 0.5, 1);
    labelSprite.position.set(0, radius + 0.42, 0);
    sphere.add(labelSprite);

    const payload: HoverPayload = {
      title: node.handle,
      metric: `${node.growthLabel} · ${node.erLabel}`,
      subtitle: node.milestone,
      color: node.color,
      variancePct: calcVariancePct(node.growthAbs, avgGrowth),
      averageLabel: '+1.424 seg prom.',
    };
    registerDarkHoverable(sphere, hoverables, payload, sphere);
    registerDarkHoverable(labelSprite, hoverables, payload, sphere);
  });

  return {
    group,
    hoverables,
    animatedObjects: { floatingNodes },
    cameraPreset: { position: [2.4, 4.9, 11.5], target: [1.0, 2.35, 0] },
  };
}

/**
 * CHAPTER 4: Rentabilidad de Formatos y Sentimiento (Dos esculturas lado a lado)
 */
export function buildBenchmarkCh4FormatsSentiment(): BuiltSlideScene {
  const group = new THREE.Group();
  const hoverables: THREE.Object3D[] = [];
  const rings: THREE.Mesh[] = [];
  const floatingNodes: { obj: THREE.Object3D; baseY: number; phase: number; speed: number }[] = [];

  // Left platform: Formats (Volume vs ER)
  const leftDeck = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 0.16, 4.0),
    new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.4, metalness: 0.72 })
  );
  leftDeck.position.set(-2.9, 0.08, 0);
  group.add(leftDeck);

  // Right platform: Sentiment (1.913 posts)
  const rightDeck = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 0.16, 4.0),
    new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.4, metalness: 0.72 })
  );
  rightDeck.position.set(3.2, 0.08, 0);
  group.add(rightDeck);

  const avgErFmt =
    BENCHMARK_FORMATS.reduce((s, f) => s + f.erPct, 0) / BENCHMARK_FORMATS.length;

  BENCHMARK_FORMATS.forEach((f, idx) => {
    const x = -4.6 + idx * 1.7;
    const volH = 0.5 + (f.volumePct / 50) * 3.1;

    const { barGroup } = createDarkCylinderBar({
      radius: 0.36,
      height: volH,
      color: f.color,
      position: [x, 0.16, 0.65],
      payload: {
        title: `${f.format} · Volumen`,
        metric: `${f.posts} posts (${f.volumePct.toFixed(1).replace('.', ',')}%)`,
        subtitle: `${f.erLabel} · ${f.note}`,
        color: f.color,
        variancePct: calcVariancePct(f.erPct, avgErFmt),
        averageLabel: '1,15% ER prom.',
      },
      hoverables,
      labelName: f.format,
      labelPct: `${f.volumePct.toFixed(1).replace('.', ',')}%`,
      labelScale: 0.82,
    });
    group.add(barGroup);

    // Floating ER halo ring behind each tower (Reels 2,08% rises highest)
    const ringY = 1.15 + (f.erPct / 2.08) * 2.25;
    const ringRadius = 0.36 + (f.erPct / 2.08) * 0.38;
    const erRing = new THREE.Mesh(
      new THREE.TorusGeometry(ringRadius, 0.075, 20, 48),
      makeNeonPhysicalMaterial(f.color, 0.5, 0)
    );
    erRing.position.set(x, ringY, -0.95);
    group.add(erRing);
    rings.push(erRing);
    floatingNodes.push({ obj: erRing, baseY: ringY, phase: idx * 1.0, speed: 1.8 });

    const ringBadge = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createDarkFloatingBadgeTexture(f.format, f.erLabel, f.color),
        transparent: true,
        depthWrite: false,
      })
    );
    ringBadge.scale.set(1.45, 0.4, 1);
    ringBadge.position.set(x, ringY + ringRadius + 0.32, -0.95);
    group.add(ringBadge);

    registerDarkHoverable(
      erRing,
      hoverables,
      {
        title: `${f.format} · Rentabilidad`,
        metric: f.erLabel,
        subtitle: `${f.posts} publicaciones · ${f.note}`,
        color: f.color,
        variancePct: calcVariancePct(f.erPct, avgErFmt),
        averageLabel: '1,15% ER prom.',
      },
      erRing
    );
  });

  // Right Sculpture: 3 Sentiment Prisms (1.913 posts)
  const avgSent =
    BENCHMARK_SENTIMENT.reduce((s, x) => s + x.pct, 0) / BENCHMARK_SENTIMENT.length;

  BENCHMARK_SENTIMENT.forEach((s, idx) => {
    const x = 1.65 + idx * 1.55;
    const h = 0.38 + (s.pct / 75.4) * 3.55;

    const { barGroup } = createDarkCylinderBar({
      radius: 0.38,
      height: h,
      color: s.color,
      position: [x, 0.16, 0],
      payload: {
        title: `Sentimiento ${s.label}`,
        metric: `${s.pct.toFixed(1).replace('.', ',')}% (${s.posts.toLocaleString('es-CL')} posts)`,
        subtitle: s.detail,
        color: s.color,
        variancePct: calcVariancePct(s.pct, avgSent),
        averageLabel: '33,3% ref.',
      },
      hoverables,
      addTopRing: idx === 0,
      labelName: `Sent. ${s.label}`,
      labelPct: `${s.pct.toFixed(1).replace('.', ',')}%`,
      labelScale: 0.85,
    });
    group.add(barGroup);
  });

  return {
    group,
    hoverables,
    animatedObjects: { rings, floatingNodes },
    cameraPreset: { position: [0.2, 5.1, 12.6], target: [0.2, 2.35, 0] },
  };
}

/**
 * CHAPTER 5: Matriz Horaria Óptima 7 días × 8 bloques (Mapa de Calor 3D)
 */
export function buildBenchmarkCh5Heatmap(): BuiltSlideScene {
  const group = new THREE.Group();
  const hoverables: THREE.Object3D[] = [];
  const floatingNodes: { obj: THREE.Object3D; baseY: number; phase: number; speed: number }[] = [];

  const matrixGroup = new THREE.Group();
  matrixGroup.position.set(0.35, 0, -0.35);
  group.add(matrixGroup);

  const cellSpacingX = 1.05; // 8 hours along X
  const cellSpacingZ = 0.88; // 7 days along Z
  const offsetX = -((HEATMAP_HOURS.length - 1) * cellSpacingX) / 2;
  const offsetZ = -((HEATMAP_DAYS.length - 1) * cellSpacingZ) / 2;

  const baseBoard = new THREE.Mesh(
    new THREE.BoxGeometry(9.2, 0.16, 7.0),
    new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.4, metalness: 0.72 })
  );
  baseBoard.position.set(0, 0.08, 0);
  matrixGroup.add(baseBoard);

  // Axis badges along X (Hours) and Z (Days)
  HEATMAP_HOURS.forEach((hr, hIdx) => {
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createDarkFloatingBadgeTexture(hr, 'Bloque', '#00F0FF'),
        transparent: true,
        depthWrite: false,
      })
    );
    sp.scale.set(0.95, 0.26, 1);
    sp.position.set(offsetX + hIdx * cellSpacingX, 0.35, offsetZ + 6 * cellSpacingZ + 0.72);
    matrixGroup.add(sp);
  });

  HEATMAP_DAYS.forEach((day, dIdx) => {
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createDarkFloatingBadgeTexture(day, dIdx >= 4 ? 'Fin/Vie' : 'Hábil', dIdx >= 4 ? '#FF2E93' : '#94A3B8'),
        transparent: true,
        depthWrite: false,
      })
    );
    sp.scale.set(0.95, 0.26, 1);
    sp.position.set(offsetX - 0.95, 0.35, offsetZ + dIdx * cellSpacingZ);
    matrixGroup.add(sp);
  });

  const avgEfficacy =
    BENCHMARK_HEATMAP_MATRIX.reduce((s, c) => s + c.interactionEfficacy, 0) /
    BENCHMARK_HEATMAP_MATRIX.length;

  BENCHMARK_HEATMAP_MATRIX.forEach((cell, idx) => {
    const x = offsetX + cell.hourIdx * cellSpacingX;
    const z = offsetZ + cell.dayIdx * cellSpacingZ;
    // Height represents publication volume
    const h = 0.2 + (cell.volumeIndex / 100) * 2.55;

    // Color & emissive represents interaction efficacy
    const isPeak = cell.interactionEfficacy >= 85;
    const isSaturated = cell.volumeIndex >= 78 && cell.interactionEfficacy < 50;
    const color = isPeak
      ? '#00F0FF'
      : cell.interactionEfficacy >= 62
        ? '#10B981'
        : isSaturated
          ? '#FFB800'
          : '#334155';
    const emissiveInt = isPeak ? 0.65 : cell.interactionEfficacy >= 62 ? 0.35 : isSaturated ? 0.25 : 0.08;

    const prism = new THREE.Mesh(
      new THREE.BoxGeometry(0.66, h, 0.58),
      makeNeonPhysicalMaterial(color, emissiveInt, 0.1)
    );
    prism.position.set(x, 0.16 + h / 2, z);
    matrixGroup.add(prism);

    if (isPeak) {
      const beacon = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.16, 0),
        makeNeonPhysicalMaterial('#FF2E93', 0.75, 0)
      );
      const beaconY = 0.16 + h + 0.42;
      beacon.position.set(x, beaconY, z);
      matrixGroup.add(beacon);
      floatingNodes.push({ obj: beacon, baseY: beaconY, phase: idx * 0.4, speed: 2.3 });
    }

    registerDarkHoverable(
      prism,
      hoverables,
      {
        title: `${cell.day} · ${cell.hour} hrs`,
        metric: `${cell.interactionEfficacy}% eficacia interacción`,
        subtitle: `Volumen publicado: ${cell.volumeIndex}/100 · ${cell.windowType}`,
        color: isPeak ? '#00F0FF' : color,
        variancePct: calcVariancePct(cell.interactionEfficacy, avgEfficacy),
        averageLabel: `${Math.round(avgEfficacy)}% prom.`,
      },
      prism
    );
  });

  return {
    group,
    hoverables,
    animatedObjects: { floatingNodes },
    cameraPreset: { position: [1.1, 6.2, 10.6], target: [0.3, 1.4, 0.1] },
  };
}

/**
 * CHAPTER 6 (CAPÍTULO 07): Resumen Ejecutivo Dual — Comparativa 3D Reporte 1 vs Reporte 2
 */
export function buildBenchmarkCh6DualSummary(): BuiltSlideScene {
  const group = new THREE.Group();
  const hoverables: THREE.Object3D[] = [];
  const gyroRings: THREE.Mesh[] = [];
  const floatingNodes: { obj: THREE.Object3D; baseY: number; phase: number; speed: number }[] = [];

  // Twin holographic podiums bridged in center
  const leftDeck = new THREE.Mesh(
    new THREE.CylinderGeometry(2.35, 2.55, 0.18, 48),
    new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.35, metalness: 0.72 })
  );
  leftDeck.position.set(-2.7, 0.09, 0);
  group.add(leftDeck);

  const leftRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.38, 0.035, 16, 64),
    new THREE.MeshBasicMaterial({ color: '#38BDF8' })
  );
  leftRing.rotation.x = Math.PI / 2;
  leftRing.position.set(-2.7, 0.19, 0);
  group.add(leftRing);

  const rightDeck = new THREE.Mesh(
    new THREE.CylinderGeometry(2.35, 2.55, 0.18, 48),
    new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.35, metalness: 0.72 })
  );
  rightDeck.position.set(2.7, 0.09, 0);
  group.add(rightDeck);

  const rightRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.38, 0.035, 16, 64),
    new THREE.MeshBasicMaterial({ color: '#FF2E93' })
  );
  rightRing.rotation.x = Math.PI / 2;
  rightRing.position.set(2.7, 0.19, 0);
  group.add(rightRing);

  // Connecting floor telemetry bridge
  const bridge = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.06, 0.7),
    makeNeonPhysicalMaterial('#10B981', 0.32, 0.1)
  );
  bridge.position.set(0, 0.05, 0);
  group.add(bridge);

  // Left Cluster: Reporte 1 Ecosistema Instagram (Medios & Comunidad)
  const ecoMetrics = [
    {
      label: 'R1 · 3,13M Likes',
      pct: '31 días',
      h: 3.1,
      x: -3.4,
      z: 0.45,
      color: '#0284C7',
      title: 'Reporte 01 · Medios y Comunidad',
      metric: '3,13M Me Gusta totales',
      subtitle: '20 cuentas monitoreadas · @miradiols (36,3%) y @eldia.cl (24,7%)',
    },
    {
      label: 'R1 · 1,06% ER',
      pct: '+2,63%',
      h: 1.85,
      x: -2.0,
      z: -0.45,
      color: '#38BDF8',
      title: 'Reporte 01 · Eficiencia Media',
      metric: '1,06% ER · +2,63% crec.',
      subtitle: 'Reels logran 1,36% vs 0,53% imágenes · Papaya TV pico 28%',
    },
  ];

  ecoMetrics.forEach((m, i) => {
    const { barGroup, topRing } = createDarkCylinderBar({
      radius: 0.4,
      height: m.h,
      color: m.color,
      position: [m.x, 0.18, m.z],
      payload: {
        title: m.title,
        metric: m.metric,
        subtitle: m.subtitle,
        color: m.color,
      },
      hoverables,
      addTopRing: i === 0,
      labelName: m.label,
      labelPct: m.pct,
      labelScale: 0.78,
    });
    group.add(barGroup);
    if (topRing) {
      floatingNodes.push({ obj: topRing, baseY: topRing.position.y, phase: 0.5, speed: 1.8 });
    }
  });

  // Right Cluster: Reporte 2 Benchmark 3D (Municipios & Autoridades)
  const benchMetrics = [
    {
      label: 'R2 · 478,5k Int.',
      pct: '28 días',
      h: 2.55,
      x: 2.0,
      z: 0.45,
      color: '#FF2E93',
      title: 'Reporte 02 · Benchmark Público',
      metric: '478,5k interacciones · 26 ctas',
      subtitle: '1.965 publicaciones · @municipalidaddecoquimbo lidera con 15,5%',
    },
    {
      label: 'R2 · 1,97% ER',
      pct: '+3,09%',
      h: 2.95,
      x: 3.4,
      z: -0.45,
      color: '#00F0FF',
      title: 'Reporte 02 · Crecimiento & Tono',
      metric: '1,97% ER · +3,09% crec.',
      subtitle: '75,4% sentimiento positivo · Reels alcanzan 2,08% ER (3x)',
    },
  ];

  benchMetrics.forEach((m, i) => {
    const { barGroup, topRing } = createDarkCylinderBar({
      radius: 0.4,
      height: m.h,
      color: m.color,
      position: [m.x, 0.18, m.z],
      payload: {
        title: m.title,
        metric: m.metric,
        subtitle: m.subtitle,
        color: m.color,
      },
      hoverables,
      addTopRing: i === 1,
      labelName: m.label,
      labelPct: m.pct,
      labelScale: 0.78,
    });
    group.add(barGroup);
    if (topRing) {
      floatingNodes.push({ obj: topRing, baseY: topRing.position.y, phase: 1.4, speed: 1.8 });
    }
  });

  // Central Convergence Sphere + Dual Gyro Rings ("Regla de Oro: Reels + 21:00 hrs")
  const centerCore = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.62, 2),
    makeNeonPhysicalMaterial('#10B981', 0.55, 0.15)
  );
  centerCore.position.set(0, 2.55, 0);
  group.add(centerCore);
  floatingNodes.push({ obj: centerCore, baseY: 2.55, phase: 0, speed: 1.4 });

  registerDarkHoverable(
    centerCore,
    hoverables,
    {
      title: 'Conclusión Estratégica Unificada',
      metric: 'Reels (2,5x–3x ER) + 21:00 hrs',
      subtitle: 'Ambas auditorías confirman migrar piezas estáticas a Reels cortos en horario nocturno y fin de semana',
      color: '#10B981',
    },
    centerCore
  );

  const g1 = new THREE.Mesh(
    new THREE.TorusGeometry(1.18, 0.03, 16, 64),
    makeNeonPhysicalMaterial('#10B981', 0.6, 0)
  );
  g1.position.set(0, 2.55, 0);
  g1.rotation.set(0.6, 0.2, 0.3);
  group.add(g1);
  gyroRings.push(g1);

  const g2 = new THREE.Mesh(
    new THREE.TorusGeometry(1.48, 0.025, 16, 64),
    makeNeonPhysicalMaterial('#00F0FF', 0.5, 0)
  );
  g2.position.set(0, 2.55, 0);
  g2.rotation.set(-0.7, 0.5, 0.8);
  group.add(g2);
  gyroRings.push(g2);

  const convergenceBadge = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createDarkFloatingBadgeTexture('Síntesis Dual 2026', 'Reels 3x · 21:00h', '#10B981'),
      transparent: true,
      depthWrite: false,
    })
  );
  convergenceBadge.scale.set(2.1, 0.56, 1);
  convergenceBadge.position.set(0, 4.1, 0);
  group.add(convergenceBadge);

  return {
    group,
    hoverables,
    animatedObjects: { gyroRings, floatingNodes },
    cameraPreset: { position: [0, 5.1, 11.8], target: [0, 2.25, 0] },
  };
}

/**
 * CHAPTER 7 (index 6): Ranking Global de Actores — Anfiteatro 3D con retratos e iconos comunales
 */
export function buildBenchmarkCh6GlobalActors(): BuiltSlideScene {
  const group = new THREE.Group();
  const hoverables: THREE.Object3D[] = [];
  const gyroRings: THREE.Mesh[] = [];
  const floatingNodes: { obj: THREE.Object3D; baseY: number; phase: number; speed: number }[] = [];
  const rankBars: {
    rank: number;
    group: THREE.Group;
    mesh: THREE.Mesh;
    baseColor: THREE.Color;
  }[] = [];

  const stage = new THREE.Group();
  stage.position.set(2.6, 0, 0);
  group.add(stage);

  // Two-tier semicircular dark metallic amphitheater platform
  const outerPlinth = new THREE.Mesh(
    new THREE.CylinderGeometry(5.1, 5.4, 0.16, 64),
    new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.36, metalness: 0.74 })
  );
  outerPlinth.position.y = 0.08;
  stage.add(outerPlinth);

  const outerRim = new THREE.Mesh(
    new THREE.TorusGeometry(5.12, 0.035, 14, 96),
    new THREE.MeshBasicMaterial({ color: '#00F0FF' })
  );
  outerRim.rotation.x = Math.PI / 2;
  outerRim.position.y = 0.17;
  stage.add(outerRim);

  const innerRim = new THREE.Mesh(
    new THREE.TorusGeometry(2.85, 0.025, 12, 80),
    new THREE.MeshBasicMaterial({ color: '#FF2E93' })
  );
  innerRim.rotation.x = Math.PI / 2;
  innerRim.position.y = 0.18;
  stage.add(innerRim);

  // Central holographic crest beacon
  const centerOrb = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.46, 2),
    makeNeonPhysicalMaterial('#10B981', 0.48, 0.16)
  );
  centerOrb.position.set(0, 1.35, 0.35);
  stage.add(centerOrb);
  floatingNodes.push({ obj: centerOrb, baseY: 1.35, phase: 0, speed: 1.5 });

  const centerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.86, 0.025, 14, 64),
    makeNeonPhysicalMaterial('#00F0FF', 0.52, 0)
  );
  centerRing.position.set(0, 1.35, 0.35);
  centerRing.rotation.set(0.75, 0.2, 0.35);
  stage.add(centerRing);
  gyroRings.push(centerRing);

  // 3 Miniature Regional Architectural Landmark Beacons on the outer rim
  // 1) Faro Monumental (La Serena sector)
  const faroGroup = new THREE.Group();
  faroGroup.position.set(-4.35, 0.16, 2.25);
  const faroTower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.28, 1.15, 16),
    new THREE.MeshStandardMaterial({ color: '#F8FAFC', roughness: 0.3, metalness: 0.4 })
  );
  faroTower.position.y = 0.58;
  faroGroup.add(faroTower);
  const faroLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 16, 16),
    makeNeonPhysicalMaterial('#FFB800', 0.85, 0)
  );
  faroLight.position.y = 1.24;
  faroGroup.add(faroLight);
  stage.add(faroGroup);
  registerDarkHoverable(
    faroTower,
    hoverables,
    {
      title: 'Hito Territorial · La Serena',
      metric: 'Faro Monumental',
      subtitle: 'Medios, municipio capital, Alcaldía y comunidad ciudadana',
      color: '#00F0FF',
    },
    faroLight
  );

  // 2) Cruz del Tercer Milenio (Coquimbo sector)
  const cruzGroup = new THREE.Group();
  cruzGroup.position.set(4.35, 0.16, 2.25);
  const cruzV = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 1.28, 0.14),
    makeNeonPhysicalMaterial('#10B981', 0.5, 0)
  );
  cruzV.position.y = 0.64;
  cruzGroup.add(cruzV);
  const cruzH = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.14, 0.14),
    makeNeonPhysicalMaterial('#10B981', 0.5, 0)
  );
  cruzH.position.y = 0.94;
  cruzGroup.add(cruzH);
  stage.add(cruzGroup);
  registerDarkHoverable(
    cruzV,
    hoverables,
    {
      title: 'Hito Territorial · Coquimbo',
      metric: 'Cruz del Tercer Milenio',
      subtitle: 'Municipio Puerto y liderazgo parlamentario de la conurbación',
      color: '#10B981',
    },
    cruzV
  );

  // 3) Observatorio Valle del Elqui / Limarí / Choapa (Rear North Crown)
  const astroGroup = new THREE.Group();
  astroGroup.position.set(0, 0.16, -4.45);
  const astroBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.36, 0.45, 24),
    new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.35, metalness: 0.7 })
  );
  astroBase.position.y = 0.22;
  astroGroup.add(astroBase);
  const astroDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    makeNeonPhysicalMaterial('#38BDF8', 0.45, 0)
  );
  astroDome.position.y = 0.45;
  astroGroup.add(astroDome);
  stage.add(astroGroup);
  registerDarkHoverable(
    astroDome,
    hoverables,
    {
      title: 'Provincias Elqui · Limarí · Choapa',
      metric: 'Ovalle · Vicuña · Illapel · Monte Patria · Los Vilos',
      subtitle: 'Identidad astronómica, hídrica y cordillerana de la región',
      color: '#38BDF8',
    },
    astroDome
  );

  // Place all 18 actors in 2 concentric semicircular amphitheater arcs facing forward
  const outerActors = GLOBAL_ACTORS_RANKING.slice(0, 9);
  const innerActors = GLOBAL_ACTORS_RANKING.slice(9);

  const avgScore =
    GLOBAL_ACTORS_RANKING.reduce((acc, a) => acc + a.scoreIndex, 0) /
    GLOBAL_ACTORS_RANKING.length;

  const placeArc = (actors: typeof GLOBAL_ACTORS_RANKING, radius: number, maxH: number) => {
    const startAngle = Math.PI * 0.92;
    const endAngle = Math.PI * 0.08;
    actors.forEach((actor, idx) => {
      const t = actors.length > 1 ? idx / (actors.length - 1) : 0.5;
      const angle = startAngle + (endAngle - startAngle) * t;
      const x = Math.cos(angle) * radius;
      const z = -Math.sin(angle) * radius + 0.55;
      const h = 0.55 + (actor.scoreIndex / 100) * maxH;

      const actorBarGroup = new THREE.Group();
      actorBarGroup.position.set(x, 0.16, z);

      const collar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.28, 0.1, 28),
        new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.35, metalness: 0.8 })
      );
      collar.position.y = 0.05;
      actorBarGroup.add(collar);

      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.26, 0.015, 8, 28),
        new THREE.MeshBasicMaterial({ color: actor.color })
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.1;
      actorBarGroup.add(rim);

      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.21, h, 28),
        makeNeonPhysicalMaterial(actor.color, 0.22, 0.08)
      );
      shaft.position.y = 0.1 + h / 2;
      actorBarGroup.add(shaft);

      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.18, 0.06, 28),
        new THREE.MeshStandardMaterial({
          color: '#E2E8F0',
          emissive: new THREE.Color(actor.color),
          emissiveIntensity: 0.35,
          roughness: 0.2,
          metalness: 0.6,
        })
      );
      cap.position.y = 0.1 + h + 0.03;
      actorBarGroup.add(cap);

      const stemH = 0.18;
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, stemH, 8),
        new THREE.MeshBasicMaterial({ color: actor.color })
      );
      stem.position.y = 0.1 + h + 0.06 + stemH / 2;
      actorBarGroup.add(stem);

      const emblemTex = createActorEmblemTexture({
        rank: actor.rank,
        name: actor.name,
        metric: actor.primaryMetricLabel,
        color: actor.color,
        emblemKind: actor.emblemKind,
      });
      const medallion = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: emblemTex,
          transparent: true,
          depthWrite: false,
        })
      );
      medallion.center.set(0.5, 0);
      medallion.scale.set(0.88, 0.96, 1);
      medallion.position.y = 0.1 + h + 0.06 + stemH;
      actorBarGroup.add(medallion);

      const payload: HoverPayload = {
        title: `#${actor.rank} · ${actor.name} (${actor.handle})`,
        metric: `${actor.primaryMetricLabel} · ${actor.erLabel}`,
        subtitle: `${actor.territory} · ${actor.highlightNote}`,
        color: actor.color,
        rank: actor.rank,
        variancePct: calcVariancePct(actor.scoreIndex, avgScore),
        averageLabel: `${Math.round(avgScore)} pts prom.`,
      };

      registerDarkHoverable(shaft, hoverables, payload, shaft);
      registerDarkHoverable(medallion, hoverables, payload, shaft);

      stage.add(actorBarGroup);
      rankBars.push({
        rank: actor.rank,
        group: actorBarGroup,
        mesh: shaft,
        baseColor: new THREE.Color(actor.color),
      });
    });
  };

  placeArc(outerActors, 4.25, 2.75);
  placeArc(innerActors, 2.55, 1.85);

  return {
    group,
    hoverables,
    animatedObjects: { gyroRings, floatingNodes, rankBars },
    cameraPreset: { position: [2.6, 5.7, 13.8], target: [2.1, 2.3, 0] },
  };
}

