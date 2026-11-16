# EMBER

**Exploration Multi-agent Burn Evaluation Range.** A fire-safety dashboard and adversarial simulator for crewed lunar and Martian habitats, built on NASA Physical Sciences Informatics (PSI) combustion data.

NASA Space Apps Challenge 2026. **Live demo: https://ember-murex-gamma.vercel.app**

EMBER does two things:

1. **Dashboard.** It summarizes the PSI combustion investigations that matter for fire safety, ranks them for your habitat, compares them side by side, answers questions with citations, and writes an insights report.
2. **Adversarial simulator.** In a virtual habitat, a **Red** agent searches for the fire that is hardest to detect and a **Blue** agent searches for the detector layout and response that catches it. The physics is a fast reduced-order model calibrated to ISS experiments.

One rule runs through all of it: **every number shows how much real data backs it.**

| Badge | Meaning |
|---|---|
| 🟢 Measured | Inside conditions a PSI experiment actually tested |
| 🟡 Interpolated | Between tested conditions. This includes **every** result at lunar or Martian gravity |
| 🔴 Extrapolated | Outside every tested condition |

## Try it now

**Open https://ember-murex-gamma.vercel.app** in any modern browser. Nothing to install, nothing to run on your own computer.

1. Pick a habitat (try **Moon base**), step through **Experiment explorer** and **Ranking**, then press **Start project**.
2. The Red vs Blue duel and the Ghost Flame scenario run on their own; watch the agents feed and the progress bar.
3. When the bar finishes, open **Insights / Report**. Ask EMBER a question at any time, and use **Go inside the habitat** for the 3D smoke view.

The site is hosted on Vercel, with its backend on Render's free tier. If nobody has used it for a while, the backend is asleep and the first load can take about a minute. After that it responds normally.

---

## Why this matters

**The oxygen paradox.** To shorten spacesuit pre-breathe, Moon bases and pressurized rovers are planned to run a lower-pressure, oxygen-enriched atmosphere.

| Environment | O₂ mole fraction | Total pressure | O₂ partial pressure |
|---|---|---|---|
| Earth, sea level | 20.9% | 14.7 psi | ≈ 3.07 psi |
| Moon base / rover (planned) | ≥ 30% | ≤ 10.2 psi | ≈ 3.06 psi |
| Spacesuit | 100% | 4.3 psi | 4.3 psi |

The oxygen *partial pressure* is almost the same as on Earth, so breathing feels normal. The oxygen *fraction* is about 40% higher, so there is less nitrogen to absorb flame heat, and flammability tracks the fraction far more than the partial pressure.

**Gravity.** On Earth, buoyancy carries smoke up to ceiling detectors. On the ISS there is essentially no buoyancy: the SAME experiment found that smoke transport is dominated by mixing and detection takes longer. At lunar gravity (1/6 g) buoyancy is weaker but not absent.

**Data.** PSI holds combustion data at 0 g (ISS) and 1 g (ground), and none in between. Those two ends bound what should happen on the Moon and Mars. The data is spread across many investigations, hardware sets and fuel types, which makes it hard to find and compare. EMBER brings it together and is explicit about where it runs out.

## What you can do with it

1. **Set up a mission.** Pick a habitat (spacecraft, ISS, Moon base, Mars base, pressurized rover) and adjust gravity, oxygen, pressure, materials on board and ventilation. The planet on screen changes with it, and the sky follows your local time of day (with a day/night toggle).
2. **Explore the experiments.** A summary card for each investigation (objective, hardware, fuel, conditions, what was varied, sensors, key findings, sources), with side-by-side compare.
3. **Rank them for your mission.** Investigations are scored by how close their real test conditions are to yours, filterable by prevention, detection and suppression, each with a one-line reason.
4. **Watch the agents.** As soon as setup is done, the Red vs Blue duel runs on its own, followed by a liquid-fuel scenario where the **Ghost Flame Auditor** flags a fire that a camera would report as out. A live feed shows each move while it appears on the habitat, and a progress bar shows how far along both runs are.
5. **Go inside the habitat.** A 3D room view plays the smoke simulation. Click the floor to move the fire and run it again.
6. **Ask EMBER.** The witness for the investigation that best matches your question answers it, citing every fact.
7. **Read the insights report.** It opens once both runs finish: top risks, recommended fixes, the duel and the Ghost Flame results, a gravity comparison, a map of untested conditions, and Earth applications. Export as JSON or print to PDF.

