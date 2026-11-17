import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EDICION3_AUTHORITIES } from '../data/edicion3Data';
import {
  Edicion3DuelMode,
  SpiralBaseTimeSeriesRef,
  SpiralStepFocusMeta,
  buildEdicion3Slide0Overview,
  buildEdicion3Slide1Podium,
  buildEdicion3Slide2Efficiency,
  buildEdicion3Slide3Duel,
  buildEdicion3Slide4Ranking,
} from '../three/edicion3Builders';
import {
  createDarkFloatingBadgeTexture,
  createDarkTelemetryGridTexture,
} from '../three/proceduralTextures';
import { BuiltSlideScene, HoverPayload } from '../three/slideBuilders';
import { Scene3DHandle } from './Scene3DCanvas';

export interface Edicion3SignalOrigin {
  rank: number;
  x: number;
  y: number;
  color: string;
  nonce: number;
}

interface Edicion3SceneCanvasProps {
  activeSlide: number;
  duelMode: Edicion3DuelMode;
  highlightedRank: number | null;
  selectedRank?: number | null;
  signalOrigin?: Edicion3SignalOrigin | null;
  resetCameraNonce: number;
  freeOrbitMode: boolean;
  autoPresent: boolean;
  hudCollapsed?: boolean;
  directorCamera?: {
    position: [number, number, number];
    target: [number, number, number];
  } | null;
  onHoverRank?: (rank: number | null) => void;
  onSelectRank?: (rank: number | null, origin?: { x: number; y: number }) => void;
}

interface TooltipState {
  payload: HoverPayload;
  x: number;
  y: number;
}

const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _mouseNdc = new THREE.Vector2();
const _tempColor = new THREE.Color();
const _tempDelta = new THREE.Vector3();
const _projVec = new THREE.Vector3();

function applyPortraitFraming(
  presetPos: [number, number, number],
  presetTarget: [number, number, number],
  outPos: THREE.Vector3,
  outTarget: THREE.Vector3,
  aspect: number,
  hudVisible: boolean,
  isDirectorShot = false
) {
  outPos.set(...presetPos);
  outTarget.set(...presetTarget);
  if (aspect < 0.92) {
    const zoom = isDirectorShot
      ? Math.min(1.88, Math.max(1.25, 1.06 / Math.max(aspect, 0.45)))
      : Math.min(2.2, Math.max(1.22, 1.05 / Math.max(aspect, 0.42)));
    _tempDelta.copy(outPos).sub(outTarget).multiplyScalar(zoom);
    if (!isDirectorShot) {
      outTarget.x *= 0.25;
    }
    if (hudVisible) {
      outTarget.y = Math.max(-0.2, outTarget.y - (isDirectorShot ? 0.95 : 1.3));
    } else {
      outTarget.y = Math.max(0.2, outTarget.y - 0.15);
    }
    outPos.copy(outTarget).add(_tempDelta);
  }
}

function evalQuadBezier(
  t: number,
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number
): [number, number] {
  const u = 1 - t;
  return [
    u * u * x0 + 2 * u * t * cx + t * t * x1,
    u * u * y0 + 2 * u * t * cy + t * t * y1,
  ];
}

