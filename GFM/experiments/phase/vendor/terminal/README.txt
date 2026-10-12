RUSSL GALOIS FIELD MECHANICS TERMINAL — FOUNDATION 0.5.1
Prepared 2026-10-11. Local browser interface; no installation or server needed.

PATCH 0.5.1 — PREVIEW AND READINESS
The terminal now includes a completed pendulum example and a visible engine
readiness message. Live controls stay disabled until startup succeeds.
Read docs/Preview_Diagnostics.txt if a preview shows no new data.
Open docs/Pendulum_Example.html to see the calculated values without scripts.
The mathematical engines and session format remain those of release 0.5.

START
Open index.html in Edge, Chrome, or Firefox, or double-click Open-Terminal.cmd.
Keep index.html and its companion folders together. Extract the whole ZIP first.
The main workspace opens with raw GF9 pendulum data.

Presets insert editable commands. Review the composer, then select Run sequence.
Select a catalogue command to append it. Up/Down recalls command history.
The catalogue initially shows GFM commands; its reference/all option exposes
the retained reference calculations. Show reference math opens the secondary
normalized-state lab. Reference presets are collapsed initially.

FIRST GFM EXPERIMENT
Run this sequence to prepare ordinary restoring-acceleration samples, transform
their raw values, verify recovery and record the experiment:

  gfm.pendulum 9.81 1 0.2
  gfm.transform
  gfm.verify
  gfm.record initial experiment

The pendulum command samples -(g/length)*sin(theta) on the declared angle grid.
Its third argument is the maximum angle in radians. It returns the ordinary
small-angle angular frequency omega and period. This is acceleration versus angle;
it is not a simulated pendulum time trajectory. Inspect the grid, units, input,
coefficients, recovered values and residuals in Details and JSON.

PRIMARY MECHANICS WORKSPACE
Release 0.5 makes mechanics data and exact field calculations the primary
workflows. Ordinary samples retain their magnitude, units and grid. Raw zero
data is valid, transforms to zero and can be recorded. The main plot shows
sample/coefficient magnitude or exact field labels, with L2 signal energy or a
finite-field element note. It does not assign Born probabilities to these data.

For ordinary real/complex values indexed by GF(q), q=p^n, the convention is
  chi(u)=exp(2*pi*i*Tr(u)/p),
  F[k,x]=chi(k*x)/sqrt(q), y=F*v, recovered v=F^dagger*y.
The factor 1/sqrt(q) normalizes the transform kernel. It does not normalize v.
Scaling the samples scales their coefficients, and ||F*v||2=||v||2.

A separate exact transform takes N=q-1 coefficients that themselves belong
to GF(q). With a declared primitive element g it computes
  A_k=sum_j a_j*g^(j*k),
  a_j=N^(-1)*sum_k A_k*g^(-j*k).
These sums, products and inverses are field operations. Returns retain the
primitive element, ordering, polynomial and exact recovery comparison.
This N-entry field-valued transform has a different coefficient domain from
the q-entry complex additive-character transform above.

Exact oscillator and rational-circle rotation commands inspect dimensionless
field coordinates. Coordinates and parameters are encoded labels, not real
lengths, velocities, seconds or angles. The oscillator uses reversible velocity
Verlet in odd characteristic. Rational rotations require a nonzero denominator,
or their explicit infinity case. They do not convert real trigonometry into a
field by reducing sine/cosine values modulo p.

Supported profiles are GF3; GF4 with x^2+x+1; GF8 with x^3+x+1; GF9 with
x^2+1 over GF3; and GF16 with x^4+x+1. Label integers encode polynomial
coefficients low degree first in base p. Extension-field multiplication is not
integer multiplication modulo q. Field arithmetic is exact; ordinary complex
samples use floating-point arithmetic. There is no identity-preserving ring
map from the real numbers into GF(p), nor an automatic physical interpretation
for a sampled signal or an exact algebraic analogue.

Read docs/GFM_Terminal_Identity.txt for the functional change, number systems,
source attribution and limits of the GFM interpretation.

PRIMARY COMMANDS
help; status; sources
gfm.status; gfm.field <profile>
gfm.signal <JSON data>; gfm.coefficients <JSON field coefficients>
gfm.transform [inverse]
gfm.pendulum <g> <length> <max-angle-rad>
gfm.horizon <gtt|frameOmega> <M> <a> <Q> <rMin> <rMax> <theta-radians>
gfm.aperture <aperture|gaseousPassage|aggiePassage> [JSON parameters]
gfm.oscillator <q> <v> <kappa> <h> [steps]
gfm.rotate <x|y|z> <t|infinity> <X> <Y> <Z>
gfm.verify; gfm.reapply; gfm.record <label>; gfm.export
workbench.open; workbench.capture; workbench.replay <record-id>
ledger.restore <record-id>; ledger.list; ledger.export; session.export

