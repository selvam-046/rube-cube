import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Upload, Palette, LayoutGrid, RotateCcw, Sparkles } from 'lucide-react';
import { ScanGuide } from './ScanGuide';
import { scanFace, validateCube } from '../api/solverApi';
import { COLORS } from '../cube/constants';

const SCAN_FACES = [
    {
        key: 'front',
        name: 'F',
        label: 'Front Face',
        centerColorName: 'Green',
        centerColorKey: 'green',
        badgeColor: '#16a34a',
        instruction: 'Place FRONT face inside 3x3 guide with GREEN center facing camera, WHITE on top.'
    },
    {
        key: 'right',
        name: 'R',
        label: 'Right Face',
        centerColorName: 'Red',
        centerColorKey: 'red',
        badgeColor: '#dc2626',
        instruction: 'Rotate cube 90° to the LEFT. RED center faces camera, WHITE on top.'
    },
    {
        key: 'back',
        name: 'B',
        label: 'Back Face',
        centerColorName: 'Blue',
        centerColorKey: 'blue',
        badgeColor: '#2563eb',
        instruction: 'Rotate cube 90° to the LEFT again. BLUE center faces camera, WHITE on top.'
    },
    {
        key: 'left',
        name: 'L',
        label: 'Left Face',
        centerColorName: 'Orange',
        centerColorKey: 'orange',
        badgeColor: '#ea580c',
        instruction: 'Rotate cube 90° to the LEFT again. ORANGE center faces camera, WHITE on top.'
    },
    {
        key: 'up',
        name: 'U',
        label: 'Top Face',
        centerColorName: 'White',
        centerColorKey: 'white',
        badgeColor: '#ffffff',
        instruction: 'From Front position, tilt cube DOWN 90°. WHITE center faces camera, BLUE on top.'
    },
    {
        key: 'down',
        name: 'D',
        label: 'Bottom Face',
        centerColorName: 'Yellow',
        centerColorKey: 'yellow',
        badgeColor: '#facc15',
        instruction: 'From Front position, tilt cube UP 90°. YELLOW center faces camera, GREEN on top.'
    }
];

const PALETTE = ['white', 'yellow', 'red', 'orange', 'blue', 'green'];

