# Windows target qualification — JA21 Optical Instrument 9.0.0

Run these gates after installing the Windows-safe package.

1. Run `Verify JA21 Virtual Browser.cmd`; WPF `Add-Type` must compile the joined presenter + VEC1 + selected live-web bridge.
2. Confirm the verifier loads `Microsoft.Web.WebView2.Core` before `Microsoft.Web.WebView2.Wpf` and reports the pinned adapter/runtime boundary as ready when LIVE is expected.
3. Launch from the Desktop shortcut created by the installer. Confirm the shortcut points to the 9.0.0 install and uses `assets\vb.ico`.
4. Confirm normal web content starts full-bleed underneath the floating JA21 rail; empty optical-plane areas must not intercept website pointer input.
5. Confirm LIVE uses `WebView2CompositionControl`: the WPF rail/drawer/palette must remain visible above live web content.
6. Open the contextual drawer over a live page. It must stay in the same application window and must not open a second taskbar/top-level window.
7. Press Ctrl+K and execute each listed command. Confirm Escape closes the palette before affecting the page.
8. Switch LIVE/NATIVE repeatedly. The segmented instrument must always agree with the actual renderer and LIVE must disable/fallback neutrally if the runtime is unavailable.
9. Open a modern video site in LIVE. Test ordinary playback, site fullscreen, exit fullscreen, and repeated transitions.
10. During site fullscreen, verify zero residual JA21 chrome and restoration to the exact prior shell state after exit.
11. Move the window among monitors at 100%, 125%, 150%, 175%, and 200% scaling where available. Inspect hairlines, text, tab underline, command rail, drawer, and palette for blur/jitter/clipping.
12. Test dark override with `JA21_THEME=dark`; test Windows High Contrast separately.
13. Test reduced motion with `JA21_REDUCED_MOTION=1`; reveals/springs should resolve without animated travel.
14. Complete keyboard-only traversal and screen-reader inspection of rail, omni input, renderer instrument, tabs, command palette, drawer, trust pill and window controls.
15. Capture ETW/WPF performance evidence for startup, idle, drawer open/close, palette open/close, tab switching, LIVE/NATIVE switching, window resizing, and fullscreen entry/exit.
16. Stress open/close/reorder/switch operations and verify no monotonic browser-process, COM-handle, event-subscription, or private-profile leakage.
17. Test hardware acceleration enabled/disabled and integrated/discrete GPU paths available on the machine.
18. If HDR/color-managed displays are available, inspect gradients/glass/contrast and record whether treatment remains within the visual QA rubric.
19. If DRM/protected media is in scope, test it separately and record website/runtime/Windows DRM limitations rather than treating failure as a shell rendering defect.
20. Run `python substrate\vec1\vecctl.py presenter-audit`; confirm readiness/presentation evidence does not become a fabricated fabric verdict.

Only after the applicable target-machine gates are evidenced should the 500 `*.25` closeout work items move from `PENDING_TARGET_QUALIFICATION` to complete.
