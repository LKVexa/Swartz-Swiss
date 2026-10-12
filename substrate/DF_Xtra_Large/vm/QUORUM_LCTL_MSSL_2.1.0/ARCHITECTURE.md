# QUORUM Reimagined Architecture

The repository is reorganized around two explicit source roles instead of a wide collection of language-specific islands.

- **MSSL = semantic authority.** Each suite has one sealed facts document declaring purpose, plane, legacy evidence, security posture, execution boundary, and maturity.
- **Columned LCTL = execution-plan source.** Each suite has an 8-column compact plan, lowered into canonical LCTL and verified before authority is claimed.
- **Legacy = evidence, not hidden authority.** Every original file remains byte-for-byte in `legacy/source_repository/` and is indexed by SHA-256.
- **QUORUM = governance model.** Semantic interpretation, validation/policy, bounded execution coordination, explanation, and evidence publication are separated as responsibilities.

## Twelve planes

1. **sense_context** — Observer, Anthology, Atlas, Perceiver, Asset Observer, Repository Context Engine, Knowledge Repository, Repository Retrieval and Memory
2. **intent_reasoning** — Compass, Pencil, Pencil Sharpener, Grinder, Funnel, Illuminator, Chatbot, Answer Modes and Specialized Roles
3. **data_evidence** — Tables, Cypher, Filing Cabinet, Feature Graph, Archive Ledger, Action Cards
4. **orchestration** — Orchestrator, Orchestrator II, Job Queue Workers and Sandboxes, Translation Build Test and Evaluation Jobs, Worker, LANDON Integration and Run All
5. **security_authorization** — Chair, Safety Gate, Capability and Security Plane, Evaluation and Content Defense, Capability Manifests and Permissions, Sandbox and Offline Runtime, Sandbox Engine
6. **interfaces_services** — Plug, Full Stack UI, App Designer, Preview Designer, Core Studio, Localization and Large File Plane, Popup Runner, Terminal
7. **media_visual** — Mesh Geometry, Scene Reconstruction, Motion Planner, Temporal Animator, C# Renderer, Media Export, Visual Feedback, Animation VFX Workspace, Visual Correction System
8. **model_compute** — Equation Operator Bank, deepML Worker, Training and Evaluation, Local Model Provider and Health, Training Desktop and Android Workers
9. **translation_interop** — JA Adapter, Vexxa, Transition Plane
10. **release_delivery** — Release Plane, Air Gap Certification and Installer Plane
11. **operations_recovery** — Operations Plane, Indexing Storage Resources Logs and Recovery, Shell
12. **governance_control** — Diff Patch and Review

## Execution law

Editable `*.lctlc` files are compact source only. Their adjacent `*.lctl` files are generated canonical forms. `validation/LCTL_VERIFICATION_LEDGER.json` records canonical-verifier PASS results for the repository plan and all 66 module plans.

## Migration law

The reimagination does not erase the legacy repository. New MSSL/LCTL contracts point back to exact source hashes so future work can replace a scaffold with a behavioral implementation one suite at a time while retaining differential evidence.
