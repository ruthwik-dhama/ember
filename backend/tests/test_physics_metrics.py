# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Physics-lane deck numbers and non-saturating severity signals. Owner: Ruthwik."""
from ember.config import Detector, FireSpec, SimConfig
from ember.sim.engine import simulate
from ember.sim.metrics import physics_metrics
from ember.sim.suppression import diluted_o2, limiting_o2


def test_severity_keeps_growing_after_full_size():
    # Setup: undetected cotton fire (no detectors), vents on, Moon base. Area saturates at r_cap; the
    # time-integrated burning area keeps growing, so a longer run must score higher on it.
    short = simulate(SimConfig(fires=[FireSpec("cotton", "solid", 3, 2, 0.5)], t_max_s=200), frames=False)
    long = simulate(SimConfig(fires=[FireSpec("cotton", "solid", 3, 2, 0.5)], t_max_s=300), frames=False)
    assert short["t_full_size_s"] is not None and short["t_full_size_s"] == long["t_full_size_s"]
    assert long["fire_area_cm2"] == short["fire_area_cm2"]            # saturated
    assert long["burn_area_cm2_s"] > short["burn_area_cm2_s"] > 0      # still separates
    assert long["smoke_produced"] > short["smoke_produced"] > 0


def test_physics_metrics_shape_and_honest_status():
    d = physics_metrics()
    keys = {"gravity_delay_s_0g", "gravity_delay_s_moon", "gravity_delay_s_mars", "gravity_delay_s_1g",
            "dust_false_alarm_rate_single", "dust_false_alarm_rate_two_moment"}
    assert set(d) == keys
    for v in d.values():
        assert set(v) >= {"value", "badge", "calibration_status", "note"} and v["note"]
        assert v["calibration_status"] == "assumed"   # transport/detector constants are still assumed
    assert d["gravity_delay_s_moon"]["badge"] == "yellow"
    assert d["dust_false_alarm_rate_two_moment"]["value"] <= d["dust_false_alarm_rate_single"]["value"]


def test_co2_flood_reaches_heptane_limit_at_moon_o2():
    # Wu & Ruff 2004: CO2 must cut rack O2 by 50%. At 30% O2 that reaches 15%, below heptane's FLEX limit (17%).
    assert diluted_o2(0.30) < limiting_o2("co2", "n-heptane")