## Challenge alignment

| Requirement | EMBER feature |
|---|---|
| Summarize findings | Experiment explorer |
| Compare investigations | Side-by-side compare |
| Rank findings | Mission-specific ranking by fire-safety pillar |
| Interpret findings | Simulation, Red vs Blue duel, Ghost Flame Auditor, Ask EMBER |
| Relevant habitats | Spacecraft, space station, Moon base, Mars base, pressurized rover |
| Predictive modeling | Calibrated reduced-order physics with a data-backing badge on every result |
| Next-generation equipment | Detector placement, two-moment smoke/dust discrimination, extinguishment verification |
| Earth applications | Hospital oxygen therapy, submarines, aircraft cargo holds, mines |
| Multi-agent intelligence | Red, Blue, Ghost Flame Auditor, Envelope Guard, Witnesses |

---

## How it works

```
┌──────────────────────────────────────────────────────────────┐
│ Frontend (React + React Three Fiber)                         │
│  Mission setup · explorer · ranking · planet · room · report │
└───────────────────────────────┬──────────────────────────────┘
                                │ HTTP / JSON
┌───────────────────────────────▼──────────────────────────────┐
│ API (FastAPI)                                                │
└───┬───────────────┬────────────────┬───────────────┬─────────┘
┌───▼─────┐   ┌─────▼──────┐   ┌─────▼──────┐  ┌─────▼────────┐
│ Red     │──▶│ Physics    │◀──│ Blue       │  │ Rank, compare│
│ agent   │   │ engine     │   │ agent      │  │ report       │
└─────────┘   └─────┬──────┘   └────────────┘  └──────────────┘
    ┌───────────────┼────────────────┐
┌───▼──────┐  ┌─────▼──────┐  ┌──────▼─────┐
│ Envelope │  │ Ghost      │  │ Witness    │
│ Guard    │  │ Flame      │  │ agents     │
└──────────┘  └────────────┘  └────────────┘
┌──────────────────────────────────────────────────────────────┐
│ Data: tested conditions · calibration · summaries · facts    │
└──────────────────────────────────────────────────────────────┘
```

### Physics engine

A reduced-order model, not CFD. Each term traces to one investigation, and every constant lives in `data/calibration.csv` with its source and a status of measured, fitted or assumed.

- **Smoke and dust** move on a 3D grid through ventilation flow, mixing and buoyancy. Buoyant velocity scales with g^(1/3), giving about 0.55× Earth's on the Moon and 0.72× on Mars.
- **Flame spread** depends on oxygen fraction and airflow, with a low-flow limit where the flame starves and a high-flow limit where it blows off. PMMA is fitted to BASS-II rod data and cotton to BASS fabric data.
- **Detectors.** A single-measurement detector alarms on concentration and cannot tell smoke from dust. A two-moment detector also estimates particle size, so it can ignore coarse regolith dust. Smoke particle size and aging are fitted to SAME-R.
- **Suppression** uses the limiting oxygen levels FLEX measured for burning droplets with CO₂ and helium.

### Agents

- **Red** seeds every material at both ends of the room, then refines the worst fire with CMA-ES.
- **Blue** optimizes detector positions, ventilation shutoff time and suppressant against Red's worst fire, with a penalty for dust false alarms.
- **Ghost Flame Auditor.** FLEX found that large heptane droplets keep burning as invisible cool flames after the visible flame goes out. After any suppression of a liquid fuel, the auditor checks whether conditions are inside the range where FLEX observed this and warns that a camera-only "fire out" may be wrong. It makes no claim for solids or outside that range.
- **Envelope Guard** measures how far a condition is from the nearest real test and assigns the badge.
- **Witnesses.** One agent per investigation. Each answers only from that investigation's fact file, where every fact carries a citation. A question no witness has data on gets "no cited PSI data on this", not a guess.

