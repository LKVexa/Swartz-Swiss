# JA21 Mirror Browser — engine architecture

The application has two sealed JA21 units: browser/control IR and renderer-policy IR. The reference runtime executes those units inside a bounded VM. Native WPF/.NET is treated only as an operating-system adapter.

```
JA21 browser source -> browser IR -> JA21 VM -> typed action broker
                                      |
                                      v
                            bounded OS HTTP/TLS primitive
                                      |
JA21 renderer source -> renderer IR -> policy/budget checks
                                      |
                                      v
                         JA Mirror HTML -> DOM -> CSS -> flow reconstruction
                                      |
                                      v
                               WPF drawing primitives
```

No external browser engine is loaded. The same package also embeds the byte-pinned DF_Small helper under a separate offline capability boundary.
