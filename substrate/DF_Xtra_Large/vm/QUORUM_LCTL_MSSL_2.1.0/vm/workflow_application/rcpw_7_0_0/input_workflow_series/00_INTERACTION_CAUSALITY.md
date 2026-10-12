# QUORUM RC-PW 7.0.0 — Interaction and Causality Contract

Player/world interactions resolve against canonical targets even when the visible world is reference-folded.

Mandatory interaction classes:
- ray/pick target;
- collision/contact;
- projectile;
- melee/contact;
- inventory transfer;
- ownership change;
- door/portal use;
- mount/vehicle boarding;
- trade;
- crime/law event;
- mission/event trigger.

Every interaction must resolve unambiguously to canonical identities or fail explicitly. Fold projection may never cause two distinct interactable entities to alias into one target.
