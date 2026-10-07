import React from 'react';
import { Sparkles, Eye, EyeOff } from 'lucide-react';

export function ScanGuide({ currentFaceInfo, faceIndex, totalFaces = 6, showOverlay = true, onToggleOverlay }) {
    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-3 sm:p-4 z-10">
            {/* Header Badge */}
            <div className="bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/80 shadow-lg text-center pointer-events-auto max-w-sm w-full">
                <div className="flex items-center justify-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                        SCAN FACE {faceIndex + 1} OF {totalFaces}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50 flex items-center gap-1 font-medium">
                        <Sparkles className="w-2.5 h-2.5" /> 3x3 Grid
                    </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide mt-0.5">
                    {currentFaceInfo.label}
                </h3>
                <p className="text-xs text-slate-300 font-medium mt-0.5 flex items-center justify-center gap-1">
                    Center sticker: 
                    <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-xs" style={{ color: currentFaceInfo.badgeColor }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentFaceInfo.badgeColor }} />
                        {currentFaceInfo.centerColorName}
                    </span>
                </p>
            </div>

            {/* 3x3 Targeting Guide Grid */}
            {showOverlay ? (
                <div className="relative w-60 h-60 sm:w-72 sm:h-72 transition-all duration-300 flex items-center justify-center">
                    {/* Corner brackets */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-3 border-l-3 border-emerald-400 rounded-tl-lg pointer-events-none" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-3 border-r-3 border-emerald-400 rounded-tr-lg pointer-events-none" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-3 border-l-3 border-emerald-400 rounded-bl-lg pointer-events-none" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-3 border-r-3 border-emerald-400 rounded-br-lg pointer-events-none" />

                    {/* 3x3 Overlay Grid */}
                    <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-1.5 p-1 rounded-xl border border-emerald-400/40 bg-black/20 backdrop-blur-[1px]">
                        {Array.from({ length: 9 }).map((_, idx) => {
                            const isCenter = idx === 4;
                            return (
                                <div
                                    key={idx}
                                    className={`rounded-lg border flex items-center justify-center transition-all ${
                                        isCenter
                                            ? 'border-2 border-dashed shadow-inner'
                                            : 'border-white/30 bg-white/5'
                                    }`}
                                    style={isCenter ? { borderColor: currentFaceInfo.badgeColor, backgroundColor: `${currentFaceInfo.badgeColor}20` } : {}}
                                >
                                    {isCenter && (
                                        <span 
                                            className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shadow-sm"
                                            style={{ backgroundColor: currentFaceInfo.badgeColor, color: currentFaceInfo.centerColorName === 'White' || currentFaceInfo.centerColorName === 'Yellow' ? '#000' : '#fff' }}
                                        >
                                            CENTER
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Helper text */}
                    <div className="absolute -bottom-7 px-3 py-0.5 bg-black/75 backdrop-blur-md rounded-full text-[10px] text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-medium shadow-md">
                        Align 9 stickers inside the 3x3 boxes
                    </div>
                </div>
            ) : (
                <div className="flex-1" />
            )}

            {/* Bottom Controls Bar */}
            <div className="flex items-center gap-2 pointer-events-auto max-w-md w-full justify-between">
                <div className="bg-slate-950/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 shadow-lg text-left flex-1">
                    <p className="text-xs text-slate-200 leading-snug">
                        {currentFaceInfo.instruction}
                    </p>
                </div>

                {onToggleOverlay && (
                    <button
                        onClick={onToggleOverlay}
                        title={showOverlay ? 'Hide Guide Overlay' : 'Show Guide Overlay'}
                        className="p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700/60 transition-colors shadow-lg"
                    >
                        {showOverlay ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                )}
            </div>
        </div>
    );
}
