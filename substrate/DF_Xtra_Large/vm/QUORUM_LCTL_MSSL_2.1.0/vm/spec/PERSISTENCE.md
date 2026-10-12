# Transactional persistence and recovery

Persistent state uses two authenticated slots, A and B. A save writes the inactive slot to a temporary file, atomically replaces that slot, then atomically replaces the control record. Records carry a keyed BLAKE2s MAC and a monotonically increasing generation. Recovery validates both slots and selects the highest valid generation; a corrupt newest slot falls back to the previous valid slot.

This design is testable in the hosted filesystem model. It is not a claim of physical power-loss guarantees for a specific flash controller or filesystem without hardware-specific flush/atomicity qualification.
