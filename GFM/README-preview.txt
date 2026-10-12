GFM CYLINDRICAL PULSE LABORATORY v2.1.0

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

COMBINED 3D VIEW
The default presentation now has a flared wormhole-style throat. Display
shape switches back to the solved cylinder. Both use the same numerical
fields; the wormhole appearance changes display coordinates only.
Energy-flow arrows show actual instantaneous net Poynting flux: cyan
forward +z, pink returning -z. Return flow includes reflections and
interference; a backward arrow is not a global reflection coefficient.
Plasma response and Aggie response switch between absorbed power and
accumulated heat. The plasma view also offers temperature rise.
The energy panel separates deposits from thermal storage and reports
field, reversible drift, material thermal changes and artificial sponge
loss without double counting deposition. The upstream vacuum channels
are local characteristic samples, not a global reflected-energy ratio.
See docs/pulse-wormhole-display.txt for definitions and timing conventions.

The opening view shows all three calculated layers together. Wave phase
and peak envelope occupy one axial slice; the selected plasma response occupies
a crossing slice at the same physical r-z coordinates. Aggie material
surfaces show instantaneous Ohmic deposition qc in W/m3, with actual cover
temperature and liquid mass fraction in the legend. The three visibility
checkboxes change the display only; they do not turn off physical coupling.
Wall cutaway exposes the interior without changing the simulated geometry.

The phase diagnostic is based on causal field history. Its analysis time
and group delay are displayed separately from the instantaneous thermal
frame time. It references the calculated upstream TOTAL field, including
reflections. Phase is masked during warmup or when its reference is weak.
Colors identify each quantity on its own fixed scale; transparency is a
display property, not computed plasma optical depth.

SEPARATE QUANTITY VIEWS
Electric envelope: hue is probe-referenced wave phase, brightness is
history-derived peak electric amplitude on a fixed 100 V/m scale.
Plasma heating: actual temperature increase, displayed on a declared
0-0.002 K scale; absolute plasma temperature remains separately available.
Aggie cover: cover temperature and liquid mass fraction are separate
calculated material quantities. The warm-start cover preset prescribes
its initial partial liquid state. This pulse does not visibly melt it.
Cover deposition: a fixed 0-100 W/m3 scale shows local electromagnetic
energy conversion even when the thermal temperature increment is tiny.
The cover scale upper control changes only this declared display scale.

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
runtime\node.exe build-pulse-diagnostics.cjs
runtime\node.exe build-browser-backend.cjs
runtime\node.exe build-preview.cjs
runtime\node.exe make-manifest.cjs

In a restricted environment without local connection permission, use
runtime\node.exe run-checks.cjs --offline. This records four explicitly
deferred local-network checks; all selected checks must pass. The full
Run Verification.cmd remains available on a normal Windows installation.
runtime\node.exe run-checks.cjs
runtime\node.exe make-manifest.cjs

The Windows-safe package preserves prior releases and uses relative paths.
