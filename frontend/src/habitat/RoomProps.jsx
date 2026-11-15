// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Low-poly room dressing: inlet and return vents, airflow arrows, airlock dust-entry marker. Owner: Kartavya.
// Airflow runs +x from the inlet wall (x=0, clean air) to the return wall (x=L), as in sim/engine.py.
import React from "react";
import { Html } from "@react-three/drei";
import { ROOM_M, AIRLOCK_M } from "./room.js";

const [L, W, H] = ROOM_M;
const toThree = (x, y, z) => [x - L / 2, z, y - W / 2];

const label = { fontSize: 11, color: "#ddd", background: "#0008", padding: "1px 5px", borderRadius: 3, whiteSpace: "nowrap" };

function Vent({ x, name, color }) {
  return (
    <group position={toThree(x, W / 2, H / 2)}>
      <mesh>
        <boxGeometry args={[0.06, 1.2, 2.0]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>
      <Html position={[0, 0.8, 0]} center><div style={label}>{name}</div></Html>
    </group>
  );
}

export default function RoomProps() {
  const arrows = [];
  for (const y of [W * 0.25, W * 0.5, W * 0.75]) {
    for (const z of [H * 0.3, H * 0.6]) {
      for (const x of [L * 0.2, L * 0.5, L * 0.8]) arrows.push([x, y, z]);
    }
  }
  return (
    <group>
      <Vent x={0} name="inlet (clean air)" color="#3ddc84" />
      <Vent x={L} name="return" color="#4aa3ff" />
      {arrows.map((p, i) => (
        // cone default tip is +y; rotate so it points +x (along the airflow)
        <mesh key={i} position={toThree(...p)} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.06, 0.2, 8]} />
          <meshBasicMaterial color="#6fb3ff" transparent opacity={0.45} />
        </mesh>
      ))}
      <mesh position={toThree(...AIRLOCK_M)}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshBasicMaterial color="#c08a4a" wireframe />
      </mesh>
      <Html position={toThree(AIRLOCK_M[0], AIRLOCK_M[1], AIRLOCK_M[2] + 0.8)} center>
        <div style={label}>airlock (dust)</div>
      </Html>
    </group>
  );
}
