# Windows-safe packaging 8.2.2

The outer ZIP intentionally contains only a shallow bootstrap. The sealed application is carried as `payload.ja21pkg` and is extracted by `Install-WindowsSafe.ps1` using extended-length filesystem paths.

8.2.2 adds a mandatory archive preflight before extraction. Every file entry must be relative, remain within the destination, be unique under Windows case-insensitive Unicode-normalized comparison, avoid reserved DOS device names and forbidden filename characters, avoid trailing dots/spaces, and keep each path component within 255 UTF-16 code units.

Extraction uses `FileMode.CreateNew` inside a unique staging directory. The final destination is not populated until the complete payload is extracted and the `VERSION` marker is verified. This prevents silent overwrite of colliding evidence and prevents failed installs from leaving a partial final tree.
