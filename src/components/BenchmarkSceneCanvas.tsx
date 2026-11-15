import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ConurbanoDuelMode,
  buildBenchmarkCh0Ecosystem,
  buildBenchmarkCh1ReachDonut,
  buildBenchmarkCh2Duel,
  buildBenchmarkCh3OutliersScatter,
  buildBenchmarkCh4FormatsSentiment,
  buildBenchmarkCh5Heatmap,
} from '../three/benchmarkBuilders';
import { createDarkTelemetryGridTexture } from '../three/proceduralTextures';
import { BuiltSlideScene, HoverPayload } from '../three/slideBuilders';
import { Scene3DHandle } from './Scene3DCanvas';

interface BenchmarkSceneCanvasProps {
  activeChapter: number;
  duelMode: ConurbanoDuelMode;
  highlightedRank: number | null;
  resetCameraNonce: number;
  freeOrbitMode: boolean;
  autoPresent: boolean;
  onHoverRank?: (rank: number | null) => void;
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

export const BenchmarkSceneCanvas = forwardRef<Scene3DHandle, BenchmarkSceneCanvasProps>(
  (
    {
      activeChapter,
      duelMode,
      highlightedRank,
      resetCameraNonce,
      freeOrbitMode,
      autoPresent,
      onHoverRank,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);
    const [webglError, setWebglError] = useState(false);

    const activeChapterRef = useRef(activeChapter);
    const duelModeRef = useRef(duelMode);
    const highlightedRankRef = useRef(highlightedRank);
    const freeOrbitRef = useRef(freeOrbitMode);
    const autoPresentRef = useRef(autoPresent);
    const onHoverRankRef = useRef(onHoverRank);
    const cameraTransitionActiveRef = useRef(true);
    const captureApiRef = useRef<Scene3DHandle | null>(null);
    const duelSwitchRef = useRef<((mode: ConurbanoDuelMode) => void) | null>(null);

    activeChapterRef.current = activeChapter;
    duelModeRef.current = duelMode;
    highlightedRankRef.current = highlightedRank;
    freeOrbitRef.current = freeOrbitMode;
    autoPresentRef.current = autoPresent;
    onHoverRankRef.current = onHoverRank;

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
      cameraTransitionActiveRef.current = true;
    }, [activeChapter, resetCameraNonce]);

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

