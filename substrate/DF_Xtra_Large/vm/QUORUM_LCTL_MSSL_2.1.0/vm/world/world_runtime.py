#!/usr/bin/env python3
"""RC-PW 7.0 hosted reference world runtime.

This module is an evidence-oriented reference implementation of the QUORUM
Reference-Centric Penteract World prompt/workflow series. Canonical state uses
integer coordinates and deterministic JSON hashing. Folded coordinates are a
derived representation and never mutate canonical coordinates.

Claim boundary: this is a host-reference subsystem integrated with the QVM
candidate. It is not a renderer, bare-metal world engine, native LCTL semantic
primitive set, or independently qualified production simulator.
"""
from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

WORLD_VERSION = "7.0.0-applied-remediated-26"
COORDINATE_SCHEMA = "RCPW-CANONICAL-XYZ-I64/1"
PENTERACT_MAPPING_VERSION = "RCPW-8S-MAP/1"
GRAVITY_VECTOR = [0, 0, -1]
WORLD_SCHEMA = "QVM-RCPW-WORLD/1"
DEFAULT_FOLD_NEAR = 1024
DEFAULT_FOLD_HORIZON = 65536
SHELL_LIMITS = [32, 128, 512, 2048, 8192, 32768, 131072, 524288]
LOD_NAMES = {
    0: "STATE_ONLY",
    1: "STATISTICAL",
    2: "STRATEGIC",
    3: "NAVIGATIONAL",
    4: "KINEMATIC",
    5: "PHYSICAL",
    6: "VISUAL",
    7: "INTERACTIVE",
    8: "REFERENCE_AUTHORITY",
}


