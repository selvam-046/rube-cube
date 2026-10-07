import React from 'react';
import { 
    Shuffle, 
    RotateCcw, 
    Cpu, 
    ArrowLeft, 
    ArrowRight, 
    ArrowUp, 
    ArrowDown, 
    RotateCw, 
    Repeat 
} from 'lucide-react';

export function ManualControls({
    onTriggerMove,
    onScramble,
    onReset,
    onSolve,
    disabled = false,
    solving = false
}) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-4">
            {/* Action Bar */}
            <div className="grid grid-cols-3 gap-2">
                <button
                    id="scramble-btn"
                    onClick={onScramble}
                    disabled={disabled}
                    className="py-2.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                    <Shuffle className="w-3.5 h-3.5" />
                    Scramble
                </button>

                <button
                    id="reset-cube-btn"
                    onClick={onReset}
                    disabled={disabled}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                </button>

                <button
                    id="solve-cube-btn"
                    onClick={onSolve}
                    disabled={disabled || solving}
                    className="py-2.5 px-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-950/50 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                    <Cpu className="w-3.5 h-3.5" />
                    {solving ? 'Solving...' : 'Solve'}
                </button>
            </div>

            {/* Horizontal Rows Section */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm bg-blue-500"></span>
                        Horizontal Rows (Left / Right)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">3 Layers</span>
                </div>

                <div className="flex flex-col gap-2">
                    {/* Top Row */}
                    <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-200">Top Row</span>
                            <span className="text-[10px] text-slate-500">Upper layer (U)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => onTriggerMove('U')}
                                disabled={disabled}
                                title="Move Top Row Left (U)"
                                className="py-1.5 px-3 bg-slate-900 hover:bg-blue-600 disabled:opacity-40 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-800 hover:border-blue-500 transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                            >
                                <ArrowLeft className="w-3.5 h-3.5 text-blue-400 group-hover:text-white" />
                                Left
                            </button>
                            <button
                                onClick={() => onTriggerMove("U'")}
                                disabled={disabled}
                                title="Move Top Row Right (U')"
                                className="py-1.5 px-3 bg-slate-900 hover:bg-blue-600 disabled:opacity-40 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-800 hover:border-blue-500 transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                            >
                                Right
                                <ArrowRight className="w-3.5 h-3.5 text-blue-400 group-hover:text-white" />
                            </button>
                            <button
                                onClick={() => onTriggerMove('U2')}
                                disabled={disabled}
                                title="Turn Top Row 180° (U2)"
                                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-400 hover:text-slate-200 text-xs font-mono rounded-lg border border-slate-800 transition-all active:scale-95"
                            >
                                180°
                            </button>
                        </div>
                    </div>

                    {/* Middle Row */}
                    <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-200">Middle Row</span>
                            <span className="text-[10px] text-slate-500">Equator layer</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => onTriggerMove('E_LEFT')}
                                disabled={disabled}
                                title="Move Middle Row Left"
                                className="py-1.5 px-3 bg-slate-900 hover:bg-blue-600 disabled:opacity-40 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-800 hover:border-blue-500 transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                            >
                                <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
                                Left
                            </button>
                            <button
                                onClick={() => onTriggerMove('E_RIGHT')}
                                disabled={disabled}
                                title="Move Middle Row Right"
                                className="py-1.5 px-3 bg-slate-900 hover:bg-blue-600 disabled:opacity-40 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-800 hover:border-blue-500 transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                            >
                                Right
                                <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                            </button>
                            <button
                                onClick={() => onTriggerMove('E2')}
                                disabled={disabled}
                                title="Turn Middle Row 180°"
                                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-400 hover:text-slate-200 text-xs font-mono rounded-lg border border-slate-800 transition-all active:scale-95"
                            >
                                180°
                            </button>
                        </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-200">Bottom Row</span>
                            <span className="text-[10px] text-slate-500">Lower layer (D)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => onTriggerMove("D'")}
                                disabled={disabled}
                                title="Move Bottom Row Left (D')"
                                className="py-1.5 px-3 bg-slate-900 hover:bg-blue-600 disabled:opacity-40 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-800 hover:border-blue-500 transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                            >
                                <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
                                Left
                            </button>
                            <button
                                onClick={() => onTriggerMove('D')}
                                disabled={disabled}
                                title="Move Bottom Row Right (D)"
                                className="py-1.5 px-3 bg-slate-900 hover:bg-blue-600 disabled:opacity-40 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-800 hover:border-blue-500 transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                            >
                                Right
                                <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                            </button>
                            <button
                                onClick={() => onTriggerMove('D2')}
                                disabled={disabled}
                                title="Turn Bottom Row 180° (D2)"
                                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-400 hover:text-slate-200 text-xs font-mono rounded-lg border border-slate-800 transition-all active:scale-95"
                            >
                                180°
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vertical Columns Section */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm bg-emerald-500"></span>
                        Vertical Columns (Up / Down)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">3 Layers</span>
                </div>

                <div className="flex flex-col gap-2">
                    {/* Left Column */}
                    <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-200">Left Column</span>
                            <span className="text-[10px] text-slate-500">Left slice (L)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => onTriggerMove("L'")}
                                disabled={disabled}
                                title="Move Left Column Up (L')"
                                className="py-1.5 px-3 bg-slate-900 hover:bg-emerald-600 disabled:opacity-40 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-800 hover:border-emerald-500 transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                            >
                                <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                                Up
                            </button>
                            <button
                                onClick={() => onTriggerMove('L')}
                                disabled={disabled}
                                title="Move Left Column Down (L)"
                                className="py-1.5 px-3 bg-slate-900 hover:bg-emerald-600 disabled:opacity-40 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-800 hover:border-emerald-500 transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                            >
                                Down
                                <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                            </button>
                            <button
                                onClick={() => onTriggerMove('L2')}
                                disabled={disabled}
                                title="Turn Left Column 180° (L2)"
                                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-400 hover:text-slate-200 text-xs font-mono rounded-lg border border-slate-800 transition-all active:scale-95"
                            >
                                180°
                            </button>
                        </div>
                    </div>

                    {/* Middle Column */}
                    <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-200">Middle Column</span>
                            <span className="text-[10px] text-slate-500">Center vertical slice</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => onTriggerMove('M_UP')}
                                disabled={disabled}
                                title="Move Middle Column Up"
                                className="py-1.5 px-3 bg-slate-900 hover:bg-emerald-600 disabled:opacity-40 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-800 hover:border-emerald-500 transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                            >
                                <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                                Up
                            </button>
                            <button
                                onClick={() => onTriggerMove('M_DOWN')}
                                disabled={disabled}
                                title="Move Middle Column Down"
                                className="py-1.5 px-3 bg-slate-900 hover:bg-emerald-600 disabled:opacity-40 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-800 hover:border-emerald-500 transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                            >
                                Down
                                <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                            </button>
                            <button
                                onClick={() => onTriggerMove('M2')}
                                disabled={disabled}
                                title="Turn Middle Column 180°"
                                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-400 hover:text-slate-200 text-xs font-mono rounded-lg border border-slate-800 transition-all active:scale-95"
                            >
                                180°
                            </button>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-200">Right Column</span>
                            <span className="text-[10px] text-slate-500">Right slice (R)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => onTriggerMove('R')}
                                disabled={disabled}
                                title="Move Right Column Up (R)"
                                className="py-1.5 px-3 bg-slate-900 hover:bg-emerald-600 disabled:opacity-40 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-800 hover:border-emerald-500 transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                            >
                                <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                                Up
                            </button>
                            <button
                                onClick={() => onTriggerMove("R'")}
                                disabled={disabled}
                                title="Move Right Column Down (R')"
                                className="py-1.5 px-3 bg-slate-900 hover:bg-emerald-600 disabled:opacity-40 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-800 hover:border-emerald-500 transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                            >
                                Down
                                <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                            </button>
                            <button
                                onClick={() => onTriggerMove('R2')}
                                disabled={disabled}
                                title="Turn Right Column 180° (R2)"
                                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-400 hover:text-slate-200 text-xs font-mono rounded-lg border border-slate-800 transition-all active:scale-95"
                            >
                                180°
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Face Rotations Section */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm bg-purple-500"></span>
                        Face Turns (Clockwise / Counter-CW)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Front & Back</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {/* Front Face */}
                    <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-200">Front Face</span>
                            <span className="text-[10px] text-slate-500">F</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                            <button
                                onClick={() => onTriggerMove('F')}
                                disabled={disabled}
                                title="Rotate Front Clockwise (F)"
                                className="py-1 px-1.5 bg-slate-900 hover:bg-purple-600 disabled:opacity-40 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-800 hover:border-purple-500 transition-all flex items-center justify-center gap-1 active:scale-95"
                            >
                                <RotateCw className="w-3 h-3" />
                                ↻ CW
                            </button>
                            <button
                                onClick={() => onTriggerMove("F'")}
                                disabled={disabled}
                                title="Rotate Front Counter-Clockwise (F')"
                                className="py-1 px-1.5 bg-slate-900 hover:bg-purple-600 disabled:opacity-40 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-800 hover:border-purple-500 transition-all flex items-center justify-center gap-1 active:scale-95"
                            >
                                <RotateCcw className="w-3 h-3" />
                                ↺ CCW
                            </button>
                            <button
                                onClick={() => onTriggerMove('F2')}
                                disabled={disabled}
                                title="Turn Front 180° (F2)"
                                className="py-1 px-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-400 hover:text-slate-200 text-xs font-mono rounded-lg border border-slate-800 transition-all active:scale-95 flex items-center justify-center"
                            >
                                180°
                            </button>
                        </div>
                    </div>

                    {/* Back Face */}
                    <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-200">Back Face</span>
                            <span className="text-[10px] text-slate-500">B</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                            <button
                                onClick={() => onTriggerMove('B')}
                                disabled={disabled}
                                title="Rotate Back Clockwise (B)"
                                className="py-1 px-1.5 bg-slate-900 hover:bg-purple-600 disabled:opacity-40 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-800 hover:border-purple-500 transition-all flex items-center justify-center gap-1 active:scale-95"
                            >
                                <RotateCw className="w-3 h-3" />
                                ↻ CW
                            </button>
                            <button
                                onClick={() => onTriggerMove("B'")}
                                disabled={disabled}
                                title="Rotate Back Counter-Clockwise (B')"
                                className="py-1 px-1.5 bg-slate-900 hover:bg-purple-600 disabled:opacity-40 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-800 hover:border-purple-500 transition-all flex items-center justify-center gap-1 active:scale-95"
                            >
                                <RotateCcw className="w-3 h-3" />
                                ↺ CCW
                            </button>
                            <button
                                onClick={() => onTriggerMove('B2')}
                                disabled={disabled}
                                title="Turn Back 180° (B2)"
                                className="py-1 px-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-400 hover:text-slate-200 text-xs font-mono rounded-lg border border-slate-800 transition-all active:scale-95 flex items-center justify-center"
                            >
                                180°
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