gfm.signal accepts a q-entry JSON array, or {"values":[...],"field":"gf9",
"codec":{...}}. Each ordinary value is a real number, [re,im] pair, or
{"re":number,"im":number}. gfm.coefficients accepts the same container forms
with q-1 integer field labels. An omitted field uses the active mechanics
profile; optional codec metadata records the user's grid, units and meaning.
For example:
  gfm.coefficients {"field":"gf9","values":[0,1,2,3,4,5,6,7]}
  gfm.transform
  gfm.transform inverse

Use the command catalogue for parameter bounds.
Examples of exact mechanics inspectors are:
  gfm.field gf9
  gfm.oscillator 1 0 1 1 12
  gfm.rotate x 1 1 2 0
  gfm.rotate x infinity 1 2 0

Sequences run in order and stop on the first rejection. Completed results are
preserved. Stop acts between operations; it does not interrupt a calculation
or workbench request already in progress. A failed command preserves its
active data/state. Candidate prose and imported command histories never run
as commands automatically.

WORD WORKBENCH
Open Word workbench to use the supplied five-word GF(2^80) experiment and its
original research laboratories. Import actual axis words there if desired.
Capture current slice records a bounded snapshot and exact source-unit
witnesses. Replay independently recomputes that snapshot using the existing
workbench replay kernel without moving the live workbench state. The original
TIFF and replay-ZIP exports retain their existing semantics.

GF80 word cells are a primary mechanics workflow separate from the small-field
sample arrays. The terminal does not enumerate 2^80 complex coefficients.
For full original imported word bytes, use the workbench's replay ZIP. A bounded
research snapshot contains only the source units required for its slice and
partners. Full source-file hashes identify bytes when originals are checked.

PRESERVATION AND IMPORT
Sessions remain in browser memory until exported. Export session preserves
the primary mechanics dataset, reference state, ledger, structured returns,
command provenance and the selected hypothetical horizon case. The version
is 0.5.0 in the existing RUSSL-virtual-session/1 envelope; primary mechanics
data uses RUSSL-GFM-dataset/1. gfm.record captures the current validated dataset:
field ID, domain, representation, current values, codec metadata and operation
strings, alongside inert command provenance and scope. ledger.restore accepts
that record type. Transform checks, kernel definitions and recovered results
are separate calculation returns/reapplication reports. Reference state records
retain their own conventions. Restore does not replay command history.

Import session validates its envelope, record hashes and domains before
replacing the active session and ledger. Versions 0.1.0 through 0.4.0 remain
accepted under their original model conventions. An older import starts the
primary workspace with default raw pendulum data and restores its saved
normalized state in the secondary Reference math lab. Its saved horizon
context is retained when present. Older examples and record digests are
preserved as historical evidence. Imported histories remain inert.
Integrity hashes do not authenticate authorship or establish physical validity.

examples/GFM-Mechanics-session.json is the current reloadable raw-data example.
mechanics-reapplication.json contains its independently inspectable primary
mechanics report. Earlier example files remain available without rewriting
their historical data or hashes.

The bounded limits are 100 commands per sequence, 100 ledger records, 250
recent returns, 4 MiB session import/export and 2 MiB workbench messages.
Reduce a word slice if capture is rejected. When returns exceed the export
envelope, session.export omits the oldest returns from the download, reports
their count in exportRetention, and preserves active data/state, ledger and
command provenance. In-memory history is unchanged. Individual report-export
commands provide a fresh complete report.

REFERENCE MATH AND HISTORICAL AUDITS
Show reference math exposes the earlier normalized complex-state lab. Its
finite-field labels index a complex Hilbert space. Its probability, pure-state
Wigner and mana calculations require that declared normalized-state model.
The reference state is separate from primary mechanics data. The presence of
complex Fourier coefficients alone does not select a quantum interpretation.

The candidate PDF genuinely includes quantum kinematics and complex Hilbert-
space sections. The original SpinDoctor source is explicitly a quantum
terminal. Their titles, source bytes and attribution remain unchanged, while
the GFM terminal's primary workflows have broader mechanics data domains.
SpinDoctor informed command-surface patterns; its native service, OpenCL,
cartridges and performance claims are not capabilities measured here.

Retained reference commands include gf.*, math.*, eq.*, model.* and horizon.*.
Examples and scope remain visible in the reference/all catalogue and audits:

  gf.field gf9
  gf.basis 1
  gf.fourier
  gf.verify

