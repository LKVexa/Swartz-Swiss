# 10. Illuminator — JA Interface Language

This package contains four independent `.jaui` interface scripts:

1. **Findings** — renders certified findings after all five analytical layers supply content.
2. **Assumptions** — exposes assumptions, dependencies, runtime limits, evidence limits, and disclosure text.
3. **Diagnostics** — renders semantic, structural, runtime, evidence, and certification diagnostics.
4. **Reports** — composes explanation, organization, execution, evidence, and conclusion state into a human-readable report surface.

## Suite roles

| Layer | Illuminator responsibility |
|---|---|
| SOPHIA | Findings, semantic assumptions, diagnostics, and explanations |
| CHARLOTTE | Context, dependencies, structural diagnostics, and organization |
| LANDON | Runtime evidence, limits, diagnostics, and execution summaries |
| Professor | Review, evidence limitations, diagnostics, and evidence summaries |
| Podium | Final summaries, disclosures, certification diagnostics, and conclusions |

## Corpus alignment

Every script follows the attached corpus pattern: `ja source 0.3`, `use Interface`, `policy no_network`, typed nullable state, a `Flag` execution state, a derived readiness gate, labeled components, bound enablement, keyboard-accessible buttons, approved actions, portal-scene embedding, timeline motion binding, accessibility assertion, and interface emission.

## Runtime behavior

Each render button remains disabled until all five role-specific text states are populated and the interface is not already running. The report viewport is a named portal scene that the JA Interface Runtime can bind to its corresponding report renderer.

The attached corpus is provisional and models expected validation without a production compiler. These modules are therefore structurally corpus-aligned rather than execution-certified.
