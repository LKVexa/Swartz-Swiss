# JA21 Portable Optical Instrument Desktop 9.8.4 Audit

## User-directed refinements
- Use the attached photo as guidance for the floating search surface.
- Keep the visible tab bar absent.
- Keep the bottom command island.
- Make the omni field feel like a changing text box rather than a rigid pill.
- Add a Copilot integration button in the floating search box.

## Implemented changes
- The floating omni control now uses a brighter rounded-rectangle search-box presentation with a slightly taller surface, softer white material, larger shadow, and a wider default width.
- The field still moves independently over every page via the popup-owned drag surface.
- The field changes width and corner radius based on idle/focused/populated state.
- A dedicated Copilot button now sits inside the search surface; clicking it opens `https://copilot.microsoft.com/` in the active tab.
- The bottom control island remains the only visible permanent navigation/window control region.

## Verification intent
- Preserve the AppData-free portable contract.
- Preserve four-node VEC1 placement and automatic renderer routing.
