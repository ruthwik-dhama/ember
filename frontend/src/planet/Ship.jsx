// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// A small ship that cruises the planet on autopilot. Decoration only: it doesn't take input.
import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { R } from "./Planet.jsx";

const HOVER = R + 0.45;
const SPEED = 0.12;

export default function Ship() {
  const ref = useRef();
  const s = useRef({ p: new THREE.Vector3(0, 0.2, 1).normalize(), f: new THREE.Vector3(1, 0, 0) });

  useFrame((_, dt) => {
    const o = s.current, d = Math.min(dt, 0.05);
    const axis = new THREE.Vector3().crossVectors(o.p, o.f).normalize(); // rotating p about p x f moves it toward f
    const q = new THREE.Quaternion().setFromAxisAngle(axis, SPEED * d);
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
        <meshStandardMaterial color="#f4f1ea" flatShading emissive="#3a3d44" />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[0.2, 0.012, 0.07]} />
        <meshStandardMaterial color="#17806d" flatShading emissive="#0b3f35" />
      </mesh>
      <mesh position={[0, 0, 0.12]}>
        <sphereGeometry args={[0.022, 8, 6]} />
        <meshBasicMaterial color="#9ff0dc" />
      </mesh>
    </group>
  );
}
