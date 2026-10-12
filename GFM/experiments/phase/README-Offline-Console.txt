GFM phase, aperture and Kerr experiment inside the JA21 console

Entry: https://gfm.ja21.invalid/experiments/phase/public/index.html
The native host maps the enclosing GFM folder. No HTTP server or external browser
is required. The experiment starts paused, and leaving its page terminates all
three local workers. The parent console keeps one active experiment at a time.

Computed features
- phase-worker.js executes the unchanged phase-mhd.js and phase-session.js cores:
  local periodic nonrelativistic MHD, phenomenological complex phase, separate
  approximate iron enthalpy fields and raw reversible GF(9) samples.
- console-worker.js executes literal unchanged CommonJS simulation/GFM modules:
  aperture/cover rules, raw finite-field sample transforms and retained exports.
  The two-branch demo is a scripted 12-second parameter experiment, not a physical
  formation model. Its .1-second illustration clock targets 10 wall-clock Hz.
- relativity-worker.js executes the unchanged backend/relativity.cjs solver:
  actual adaptive Dormand-Prince RK5(4) Kerr exterior photon trajectories and
  first-integral diagnostics. A changed input clears old rays until a matching
  computation is accepted; there is one active job plus one latest wanted input.
- console-worker.js recomputes the original observation buildReport using the
  exact bundled dataset, protocol and publisher source bytes. The 173 training
  and 146 held-out rows retain the failed geometric-model result. This does not
  validate the local phase, iron, aperture, passage or formation assumptions.

Performance and numerical contract
The numerical increment remains .05 with the original internal CFL/substep laws.
Phase steps use maximum serial throughput with no artificial frame-rate cap or
sleep fraction. One completed step may emit one outstanding streamed frame.
After clients accept it and schedule a latest-only paint, they ACK its exact
stream identity. Serial calculation continues while that frame is in flight;
only the latest complete calculated snapshot is retained, replacing older ones
without additional posts. Credit publishes that actual latest snapshot, with no
interpolation or invented intermediate data. There is no posted-frame backlog.
Work time is measured by EWMA for reporting, not used to slow the phase worker.
Pause cancels the future timeout and freezes calculated fields; a late ACK
cannot restart a paused run. The independent toy illustration still targets 10Hz.
The frontend coalesces pending frames into the latest requestAnimationFrame.
The aperture renderer redraws for state, camera or resize changes; it has no
continuous background repaint loop while paused. Phase status displays measured
view fps, delivered solver steps/s and measured step cost. These are separate
from the simulated time, the ray integrator timing and physical validity.

Browser API
window.GFM_PHASE_LOCAL.ready: promise for actual phase and illustration worker
initialization. request(path,{method,body}) returns computed objects, not HTTP
responses. subscribe()/subscribePhase() return unsubscribe functions. snapshot(),
phaseSnapshot(), getPerformance(), close() are available to the native verifier.
window.GFM_PHASE_PERFORMANCE is a read-only current measurement snapshot.
window.GFMPhaseView.getSnapshot()/getStatus() identify displayed field data.
window.GFMObservatory.getSnapshot()/getRendererStatus() identify branches/rays.

Logical message endpoints (no network API requests)
GET /api/state, /api/phase, /api/physics, /api/observations, /api/provenance
POST /api/parameters: spin, coverLoad, alphaCritical or other original toy inputs
POST /api/control: {action:play|pause|step|reset|demo}
POST /api/phase/parameters: original phase parameter patch
POST /api/phase/control: {action:play|pause|step|reset}
POST /api/physics: observerRadius, inclinationDeg, rayCount, tolerance
GET /api/export.json, /api/export.csv, /api/phase/export.json,
    /api/physics-export.json (full original sampled trajectories + diagnostics)
Exports are local Blob downloads. Hash retrieval on field export uses only the
same mapped origin; it identifies served bytes, not independent loaded-byte
attestation. The native release manifest and deterministic build receipts cover
generated workers and source identities.

Source preservation and deliberate changes
Numerical cores and observational calculations are unchanged: backend/phase-mhd.js,
phase-session.js, simulation.cjs, relativity.cjs, observations.cjs and original
backend/gfm modules. Original archive bytes remain in root provenance.
Changed integration modules: public/index.html (relative navigation/assets),
public/app.js and phase-app.js (local APIs/exports/coalescing), public/phase-worker.js
(relative dependencies + serial ACK scheduler), public/renderer.js (dirty redraw),
backend/phase-service.cjs (ACK compatibility for the historical Node transport).
tests/phase-worker-parity.cjs now drives adaptive timeouts and relative imports;
only transport/performance metadata is excluded from numeric equality checks.
New bundles/helpers are generated by browser/build-console-core.cjs and
browser/build-relativity.cjs. Rebuild after source edits, then regenerate the
parent GFM and native integrity manifests. Historical HTTP launchers and earlier
validation reports remain source history; they are not the integrated entry.

Validation
tests/offline-console.cjs executes all three production browser-worker branches
in isolated JS realms without fetch and compares fields, calculated Kerr rays,
atomic input rejection and the complete recomputed observation report.
validation/offline-pipeline-tests.json records 59 passing non-HTTP checks,
including exact browser/Node parity, stale-credit handling and the preserved
Node phase-service transport. The parent also retains earlier regression runs.
validation/adaptive-worker-benchmark.json preserves the earlier 60Hz target capture.
validation/serial-worker-benchmark.json preserves the first ACK-paced capture.
validation/pipeline-worker-benchmark.json records maximum serial Node-worker
throughput and freeze checks at 16, 32 and 64 cells per side. Those measurements
do not claim browser/native rendering performance; the parent native probe
measures the actual embedded controls and renderer separately.
