#!/usr/bin/env python3
"""MSSL assembly (BOTTLE ROCKET 3.0.0) -> Columned LCTL-C 1.1 (5.0.0).

Schema: `PA-LCTL/MSSL_TO_LCTLC/1`

Why this is a translation and not a port
----------------------------------------

3.0.0 and 5.0.0 are the same machine wearing two notations. The 3.0.0
assembler's opcode table (`src/brasm.c`) and the 5.0.0 compiler's
(`src/brlctlc.c`) share all 24 of 3.0.0's opcodes in the same order; 5.0.0 adds
eight (CALL RET YIELD TRAP CAPQ CHECKPOINT LDX STX). Both use R0-R15 / C0-C15,
the same four arithmetic modes, and the same BRIM image format. So every 3.0.0
program has an exact 5.0.0 spelling, and this file is that spelling written
down.

Source grammar, read off `brasm.c::instruction` rather than guessed
------------------------------------------------------------------

    directives   .profile NAME | .image_version N | .request_caps A|B | .data …
    label        name:
    comment      # … or ; …
    instruction  OP.MODE operands…            MODE in WRAP|CHECKED|SATURATE|TRAPPING

    NOP/HALT        Cc                        MOVI    Rd, imm, Cc
    MOV             Rd, Ra, Cc                JMP/JZ/JNZ  target, Cc
    ADD…XOR, CMP    Rd, Ra, Rb, Cc            NOT     Rd, Ra, Cc
    SHL/SHR         Rd, Ra, imm, Cc           LOAD    Rd, imm, Cc
    STORE           Ra, imm, Cc               PUSH    Ra, Cc
    POP             Rd, Cc                    SVC     SERVICE, Rd, Ra, Rb, Cc

Target row: ``ID│LANE│OP│OUT│CTRL│IN│ARG│META``, `_` for an absent cell,
multiple inputs joined by `›` (U+203A), separator `│` (U+2502).

Fail-closed
-----------

An opcode, mode, capability or service that 5.0.0 does not accept is a hard
error, not a silent drop. `.data` is refused with a stated reason rather than
approximated: LCTLC/1.1 has no data-section directive, so translating a program
with one would change its meaning.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from typing import Dict, List, Optional, Tuple

SCHEMA = "PA-LCTL/MSSL_TO_LCTLC/1"
SEP = "│"          # LCTLC column separator
IN_SEP = "›"       # LCTLC operand separator

# Opcode table, in `brasm.c` order. 5.0.0 accepts all 24.
OPS = ("NOP", "MOVI", "MOV", "JMP", "JZ", "JNZ", "HALT", "ADD", "SUB", "MUL",
       "DIVU", "MODU", "AND", "OR", "XOR", "NOT", "SHL", "SHR", "CMP", "LOAD",
       "STORE", "PUSH", "POP", "SVC")
MODES = ("WRAP", "CHECKED", "SATURATE", "TRAPPING")
CAPS = ("CONTROL", "ARITH", "MEMORY", "STACK", "SERVICE", "STATE", "UPDATE",
        "DIAG")
SERVICES = ("YIELD", "STATUS", "REVOKE", "DELEGATE", "CONFIGURE", "COMMIT",
            "DIAG_EVENT", "SHA256", "ED25519_VERIFY")

#: 5.0.0 pins these; a 3.0.0 source's own values are recorded but not carried,
#: because the target runtime contract fixes them.
TARGET_UNIT_VERSION = "4.7.0"
TARGET_IMAGE_VERSION = 9

ARITH3 = {"ADD", "SUB", "MUL", "DIVU", "MODU", "AND", "OR", "XOR", "CMP"}

#: `brlctlc.c::q17` -- ops whose META cell must be exactly `_`.
CONTROL_META_NONE = {"NOP", "JMP", "JZ", "JNZ", "HALT"}
#: `q18` -- only these may carry `mode=` in META.
MODE_ALLOWED = {"ADD", "SUB", "MUL", "DIVU", "MODU", "SHL", "SHR"}
#: `q18` -- these require `width=SCALAR64` and forbid `mode=`.
SCALAR_META = {"LOAD", "STORE"}

#: `q19` -- required capability per opcode. LCTLC/1.1 requires the unit's
#: declared `requested_caps` to equal the union of these EXACTLY, so the
#: translator derives them instead of copying the 3.0.0 `.request_caps` line.
OP_CAP = {}
for _o in ("NOP", "MOVI", "MOV", "JMP", "JZ", "JNZ", "HALT"):
    OP_CAP[_o] = "CONTROL"
for _o in ("ADD", "SUB", "MUL", "DIVU", "MODU", "AND", "OR", "XOR", "NOT",
           "SHL", "SHR", "CMP"):
    OP_CAP[_o] = "ARITH"
for _o in ("LOAD", "STORE"):
    OP_CAP[_o] = "MEMORY"
for _o in ("PUSH", "POP"):
    OP_CAP[_o] = "STACK"
CAP_ORDER = ("CONTROL", "ARITH", "MEMORY", "STACK", "SERVICE", "STATE",
             "UPDATE", "DIAG")
#: `q20` -- SVC capability depends on the service index.
SVC_CAP = {0: ("CONTROL",), 1: ("CONTROL",), 2: ("CONTROL",), 3: ("CONTROL",),
           4: ("CONTROL", "SERVICE"), 5: ("CONTROL", "SERVICE"),
           6: ("CONTROL", "DIAG"), 7: ("CONTROL", "STATE"),
           8: ("CONTROL", "STATE")}


class TranslationError(Exception):
    def __init__(self, line_no: int, line: str, reason: str):
        super().__init__(f"line {line_no}: {reason}")
        self.line_no, self.line, self.reason = line_no, line, reason


def _reg(tok: str, kind: str, line_no: int, line: str) -> str:
    m = re.fullmatch(rf"{kind}(\d+)", tok)
    if not m or int(m.group(1)) >= 16:
        raise TranslationError(line_no, line,
                               f"expected {kind}0..{kind}15, got {tok!r}")
    return tok


def _num(tok: str, line_no: int, line: str) -> int:
    try:
        v = int(tok, 0)
    except ValueError:
        raise TranslationError(line_no, line,
                               f"expected an unsigned literal, got {tok!r}") from None
    if v < 0:
        raise TranslationError(line_no, line, "literals are unsigned")
    return v


def translate(text: str, unit_id: str = "mssl.translated",
              module: Optional[str] = None) -> Dict[str, object]:
    """Translate MSSL assembly source into an LCTLC/1.1 unit."""
    profile: Optional[str] = None
    image_version: Optional[int] = None
    caps: Optional[str] = None
    labels: Dict[str, int] = {}
    insns: List[Tuple[int, str, List[str]]] = []   # (src line, raw, tokens)
    notes: List[str] = []

    # --- pass 1: directives, labels, instruction stream -------------------
    ip = 0
    for n, raw in enumerate(text.splitlines(), 1):
        s = re.split(r"[#;]", raw, 1)[0].strip()
        if not s:
            continue
        if s.startswith("."):
            parts = s.split(None, 1)
            key = parts[0]
            val = parts[1].strip() if len(parts) > 1 else ""
            if key == ".profile":
                profile = val
            elif key == ".image_version":
                image_version = _num(val, n, raw)
            elif key == ".request_caps":
                for c in val.split("|"):
                    if c not in CAPS:
                        raise TranslationError(n, raw, f"unknown capability {c!r}")
                caps = val
            elif key == ".data":
                raise TranslationError(
                    n, raw,
                    "LCTLC/1.1 has no data-section directive. Translating a "
                    ".data program would change its meaning, so it is refused "
                    "rather than approximated.")
            else:
                raise TranslationError(n, raw, f"unknown directive {key!r}")
            continue
        if s.endswith(":"):
            name = s[:-1].strip()
            if not name or name in labels:
                raise TranslationError(n, raw, f"bad or duplicate label {name!r}")
            labels[name] = ip
            continue
        toks = [t for t in re.split(r"[ \t,]+", s) if t]
        insns.append((n, raw, toks))
        ip += 1

    if not insns:
        raise TranslationError(0, "", "source contains no instructions")
    if caps is None:
        raise TranslationError(0, "", ".request_caps is required")

    # --- pass 2: rows -----------------------------------------------------
    rows: List[str] = []
    used_ops = set()
    dropped_modes: List[Dict[str, object]] = []
    for idx, (n, raw, toks) in enumerate(insns):
        head = toks[0]
        if "." not in head:
            raise TranslationError(n, raw, "instruction needs an OP.MODE head")
        op, mode = head.split(".", 1)
        if op not in OPS:
            raise TranslationError(n, raw, f"opcode {op!r} is not in the 3.0.0 ISA")
        if mode not in MODES:
            raise TranslationError(n, raw, f"mode {mode!r} is not one of {MODES}")
        used_ops.add(op)
        a = toks[1:]
        out, ins, arg = "_", [], "_"

        def cap(i: int) -> str:
            return _reg(a[i], "C", n, raw)

        if op in ("NOP", "HALT"):
            if len(a) != 1:
                raise TranslationError(n, raw, f"{op} takes one capability")
            ctrl = cap(0)
        elif op == "MOVI":
            if len(a) != 3:
                raise TranslationError(n, raw, "MOVI Rd, imm, Cc")
            out = _reg(a[0], "R", n, raw)
            arg = f"u64:{_num(a[1], n, raw)}"
            ctrl = cap(2)
        elif op == "MOV":
            if len(a) != 3:
                raise TranslationError(n, raw, "MOV Rd, Ra, Cc")
            out, ins, ctrl = _reg(a[0], "R", n, raw), [_reg(a[1], "R", n, raw)], cap(2)
        elif op in ("JMP", "JZ", "JNZ"):
            if len(a) != 2:
                raise TranslationError(n, raw, f"{op} target, Cc")
            tgt = labels.get(a[0])
            if tgt is None:
                tgt = _num(a[0], n, raw)
            if not 0 <= tgt < len(insns):
                raise TranslationError(n, raw,
                                       f"branch target {tgt} is outside the "
                                       f"{len(insns)}-instruction program")
            # LCTLC has no separate label table: a row's own ID is its label,
            # so a branch names the target row rather than an address.
            arg, ctrl = f"label:T{tgt + 1:05d}", cap(1)
        elif op in ARITH3:
            if len(a) != 4:
                raise TranslationError(n, raw, f"{op} Rd, Ra, Rb, Cc")
            out = _reg(a[0], "R", n, raw)
            ins = [_reg(a[1], "R", n, raw), _reg(a[2], "R", n, raw)]
            ctrl = cap(3)
        elif op == "NOT":
            if len(a) != 3:
                raise TranslationError(n, raw, "NOT Rd, Ra, Cc")
            out, ins, ctrl = _reg(a[0], "R", n, raw), [_reg(a[1], "R", n, raw)], cap(2)
        elif op in ("SHL", "SHR"):
            if len(a) != 4:
                raise TranslationError(n, raw, f"{op} Rd, Ra, imm, Cc")
            out = _reg(a[0], "R", n, raw)
            ins = [_reg(a[1], "R", n, raw)]
            arg, ctrl = f"u32:{_num(a[2], n, raw)}", cap(3)
        elif op == "LOAD":
            if len(a) != 3:
                raise TranslationError(n, raw, "LOAD Rd, imm, Cc")
            out, arg, ctrl = _reg(a[0], "R", n, raw), f"mem:{_num(a[1], n, raw)}", cap(2)
        elif op == "STORE":
            if len(a) != 3:
                raise TranslationError(n, raw, "STORE Ra, imm, Cc")
            ins, arg, ctrl = [_reg(a[0], "R", n, raw)], f"mem:{_num(a[1], n, raw)}", cap(2)
        elif op == "PUSH":
            if len(a) != 2:
                raise TranslationError(n, raw, "PUSH Ra, Cc")
            ins, ctrl = [_reg(a[0], "R", n, raw)], cap(1)
        elif op == "POP":
            if len(a) != 2:
                raise TranslationError(n, raw, "POP Rd, Cc")
            out, ctrl = _reg(a[0], "R", n, raw), cap(1)
        elif op == "SVC":
            if len(a) != 5:
                raise TranslationError(n, raw, "SVC SERVICE, Rd, Ra, Rb, Cc")
            if a[0] not in SERVICES:
                raise TranslationError(n, raw, f"unknown service {a[0]!r}")
            arg = f"svc:{a[0]}"
            out = _reg(a[1], "R", n, raw)
            ins = [_reg(a[2], "R", n, raw), _reg(a[3], "R", n, raw)]
            ctrl = cap(4)
        else:                                        # unreachable
            raise TranslationError(n, raw, f"unhandled opcode {op!r}")

        # META, per `brlctlc.c::q18`:
        #   control ops  -> exactly `_` (no mode, no width)
        #   LOAD/STORE   -> `width=SCALAR64`, mode forbidden
        #   everything else -> `width=WIDE`, `mode=` only for the seven ops
        #                      q18 whitelists, and `mode=` must precede `width=`
        if op in CONTROL_META_NONE:
            if mode != "WRAP":
                raise TranslationError(
                    n, raw,
                    f"{op}.{mode}: LCTLC/1.1 forbids an arithmetic mode on a "
                    f"control operation. 3.0.0 encodes one but never reads it; "
                    f"translating it would invent meaning, so a non-WRAP mode "
                    f"here is refused.")
            meta = "_"
        elif op in SCALAR_META:
            if mode != "WRAP":
                raise TranslationError(
                    n, raw, f"{op}.{mode}: LCTLC/1.1 forbids mode= on a memory "
                            f"operation")
            meta = "width=SCALAR64"
        elif mode != "WRAP":
            if op not in MODE_ALLOWED:
                # 3.0.0 lets a bitwise/compare op carry an arithmetic mode;
                # LCTLC/1.1 forbids it. Dropping it is semantics-preserving
                # and that is measured, not assumed: on 3.0.0, AND.WRAP,
                # AND.CHECKED, AND.SATURATE and AND.TRAPPING over the same
                # operands all yield the identical result -- a bitwise
                # operation cannot overflow, so the mode is inert. The drop is
                # recorded per row rather than performed silently.
                dropped_modes.append({"row": f"T{idx + 1:05d}", "op": op,
                                      "mode": mode, "source_line": n})
                meta = "width=WIDE"
            else:
                meta = f"mode={mode};width=WIDE"
        else:
            meta = "width=WIDE"
        rows.append(SEP.join((f"T{idx + 1:05d}", "t", op, out, ctrl,
                              IN_SEP.join(ins) if ins else "_", arg, meta)))

    # LCTLC requires declared caps to equal the derived union exactly.
    need = set()
    for _n, _raw, _t in insns:
        _op = _t[0].split(".", 1)[0]
        if _op == "SVC":
            need.update(SVC_CAP.get(SERVICES.index(_t[1]) if _t[1] in SERVICES
                                    else -1, ("CONTROL",)))
        else:
            need.add(OP_CAP[_op])
    derived = "|".join(c for c in CAP_ORDER if c in need)
    if caps != derived:
        notes.append(
            f".request_caps {caps} in the source is not carried: LCTLC/1.1 "
            f"requires the declared capability set to equal the set the "
            f"opcodes actually need, and 3.0.0 permits declaring more. "
            f"Derived: {derived}.")
    caps = derived

    # LCTLC/1.1 requires every row to be reachable (`brlctlc.c`: "unreachable").
    # 3.0.0 permits dead code. Detect it here and refuse with the offending
    # rows named, rather than emitting a unit the 5.0.0 compiler will reject
    # with a line number the author cannot map back to their source.
    succ: Dict[int, List[int]] = {}
    for k, (_n, _raw, _t) in enumerate(insns):
        o = _t[0].split(".", 1)[0]
        if o == "HALT":
            succ[k] = []
        elif o == "JMP":
            tg = labels.get(_t[1], None)
            succ[k] = [tg if tg is not None else int(_t[1], 0)]
        elif o in ("JZ", "JNZ"):
            tg = labels.get(_t[1], None)
            succ[k] = [tg if tg is not None else int(_t[1], 0), k + 1]
        else:
            succ[k] = [k + 1]
    seen, stack = set(), [0]
    while stack:
        k = stack.pop()
        if k in seen or not 0 <= k < len(insns):
            continue
        seen.add(k)
        stack.extend(succ[k])
    dead = [k for k in range(len(insns)) if k not in seen]
    if dead:
        first = dead[0]
        raise TranslationError(
            insns[first][0], insns[first][1],
            f"{len(dead)} instruction(s) are unreachable "
            f"({', '.join(f'T{k + 1:05d}' for k in dead[:6])}). LCTLC/1.1 "
            f"rejects an unreachable row; 3.0.0 permits dead code. Eliding it "
            f"would renumber every following row and silently change any "
            f"numeric branch target, so this is refused rather than "
            f"optimised. Remove the dead code in the MSSL source and retry.")

    mod = module or unit_id
    entry = "T00001"
    if image_version is not None and image_version != TARGET_IMAGE_VERSION:
        notes.append(
            f".image_version {image_version} in the source is not carried: the "
            f"5.0.0 runtime contract pins image_version="
            f"{TARGET_IMAGE_VERSION}. The image body is unchanged; only the "
            f"container version differs.")
    if dropped_modes:
        notes.append(
            f"{len(dropped_modes)} inert arithmetic mode(s) dropped from "
            f"bitwise/compare rows; measured on 3.0.0 to have no effect on the "
            f"result. See `dropped_modes`.")
    if profile and profile != "SIM_CORE":
        notes.append(f"source profile {profile!r} recorded; target profile is "
                     f"brvm-native")

    head = [
        "LCTLC/1.1",
        (f"@unit id={unit_id} version={TARGET_UNIT_VERSION} profile=brvm-native "
         f"entry={entry} target=local-reference backend=brir network=deny "
         f"replay=deterministic image_version={TARGET_IMAGE_VERSION} "
         f"requested_caps={caps} max_steps={len(rows) + 1} "
         f"termination=bounded"),
        "@defaults mode=WRAP width=WIDE",
        f"@frame id=F0000 parent=ROOT module={mod}",
        SEP.join(("ID", "LANE", "OP", "OUT", "CTRL", "IN", "ARG", "META")),
    ]
    return {
        "schema": SCHEMA,
        "lctlc": "\n".join(head + rows + ["@end"]) + "\n",
        "instructions": len(rows),
        "labels": labels,
        "opcodes_used": sorted(used_ops),
        "source_profile": profile,
        "source_image_version": image_version,
        "requested_caps": caps,
        "notes": notes,
        "dropped_modes": dropped_modes,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("source")
    ap.add_argument("output", nargs="?")
    ap.add_argument("--id", default=None)
    ap.add_argument("--report", action="store_true")
    a = ap.parse_args()
    with open(a.source, encoding="utf-8") as fh:
        text = fh.read()
    uid = a.id or ("mssl." + os.path.splitext(os.path.basename(a.source))[0])
    try:
        r = translate(text, unit_id=uid)
    except TranslationError as exc:
        print(f"REFUSED  {a.source}: {exc}", file=sys.stderr)
        return 2
    if a.output:
        with open(a.output, "w", encoding="utf-8") as fh:
            fh.write(r["lctlc"])
    else:
        sys.stdout.write(r["lctlc"])
    if a.report:
        print(json.dumps({k: v for k, v in r.items() if k != "lctlc"},
                         indent=2), file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
