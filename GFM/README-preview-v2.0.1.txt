GFM CYLINDRICAL PULSE LABORATORY v2.0.1

OPEN THE LIVE PREVIEW
Open GFM.cmd now opens Open GFM Preview.html. The HTML preview contains
the audited calculation in a dedicated browser worker, so a separate
localhost connection is not required. You can also open the HTML file
directly. The Codex conversation provides the same live viewer inline.
If its preview frame blocks workers, the same solver runs locally in
serial chunks that yield between calculation steps. Diagnostics identify
which execution mode is active. Neither mode requires an HTTP connection.

The opening example calculates the covered-plasma experiment to 2 ns and
then pauses. Startup progress reports the actual calculated time. Run
continues the calculation, Step advances it, and Reset starts at time zero.
Changes to physical parameters or example presets restart the model.
Allow the phase history to warm up after a reset or parameter change.

LAYERS
Electric envelope: hue is probe-referenced wave phase, brightness is
history-derived peak electric amplitude on a fixed 100 V/m scale.
Plasma heating: actual temperature increase, displayed on a declared
0-0.002 K scale; absolute plasma temperature remains separately available.
Aggie cover: cover temperature and liquid mass fraction are separate
calculated material quantities. The warm-start cover preset prescribes
its initial partial liquid state. This pulse does not visibly melt it.

TRANSPORT AND VERIFICATION
The worker includes the unchanged audited equation module sources.
Exact initial-state and evolved-field parity against the Node backend is
tested for phase, plasma, cover, source work and the energy ledger.
The diagnostics identify the version, transport and original engine hash.
The source audit registry, neutral reference and GR calculators are included.
Export calculated data downloads the actual worker state.

Open HTTP Backend.cmd still starts the ordinary local HTTP API for external
tools. It binds only 127.0.0.1 and retains host/origin protections. Expensive
calculations are now scheduled serially, leaving time to handle controls.

SCOPE
This is the existing local axisymmetric Maxwell/Drude/enthalpy model with
synthetic constitutive parameters. No new relativistic or observational
validation claim is introduced by the preview transport. The scientific
specification and v2.0 audit documentation continue to describe the model.

REBUILD AFTER INTENTIONAL SOURCE EDITS
runtime\node.exe build-browser-backend.cjs
runtime\node.exe build-preview.cjs
runtime\node.exe make-manifest.cjs
runtime\node.exe run-checks.cjs
runtime\node.exe make-manifest.cjs

The Windows-safe package preserves prior releases and uses relative paths.
