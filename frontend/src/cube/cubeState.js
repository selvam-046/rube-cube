import * as THREE from 'three';

export function createInitialCubies() {
    const cubies = [];
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                // Determine sticker colors based on position
                // Order: [+X (Right), -X (Left), +Y (Top), -Y (Bottom), +Z (Front), -Z (Back)]
                const colors = [
                    x === 1 ? 'red' : 'black',
                    x === -1 ? 'orange' : 'black',
                    y === 1 ? 'white' : 'black',
                    y === -1 ? 'yellow' : 'black',
                    z === 1 ? 'green' : 'black',
                    z === -1 ? 'blue' : 'black'
                ];

                cubies.push({
                    id: `${x}_${y}_${z}`,
                    position: [x, y, z],
                    initialPosition: [x, y, z],
                    quaternion: new THREE.Quaternion().identity(),
                    matrix: new THREE.Matrix4().identity(),
                    colors
                });
            }
        }
    }
    return cubies;
}

export function rotateCubiePosition(pos, axis, angle) {
    const v = new THREE.Vector3(...pos);
    const rotAxis = new THREE.Vector3(
        axis === 'x' ? 1 : 0,
        axis === 'y' ? 1 : 0,
        axis === 'z' ? 1 : 0
    );
    v.applyAxisAngle(rotAxis, angle);
    return [Math.round(v.x), Math.round(v.y), Math.round(v.z)];
}

export function rotateCubieQuaternion(quat, axis, angle) {
    const rotAxis = new THREE.Vector3(
        axis === 'x' ? 1 : 0,
        axis === 'y' ? 1 : 0,
        axis === 'z' ? 1 : 0
    );
    const deltaQ = new THREE.Quaternion().setFromAxisAngle(rotAxis, angle);
    const newQ = deltaQ.clone().multiply(quat);
    return newQ;
}

/**
 * Applies a logical layer rotation to the 27 cubies array.
 * Returns a new array of updated cubies.
 */
export function applyLogicalMove(cubies, axis, layer, angle) {
    return cubies.map((cubie) => {
        const [x, y, z] = cubie.position;
        const coord = axis === 'x' ? x : axis === 'y' ? y : z;

        if (coord === layer) {
            const nextPos = rotateCubiePosition(cubie.position, axis, angle);
            const nextQuat = rotateCubieQuaternion(cubie.quaternion, axis, angle);
            return {
                ...cubie,
                position: nextPos,
                quaternion: nextQuat
            };
        }
        return cubie;
    });
}

/**
 * Extracts 6 faces from 27 cubies by projecting sticker normals.
 */
export function extractFaceColors(cubies) {
    // Standard normal directions
    const directions = {
        U: new THREE.Vector3(0, 1, 0),
        D: new THREE.Vector3(0, -1, 0),
        R: new THREE.Vector3(1, 0, 0),
        L: new THREE.Vector3(-1, 0, 0),
        F: new THREE.Vector3(0, 0, 1),
        B: new THREE.Vector3(0, 0, -1)
    };

    const initialFaceNormals = [
        new THREE.Vector3(1, 0, 0),  // 0: +X
        new THREE.Vector3(-1, 0, 0), // 1: -X
        new THREE.Vector3(0, 1, 0),  // 2: +Y
        new THREE.Vector3(0, -1, 0), // 3: -Y
        new THREE.Vector3(0, 0, 1),  // 4: +Z
        new THREE.Vector3(0, 0, -1)  // 5: -Z
    ];

    function getStickerColorAt(targetPos, normalKey) {
        const cubie = cubies.find(c =>
            c.position[0] === targetPos[0] &&
            c.position[1] === targetPos[1] &&
            c.position[2] === targetPos[2]
        );
        if (!cubie) return 'white';

        const targetNormal = directions[normalKey];

        // Find which initial face normal is now pointing along targetNormal
        for (let i = 0; i < 6; i++) {
            const currentNormal = initialFaceNormals[i].clone().applyQuaternion(cubie.quaternion);
            if (currentNormal.dot(targetNormal) > 0.8) {
                return cubie.colors[i];
            }
        }
        return 'white';
    }

    // Extract faces in 3x3 grids:
    // U (Top): y = 1; z goes -1 to 1 (back to front), x goes -1 to 1 (left to right)
    const U = [];
    for (let z = -1; z <= 1; z++) {
        const row = [];
        for (let x = -1; x <= 1; x++) {
            row.push(getStickerColorAt([x, 1, z], 'U'));
        }
        U.push(row);
    }

    // R (Right): x = 1; y goes 1 to -1 (top to bottom), z goes 1 to -1 (front to back)
    const R = [];
    for (let y = 1; y >= -1; y--) {
        const row = [];
        for (let z = 1; z >= -1; z--) {
            row.push(getStickerColorAt([1, y, z], 'R'));
        }
        R.push(row);
    }

    // F (Front): z = 1; y goes 1 to -1 (top to bottom), x goes -1 to 1 (left to right)
    const F = [];
    for (let y = 1; y >= -1; y--) {
        const row = [];
        for (let x = -1; x <= 1; x++) {
            row.push(getStickerColorAt([x, y, 1], 'F'));
        }
        F.push(row);
    }

    // D (Down): y = -1; z goes 1 to -1 (front to back), x goes -1 to 1 (left to right)
    const D = [];
    for (let z = 1; z >= -1; z--) {
        const row = [];
        for (let x = -1; x <= 1; x++) {
            row.push(getStickerColorAt([x, -1, z], 'D'));
        }
        D.push(row);
    }

    // L (Left): x = -1; y goes 1 to -1 (top to bottom), z goes -1 to 1 (back to front)
    const L = [];
    for (let y = 1; y >= -1; y--) {
        const row = [];
        for (let z = -1; z <= 1; z++) {
            row.push(getStickerColorAt([-1, y, z], 'L'));
        }
        L.push(row);
    }

    // B (Back): z = -1; y goes 1 to -1 (top to bottom), x goes 1 to -1 (right to left)
    const B = [];
    for (let y = 1; y >= -1; y--) {
        const row = [];
        for (let x = 1; x >= -1; x--) {
            row.push(getStickerColorAt([x, y, -1], 'B'));
        }
        B.push(row);
    }

    return { up: U, right: R, front: F, down: D, left: L, back: B };
}
