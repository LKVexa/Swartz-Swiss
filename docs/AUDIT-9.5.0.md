# JA21 Portable Optical Instrument Desktop 9.8.4 Audit

## Requested changes
1. Remove the visible tab bar.
2. Remove the Live/Native chooser.
3. Place Back, Forward, Minimize, Enlarge, and Exit into a bottom island.
4. Keep the omni field page-independent and movable.
5. Make the omni field behave more like a text box than a rigid pill.

## Implemented changes
- `host/JA21VirtualBrowser.cs`: removed the visible call to `BuildTabRail(...)` while preserving internal tab state and shortcuts.
- `BuildCommandRail(...)`: rewritten as a bottom-centered glass island containing Back, Forward, Minimize, Enlarge/Restore, and Exit.
- `BuildAddressCapsule(...)`: refactored into a movable floating omni search box with a rounded-rectangle geometry, dynamic width, and state-based corner radius.
- The search field continues to sit in a browser-owned `Popup`, so navigation cannot steal its drag/hit surface.
- The visible Live/Native choice remains removed; renderer selection is automatic.

## Verification
- `python tools/reseal.py`
- `python tools/verify_package.py`
- Result: package integrity PASS; 139 Python tests PASS; 30 substrate tests PASS (1 skipped).
