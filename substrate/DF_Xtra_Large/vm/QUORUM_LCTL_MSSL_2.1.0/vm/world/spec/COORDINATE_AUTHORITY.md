# RC-PW Canonical Coordinate Authority — Remediated 26

- Schema: `RCPW-CANONICAL-XYZ-I64/1`
- Unit: canonical meter
- Numeric domain: signed integer, declared 64-bit range
- Resolution: 1 canonical meter in the hosted reference profile
- Axes: X east/west, Y north/south, Z elevation
- Gravity vector: `[0,0,-1]`
- Canonical coordinates remain authoritative.
- Reference and folded coordinates are derived views and are not serialized as canonical entity position.
- Fold/reference changes must leave canonical XYZ unchanged except for explicit canonical movement.