---

## NASA data

| Investigation | What EMBER uses it for |
|---|---|
| BASS, BASS-II | Flame spread over solids vs. oxygen and airflow; low-flow quenching |
| SAME, SAME-R | Smoke particle size, aging, detector response in microgravity |
| DAFT, DAFT-2 | Background dust on the ISS; the false-alarm reference |
| FLEX, FLEX-2 | Droplet extinction with CO₂ and helium; cool flames |
| ACME (BRE) | Flames at habitat atmospheres, including 10.2 psia |
| CFI, SPICE, SLICE | Listed in the explorer; summaries not yet filled in |

- `data/tested_conditions.csv` holds **48 real test conditions; 45 are verified** against their sources. The other 3 are ground-lab rows whose lab pressure the paper does not state.
- `data/calibration.csv` holds the simulator's **60 constants: 22 measured, 10 fitted, 28 assumed**. The assumed ones are mainly mixing, smoke yields, detector thresholds and dust values.
- `data/VERIFICATION.md` records, row by row, what each source confirms and what was inferred. Values read off published figures are labeled as digitized.
- `data/witness_docs/` holds the cited facts the witnesses answer from.

## Results

These come from `deck_numbers.json`, which `backend/scripts/metrics.py` generates. Each carries its badge and calibration status.

| Result | Value | Backing |
|---|---|---|
| Time to first alarm, same PMMA fire, ceiling detector, vents on: Earth / Mars / Moon | 132.5 s / 187.5 s / 253.5 s | 🟡, transport constants assumed |
| Same fire at 0 g | Not detected within 300 s | 🟡, transport constants assumed |
| Red's worst fire before Blue: detected within 300 s? | No, in all 5 seeds | 🟡 |
| Same fires after Blue's layout: mean / worst time to alarm | 6.6 s / 13.1 s | 🟡 |
| Dust-only false alarms: single vs. two-moment detector | 5.6% vs. 0% | 🔴, dust and threshold values assumed |
| Liquid-fuel suppressions where a camera-only check would miss a cool flame | 26% of a sweep across FLEX's range and beyond | 🟡 |
| Witness answers: correct witness / every claim cited | 15 of 15 / 15 of 15 | Our own question set |

Regenerate with `cd backend && python -m scripts.metrics` (about 3 minutes).

## Honesty rules and limitations

1. **One source of truth.** Every constant is in `calibration.csv` with a source and status. Badges are generated, never hand-labeled.
2. **Partial gravity is always interpolated.** PSI has no data between 0 g and 1 g.
3. **Ghost Flame applies to liquid fuels only**, inside FLEX's measured range.
4. **Suppression limits are droplet-scale.** Applying them to a whole cabin is extrapolation.
5. **Tests state their setup.** When real data contradicted a test, we changed the test and recorded why.

What EMBER does not yet show:

- **Red does not outperform random search.** With the same budget, both find fires that go undetected, and the scoring cannot separate them. Red's value today is the scenarios it surfaces, not a search advantage.
- **Red searches every fuel in the data,** not only the materials listed for the mission, so its top risks can be fuels the mission does not carry.
- **Nearly half the simulator's constants are assumed.** Detection times depend on them, which is why those results are badged 🟡 or 🔴.
- **Coverage is pooled across investigations.** A Moon-base atmosphere can badge as tested because ACME burned gas flames there; no solid flame-spread data exists above 21% O₂.
- **The witness score is an upper bound.** We wrote the 15 questions ourselves.

---

## Run it locally

