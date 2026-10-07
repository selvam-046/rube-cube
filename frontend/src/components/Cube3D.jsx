import React, { useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Cubie } from './Cubie';
import { MoveArrow3D } from './MoveArrow3D';
import { MOVE_CONFIGS } from '../cube/constants';
import { applyLogicalMove } from '../cube/cubeState';

function RotatingCubeScene({
    cubies,
    setCubies,
    activeMove,
    onMoveFinish,
    highlightLayer,
    animationSpeed = 1,
    showArrow = true,
    controlsRef
}) {
    // Reference to the dynamic pivot group for rotating layer
    const pivotRef = useRef();
    const animProgress = useRef(0);
    const currentMoveConfig = useRef(null);

    // Filter moving vs static cubies during active animation
    const { staticCubies, movingCubies } = React.useMemo(() => {
        if (!activeMove || !MOVE_CONFIGS[activeMove]) {
            return {
                staticCubies: cubies,
                movingCubies: []
            };
        }
        const cfg = MOVE_CONFIGS[activeMove];
        const stat = [];
        const mov = [];

        cubies.forEach(c => {
            const coord = cfg.axis === 'x' ? c.position[0] : cfg.axis === 'y' ? c.position[1] : c.position[2];
            if (coord === cfg.layer) {
                mov.push(c);
            } else {
                stat.push(c);
            }
        });

        return { staticCubies: stat, movingCubies: mov };
    }, [cubies, activeMove]);

    // Start animation when activeMove changes
    useEffect(() => {
        if (activeMove && MOVE_CONFIGS[activeMove]) {
            currentMoveConfig.current = MOVE_CONFIGS[activeMove];
            animProgress.current = 0;
            if (pivotRef.current) {
                pivotRef.current.rotation.set(0, 0, 0);
            }
        }
    }, [activeMove]);

    // Cubic easeInOut function
    const easeInOutCubic = (t) => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    useFrame((_, delta) => {
        if (!currentMoveConfig.current || !pivotRef.current) return;

        const cfg = currentMoveConfig.current;
        // Base duration 500ms scaled by animationSpeed
        const stepRate = delta / (0.5 / animationSpeed);
        animProgress.current = Math.min(1.0, animProgress.current + stepRate);

        const eased = easeInOutCubic(animProgress.current);
        const currentAngle = cfg.angle * eased;

        if (cfg.axis === 'x') pivotRef.current.rotation.x = currentAngle;
        else if (cfg.axis === 'y') pivotRef.current.rotation.y = currentAngle;
        else if (cfg.axis === 'z') pivotRef.current.rotation.z = currentAngle;

        // Check if move finished
        if (animProgress.current >= 1.0) {
            pivotRef.current.rotation.set(0, 0, 0);
            currentMoveConfig.current = null;

            // Commit logical rotation to cubies
            setCubies(prevCubies => {
                return applyLogicalMove(prevCubies, cfg.axis, cfg.layer, cfg.angle);
            });

            if (onMoveFinish) {
                onMoveFinish(activeMove);
            }
        }
    });

    // Check if a cubie should be highlighted
    const isCubieHighlighted = useCallback((cubie) => {
        if (!highlightLayer) return false;
        const coord = highlightLayer.axis === 'x' ? cubie.position[0]
                    : highlightLayer.axis === 'y' ? cubie.position[1]
                    : cubie.position[2];
        return coord === highlightLayer.layer;
    }, [highlightLayer]);

    const activeConfig = activeMove ? MOVE_CONFIGS[activeMove] : (highlightLayer ? MOVE_CONFIGS[highlightLayer.move] : null);

    return (
        <>
            <ambientLight intensity={1.2} />
            <directionalLight position={[6, 8, 5]} intensity={1.6} castShadow />
            <directionalLight position={[-6, -4, -5]} intensity={0.7} />
            <pointLight position={[0, 5, 0]} intensity={0.6} />

            {/* Static cubies */}
            {staticCubies.map(cubie => (
                <Cubie
                    key={cubie.id}
                    position={cubie.position}
                    quaternion={cubie.quaternion}
                    colors={cubie.colors}
                    isHighlighted={isCubieHighlighted(cubie)}
                />
            ))}

            {/* Rotating layer pivot */}
            <group ref={pivotRef}>
                {movingCubies.map(cubie => (
                    <Cubie
                        key={cubie.id}
                        position={cubie.position}
                        quaternion={cubie.quaternion}
                        colors={cubie.colors}
                        isHighlighted={true}
                    />
                ))}
            </group>

            {/* 3D Arrow showing rotation direction */}
            {showArrow && (
                <MoveArrow3D
                    moveConfig={activeConfig}
                    visible={Boolean(activeMove) || Boolean(highlightLayer)}
                />
            )}

            <OrbitControls
                ref={controlsRef}
                target={[0, 0, 0]}
                enableDamping
                dampingFactor={0.08}
                minDistance={3.5}
                maxDistance={12}
            />
        </>
    );
}

