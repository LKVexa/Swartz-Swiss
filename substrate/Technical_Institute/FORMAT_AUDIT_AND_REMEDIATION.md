# DF Portable VM Technical Institute v2.1.2 — Formatting Audit and Remediation

## Defects confirmed

1. **Array-valued opcode metrics were rendered as literal comma-separated strings.** DF_Large carries 41 opcode names and DF_Xtra_Large carries 24 opcode names in the `Opcodes` metric. The v2.1.1 formatter treated those arrays as text, expanding machine, metric, and ISA panels thousands of pixels horizontally.
2. **Long package identifiers could enlarge the hero evidence column.** Monospaced package/version strings did not have an explicit overflow-wrap contract.
3. **Nested grid/flex children were not universally constrained with `min-width: 0`.** A long evidence token could therefore enlarge a parent track instead of wrapping inside it.
4. **The Device ABI bus decoration extended with viewport-relative pseudo-element widths.** This was visually harmless on common widths but could participate in overflow calculations.
5. **Wide evidence visualizations relied on local horizontal scrolling but lacked a uniform containment contract.**

## Repairs

- The formatter now treats array-valued summary metrics as **counts**, never as a raw comma-separated array.
- The raw opcode names are retained and presented in a new **Instruction-set Atlas**: a bounded, wrapping visual grid on DF_Large and DF_Xtra_Large.
- Added `min-width: 0`, `max-width: 100%`, and explicit wrapping to every major grid/flex evidence surface.
- Added hero/package identifier wrapping and bounded metric cards.
- Contained the Device ABI bus decoration inside its panel.
- Standardized local overflow behavior for flow, trust-chain, control-spine, topology, circuit, segment-chain, and table surfaces.
- Added responsive opcode and gate layouts for narrow windows.
- Added a final document-level overflow guard so one malformed evidence token cannot resize the entire application window.

## Expected result

DF_Large and DF_Xtra_Large should remain the same application width as the other VM pages. Opcode names appear as discrete visual cells instead of one unbroken multi-thousand-pixel line. Long package/evidence identifiers wrap within their panels rather than forcing the page wider.
