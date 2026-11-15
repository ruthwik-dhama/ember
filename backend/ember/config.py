# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""SHARED CONTRACT. Simulation config models used by the sim, agents, API and frontend.

Change a field here only after telling the whole team (README > Contracts).
Written with Optional/List (not `X | None`) so it also runs on Python 3.9.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Literal, Optional, Tuple

# --- Shared constants -------------------------------------------------------
# Gravity in Earth-g units. Only 0 g and 1 g have PSI data; anything between is interpolated (yellow).
GRAVITY_PRESETS = {"iss": 0.0, "moon": 0.165, "mars": 0.38, "earth": 1.0}

PSI_TO_KPA = 6.89476

# PLACEHOLDER habitat geometry (metres): x = length (vent inlet at x=0, return at x=L), y = width, z = height.
# Physics (Ruthwik) and 3D habitat (Kartavya) must agree on this; the frontend mirrors it in src/habitat/room.js.
ROOM_M: Tuple[float, float, float] = (6.0, 4.0, 2.5)
AIRLOCK_M: Tuple[float, float, float] = (0.5, 2.0, 1.0)  # PLACEHOLDER: where DustEvent(location="airlock") puffs in


# --- Simulation config (contract) -------------------------------------------
@dataclass
class FireSpec:
    material: str
    phase: Literal["solid", "liquid"]
    x: float
    y: float
    z: float
    t_ignite_s: float = 0.0
    droplet_d_mm: Optional[float] = None  # liquid fires only; used by the Ghost Flame Auditor


@dataclass
class Detector:
    id: str
    x: float
    y: float
    z: float
    kind: Literal["single", "two_moment"] = "single"


@dataclass
class DustEvent:
    t_s: float
    mass_mg: float
    location: str = "airlock"


@dataclass
class SimConfig:
    o2_frac: float = 0.30
    pressure_kpa: float = 70.3  # 10.2 psi (Moon base / rover)
    g: float = 0.165  # Earth-g units
    vent_on: bool = True
    vent_off_at_s: Optional[float] = None
    suppressant: Literal["none", "co2", "he"] = "none"
    fires: List[FireSpec] = field(default_factory=list)
    detectors: List[Detector] = field(default_factory=list)
    dust: List[DustEvent] = field(default_factory=list)
    t_max_s: float = 300.0


# --- Mission (PROPOSED; owner Kishan) -----------------------------------------
@dataclass
class Mission:
    """What the user sets on the Mission setup screen. Every other screen reads from this."""
    habitat: Literal["spacecraft", "iss", "moon_base", "mars_base", "rover"] = "moon_base"
    g: float = 0.165
    o2_frac: float = 0.30
    pressure_kpa: float = 70.3
    materials: List[str] = field(default_factory=lambda: ["cotton", "pmma"])
    fuel_phases: List[str] = field(default_factory=lambda: ["solid"])
    vent_on: bool = True
