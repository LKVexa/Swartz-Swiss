GFM RESEARCH SIMULATOR: SCIENTIFIC READING GUIDE
Prepared 2026-10-11

This revision is a research prototype. Its scientific records separate the
prescribed Kerr spacetime, numerical test-light paths, the user's aperture/cover
hypothesis, and the GF9 signal representation. A more detailed picture does not
establish a more accurate physical model.

Read scientific-validation.txt for the acceptance matrix, numerical limits,
uncertainty discussion, and current evidence. Read sources.json for equation
origins and primary links. The validation directory contains executable checks
and their evidence; a proposed check is not a passing result.

The independent numerical review passed 115 exact-input cases containing 205
rays and 29,245 exported points. The current software suite passed 29 tests.
Thirty-seven critical-limit rays remain explicitly unresolved; the conservative
band prevents false capture at the exact unstable photon orbit. The evidence
records the tested source hash, independent metric reconstruction, scattering
quadrature, refinement cases, and eight rejected corruptions. Actual browser
GPU/controls/demo checks and the downloaded 32-ray / 6,079-point solver replay
passed. Final integration loaded-module fingerprints await a service restart;
package verification remains planned. Their separate evidence is distinguished
in scientific-validation.txt and validation/browser/research-browser-qa.json.

The physics view uses neutral test photons in a stationary Kerr exterior.
It does not evolve the spacetime, accreting material, plasma, or a cover.
The hypothesis view uses an assumed aperture law and cover threshold. Its
gaseous/aggie labels are assumptions, not classes inferred from GR observations.
The GF9 transform represents nine raw aperture samples across spin 0..1;
it does not change the spacetime equations or infer an unobserved cover.

Coordinate distances are in units of M with G=c=1. The application display
clock, Mino parameter, affine parameter, and Boyer-Lindquist coordinate time
have separate meanings. Selecting a physical mass would be necessary before
converting geometric coordinate scales to kilometres or seconds. A photon
affine parameter also depends on the chosen energy normalization.

The three-dimensional coordinates are an oblate coordinate embedding with the
polar axis along y. They are not measurements of Euclidean proper distance in
curved spacetime. Impact coordinates label a deterministic ray family; they
are not an instrument-calibrated camera image or an intensity prediction.

NASA-STD-7009B informs the credibility checklist. No NASA certification,
approval, flight qualification, or complete standards compliance is claimed.
Primary standard: https://standards.nasa.gov/sites/default/files/standards/NASA/B/1/NASA-STD-7009B-Final-3-5-2024.pdf

Permissible use: inspect declared equations, compare parameter cases, study
bounded null trajectories, and examine reproducible numerical evidence.
Current evidence does not establish material formation, electromagnetic
hazards, physical passage, or agreement with a particular astronomical source.

Reproduce numerical evidence from the project directory:
  node validation/generate-relativity-cases.cjs
  python -B validation/independent-kerr-check.py --self-test validation/independent-relativity-cases.json
  python -B validation/kerr-evidence-audit.py
The first command records actual solver outputs; the two Python checks import
no production solver. Use the same source revision/hash as the saved evidence.
