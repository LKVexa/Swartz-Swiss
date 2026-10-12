# RC-PW Presentation Asset Versioning

Presentation packages use `RCPW-PRESENTATION-ASSET/1` and are versioned separately from canonical world state.

Activation is allowed only when canonical state digest is unchanged. A previous-known-good presentation package is retained for rollback. Presentation identity cannot replace canonical entity identity for interaction targeting.