      // Deep space telemetry background (#060B19)
      const scene = new THREE.Scene();
      const bgHex = 0x060b19;
      scene.background = new THREE.Color(bgHex);
      scene.fog = new THREE.FogExp2(bgHex, 0.026);

      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      scene.environment = pmremGenerator.fromScene(roomEnv, 0.05).texture;
      roomEnv.dispose();
      pmremGenerator.dispose();

      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 140);
      camera.position.set(1.3, 5.2, 12.2);

      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = !isSoftwareGl;
      controls.dampingFactor = 0.06;
      controls.enablePan = false;
      controls.minDistance = 4.5;
      controls.maxDistance = 19;
      controls.minPolarAngle = 0.22;
      controls.maxPolarAngle = Math.PI / 2 - 0.05;
      controls.target.set(0.8, 2.3, 0);
      controls.update();
      controls.addEventListener('start', () => {
        cameraTransitionActiveRef.current = false;
      });

      // Volumetric sci-fi lighting rig (Cyan + Magenta + Emerald accents)
      const hemi = new THREE.HemisphereLight(0x38bdf8, 0x090d1a, 0.9);
      scene.add(hemi);

      const cyanSpot = new THREE.DirectionalLight(0x00f0ff, 1.45);
      cyanSpot.position.set(9, 14, 10);
      scene.add(cyanSpot);

      const magentaRim = new THREE.DirectionalLight(0xff2e93, 1.05);
      magentaRim.position.set(-10, 8, -8);
      scene.add(magentaRim);

      const amberFill = new THREE.PointLight(0xffb800, 1.4, 24);
      amberFill.position.set(0, 6, 8);
      scene.add(amberFill);

      // Reflective dark floor + glowing telemetry grid
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(80, 80),
        new THREE.MeshStandardMaterial({
          color: 0x070d1f,
          roughness: 0.28,
          metalness: 0.65,
        })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.02;
      scene.add(floor);

      const gridTex = createDarkTelemetryGridTexture(renderer.capabilities.getMaxAnisotropy());
      const gridPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(22, 22),
        new THREE.MeshBasicMaterial({
          map: gridTex,
          transparent: true,
          depthWrite: false,
        })
      );
      gridPlane.rotation.x = -Math.PI / 2;
      gridPlane.position.y = 0.005;
      scene.add(gridPlane);

      // Subtle ambient telemetry particle field
      const particleCount = 160;
      const pPositions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        pPositions[i * 3] = (Math.random() - 0.5) * 26;
        pPositions[i * 3 + 1] = Math.random() * 11 + 0.4;
        pPositions[i * 3 + 2] = (Math.random() - 0.5) * 24;
      }
      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
      const particleMat = new THREE.PointsMaterial({
        color: 0x00f0ff,
        size: 0.07,
        transparent: true,
        opacity: 0.55,
      });
      const starfield = new THREE.Points(particleGeo, particleMat);
      scene.add(starfield);

      // Build all 6 Benchmark chapters once
      const ch2Data = buildBenchmarkCh2Duel();
      const builtChapters: BuiltSlideScene[] = [
        buildBenchmarkCh0Ecosystem(),
        buildBenchmarkCh1ReachDonut(),
        ch2Data.scene,
        buildBenchmarkCh3OutliersScatter(),
        buildBenchmarkCh4FormatsSentiment(),
        buildBenchmarkCh5Heatmap(),
      ];

      builtChapters.forEach((c, idx) => {
        c.group.visible = idx === activeChapterRef.current;
        c.group.scale.setScalar(idx === activeChapterRef.current ? 1 : 0.88);
        scene.add(c.group);
      });

      duelSwitchRef.current = (mode: ConurbanoDuelMode) => {
        const showTotals = mode === 'totals';
        ch2Data.totalsGroup.visible = showTotals;
        ch2Data.efficiencyGroup.visible = !showTotals;
        ch2Data.totalsGroup.scale.setScalar(showTotals ? 1 : 0.85);
        ch2Data.efficiencyGroup.scale.setScalar(!showTotals ? 1 : 0.85);
        ch2Data.scene.hoverables.length = 0;
        ch2Data.scene.hoverables.push(
          ...(showTotals ? ch2Data.totalsHoverables : ch2Data.efficiencyHoverables)
        );
      };
      duelSwitchRef.current(duelModeRef.current);

      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }

      captureApiRef.current = {
        prepareSlideForCapture: (idx: number) => {
          activeChapterRef.current = idx;
          builtChapters.forEach((c, i) => {
            c.group.visible = i === idx;
            if (i === idx) {
              c.group.scale.setScalar(1);
              c.group.rotation.set(0, 0, 0);
            }
          });
          const target = builtChapters[idx];
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
      let pointerClientX = 0;
      let pointerClientY = 0;

      const clearHover = () => {
        if (hoveredMesh && hoveredMesh.material instanceof THREE.MeshStandardMaterial) {
          const baseInt =
            typeof hoveredMesh.userData.baseEmissiveIntensity === 'number'
              ? hoveredMesh.userData.baseEmissiveIntensity
              : 0.2;
          hoveredMesh.material.emissiveIntensity = baseInt;
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

        pointerOffsetX = _mouseNdc.x * 0.55;
        pointerOffsetY = _mouseNdc.y * 0.25;

        const now = performance.now();
        if (now - lastRaycast < 35) return;
        lastRaycast = now;

        const cur = builtChapters[activeChapterRef.current];
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
                  : 0.2;
              hoveredMesh.material.emissiveIntensity = baseInt;
            }
          }

          if (
            targetMesh instanceof THREE.Mesh &&
            targetMesh.material instanceof THREE.MeshStandardMaterial
          ) {
            hoveredMesh = targetMesh;
            _tempColor.set(payload?.color || '#00F0FF');
            targetMesh.material.emissive.copy(_tempColor);
            targetMesh.material.emissiveIntensity = 0.85;
          }

          canvas.style.cursor = 'pointer';
          if (payload) {
            setTooltip({ payload, x: pointerClientX, y: pointerClientY });
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
      canvas.addEventListener('pointerleave', handlePointerLeave);

      const handleResize = () => {
        if (!container) return;
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);

      let frameId = 0;
      let disposed = false;
      let lastChapter = activeChapterRef.current;

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
        const chIdx = activeChapterRef.current;

        starfield.rotation.y += delta * 0.018;

        if (chIdx !== lastChapter) {
          clearHover();
          builtChapters.forEach((c, i) => {
            c.group.visible = i === chIdx;
            if (i === chIdx) {
              c.group.scale.setScalar(0.86);
            }
          });
          lastChapter = chIdx;
          cameraTransitionActiveRef.current = true;
        }

        const activeScene = builtChapters[chIdx];
        if (activeScene) {
          const nextScale = THREE.MathUtils.damp(activeScene.group.scale.x, 1, 7, delta);
          activeScene.group.scale.setScalar(nextScale);

          if (autoPresentRef.current && !freeOrbitRef.current) {
            activeScene.group.rotation.y += delta * 0.16;
          } else if (!freeOrbitRef.current) {
            const targetRotY = pointerOffsetX * 0.16;
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

          const anim = activeScene.animatedObjects;
          if (anim.gyroRings) {
            anim.gyroRings.forEach((ring, i) => {
              ring.rotation.y += delta * (0.32 + i * 0.14) * (i % 2 === 0 ? 1 : -1);
              ring.rotation.x += delta * 0.12 * (i % 2 === 0 ? 1 : -1);
            });
          }
          if (anim.rings) {
            anim.rings.forEach((ring, i) => {
              ring.rotation.z += delta * 0.4 * (i % 2 === 0 ? 1 : -1);
            });
          }
          if (anim.floatingNodes) {
            anim.floatingNodes.forEach((node) => {
              node.obj.position.y =
                node.baseY + Math.sin(elapsed * node.speed + node.phase) * 0.09;
            });
          }
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
                slice.mesh.material.emissiveIntensity = isActive ? 0.72 : 0.24;
              }
            });
          }

          if (cameraTransitionActiveRef.current) {
            _targetCamPos.set(...activeScene.cameraPreset.position);
            _targetLookAt.set(...activeScene.cameraPreset.target);
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
        canvas.removeEventListener('pointerleave', handlePointerLeave);
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        canvas.removeEventListener('webglcontextrestored', handleContextRestored);

        controls.dispose();
        gridTex.dispose();
        particleGeo.dispose();
        particleMat.dispose();

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

    const tooltipLeft = tooltip ? Math.min(tooltip.x + 16, window.innerWidth - 305) : 0;
    const tooltipTop = tooltip ? Math.max(16, Math.min(tooltip.y - 16, window.innerHeight - 200)) : 0;
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
      <div className="relative h-full w-full select-none bg-[#060B19]">
        <div
          ref={containerRef}
          className="absolute inset-0 h-full w-full"
          aria-label="Escena 3D de telemetría Coquimbo Digital Benchmark 3D"
        />

        {webglError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#060B19] p-8 text-center">
            <div className="dark-glass-panel max-w-md rounded-2xl p-6 text-slate-100">
              <h2 className="font-display text-xl font-semibold">Modo 2D Activo</h2>
              <p className="mt-2 text-sm text-slate-400">
                El contexto WebGL no está disponible en este navegador, pero los indicadores y paneles siguen activos.
              </p>
            </div>
          </div>
        )}

        {tooltip && (
          <div
            className="pointer-events-none fixed z-50 w-72 rounded-xl border border-white/15 bg-[#0A1226]/95 p-3.5 text-slate-100 shadow-2xl"
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
            <div className="font-mono-tabular mt-1.5 text-lg font-bold tracking-tight text-[#00F0FF]">
              {tooltip.payload.metric}
            </div>
            <p className="mt-1 text-xs leading-snug text-slate-300">
              {tooltip.payload.subtitle}
            </p>

            {hasVariance && (
              <div className="mt-2.5 border-t border-white/10 pt-2.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>vs. promedio general</span>
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
                          ? 'text-[#FFB800]'
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
                  <span className="text-[11px] text-slate-400">
                    {isPositive
                      ? 'sobre el promedio'
                      : isNegative
                        ? 'bajo el promedio'
                        : 'en el promedio'}
                  </span>
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
                      className="absolute top-0 bottom-0 right-1/2 rounded-l-full bg-[#FFB800]"
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

BenchmarkSceneCanvas.displayName = 'BenchmarkSceneCanvas';
