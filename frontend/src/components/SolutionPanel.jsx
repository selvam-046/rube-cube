import React, { useEffect, useRef, useMemo } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export function SolutionPanel({
    solutionData,
    currentStepIndex,
    setCurrentStepIndex,
    isPlaying,
    setIsPlaying,
    onTriggerMove,
    animating,
    speed,
    setSpeed
}) {
    const moves = useMemo(() => solutionData?.moves || [], [solutionData]);
    const steps = useMemo(() => solutionData?.steps || [], [solutionData]);
    const totalMoves = moves.length;
    const isCompleted = currentStepIndex >= totalMoves && totalMoves > 0;
    const currentStep = steps[currentStepIndex] || null;

    // Trigger celebratory confetti on completion!
    useEffect(() => {
        if (isCompleted) {
            confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }, [isCompleted]);

    // Handle auto-advance when isPlaying is true and previous animation finishes
    const timerRef = useRef(null);

    useEffect(() => {
        if (isPlaying && !animating && !isCompleted) {
            timerRef.current = setTimeout(() => {
                if (currentStepIndex < totalMoves) {
                    onTriggerMove(moves[currentStepIndex], currentStepIndex);
                }
            }, 550 / speed);
        } else if (isCompleted) {
            setIsPlaying(false);
        }
        return () => clearTimeout(timerRef.current);
    }, [isPlaying, animating, currentStepIndex, isCompleted, totalMoves, moves, onTriggerMove, speed, setIsPlaying]);

    // Play/Pause toggle
    const handleTogglePlay = () => {
        if (isCompleted) {
            setCurrentStepIndex(0);
            setIsPlaying(true);
        } else {
            setIsPlaying(prev => !prev);
        }
    };

    // Step Forward
    const handleNextStep = () => {
        if (animating || currentStepIndex >= totalMoves) return;
        setIsPlaying(false);
        onTriggerMove(moves[currentStepIndex], currentStepIndex);
    };

    // Step Backward (Restart or previous step)
    const handleRestart = () => {
        setIsPlaying(false);
        setCurrentStepIndex(0);
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Step-by-Step Solver
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-950 border border-blue-800/60 text-blue-300">
                        {totalMoves} Moves
                    </span>
                </div>
            </div>

            {/* Complete Solution Moves Tape / Scrubber */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-700">
                {moves.map((moveStr, idx) => {
                    const isPassed = idx < currentStepIndex;
                    const isCurrent = idx === currentStepIndex;
                    return (
                        <button
                            key={idx}
                            onClick={() => {
                                setIsPlaying(false);
                                setCurrentStepIndex(idx);
                            }}
                            className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold shrink-0 transition-all ${
                                isCurrent
                                    ? 'bg-blue-600 text-white ring-2 ring-blue-400 shadow-md scale-105'
                                    : isPassed
                                    ? 'bg-slate-800/90 text-slate-400 line-through'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                        >
                            {moveStr}
                        </button>
                    );
                })}
            </div>

            {/* Active Step Card */}
            {isCompleted ? (
                <div className="p-6 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-800/50 rounded-2xl text-center flex flex-col items-center gap-2 animate-in zoom-in-95">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 mb-1">
                        <Check className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-extrabold text-white">
                        Rubik's Cube Solved!
                    </h4>
                    <p className="text-xs text-slate-400 max-w-xs">
                        Completed in {totalMoves} moves using Kociemba's Two-Phase Algorithm.
                    </p>
                    <button
                        onClick={handleRestart}
                        className="mt-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Replay Solution
                    </button>
                </div>
            ) : currentStep ? (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-inner">
                    {/* Step Meta Badge */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                            STEP {currentStep.step} / {totalMoves}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                            {currentStep.direction} ({currentStep.degrees}°)
                        </span>
                    </div>

                    {/* Big Action Callout */}
                    <div className="flex items-center justify-between gap-4 py-1">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-2xl font-black font-mono">
                                {currentStep.move}
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white tracking-wide">
                                    {currentStep.face_name}
                                </h4>
                                <p className="text-xs text-slate-300 font-medium">
                                    {currentStep.description}
                                </p>
                            </div>
                        </div>

                        {/* Arrow Graphic */}
                        <div className="text-3xl text-blue-400 font-extrabold px-3 py-1 bg-slate-900 rounded-xl border border-slate-800 shadow-sm">
                            {currentStep.arrow}
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Playback Controls & Speed Bar */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRestart}
                        title="Restart from beginning"
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                        onClick={handleTogglePlay}
                        disabled={animating && !isPlaying}
                        className={`py-2 px-5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 ${
                            isPlaying
                                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/50'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950/50'
                        }`}
                    >
                        {isPlaying ? (
                            <>
                                <Pause className="w-4 h-4" /> Pause
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" /> Play Solution
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleNextStep}
                        disabled={animating || isCompleted}
                        title="Next step"
                        className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 rounded-xl border border-slate-700 transition-colors"
                    >
                        <SkipForward className="w-4 h-4" />
                    </button>
                </div>

                {/* Speed Slider / Toggle */}
                <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
                    {[0.5, 1, 1.5, 2].map(spd => (
                        <button
                            key={spd}
                            onClick={() => setSpeed(spd)}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors ${
                                speed === spd
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {spd}x
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