export const Edicion3SceneCanvas = forwardRef<Scene3DHandle, Edicion3SceneCanvasProps>(
  (
    {
      activeSlide,
      duelMode,
      highlightedRank,
      selectedRank = null,
      signalOrigin = null,
      resetCameraNonce,
      freeOrbitMode,
      autoPresent,
      hudCollapsed = false,
      directorCamera = null,
      onHoverRank,
      onSelectRank,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const signalSvgRef = useRef<SVGSVGElement | null>(null);
    const signalPathRef = useRef<SVGPathElement | null>(null);
    const signalCorePathRef = useRef<SVGPathElement | null>(null);
    const signalCometRef = useRef<SVGCircleElement | null>(null);
    const signalTargetRingRef = useRef<SVGCircleElement | null>(null);
    const signalOriginDotRef = useRef<SVGCircleElement | null>(null);

    const [tooltip, setTooltip] = useState<TooltipState | null>(null);
    const [webglError, setWebglError] = useState(false);

    const activeSlideRef = useRef(activeSlide);
    const duelModeRef = useRef(duelMode);
    const highlightedRankRef = useRef(highlightedRank);
    const selectedRankRef = useRef(selectedRank);
    const signalOriginRef = useRef(signalOrigin);
    const freeOrbitRef = useRef(freeOrbitMode);
    const autoPresentRef = useRef(autoPresent);
    const hudCollapsedRef = useRef(hudCollapsed);
    const directorCameraRef = useRef(directorCamera);
    const onHoverRankRef = useRef(onHoverRank);
    const onSelectRankRef = useRef(onSelectRank);

    const cameraTransitionActiveRef = useRef(true);
    const flashEnvelopeRef = useRef(0);
    const beamProgressRef = useRef(1);
    const captureApiRef = useRef<Scene3DHandle | null>(null);
    const duelSwitchRef = useRef<((mode: Edicion3DuelMode) => void) | null>(null);

    activeSlideRef.current = activeSlide;
    duelModeRef.current = duelMode;
    highlightedRankRef.current = highlightedRank;
    selectedRankRef.current = selectedRank;
    signalOriginRef.current = signalOrigin;
    freeOrbitRef.current = freeOrbitMode;
    autoPresentRef.current = autoPresent;
    hudCollapsedRef.current = hudCollapsed;
    directorCameraRef.current = directorCamera;
    onHoverRankRef.current = onHoverRank;
    onSelectRankRef.current = onSelectRank;

    useImperativeHandle(
      ref,
      () => ({
        prepareSlideForCapture: (idx: number) => {
          captureApiRef.current?.prepareSlideForCapture(idx);
        },
        renderCurrentFrame: () => {
          captureApiRef.current?.renderCurrentFrame();
        },
      }),
      []
    );

    useEffect(() => {
      if (!freeOrbitMode || selectedRank !== null) {
        cameraTransitionActiveRef.current = true;
      }
    }, [activeSlide, resetCameraNonce, hudCollapsed, directorCamera, freeOrbitMode, selectedRank]);

    useEffect(() => {
      if (selectedRank !== null || signalOrigin) {
        flashEnvelopeRef.current = 1.0;
        beamProgressRef.current = 0.0;
        cameraTransitionActiveRef.current = true;
      }
    }, [selectedRank, signalOrigin?.nonce, signalOrigin]);

    useEffect(() => {
      duelSwitchRef.current?.(duelMode);
    }, [duelMode]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const isSoftwareGl = (() => {
        try {
          const probe = document.createElement('canvas').getContext('webgl2');
          if (!probe) return true;
          const ext = probe.getExtension('WEBGL_debug_renderer_info');
          const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
          const gpu = String(probe.getParameter(param));
          probe.getExtension('WEBGL_lose_context')?.loseContext();
          return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
        } catch {
          return true;
        }
      })();

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: !isSoftwareGl,
          powerPreference: 'high-performance',
          alpha: false,
          preserveDrawingBuffer: true,
        });
      } catch {
        setWebglError(true);
        return;
      }

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      renderer.setSize(width, height);
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;

      const canvas = renderer.domElement;
      canvas.style.display = 'block';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      container.appendChild(canvas);

      const handleContextLost = (e: Event) => {
        e.preventDefault();
        setWebglError(true);
      };
      const handleContextRestored = () => setWebglError(false);
      canvas.addEventListener('webglcontextlost', handleContextLost);
      canvas.addEventListener('webglcontextrestored', handleContextRestored);

      const scene = new THREE.Scene();
      const bgHex = 0x070d1b;
      scene.background = new THREE.Color(bgHex);
      scene.fog = new THREE.FogExp2(bgHex, 0.02);

      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      scene.environment = pmremGenerator.fromScene(roomEnv, 0.05).texture;
      roomEnv.dispose();
      pmremGenerator.dispose();

      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 140);
      camera.position.set(0.8, 5.4, 12.6);

      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = !isSoftwareGl;
      controls.dampingFactor = 0.06;
      controls.enablePan = false;
      controls.minDistance = 4.2;
      controls.maxDistance = 46;
      controls.minPolarAngle = 0.22;
      controls.maxPolarAngle = Math.PI / 2 - 0.05;
      controls.target.set(0.4, 2.35, 0);
      controls.update();
      controls.addEventListener('start', () => {
        cameraTransitionActiveRef.current = false;
      });

      const hemi = new THREE.HemisphereLight(0x38bdf8, 0x0b1020, 0.95);
      scene.add(hemi);

      const goldSpot = new THREE.DirectionalLight(0xf59e0b, 1.38);
      goldSpot.position.set(9, 18, 12);
      scene.add(goldSpot);

      const summitSpot = new THREE.PointLight(0xfbbf24, 1.45, 32, 1.3);
      summitSpot.position.set(3.2, 14.5, 5.5);
      scene.add(summitSpot);

      const cyanRim = new THREE.DirectionalLight(0x00f0ff, 1.15);
      cyanRim.position.set(-10, 11, -8);
      scene.add(cyanRim);

      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(80, 80),
        new THREE.MeshStandardMaterial({
          color: 0x081022,
          roughness: 0.28,
          metalness: 0.65,
        })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.02;
      scene.add(floor);

      const gridTex = createDarkTelemetryGridTexture(renderer.capabilities.getMaxAnisotropy());
      const gridPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(24, 24),
        new THREE.MeshBasicMaterial({
          map: gridTex,
          transparent: true,
          depthWrite: false,
        })
      );
      gridPlane.rotation.x = -Math.PI / 2;
      gridPlane.position.y = 0.005;
      scene.add(gridPlane);

      const duelData = buildEdicion3Slide3Duel();
      const builtSlides: BuiltSlideScene[] = [
        buildEdicion3Slide0Overview(),
        buildEdicion3Slide1Podium(),
        buildEdicion3Slide2Efficiency(),
        duelData.scene,
        buildEdicion3Slide4Ranking(),
      ];

      builtSlides.forEach((s, idx) => {
        s.group.visible = idx === activeSlideRef.current;
        s.group.scale.setScalar(idx === activeSlideRef.current ? 1 : 0.88);
        scene.add(s.group);
      });

      duelSwitchRef.current = (mode: Edicion3DuelMode) => {
        const showTotals = mode === 'totals';
        duelData.totalsGroup.visible = showTotals;
        duelData.efficiencyGroup.visible = !showTotals;
        duelData.scene.hoverables.length = 0;
        duelData.scene.hoverables.push(
          ...(showTotals ? duelData.totalsHoverables : duelData.efficiencyHoverables)
        );
      };
      duelSwitchRef.current(duelModeRef.current);

      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }

      captureApiRef.current = {
        prepareSlideForCapture: (idx: number) => {
          activeSlideRef.current = idx;
          builtSlides.forEach((s, i) => {
            s.group.visible = i === idx;
            if (i === idx) {
              s.group.scale.setScalar(1);
              s.group.rotation.set(0, 0, 0);
            }
          });
          const target = builtSlides[idx];
          if (target) {
            camera.position.set(...target.cameraPreset.position);
            controls.target.set(...target.cameraPreset.target);
            cameraTransitionActiveRef.current = false;
            controls.update();
          }
          renderer.render(scene, camera);
        },
        renderCurrentFrame: () => {
          renderer.render(scene, camera);
        },
      };

      const raycaster = new THREE.Raycaster();
      raycaster.layers.set(1);
      let hoveredMesh: THREE.Mesh | null = null;
      let lastRaycast = 0;
      let pointerOffsetX = 0;
      let pointerOffsetY = 0;
      let downPos = { x: 0, y: 0 };

      const clearHover = () => {
        if (hoveredMesh && hoveredMesh.material instanceof THREE.MeshStandardMaterial) {
          const baseInt =
            typeof hoveredMesh.userData.baseEmissiveIntensity === 'number'
              ? hoveredMesh.userData.baseEmissiveIntensity
              : 0.24;
          hoveredMesh.material.emissiveIntensity = baseInt;
        }
        hoveredMesh = null;
        canvas.style.cursor = freeOrbitRef.current ? 'grab' : 'default';
        setTooltip(null);
        if (onHoverRankRef.current) onHoverRankRef.current(null);
      };

      const handlePointerDown = (e: PointerEvent) => {
        downPos = { x: e.clientX, y: e.clientY };
        handlePointerMove(e);
      };

      const handlePointerUp = (e: PointerEvent) => {
        const distMoved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
        if (distMoved > 6) return;

        const rect = canvas.getBoundingClientRect();
        _mouseNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        _mouseNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        const cur = builtSlides[activeSlideRef.current];
        if (!cur) return;

        raycaster.setFromCamera(_mouseNdc, camera);
        const hits = raycaster.intersectObjects(cur.hoverables, false);
        if (hits.length > 0) {
          const payload = hits[0].object.userData.tooltip as HoverPayload | undefined;
          if (payload?.rank && onSelectRankRef.current) {
            const next = selectedRankRef.current === payload.rank ? null : payload.rank;
            onSelectRankRef.current(next);
          }
        }
      };

      const handlePointerMove = (e: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        _mouseNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        _mouseNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        pointerOffsetX = _mouseNdc.x * 0.55;
        pointerOffsetY = _mouseNdc.y * 0.25;

        const now = performance.now();
        if (now - lastRaycast < 35) return;
        lastRaycast = now;

        const cur = builtSlides[activeSlideRef.current];
        if (!cur) return;

        raycaster.setFromCamera(_mouseNdc, camera);
        const hits = raycaster.intersectObjects(cur.hoverables, false);

        if (hits.length > 0) {
          const hitObj = hits[0].object;
          const payload = hitObj.userData.tooltip as HoverPayload | undefined;
          const targetMesh = (hitObj.userData.highlightMesh as THREE.Mesh) || hitObj;

          if (hoveredMesh && hoveredMesh !== targetMesh) {
            if (hoveredMesh.material instanceof THREE.MeshStandardMaterial) {
              const baseInt =
                typeof hoveredMesh.userData.baseEmissiveIntensity === 'number'
                  ? hoveredMesh.userData.baseEmissiveIntensity
                  : 0.24;
              hoveredMesh.material.emissiveIntensity = baseInt;
            }
          }

          if (
            targetMesh instanceof THREE.Mesh &&
            targetMesh.material instanceof THREE.MeshStandardMaterial
          ) {
            hoveredMesh = targetMesh;
            _tempColor.set(payload?.color || '#F59E0B');
            targetMesh.material.emissive.copy(_tempColor);
            targetMesh.material.emissiveIntensity = 0.88;
          }

          canvas.style.cursor = 'pointer';
          if (payload) {
            setTooltip({ payload, x: e.clientX, y: e.clientY });
            if (onHoverRankRef.current) {
              onHoverRankRef.current(payload.rank ?? null);
            }
          }
        } else if (hoveredMesh) {
          clearHover();
        }
      };

      const handlePointerLeave = () => {
        pointerOffsetX = 0;
        pointerOffsetY = 0;
        clearHover();
      };

      canvas.addEventListener('pointermove', handlePointerMove);
      canvas.addEventListener('pointerdown', handlePointerDown);
      canvas.addEventListener('pointerup', handlePointerUp);
      canvas.addEventListener('pointerleave', handlePointerLeave);

      const handleResize = () => {
        if (!container) return;
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        cameraTransitionActiveRef.current = true;
      };
      window.addEventListener('resize', handleResize);

      let frameId = 0;
      let disposed = false;
      let lastSlide = activeSlideRef.current;

      const clock = new THREE.Clock();

      function tick() {
        if (disposed) return;

        const delta = Math.min(clock.getDelta(), 0.05);
        const elapsed = clock.getElapsedTime();
        const sIdx = activeSlideRef.current;

        if (sIdx !== lastSlide) {
          clearHover();
          builtSlides.forEach((s, i) => {
            s.group.visible = i === sIdx;
            if (i === sIdx) s.group.scale.setScalar(0.86);
          });
          lastSlide = sIdx;
          cameraTransitionActiveRef.current = true;
        }

        if (flashEnvelopeRef.current > 0) {
          flashEnvelopeRef.current = Math.max(0, flashEnvelopeRef.current - delta * 0.95);
        }
        const prevBeam = beamProgressRef.current;
        if (beamProgressRef.current < 1) {
          beamProgressRef.current = Math.min(1, beamProgressRef.current + delta * 1.85);
          // Second arrival destello peak the instant the emerging trace line reaches the 3D stair node!
          if (prevBeam < 0.85 && beamProgressRef.current >= 0.85) {
            flashEnvelopeRef.current = Math.max(flashEnvelopeRef.current, 0.96);
          }
        }

        const activeScene = builtSlides[sIdx];
        let focusedCameraPreset: {
          position: [number, number, number];
          target: [number, number, number];
        } | null = null;
        let activeFocusMeta: SpiralStepFocusMeta | null = null;

        if (activeScene) {
          const nextScale = THREE.MathUtils.damp(activeScene.group.scale.x, 1, 7, delta);
          activeScene.group.scale.setScalar(nextScale);

          const hasSelected = selectedRankRef.current !== null;
          if (hasSelected && !freeOrbitRef.current) {
            // Keep locked target steady and aligned when zooming into details
            activeScene.group.rotation.y = THREE.MathUtils.damp(
              activeScene.group.rotation.y,
              0,
              6.5,
              delta
            );
            activeScene.group.rotation.x = THREE.MathUtils.damp(
              activeScene.group.rotation.x,
              0,
              6.5,
              delta
            );
          } else if (autoPresentRef.current && !freeOrbitRef.current) {
            const gentleSway = Math.sin(elapsed * 0.35) * 0.04;
            activeScene.group.rotation.y = THREE.MathUtils.damp(
              activeScene.group.rotation.y,
              gentleSway,
              4.5,
              delta
            );
            activeScene.group.rotation.x = THREE.MathUtils.damp(
              activeScene.group.rotation.x,
              0,
              4.5,
              delta
            );
          } else if (!freeOrbitRef.current) {
            activeScene.group.rotation.y = THREE.MathUtils.damp(
              activeScene.group.rotation.y,
              pointerOffsetX * 0.14,
              4.5,
              delta
            );
            activeScene.group.rotation.x = THREE.MathUtils.damp(
              activeScene.group.rotation.x,
              -pointerOffsetY * 0.06,
              4.5,
              delta
            );
          }

          activeScene.group.updateMatrixWorld();

          const anim = activeScene.animatedObjects;
          if (anim.gyroRings) {
            anim.gyroRings.forEach((ring, i) => {
              ring.rotation.y += delta * (0.3 + i * 0.12) * (i % 2 === 0 ? 1 : -1);
              ring.rotation.x += delta * 0.12 * (i % 2 === 0 ? 1 : -1);
            });
          }
          if (anim.floatingNodes) {
            anim.floatingNodes.forEach((node) => {
              node.obj.position.y =
                node.baseY + Math.sin(elapsed * node.speed + node.phase) * 0.08;
            });
          }
          if (anim.rankBars) {
            const selRank = selectedRankRef.current;
            const hoverRank = highlightedRankRef.current;
            const targetRank = selRank ?? hoverRank;
            const flashVal = flashEnvelopeRef.current;

            anim.rankBars.forEach((item) => {
              const isSelected = selRank !== null && selRank === item.rank;
              const isActive = targetRank === item.rank;
              const meta = item.group.userData.focusMeta as SpiralStepFocusMeta | undefined;

              if (isSelected && meta) {
                focusedCameraPreset = meta.focusCamera;
                activeFocusMeta = meta;
              } else if (isActive && meta && hoverRank !== null) {
                activeFocusMeta = activeFocusMeta ?? meta;
              }

              const targetYScale = isSelected ? 1.09 : isActive ? 1.045 : 1.0;
              item.group.scale.y = THREE.MathUtils.damp(item.group.scale.y, targetYScale, 9, delta);

              if (
                item.mesh !== hoveredMesh &&
                item.mesh.material instanceof THREE.MeshStandardMaterial
              ) {
                if (isSelected) {
                  _tempColor.set('#FFFBEB').lerp(item.baseColor, 1 - flashVal * 0.72);
                  item.mesh.material.emissive.copy(_tempColor);
                  item.mesh.material.emissiveIntensity = 1.25 + flashVal * 2.1;
                } else if (isActive) {
                  item.mesh.material.emissive.copy(item.baseColor);
                  item.mesh.material.emissiveIntensity = 0.88;
                } else {
                  item.mesh.material.emissive.copy(item.baseColor);
                  item.mesh.material.emissiveIntensity = selRank !== null ? 0.12 : 0.28;
                }
              }

              if (meta) {
                const [bw, bh] = meta.baseSpriteScale;
                const zoomMul = isSelected ? 1.25 + flashVal * 0.16 : isActive ? 1.12 : 1.0;
                const targetW = bw * zoomMul;
                const targetH = bh * zoomMul;
                meta.stairSprite.scale.x = THREE.MathUtils.damp(
                  meta.stairSprite.scale.x,
                  targetW,
                  10,
                  delta
                );
                meta.stairSprite.scale.y = THREE.MathUtils.damp(
                  meta.stairSprite.scale.y,
                  targetH,
                  10,
                  delta
                );
                meta.stairSprite.renderOrder = isSelected ? 60 : isActive ? 45 : 10 + (13 - item.rank);

                const spriteMat = meta.stairSprite.material;
                const targetOpacity = selRank !== null && !isSelected ? 0.34 : 1.0;
                spriteMat.opacity = THREE.MathUtils.damp(spriteMat.opacity, targetOpacity, 10, delta);

                // Dual expanding shockwave "destello" rings when selected
                const flashMat = meta.flashRing.material as THREE.MeshBasicMaterial;
                const flashOuterMat = meta.flashRingOuter.material as THREE.MeshBasicMaterial;
                if (isSelected && flashVal > 0.01) {
                  const wave = 1.0 - flashVal;
                  meta.flashRing.scale.setScalar(1.0 + wave * 1.45);
                  flashMat.opacity = flashVal * 0.96;

                  const outerWave = Math.max(0, wave - 0.12);
                  meta.flashRingOuter.scale.setScalar(1.0 + outerWave * 1.85);
                  flashOuterMat.opacity = Math.max(0, flashVal - 0.08) * 0.85;
                } else {
                  meta.flashRing.scale.setScalar(1.0);
                  flashMat.opacity = 0;
                  meta.flashRingOuter.scale.setScalar(1.0);
                  flashOuterMat.opacity = 0;
                }

                // Additive starburst "brillo / destello" sprite flare behind selected stair
                const flareMat = meta.destelloFlare.material as THREE.SpriteMaterial;
                if (isSelected) {
                  const flarePulse = 1.0 + Math.sin(elapsed * 6.0) * 0.08;
                  const flareScale = (1.18 + flashVal * 1.05) * flarePulse;
                  meta.destelloFlare.scale.set(3.9 * flareScale, 2.3 * flareScale, 1);
                  flareMat.opacity = Math.min(1, 0.38 + flashVal * 0.62);
                } else {
                  flareMat.opacity = THREE.MathUtils.damp(flareMat.opacity, 0, 12, delta);
                }

                // Sustained pulsing highlight halo around active stair
                const haloMat = meta.highlightHalo.material as THREE.MeshBasicMaterial;
                if (isActive) {
                  const pulse = 1.0 + Math.sin(elapsed * 5.2) * 0.06;
                  meta.highlightHalo.scale.setScalar(pulse);
                  haloMat.opacity = isSelected ? 0.9 : 0.55;
                } else {
                  haloMat.opacity = THREE.MathUtils.damp(haloMat.opacity, 0, 10, delta);
                }
              }
            });
          }

          // Smoothly morph 3D Base Historical ER% Time-Series Plinth to compare selected actor vs prior month
          const baseTs = activeScene.group.userData.baseTimeSeries as
            | SpiralBaseTimeSeriesRef
            | undefined;
          if (baseTs) {
            const tsRank = selectedRankRef.current ?? highlightedRankRef.current ?? 1;
            const tsAuth =
              EDICION3_AUTHORITIES.find((a) => a.rank === tsRank) ?? EDICION3_AUTHORITIES[0];

            if (baseTs.activeRank !== tsAuth.rank) {
              baseTs.activeRank = tsAuth.rank;
              baseTs.currentColor.set(tsAuth.color);

              const oldTex = baseTs.titleSprite.material.map;
              const nextTex = createDarkFloatingBadgeTexture(
                `Serie ER% · ${tsAuth.shortName}`,
                `Nov ${tsAuth.erLabel} vs Oct ${tsAuth.prevMonthErLabel}`,
                tsAuth.color
              );
              baseTs.titleSprite.material.map = nextTex;
              baseTs.titleSprite.material.needsUpdate = true;
              oldTex?.dispose();

              const deltaPts = tsAuth.erPct - tsAuth.prevMonthErPct;
              const deltaSign = deltaPts >= 0 ? '+' : '';
              baseTs.hitBox.userData.tooltip = {
                title: `Evolución Histórica ER% · ${tsAuth.shortName}`,
                metric: `${tsAuth.erLabel} (Nov) vs ${tsAuth.prevMonthErLabel} (Oct)`,
                subtitle: `Variación mensual: ${deltaSign}${deltaPts.toFixed(2)} pts porcentuales · Sem 1 → Sem 4`,
                color: tsAuth.color,
                rank: tsAuth.rank,
              } satisfies HoverPayload;
            }

            const maxSeries = Math.max(
              0.5,
              ...tsAuth.erSeries.map((pt) => Math.max(pt.currentPct, pt.prevPct))
            );

            tsAuth.erSeries.forEach((pt, idx) => {
              const targetCurrH = Math.max(0.18, (pt.currentPct / maxSeries) * baseTs.maxBarHeight);
              const targetPrevH = Math.max(0.18, (pt.prevPct / maxSeries) * baseTs.maxBarHeight);

              const nextCurrH = THREE.MathUtils.damp(
                baseTs.currentBarHeights[idx],
                targetCurrH,
                8.5,
                delta
              );
              const nextPrevH = THREE.MathUtils.damp(
                baseTs.prevBarHeights[idx],
                targetPrevH,
                8.5,
                delta
              );
              baseTs.currentBarHeights[idx] = nextCurrH;
              baseTs.prevBarHeights[idx] = nextPrevH;

              const cBar = baseTs.currentBars[idx];
              if (cBar) {
                cBar.scale.y = nextCurrH;
                cBar.position.y = baseTs.baseY + nextCurrH * 0.5;
                if (cBar.material instanceof THREE.MeshStandardMaterial) {
                  cBar.material.color.lerp(baseTs.currentColor, Math.min(1, delta * 9));
                  cBar.material.emissive.lerp(baseTs.currentColor, Math.min(1, delta * 9));
                }
              }
              const cDot = baseTs.currentDots[idx];
              if (cDot) {
                cDot.position.y = baseTs.baseY + nextCurrH + 0.04;
              }

              const pBar = baseTs.prevBars[idx];
              if (pBar) {
                pBar.scale.y = nextPrevH;
                pBar.position.y = baseTs.baseY + nextPrevH * 0.5;
              }
              const pDot = baseTs.prevDots[idx];
              if (pDot) {
                pDot.position.y = baseTs.baseY + nextPrevH + 0.04;
              }
            });

            for (let i = 0; i < baseTs.xPositions.length - 1; i++) {
              const x0 = baseTs.xPositions[i];
              const x1 = baseTs.xPositions[i + 1];
              const dx = x1 - x0;

              const cSeg = baseTs.currentLineSegs[i];
              if (cSeg) {
                const cy0 = baseTs.baseY + baseTs.currentBarHeights[i] + 0.04;
                const cy1 = baseTs.baseY + baseTs.currentBarHeights[i + 1] + 0.04;
                const cdy = cy1 - cy0;
                const cLen = Math.hypot(dx, cdy);
                cSeg.scale.y = cLen;
                cSeg.position.y = (cy0 + cy1) * 0.5;
                cSeg.rotation.z = -Math.atan2(dx, cdy);
                if (cSeg.material instanceof THREE.MeshBasicMaterial) {
                  cSeg.material.color.lerp(baseTs.currentColor, Math.min(1, delta * 9));
                }
              }

              const pSeg = baseTs.prevLineSegs[i];
              if (pSeg) {
                const py0 = baseTs.baseY + baseTs.prevBarHeights[i] + 0.04;
                const py1 = baseTs.baseY + baseTs.prevBarHeights[i + 1] + 0.04;
                const pdy = py1 - py0;
                const pLen = Math.hypot(dx, pdy);
                pSeg.scale.y = pLen;
                pSeg.position.y = (py0 + py1) * 0.5;
                pSeg.rotation.z = -Math.atan2(dx, pdy);
              }
            }
          }

          if (cameraTransitionActiveRef.current) {
            const activeDirector = !freeOrbitRef.current ? directorCameraRef.current : null;
            const camCfg = focusedCameraPreset ?? activeDirector ?? activeScene.cameraPreset;
            applyPortraitFraming(
              camCfg.position,
              camCfg.target,
              _targetCamPos,
              _targetLookAt,
              camera.aspect,
              !hudCollapsedRef.current,
              Boolean(activeDirector || focusedCameraPreset)
            );
            const dampSpeed = focusedCameraPreset ? 4.8 : activeDirector ? 3.2 : 4.5;
            camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetCamPos.x, dampSpeed, delta);
            camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetCamPos.y, dampSpeed, delta);
            camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetCamPos.z, dampSpeed, delta);

            controls.target.x = THREE.MathUtils.damp(controls.target.x, _targetLookAt.x, dampSpeed, delta);
            controls.target.y = THREE.MathUtils.damp(controls.target.y, _targetLookAt.y, dampSpeed, delta);
            controls.target.z = THREE.MathUtils.damp(controls.target.z, _targetLookAt.z, dampSpeed, delta);

            if (
              camera.position.distanceTo(_targetCamPos) < 0.03 &&
              controls.target.distanceTo(_targetLookAt) < 0.03
            ) {
              cameraTransitionActiveRef.current = false;
            }
          }
        }

        controls.enableRotate = freeOrbitRef.current;
        controls.enableZoom = freeOrbitRef.current;
        controls.update();
        renderer.render(scene, camera);

        // Update 60fps progressive SVG Emerging Trace Line ("línea de trazado") connecting bottom card -> 3D flashing node
        const svgEl = signalSvgRef.current;
        const sigOrigin = signalOriginRef.current;
        if (
          container &&
          svgEl &&
          activeScene &&
          sigOrigin &&
          activeFocusMeta &&
          (selectedRankRef.current === sigOrigin.rank || highlightedRankRef.current === sigOrigin.rank)
        ) {
          const rect = container.getBoundingClientRect();
          _projVec.set(...(activeFocusMeta as SpiralStepFocusMeta).worldAnchor);
          _projVec.applyMatrix4(activeScene.group.matrixWorld);
          _projVec.project(camera);

          if (_projVec.z < 1) {
            const tx = (_projVec.x * 0.5 + 0.5) * rect.width;
            const ty = (-_projVec.y * 0.5 + 0.5) * rect.height;
            const sx = sigOrigin.x - rect.left;
            const sy = sigOrigin.y - rect.top;

            // Smooth rising arc from bottom card directly to the 3D stair node
            const midX = (sx + tx) * 0.5 + (tx >= sx ? -44 : 44);
            const midY = Math.min(sy, ty) + Math.abs(sy - ty) * 0.22;
            const dAttr = `M ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`;

            const beamT = beamProgressRef.current;
            const easedT = 1 - Math.pow(1 - beamT, 2.35);
            const [cxPos, cyPos] = evalQuadBezier(easedT, sx, sy, midX, midY, tx, ty);

            svgEl.style.opacity = '1';
            if (signalPathRef.current) {
              signalPathRef.current.setAttribute('d', dAttr);
              signalPathRef.current.setAttribute('stroke', sigOrigin.color);
              if (beamT < 1) {
                signalPathRef.current.setAttribute('stroke-dasharray', '1000 1000');
                signalPathRef.current.setAttribute(
                  'stroke-dashoffset',
                  ((1 - easedT) * 1000).toFixed(1)
                );
                signalPathRef.current.setAttribute('opacity', '0.92');
              } else {
                signalPathRef.current.setAttribute('stroke-dasharray', '18 10');
                signalPathRef.current.setAttribute('stroke-dashoffset', (-elapsed * 95).toFixed(1));
                signalPathRef.current.setAttribute('opacity', '0.78');
              }
            }
            if (signalCorePathRef.current) {
              signalCorePathRef.current.setAttribute('d', dAttr);
              if (beamT < 1) {
                signalCorePathRef.current.setAttribute('stroke-dasharray', '1000 1000');
                signalCorePathRef.current.setAttribute(
                  'stroke-dashoffset',
                  ((1 - easedT) * 1000).toFixed(1)
                );
                signalCorePathRef.current.setAttribute('opacity', '0.95');
              } else {
                signalCorePathRef.current.setAttribute('stroke-dasharray', '18 10');
                signalCorePathRef.current.setAttribute('stroke-dashoffset', (-elapsed * 95).toFixed(1));
                signalCorePathRef.current.setAttribute('opacity', '0.68');
              }
            }
            if (signalOriginDotRef.current) {
              signalOriginDotRef.current.setAttribute('cx', sx.toFixed(1));
              signalOriginDotRef.current.setAttribute('cy', sy.toFixed(1));
              signalOriginDotRef.current.setAttribute('fill', sigOrigin.color);
            }
            if (signalCometRef.current) {
              signalCometRef.current.setAttribute('cx', cxPos.toFixed(1));
              signalCometRef.current.setAttribute('cy', cyPos.toFixed(1));
              signalCometRef.current.setAttribute('stroke', sigOrigin.color);
              signalCometRef.current.setAttribute('opacity', beamT < 0.99 ? '1' : '0');
            }
            if (signalTargetRingRef.current) {
              const flashVal = flashEnvelopeRef.current;
              const ringR = 18 + (1 - flashVal) * 48;
              signalTargetRingRef.current.setAttribute('cx', tx.toFixed(1));
              signalTargetRingRef.current.setAttribute('cy', ty.toFixed(1));
              signalTargetRingRef.current.setAttribute('r', ringR.toFixed(1));
              signalTargetRingRef.current.setAttribute('stroke', sigOrigin.color);
              signalTargetRingRef.current.setAttribute(
                'opacity',
                beamT >= 0.72 || flashVal > 0.05 ? Math.max(0.45, flashVal).toFixed(2) : '0.2'
              );
            }
          } else {
            svgEl.style.opacity = '0';
          }
        } else if (svgEl) {
          svgEl.style.opacity = '0';
        }

        frameId = requestAnimationFrame(tick);
      }

      frameId = requestAnimationFrame(tick);

      return () => {
        disposed = true;
        cancelAnimationFrame(frameId);
        window.removeEventListener('resize', handleResize);
        canvas.removeEventListener('pointermove', handlePointerMove);
        canvas.removeEventListener('pointerdown', handlePointerDown);
        canvas.removeEventListener('pointerup', handlePointerUp);
        canvas.removeEventListener('pointerleave', handlePointerLeave);
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        canvas.removeEventListener('webglcontextrestored', handleContextRestored);

        controls.dispose();
        gridTex.dispose();

        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh || obj instanceof THREE.Sprite) {
            obj.geometry?.dispose();
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material?.dispose();
            }
          }
        });

        captureApiRef.current = null;
        duelSwitchRef.current = null;
        renderer.dispose();
        if (canvas.parentElement === container) {
          container.removeChild(canvas);
        }
      };
    }, []);

    const tooltipW = typeof window !== 'undefined' ? Math.min(288, window.innerWidth - 24) : 288;
    const tooltipLeft = tooltip
      ? Math.max(12, Math.min(tooltip.x + 14, window.innerWidth - tooltipW - 12))
      : 0;
    const bottomReserve = activeSlide === 1 ? 355 : 225;
    const tooltipTop = tooltip
      ? Math.max(68, Math.min(tooltip.y - 24, window.innerHeight - bottomReserve))
      : 0;
    const hasVariance =
      tooltip?.payload.variancePct !== undefined && Number.isFinite(tooltip.payload.variancePct);
    const variance = hasVariance ? (tooltip!.payload.variancePct as number) : 0;
    const isPositive = variance > 0.05;
    const isNegative = variance < -0.05;
    const formattedVariance = `${isPositive ? '+' : ''}${variance.toLocaleString('es-CL', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`;
    const barHalfWidthPct = Math.min(50, (Math.abs(variance) / (Math.abs(variance) + 80)) * 50);

    return (
      <div className="relative h-full w-full select-none bg-[#070D1B]">
        <div
          ref={containerRef}
          className="absolute inset-0 h-full w-full"
          aria-label="Escena 3D del Reporte Digital Noviembre 2026 Edición 3"
        />

        {/* Animated Upward Trace Line Overlay (Card -> Flashing 3D Stair Node) */}
        <svg
          ref={signalSvgRef}
          className="pointer-events-none fixed inset-0 z-[25] h-full w-full transition-opacity duration-200"
          style={{ opacity: 0 }}
          aria-hidden="true"
        >
          <defs>
            <filter id="ed3-signal-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            ref={signalPathRef}
            pathLength={1000}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray="1000 1000"
            strokeDashoffset={1000}
            opacity="0.88"
            filter="url(#ed3-signal-glow)"
          />
          <path
            ref={signalCorePathRef}
            pathLength={1000}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray="1000 1000"
            strokeDashoffset={1000}
            opacity="0.9"
          />
          <circle ref={signalOriginDotRef} r="6.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" opacity="0.95" />
          <circle
            ref={signalCometRef}
            r="9.5"
            fill="#FFFFFF"
            stroke="#F59E0B"
            strokeWidth="3.5"
            filter="url(#ed3-signal-glow)"
            opacity="0"
          />
          <circle
            ref={signalTargetRingRef}
            r="24"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="3.2"
            filter="url(#ed3-signal-glow)"
            opacity="0"
          />
        </svg>

        {webglError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#070D1B] p-8 text-center">
            <div className="dark-glass-panel max-w-md rounded-2xl p-6 text-slate-100">
              <h2 className="font-display text-xl font-semibold">Modo 2D Activo</h2>
              <p className="mt-2 text-sm text-slate-400">
                El contexto WebGL no está disponible en este navegador, pero los indicadores y tablas interactivas siguen activos.
              </p>
            </div>
          </div>
        )}

        {tooltip && (
          <div
            className="pointer-events-none fixed z-50 w-[min(18rem,calc(100vw-1.5rem))] rounded-xl border border-white/15 bg-[#0A1226]/95 p-3.5 text-slate-100 shadow-2xl"
            style={{ left: `${tooltipLeft}px`, top: `${tooltipTop}px` }}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: tooltip.payload.color }}
              />
              <span className="truncate text-xs font-semibold text-white">
                {tooltip.payload.title}
              </span>
            </div>
            <div className="font-mono-tabular mt-1.5 text-lg font-bold tracking-tight text-[#F59E0B]">
              {tooltip.payload.metric}
            </div>
            <p className="mt-1 text-xs leading-snug text-slate-300">
              {tooltip.payload.subtitle}
            </p>

            {hasVariance && (
              <div className="mt-2.5 border-t border-white/10 pt-2.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>vs. promedio</span>
                  {tooltip.payload.averageLabel && (
                    <span className="font-mono-tabular font-medium text-slate-300">
                      {tooltip.payload.averageLabel}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <div
                    className={`flex items-center gap-1 font-mono-tabular text-xs font-bold ${
                      isPositive
                        ? 'text-[#10B981]'
                        : isNegative
                          ? 'text-[#F59E0B]'
                          : 'text-slate-300'
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                    ) : isNegative ? (
                      <TrendingDown className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <Minus className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span>{formattedVariance}</span>
                  </div>
                </div>
                <div className="relative mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="absolute top-0 bottom-0 left-1/2 z-10 w-px -translate-x-1/2 bg-slate-500" />
                  {isPositive && (
                    <div
                      className="absolute top-0 bottom-0 left-1/2 rounded-r-full bg-[#10B981]"
                      style={{ width: `${barHalfWidthPct}%` }}
                    />
                  )}
                  {isNegative && (
                    <div
                      className="absolute top-0 bottom-0 right-1/2 rounded-l-full bg-[#F59E0B]"
                      style={{ width: `${barHalfWidthPct}%` }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

Edicion3SceneCanvas.displayName = 'Edicion3SceneCanvas';
