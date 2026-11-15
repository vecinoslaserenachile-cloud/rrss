import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createContactShadowTexture, createStageGridTexture } from '../three/proceduralTextures';
import {
  BuiltSlideScene,
  HoverPayload,
  buildSlide0Hero,
  buildSlide1ReachShare,
  buildSlide2FollowersVsEngagement,
  buildSlide3Top20Ranking,
  buildSlide4TopicSphere,
  buildSlide5SentimentCurve,
  buildSlide6FormatsAndAudience,
  buildSlide7ActorsLikes,
  buildSlide8LikesPie3D,
} from '../three/slideBuilders';

interface Scene3DCanvasProps {
  activeSlide: number;
  highlightedRank: number | null;
  resetCameraNonce: number;
  freeOrbitMode: boolean;
  autoPresent?: boolean;
  hudCollapsed?: boolean;
  onHoverRank?: (rank: number | null) => void;
}

export interface Scene3DHandle {
  prepareSlideForCapture: (slideIdx: number) => void;
  renderCurrentFrame: () => void;
}

interface TooltipState {
  payload: HoverPayload;
  x: number;
  y: number;
}

// Reusable math helpers outside render loop to guarantee zero per-frame GC
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _mouseNdc = new THREE.Vector2();
const _tempColor = new THREE.Color();

const _tempDelta = new THREE.Vector3();

function applyPortraitFraming(
  presetPos: [number, number, number],
  presetTarget: [number, number, number],
  outPos: THREE.Vector3,
  outTarget: THREE.Vector3,
  aspect: number,
  hudVisible: boolean
) {
  outPos.set(...presetPos);
  outTarget.set(...presetTarget);
  if (aspect < 0.92) {
    const zoom = Math.min(2.15, Math.max(1.22, 1.02 / Math.max(aspect, 0.42)));
    _tempDelta.copy(outPos).sub(outTarget).multiplyScalar(zoom);
    outTarget.x *= 0.25;
    if (hudVisible) {
      outTarget.y = Math.max(-0.4, outTarget.y - 1.25);
    } else {
      outTarget.y = Math.max(0.2, outTarget.y - 0.15);
    }
    outPos.copy(outTarget).add(_tempDelta);
  }
}

