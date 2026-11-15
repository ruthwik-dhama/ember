// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// 3D habitat, smoke playback, fire placement. Owner: Kartavya. Backend z is up; three.js y is up.
import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ROOM_M } from "./room.js";

export default function HabitatView() {
  const [L, W, H] = ROOM_M;
  return (
    <div style={{ height: 380, border: "1px solid var(--line)", borderRadius: 8 }}>
      <Canvas camera={{ position: [L, H * 2, W * 2] }}>
        <ambientLight intensity={0.8} />
        <mesh position={[0, H / 2, 0]}>
          <boxGeometry args={[L, H, W]} />
          <meshBasicMaterial color="#ff7a3d" wireframe />
        </mesh>
        <gridHelper args={[Math.max(L, W), 12, "#444", "#2a2e35"]} />
        <OrbitControls />
      </Canvas>
    </div>
  );
}
