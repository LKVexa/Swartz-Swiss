GFM PHASE TEXTURE SIMULATOR 3.0.0 — JA21 CONSOLE INTEGRATION
Prepared 2026-10-11

The supplied JA21 blank console is preserved, with a new integration launcher.
The phase simulator runs as a separate local calculation service and appears
inside that native content surface. Keep the two release folders together:
  JA21_GFM_Console
  GFM_Phase_Texture_Backend

Native entry: JA21_GFM_Console/Start GFM Console.cmd
The launcher uses exactly http://127.0.0.1:8791/, checks the product/version,
computed phase schema and running-source identity before attaching, and stops
only a backend process it owns after the console closes. An unrelated service
on that port is left untouched. All original console files and seals are kept.
The calculation runtime is bundled beside the backend with its license and
verified official Node 24.19.0 Windows x64 checksum.

The native launcher was parsed and its source integrity checked. Windows
blocked its lifecycle test because script execution is disabled. No new script
policy bypass or persistent policy change is included. The native JA21 window
and GFM inside that native window are therefore not verified in this release.
Use your normal authorized Windows script policy to run it; the package does
not change that policy.

WORKING EXAMPLE ALREADY OPEN
http://127.0.0.1:8788/phase-console.html
This example uses the identical tested numerical core in a browser Worker on
the existing running server, labelled Local compute engine. The full v3 service
uses a Node worker and is labelled Server compute engine. Original v2 content
was not replaced: the live example adds a separate entry and assets. This
browser example requires the existing host at 8788 to remain running.
To run the standalone v3 backend, use GFM_Phase_Texture_Backend/Start-Phase.cmd.
That launcher starts at 8791 and may select a nearby free port; the native JA21
launcher always uses its narrower existing allowed origin at 8791.

WHAT IS COMPUTED
- Compressible nonrelativistic MHD in a 32x32 periodic local plasma box, with
  density, velocity, thermal pressure/temperature, magnetic field, current,
  electric field, resistivity, viscosity and heat conduction.
- An advected, neutral complex Ginzburg-Landau order parameter. Its phase,
  raw amplitude and signed finite-grid winding drive the texture. Plasma
  temperature/density/magnetic energy affect declared phenomenological growth.
- Magnetic direction/strength, plasma density/temperature, and a hydrogen
  ionization reference diagnostic are selectable actual-cell views.
- A separate approximate iron enthalpy/heat-diffusion laboratory with solid,
  liquid, neutral-vapor and ionized-vapor fractions and explicit heat balance.
- Raw complex samples pass through the preserved GFM GF(9) transform and back.
  No normalization is applied and the transform does not alter the MHD law.
- The prior 3D Kerr light-path and aperture/aggie hypothesis views remain below
  the field panel. Spin/cover are hypothesis controls, not local MHD laws.

Controls: choose a field, Play/Pause/Step/Reset, adjust field parameters, inspect
actual cells with pointer or arrow keys, and export the whole computed frame.
Changing a field parameter creates a repeatable initial condition at time zero.
Color scales and units are shown; phase brightness is scaled to the current
maximum raw amplitude/field strength. No random image texture replaces data.

CHECKS AND OBSERVATIONS
All 62 simulator tests pass, including 12 phase numerical tests, 9 field-view
checks and 7 shared-worker parity checks. The preserved JA21 verifier passes
202 tests with 3 documented skips under a UTF-8, workspace-temporary test setup.
These console checks do not show or verify the native GFM window.
An actual browser-downloaded field frame replays in the backend across 25,718
numeric values within the recorded relative tolerance. Evidence and source
hashes are under validation/ and RELEASE_PHASE.json.

The official EHT 2011-2013 M87 amplitude release is included with its original
license, raw files, source hashes and row provenance. A frozen 2011-12 fit uses
173 training rows; 146 untouched 2013 rows form the holdout. The other 167 short
baseline rows are retained in the dataset, not silently discarded.
Thin-ring and Gaussian brightness references fail the holdout (13.26 and
13.53 publisher-RMS units respectively). Every prediction/residual is exported.
This result does NOT validate local MHD, complex phase, iron cover, or passage.

LIMITS
This is a research prototype, not NASA-certified or a full black-hole plasma
solver. Local MHD is nonrelativistic, two-dimensional, periodic and coarse.
Spatial convergence is about first order; measured magnetic damping has
substantial numerical diffusion beyond the specified resistivity. There is no
Kerr gravity in the material/phase patch, GRMHD, radiative transfer, accretion,
collisionless plasma treatment, horizon interior or physical traversability.
The iron lab is separate with approximate constant heat capacities/latent heats.
The complex field is phenomenology, and LTE ionization is a diagnostic rather
than an ionization-energy-coupled EOS. See docs/phase-science.txt and the numerical
and observation audit files for assumptions and the actual failures.

Inherited v1/v2 reports, screenshots and packaging scripts are historical.
RELEASE_PHASE.json and the phase/observation reports identify current evidence.
The original terminal modules and copied terminal source retain registered bytes.