export const Scene3DCanvas = forwardRef<Scene3DHandle, Scene3DCanvasProps>(
  (
    {
      activeSlide,
      highlightedRank,
      resetCameraNonce,
      freeOrbitMode,
      autoPresent = false,
      hudCollapsed = false,
      onHoverRank,
    },
    ref
  ) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [webglError, setWebglError] = useState(false);

  // Mutable refs for live state inside single WebGL lifecycle
  const activeSlideRef = useRef(activeSlide);
  const highlightedRankRef = useRef(highlightedRank);
  const freeOrbitRef = useRef(freeOrbitMode);
  const autoPresentRef = useRef(autoPresent);
  const hudCollapsedRef = useRef(hudCollapsed);
  const onHoverRankRef = useRef(onHoverRank);
  const cameraTransitionActiveRef = useRef(true);
  const captureApiRef = useRef<Scene3DHandle | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      prepareSlideForCapture: (slideIdx: number) => {
        captureApiRef.current?.prepareSlideForCapture(slideIdx);
      },
      renderCurrentFrame: () => {
        captureApiRef.current?.renderCurrentFrame();
      },
    }),
    []
  );

  activeSlideRef.current = activeSlide;
  highlightedRankRef.current = highlightedRank;
  freeOrbitRef.current = freeOrbitMode;
  autoPresentRef.current = autoPresent;
  hudCollapsedRef.current = hudCollapsed;
  onHoverRankRef.current = onHoverRank;

  // Trigger smooth camera preset glide when slide, HUD visibility, or reset changes
  useEffect(() => {
    cameraTransitionActiveRef.current = true;
  }, [activeSlide, resetCameraNonce, hudCollapsed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Detect Software WebGL strictly from renderer string
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
    renderer.toneMappingExposure = 1.06;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    const handleContextRestored = () => {
      setWebglError(false);
    };
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    // Scene & editorial light atmosphere
    const scene = new THREE.Scene();
    const bgHex = 0xf4f7fb;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.024);

    // Studio reflection environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // Camera & OrbitControls
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 120);
    camera.position.set(0.5, 4.1, 10.6);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 4.5;
    controls.maxDistance = 32;
    controls.minPolarAngle = 0.25;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.target.set(0.8, 1.9, 0);
    controls.update();

    controls.addEventListener('start', () => {
      cameraTransitionActiveRef.current = false;
    });

    // Warm/cool 3-point studio lighting rig
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0xcbd5e1, 0.95);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.65);
    keyLight.position.set(8, 14, 9);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 36;
    keyLight.shadow.camera.left = -9;
    keyLight.shadow.camera.right = 9;
    keyLight.shadow.camera.top = 9;
    keyLight.shadow.camera.bottom = -9;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    rimLight.position.set(-9, 7, -8);
    scene.add(rimLight);

    // Architectural studio floor + contact shadow + grid decal
    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xf4f7fb,
      roughness: 0.92,
      metalness: 0.02,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    floor.receiveShadow = true;
    scene.add(floor);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const gridTex = createStageGridTexture(maxAniso);
    const gridPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 18),
      new THREE.MeshBasicMaterial({
        map: gridTex,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );
    gridPlane.rotation.x = -Math.PI / 2;
    gridPlane.position.y = 0.002;
    scene.add(gridPlane);

    const shadowTex = createContactShadowTexture();
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 10),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.65,
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.001;
    scene.add(contactShadow);

    // Build all 9 slide scenes once; swap visibility + animate scale entrance cleanly
    const builtSlides: BuiltSlideScene[] = [
      buildSlide0Hero(),
      buildSlide1ReachShare(),
      buildSlide2FollowersVsEngagement(),
      buildSlide3Top20Ranking(),
      buildSlide4TopicSphere(),
      buildSlide5SentimentCurve(),
      buildSlide6FormatsAndAudience(),
      buildSlide7ActorsLikes(),
      buildSlide8LikesPie3D(),
    ];

    builtSlides.forEach((s, idx) => {
      s.group.visible = idx === activeSlideRef.current;
      s.group.scale.setScalar(idx === activeSlideRef.current ? 1 : 0.85);
      scene.add(s.group);
    });

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Expose synchronous capture helpers so html2canvas/jsPDF always read a crisp 3D frame
    captureApiRef.current = {
      prepareSlideForCapture: (slideIdx: number) => {
        activeSlideRef.current = slideIdx;
        builtSlides.forEach((s, i) => {
          s.group.visible = i === slideIdx;
          if (i === slideIdx) {
            s.group.scale.setScalar(1);
            s.group.rotation.set(0, 0, 0);
          }
        });
        const targetScene = builtSlides[slideIdx];
        if (targetScene) {
          camera.position.set(...targetScene.cameraPreset.position);
          controls.target.set(...targetScene.cameraPreset.target);
          cameraTransitionActiveRef.current = false;
          controls.update();
        }
        renderer.render(scene, camera);
      },
      renderCurrentFrame: () => {
        renderer.render(scene, camera);
      },
    };

    // Raycaster & hover tracking
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    let hoveredMesh: THREE.Mesh | null = null;
    let lastRaycastTime = 0;
    let pointerOffsetX = 0;
    let pointerOffsetY = 0;
    let pointerClientX = 0;
    let pointerClientY = 0;

    const clearHover = () => {
      if (hoveredMesh && hoveredMesh.material instanceof THREE.MeshStandardMaterial) {
        hoveredMesh.material.emissive.setHex(0x000000);
        hoveredMesh.material.emissiveIntensity = 0;
      }
      hoveredMesh = null;
      canvas.style.cursor = freeOrbitRef.current ? 'grab' : 'default';
      setTooltip(null);
      if (onHoverRankRef.current) onHoverRankRef.current(null);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerClientX = e.clientX;
      pointerClientY = e.clientY;
      _mouseNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _mouseNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Subtle parallax vector
      pointerOffsetX = _mouseNdc.x * 0.55;
      pointerOffsetY = _mouseNdc.y * 0.25;

      const now = performance.now();
      if (now - lastRaycastTime < 35) return;
      lastRaycastTime = now;

      const currentSlide = builtSlides[activeSlideRef.current];
      if (!currentSlide) return;

      raycaster.setFromCamera(_mouseNdc, camera);
      const hits = raycaster.intersectObjects(currentSlide.hoverables, false);

      if (hits.length > 0) {
        const hitObj = hits[0].object;
        const payload = hitObj.userData.tooltip as HoverPayload | undefined;
        const targetMesh = (hitObj.userData.highlightMesh as THREE.Mesh) || hitObj;

        if (hoveredMesh && hoveredMesh !== targetMesh) {
          if (hoveredMesh.material instanceof THREE.MeshStandardMaterial) {
            hoveredMesh.material.emissive.setHex(0x000000);
            hoveredMesh.material.emissiveIntensity = 0;
          }
        }

        if (targetMesh instanceof THREE.Mesh && targetMesh.material instanceof THREE.MeshStandardMaterial) {
          hoveredMesh = targetMesh;
          _tempColor.set(payload?.color || '#0284C7');
          targetMesh.material.emissive.copy(_tempColor);
          targetMesh.material.emissiveIntensity = 0.45;
        }

        canvas.style.cursor = 'pointer';
        if (payload) {
          setTooltip({
            payload,
            x: pointerClientX,
            y: pointerClientY,
          });
          if (onHoverRankRef.current) {
            onHoverRankRef.current(payload.rank ?? null);
          }
        }
      } else {
        if (hoveredMesh) {
          clearHover();
        }
      }
    };

    const handlePointerLeave = () => {
      pointerOffsetX = 0;
      pointerOffsetY = 0;
      clearHover();
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerMove);
    canvas.addEventListener('pointerleave', handlePointerLeave);

    // Resize listener
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

    // Software WebGL frame pacing helper
    let frameId = 0;
    let disposed = false;
    let lastSlideIdx = activeSlideRef.current;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const clock = new THREE.Clock();

    function tick() {
      if (disposed) return;

      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();
      const slideIdx = activeSlideRef.current;

      if (slideIdx !== lastSlideIdx) {
        clearHover();
        builtSlides.forEach((s, i) => {
          s.group.visible = i === slideIdx;
          if (i === slideIdx) {
            s.group.scale.setScalar(0.86);
          }
        });
        lastSlideIdx = slideIdx;
        cameraTransitionActiveRef.current = true;
      }

      const activeScene = builtSlides[slideIdx];
      if (activeScene) {
        // Smooth entrance scale-up
        const nextScale = THREE.MathUtils.damp(activeScene.group.scale.x, 1, 7, delta);
        activeScene.group.scale.setScalar(nextScale);

        // Gentle mouse rotation parallax + optional autoPresent sway when not orbiting manually
        if (!freeOrbitRef.current) {
          const autoSway = autoPresentRef.current ? Math.sin(elapsed * 0.35) * 0.14 : 0;
          const targetRotY = pointerOffsetX * 0.16 + autoSway;
          const targetRotX = -pointerOffsetY * 0.08;
          activeScene.group.rotation.y = THREE.MathUtils.damp(
            activeScene.group.rotation.y,
            targetRotY,
            4.5,
            delta
          );
          activeScene.group.rotation.x = THREE.MathUtils.damp(
            activeScene.group.rotation.x,
            targetRotX,
            4.5,
            delta
          );
        }

        // Slide-specific continuous motion
        const anim = activeScene.animatedObjects;
        if (anim.gyroRings) {
          anim.gyroRings.forEach((ring, i) => {
            ring.rotation.y += delta * (0.28 + i * 0.12) * (i % 2 === 0 ? 1 : -1);
            ring.rotation.x += delta * 0.09 * (i % 2 === 0 ? 1 : -1);
          });
        }
        if (anim.rings) {
          anim.rings.forEach((ring, i) => {
            ring.rotation.z += delta * 0.45 * (i % 2 === 0 ? 1 : -1);
          });
        }
        if (anim.floatingNodes) {
          anim.floatingNodes.forEach((node) => {
            node.obj.position.y =
              node.baseY + Math.sin(elapsed * node.speed + node.phase) * 0.1;
          });
        }
        if (anim.wordGroup) {
          anim.wordGroup.rotation.y += delta * 0.14;
        }

        // Synchronized rank highlighting on Slide 4 (Top 20) & Slide 8 (22 Actors)
        if (anim.rankBars) {
          const targetRank = highlightedRankRef.current;
          anim.rankBars.forEach((item) => {
            const isActive = targetRank === item.rank;
            const targetYScale = isActive ? 1.14 : 1.0;
            item.group.scale.y = THREE.MathUtils.damp(item.group.scale.y, targetYScale, 8, delta);
            if (
              item.mesh !== hoveredMesh &&
              item.mesh.material instanceof THREE.MeshStandardMaterial
            ) {
              if (isActive) {
                item.mesh.material.emissive.copy(item.baseColor);
                item.mesh.material.emissiveIntensity = 0.55;
              } else {
                item.mesh.material.emissive.setHex(0x000000);
                item.mesh.material.emissiveIntensity = 0;
              }
            }
          });
        }

        // Synchronized radial explode + lift on Slide 9 (3D Pie Chart)
        if (anim.pieSlices) {
          const targetRank = highlightedRankRef.current;
          anim.pieSlices.forEach((slice) => {
            const isActive = targetRank === slice.rank || slice.mesh === hoveredMesh;
            const targetDist = isActive ? 0.36 : 0;
            const targetY = isActive ? slice.baseY + 0.16 : slice.baseY;
            const targetX = Math.cos(slice.bisectorAngle) * targetDist;
            const targetZ = -Math.sin(slice.bisectorAngle) * targetDist;

            slice.mesh.position.x = THREE.MathUtils.damp(slice.mesh.position.x, targetX, 8, delta);
            slice.mesh.position.z = THREE.MathUtils.damp(slice.mesh.position.z, targetZ, 8, delta);
            slice.mesh.position.y = THREE.MathUtils.damp(slice.mesh.position.y, targetY, 8, delta);

            if (
              slice.mesh !== hoveredMesh &&
              slice.mesh.material instanceof THREE.MeshStandardMaterial
            ) {
              if (isActive) {
                slice.mesh.material.emissive.copy(slice.baseColor);
                slice.mesh.material.emissiveIntensity = 0.48;
              } else {
                slice.mesh.material.emissive.setHex(0x000000);
                slice.mesh.material.emissiveIntensity = 0;
              }
            }
          });
        }

        // Smooth camera preset transition (portrait-aware for vertical mobile)
        if (cameraTransitionActiveRef.current) {
          applyPortraitFraming(
            activeScene.cameraPreset.position,
            activeScene.cameraPreset.target,
            _targetCamPos,
            _targetLookAt,
            camera.aspect,
            !hudCollapsedRef.current
          );

          camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetCamPos.x, 4.5, delta);
          camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetCamPos.y, 4.5, delta);
          camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetCamPos.z, 4.5, delta);

          controls.target.x = THREE.MathUtils.damp(controls.target.x, _targetLookAt.x, 4.5, delta);
          controls.target.y = THREE.MathUtils.damp(controls.target.y, _targetLookAt.y, 4.5, delta);
          controls.target.z = THREE.MathUtils.damp(controls.target.z, _targetLookAt.z, 4.5, delta);

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

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    if (isSoftwareGl) {
      renderer.render(scene, camera);
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerMove);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);

      controls.dispose();
      gridTex.dispose();
      shadowTex.dispose();

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
      renderer.dispose();
      if (canvas.parentElement === container) {
        container.removeChild(canvas);
      }
    };
  }, []);

  // Clamp tooltip position inside viewport (including narrow mobile screens)
  const tooltipW = typeof window !== 'undefined' ? Math.min(288, window.innerWidth - 24) : 288;
  const tooltipLeft = tooltip
    ? Math.max(12, Math.min(tooltip.x + 12, window.innerWidth - tooltipW - 12))
    : 0;
  const tooltipTop = tooltip
    ? Math.max(64, Math.min(tooltip.y - 16, window.innerHeight - 210))
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
    <div className="relative h-full w-full select-none">
      {/* Dedicated empty container for Three.js WebGL canvas */}
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Escena 3D interactiva del ecosistema Instagram de Coquimbo"
      />

      {/* Graceful fallback if WebGL is disabled */}
      {webglError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F4F7FB] p-8 text-center">
          <div className="glass-panel max-w-md rounded-2xl p-6">
            <h2 className="font-display text-xl font-semibold text-[#0F172A]">
              Modo de visualización 2D activo
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              El navegador suspendió el contexto WebGL. Las métricas y paneles interactivos siguen disponibles.
            </p>
          </div>
        </div>
      )}

      {/* Dynamic 3D Hover / Tap Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 w-[min(18rem,calc(100vw-1.5rem))] rounded-xl border border-slate-900/10 bg-white/96 p-3.5 shadow-xl transition-transform duration-100"
          style={{
            left: `${tooltipLeft}px`,
            top: `${tooltipTop}px`,
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: tooltip.payload.color }}
            />
            <span className="truncate text-xs font-semibold text-[#0F172A]">
              {tooltip.payload.title}
            </span>
          </div>
          <div className="font-mono-tabular mt-1.5 text-lg font-bold tracking-tight text-[#0F172A]">
            {tooltip.payload.metric}
          </div>
          <p className="mt-1 text-xs leading-snug text-slate-600">
            {tooltip.payload.subtitle}
          </p>

          {hasVariance && (
            <div className="mt-2.5 border-t border-slate-900/10 pt-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>vs. promedio general</span>
                {tooltip.payload.averageLabel && (
                  <span className="font-mono-tabular font-medium text-slate-600">
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
                        ? 'text-[#F97316]'
                        : 'text-slate-600'
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
                <span className="text-[11px] font-medium text-slate-500">
                  {isPositive
                    ? 'sobre el promedio'
                    : isNegative
                      ? 'bajo el promedio'
                      : 'en el promedio'}
                </span>
              </div>

              {/* Bi-directional centered deviation bar */}
              <div className="relative mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/90">
                <div className="absolute top-0 bottom-0 left-1/2 z-10 w-px -translate-x-1/2 bg-slate-400" />
                {isPositive && (
                  <div
                    className="absolute top-0 bottom-0 left-1/2 rounded-r-full bg-[#10B981]"
                    style={{ width: `${barHalfWidthPct}%` }}
                  />
                )}
                {isNegative && (
                  <div
                    className="absolute top-0 bottom-0 right-1/2 rounded-l-full bg-[#F97316]"
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
});

Scene3DCanvas.displayName = 'Scene3DCanvas';