export function CameraScanner({ onComplete, onClose }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [validationError, setValidationError] = useState(null);
    const [viewMode, setViewMode] = useState('camera'); // 'camera' or 'net'
    const [selectedBrushColor, setSelectedBrushColor] = useState('white');

    // Scanned data for all 6 faces: { [faceKey]: [[c, c, c], [c, c, c], [c, c, c]] }
    const [scannedFaces, setScannedFaces] = useState({
        front: null,
        right: null,
        back: null,
        left: null,
        up: null,
        down: null
    });

    const [annotatedImages, setAnnotatedImages] = useState({});
    const [perspectiveDetected, setPerspectiveDetected] = useState({});
    const [showOverlay, setShowOverlay] = useState(true);

    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const fileInputRef = useRef(null);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    const startCamera = async () => {
        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setCameraActive(true);
                setCameraError(null);
            }
        } catch (err) {
            console.error('Camera access error:', err);
            setCameraError('Camera access failed. Please enable camera permission or switch to Manual Net.');
            setCameraActive(false);
        }
    };

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

    // Capture frame from video with precise central crop matching guide
    const handleCaptureFace = async () => {
        if (!videoRef.current || loading) return;
        setLoading(true);
        setValidationError(null);

        try {
            const video = videoRef.current;
            const vW = video.videoWidth || 640;
            const vH = video.videoHeight || 480;

            // Crop the centered square corresponding to the guide overlay (about 65% of min dimension)
            const minDim = Math.min(vW, vH);
            const cropSize = Math.round(minDim * 0.65);
            const startX = Math.round((vW - cropSize) / 2);
            const startY = Math.round((vH - cropSize) / 2);

            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 400;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, startX, startY, cropSize, cropSize, 0, 0, 400, 400);

            const base64Image = canvas.toDataURL('image/jpeg', 0.92);
            const faceInfo = SCAN_FACES[currentStep];

            const result = await scanFace(base64Image, faceInfo.key);

            // Anchor center sticker to expected face center for standard Rubik's cube accuracy
            const detectedGrid = result.grid;
            if (detectedGrid && detectedGrid[1] && detectedGrid[1][1]) {
                detectedGrid[1][1] = faceInfo.centerColorKey;
            }

            // Save detected face grid & annotated preview
            setScannedFaces(prev => ({
                ...prev,
                [faceInfo.key]: detectedGrid
            }));
            setAnnotatedImages(prev => ({
                ...prev,
                [faceInfo.key]: result.annotated_image
            }));
            setPerspectiveDetected(prev => ({
                ...prev,
                [faceInfo.key]: result.perspective_detected
            }));

            // Advance to next step if not last
            if (currentStep < 5) {
                setCurrentStep(prev => prev + 1);
            }
        } catch (err) {
            setValidationError(`Scanning failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // File Upload Handler
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        setValidationError(null);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const base64Image = event.target.result;
                const faceInfo = SCAN_FACES[currentStep];
                const result = await scanFace(base64Image, faceInfo.key);

                const detectedGrid = result.grid;
                if (detectedGrid && detectedGrid[1] && detectedGrid[1][1]) {
                    detectedGrid[1][1] = faceInfo.centerColorKey;
                }

                setScannedFaces(prev => ({
                    ...prev,
                    [faceInfo.key]: detectedGrid
                }));
                setAnnotatedImages(prev => ({
                    ...prev,
                    [faceInfo.key]: result.annotated_image
                }));
                setPerspectiveDetected(prev => ({
                    ...prev,
                    [faceInfo.key]: result.perspective_detected
                }));

                if (currentStep < 5) {
                    setCurrentStep(prev => prev + 1);
                }
            } catch (err) {
                setValidationError(`Failed to process uploaded image: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    // Sticker color modification (uses brush color or cycles to next color)
    const handleStickerClick = (faceKey, row, col) => {
        setScannedFaces(prev => {
            const currentGrid = prev[faceKey] || [
                ['white', 'white', 'white'],
                ['white', 'white', 'white'],
                ['white', 'white', 'white']
            ];
            const currentColor = currentGrid[row][col];
            
            // If brush color is different, use brush; otherwise cycle to next in palette
            let nextColor = selectedBrushColor;
            if (currentColor === selectedBrushColor) {
                const currentIdx = PALETTE.indexOf(currentColor);
                nextColor = PALETTE[(currentIdx + 1) % PALETTE.length];
            }

            const updated = currentGrid.map((rArr, rIdx) =>
                rArr.map((cVal, cIdx) => (rIdx === row && cIdx === col ? nextColor : cVal))
            );
            return { ...prev, [faceKey]: updated };
        });
    };

    // Populate all 6 faces with standard solved state
    const handleFillSolved = () => {
        setScannedFaces({
            up: Array(3).fill(null).map(() => Array(3).fill('white')),
            left: Array(3).fill(null).map(() => Array(3).fill('orange')),
            front: Array(3).fill(null).map(() => Array(3).fill('green')),
            right: Array(3).fill(null).map(() => Array(3).fill('red')),
            back: Array(3).fill(null).map(() => Array(3).fill('blue')),
            down: Array(3).fill(null).map(() => Array(3).fill('yellow'))
        });
        setValidationError(null);
    };

    // Count scanned stickers by color
    const colorCounts = React.useMemo(() => {
        const counts = { white: 0, yellow: 0, red: 0, orange: 0, blue: 0, green: 0 };
        Object.values(scannedFaces).forEach(grid => {
            if (!grid) return;
            grid.forEach(row => {
                row.forEach(color => {
                    if (counts[color] !== undefined) counts[color]++;
                });
            });
        });
        return counts;
    }, [scannedFaces]);

    const totalScannedFacesCount = Object.values(scannedFaces).filter(Boolean).length;
    const currentFaceInfo = SCAN_FACES[currentStep];
    const currentFaceGrid = scannedFaces[currentFaceInfo.key];

    // Validate and finalize
    const handleValidateAndProceed = async () => {
        setLoading(true);
        setValidationError(null);

        try {
            // Check all 6 faces exist
            const missing = SCAN_FACES.filter(f => !scannedFaces[f.key]);
            if (missing.length > 0) {
                setValidationError(`Please scan or color all 6 faces. Missing: ${missing.map(m => m.label).join(', ')}`);
                return;
            }

            const res = await validateCube(scannedFaces);
            if (!res.valid) {
                setValidationError(res.error || 'Cube validation failed. Please check color distribution.');
                return;
            }

            // Valid! Pass back scanned faces and Kociemba string
            if (onComplete) {
                onComplete(scannedFaces, res.kociemba_string);
            }
        } catch (err) {
            setValidationError(err.message || 'Validation error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-4 sm:p-5 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                        <Camera className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-white tracking-wide">
                            Cube Scanner & Color Setup
                        </h2>
                        <p className="text-xs text-slate-400">
                            Scan via camera or adjust sticker colors manually
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* View mode toggle */}
                    <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
                        <button
                            onClick={() => setViewMode('camera')}
                            className={`py-1 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                viewMode === 'camera'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Camera className="w-3.5 h-3.5" />
                            Camera
                        </button>
                        <button
                            onClick={() => setViewMode('net')}
                            className={`py-1 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                viewMode === 'net'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            6-Face Net
                        </button>
                    </div>

                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                        {totalScannedFacesCount}/6 Scanned
                    </span>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>

            {/* Stepper Tabs */}
            <div className="grid grid-cols-6 gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
                {SCAN_FACES.map((face, idx) => {
                    const isDone = Boolean(scannedFaces[face.key]);
                    const isActive = currentStep === idx;
                    return (
                        <button
                            key={face.key}
                            onClick={() => setCurrentStep(idx)}
                            className={`flex flex-col items-center py-2 px-1 rounded-lg transition-all text-center ${
                                isActive
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : isDone
                                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/40'
                                    : 'text-slate-400 hover:bg-slate-800/60'
                            }`}
                        >
                            <div className="flex items-center gap-1 text-[11px] font-bold">
                                <span>{idx + 1}.</span>
                                <span>{face.name}</span>
                            </div>
                            <div
                                className="w-2.5 h-2.5 rounded-full mt-1 border border-black/40"
                                style={{ backgroundColor: face.badgeColor }}
                            />
                        </button>
                    );
                })}
            </div>

            {/* Active Color Palette Bar */}
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-blue-400" />
                        Paint Brush:
                    </span>
                    <div className="flex items-center gap-1.5">
                        {PALETTE.map(colorName => (
                            <button
                                key={colorName}
                                onClick={() => setSelectedBrushColor(colorName)}
                                className={`w-7 h-7 rounded-lg border-2 transition-all flex items-center justify-center active:scale-95 shadow-sm ${
                                    selectedBrushColor === colorName
                                        ? 'border-blue-400 scale-110 shadow-blue-500/30'
                                        : 'border-slate-700 hover:scale-105'
                                }`}
                                style={{ backgroundColor: COLORS[colorName] }}
                                title={`Select ${colorName}`}
                            >
                                {selectedBrushColor === colorName && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-black/60" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleFillSolved}
                        className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1 active:scale-95"
                    >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Preset Solved
                    </button>
                    <button
                        onClick={() => setScannedFaces({
                            front: null, right: null, back: null, left: null, up: null, down: null
                        })}
                        className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1 active:scale-95"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Clear All
                    </button>
                </div>
            </div>

            {/* View Mode 1: Camera Scanner Mode */}
            {viewMode === 'camera' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Left: Video Preview with 3x3 Overlay */}
                    <div className="lg:col-span-7 flex flex-col gap-3">
                        <div className="relative aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                            {cameraError ? (
                                <div className="text-center p-6 flex flex-col items-center gap-3">
                                    <AlertCircle className="w-10 h-10 text-amber-500" />
                                    <p className="text-xs text-slate-300 max-w-xs">{cameraError}</p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={startCamera}
                                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            Retry Camera
                                        </button>
                                        <button
                                            onClick={() => setViewMode('net')}
                                            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                                        >
                                            Use Manual Net
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <video
                                        ref={videoRef}
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover"
                                    />
                                    <ScanGuide
                                        currentFaceInfo={currentFaceInfo}
                                        faceIndex={currentStep}
                                        showOverlay={showOverlay}
                                        onToggleOverlay={() => setShowOverlay(prev => !prev)}
                                    />
                                </>
                            )}
                        </div>

                        {/* Camera Actions */}
                        <div className="flex items-center justify-between gap-3">
                            <button
                                id="capture-face-btn"
                                onClick={handleCaptureFace}
                                disabled={loading || !cameraActive}
                                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Analyzing Face & Colors...
                                    </>
                                ) : (
                                    <>
                                        <Camera className="w-4 h-4" />
                                        Capture Face {currentStep + 1} ({currentFaceInfo.name})
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                title="Upload photo from phone or computer"
                                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                Upload Photo
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* Right: Detected 3x3 Preview & 1-Click Sticker Modification */}
                    <div className="lg:col-span-5 flex flex-col justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                        <div>
                            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
                                <div>
                                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                                        Detected: {currentFaceInfo.label}
                                    </h3>
                                    <p className="text-[11px] text-slate-400">
                                        Click any square to paint with active color: <span className="capitalize font-semibold text-slate-200">{selectedBrushColor}</span>
                                    </p>
                                </div>
                                {currentFaceGrid && (
                                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                                        <CheckCircle2 className="w-3 h-3" /> Ready
                                    </span>
                                )}
                            </div>

                            {/* 3x3 Grid Display */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-52 h-52 grid grid-cols-3 grid-rows-3 gap-2 p-2.5 bg-slate-900 rounded-2xl border-2 border-slate-700 shadow-inner">
                                    {Array.from({ length: 9 }).map((_, idx) => {
                                        const r = Math.floor(idx / 3);
                                        const c = idx % 3;
                                        const stickerColor = currentFaceGrid ? currentFaceGrid[r][c] : currentFaceInfo.centerColorKey;
                                        const hexColor = COLORS[stickerColor] || COLORS.white;
                                        const isCenter = idx === 4;

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleStickerClick(currentFaceInfo.key, r, c)}
                                                className="relative rounded-xl flex items-center justify-center transition-all hover:scale-105 shadow-md active:scale-95 border-2 border-black/40 hover:border-blue-400 cursor-pointer"
                                                style={{ backgroundColor: hexColor }}
                                                title={`Row ${r + 1}, Col ${c + 1}: ${stickerColor} (Click to paint ${selectedBrushColor})`}
                                            >
                                                {isCenter ? (
                                                    <div className="w-3 h-3 rounded-full bg-black/40 border border-white/80" />
                                                ) : (
                                                    <span className="text-[10px] font-bold text-black/30 font-mono select-none">
                                                        {stickerColor[0].toUpperCase()}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {annotatedImages[currentFaceInfo.key] && (
                                    <div className="flex items-center gap-3 p-2 bg-slate-900/80 rounded-xl border border-slate-800 w-full justify-center">
                                        <img
                                            src={annotatedImages[currentFaceInfo.key]}
                                            alt="Crop Preview"
                                            className="w-14 h-14 rounded-lg border border-slate-700 object-cover shadow-md"
                                        />
                                        <div className="text-[11px] text-slate-400 leading-tight">
                                            <span className="font-semibold text-slate-200">OpenCV Face Crop</span>
                                            <p className="text-[10px] text-emerald-400 font-medium mt-0.5">
                                                Analyzed 9 stickers
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom distribution & solve */}
                        <div className="border-t border-slate-800 pt-3 flex flex-col gap-3">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                                <span>Sticker Counts (9 each):</span>
                                <span>{Object.values(colorCounts).reduce((a, b) => a + b, 0)}/54 Total</span>
                            </div>
                            <div className="grid grid-cols-6 gap-1.5">
                                {PALETTE.map(cName => {
                                    const count = colorCounts[cName];
                                    const isDone = count === 9;
                                    return (
                                        <div
                                            key={cName}
                                            className={`flex flex-col items-center py-1 rounded-lg border text-[11px] ${
                                                isDone
                                                    ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                                                    : 'bg-slate-900 border-slate-800 text-slate-400'
                                            }`}
                                        >
                                            <div
                                                className="w-2.5 h-2.5 rounded-full mb-0.5 border border-black/30"
                                                style={{ backgroundColor: COLORS[cName] }}
                                            />
                                            <span className="font-bold">{count}/9</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {validationError && (
                                <div className="p-2.5 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                    <span>{validationError}</span>
                                </div>
                            )}

                            <button
                                id="verify-cube-btn"
                                onClick={handleValidateAndProceed}
                                disabled={loading || totalScannedFacesCount < 6}
                                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
                            >
                                {loading ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                VERIFY CUBE & SOLVE ({totalScannedFacesCount}/6)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Mode 2: Unfolded 6-Face Cube Net */}
            {viewMode === 'net' && (
                <div className="flex flex-col gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <div>
                            <h3 className="text-sm font-bold text-white">
                                Unfolded 6-Face Net
                            </h3>
                            <p className="text-xs text-slate-400">
                                Click any sticker to paint with the active brush ({selectedBrushColor})
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-300">
                                Total: {Object.values(colorCounts).reduce((a, b) => a + b, 0)}/54
                            </span>
                        </div>
                    </div>

                    {/* Unfolded Net Grid: 4 columns x 3 rows */}
                    {/* Row 0: col 1 has UP */}
                    {/* Row 1: col 0 has LEFT, col 1 has FRONT, col 2 has RIGHT, col 3 has BACK */}
                    {/* Row 2: col 1 has DOWN */}
                    <div className="flex flex-col items-center gap-2 py-2 overflow-x-auto">
                        {/* Top: UP Face */}
                        <div className="flex justify-center w-full">
                            <FaceGridMini
                                faceKey="up"
                                label="U (Top - White)"
                                grid={scannedFaces.up}
                                onStickerClick={handleStickerClick}
                                defaultColor="white"
                                activeColor={selectedBrushColor}
                            />
                        </div>

                        {/* Middle Row: Left, Front, Right, Back */}
                        <div className="flex items-center justify-center gap-2">
                            <FaceGridMini
                                faceKey="left"
                                label="L (Left - Orange)"
                                grid={scannedFaces.left}
                                onStickerClick={handleStickerClick}
                                defaultColor="orange"
                                activeColor={selectedBrushColor}
                            />
                            <FaceGridMini
                                faceKey="front"
                                label="F (Front - Green)"
                                grid={scannedFaces.front}
                                onStickerClick={handleStickerClick}
                                defaultColor="green"
                                activeColor={selectedBrushColor}
                            />
                            <FaceGridMini
                                faceKey="right"
                                label="R (Right - Red)"
                                grid={scannedFaces.right}
                                onStickerClick={handleStickerClick}
                                defaultColor="red"
                                activeColor={selectedBrushColor}
                            />
                            <FaceGridMini
                                faceKey="back"
                                label="B (Back - Blue)"
                                grid={scannedFaces.back}
                                onStickerClick={handleStickerClick}
                                defaultColor="blue"
                                activeColor={selectedBrushColor}
                            />
                        </div>

                        {/* Bottom: DOWN Face */}
                        <div className="flex justify-center w-full">
                            <FaceGridMini
                                faceKey="down"
                                label="D (Bottom - Yellow)"
                                grid={scannedFaces.down}
                                onStickerClick={handleStickerClick}
                                defaultColor="yellow"
                                activeColor={selectedBrushColor}
                            />
                        </div>
                    </div>

                    {/* Footer validation */}
                    <div className="border-t border-slate-800 pt-3 flex flex-col gap-3">
                        <div className="grid grid-cols-6 gap-2">
                            {PALETTE.map(cName => {
                                const count = colorCounts[cName];
                                const isDone = count === 9;
                                return (
                                    <div
                                        key={cName}
                                        className={`flex flex-col items-center py-1.5 rounded-lg border text-xs ${
                                            isDone
                                                ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                                                : 'bg-slate-900 border-slate-800 text-slate-400'
                                        }`}
                                    >
                                        <div
                                            className="w-3 h-3 rounded-full mb-1 border border-black/30"
                                            style={{ backgroundColor: COLORS[cName] }}
                                        />
                                        <span className="font-bold">{count}/9</span>
                                    </div>
                                );
                            })}
                        </div>

                        {validationError && (
                            <div className="p-2.5 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                <span>{validationError}</span>
                            </div>
                        )}

                        <button
                            onClick={handleValidateAndProceed}
                            disabled={loading || totalScannedFacesCount < 6}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
                        >
                            {loading ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            VERIFY CUBE & SOLVE ({totalScannedFacesCount}/6)
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Mini 3x3 face component for the net view
function FaceGridMini({ faceKey, label, grid, onStickerClick, defaultColor }) {
    return (
        <div className="flex flex-col items-center gap-1 bg-slate-900 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-300">{label}</span>
            <div className="w-28 h-28 grid grid-cols-3 grid-rows-3 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-700">
                {Array.from({ length: 9 }).map((_, idx) => {
                    const r = Math.floor(idx / 3);
                    const c = idx % 3;
                    const color = grid ? grid[r][c] : defaultColor;
                    const hexColor = COLORS[color] || COLORS.white;
                    const isCenter = idx === 4;

                    return (
                        <button
                            key={idx}
                            onClick={() => onStickerClick(faceKey, r, c)}
                            className="rounded-md border border-black/30 hover:scale-105 transition-all flex items-center justify-center shadow-sm"
                            style={{ backgroundColor: hexColor }}
                        >
                            {isCenter && (
                                <div className="w-2 h-2 rounded-full bg-black/40 border border-white/60" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
