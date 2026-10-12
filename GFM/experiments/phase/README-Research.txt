GFM Research Observatory 2.0.0

Start
-----
Double-click Start-Simulator.cmd and keep its window running. Open the printed
local address. The launcher tries ports 8787 through 8797. Node 18 or newer is
required; the launcher also recognizes the installed Codex Node runtime.
Start-Research.cmd starts its search at port 8791 to avoid older instances.
No external packages, downloaded assets, accounts or cloud services are used.

The scientific upgrade
----------------------
Physical exterior displays calculated neutral Kerr null geodesics. Adaptive
Dormand-Prince RK5(4) integrates Carter's separated equations in Mino parameter.
Rays have E=1, specified axial angular momentum and Carter constant. The solver
measures normalized metric-null, radial/polar first-integral and reconstructed
constant errors. A worker keeps controls responsive. Changed spin or settings
clear outdated paths until the matching calculation finishes.

G=c=M=1; numeric coordinate lengths are in gravitational-radius units M.
The y axis is the spin axis. The world uses an oblate coordinate embedding
with uniform display scale 0.2; displayed distances are not proper distances.
The default finite starting radius is 20 M. Chosen asymptotic impact coordinates
define the bundle. This is a 3D path visualizer, not a local-tetrad camera image
or a radiative-transfer solver.

Change Shared spin, Viewing inclination, Numerical accuracy or Ray bundle.
Both branches share the same Kerr exterior inputs and calculated light paths.
The aggie cover does not alter established Kerr geometry in this model.
Glow, disk, stars and motion are illustrative.

Aperture hypothesis retains the experimental aperture/cover rules and the
12-second parameter example. It is separate from the physical exterior.
These laws have no observational validation here. No wormhole metric,
formation, matter surface, electromagnetic hazard or safe passage is solved.
Play controls illustration and the script; that clock is not affine parameter,
Mino parameter or Boyer-Lindquist coordinate time.

GFM terminal
------------
Original calculation modules and terminal files remain byte-identical;
SOURCE_PROVENANCE.json records their hashes. /terminal/ opens the terminal.
GF9 applies the unchanged trace-character transform to nine raw aperture-law
samples across spin. It represents a signal; it does not modify spacetime or
recover missing information about a hidden cover.

Scientific evidence
-------------------
Read docs/README-science.txt, docs/scientific-validation.txt and docs/sources.json.
Read validation/research-tests.txt and independent-relativity results for
actual acceptance evidence. Benchmarks include Schwarzschild capture, photon
sphere, weak-field bending and equatorial Kerr photon orbits. Numerical
refinement and constraints are separate from empirical validation.
No external observational validation has been performed for this application.
NASA-STD-7009B guides the credibility documentation. This software is not
NASA certified, approved or a mission-ready prediction system.

Capture uses an exterior guard plus an allowed continuation to the horizon;
the solver does not integrate inside. Other stopping reasons stay unresolved.
Near-critical outcomes can depend on accuracy and require refinement.

Exports and reproducibility
---------------------------
/api/physics-export.json exports full point records, starting data, constants,
coordinates, affine/Mino/time values, stopping reasons, residuals and source
hashes. /api/export.json adds hypothesis history and the current calculation.
Previous physics settings are not a retained physics history; export a solved
configuration before changing it.

/api/state and /api/events provide composite data. The stream runs at 10 Hz while
playing and coalesces pending states under send-buffer pressure.
POST /api/parameters changes hypothesis controls and shared spin.
POST /api/physics accepts observerRadius 12..100, inclinationDeg 15..165,
rayCount 8..32 (integer), tolerance 1e-10..1e-4.
POST /api/control accepts play, pause, step, reset, demo.
/api/provenance separates loaded calculation-source hashes from current file
hashes. Worker hashes travel with the selected result. Restart after changing
source files; reloading the webpage alone does not reload backend modules.

Run npm test (or node --test tests/*.cjs). Preserved v1 examples and validation
records are predecessor evidence; Kerr outputs and research validation are
identified separately. Original releases remain unchanged. GPL3 notices apply.