The gf.* commands intentionally retain the earlier normalized-state semantics.
For GF3/GF9, symmetric displacements, reflections, quadratic characters and
pure-state Wigner grids require odd characteristic. This Wigner convention
has a negative-sign Fourier momentum marginal; mana is log2(sum(abs(W))).
Binary field Fourier, shift, phase and Frobenius commands remain supported.
Frobenius permutes labels by x -> x^p; it is not complex conjugation.

The scalar reference tools retain their own ordinary domains: Condon–Shortley
SU(2) Clebsch–Gordan coefficients for spins 0..6; arithmetic delta on integer
lifts modulo p^2 for primes 2..97; and a Hermitian complex Cayley step of
dimension 1..8. They are inspectors, not implicit finite-field propagators.
The 500-equation source suite was not supplied; the 20-entry parsed report
and its qualified findings do not certify that suite or its physical claims.
See docs/candidate-review.txt, docs/Equation_Audit.txt, docs/scalar-audit.txt
and docs/relativity-audit.txt.

The three older equation images retain all visible pendulum equations, the
three real axis rotations at 232.75 degrees, and the zeta–gamma integral with
Re(s)>1. Their earlier normalized sample records and complex basis changes
remain reproducible under their historical conventions. A transform recovery
check validates the chosen finite representation, not a continuum identity.
See docs/Image_Equation_Audit.txt and gfm-reapplication.json.

HORIZON REFERENCES AND HYPOTHESIS
The preserved black-hole PDF, metric/aperture images, tensor-map screenshot
and user write-up have 49 findings: 23 numbered PDF equations, 22 image formula
groups and four narrative qualifications. Standard Schwarzschild, RN, Kerr
and Kerr–Newman calculations include horizons, exterior metrics and qualified
thermodynamic identities. gfm.horizon transports raw exterior scalar samples
with their radial grid and units. It does not prove metric equivalence or
solve a formation or perturbation PDE.

The proposed gaseous aperture and aggie cover remain hypothetical.
gfm.aperture samples the declared toy profile, including a valid zero profile.
Identical permitted exterior observations retain the prior probabilities;
balanced classification then cannot exceed 50%. An optional assumed passage
test supplies different observations and changes that premise. Extreme spin
does not establish timeless matter, and no supplied interaction law defines
the proposed electromagnetic zap. The logical GF4 map T=I+epsilonMap*K is
separate from spin epsilon and has no automatic spacetime interpretation.

Read docs/Horizon_Simulation_Specification.txt and docs/Horizon_Equation_Audit.txt.
examples/Horizon-Simulation-session.json preserves the earlier 0.4 normalized
signal demonstration. Importing it restores that historical horizon context
and secondary reference state after validation, while the primary workspace
starts with default raw pendulum data. Its source and numeric report remain
unchanged.

EDIT AND REBUILD
Editable files are in src/. With Node.js 24+ available, rebuild the current
mechanics report and interface from this folder:
  node mechanics-reapplication-build.cjs
  node build.mjs
  node --test tests/*.test.cjs
No dependency installation is required. build.mjs generates index.html and
the derivative reference/workbench.html from the preserved original and bridge.
The source ZIP includes the original workbench's editable React/vendor sources.
Earlier report/example builders are retained for their historical releases;
the current rebuild does not require regenerating those preserved files.
Keep earlier source files and audited historical artifacts when adding models;
declare every new coefficient domain, grid, unit and recovery contract.

VERIFICATION
validation/ records completed checks, exact tested files and their limits.
Automated tests exercise mathematical modules, command execution, records,
imports, exports and the bounded workbench relay. Separate standard-library
Python checks validate earlier deterministic examples and saved reports.
Runtime verify commands run bounded checks, not the complete automated suite.
Consult the current validation report for browser/iframe/download coverage.

CONTENTS
index.html / Open-Terminal.cmd: offline terminal entry points
src/: editable GFM workspace, reference lab, field/model engines and relay
docs/GFM_Terminal_Identity.txt: current terminal identity and coefficient domains
docs/: retained candidate, scalar, relativity, equation, image and horizon audits
equation-audit.json: 20 parsed report entries and displayed source math
image-equations.json: three older image groups, identities and domains
mechanics-reapplication.json: current raw GFM data and scoped applicability report
examples/GFM-Mechanics-session.json: current raw mechanics session and records
gfm-reapplication.json: historical 20+3 model applicability and numeric report
horizon-equations.json: 49 source expressions, corrections and dispositions
horizon-reapplication.json: historical horizon applicability and numeric report
examples/: preserved, importable examples under their original conventions
reference/: exact source ZIP, original workbench, derivative relay, candidate
  text/PDF, equation images, SpinDoctor terminal and black-hole sources
source-register.json: original byte identities and declared source roles
LICENSE.txt / NOTICE.txt / workbench-notices/: retained licenses and attribution
validation/: completed checks and independent numeric evidence

The original files at their supplied locations remain unchanged.

