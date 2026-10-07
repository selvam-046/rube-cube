import React from 'react';

export function MoveArrow3D({ moveConfig, visible }) {
    if (!visible || !moveConfig) return null;

    const { axis, layer, angle } = moveConfig;

    // Determine center position of arrow outside the active face
    const offset = 2.0;
    const arrowPos =
        axis === 'x' ? [layer * offset, 0, 0] :
        axis === 'y' ? [0, layer * offset, 0] :
        axis === 'z' ? [0, 0, layer * offset] :
        [0, 0, 0];

    // Orientation so the ring / arc aligns with the face normal
    const rotation =
        axis === 'x' ? [0, layer > 0 ? Math.PI / 2 : -Math.PI / 2, 0] :
        axis === 'y' ? [layer > 0 ? -Math.PI / 2 : Math.PI / 2, 0, 0] :
        [0, layer > 0 ? 0 : Math.PI, 0]; // z

    // Torus arc angle
    const arcAngle = Math.PI * 1.25;
    const isClockwise = angle < 0;

    return (
        <group position={arrowPos} rotation={rotation}>
            {/* Curved arrow arc */}
            <mesh rotation={[0, 0, isClockwise ? 0 : Math.PI]}>
                <torusGeometry args={[1.1, 0.06, 16, 48, arcAngle]} />
                <meshStandardMaterial
                    color="#60a5fa"
                    emissive="#3b82f6"
                    emissiveIntensity={0.8}
                    roughness={0.2}
                />
            </mesh>

            {/* Arrowhead cone */}
            <mesh
                position={[
                    1.1 * Math.cos(arcAngle),
                    1.1 * Math.sin(arcAngle),
                    0
                ]}
                rotation={[0, 0, arcAngle + (isClockwise ? Math.PI / 2 : -Math.PI / 2)]}
            >
                <coneGeometry args={[0.18, 0.35, 16]} />
                <meshStandardMaterial
                    color="#60a5fa"
                    emissive="#3b82f6"
                    emissiveIntensity={0.9}
                    roughness={0.2}
                />
            </mesh>
        </group>
    );
}
