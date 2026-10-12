GFM CYLINDRICAL PULSE LABORATORY v2.0.0
Audit applied 2026-10-11

OPEN
Double-click Open GFM.cmd in this folder. The bundled local backend starts
on the first available port from 8794 through 8803 and opens the viewer.
The console identifies this version, this folder and its actual address.
Leave it running; Ctrl+C stops it. Older viewers on 8788/8791 are separate.

WHAT CHANGED
The audit is now applied to the physical model and equation registry:
causal cold collisional plasma current, reversible electron drift energy,
collision heating, stationary cover enthalpy and solid/liquid fraction,
conductivity feedback, and conservative local thermal contact.
The wave layer measures amplitude and phase from real field history;
it uses a declared upstream total-field reference and masks low signal.
Temperature, liquid fraction and geometric cover remain distinct layers.
Melting preserves the fixed cover geometry.

EXAMPLES
The default is a repeatable open-mouth plasma-pulse experiment in SI units.
Research presets include its matched full-cover case, a vacuum comparison,
and a warm-start synthetic cover midway through a declared melting interval.
That last preset prescribes its initial phase state; it does not claim the
small incoming pulse melted the cover. Controls restart the initial data,
phase history and energy ledger together. Run/Pause, Step, Reset and data
export operate on calculated backend fields.

EQUATIONS AND REFERENCES
The original neutral CGLE cylinder reference remains separate. The complete
A01-A38 audit registry preserves dispositions and source provenance.
Corrected GR reference calculators cover stresses/NEC, throat conditions,
double-null mass, future outer signs, two-exterior thin-shell pressure and
potential, and Kerr spin/scale definitions. These are algebraic references;
they do not evolve the local EM cylinder into a spacetime solution.
Undefined cross-domain, latency or Galois laws are not silently executed.

READ THE MODEL
docs/scientific-specification.txt describes equations, units, numerical
schemes, phase window/reference, energy ledger and exact scope.
docs/audit-scope.txt maps this implementation to the authorizing request.
docs/GFM-Review-Editable.txt is an unchanged copy of the attached review.
docs/GFM-Audit.pdf is the full preceding 24-page audited derivation.
docs/scientific-specification-v1.txt preserves the earlier specification.

REPRODUCE
All 74 physics, GR, mapping, HTTP and launcher checks passed for this release.
Run Verification.cmd repeats them. The HTTP tests start/stop their own
test servers automatically.
validation/all-tests.txt and final-verification.json record actual results.
runtime\node.exe generate-audited-example.cjs regenerates the controlled
open/covered exports in examples/audited-*.json.
outputs/GFM-Audited-Model.png shows the calculated v2 example, including
history-derived wave phase, plasma temperature rise and the energy ledger.
The older examples and scientific figures remain historical v1 outputs;
their metadata describes that earlier Ohmic model, not the v2 plasma run.

HTTP API
GET /api/state, /api/health, /api/export, /api/phase-reference
GET /api/audit, /api/gr-reference, /api/presets
POST /api/control {action:"play"|"pause"|"step"|"reset"}
POST /api/control {parameters:{...}} or {preset:"plasma-pulse"}
POST /api/gr-reference {calculator:"morrisThorne",parameters:{...}}
Reference results never modify physical state or infer passage.

WINDOWS PACKAGE
Use D:\Codex\GFM-Cylindrical-Pulse-Simulator or another short local folder.
The launcher quotes paths, supports spaces, verifies packaged file hashes,
and rejects paths above 240 characters with a concrete remedy. It locates
the bundled runtime relative to itself. No security settings or system
folders are changed, and earlier JA21/GFM releases are preserved.
After intentional edits, regenerate the manifest:
runtime\node.exe make-manifest.cjs

SCIENTIFIC CLAIM
This is an axisymmetric local Maxwell/Drude/material experiment with
synthetic constitutive parameters, not a measured aggie, relativistic
black-hole simulation, solved traversable wormhole, or general 3D plasma.
Verification of tested equations is not validation against astronomical
observations or NASA certification. Interface and nonlinear-feedback
convergence, material calibration and observation-model comparisons remain
future research work. See the recorded verification scope for exact limits.

PREVIEW STATUS
All backend/API/launcher checks passed. Codex's browser preview timed out
connecting to the local server, so interactive browser visual verification
remains incomplete. The scientific v2 plate was rendered from exported data
and inspected directly. The local launcher prints its actual address.

