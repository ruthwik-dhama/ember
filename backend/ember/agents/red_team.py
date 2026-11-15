# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Red Team ("The Arsonist"): finds the hardest-to-detect, most harmful fire. Owner: Kartavya."""
from __future__ import annotations

T_MAX = 300.0


def red_objective(result: dict) -> float:
    """Higher = worse fire. Undetected fires get a tiebreak so search still has a gradient."""
    if result["detected"]:
        return result["delay_s"]
    return T_MAX + 0.01 * result["fire_area_cm2"] + 0.001 * result["smoke_escaped"]


def validate_scenario(scenario: dict, room) -> bool:
    """Material exists in sim/materials.py, coordinates inside the room, fuel phase matches material."""
    raise NotImplementedError("agents lane (Kartavya)")


def run_red(base_cfg, budget: int, seed: int, llm_cache=None):
    """LLM seeds (cached) -> CMA-ES over scenarios maximizing red_objective(simulate(cfg, frames=False))."""
    raise NotImplementedError("agents lane (Kartavya)")
