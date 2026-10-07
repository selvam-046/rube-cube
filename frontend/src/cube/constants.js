export const CUBIE_SIZE = 0.95;
export const CUBIE_BEVEL = 0.04;
export const CUBIE_GAP = 1.0;

// Standard Rubik's Cube Sticker Colors
export const COLORS = {
    white: '#f8fafc',
    yellow: '#facc15',
    red: '#dc2626',
    orange: '#ea580c',
    blue: '#2563eb',
    green: '#16a34a',
    black: '#121214' // internal plastic base
};

export const COLOR_LABELS = {
    white: 'White (Top / U)',
    yellow: 'Yellow (Bottom / D)',
    red: 'Red (Right / R)',
    orange: 'Orange (Left / L)',
    blue: 'Blue (Back / B)',
    green: 'Green (Front / F)'
};

// Face ordering for Three.js BoxGeometry materials:
// [0] +X: Right (Red)
// [1] -X: Left (Orange)
// [2] +Y: Top (White)
// [3] -Y: Bottom (Yellow)
// [4] +Z: Front (Green)
// [5] -Z: Back (Blue)
export const FACE_DIRECTIONS = [
    { name: 'R', axis: 'x', sign: 1, defaultColor: 'red' },
    { name: 'L', axis: 'x', sign: -1, defaultColor: 'orange' },
    { name: 'U', axis: 'y', sign: 1, defaultColor: 'white' },
    { name: 'D', axis: 'y', sign: -1, defaultColor: 'yellow' },
    { name: 'F', axis: 'z', sign: 1, defaultColor: 'green' },
    { name: 'B', axis: 'z', sign: -1, defaultColor: 'blue' },
];

export const MOVE_CONFIGS = {
    'U':  { axis: 'y', layer: 1, angle: -Math.PI / 2, desc: 'Top layer clockwise 90°', face: 'TOP FACE', arrow: '↻' },
    "U'": { axis: 'y', layer: 1, angle: Math.PI / 2, desc: 'Top layer anticlockwise 90°', face: 'TOP FACE', arrow: '↺' },
    'U2': { axis: 'y', layer: 1, angle: -Math.PI, desc: 'Top layer 180°', face: 'TOP FACE', arrow: '⟳' },

    'D':  { axis: 'y', layer: -1, angle: Math.PI / 2, desc: 'Bottom layer clockwise 90°', face: 'BOTTOM FACE', arrow: '↻' },
    "D'": { axis: 'y', layer: -1, angle: -Math.PI / 2, desc: 'Bottom layer anticlockwise 90°', face: 'BOTTOM FACE', arrow: '↺' },
    'D2': { axis: 'y', layer: -1, angle: Math.PI, desc: 'Bottom layer 180°', face: 'BOTTOM FACE', arrow: '⟳' },

    'R':  { axis: 'x', layer: 1, angle: -Math.PI / 2, desc: 'Right layer clockwise 90°', face: 'RIGHT FACE', arrow: '↻' },
    "R'": { axis: 'x', layer: 1, angle: Math.PI / 2, desc: 'Right layer anticlockwise 90°', face: 'RIGHT FACE', arrow: '↺' },
    'R2': { axis: 'x', layer: 1, angle: -Math.PI, desc: 'Right layer 180°', face: 'RIGHT FACE', arrow: '⟳' },

    'L':  { axis: 'x', layer: -1, angle: Math.PI / 2, desc: 'Left layer clockwise 90°', face: 'LEFT FACE', arrow: '↻' },
    "L'": { axis: 'x', layer: -1, angle: -Math.PI / 2, desc: 'Left layer anticlockwise 90°', face: 'LEFT FACE', arrow: '↺' },
    'L2': { axis: 'x', layer: -1, angle: Math.PI, desc: 'Left layer 180°', face: 'LEFT FACE', arrow: '⟳' },

    'F':  { axis: 'z', layer: 1, angle: -Math.PI / 2, desc: 'Front face clockwise 90°', face: 'FRONT FACE', arrow: '↻' },
    "F'": { axis: 'z', layer: 1, angle: Math.PI / 2, desc: 'Front face anticlockwise 90°', face: 'FRONT FACE', arrow: '↺' },
    'F2': { axis: 'z', layer: 1, angle: -Math.PI, desc: 'Front face 180°', face: 'FRONT FACE', arrow: '⟳' },

    'B':  { axis: 'z', layer: -1, angle: Math.PI / 2, desc: 'Back face clockwise 90°', face: 'BACK FACE', arrow: '↻' },
    "B'": { axis: 'z', layer: -1, angle: -Math.PI / 2, desc: 'Back face anticlockwise 90°', face: 'BACK FACE', arrow: '↺' },
    'B2': { axis: 'z', layer: -1, angle: Math.PI, desc: 'Back face 180°', face: 'BACK FACE', arrow: '⟳' },

    // Middle slices (Equator row & Middle vertical column)
    'E_LEFT':  { axis: 'y', layer: 0, angle: -Math.PI / 2, desc: 'Middle row left', face: 'MIDDLE ROW', arrow: '←' },
    'E_RIGHT': { axis: 'y', layer: 0, angle: Math.PI / 2, desc: 'Middle row right', face: 'MIDDLE ROW', arrow: '→' },
    'E2':      { axis: 'y', layer: 0, angle: -Math.PI, desc: 'Middle row 180°', face: 'MIDDLE ROW', arrow: '⟳' },

    'M_UP':    { axis: 'x', layer: 0, angle: -Math.PI / 2, desc: 'Middle column up', face: 'MIDDLE COL', arrow: '↑' },
    'M_DOWN':  { axis: 'x', layer: 0, angle: Math.PI / 2, desc: 'Middle column down', face: 'MIDDLE COL', arrow: '↓' },
    'M2':      { axis: 'x', layer: 0, angle: -Math.PI, desc: 'Middle column 180°', face: 'MIDDLE COL', arrow: '⟳' },
};