def canonical_bytes(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256_obj(obj: Any) -> str:
    return hashlib.sha256(canonical_bytes(obj)).hexdigest()


def named_u64(seed: int, *parts: Any) -> int:
    payload = canonical_bytes([int(seed), *parts])
    return int.from_bytes(hashlib.sha256(payload).digest()[:8], "big")


def isqrt(n: int) -> int:
    if n < 0:
        raise ValueError("negative square root")
    if n < 2:
        return n
    x = 1 << ((n.bit_length() + 1) // 2)
    while True:
        y = (x + n // x) // 2
        if y >= x:
            return x
        x = y


class WorldError(RuntimeError):
    pass


class WorldRuntime:
    """Deterministic canonical world plus reference-relative folded view."""

    def __init__(
        self,
        seed: int = 1,
        *,
        fold_near: int = DEFAULT_FOLD_NEAR,
        fold_horizon: int = DEFAULT_FOLD_HORIZON,
        create_demo: bool = True,
    ):
        if fold_near <= 0 or fold_horizon <= fold_near:
            raise ValueError("invalid fold radii")
        self.seed = int(seed)
        self.fold_near = int(fold_near)
        self.fold_horizon = int(fold_horizon)
        self.tick = 0
        self.world_age = 0
        self.era = "ERA_0"
        self.reference_entity = "1"
        self.reference_position = [0, 0, 0]
        self.regions: Dict[str, Dict[str, Any]] = {}
        self.entities: Dict[str, Dict[str, Any]] = {}
        self.settlements: Dict[str, Dict[str, Any]] = {}
        self.ecology: Dict[str, Dict[str, Any]] = {}
        self.institutions: Dict[str, Dict[str, Any]] = {}
        self.roles: Dict[str, str] = {}
        self.knowledge: Dict[str, Dict[str, Dict[str, Any]]] = {}
        self.authority_wells: Dict[str, Dict[str, Any]] = {}
        self.archives: Dict[str, Dict[str, Any]] = {}
        self.partition_owner: Dict[str, str] = {}
        self.completed_transactions: Dict[str, str] = {}
        self.ledger: List[Dict[str, Any]] = []
        self.ledger_head = "0" * 64
        self.commands: List[Dict[str, Any]] = []
        self.next_entity_id = 1
        self.next_region_id = 1
        self.next_well_id = 1
        self.coordinate_authority = {
            "schema": COORDINATE_SCHEMA,
            "unit": "canonical_meter",
            "numeric": "signed_integer",
            "resolution": 1,
            "min": -(2**63),
            "max": 2**63 - 1,
            "axes": {"x": "east_west", "y": "north_south", "z": "elevation"},
            "gravity_vector": list(GRAVITY_VECTOR),
            "reference_independent": True,
            "folded_coordinates_are_derived": True,
        }
        self.penteract_mapping_version = PENTERACT_MAPPING_VERSION
        if create_demo:
            self._create_demo_world()

    # ------------------------------ canonical setup ------------------------------
    def _create_demo_world(self) -> None:
        self._add_region("Heartland", [0, 0, 0], "prairie", neighbors=[])
        self._add_region("Westwood", [-20000, 0, 0], "forest", neighbors=["1"])
        self._add_region("Eastvale", [20000, 0, 0], "prairie", neighbors=["1"])
        self.regions["1"]["neighbors"] = ["2", "3"]

        self._spawn("player", [0, 0, 0], "1", persistent=True, inventory={"coin": 20})
        self._spawn("mount", [20, 0, 0], "1", persistent=True, inventory={})
        self._spawn("merchant", [500, 100, 0], "1", persistent=True, inventory={"food": 25, "coin": 100})
        self._spawn("wolf", [-15000, 250, 0], "2", persistent=True, inventory={})
        self._spawn("deer", [-14800, 300, 0], "2", persistent=True, inventory={})
        self._spawn("train", [10000, 5000, 0], "3", persistent=True, velocity=[10, 0, 0], inventory={"cargo": 30})
        sheriff = self._spawn("sheriff", [20200, 50, 0], "3", persistent=True, inventory={"coin": 15})
        self.roles["sheriff:eastvale"] = sheriff

        self.settlements = {
            "heartland_camp": {"region": "1", "population": 18, "food": 120, "money": 600, "production": 4, "consumption": 2, "law": 1, "morale": 70},
            "eastvale": {"region": "3", "population": 240, "food": 800, "money": 12000, "production": 24, "consumption": 18, "law": 70, "morale": 66},
        }
        self.ecology = {
            "1": {"deer": 120, "wolves": 8, "forage": 800},
            "2": {"deer": 220, "wolves": 18, "forage": 1400},
            "3": {"deer": 90, "wolves": 4, "forage": 650},
        }
        self.institutions = {
            "eastvale_law": {"region": "3", "kind": "law", "legitimacy": 72, "treasury": 4000, "leader_role": "sheriff:eastvale"}
        }
        self.reference_entity = "1"
        self.reference_position = list(self.entities["1"]["pos"])
        self._event("WORLD_INIT", {"seed": self.seed, "regions": 3, "entities": len(self.entities)})

    def _add_region(self, name: str, center: List[int], biome: str, neighbors: List[str]) -> str:
        rid = str(self.next_region_id)
        self.next_region_id += 1
        self.regions[rid] = {
            "id": rid,
            "name": name,
            "center": [int(x) for x in center],
            "biome": biome,
            "neighbors": list(neighbors),
            "archive_state": "ACTIVE",
            "generation_epoch": 0,
            "provenance": {"class": "AUTHORED_DEMO", "seed": self.seed, "generator": "builtin-demo/1"},
        }
        self.partition_owner[rid] = "P0"
        return rid

    def _spawn(
        self,
        kind: str,
        pos: Iterable[int],
        region: str,
        *,
        persistent: bool = True,
        velocity: Optional[Iterable[int]] = None,
        inventory: Optional[Dict[str, int]] = None,
        lineage: Optional[Dict[str, Any]] = None,
    ) -> str:
        if region not in self.regions:
            raise WorldError(f"unknown region {region}")
        eid = str(self.next_entity_id)
        self.next_entity_id += 1
        self.entities[eid] = {
            "id": eid,
            "kind": str(kind),
            "pos": [int(x) for x in pos],
            "velocity": [int(x) for x in (velocity or [0, 0, 0])],
            "region": region,
            "persistent": bool(persistent),
            "alive": True,
            "health": 100,
            "inventory": {str(k): int(v) for k, v in (inventory or {}).items()},
            "goal": "idle",
            "schedule": "default",
            "faction": "neutral",
            "narrative_gravity": 0,
            "revision": 1,
            "lineage": lineage or {"generation": 0, "parent": None},
            "provenance": {"class": "AUTHORED_DEMO" if self.tick == 0 else "RUNTIME_CREATED", "created_tick": self.tick},
        }
        return eid

    # ------------------------------ ledger ------------------------------
    def _event(self, kind: str, payload: Dict[str, Any], *, cause: Optional[List[str]] = None) -> str:
        eid = f"E{len(self.ledger) + 1:08d}"
        body = {
            "event_id": eid,
            "tick": self.tick,
            "era": self.era,
            "kind": kind,
            "payload": copy.deepcopy(payload),
            "cause": list(cause or ([] if not self.ledger else [self.ledger[-1]["event_id"]])),
            "prev_hash": self.ledger_head,
            "diagnostic": {"worker": "main", "partition": "P0", "runtime": WORLD_VERSION},
        }
        body["event_hash"] = hashlib.sha256(bytes.fromhex(self.ledger_head) + canonical_bytes(body)).hexdigest()
        self.ledger_head = body["event_hash"]
        self.ledger.append(body)
        return eid

    def verify_ledger(self) -> bool:
        prev = "0" * 64
        for i, rec in enumerate(self.ledger, 1):
            if rec.get("event_id") != f"E{i:08d}" or rec.get("prev_hash") != prev:
                return False
            body = {k: copy.deepcopy(v) for k, v in rec.items() if k != "event_hash"}
            expect = hashlib.sha256(bytes.fromhex(prev) + canonical_bytes(body)).hexdigest()
            if rec.get("event_hash") != expect:
                return False
            prev = expect
        return prev == self.ledger_head

    # ------------------------------ canonical state ------------------------------
    def canonical_state(self) -> Dict[str, Any]:
        return {
            "schema": WORLD_SCHEMA,
            "version": WORLD_VERSION,
            "seed": self.seed,
            "tick": self.tick,
            "world_age": self.world_age,
            "era": self.era,
            "coordinate_authority": copy.deepcopy(self.coordinate_authority),
            "penteract_mapping_version": self.penteract_mapping_version,
            "fold_policy": {"near": self.fold_near, "horizon": self.fold_horizon, "version": "rational-c1/1"},
            "reference_entity": self.reference_entity,
            "reference_position": list(self.reference_position),
            "regions": copy.deepcopy(self.regions),
            "entities": copy.deepcopy(self.entities),
            "settlements": copy.deepcopy(self.settlements),
            "ecology": copy.deepcopy(self.ecology),
            "institutions": copy.deepcopy(self.institutions),
            "roles": copy.deepcopy(self.roles),
            "knowledge": copy.deepcopy(self.knowledge),
            "authority_wells": copy.deepcopy(self.authority_wells),
            "archives": copy.deepcopy(self.archives),
            "partition_owner": copy.deepcopy(self.partition_owner),
            "completed_transactions": copy.deepcopy(self.completed_transactions),
            "next_entity_id": self.next_entity_id,
            "next_region_id": self.next_region_id,
            "next_well_id": self.next_well_id,
            "ledger_head": self.ledger_head,
        }

    def state_digest(self) -> str:
        return sha256_obj(self.canonical_state())

    def semantic_digest_for_regions(self, region_ids: Iterable[str]) -> str:
        ids = sorted(str(x) for x in region_ids)
        subset = {
            "regions": {r: self.regions[r] for r in ids if r in self.regions},
            "entities": {e: v for e, v in self.entities.items() if v.get("region") in ids},
            "settlements": {s: v for s, v in self.settlements.items() if v.get("region") in ids},
            "ecology": {r: self.ecology[r] for r in ids if r in self.ecology},
            "institutions": {s: v for s, v in self.institutions.items() if v.get("region") in ids},
        }
        return sha256_obj(subset)

    # ------------------------------ reference/fold ------------------------------
    def set_reference_entity(self, entity_id: str, *, _record: bool = True) -> None:
        eid = str(entity_id)
        if eid not in self.entities:
            raise WorldError(f"unknown entity {eid}")
        self.reference_entity = eid
        self.reference_position = list(self.entities[eid]["pos"])
        self._event("REFERENCE_ENTITY", {"entity": eid, "pos": self.reference_position})
        if _record:
            self.commands.append({"op": "set_reference_entity", "entity_id": eid})

    def move_reference(self, x: int, y: int, z: int = 0, *, move_entity: bool = True, _record: bool = True) -> None:
        pos = [int(x), int(y), int(z)]
        self.reference_position = pos
        if move_entity and self.reference_entity in self.entities:
            self.entities[self.reference_entity]["pos"] = list(pos)
            self.entities[self.reference_entity]["revision"] += 1
        self._event("REFERENCE_MOVE", {"entity": self.reference_entity, "pos": pos})
        if _record:
            self.commands.append({"op": "move_reference", "x": x, "y": y, "z": z, "move_entity": move_entity})

    def fold_point(self, point: Iterable[int]) -> Dict[str, Any]:
        p = [int(x) for x in point]
        d = [p[i] - self.reference_position[i] for i in range(3)]
        r = isqrt(sum(x * x for x in d))
        if r == 0:
            rf = 0
            folded = [0, 0, 0]
        elif r <= self.fold_near:
            rf = r
            folded = list(d)
        else:
            t = r - self.fold_near
            span = self.fold_horizon - self.fold_near
            rf = self.fold_near + (span * t) // (span + t)
            folded = [(x * rf) // r for x in d]
        shell = self.shell_for_distance(r)
        return {
            "canonical_delta": d,
            "canonical_distance": r,
            "folded": folded,
            "folded_distance": rf,
            "shell": shell,
            "fold_policy": "rational-c1/1",
        }

    @staticmethod
    def shell_for_distance(distance: int) -> int:
        d = int(distance)
        for i, limit in enumerate(SHELL_LIMITS):
            if d <= limit:
                return i
        return 8

    def entity_view(self, entity_id: str) -> Dict[str, Any]:
        eid = str(entity_id)
        if eid not in self.entities:
            raise WorldError(f"unknown entity {eid}")
        ent = self.entities[eid]
        folded = self.fold_point(ent["pos"])
        shell = folded["shell"]
        boost = min(3, max(0, int(ent.get("narrative_gravity", 0)) // 25))
        lod = min(8, max(0, 8 - shell + boost))
        return {
            "entity_id": eid,
            "kind": ent["kind"],
            "canonical_pos": list(ent["pos"]),
            "folded_pos": folded["folded"],
            "canonical_distance": folded["canonical_distance"],
            "folded_distance": folded["folded_distance"],
            "shell": shell,
            "lod": lod,
            "lod_name": LOD_NAMES[lod],
            "exists": True,
            "archive_state": self.regions[ent["region"]]["archive_state"],
        }

    # ------------------------------ simulation ------------------------------
    def _tick_once(self) -> None:
        self.tick += 1
        self.world_age = self.tick // 86400
        # Canonical kinematic movement. Folded distance never affects motion.
        for ent in self.entities.values():
            if not ent.get("alive", True):
                continue
            vel = ent.get("velocity", [0, 0, 0])
            if any(vel):
                ent["pos"] = [ent["pos"][i] + int(vel[i]) for i in range(3)]
                ent["revision"] += 1
        # Deterministic aggregate economy every 10 canonical ticks.
        if self.tick % 10 == 0:
            for sid in sorted(self.settlements):
                s = self.settlements[sid]
                produced = int(s.get("production", 0))
                consumed = int(s.get("consumption", 0))
                s["food"] = max(0, int(s["food"]) + produced - consumed)
                scarcity = 1 if s["food"] < max(10, int(s["population"]) // 4) else 0
                s["morale"] = max(0, min(100, int(s["morale"]) - scarcity))
        # Deterministic remote ecology every 20 canonical ticks.
        if self.tick % 20 == 0:
            for rid in sorted(self.ecology, key=int):
                e = self.ecology[rid]
                deer = int(e.get("deer", 0)); wolves = int(e.get("wolves", 0)); forage = int(e.get("forage", 0))
                birth = 1 if named_u64(self.seed, "deer_birth", rid, self.tick) % 5 == 0 and forage > deer else 0
                pred = min(deer, 1 if wolves and named_u64(self.seed, "pred", rid, self.tick) % 4 == 0 else 0)
                e["deer"] = max(0, deer + birth - pred)
                e["forage"] = max(0, min(5000, forage + 2 - max(0, e["deer"] // 100)))
        if self.reference_entity in self.entities:
            self.reference_position = list(self.entities[self.reference_entity]["pos"])

    def advance(self, ticks: int = 1, *, _record: bool = True) -> None:
        ticks = int(ticks)
        if ticks < 0 or ticks > 1_000_000:
            raise WorldError("invalid tick count")
        start = self.tick
        for _ in range(ticks):
            self._tick_once()
        self._event("ADVANCE", {"from": start, "to": self.tick, "ticks": ticks})
        if _record:
            self.commands.append({"op": "advance", "ticks": ticks})

    # ------------------------------ world mutation ------------------------------
    def spawn_entity(self, kind: str, pos: Iterable[int], region: str = "1", *, _record: bool = True) -> str:
        eid = self._spawn(kind, pos, str(region), persistent=True)
        self._event("ENTITY_CREATE", {"entity": eid, "kind": kind, "region": str(region), "pos": list(self.entities[eid]["pos"])})
        if _record:
            self.commands.append({"op": "spawn_entity", "kind": kind, "pos": list(pos), "region": str(region)})
        return eid

    def expand_frontier(self, *, name: Optional[str] = None, anchor_region: str = "1", _record: bool = True) -> str:
        anchor_region = str(anchor_region)
        if anchor_region not in self.regions:
            raise WorldError("unknown anchor region")
        rid = str(self.next_region_id)
        rseed = named_u64(self.seed, "frontier", rid, anchor_region)
        base = self.regions[anchor_region]["center"]
        direction = -1 if (rseed & 1) else 1
        yoff = int((rseed >> 8) % 20001) - 10000
        center = [base[0] + direction * (25000 + int(rseed % 10000)), base[1] + yoff, base[2]]
        biome = ["prairie", "forest", "desert", "wetland", "highland"][int((rseed >> 16) % 5)]
        new_id = self._add_region(name or f"Frontier-{rid}", center, biome, neighbors=[anchor_region])
        self.regions[new_id]["generation_epoch"] = self.world_age + 1
        self.regions[new_id]["provenance"] = {"class": "GENERATED", "seed": rseed, "generator": "semantic-frontier/1", "anchor": anchor_region}
        if new_id not in self.regions[anchor_region]["neighbors"]:
            self.regions[anchor_region]["neighbors"].append(new_id)
        self.ecology[new_id] = {"deer": int(40 + rseed % 180), "wolves": int((rseed >> 24) % 20), "forage": int(500 + (rseed >> 32) % 1500)}
        self._event("WORLD_EXPANSION", {"region": new_id, "anchor": anchor_region, "seed": rseed, "center": center, "biome": biome})
        if _record:
            self.commands.append({"op": "expand_frontier", "name": name, "anchor_region": anchor_region})
        return new_id

    def archive_region(self, region_id: str, *, _record: bool = True) -> str:
        rid = str(region_id)
        if rid not in self.regions:
            raise WorldError("unknown region")
        if rid == self.entities.get(self.reference_entity, {}).get("region"):
            raise WorldError("cannot archive active reference region")
        protected = [e for e, v in self.entities.items() if v.get("region") == rid and int(v.get("narrative_gravity", 0)) >= 75]
        if protected:
            raise WorldError("protected obligations prevent archival")
        digest = self.semantic_digest_for_regions([rid])
        self.archives[rid] = {
            "region": rid,
            "archived_tick": self.tick,
            "semantic_digest": digest,
            "entity_ids": sorted([e for e, v in self.entities.items() if v.get("region") == rid], key=int),
            "provenance_class": "EXACT_CANONICAL_SUMMARY",
        }
        self.regions[rid]["archive_state"] = "ARCHIVED"
        self._event("REGION_ARCHIVE", {"region": rid, "semantic_digest": digest})
        if _record:
            self.commands.append({"op": "archive_region", "region_id": rid})
        return digest

    def rehydrate_region(self, region_id: str, *, _record: bool = True) -> str:
        rid = str(region_id)
        if rid not in self.regions:
            raise WorldError("unknown region")
        before = self.semantic_digest_for_regions([rid])
        self.regions[rid]["archive_state"] = "ACTIVE"
        self._event("REGION_REHYDRATE", {"region": rid, "before_digest": before, "archive": copy.deepcopy(self.archives.get(rid))})
        if _record:
            self.commands.append({"op": "rehydrate_region", "region_id": rid})
        return before

    def add_authority_well(self, x: int, y: int, z: int, priority: int = 50, radius: int = 4096, *, _record: bool = True) -> str:
        wid = f"W{self.next_well_id:04d}"
        self.next_well_id += 1
        self.authority_wells[wid] = {"id": wid, "pos": [int(x), int(y), int(z)], "priority": max(0, min(100, int(priority))), "radius": max(1, int(radius)), "created_tick": self.tick}
        self._event("AUTHORITY_WELL_CREATE", copy.deepcopy(self.authority_wells[wid]))
        if _record:
            self.commands.append({"op": "add_authority_well", "x": x, "y": y, "z": z, "priority": priority, "radius": radius})
        return wid

    def tell(self, observer: str, fact_id: str, value: Any, *, confidence: int = 100, source: str = "direct", _record: bool = True) -> None:
        oid = str(observer)
        if oid not in self.entities and oid not in self.institutions:
            raise WorldError("unknown observer")
        self.knowledge.setdefault(oid, {})[str(fact_id)] = {
            "value": copy.deepcopy(value),
            "confidence": max(0, min(100, int(confidence))),
            "source": str(source),
            "learned_tick": self.tick,
        }
        self._event("KNOWLEDGE_UPDATE", {"observer": oid, "fact_id": str(fact_id), "value": copy.deepcopy(value), "confidence": confidence, "source": source})
        if _record:
            self.commands.append({"op": "tell", "observer": oid, "fact_id": str(fact_id), "value": copy.deepcopy(value), "confidence": confidence, "source": source})

    def succession(self, role: str, new_entity: str, *, _record: bool = True) -> None:
        eid = str(new_entity)
        if eid not in self.entities:
            raise WorldError("unknown successor")
        old = self.roles.get(role)
        self.roles[str(role)] = eid
        self._event("ROLE_SUCCESSION", {"role": str(role), "old": old, "new": eid})
        if _record:
            self.commands.append({"op": "succession", "role": str(role), "new_entity": eid})

    def transfer_inventory(self, txid: str, src: str, dst: str, item: str, qty: int, *, _record: bool = True) -> bool:
        txid = str(txid); src = str(src); dst = str(dst); item = str(item); qty = int(qty)
        if qty <= 0:
            raise WorldError("invalid quantity")
        if txid in self.completed_transactions:
            return False
        if src not in self.entities or dst not in self.entities:
            raise WorldError("unknown entity")
        invs = self.entities[src]["inventory"]; invd = self.entities[dst]["inventory"]
        if int(invs.get(item, 0)) < qty:
            raise WorldError("insufficient inventory")
        invs[item] = int(invs.get(item, 0)) - qty
        invd[item] = int(invd.get(item, 0)) + qty
        self.entities[src]["revision"] += 1; self.entities[dst]["revision"] += 1
        self.completed_transactions[txid] = self._event("INVENTORY_TRANSFER", {"txid": txid, "src": src, "dst": dst, "item": item, "qty": qty})
        if _record:
            self.commands.append({"op": "transfer_inventory", "txid": txid, "src": src, "dst": dst, "item": item, "qty": qty})
        return True

    def migrate_region(self, region_id: str, new_owner: str, *, _record: bool = True) -> None:
        rid = str(region_id)
        if rid not in self.regions:
            raise WorldError("unknown region")
        old = self.partition_owner.get(rid)
        self.partition_owner[rid] = str(new_owner)
        self._event("PARTITION_MIGRATE", {"region": rid, "old": old, "new": str(new_owner)})
        if _record:
            self.commands.append({"op": "migrate_region", "region_id": rid, "new_owner": str(new_owner)})

    # ------------------------------ save / replay ------------------------------
    def export(self) -> Dict[str, Any]:
        obj = {
            "schema": "QVM-RCPW-SAVE/1",
            "world_version": WORLD_VERSION,
            "state": self.canonical_state(),
            "ledger": copy.deepcopy(self.ledger),
            "commands": copy.deepcopy(self.commands),
        }
        obj["integrity_sha256"] = sha256_obj(obj)
        return obj

    def save(self, path: Path) -> str:
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        obj = self.export()
        path.write_bytes(canonical_bytes(obj) + b"\n")
        return obj["integrity_sha256"]

    @classmethod
    def from_export(cls, obj: Dict[str, Any]) -> "WorldRuntime":
        if obj.get("schema") != "QVM-RCPW-SAVE/1":
            raise WorldError("unsupported save schema")
        copy_obj = copy.deepcopy(obj)
        given = copy_obj.pop("integrity_sha256", None)
        if given != sha256_obj(copy_obj):
            raise WorldError("save integrity failure")
        state = copy_obj["state"]
        w = cls(seed=int(state["seed"]), fold_near=int(state["fold_policy"]["near"]), fold_horizon=int(state["fold_policy"]["horizon"]), create_demo=False)
        w.coordinate_authority = copy.deepcopy(state.get("coordinate_authority", w.coordinate_authority))
        w.penteract_mapping_version = str(state.get("penteract_mapping_version", w.penteract_mapping_version))
        for k in ["tick", "world_age", "era", "reference_entity", "reference_position", "regions", "entities", "settlements", "ecology", "institutions", "roles", "knowledge", "authority_wells", "archives", "partition_owner", "completed_transactions", "next_entity_id", "next_region_id", "next_well_id", "ledger_head"]:
            setattr(w, k, copy.deepcopy(state[k]))
        w.ledger = copy.deepcopy(copy_obj["ledger"])
        w.commands = copy.deepcopy(copy_obj.get("commands", []))
        if not w.verify_ledger():
            raise WorldError("ledger integrity failure")
        return w

    @classmethod
    def load(cls, path: Path) -> "WorldRuntime":
        return cls.from_export(json.loads(Path(path).read_text(encoding="utf-8")))

    def apply_command(self, cmd: Dict[str, Any], *, record: bool = False) -> Any:
        op = cmd["op"]
        if op == "advance": return self.advance(cmd["ticks"], _record=record)
        if op == "move_reference": return self.move_reference(cmd["x"], cmd["y"], cmd.get("z", 0), move_entity=cmd.get("move_entity", True), _record=record)
        if op == "set_reference_entity": return self.set_reference_entity(cmd["entity_id"], _record=record)
        if op == "spawn_entity": return self.spawn_entity(cmd["kind"], cmd["pos"], cmd.get("region", "1"), _record=record)
        if op == "expand_frontier": return self.expand_frontier(name=cmd.get("name"), anchor_region=cmd.get("anchor_region", "1"), _record=record)
        if op == "archive_region": return self.archive_region(cmd["region_id"], _record=record)
        if op == "rehydrate_region": return self.rehydrate_region(cmd["region_id"], _record=record)
        if op == "add_authority_well": return self.add_authority_well(cmd["x"], cmd["y"], cmd.get("z", 0), cmd.get("priority", 50), cmd.get("radius", 4096), _record=record)
        if op == "tell": return self.tell(cmd["observer"], cmd["fact_id"], cmd["value"], confidence=cmd.get("confidence", 100), source=cmd.get("source", "direct"), _record=record)
        if op == "succession": return self.succession(cmd["role"], cmd["new_entity"], _record=record)
        if op == "transfer_inventory": return self.transfer_inventory(cmd["txid"], cmd["src"], cmd["dst"], cmd["item"], cmd["qty"], _record=record)
        if op == "migrate_region": return self.migrate_region(cmd["region_id"], cmd["new_owner"], _record=record)
        if op == "set_narrative_profile": return self.set_narrative_profile(cmd["entity_id"], cmd["profile"], _record=record)
        raise WorldError(f"unknown command {op}")

    @classmethod
    def replay_commands(cls, seed: int, commands: Iterable[Dict[str, Any]]) -> "WorldRuntime":
        w = cls(seed=seed)
        for cmd in commands:
            w.apply_command(copy.deepcopy(cmd), record=True)
        return w

    # ------------------------------ remediation authorities ------------------------------
    @staticmethod
    def narrative_gravity_score(*, mission: int = 0, relationship: int = 0, causal: int = 0, threat: int = 0, recency: int = 0, authored: int = 0) -> int:
        """Distance-independent narrative significance score, clamped to [0,100]."""
        vals = [mission, relationship, causal, threat, recency, authored]
        vals = [max(0, min(100, int(v))) for v in vals]
        weights = [30, 15, 20, 15, 5, 15]
        return max(0, min(100, sum(v*w for v, w in zip(vals, weights)) // sum(weights)))

    def set_narrative_profile(self, entity_id: str, profile: Dict[str, int], *, _record: bool = True) -> int:
        eid = str(entity_id)
        if eid not in self.entities:
            raise WorldError("unknown entity")
        allowed = {k:int(profile.get(k,0)) for k in ["mission","relationship","causal","threat","recency","authored"]}
        score = self.narrative_gravity_score(**allowed)
        self.entities[eid]["narrative_gravity"] = score
        self.entities[eid]["narrative_gravity_inputs"] = allowed
        self.entities[eid]["revision"] += 1
        self._event("NARRATIVE_GRAVITY", {"entity": eid, "inputs": allowed, "score": score})
        if _record:
            self.commands.append({"op":"set_narrative_profile","entity_id":eid,"profile":copy.deepcopy(allowed)})
        return score

    def validate_coordinate(self, point: Iterable[int]) -> List[int]:
        vals = [int(x) for x in point]
        if len(vals) != 3:
            raise WorldError("coordinate must have 3 axes")
        lo, hi = int(self.coordinate_authority["min"]), int(self.coordinate_authority["max"])
        if any(x < lo or x > hi for x in vals):
            raise WorldError("coordinate outside canonical range")
        return vals

    def semantic_ledger_digest(self) -> str:
        semantic = []
        for rec in self.ledger:
            semantic.append({k: copy.deepcopy(v) for k, v in rec.items() if k not in {"event_hash","prev_hash","diagnostic"}})
        return sha256_obj(semantic)

    def arbitrate_authority_wells(self, candidate_ids: Optional[Iterable[str]] = None) -> Optional[str]:
        ids = list(candidate_ids) if candidate_ids is not None else list(self.authority_wells)
        valid = [self.authority_wells[str(w)] for w in ids if str(w) in self.authority_wells]
        if not valid:
            return None
        winner = sorted(valid, key=lambda x: (-int(x.get("priority",0)), int(x.get("created_tick",0)), str(x["id"])))[0]
        return str(winner["id"])

    # ------------------------------ validation ------------------------------
    def invariants(self) -> List[str]:
        errors: List[str] = []
        if self.reference_entity not in self.entities:
            errors.append("reference entity missing")
        if self.reference_entity in self.entities and self.reference_position != self.entities[self.reference_entity]["pos"]:
            errors.append("reference position diverges from reference entity")
        if len(self.entities) != len(set(self.entities)):
            errors.append("duplicate entity id")
        for eid, ent in self.entities.items():
            if ent.get("id") != eid:
                errors.append(f"entity id mismatch {eid}")
            if ent.get("region") not in self.regions:
                errors.append(f"entity {eid} unknown region")
        for rid, reg in self.regions.items():
            if reg.get("id") != rid:
                errors.append(f"region id mismatch {rid}")
            for n in reg.get("neighbors", []):
                if n not in self.regions:
                    errors.append(f"region {rid} bad neighbor {n}")
        for role, eid in self.roles.items():
            if eid not in self.entities:
                errors.append(f"role {role} missing occupant")
        if not self.verify_ledger():
            errors.append("ledger integrity")
        return errors

    def summary(self) -> Dict[str, Any]:
        return {
            "schema": WORLD_SCHEMA,
            "version": WORLD_VERSION,
            "tick": self.tick,
            "world_age": self.world_age,
            "era": self.era,
            "regions": len(self.regions),
            "entities": len(self.entities),
            "settlements": len(self.settlements),
            "authority_wells": len(self.authority_wells),
            "archived_regions": sum(1 for r in self.regions.values() if r["archive_state"] == "ARCHIVED"),
            "ledger_events": len(self.ledger),
            "state_sha256": self.state_digest(),
            "ledger_head": self.ledger_head,
            "invariant_errors": self.invariants(),
        }
