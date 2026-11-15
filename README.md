# EMBER

**E**xploration **M**ulti-agent **B**urn **E**valuation **R**ange: an SI-powered fire-safety dashboard and adversarial simulator for crewed lunar and Martian habitats, built on NASA PSI combustion data.

EMBER has two layers:

1. **Dashboard** (what the challenge asks for). It summarizes every relevant PSI combustion investigation, ranks them for your habitat, compares them side by side, answers questions with citations, and writes an insights report.
2. **Adversarial simulator** (our differentiator). It's a virtual habitat where a **Red Team** agent searches for the most dangerous fire and a **Blue Team** agent searches for countermeasures. Every physical value is calibrated to a PSI investigation and carries a provenance badge.

Core principle: **every number shows how much real data backs it.**

| Badge | Meaning |
|---|---|
| 🟢 Measured | Within tested conditions |
| 🟡 Interpolated | Between tested conditions (including **all** partial-g results between the 0 g and 1 g data) |
| 🔴 Extrapolated | Outside every tested condition |

> **Final deadline: tonight (Sun 15 Nov), 11:59 PM.** Routes that aren't built yet return HTTP 501 naming their owner.

## What's on `main` now

Merged so far: skeleton, physics engine (PR #3), Envelope Guard (#1), rank and report (#5), data lane (#4), FLEX/BASS-II calibration (#6), witnesses (#7), and Red/Blue duel + Ghost Flame + 3D playback (#8). **51 tests pass** (about 80 s; the agent tests run real CMA-ES searches). Open: #10 wires the duel routes.

| Component | Status | Owner | Where |
|---|---|---|---|
| Physics engine | ✅ Live, calibrated where papers allow | Ruthwik | `backend/ember/sim/` |
| Envelope Guard (`check`, `distance_to`, `gap_map`) | ✅ Live | Sibi | `backend/ember/envelope/` |
| Data: conditions, calibration, summaries, witness docs | ✅ 43 condition rows, 57 constants, 5 witness docs | Sibi, Ruthwik | `data/` |
| Rank + compare | ✅ Live (`/api/rank`, `/api/compare`) | Kishan | `backend/ember/rank/` |
| Insights report | ✅ Live, including Red's top risks and Blue's fixes from the duel | Kishan | `backend/ember/report/` |
| `/api/gap_map` route | ⏳ 501. `guard.gap_map()` works; the route isn't wired to it yet | Kishan | `backend/ember/api.py` |
| Red / Blue duel | ✅ Built (`run_red`, `run_blue`, `run_duel`); the report uses it. ⏳ `/api/duel/*` routes still 501 on `main`; PR #10 wires them | Kartavya | `backend/ember/agents/` |
| Ghost Flame Auditor | ✅ `ghost_flame_check()` + `ghost_params()` (reads the `ghost.*` FLEX rows); runs inside the duel | Kartavya | `agents/ghost_flame.py` |
| Witnesses / Ask EMBER | ✅ Built: offline cited retrieval, optional Claude phrasing, 15-question eval. ⏳ `/api/ask` still 501 (route needs `ask_ember()`) | Sibi | `agents/witness.py` |
| Frontend | 🟡 6 tabs. Explorer wired; Habitat screen plays simulation frames in 3D and has a "Run duel" panel (works once #10 merges). Mission, Ranking, Ask and Report screens are placeholders | Kishan, Kartavya, Ruthwik, Sibi | `frontend/src/` |
| Gravity panel | ⏳ Placeholder (`gravity_sweep()` is ready in the backend) | Ruthwik | `frontend/src/panels/gravity/` |
| `metrics.py` | ⏳ Writes `deck_numbers.json` with null values only | Kishan | `backend/scripts/` |

---

## Why this matters

**The oxygen paradox.** To shorten spacesuit pre-breathe, Moon bases and pressurized rovers will run an intermediate atmosphere.

| Environment | O₂ mole fraction | Total pressure | O₂ partial pressure |
|---|---|---|---|
| Earth, sea level | 20.9% | 14.7 psi | ≈ 3.07 psi |
| Moon Base / rover (planned) | ≥ 30% | ≤ 10.2 psi | ≈ 3.06 psi |
| Spacesuit | 100% | 4.3 psi | 4.3 psi |

The O₂ *partial pressure* is almost the same as on Earth, so breathing feels normal. The O₂ *mole fraction* is about 40% higher, though, so there's less nitrogen to absorb flame heat. Flames run hotter and spread faster, because flammability tracks mole fraction much more than partial pressure.

**Gravity.** On Earth, buoyancy carries smoke up to ceiling detectors. On the ISS buoyancy is essentially absent, and SAME found that smoke transport is dominated by mixing and detection takes longer. At lunar gravity (1/6 g) buoyancy is reduced but not absent.

**Data.** PSI has no partial-gravity combustion data yet (LUCI and FM2 should add some). Microgravity (ISS) and normal-gravity (ground) data *bound* what should happen in between. The data is spread across many investigations, hardware sets and fuel types, which makes it hard to find and compare.

**History.** Apollo 1 (cabin fire, 100% O₂), Apollo 13 (O₂ tank explosion), Mir (oxygen generator fire), Artemis II (smoke alarm in flight). Fire safety is organized around **prevention, detection and suppression**.

## Challenge alignment

| Requirement | EMBER feature |
|---|---|
| Summarize findings | Experiment explorer: objective, fuel, sample shape/size, conditions, variables, sensors |
| Compare investigations | Side-by-side compare (similarities and differences) |
| Rank findings | Relevance ranking for your mission, filterable by prevention / detection / suppression |
| Interpret findings | Simulation, Red/Blue duel, Ghost Flame Auditor, Ask EMBER chat |
| Relevant habitats | Spacecraft, space station, Moon base, Mars base, pressurized rover |
| Predictive modeling | Calibrated reduced-order physics with explicit uncertainty badges |
| Next-gen equipment | Detector placement, two-moment smoke/dust discrimination, extinguishment verification |
| Earth applications | Hospital oxygen therapy, submarines, aircraft cargo holds, mines |
| SI-powered | Multi-agent system: Red, Blue, Witnesses, Envelope Guard, Ghost Flame Auditor |

---

## Quickstart

**Prerequisites:** Python 3.9+ (CI uses 3.11; macOS's built-in `python3` works) and Node 18+.

```bash
git clone https://github.com/ruthwik-dhama/ember.git
cd ember
```

One-time setup:

```bash
python3 -m venv backend/.venv
source backend/.venv/bin/activate        # Windows: backend\.venv\Scripts\activate
pip install -r backend/requirements.txt
(cd frontend && npm install)
```

Run (two terminals):

```bash
cd backend && uvicorn ember.api:app --reload --port 8000
```

```bash
cd frontend && npm run dev               # http://localhost:5173, proxies /api to :8000
```

On macOS/Linux, `./start-ember.sh` starts both and opens the browser.

Tests:

```bash
pytest backend/tests -q
```

The suite covers contracts, physics behaviour, Envelope Guard (`test_envelope.py`), data-file checks (`test_data.py`), agents (`test_agents.py`), witnesses (`test_witness.py`) and rank/report. It takes about 80 s because the agent tests run real searches. Shared loaders for everything in `data/` live in `backend/ember/data_io.py`, so read constants through `cal("name")` and never hard-code them.

Optional: copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY` to enable live LLM calls (Red seeds, "why" text, witness phrasing). Without it, EMBER uses cached responses (offline mode).

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│ Frontend (React + React Three Fiber)                         │
│  Dashboard screens · 3D habitat · agent panels · badges      │
└───────────────────────────────┬──────────────────────────────┘
                                │ HTTP / JSON (src/api.js)
┌───────────────────────────────▼──────────────────────────────┐
│ API + orchestrator (FastAPI, backend/ember/api.py)           │
└───┬───────────────┬────────────────┬───────────────┬─────────┘
    │               │                │               │
┌───▼─────┐   ┌─────▼──────┐   ┌─────▼──────┐  ┌─────▼────────┐
│ Red     │──▶│ Physics    │◀──│ Blue       │  │ Dashboard    │
│ agent   │   │ engine     │   │ agent      │  │ rank/compare │
└─────────┘   │ simulate() │   └────────────┘  │ report       │
              └─────┬──────┘                   └──────────────┘
                    │ SimResult
    ┌───────────────┼────────────────┐
┌───▼──────┐  ┌─────▼──────┐  ┌──────▼─────┐
│ Envelope │  │ Ghost      │  │ Witness    │
│ Guard    │  │ Flame      │  │ agents     │
└───┬──────┘  └─────┬──────┘  └──────┬─────┘
    └───────────────┼────────────────┘
              ┌─────▼──────┐
              │ Scorer +   │──▶ next round
              │ metrics    │
              └────────────┘
┌──────────────────────────────────────────────────────────────┐
│ Data layer (data/): tested_conditions.csv · calibration.csv  │
│ investigations.json · witness_docs/*.md                      │
└──────────────────────────────────────────────────────────────┘
```

**Duel loop**

1. The orchestrator starts round *n*.
2. **Red** proposes the most harmful scenarios (LLM seeds, refined by CMA-ES).
3. The **physics engine** runs each one: `simulate(config) -> SimResult`.
4. **Blue** proposes countermeasures (detector positions, vent shutdown timing, suppressant) against Red's worst case.
5. The engine reruns with Blue's configuration.
6. The **Envelope Guard** badges the conditions, the **Ghost Flame Auditor** checks liquid-fuel suppressions, and the **Witnesses** attach citations.
7. The **scorer** records metrics and hands them back for round *n+1*.

**Tech stack:** Python + FastAPI; NumPy (smoke grid), SciPy (fits), Cantera optional; CMA-ES (`cma`); Claude API with JSON output and a cache for offline mode; keyword retrieval over `witness_docs/*.md` (embeddings optional); React + React Three Fiber; GitHub Actions running pytest.

### Physics in one paragraph

This is a **reduced-order model** calibrated to PSI data, not CFD. Smoke and dust move on a 3D grid by advection and diffusion: `∂c/∂t + (u_vent + w_b(g) ẑ)·∇c = D∇²c + S_fire + S_dust`. Buoyant velocity scales as `u_b(g) ≈ u_b(1g) · g^(1/3)`, which gives about 0.55× Earth on the Moon and 0.72× on Mars. Flame spread is fit to BASS/BASS-II: `v_f = v0 · (X_O2/X_ref)^a · F(u_eff)`, where `F` has an oxygen-starvation branch at low flow and a blowoff branch at high flow. That's the *ventilation dilemma*. There are two detector types. **Single-measurement** detectors alarm on mass concentration and can't tell smoke from dust. **Two-moment** detectors estimate particle size, so smoke (hundreds of nm, growing as it ages) can be told apart from regolith dust (microns). Suppression uses FLEX/FLEX-2 CO₂ and He dilution thresholds. Those are **droplet-scale** measurements, so applying them to a whole cabin is badged 🟡/🔴.

**How the engine is implemented** (`backend/ember/sim/`):

| Piece | What it does | Calibrated from |
|---|---|---|
| `engine.py` | 0.25 m grid over `ROOM_M` (24×16×10). Vent flow runs from the inlet wall to the return wall, and smoke leaving the return counts as `smoke_escaped`. Buoyancy applies to smoke only; dust doesn't rise. Smoke pools under the no-flux ceiling. The step size is set automatically for numerical stability. | SAME-R smoke size and aging (Sibi's fit); vent speed and mixing are still `assumed` |
| `flame.py` | Spread rate with the BASS-II fit. Below `flame.u_ext` = 0.6 cm/s there is no spread. The quench term uses forced + buoyant flow, and blowoff uses **forced flow only**, matching BASS-II's 1 g data. | BASS-II ISS Table S1 (PMMA rods) |
| `materials.py` | Cotton, PMMA, n-heptane and methanol. Values come from `calibration.csv` rows `material.<name>.{v0, smoke_yield, r_cap}`. | PMMA `v0` fitted; the rest `assumed` |
| `suppression.py` | The agent floods the cabin `suppress.response_s` after the first alarm. The fire goes out if diluted O₂ is below FLEX's **per-fuel** limiting O₂. Solids fall back to the heptane value, which is an extrapolation. `ghost_flame_params()` feeds the Ghost Flame Auditor. | FLEX LOI values; cutoff and envelope from NASA Glenn JR12-009 and Nayagam et al. 2014 |
| `sweeps.py` | `gravity_sweep(cfg)` runs the same fire at ISS / Moon / Mars / Earth g. | — |

**What the papers have shown so far** (measured values, not simulation outputs):
- FLEX limiting O₂ for droplets: heptane 0.15 in air, 0.17 with CO₂ and 0.15 with He; methanol 0.12, 0.14 and 0.14.
- BASS-II: in microgravity, PMMA spread **rises and then falls** as airflow increases, stops below 0.6 cm/s, and is sustained down to 17% O₂ (18% at 1 g).
- FLEX-2 burned n-decane droplets at **0.5 atm**, and ACME tested flames at 21–40% O₂ (some at 57 kPa). With both in `data/`, Moon-base conditions (30% O₂, 70.3 kPa, 0.165 g) badge **🟡**: inside every tested range, and partial gravity is 🟡 by rule. Caveat: the guard pools all investigations, so the 30% O₂ coverage comes from ACME gas flames, not from solid flame-spread data (BASS-II only reaches 21%).
- At 30% O₂, a CO₂ flood that would work in Earth air may leave O₂ above heptane's limit. The cabin dilution fraction is still `assumed`, so treat this as a hypothesis, not a result.

---

## Repo layout and owners

```
ember/
├── backend/
│   ├── ember/
│   │   ├── api.py                 # Kishan
│   │   ├── config.py              # SHARED CONTRACT (SimConfig, FireSpec, Detector, DustEvent)
│   │   ├── sim/                   # Ruthwik: engine.py, flame.py, materials.py, suppression.py
│   │   ├── agents/
│   │   │   ├── red_team.py        # Kartavya
│   │   │   ├── blue_team.py       # Kartavya
│   │   │   ├── ghost_flame.py     # Kartavya
│   │   │   └── witness.py         # Sibi
│   │   ├── envelope/              # Sibi
│   │   ├── rank/                  # Kishan
│   │   └── report/                # Kishan
│   ├── scripts/metrics.py         # Kishan
│   └── tests/test_core.py         # everyone
├── data/                          # Sibi (Ruthwik adds BASS/FLEX rows)
│   ├── tested_conditions.csv
│   ├── calibration.csv
│   ├── investigations.json
│   └── witness_docs/*.md
├── frontend/src/
│   ├── app/                       # Kishan (routing, layout)
│   ├── api.js                     # Kishan
│   ├── dashboard/                 # Kishan
│   ├── habitat/                   # Kartavya
│   ├── panels/agents/             # Kartavya
│   ├── panels/gravity/            # Ruthwik
│   ├── panels/data/               # Sibi (gap map)
│   └── components/Badge.jsx       # Sibi
└── .github/workflows/ci.yml       # Kishan
```

## Team and lanes

| Person | Lane | Owns |
|---|---|---|
| **Kishan** | Integration, dashboard API and UI | `api.py`, `rank/`, `report/`, `scripts/`, `frontend/src/app/`, `frontend/src/dashboard/`, `api.js`, README, CI |
| **Ruthwik** | Physics engine and calibration | `backend/ember/sim/`, `frontend/src/panels/gravity/` |
| **Kartavya** | Red / Blue / Ghost Flame agents and 3D habitat | `red_team.py`, `blue_team.py`, `ghost_flame.py`, `frontend/src/habitat/`, `frontend/src/panels/agents/` |
| **Sibi** | NASA data, Envelope Guard and Witnesses | `data/`, `envelope/`, `witness.py`, `frontend/src/panels/data/`, `Badge.jsx` |
| **Kavin** | Pitch and demo video | Deck, demo video, pitch script |

**Paper split** (each owner extracts *both* condition rows and calibration values, so nobody reads the same paper twice):

| Owner | Investigations |
|---|---|
| Ruthwik | BASS, BASS-II, FLEX, FLEX-2 |
| Sibi | SAME, SAME-R, DAFT, DAFT-2, ACME |

**Dependencies:**
- Sibi → Ruthwik, Kishan: calibration values, condition rows, investigation summaries
- Ruthwik → Kartavya, Kishan: `simulate()`
- Ruthwik → Kartavya: FLEX cool-flame parameters for the Ghost Flame Auditor (critical droplet diameter, fuels, envelope)
- Kartavya → Kishan: duel results for metrics and report
- Kishan → Kavin: `deck_numbers.json` and a working demo build
- Sibi → Kishan: witness eval questions (about 15)

## How we work

- **Branch per lane:** `ruthwik/physics`, `kartavya/habitat`, `sibi/envelope`, `kishan/dashboard`. Never commit straight to `main`.
- Open a **PR into `main`**. GitHub Actions runs pytest on every PR, and CI must be green.
- **Any teammate can approve a PR. Kishan merges at checkpoints.**
- Only Kishan edits `frontend/src/app/` and `api.js`. If you need a route or API call, ask him.
- Frontend work starts against saved example responses / stub endpoints, then switches to the live API.
- Stay in your own folders. If you need to touch someone else's file, message them first.

```bash
git checkout main && git pull
git checkout -b yourname/lane
# ...work...
pytest backend/tests -q
git push -u origin yourname/lane     # then open a PR on GitHub
```

---

## Contracts

**Change these only after telling everyone.**

| Contract | Location | Shape |
|---|---|---|
| Simulation config | `backend/ember/config.py` | `SimConfig`, `FireSpec` (with `phase: "solid" \| "liquid"`), `Detector`, `DustEvent` |
| Simulation result | `simulate()` return | see below |
| Envelope Guard | `EnvelopeGuard.check(conditions)` | `{badge, distance, nearest, outside_axes}` |
| Calibration | `data/calibration.csv` | `name, value, unit, source, status` |
| Investigation summary | `data/investigations.json` | see Data files (owned by Sibi) |
| Deck numbers | `deck_numbers.json` | written by `metrics.py`, used by Kavin |

`config.py` shapes:

```python
@dataclass
class FireSpec:
    material: str
    phase: Literal["solid", "liquid"]
    x: float; y: float; z: float
    t_ignite_s: float = 0.0
    droplet_d_mm: float | None = None

@dataclass
class Detector:
    id: str
    x: float; y: float; z: float
    kind: Literal["single", "two_moment"] = "single"

@dataclass
class DustEvent:
    t_s: float
    mass_mg: float
    location: str = "airlock"

@dataclass
class SimConfig:
    o2_frac: float = 0.30
    pressure_kpa: float = 70.3        # 10.2 psi
    g: float = 0.165                  # Earth-g units
    vent_on: bool = True
    vent_off_at_s: float | None = None
    suppressant: Literal["none", "co2", "he"] = "none"
    fires: list[FireSpec] = field(default_factory=list)
    detectors: list[Detector] = field(default_factory=list)
    dust: list[DustEvent] = field(default_factory=list)
    t_max_s: float = 300.0
```

`simulate(cfg: SimConfig) -> dict`:

```text
detected:          bool
delay_s:           float | None                 # time to first alarm
alarms:            [{detector_id, t_s, reason}]
conditions:        {o2_frac, pressure_kpa, flow_cm_s, g}   # fed to the Envelope Guard
frames:            [{t_s, voxels: [[i, j, k, concentration, smokeFrac], ...]}]   # sparse, 1 frame / 2 s (~4 MB per 300 s run)
fire_area_cm2:     float      # Red's tiebreak for undetected fires
smoke_escaped:     float      # Red's tiebreak for undetected fires
spread_rate_mm_s:  float      # gravity comparison panel
fires:             [{material, phase, radius_m, area_cm2, extinguished_at_s, calibration_status}]
stub:              bool       # true only for placeholder engines
```

`simulate(cfg, frames=False)` is the **fast mode** for Red/Blue/metrics: no voxel frames, and it stops at the first alarm (about 0.04 s per run). Voxel `(i, j, k)` index a 0.25 m grid over `ROOM_M` (x = vent inlet→return, z = up). `backend/ember/sim/sweeps.py::gravity_sweep(cfg)` runs the same fire at ISS / Moon / Mars / Earth g.

**Other shared functions on `main`:**

| Function | Returns | Owner |
|---|---|---|
| `EnvelopeGuard.check(conditions)` | `{badge, distance, nearest, outside_axes}`; accepts a dict, `SimConfig` or `Mission` | Sibi |
| `EnvelopeGuard.distance_to(mission, row)` | normalized distance from a mission to one tested row (used by ranking) | Sibi |
| `EnvelopeGuard.gap_map(pressure_kpa, g)` | `{pressure_kpa, g, o2_values, flow_values, cells[i][j], nearest[i][j], counts}` on a 13×13 O₂ (0.15–0.45) × flow (0–30 cm/s) grid | Sibi |
| `rank(mission, investigations, guard, pillar=None)` | `[{id, score, why}]`, best first. Score = 1/(1 + nearest distance) + 0.2 if fuel phase matches | Kishan |
| `compare(a, b)` | `{same: [...], different: [...]}` over hardware, fuel phase, g, pillars, sensors | Kishan |
| `build_report(mission)` | `{mission, top_investigations, top_risks, recommended_fixes, data_gaps, earth_applications}`. Any section whose lane fails returns `{available: false, reason}` instead of crashing | Kishan |
| `run_red(base_cfg, budget, seed, llm_cache=None, top_k=5)` | Red's worst scenarios. LLM seeds (cached), else hand-written fallback seeds, refined by CMA-ES on `red_objective(simulate(cfg, frames=False))` | Kartavya |
| `run_blue(red_worst, base_cfg, budget, seed)` | CMA-ES over detector positions, vent shutoff time and suppressant against Red's worst scenario | Kartavya |
| `run_duel(base_cfg, rounds, seed, red_budget=60, blue_budget=60)` | Red attacks the layout Blue left each round; Envelope Guard and Ghost Flame run on the results; only the last round carries voxel frames. Deterministic id per input, cached by `save_duel` / `load_duel` | Kartavya |
| `ghost_params()` | Ghost Flame regime from the `ghost.*` rows in `calibration.csv` | Kartavya |
| `witness.ask(question, investigation_id=None)` | `[{witness, answer, citations: [{n, source, fact}], facts, score, mode}]`, best witness first; empty list = no cited data | Sibi |
| `witness.ask_ember(question)` | `{question, answers, mode}`: the intended `POST /api/ask` body | Sibi |
| `witness.evaluate()` | witness accuracy and citation rate on `data/witness_eval.json` (offline, no LLM) | Sibi |
| `gravity_sweep(cfg)` | `{iss\|moon\|mars\|earth: {g, detected, delay_s, spread_rate_mm_s, partial_g}}` | Ruthwik |
| `ghost_flame_params()` | `{cool_flame_fuels, critical_d_mm, cool_flame_envelope, source}` for `ghost_flame_check()` | Ruthwik |
| `suppression.limiting_o2(agent, material)` | FLEX limiting O₂ for that fuel, else the generic (extrapolated) value | Ruthwik |

Known placeholder: `envelope/guard.py` assumes `DEFAULT_FLOW_CM_S = 10.0` because `Mission` has no flow field yet.

## API

| Method | Path | Owner | Screen | Status |
|---|---|---|---|---|
| GET | `/api/health` | Kishan | — | ✅ |
| POST | `/api/mission` | Kishan | Mission setup | ✅ stores the mission used by rank/report |
| GET | `/api/investigations` | Kishan (data: Sibi) | Explorer | ✅ |
| GET | `/api/investigations/{id}` | Kishan (data: Sibi) | Explorer | ✅ |
| GET | `/api/compare?a=&b=` | Kishan | Compare | ✅ |
| GET | `/api/rank?pillar=` | Kishan | Ranking | ✅ |
| POST | `/api/simulate` | Kishan (engine: Ruthwik) | Habitat | ✅ adds `envelope` badge |
| POST | `/api/duel/run` | Kishan (agents: Kartavya) | Habitat / duel panel | ⏳ 501 on `main`; PR #10 wires it to `run_duel` |
| GET | `/api/duel/{run_id}` | Kishan | Duel panel | ⏳ 501 on `main`; PR #10 returns the cached run or 404 |
| POST | `/api/ask` | Kishan (witnesses: Sibi) | Ask EMBER | ⏳ 501 (wire to `witness.ask_ember`) |
| GET | `/api/gap_map` | Kishan (guard: Sibi) | Gap map | ⏳ 501 (wire to `guard.gap_map()`) |
| GET | `/api/report` | Kishan | Report | ✅ runs the duel (cached after the first call) |

## Frontend screens (user flow)

1. **Mission setup:** habitat type, gravity, O₂, pressure, materials, ventilation. Every other screen updates from this.
2. **Experiment explorer:** a summary card for each investigation, plus side-by-side compare.
3. **Ranking:** ranked list with prevention / detection / suppression filters and a one-line "why".
4. **Habitat simulation:** 3D habitat, smoke playback, Red/Blue duel, gravity toggle, badges on every number.
5. **Ask EMBER:** chat with clickable citations.
6. **Insights report:** risks, fixes, data gaps, Earth applications; export.

---

## Data files (`data/`)

**`tested_conditions.csv`**: one row per real test condition.

```csv
investigation,test_id,fuel,fuel_phase,o2_frac,pressure_kpa,flow_cm_s,g,measured_outputs,citation,verified
FLEX,FLEX-LOI-HEP-CO2,n-heptane,liquid,0.17,101.3,0.0,0.0,limiting_oxygen_index;co2_frac=0.20,doi:10.1007/s12217-014-9372-2,true
```

- `verified=false` until the owner has checked the row against the source.
- `g` is in Earth-g units (0, 0.165, 0.38, 1.0).
- No placeholder citations remain. `test_data.py` checks this for the data lane's rows.

**Current coverage (43 rows):**

| Investigation | Rows | What they cover | Owner |
|---|---|---|---|
| SAME-R | 12 | smoke from 6 materials at 0, 2 and 8 cm/s, 21% O₂, 1 atm | Sibi |
| SAME | 5 | SAME-1 smoke from 5 materials, 8 cm/s | Sibi |
| ACME | 7 | BRE ethylene/methane flames (emulated solids), **21–40% O₂**, 57–101 kPa | Sibi |
| FLEX | 6 | heptane/methanol limiting-O₂ conditions (air, CO₂, He), 1 atm | Ruthwik |
| FLEX-2 | 4 | n-decane cool-flame tests at **0.5 atm**, 14–25% O₂ | Ruthwik |
| BASS-II | 6 | ISS PMMA spread, 17–20.7% O₂, 0.7–7.6 cm/s | Ruthwik |
| GROUND | 3 | BASS-II 1 g PMMA references | Ruthwik |

**Open data gaps:** BASS-II rows are `verified=false` because the paper doesn't state test pressure. BASS, CFI, SPICE and SLICE have no `sources` in `investigations.json` yet, and DAFT has a summary and witness doc but no condition rows. Solid flame-spread data (BASS-II) stops at 21% O₂, so spread rates at 30% are an extrapolation of the fit even though the pooled envelope badges them 🟡.

**`calibration.csv`**: the single source of truth for every physical constant in the simulator. `status` is `measured`, `fitted` or `assumed`, and the UI and deck badges are generated from it. Currently 57 constants: **21 measured, 7 fitted, 29 assumed.** The `assumed` ones are mostly vent speed, mixing, cotton and liquid spread rates, detector thresholds and dust values.

```csv
name,value,unit,source,status
smoke.d0_nm,258,nm,NTRS-20130000422 Table 1: median diameter of average mass (D30) of unaged baseline smoke ...,fitted
suppress.co2.n-heptane,0.17,-,Dietrich et al. 2014 ...: LOI 0.17 (0.17/0.63/0.20 O2/N2/CO2) droplet-scale,measured
```

**`investigations.json`**: one object per investigation (`id, name, objective, hardware, fuel{names, phase, shape, size}, conditions{o2_frac, pressure_atm, diluents, g}, varied, held_constant, sensors, pillars, key_findings, sources`). It feeds the explorer and compare screens.

**`witness_docs/<ID>.md`**: one file per investigation with 5–15 facts, each with a real citation in brackets. Witnesses retrieve only from their own file and drop any uncited claim. Files so far: `ACME.md`, `BASS.md`, `DAFT.md`, `FLEX.md`, `SAME.md`.

**`witness_eval.json`**: Sibi's 15 eval questions, each with the expected witness and the phrase that answers it. Used by `witness.evaluate()` and `metrics.py`.

**Investigations in scope:** BASS / BASS-II (solid flame spread vs. O₂ and flow, prevention); SAME / SAME-R (smoke particle size and aging, detection); DAFT / DAFT-2 (dust signature, false alarms); FLEX / FLEX-2 and CFI (droplet extinction, cool flames, suppression); ACME (gaseous flames, high-O₂ tests); SPICE / SLICE (smoke point, liftoff); 1 g ground references (upper bound for gravity interpolation).

## Scientific honesty rules

1. **One source of truth.** Every constant lives in `calibration.csv` with a source and status. Badges are generated, never hand-labeled.
2. **Partial gravity is interpolated.** PSI has no partial-g data, so anything between 0 g and 1 g is 🟡 by rule.
3. **Ghost Flame is liquid-only.** Cool flames were observed on liquid droplets. Solid fires return "not applicable: no cool-flame data for solids."
4. **Suppression is droplet-scale.** FLEX dilution thresholds applied to a whole cabin are 🟡 or 🔴.
5. **Tests state their setup.** If real data contradicts a test, that's a finding the team discusses, not a bug to hide.
6. **Digitized values are labeled.** Values read off published figures are cited as such.
7. **No hand-typed deck numbers.** They all come from `deck_numbers.json`.

## Metrics (`backend/scripts/metrics.py` → `deck_numbers.json`)

| Metric | Fairness rule |
|---|---|
| Red vs. random search (worst case found) | Same sim budget; median over 5+ seeds |
| Baseline vs. Blue detection time (mean and worst case) | Same scenario set for both layouts |
| Gravity comparison at 0 / 0.165 / 0.38 / 1 g | Identical fires; partial g badged 🟡 |
| Dust false-alarm rate, single vs. two-moment | Same dust events |
| False all-clear rate (cool flame still active) | Liquid fuels only |
| Badge coverage (% 🟢 / 🟡 / 🔴) | From `calibration.csv` and the Envelope Guard |
| Witness accuracy and citation rate vs. no-retrieval baseline | Same ~15 questions |

---

## Checkpoints (tonight)

| When | Checkpoint | Done when |
|---|---|---|
| **5:00 PM** | **CP1** | Everyone runs the app locally, makes one change in their lane, and merges it. CI is running. Kavin has a draft pitch story and demo script. |
| **8:00 PM** | **CP2** | Real data in the CSVs and materials. Dashboard screens show real summaries and rankings. LLM seeds work with the cache. The 3D habitat plays real simulation frames. `metrics.py` writes `deck_numbers.json`. Kavin has a deck draft with placeholders marked. |
| **10:00 PM** | **CP3: feature freeze** | Offline mode tested. Precomputed duel cached. Demo rehearsed twice. Deck numbers regenerated from the final build. Kavin records the final demo video from the frozen build. |
| **11:30 PM** | **Submit** | Every link checked in a private window. |

**Cut order if we're behind:** (1) embeddings for witness retrieval, (2) dragging detectors in 3D, (3) detailed habitat props, (4) He as a suppressant.

**Never cut:** the summarize / rank / compare screens, the badges, and the Ghost Flame liquid-only rule.

## Demo reliability

- **Precomputed duel:** `run_duel` caches each run in `backend/ember/agents/cache/duel_<id>.json`, keyed by its inputs. ⚠️ Those files are **gitignored**, so the cache only exists on the machine that ran the duel. **Run the demo mission's duel (or open the report) once on the demo laptop before presenting.**
- **Offline mode:** works without a key or Wi-Fi. Red falls back to hand-written seeds (LLM seeds cache to `agents/cache/red_seeds.json` when a key is set), and witnesses return the cited facts directly (Claude phrasing caches to `data/llm_cache/witness.json`). Neither cache is committed yet.
- **Validation:** LLM scenario output is schema-checked before use (material exists, coordinates inside the room, fuel phase matches the material).
- **Payload size:** sparse voxels, about 2 frames per second of simulated time.

---

## Use of AI

The EMBER idea, science framing and design are the team's own. This README, the repo skeleton, the physics engine and the FLEX/BASS-II calibration (paper reading, value extraction, and the PMMA spread fit) were drafted with Claude (Anthropic) and reviewed by the team; every extracted value cites its source in `data/`. AI-assisted source files say so in their first-line header comment. Mark any other AI-assisted file with a one-line header comment, and list in-app LLM use here (Red seeds, "why" text, witness phrasing via the Claude API). Any AI-generated image or video must carry a visible watermark.

## Sources

- PSI Data Repository, Combustion Science: https://psi.nasa.gov/physci/repo/search?q=combustion
- NASA Combustion Science: https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/
- A Researcher's Guide to ISS Combustion Science: https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/
- Dietrich, Nayagam, Hicks et al. (2014), "Droplet Combustion Experiments Aboard the International Space Station" (FLEX overview), *Microgravity Sci. Technol.* 26:65–76: https://doi.org/10.1007/s12217-014-9372-2
- Nayagam, Dietrich, Hicks, Williams (2013), "Methanol Droplet Combustion in Oxygen-Inert Environments in Microgravity" (FLEX): https://ntrs.nasa.gov/citations/20130014061
- Link, Huang, Fernandez-Pello, Olson, Ferkul (2018), "The Effect of Gravity on Flame Spread over PMMA Cylinders" (BASS-II), *Sci. Rep.* 8:120, with supplementary Tables S1/S2: https://doi.org/10.1038/s41598-017-18398-4
- Urban et al. (2009), SAE ICES 2009 (SAME): https://doi.org/10.4271/2009-01-2468
- Urban et al. (2007), ISDC 2007 (DAFT, ISS cabin background aerosol): https://ntrs.nasa.gov/citations/20070031686
- Sheredy (2004), NASA Research and Technology 2004 (DAFT): https://ntrs.nasa.gov/citations/20050215648
- Stocker (2021), 33rd JASMAC (ACME): https://ntrs.nasa.gov/citations/20210021781
- Wright (2021), UMD thesis (ACME): https://hdl.handle.net/1903/27484
- Dehghani (2022), UMD dissertation (ACME): https://hdl.handle.net/1903/29303
- NASA ISS Science Blog, "Cool Flames on the International Space Station": https://blogs.nasa.gov/ISS_Science_Blog/2013/11/25/cool-flames-on-the-international-space-station-an-anatomy-of-discovery/
- Nayagam, APS abstract on cool-flame extinction: https://archive.aps.org/oss/2021/b05/1
- Nayagam et al., "Cool-flame extinction during n-alkane droplet combustion in microgravity": https://ntrs.nasa.gov/api/citations/20140006750/downloads/20140006750.pdf
- NASA Glenn Research Center release JR12-009 (2012), "An Old Theory Goes Up in Cool Flames" (2.4 mm cutoff, ~600 °C cool flames): https://press-news.org/71098-an-old-theory-goes-up-in-cool-flames.html
- Yang et al. (2015), Smoke characterization and feasibility of the moment method for spacecraft fire detection, *Aerosol Sci. Technol.* 49: https://www.nist.gov/publications/smoke-characterization-and-feasibility-moment-method-spacecraft-fire-detection
- SAME final report (NASA TM): https://www.nist.gov/node/1863886
- Particle Morphology and Size Results from SAME-2 (NTRS 20130000422): https://ntrs.nasa.gov/citations/20130000422
- NASA Spinoff, Fire Detector (1978): https://spinoff.nasa.gov/node/9407
- Apollo 1: https://sma.nasa.gov/sma-disciplines/accllp/apollo-1
- Apollo 13: https://sma.nasa.gov/sma-disciplines/accllp/apollo-13
- Fire aboard Mir: https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/
