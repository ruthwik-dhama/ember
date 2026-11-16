// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// A small ship that cruises the planet on autopilot. W/S speed up/slow down, A/D steer (like the Landfall template).
import React, { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { R } from "./Planet.jsx";

const HOVER = R + 0.45;
const keys = new Set();
const typing = (t) => t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);

export default function Ship({ enabled }) {
  const ref = useRef();
  const s = useRef({ p: new THREE.Vector3(0, 0.2, 1).normalize(), f: new THREE.Vector3(1, 0, 0), speed: 0.12 });

  useEffect(() => {
    const down = (e) => { if (!typing(e.target)) keys.add(e.key.toLowerCase()); };
    const up = (e) => keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); keys.clear(); };
  }, []);

  useFrame((_, dt) => {
    const o = s.current, d = Math.min(dt, 0.05);
    if (enabled) {
      if (keys.has("a")) o.f.applyAxisAngle(o.p, 1.8 * d);
      if (keys.has("d")) o.f.applyAxisAngle(o.p, -1.8 * d);
      o.speed = THREE.MathUtils.clamp(o.speed + ((keys.has("w") ? 0.5 : 0) - (keys.has("s") ? 0.5 : 0)) * d, 0.05, 0.6);
    }
    const axis = new THREE.Vector3().crossVectors(o.p, o.f).normalize(); // rotating p about p x f moves it toward f
    const q = new THREE.Quaternion().setFromAxisAngle(axis, o.speed * d);
    o.p.applyQuaternion(q).normalize();
    o.f.applyQuaternion(q).sub(o.p.clone().multiplyScalar(o.f.dot(o.p))).normalize();
    const m = new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(o.f, o.p), o.p, o.f.clone().negate());
    ref.current.quaternion.setFromRotationMatrix(m);
    ref.current.position.copy(o.p).multiplyScalar(HOVER);
  });

  return (
    <group ref={ref}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.05, 0.2, 5]} />
        <meshStandardMaterial color="#e8e6e3" flatShading emissive="#334" />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[0.2, 0.012, 0.07]} />
        <meshStandardMaterial color="#ff7a3d" flatShading emissive="#552200" />
      </mesh>
      <mesh position={[0, 0, 0.12]}>
        <sphereGeometry args={[0.022, 8, 6]} />
        <meshBasicMaterial color="#ffb27a" />
      </mesh>
    </group>
  );
}