Only needed for development; to use EMBER, open the [live demo](https://ember-murex-gamma.vercel.app). Requires Python 3.9 or later and Node 18 or later.

```bash
git clone https://github.com/ruthwik-dhama/ember.git
```

```bash
cd ember
```

One-time setup:

```bash
python3 -m venv backend/.venv
```

```bash
backend/.venv/bin/pip install -r backend/requirements.txt
```

```bash
cd frontend && npm install && cd ..
```

Start both servers and open the app (macOS and Linux):

```bash
./start-ember.sh
```

Or run them separately: `.venv/bin/python -m uvicorn ember.api:app --port 8000` from `backend/`, and `npm run dev` from `frontend/`, then open http://localhost:5173.

Tests:

```bash
backend/.venv/bin/python -m pytest backend/tests -q
```

EMBER runs fully offline; without a connection the interface uses its bundled fonts. The duels for the preset missions are precomputed and committed, so the demo loads instantly; a custom mission runs a fresh duel in about a minute. Setting the `ANTHROPIC_API_KEY` environment variable is optional and lets Claude suggest Red's starting scenarios and phrase witness answers.

## Host your own copy

The live demo runs the frontend on **Vercel** and the FastAPI backend on **Render**, both on free plans. The backend runs as one long-lived server rather than serverless functions, because it keeps the current mission in memory, caches duels on disk and streams duels that run up to about a minute.

1. **Backend on Render.** Create a Web Service from this repository with:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn ember.api:app --host 0.0.0.0 --port $PORT`
   - Environment variable: `PYTHON_VERSION` = `3.11.9`

   When it is live, `https://<your-service>.onrender.com/api/health` returns `{"ok": true, ...}`.
2. **Point the frontend at it.** In `frontend/vercel.json`, change the rewrite destination to your Render URL. This forwards `/api/*` from the Vercel site to the backend, so the app keeps using relative API paths and needs no CORS setup.
3. **Frontend on Vercel.** Import the repository, set Root Directory to `frontend`, and keep the detected Vite preset. Vercel redeploys on every push; Render's free tier needs a manual deploy for backend changes unless you connect the repository through GitHub.

## Repository layout

```
backend/ember/
  api.py            FastAPI routes
  config.py         shared models: SimConfig, FireSpec, Detector, DustEvent, Mission
  sim/              physics engine, flame spread, materials, suppression, metrics
  agents/           Red, Blue, Ghost Flame Auditor, Witnesses
  envelope/         Envelope Guard and gap map
  rank/, report/    ranking, compare, insights report
backend/scripts/    metrics.py (deck numbers), precompute_duels.py
backend/tests/      74 tests
data/               tested conditions, calibration, summaries, cited facts, verification sheet
frontend/src/       React app: setup, planet, room view, panels, report
deck_numbers.json   generated results
```

## API

| Method | Path | Purpose |
|---|---|---|
| GET, POST | `/api/mission` | Read or set the mission |
| GET | `/api/investigations`, `/api/investigations/{id}` | Investigation summaries |
| GET | `/api/compare?a=&b=` | Compare two investigations |
| GET | `/api/rank?pillar=` | Rank investigations for the mission |
| POST | `/api/simulate` | Run one fire scenario |
| POST | `/api/duel/run`, `/api/duel/stream` | Run a Red vs Blue duel; the stream sends live events |
| GET | `/api/duel/{run_id}` | Fetch a finished duel |
| POST | `/api/ask` | Ask the witnesses |
| GET | `/api/gap_map` | Data-backing badge for each oxygen × airflow condition |
| GET | `/api/report` | Insights report |

## Team

| | |
|---|---|
| **Ruthwik** | Physics engine and calibration |
| **Kartavya** | Red, Blue and Ghost Flame agents; 3D habitat and planet |
| **Sibi** | NASA data, verification, Envelope Guard, Witnesses |
| **Kishan** | API, ranking, report, metrics, integration |
| **Kavin** | Pitch and demo |

## Built with

- **Backend:** Python, FastAPI, NumPy, SciPy, pycma (CMA-ES)
- **Frontend:** React, three.js with React Three Fiber and drei, Vite
- **Fonts:** General Sans (Indian Type Foundry, via Fontshare), Instrument Serif and Instrument Sans (SIL Open Font License)
- **Visual design** inspired by the [Landfall](https://www.framer.com/marketplace/templates/landfall/) template on Framer, recreated from scratch; no template code or assets are used

## Use of AI

The idea, science framing and design decisions are the team's own. We used Claude (Anthropic) as a coding and research assistant to draft code across the project, read papers and extract values, and draft documentation, including this README. The team reviewed that work, and every extracted value cites its source in `data/`. AI-assisted source files say so in a header comment.

Inside the app, Claude is optional: with an API key it suggests Red's starting scenarios and phrases witness answers, which remain limited to cited facts. No AI-generated images, video or audio are used.

## Sources

**NASA and PSI**
- PSI Data Repository, Combustion Science: https://psi.nasa.gov/physci/repo/search?q=combustion
- NASA Combustion Science: https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/
- A Researcher's Guide to ISS Combustion Science: https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/

**BASS, BASS-II**
- Link, Huang, Fernandez-Pello, Olson, Ferkul (2018), "The Effect of Gravity on Flame Spread over PMMA Cylinders", *Sci. Rep.* 8:120: https://doi.org/10.1038/s41598-017-18398-4
- Zhao, T'ien, Ferkul, Olson (2015), "Concurrent flame growth, spread and extinction over composite fabric samples in low speed purely forced flow in microgravity", NTRS 20150008962: https://ntrs.nasa.gov/citations/20150008962

**FLEX, FLEX-2**
- Dietrich, Nayagam, Hicks et al. (2014), "Droplet Combustion Experiments Aboard the International Space Station", *Microgravity Sci. Technol.* 26:65–76: https://doi.org/10.1007/s12217-014-9372-2
- Nayagam, Dietrich, Hicks, Williams (2014), "Cool-flame extinction during n-alkane droplet combustion in microgravity", NTRS 20140006750: https://ntrs.nasa.gov/citations/20140006750
- Nayagam, Dietrich, Hicks, Williams (2013), "Methanol Droplet Combustion in Oxygen-Inert Environments in Microgravity", NTRS 20130014061: https://ntrs.nasa.gov/citations/20130014061
- NASA Glenn Research Center release JR12-009 (2012), "An Old Theory Goes Up in Cool Flames": https://press-news.org/71098-an-old-theory-goes-up-in-cool-flames.html
- NASA ISS Science Blog, "Cool Flames on the International Space Station": https://blogs.nasa.gov/ISS_Science_Blog/2013/11/25/cool-flames-on-the-international-space-station-an-anatomy-of-discovery/

**SAME, SAME-R, DAFT**
- Urban et al. (2012), "Particle Morphology and Size Results from SAME-2", NTRS 20130000422: https://ntrs.nasa.gov/citations/20130000422
- Urban et al. (2009), SAE ICES 2009-01-2468: https://doi.org/10.4271/2009-01-2468
- Yang et al. (2015), "Smoke characterization and feasibility of the moment method for spacecraft fire detection", *Aerosol Sci. Technol.* 49: https://www.nist.gov/publications/smoke-characterization-and-feasibility-moment-method-spacecraft-fire-detection
- SAME final report (NASA TM): https://www.nist.gov/node/1863886
- Urban, Ruff, Sheredy, Funk (2007), ISDC 2007, NTRS 20070031686: https://ntrs.nasa.gov/citations/20070031686
- Sheredy (2004), NASA Research and Technology 2004, NTRS 20050215648: https://ntrs.nasa.gov/citations/20050215648

**ACME**
- Stocker (2021), 33rd JASMAC, NTRS 20210021781: https://ntrs.nasa.gov/citations/20210021781
- Wright (2021), University of Maryland thesis: https://hdl.handle.net/1903/27484
- Dehghani (2022), University of Maryland dissertation: https://hdl.handle.net/1903/29303

**Suppression and history**
- Wu and Ruff (2004), "Carbon Dioxide Dispersion in the Combustion Integrated Rack Simulated Numerically", NTRS 20050215297: https://ntrs.nasa.gov/citations/20050215297
- NASA Spinoff, Fire Detector (1978): https://spinoff.nasa.gov/node/9407
- Apollo 1: https://sma.nasa.gov/sma-disciplines/accllp/apollo-1
- Apollo 13: https://sma.nasa.gov/sma-disciplines/accllp/apollo-13
- Fire aboard Mir: https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/
