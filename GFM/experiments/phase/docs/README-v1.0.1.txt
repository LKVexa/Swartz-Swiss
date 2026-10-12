GFM Aperture/Aggie Simulator 1.0.1

This local two-branch 3D experiment uses the existing RUSSL GFM Terminal 0.5.1
calculation modules as its backend. It needs Node.js 18 or newer and has no
downloaded dependencies. The preserved terminal is available at /terminal/.

Start
-----
Double-click Start-Simulator.cmd, or run "node launch.cjs" from this folder.
The launcher starts a playing example and prints the local browser address.
It uses 8787 by default and tries the next ten ports if that port is occupied.
Set PORT to choose another starting port. The service stays running until
stopped; Ctrl+C in the launcher stops it. Client
controls call the backend and receive calculated frames through a live event
stream; the animation itself is not a relativistic trajectory calculation.

Experiment
----------
Both branches have M=1, Q=0 and the selected a/M spin ratio. The assumed
aperture radius is r_A=r0*sqrt(1-(alphaCritical/spin)^2) for spin strictly above
alphaCritical; otherwise zero. The gaseous branch has no cover. The aggie
branch is sealed when coverLoad >= sealThreshold. The hypothetical passage bit
is one only when the geometric aperture is open and the branch is uncovered.
At the default spin 0.99, critical ratio 0.8 and r0=1, r_A is approximately
0.5891 toy length. Gaseous passage is 1; aggie passage is 0 at coverLoad=2.

Adjust spin and cover load to compare the two branches. Play and Pause control
an illustration clock; Step advances it by 0.1 second. The example experiment
runs for 12 seconds: an initial sealed aggie branch, declining cover that opens
it, then a declining spin that closes both branches. It restores defaults and
pauses at completion. Manual parameter changes cancel the scripted experiment.
Reset creates a fresh run and recording. The JSON export retains full computed
frames for inspection or future replay, without claiming physical reverse
evolution. This version has no recording-import or replay slider.

Live data and GFM
-----------------
The exterior panel reports ordinary Kerr-Newman reference quantities. The
backend evaluates nine raw aperture-law samples at alpha=j/8, j=0..8, and
applies the unchanged GF9 trace-character transform and its inverse. Samples
use polynomial integer field labels, preserve their ordinary real scale and
retain zero values. This is a parameter sweep across spin 0..1; it is neither
a spatial grid nor a history of the selected-spin model. A selected spin change
updates the live radius and exterior; the sweep changes only if its defining
critical ratio or radius scale changes. The coefficients do not infer hidden
cover type from identical exterior observations.

GET /api/state returns the current frame. GET /api/events provides a 10 Hz
stream of named "state" events while running. GET /api/health reports service
health. POST /api/parameters accepts finite values for spin, coverLoad,
alphaCritical, r0 and sealThreshold. POST /api/control accepts an action from
play, pause, step, reset, demo. Invalid updates preserve the current state.
GET /api/export.json contains complete retained frames, parameters, computed
branches, exterior, raw samples, coefficients, recovery checks and scopes.
GET /api/export.csv contains the retained numerical timeline. The recording
retains at most 1800 frames by default; exports report how many earlier frames
were dropped. Pause/parameter changes also create recorded frames.

Scientific scope
----------------
This implements the user's declared aperture/cover hypothesis. Gaseous and
solid labels are not categories inferred by standard black-hole equations.
The view does not solve evolving spacetime, particle/light geodesics, plasma,
accretion, material formation, electromagnetic fields or safe passage. The
illustrative moving matter does not supply a force law. Identical declared
exterior observations leave the branches unidentifiable under that protocol.
The GFM transform changes signal representation, not the physical equations.

Source and verification
-----------------------
backend/gfm/ and vendor/terminal/ preserve the existing terminal bytes; see
SOURCE_PROVENANCE.json and NOTICE.txt. Run "npm test" for simulation and real
HTTP/SSE tests. Network permission may be required by a restricted environment
even for local loopback tests. Mathematical checks and UI checks are recorded
under validation/ by the completed build; read their actual results before
claiming a live browser run. Preserve the original terminal releases unchanged.

Revision 1.0.1
--------------
Live event delivery now waits for a full send buffer to drain and retains only
the newest pending frame. Large history frames no longer disconnect clients.
The browser example was verified after restarting the corrected backend.
