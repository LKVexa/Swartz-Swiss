# BRIM Specification
BRIM/1 with BRPV/1 provenance remains the executable image format. The RC retains a 51,200-byte executable-image ceiling, enforced by compiler/image-writer and loader/inspector. New native images include semantic provenance; legacy accepted images are interpreted under their original versioned contract rather than retroactively redefined.
