import React, { useState, useEffect, useCallback } from 'react';
import { Camera, Box, Info } from 'lucide-react';
import { Cube3D } from './components/Cube3D';
import { CameraScanner } from './components/CameraScanner';
import { SolutionPanel } from './components/SolutionPanel';
import { ManualControls } from './components/ManualControls';
import { createInitialCubies, extractFaceColors, applyLogicalMove } from './cube/cubeState';
import { MOVE_CONFIGS } from './cube/constants';
import { checkHealth, solveCube, fetchScramble } from './api/solverApi';

export default function App() {
    // 3D Cube State
    const [cubies, setCubies] = useState(createInitialCubies);
    const [activeMove, setActiveMove] = useState(null);
    const [moveQueue, setMoveQueue] = useState([]);
    const [highlightLayer, setHighlightLayer] = useState(null);

    // Solution & Playback State
    const [solutionData, setSolutionData] = useState(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [isSolving, setIsSolving] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);

    // Scanner Modal
    const [scannerOpen, setScannerOpen] = useState(false);
    const [backendOnline, setBackendOnline] = useState(true);

    // Check backend health periodically
    useEffect(() => {
        const verifyHealth = async () => {
            const isOk = await checkHealth();
            setBackendOnline(isOk);
        };
        verifyHealth();
        const interval = setInterval(verifyHealth, 15000);
        return () => clearInterval(interval);
    }, []);

    // Queue processing: when idle and queue has moves, dispatch next move
    useEffect(() => {
        if (!activeMove && moveQueue.length > 0) {
            const timer = setTimeout(() => {
                setMoveQueue(prevQueue => {
                    if (prevQueue.length === 0) return prevQueue;
                    const [nextMove, ...remainingQueue] = prevQueue;
                    const cfg = MOVE_CONFIGS[nextMove];
                    if (cfg) {
                        setHighlightLayer({ axis: cfg.axis, layer: cfg.layer, move: nextMove });
                    }
                    setActiveMove(nextMove);
                    return remainingQueue;
                });
            }, 50);

            return () => clearTimeout(timer);
        }
    }, [activeMove, moveQueue.length]);

    // When an animation finishes on the 3D canvas
    const handleMoveFinish = useCallback(() => {
        setActiveMove(null);
        setHighlightLayer(null);
    }, []);

    // Trigger an individual move
    const triggerMove = useCallback((moveStr, stepIdx = null) => {
        if (stepIdx !== null) {
            setCurrentStepIndex(stepIdx + 1);
        }
        setMoveQueue(prev => [...prev, moveStr]);
    }, []);

    // Scramble button handler
    const handleScramble = async () => {
        setIsPlaying(false);
        setSolutionData(null);
        setCurrentStepIndex(0);
        setStatusMessage('Generating WCA scramble...');

        try {
            const res = await fetchScramble(20);
            setStatusMessage(`Applying scramble: ${res.scramble_string}`);

            // Apply scramble sequentially to 3D cube
            res.scramble_moves.forEach((move, i) => {
                setTimeout(() => {
                    setCubies(prev => {
                        const cfg = MOVE_CONFIGS[move];
                        return applyLogicalMove(prev, cfg.axis, cfg.layer, cfg.angle);
                    });
                }, i * 30);
            });

            // Preload the calculated solution
            setTimeout(() => {
                setSolutionData({
                    moves: res.solution_moves,
                    steps: res.solution_steps,
                    solution: res.solution_moves.join(' '),
                    move_count: res.move_count
                });
                setStatusMessage(`Scrambled! Solution found in ${res.move_count} moves. Click "Play Solution".`);
            }, res.scramble_moves.length * 30 + 100);

        } catch (err) {
            setStatusMessage(`Scramble failed: ${err.message}`);
        }
    };

    // Reset Cube to solved state
    const handleReset = () => {
        setIsPlaying(false);
        setActiveMove(null);
        setMoveQueue([]);
        setHighlightLayer(null);
        setSolutionData(null);
        setCurrentStepIndex(0);
        setCubies(createInitialCubies());
        setStatusMessage('Cube reset to solved state.');
    };

    // Solve the current 3D cube state
    const handleSolveCurrentCube = async () => {
        setIsSolving(true);
        setStatusMessage('Analyzing cube and calculating optimal Two-Phase solution...');

        try {
            // Extract face color grids directly from current 27 cubies
            const faces = extractFaceColors(cubies);
            const res = await solveCube(faces);

            setSolutionData({
                moves: res.moves,
                steps: res.steps,
                solution: res.solution,
                move_count: res.move_count
            });
            setCurrentStepIndex(0);
            setStatusMessage(`Solution found! ${res.move_count} moves using Kociemba's Algorithm.`);
        } catch (err) {
            setStatusMessage(`Solve error: ${err.message}`);
        } finally {
            setIsSolving(false);
        }
    };

    // Scanner Completion Handler
    const handleScannerComplete = async (scannedFaces, kociembaString) => {
        setScannerOpen(false);
        setIsSolving(true);
        setStatusMessage('Scanned 6 faces verified! Solving with Kociemba...');

        try {
            const res = await solveCube(scannedFaces, kociembaString);
            setSolutionData({
                moves: res.moves,
                steps: res.steps,
                solution: res.solution,
                move_count: res.move_count
            });
            setCurrentStepIndex(0);
            setStatusMessage(`Physical Cube scanned! Optimal solution: ${res.move_count} moves.`);
        } catch (err) {
            setStatusMessage(`Solving scanned cube failed: ${err.message}`);
        } finally {
            setIsSolving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-950/60 ring-1 ring-white/20">
                            <Box className="w-5 h-5 text-white animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                                    AI Rubik's Cube Solver
                                </h1>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                    3D & OpenCV
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 hidden sm:block">
                                Kociemba Two-Phase Algorithm &bull; Computer Vision &bull; 27 Cubies
                            </p>
                        </div>
                    </div>

                    {/* Actions & Status */}
                    <div className="flex items-center gap-3">
                        {/* Backend indicator */}
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700/60 text-xs">
                            <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                            <span className="text-slate-300 font-medium">
                                {backendOnline ? 'FastAPI Online' : 'Backend Offline'}
                            </span>
                        </div>

                        {/* Open Camera Scanner Button */}
                        <button
                            id="open-scanner-btn"
                            onClick={() => setScannerOpen(true)}
                            className="py-2 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/60 flex items-center gap-2 transition-all active:scale-95"
                        >
                            <Camera className="w-4 h-4" />
                            <span className="hidden sm:inline">Scan Physical Cube</span>
                            <span className="sm:hidden">Scan</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Status Message Notification Toast */}
            {statusMessage && (
                <div className="max-w-7xl mx-auto px-4 mt-3 w-full">
                    <div className="bg-slate-900/90 border border-slate-700/60 rounded-xl px-4 py-2.5 text-xs text-slate-200 flex items-center justify-between gap-3 shadow-md">
                        <div className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-blue-400 shrink-0" />
                            <span>{statusMessage}</span>
                        </div>
                        <button
                            onClick={() => setStatusMessage(null)}
                            className="text-slate-400 hover:text-white text-xs font-bold"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}

            {/* Main Application Content */}
            <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: 3D Interactive Rubik's Cube Canvas (Span 7) */}
                <div className="lg:col-span-7 flex flex-col gap-3">
                    <div className="h-[440px] sm:h-[520px] w-full relative">
                        <Cube3D
                            cubies={cubies}
                            setCubies={setCubies}
                            activeMove={activeMove}
                            onMoveFinish={handleMoveFinish}
                            highlightLayer={highlightLayer}
                            animationSpeed={speed}
                            showArrow={true}
                            onTriggerMove={triggerMove}
                        />
                    </div>

                    {/* Visual Instructions & Guidance */}
                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            <span>Left Click + Drag to rotate 3D view &bull; Scroll to zoom &bull; Right Click to pan</span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-500">27 Cubies</span>
                    </div>
                </div>

                {/* Right Column: Solution Controls & Manual Panel (Span 5) */}
                <div className="lg:col-span-5 flex flex-col gap-5">
                    {/* Solution Panel: Only shown when solution is active */}
                    {solutionData && (
                        <SolutionPanel
                            solutionData={solutionData}
                            currentStepIndex={currentStepIndex}
                            setCurrentStepIndex={setCurrentStepIndex}
                            isPlaying={isPlaying}
                            setIsPlaying={setIsPlaying}
                            onTriggerMove={triggerMove}
                            animating={Boolean(activeMove)}
                            speed={speed}
                            setSpeed={setSpeed}
                        />
                    )}

                    {/* Manual Controls & Scramble */}
                    <ManualControls
                        onTriggerMove={triggerMove}
                        onScramble={handleScramble}
                        onReset={handleReset}
                        onSolve={handleSolveCurrentCube}
                        disabled={Boolean(activeMove) || isPlaying}
                        solving={isSolving}
                    />
                </div>
            </main>

            {/* Modal: Camera OpenCV Face Scanner */}
            {scannerOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
                    <div className="w-full max-w-4xl max-h-[95vh] overflow-y-auto">
                        <CameraScanner
                            onComplete={handleScannerComplete}
                            onClose={() => setScannerOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
