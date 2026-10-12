# JA21 9.8.4 Omni Edit + Full-Window Drag

The floating omni field now owns an explicit user-edit state. Live WebView2 URL/title updates cannot rewrite it while that state is active. Dragging is expressed in the same owner-window coordinate system as the global pointer and is clamped against the full window client area, not the overlay subtree.
