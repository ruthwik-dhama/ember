// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// The habitat dome on the planet (click to zoom into the room) and the live agent markers inside it.
// Red = the fire and a red beacon; Blue = detectors that ping, a suppressant puff; Ghost Flame = violet glow.
import React, { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { DOME_DIR, DOME_POS } from "./Planet.jsx";
import { ROOM_M } from "../habitat/room.js";

const [L, W, H] = ROOM_M;
// Room metres -> dome-local coordinates (y is up from the pad).
const toDome = (x, y, z) => [(x / L - 0.5) * 0.36, 0.02 + (z / H) * 0.12, (y / W - 0.5) * 0.24];

function Ping({ position, color = "#17806d", delay = 0 }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = ((clock.elapsedTime + delay) % 1.8) / 1.8;
    ref.current.scale.setScalar(1 + t * 4);
    ref.current.material.opacity = 0.8 * (1 - t);
  });
  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.018, 0.024, 24]} />
      <meshBasicMaterial color={color} transparent depthWrite={false} />
    </mesh>
  );
}

function Pulse({ position, color, radius, speed = 4, base = 0.35 }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const s = 1 + 0.25 * Math.sin(clock.elapsedTime * speed);
    ref.current.scale.setScalar(s);
    ref.current.material.opacity = base + 0.15 * Math.sin(clock.elapsedTime * speed);
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[radius, 16, 12]} />
      <meshBasicMaterial color={color} transparent depthWrite={false} />
    </mesh>
  );
}

function Puff({ position, color }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = (clock.elapsedTime % 2.4) / 2.4;
    ref.current.scale.setScalar(0.3 + t * 2.2);
    ref.current.material.opacity = 0.35 * (1 - t);
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.07, 16, 12]} />
      <meshBasicMaterial color={color} transparent depthWrite={false} />
    </mesh>
  );
}

export default function Habitat3D({ onEnter, interactive, agents, onHover }) {
  const [hover, setHover] = useState(false);
  const quat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), DOME_DIR), []);
  const red = agents?.red?.scenario;
  const fire = red ? toDome(red.x, red.y, red.z) : null;
  const dets = agents?.blue?.detectors || [];
  const puff = agents?.blue?.done && agents.blue.suppressant && agents.blue.suppressant !== "none";
  const ghost = agents?.ghost?.false_all_clear;

  return (
    <group position={DOME_POS} quaternion={quat} scale={1.6}>
      <mesh position={[0, 0.012, 0]}>
        <cylinderGeometry args={[0.27, 0.3, 0.025, 24]} />
        <meshStandardMaterial color="#d8d0c0" roughness={0.9} flatShading />
      </mesh>
      <mesh
        onClick={(e) => { if (!interactive || e.delta > 4) return; e.stopPropagation(); onEnter(); }}
        onPointerOver={(e) => { if (!interactive) return; e.stopPropagation(); setHover(true); onHover?.(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHover(false); onHover?.(false); document.body.style.cursor = ""; }}
      >
        <sphereGeometry args={[0.24, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={hover ? "#ffffff" : "#f1f8f6"} emissive={hover ? "#17806d" : "#0f6b5a"}
          emissiveIntensity={hover ? 0.55 : 0.25} transparent opacity={0.66} roughness={0.2} flatShading />
      </mesh>

      {fire && (
        <>
          <Pulse position={fire} color="#ff3b1f" radius={0.022} />
          <mesh position={[fire[0], fire[1] + 0.35, fire[2]]}>
            <cylinderGeometry args={[0.012, 0.012, 0.7, 6]} />
            <meshBasicMaterial color="#ff5a3a" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
          <pointLight position={fire} color="#ff5a3a" intensity={0.8} distance={0.8} />
        </>
      )}
      {dets.map((d, i) => {
        const p = toDome(d.x, d.y, d.z);
        return (
          <group key={d.id || i}>
            <mesh position={p}><boxGeometry args={[0.022, 0.012, 0.022]} /><meshBasicMaterial color="#17806d" /></mesh>
            <Ping position={[p[0], 0.03, p[2]]} delay={i * 0.6} />
          </group>
        );
      })}
      {puff && fire && <Puff position={fire} color={agents.blue.suppressant === "he" ? "#e0a526" : "#6fc3e8"} />}
      {ghost && fire && <Pulse position={fire} color="#b388ff" radius={0.07} speed={2.5} base={0.3} />}

      {interactive && !ghost && (
        <Html position={[0, 0.34, 0]} center distanceFactor={7} zIndexRange={[4, 0]} style={{ pointerEvents: "none" }}>
          <div className="scene-label"><b>01</b>Habitat <span>{hover ? "click to enter" : ""}</span></div>
        </Html>
      )}
      {ghost && (
        <Html position={[0, 0.5, 0]} center distanceFactor={7} zIndexRange={[4, 0]} style={{ pointerEvents: "none" }}>
          <div className="scene-label scene-label--ghost">Ghost flame: false all-clear</div>
        </Html>
      )}
    </group>
  );
}
