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

> **Status (Sun 15 Nov):** the repo is being set up. The skeleton (folders, shared contracts, stub endpoints, CI) lands next. Each lane then fills in its own folder. **Final deadline: tonight, 11:59 PM.**

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

**Prerequisites:** Python 3.10+ (CI uses 3.11) and Node 18+.

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
frames:            [{t_s, voxels: [[i, j, k, concentration, smokeFrac], ...]}]   # sparse, ~2 fps
fire_area_cm2:     float      # Red's tiebreak for undetected fires
smoke_escaped:     float      # Red's tiebreak for undetected fires
spread_rate_mm_s:  float      # gravity comparison panel
```

(The last three fields are needed by Red's objective and the gravity panel. They're additive, so nothing else breaks.)

## API

| Method | Path | Owner | Screen |
|---|---|---|---|
| POST | `/api/mission` | Kishan | Mission setup |
| GET | `/api/investigations` | Kishan (data: Sibi) | Explorer |
| GET | `/api/investigations/{id}` | Kishan (data: Sibi) | Explorer |
| GET | `/api/compare?a=&b=` | Kishan | Compare |
| GET | `/api/rank?pillar=` | Kishan | Ranking |
| POST | `/api/simulate` | Kishan (engine: Ruthwik) | Habitat |
| POST | `/api/duel/run` | Kishan (agents: Kartavya) | Habitat / duel panel |
| GET | `/api/duel/{run_id}` | Kishan | Duel panel |
| POST | `/api/ask` | Kishan (witnesses: Sibi) | Ask EMBER |
| GET | `/api/gap_map` | Kishan (guard: Sibi) | Gap map |
| GET | `/api/report` | Kishan | Report |

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
FLEX,FLEX-001,n-heptane,liquid,0.21,101.3,0.0,0.0,"burn_rate;extinction_d_mm",NTRS-XXXXXXX,false
```

- `verified=false` until the owner has checked the row against the source.
- `g` is in Earth-g units (0, 0.165, 0.38, 1.0).
- Placeholder citations (`NTRS-XXXXXXX`) **must be replaced before Checkpoint 2.**

**`calibration.csv`**: the single source of truth for every physical constant in the simulator. `status` is `measured`, `fitted` or `assumed`, and the UI and deck badges are generated from it.

```csv
name,value,unit,source,status
smoke.d0_nm,300,nm,NTRS-20130000422,measured
flame.o2_exponent,0.0,-,fit:BASS-II,fitted
```

**`investigations.json`**: one object per investigation (`id, name, objective, hardware, fuel{names, phase, shape, size}, conditions{o2_frac, pressure_atm, diluents, g}, varied, held_constant, sensors, pillars, key_findings, sources`). It feeds the explorer and compare screens.

**`witness_docs/<ID>.md`**: one file per investigation with 5–15 facts, each with a real citation in brackets. Witnesses retrieve only from their own file and drop any uncited claim.

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

- **Precomputed duel:** the live duel takes about 50 s, so cache the results as JSON.
- **Offline mode:** cached LLM responses for Red seeds, "why" text and witness answers, in case venue Wi-Fi fails.
- **Validation:** LLM scenario output is schema-checked before use (material exists, coordinates inside the room, fuel phase matches the material).
- **Payload size:** sparse voxels, about 2 frames per second of simulated time.

---

## Use of AI

The EMBER idea, science framing and design are the team's own. This README was drafted with Claude (Anthropic) from the team's design document and reviewed by the team. Mark any other AI-assisted file with a one-line header comment, and list in-app LLM use here (Red seeds, "why" text, witness phrasing via the Claude API). Any AI-generated image or video must carry a visible watermark.

## Sources

- PSI Data Repository, Combustion Science: https://psi.nasa.gov/physci/repo/search?q=combustion
- NASA Combustion Science: https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/
- A Researcher's Guide to ISS Combustion Science: https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/
- Nayagam et al., FLEX results overview, *Microgravity Sci. Technol.*: https://link.springer.com/doi/10.1007/s12217-014-9372-2
- NASA ISS Science Blog, "Cool Flames on the International Space Station": https://blogs.nasa.gov/ISS_Science_Blog/2013/11/25/cool-flames-on-the-international-space-station-an-anatomy-of-discovery/
- Nayagam, APS abstract on cool-flame extinction: https://archive.aps.org/oss/2021/b05/1
- Nayagam et al., "Cool-flame extinction during n-alkane droplet combustion in microgravity": https://ntrs.nasa.gov/api/citations/20140006750/downloads/20140006750.pdf
- ISS Program Science Office, "An Old Theory Goes Up in Cool Flames": https://press-news.org/71098-an-old-theory-goes-up-in-cool-flames.html
- Yang et al. (2015), Smoke characterization and feasibility of the moment method for spacecraft fire detection, *Aerosol Sci. Technol.* 49: https://www.nist.gov/publications/smoke-characterization-and-feasibility-moment-method-spacecraft-fire-detection
- SAME final report (NASA TM): https://www.nist.gov/node/1863886
- Particle Morphology and Size Results from SAME-2 (NTRS 20130000422): https://ntrs.nasa.gov/citations/20130000422
- NASA Spinoff, Fire Detector (1978): https://spinoff.nasa.gov/node/9407
- Apollo 1: https://sma.nasa.gov/sma-disciplines/accllp/apollo-1
- Apollo 13: https://sma.nasa.gov/sma-disciplines/accllp/apollo-13
- Fire aboard Mir: https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/