export function Cube3D({
    cubies,
    setCubies,
    activeMove,
    onMoveFinish,
    highlightLayer,
    animationSpeed = 1,
    showArrow = true,
    onResetView,
    onTriggerMove
}) {
    const controlsRef = useRef();
    const [showHud, setShowHud] = React.useState(true);

    const handleResetView = () => {
        if (controlsRef.current) {
            controlsRef.current.reset();
        }
        if (onResetView) onResetView();
    };

    const handleMove = (moveCode) => {
        if (!activeMove && onTriggerMove) {
            onTriggerMove(moveCode);
        }
    };

    return (
        <div className="relative w-full h-full min-h-[440px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 select-none">
            <Canvas
                shadows
                camera={{ position: [5.2, 4.2, 5.8], fov: 42 }}
                style={{ width: '100%', height: '100%', display: 'block' }}
            >
                <RotatingCubeScene
                    cubies={cubies}
                    setCubies={setCubies}
                    activeMove={activeMove}
                    onMoveFinish={onMoveFinish}
                    highlightLayer={highlightLayer}
                    animationSpeed={animationSpeed}
                    showArrow={showArrow}
                    controlsRef={controlsRef}
                />
            </Canvas>

            {/* Top Row On-Screen Controls */}
            {showHud && onTriggerMove && (
                <>
                    {/* Top Row Controls */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700/60 shadow-lg pointer-events-auto">
                        <span className="text-[10px] font-bold text-slate-400 mr-1 hidden sm:inline">Top Row</span>
                        <button
                            onClick={() => handleMove('U')}
                            disabled={Boolean(activeMove)}
                            title="Move Top Row Left (U)"
                            className="p-1 px-2 bg-slate-800 hover:bg-blue-600 disabled:opacity-40 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 active:scale-90"
                        >
                            ← Left
                        </button>
                        <button
                            onClick={() => handleMove("U'")}
                            disabled={Boolean(activeMove)}
                            title="Move Top Row Right (U')"
                            className="p-1 px-2 bg-slate-800 hover:bg-blue-600 disabled:opacity-40 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 active:scale-90"
                        >
                            Right →
                        </button>
                    </div>

                    {/* Bottom Row Controls */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700/60 shadow-lg pointer-events-auto">
                        <span className="text-[10px] font-bold text-slate-400 mr-1 hidden sm:inline">Bottom Row</span>
                        <button
                            onClick={() => handleMove("D'")}
                            disabled={Boolean(activeMove)}
                            title="Move Bottom Row Left (D')"
                            className="p-1 px-2 bg-slate-800 hover:bg-blue-600 disabled:opacity-40 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 active:scale-90"
                        >
                            ← Left
                        </button>
                        <button
                            onClick={() => handleMove('D')}
                            disabled={Boolean(activeMove)}
                            title="Move Bottom Row Right (D)"
                            className="p-1 px-2 bg-slate-800 hover:bg-blue-600 disabled:opacity-40 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 active:scale-90"
                        >
                            Right →
                        </button>
                    </div>

                    {/* Left Column Controls */}
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 bg-slate-900/85 backdrop-blur-md px-1.5 py-2.5 rounded-xl border border-slate-700/60 shadow-lg pointer-events-auto">
                        <span className="text-[9px] font-bold text-slate-400 uppercase rotate-[-90deg] my-2 hidden sm:inline">Left Col</span>
                        <button
                            onClick={() => handleMove("L'")}
                            disabled={Boolean(activeMove)}
                            title="Move Left Column Up (L')"
                            className="p-1.5 px-2 bg-slate-800 hover:bg-emerald-600 disabled:opacity-40 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition-all flex flex-col items-center active:scale-90"
                        >
                            ↑ Up
                        </button>
                        <button
                            onClick={() => handleMove('L')}
                            disabled={Boolean(activeMove)}
                            title="Move Left Column Down (L)"
                            className="p-1.5 px-2 bg-slate-800 hover:bg-emerald-600 disabled:opacity-40 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition-all flex flex-col items-center active:scale-90"
                        >
                            ↓ Dn
                        </button>
                    </div>

                    {/* Right Column Controls */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 bg-slate-900/85 backdrop-blur-md px-1.5 py-2.5 rounded-xl border border-slate-700/60 shadow-lg pointer-events-auto">
                        <span className="text-[9px] font-bold text-slate-400 uppercase rotate-[90deg] my-2 hidden sm:inline">Right Col</span>
                        <button
                            onClick={() => handleMove('R')}
                            disabled={Boolean(activeMove)}
                            title="Move Right Column Up (R)"
                            className="p-1.5 px-2 bg-slate-800 hover:bg-emerald-600 disabled:opacity-40 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition-all flex flex-col items-center active:scale-90"
                        >
                            ↑ Up
                        </button>
                        <button
                            onClick={() => handleMove("R'")}
                            disabled={Boolean(activeMove)}
                            title="Move Right Column Down (R')"
                            className="p-1.5 px-2 bg-slate-800 hover:bg-emerald-600 disabled:opacity-40 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition-all flex flex-col items-center active:scale-90"
                        >
                            ↓ Dn
                        </button>
                    </div>
                </>
            )}

            {/* Top Right HUD Action Buttons */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <button
                    onClick={() => setShowHud(prev => !prev)}
                    title={showHud ? 'Hide On-Screen Arrows' : 'Show On-Screen Arrows'}
                    className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-300 hover:text-white rounded-lg backdrop-blur-md border border-slate-700/50 shadow-md transition-all flex items-center gap-1"
                >
                    <span className="text-[10px] font-mono">{showHud ? 'Hide Controls' : 'Show Controls'}</span>
                </button>

                <button
                    id="reset-view-btn"
                    onClick={handleResetView}
                    title="Reset Camera Angle"
                    className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-300 hover:text-white rounded-lg backdrop-blur-md border border-slate-700/50 shadow-md transition-all flex items-center gap-1"
                >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                    </svg>
                    Reset View
                </button>
            </div>
        </div>
    );
}

