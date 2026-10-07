import React, { useMemo } from 'react';
import { COLORS, CUBIE_SIZE } from '../cube/constants';

// Sticker dimension and offset from cubie face
const STICKER_SIZE = 0.84;
const STICKER_OFFSET = CUBIE_SIZE / 2 + 0.002;
const BASE_COLOR = '#111215';

export const Cubie = React.memo(function Cubie({
    position,
    quaternion,
    colors,
    isHighlighted = false
}) {
    // 6 sticker planes for [+X, -X, +Y, -Y, +Z, -Z]
    const stickers = useMemo(() => {
        const planes = [];

        // +X: Right
        if (colors[0] !== 'black') {
            planes.push({
                color: COLORS[colors[0]] || COLORS.red,
                position: [STICKER_OFFSET, 0, 0],
                rotation: [0, Math.PI / 2, 0]
            });
        }
        // -X: Left
        if (colors[1] !== 'black') {
            planes.push({
                color: COLORS[colors[1]] || COLORS.orange,
                position: [-STICKER_OFFSET, 0, 0],
                rotation: [0, -Math.PI / 2, 0]
            });
        }
        // +Y: Top
        if (colors[2] !== 'black') {
            planes.push({
                color: COLORS[colors[2]] || COLORS.white,
                position: [0, STICKER_OFFSET, 0],
                rotation: [-Math.PI / 2, 0, 0]
            });
        }
        // -Y: Bottom
        if (colors[3] !== 'black') {
            planes.push({
                color: COLORS[colors[3]] || COLORS.yellow,
                position: [0, -STICKER_OFFSET, 0],
                rotation: [Math.PI / 2, 0, 0]
            });
        }
        // +Z: Front
        if (colors[4] !== 'black') {
            planes.push({
                color: COLORS[colors[4]] || COLORS.green,
                position: [0, 0, STICKER_OFFSET],
                rotation: [0, 0, 0]
            });
        }
        // -Z: Back
        if (colors[5] !== 'black') {
            planes.push({
                color: COLORS[colors[5]] || COLORS.blue,
                position: [0, 0, -STICKER_OFFSET],
                rotation: [0, Math.PI, 0]
            });
        }
        return planes;
    }, [colors]);

    return (
        <group position={position} quaternion={quaternion}>
            {/* Black plastic cubie base with slight bevel */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE]} />
                <meshStandardMaterial
                    color={BASE_COLOR}
                    roughness={0.4}
                    metalness={0.1}
                    emissive={isHighlighted ? '#3b82f6' : '#000000'}
                    emissiveIntensity={isHighlighted ? 0.35 : 0}
                />
            </mesh>

            {/* Exposed colored stickers with glossy vinyl look */}
            {stickers.map((sticker, idx) => (
                <mesh
                    key={idx}
                    position={sticker.position}
                    rotation={sticker.rotation}
                >
                    <planeGeometry args={[STICKER_SIZE, STICKER_SIZE]} />
                    <meshStandardMaterial
                        color={sticker.color}
                        roughness={0.15}
                        metalness={0.05}
                        polygonOffset
                        polygonOffsetFactor={-1}
                        emissive={isHighlighted ? sticker.color : '#000000'}
                        emissiveIntensity={isHighlighted ? 0.2 : 0}
                    />
                </mesh>
            ))}
        </group>
    );
});
