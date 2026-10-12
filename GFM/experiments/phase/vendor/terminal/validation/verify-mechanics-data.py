#!/usr/bin/env python3
"""Independent validation of saved RUSSL GFM mechanics data, release 0.5.

Uses only Python's standard library. No production JavaScript is imported or
executed. Field quotient arithmetic, additive characters, multiplicative DFTs,
real rotation matrices, ordinary sample laws and canonical envelope hashes
are recomputed independently. Scope is the finite saved data and integrity;
this does not validate a universal physical theory, unseen source equations,
browser presentation, downloads or live workbench communication.

Run from the extracted release: python validation/verify-mechanics-data.py
A missing packet produces WAITING (exit 2); a mismatch produces FAIL (exit 1).
"""
from __future__ import annotations
import argparse
import cmath
import collections
import hashlib
import json
import math
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
TOLERANCE = 1e-10
# Captured from the preserved v0.4 release before inspecting the new packets.
# Source hashes identify exact supplied bytes, not authorship or physical truth.
BASELINE = {
  "sources": {
    "reference/galois_field_transform_mechanics.pdf": [
      294785,
      "2046247bc504171de09614e6d238ac648b94aac34733c6b7feb4de57ab00f39e"
    ],
    "reference/image-equations/HJPJPQbaYAADLiP.jpg": [
      294305,
      "952aa0ef699a34ed455c523000d0bcaa28aaab334229f334534a6e637eef7912"
    ],
    "reference/RUSSL_Research_Workbench.zip": [
      18553995,
      "23948ed41d93df6b28db41ac9d8fe31ff3cc19a8a5c2ecd9847db430f5d552a5"
    ],
    "reference/blackhole-specification/Black_Hole_Master_Equations.pdf": [
      111534,
      "579b2f4e3833b0207e06359caa85447cdcc705a65b61aadeee7022b52394a6f4"
    ],
    "reference/image-equations/HQMFVPabcAArgH_.jpg": [
      128056,
      "2d6f9bbdc99ab37a2a27c7b5331a78242193a6865d852ce0bea2d51468129a32"
    ],
    "reference/blackhole-specification/User_Simulation_Writeup.txt": [
      1787,
      "e633838bbc6a7dcf44254c88d971e3858014cc469074b3dafa846c4088453907"
    ],
    "reference/image-equations/HKIRhAvaYAEyfhj.jpg": [
      63895,
      "ddc477a36328e1c33639898ddb4d03720fe0c314929a1e5b5f691520a8068b90"
    ],
    "reference/Galois Field Mechanics Equations.txt": [
      26137,
      "000d1849c949ca34b982968e42ea04598c32ccdbf62c9d0d8074c3e440c5c11c"
    ],
    "reference/blackhole-specification/Screenshot 2026-10-11 053124.png": [
      38556,
      "acdde0837646766c2af5e4a9eba3b16b95e9c865785acee73c7a702da2a545b6"
    ],
    "reference/blackhole-specification/aggie aperture.png": [
      232797,
      "9ebea738a8abd85273c0e9a164bcdfaf5daca446a3423307dc0c5e775527efd3"
    ],
    "reference/SpinDoctor-3.1.2-QUANTUM_TERMINAL.html": [
      667930,
      "f8c76a594bd7de371eb8c06414189bcc83991c63e239c4baf32bf8dff0614a31"
    ],
    "reference/blackhole-specification/ETM.jpg": [
      352662,
      "a74761c15e14904c821fd0875a09f819e3b692ae68fe3837dc3437d79a2b2c31"
    ],
    "reference/Equation audit candidate.txt": [
      14113,
      "068f68965b6157c88e9e881a48a6bfacfc040455cb957af17f613785ad0237f8"
    ],
    "reference/Galois Field Transform Mechanics.txt": [
      43498,
      "45b0c90bde66786e732d176ac22781f5058779e8dcc75d305788233f3a15771a"
    ],
    "reference/blackhole-specification/eventHorizon.jpg": [
      469535,
      "7f2a9a28c525e6173eeeb48674fcd5c642c31986eaf94d6619dc00a474a555a5"
    ]
  },
  "historicalArtifacts": {
    "examples/Horizon-Simulation-session.json": "edea14d4cfe466afa50b1a1f8ef2e73ec7162872b87e4b7607f38d4b5012ecd7",
    "examples/GFM-Reapplied-session.json": "e25f02fbdfe5992f902b4c64716e63715974c8e6929e5e8b172900e780cf0586",
    "equation-audit.json": "ada56b111b4c57dbd4ae0abea0e342526494ae06e34287dbf0349753b7644820",
    "image-equations.json": "b47562777764817685bf4f44f28154bdfc7c296d267bb24ac8be95c820e5c93a",
    "examples/Audited-Equations-session.json": "ada781cf9a1ec6d03cf44321e2897621cb9d85e198361a36fd2eb89b13f7a420",
    "examples/Fourier-Weyl-session.json": "d7e3438701761cd5fec6a09092572e50b714f5730b0d95bac6c2fc8f6d25f9c2",
    "horizon-reapplication.json": "d2f984234deed7347754dbc9b14daa0af4aacdb171461971fd7865173682f6c3",
    "horizon-equations.json": "f37cb14ba5fe00928ea968a7bed4ccb4b856f291cf6cb03daccbd9190263e941",
    "gfm-reapplication.json": "d516e6ddc14b2cbb1a5df1445472a5d0a3563c680e9b1400c0325133b5db1e61"
  }
}


class Checks:
    def __init__(self):
        self.count = 0
        self.maximum_scaled_error = 0.0
        self.groups = []
        self.failures = []

    def equal(self, actual, expected, label):
        self.count += 1
        if actual != expected:
            raise ValueError(f"{label}: {actual!r} != {expected!r}")

    def close(self, actual, expected, label, scale=None):
        self.count += 1
        actual, expected = complex(actual), complex(expected)
        if not all(math.isfinite(x) for x in
                   (actual.real, actual.imag, expected.real, expected.imag)):
            raise ValueError(f"{label}: nonfinite value")
        denominator = max(1.0, abs(expected)) if scale is None else scale
        error = abs(actual - expected)
        if denominator:
            error /= denominator
        self.maximum_scaled_error = max(self.maximum_scaled_error, error)
        if error > TOLERANCE:
            raise ValueError(f"{label}: scaled error {error:.17g}")

    def vector(self, actual, expected, label):
        actual = [as_complex(v) for v in actual]
        expected = [as_complex(v) for v in expected]
        self.equal(len(actual), len(expected), label + " dimension")
        scale = norm(expected)
        for i, (value, reference) in enumerate(zip(actual, expected)):
            # Relative to the entire vector, not max(1,||v||): tiny raw data
            # must not accidentally pass a unit-scale tolerance.
            if scale == 0:
                self.equal(value, 0j, f"{label}[{i}] exact zero")
            else:
                self.close(value, reference, f"{label}[{i}]", scale=scale)

    def matrix(self, actual, expected, label):
        self.equal(len(actual), len(expected), label + " rows")
        for i, row in enumerate(expected):
            self.vector(actual[i], row, f"{label}[{i}]")

    def run(self, name, function):
        before = self.count
        try:
            detail = function()
            self.groups.append({"name": name, "assertions": self.count - before,
                                "status": "PASS", "details": detail})
        except (ValueError, KeyError, TypeError, IndexError, ZeroDivisionError,
                OverflowError, OSError, AssertionError) as error:
            self.failures.append(f"{name}: {error}")
            self.groups.append({"name": name, "assertions": self.count - before,
                                "status": "FAIL", "details": str(error)})


def as_complex(value):
    if isinstance(value, dict):
        return complex(value["re"], value["im"])
    if isinstance(value, list):
        return complex(*value)
    return complex(value)


def norm(vector):
    # Hypot avoids squaring underflow/overflow for the permitted raw scale.
    components = [component for v in vector for component in
                  (complex(v).real, complex(v).imag)]
    return math.hypot(*components)


class Field:
    """Independent polynomial quotient; all labels are low-degree-first base p."""
    PROFILES = {
        "gf3": (3, [0, 1]), "gf4": (2, [1, 1, 1]),
        "gf8": (2, [1, 1, 0, 1]), "gf9": (3, [1, 0, 1]),
        "gf16": (2, [1, 1, 0, 0, 1]),
    }

    def __init__(self, name):
        self.name = name
        self.p, self.modulus = self.PROFILES[name]
        self.n = len(self.modulus) - 1
        self.q = self.p ** self.n

    def digits(self, value):
        if type(value) is not int or not 0 <= value < self.q:
            raise ValueError(f"Invalid {self.name} field label {value!r}")
        return [(value // self.p ** i) % self.p for i in range(self.n)]

    def encode(self, values):
        return sum((v % self.p) * self.p ** i for i, v in enumerate(values))

    def add(self, a, b):
        return self.encode([x + y for x, y in zip(self.digits(a), self.digits(b))])

    def mul(self, a, b):
        result = [0] * (2 * self.n - 1)
        for i, x in enumerate(self.digits(a)):
            for j, y in enumerate(self.digits(b)):
                result[i + j] += x * y
        for degree in range(len(result) - 1, self.n - 1, -1):
            factor = result[degree] % self.p
            for j in range(self.n):
                result[degree - self.n + j] -= factor * self.modulus[j]
        return self.encode(result[:self.n])

    def power(self, value, exponent):
        if exponent < 0:
            value, exponent = self.inv(value), -exponent
        result = 1
        while exponent:
            if exponent & 1:
                result = self.mul(result, value)
            value = self.mul(value, value)
            exponent >>= 1
        return result

    def inv(self, value):
        if value == 0:
            raise ZeroDivisionError("Zero field denominator")
        return self.power(value, self.q - 2)

    def trace(self, value):
        total = 0
        for i in range(self.n):
            total = self.add(total, self.power(value, self.p ** i))
        digits = self.digits(total)
        if any(digits[1:]):
            raise ValueError("Trace is not in the prime field")
        return digits[0]

    def primitive(self):
        for generator in range(1, self.q):
            powers = [self.power(generator, j) for j in range(self.q - 1)]
            if len(set(powers)) == self.q - 1:
                return generator, powers
        raise ValueError("No primitive field element")

    def polynomial_dft(self, values, inverse=False):
        generator, _ = self.primitive()
        length = self.q - 1
        result = []
        # Polynomial evaluation at each nonzero field node; inverse uses the
        # reciprocal node and the prime-field image of length, not label N.
        factor = self.inv(length % self.p) if inverse else 1
        for k in range(length):
            total = 0
            for j, value in enumerate(values):
                power = self.power(generator, (-1 if inverse else 1) * j * k)
                total = self.add(total, self.mul(value, power))
            result.append(self.mul(factor, total))
        return result


def fourier(field):
    return [[cmath.exp(2j * math.pi * field.trace(field.mul(k, x)) / field.p)
             / math.sqrt(field.q) for x in range(field.q)]
            for k in range(field.q)]


def adjoint(matrix):
    return [[matrix[i][j].conjugate() for i in range(len(matrix))]
            for j in range(len(matrix))]


def apply(matrix, vector):
    return [sum(a * x for a, x in zip(row, vector)) for row in matrix]


def product(a, b):
    return [[sum(a[i][k] * b[k][j] for k in range(len(b)))
             for j in range(len(b[0]))] for i in range(len(a))]


def real_rotation(axis, degrees):
    angle = math.radians(degrees)
    c, s = math.cos(angle), math.sin(angle)
    if axis == "x":
        return [[1, 0, 0], [0, c, -s], [0, s, c]]
    if axis == "y":
        return [[c, 0, s], [0, 1, 0], [-s, 0, c]]
    if axis == "z":
        return [[c, -s, 0], [s, c, 0], [0, 0, 1]]
    raise ValueError("Unknown rotation axis")


def js_number(value):
    """ECMAScript finite binary64 JSON spelling, without invoking JavaScript.

    Uses shortest round-tripping Python digits with ECMAScript fixed/scientific
    thresholds and exponent spelling. Every retained envelope provides an
    end-to-end check for its actual numbers.
    """
    if type(value) is int and abs(value) <= 2 ** 53:
        return str(value)
    value = float(value)
    if not math.isfinite(value):
        raise ValueError("Nonfinite canonical JSON number")
    if value == 0:
        return "0"
    sign = "-" if value < 0 else ""
    text = repr(abs(value)).lower()
    mantissa, exponent = text.split("e") if "e" in text else (text, "0")
    point = (mantissa.index(".") if "." in mantissa else len(mantissa)) + int(exponent)
    digits = mantissa.replace(".", "")
    while digits.startswith("0"):
        digits, point = digits[1:], point - 1
    digits = digits.rstrip("0")
    power = point - 1
    if -6 <= power < 21:
        if point <= 0:
            body = "0." + "0" * (-point) + digits
        elif point >= len(digits):
            body = digits + "0" * (point - len(digits))
        else:
            body = digits[:point] + "." + digits[point:]
    else:
        body = digits[0] + ("." + digits[1:] if len(digits) > 1 else "")
        body += "e" + ("+" if power >= 0 else "") + str(power)
    return sign + body


def canonical(value):
    if value is None:
        return "null"
    if type(value) is bool:
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return js_number(value)
    if isinstance(value, str):
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    if isinstance(value, list):
        return "[" + ",".join(canonical(v) for v in value) + "]"
    if isinstance(value, dict):
        keys = sorted(value, key=lambda k: k.encode("utf-16-be", errors="surrogatepass"))
        return "{" + ",".join(canonical(k) + ":" + canonical(value[k])
                              for k in keys) + "}"
    raise TypeError("Unsupported canonical data")


def sha(value):
    return hashlib.sha256(canonical(value).encode("utf-8")).hexdigest()


def byte_hash(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def walk(value, location="root"):
    yield location, value
    if isinstance(value, dict):
        for key, child in value.items():
            yield from walk(child, location + "." + key)
    elif isinstance(value, list):
        for i, child in enumerate(value):
            yield from walk(child, location + f"[{i}]")


def expected_samples(dataset):
    """Evaluate declared ordinary source functions, never the JS codec's values."""
    codec, field = dataset["codec"], Field(dataset["field"])
    profile = codec.get("profile")
    p = codec.get("parameters", {})
    nodes = codec.get("nodes")
    if profile == "pendulum":
        grid = [p["maxAngle"] * (2 * j / (field.q - 1) - 1)
                for j in range(field.q)]
        values = [-p["g"] / p["length"] * math.sin(x) for x in grid]
    elif profile in ("gtt", "frameOmega"):
        grid = [p["rMin"] + (p["rMax"] - p["rMin"]) * j / (field.q - 1)
                for j in range(field.q)]
        M, a, Q, theta = p["M"], p["a"], p["Q"], p["theta"]
        values = []
        for r in grid:
            sigma = r * r + a * a * math.cos(theta) ** 2
            delta = r * r - 2 * M * r + a * a + Q * Q
            sine2 = math.sin(theta) ** 2
            gtt = -(1 - (2 * M * r - Q * Q) / sigma)
            gtphi = -a * sine2 * (2 * M * r - Q * Q) / sigma
            gphiphi = sine2 * ((r * r + a * a) ** 2 -
                              a * a * delta * sine2) / sigma
            values.append(gtt if profile == "gtt" else -gtphi / gphiphi)
    elif profile in ("aperture", "gaseousPassage", "aggiePassage"):
        grid = [j / (field.q - 1) for j in range(field.q)]
        cover = int(p["aggieLoad"] >= p["sealThreshold"])
        values = []
        for alpha in grid:
            radius = p["r0"] * math.sqrt(max(0, 1 - (p["alphaCritical"] / alpha) ** 2)) if alpha > p["alphaCritical"] else 0
            values.append(radius if profile == "aperture" else
                          (1 if profile == "gaseousPassage" else 1 - cover)
                          if radius > 0 else 0)
    elif profile == "zetaGamma":
        window = codec["window"]
        grid = [window[0] + (j + .5) * (window[1] - window[0]) / field.q
                for j in range(field.q)]
        values = [t ** (p["s"] - 1) / math.expm1(t) for t in grid]
    elif codec.get("kind") == "raw-zero-samples":
        return None, [0j] * field.q
    else:
        return None, None
    return grid, [complex(v) for v in values]


def validate_dataset(checks, dataset, label):
    checks.equal(set(dataset), {"schema", "field", "domain", "representation",
                               "values", "codec", "operations"}, label + " schema keys")
    checks.equal(dataset["schema"], "RUSSL-GFM-dataset/1", label + " schema")
    f = Field(dataset["field"])
    domain = dataset["domain"]
    checks.equal(domain in ("complex-signal", "field-values"), True, label + " domain")
    values = dataset["values"]
    checks.equal(len(values), f.q if domain == "complex-signal" else f.q - 1,
                 label + " length")
    checks.equal(type(dataset["codec"]) is dict, True, label + " codec")
    checks.equal(type(dataset["operations"]) is list, True, label + " operations")
    checks.equal(len(dataset["operations"]) <= 100, True, label + " operation bound")
    checks.equal(all(type(x) is str and len(x) <= 300 for x in dataset["operations"]),
                 True, label + " inert bounded operations")
    if domain == "field-values":
        for v in values:
            f.digits(v)
        checks.equal(dataset["representation"] in ("samples", "polynomial-coefficients"),
                     True, label + " field representation")
        recovered = f.polynomial_dft(f.polynomial_dft(values), True)
        checks.equal(recovered, values, label + " independent exact round trip")
        checks.equal(f.power(f.primitive()[0], f.q - 1), 1, label + " primitive period")
        return
    checks.equal(dataset["representation"] in ("samples", "trace-coefficients"),
                 True, label + " complex representation")
    values = [as_complex(v) for v in values]
    checks.equal(all(math.isfinite(x) for v in values for x in (v.real, v.imag)),
                 True, label + " finite components")
    checks.equal(norm(values) <= 1e100 * (1 + 1e-12), True, label + " norm bound")
    F = fourier(f)
    y = apply(F, values)
    recovered = apply(adjoint(F), y)
    checks.vector(recovered, values, label + " independent additive round trip")
    checks.close(norm(y), norm(values), label + " raw norm", scale=norm(values) or 1)
    grid, samples = expected_samples(dataset)
    if samples is not None:
        if grid is not None:
            checks.vector(dataset["codec"]["nodes"], grid, label + " source grid")
        expected = samples if dataset["representation"] == "samples" else apply(F, samples)
        # Cartesian rotation output is handled separately; the known profile
        # datasets here are samples or their unmodified trace transforms.
        checks.vector(values, expected, label + " independent source law")
        if dataset["codec"].get("profile") == "pendulum":
            p = dataset["codec"]["parameters"]
            reference = dataset["codec"]["reference"]
            omega = math.sqrt(p["g"] / p["length"])
            checks.close(reference["omega"], omega, label + " omega")
            checks.close(reference["smallAnglePeriod"], 2 * math.pi / omega,
                         label + " small-angle period")


def adaptive_simpson(function, a, b, tolerance=1e-12, depth=24):
    """Independent adaptive integration, rather than production composite grid."""
    mid = (a + b) / 2
    fa, fm, fb = function(a), function(mid), function(b)
    whole = (b - a) * (fa + 4 * fm + fb) / 6

    def refine(a, b, fa, fm, fb, whole, epsilon, remaining):
        mid = (a + b) / 2
        left_mid, right_mid = (a + mid) / 2, (mid + b) / 2
        fl, fr = function(left_mid), function(right_mid)
        left = (mid - a) * (fa + 4 * fl + fm) / 6
        right = (b - mid) * (fm + 4 * fr + fb) / 6
        difference = left + right - whole
        if remaining <= 0 or abs(difference) <= 15 * epsilon:
            return left + right + difference / 15
        return (refine(a, mid, fa, fl, fm, left, epsilon / 2, remaining - 1) +
                refine(mid, b, fm, fr, fb, right, epsilon / 2, remaining - 1))
    return refine(a, b, fa, fm, fb, whole, tolerance, depth)


def validate(root, packet, session, checks):
    details = {"envelopes": [], "datasetCounts": {}, "sourceFiles": 0}
    report = packet["report"]

    def provenance():
        registry = json.loads((root / "source-register.json").read_text(encoding="utf-8"))
        sources = {s["path"]: s for s in registry["sources"]}
        checks.equal(set(sources), set(BASELINE["sources"]), "unchanged original source inventory")
        for path, (length, digest) in BASELINE["sources"].items():
            file = (root / path).resolve()
            checks.equal(file.is_relative_to(root.resolve()), True, path + " safe source path")
            checks.equal(file.stat().st_size, length, path + " preserved bytes")
            checks.equal(byte_hash(file), digest, path + " preserved SHA256")
            checks.equal(sources[path]["bytes"], length, path + " registered bytes")
            checks.equal(sources[path]["sha256"], digest, path + " registered SHA256")
        for path, digest in BASELINE["historicalArtifacts"].items():
            checks.equal(byte_hash(root / path), digest, path + " historical byte preservation")
        checks.equal(packet["currentContract"],
                     (root / "docs/GFM_Terminal_Identity.txt").read_text(encoding="utf-8"),
                     "saved current contract matches corrected documentation")
        checks.equal(packet["imageRegistry"],
                     json.loads((root / "image-equations.json").read_text(encoding="utf-8")),
                     "embedded image registry matches preserved artifact")
        checks.equal(packet["simulationSpecification"],
                     json.loads((root / "horizon-reapplication.json").read_text(encoding="utf-8"))["simulationSpecification"],
                     "embedded historical simulation specification is preserved")
        # Check all nested source witnesses in current saved data against files.
        witnesses = 0
        for location, node in walk({"packet": packet, "session": session}):
            if (type(node) is dict and "path" in node and "bytes" in node and
                    "sha256" in node and "data" not in node):
                file = (root / node["path"]).resolve()
                checks.equal(file.is_relative_to(root.resolve()), True, location + " safe witness path")
                checks.equal(file.stat().st_size, node["bytes"], location + " source bytes")
                checks.equal(byte_hash(file), node["sha256"], location + " source SHA256")
                witnesses += 1
        details["sourceFiles"] = len(sources)
        return {"originalSources": len(sources), "savedSourceWitnesses": witnesses,
                "historicalArtifactsUnchanged": len(BASELINE["historicalArtifacts"])}

    def envelopes():
        def inspect(value, prefix):
            for location, node in walk(value, prefix):
                if type(node) is dict and "sha256" in node and "data" in node:
                    checks.equal(node["sha256"], sha(node["data"]), location + " canonical hash")
                    details["envelopes"].append({"location": location, "sha256": node["sha256"]})
        inspect(packet, "mechanics-reapplication")
        inspect(session, "GFM-Mechanics-session")
        for path in BASELINE["historicalArtifacts"]:
            if path.startswith("examples/"):
                inspect(json.loads((root / path).read_text(encoding="utf-8")), path)
        checks.equal(session["data"]["schema"], "RUSSL-virtual-session/1", "session schema")
        checks.equal(session["data"]["version"], "0.5.0", "session version")
        checks.equal(session["data"]["kind"], "session", "session kind")
        checks.equal(session["data"]["returns"][0]["details"], packet,
                     "session reapplication return equals checked saved packet")
        checks.equal(session["data"]["returns"][0]["command"], "gfm.reapply",
                     "saved reapplication command")
        checks.equal(session["data"]["commandProvenance"], ["gfm.reapply"],
                     "inert command provenance")
        reference = session["data"]["snapshot"]
        checks.equal(reference["model"]["field"]["id"], "gf9", "reference compatibility field")
        checks.vector(reference["state"], [complex(i == 1) for i in range(9)],
                      "reference state remains separate basis vector")
        checks.close(norm([as_complex(v) for v in reference["state"]]), 1,
                     "reference state norm")
        checks.equal(len(details["envelopes"]) > 1, True, "session and record envelopes present")
        records = session["data"]["records"]
        checks.equal(len({r["id"] for r in records}), len(records), "unique record IDs")
        for record in records:
            checks.equal(record["data"]["schema"], "RUSSL-research-record/1", "record schema")
        return {"canonicalEnvelopesChecked": len(details["envelopes"])}

    def scope():
        checks.equal(report["schema"], "RUSSL-GFM-mechanics-reapplication/1", "mechanics report schema")
        checks.equal(report["version"], "0.5.0", "mechanics report version")
        current = json.loads((root / "horizon-equations.json").read_text(encoding="utf-8"))
        historical = json.loads((root / "equation-audit.json").read_text(encoding="utf-8"))
        checks.equal(report["coverage"], {"newFindings": 49, "pdfNumberedEquations": 23,
                                          "previousFindings": 20, "previousImageFamilies": 3},
                     "coverage counts")
        checks.equal({e["id"] for e in report["entries"]},
                     {e["id"] for e in current["entries"]}, "49 source finding IDs")
        checks.equal(len(report["entries"]), 49, "unique current findings")
        reference_commands = {r["command"] for r in report["ordinaryReferences"]}
        outcomes = collections.Counter()
        for entry in report["entries"]:
            source = next(e for e in current["entries"] if e["id"] == entry["id"])
            for key, value in source.items():
                checks.equal(entry[key], value, entry["id"] + " retained source " + key)
            checks.equal(entry["appliedToDataset"], False, entry["id"] + " application qualification")
            expected = ("hypothetical-rule-evaluated" if source["status"] == "toy-assumption"
                        and source["id"] != "image-tensor-map" else
                        "ordinary-reference-calculated" if any(
                            a.get("command") in reference_commands
                            for a in source.get("adapters", [])) else "reference-retained")
            checks.equal(entry["outcome"], expected, entry["id"] + " scoped outcome")
            outcomes[entry["outcome"]] += 1
        old = report["historicalReference"]
        checks.equal(old["registry"], historical, "preserved 20-entry historical registry")
        checks.equal(len(old["entries"]), 20, "historical finding count")
        checks.equal({e["id"] for e in old["entries"]},
                     {e["id"] for e in historical["entries"]}, "historical IDs")
        for entry in old["entries"]:
            checks.equal(entry["outcome"], "historical-reference-retained", entry["id"] + " historical scope")
            checks.equal(entry["appliedToDataset"], False, entry["id"] + " historical not executed")
        return {"dispositions": dict(sorted(outcomes.items())),
                "noProbabilityOrWignerCalculationRequired": True}

    def datasets():
        domain_counts, profile_counts = collections.Counter(), collections.Counter()
        for location, node in walk({"packet": packet, "session": session}):
            if type(node) is dict and node.get("schema") == "RUSSL-GFM-dataset/1":
                validate_dataset(checks, node, location)
                domain_counts[node["domain"]] += 1
                profile_counts[node["codec"].get("profile", node["codec"].get("kind", "unspecified"))] += 1
        checks.equal(domain_counts["complex-signal"] > 0, True, "saved ordinary datasets present")
        checks.equal(domain_counts["field-values"] > 0, True, "saved exact field datasets present")
        details["datasetCounts"] = dict(domain_counts)
        return {"datasetsChecked": dict(domain_counts), "profilesChecked": dict(profile_counts)}

    def primary():
        raw = report["primary"]["samples"]
        restored = report["primary"]["restoredSamples"]
        active = session["data"]["mechanics"]
        f = Field("gf9")
        checks.equal(raw["field"], "gf9", "primary GF9 field")
        checks.equal(raw["representation"], "samples", "primary raw representation")
        values = [as_complex(v) for v in raw["values"]]
        expected = apply(fourier(f), values)
        # The top-level report is wrapped by the builder's actual transformed
        # dataset when it is saved; alternatively session active is that vector.
        transformed = packet.get("dataset", active)
        checks.equal(active, transformed, "session active equals saved primary dataset")
        checks.equal(transformed["field"], "gf9", "primary transformed field")
        checks.equal(transformed["domain"], "complex-signal", "primary coefficient domain")
        checks.equal(transformed["representation"], "trace-coefficients", "primary transformed representation")
        checks.vector(transformed["values"], expected, "raw primary Fourier coefficients")
        checks.vector(restored["values"], values, "primary inverse samples")
        checks.equal(restored["representation"], "samples", "inverse output representation")
        checks.close(norm(expected), norm(values), "primary raw norm", scale=norm(values))
        checks.equal(abs(norm(values) - 1) > .01, True, "primary raw samples were not normalized")
        checks.equal(report["primary"]["transform"]["computationScale"], 1,
                     "default primary computation rescale")
        kernel = report["primary"]["transform"]["kernel"]
        checks.equal(kernel["kind"], "complex-trace-character", "primary kernel domain")
        checks.equal(kernel["q"], 9, "primary kernel length")
        checks.equal(kernel["p"], 3, "primary kernel characteristic")
        for name, check in report["primary"]["checks"].items():
            checks.equal(check["passed"], True, "primary reported check " + name)
        return {"inputNorm": norm(values), "outputNorm": norm(expected),
                "preservesOriginalScale": True}

    def images():
        images = report["images"]
        gf3 = Field("gf3")
        F = fourier(gf3)
        checks.equal(set(images["rotation"]["axes"]), {"x", "y", "z"},
                     "all three pictured real rotation axes")
        for axis, rotation in images["rotation"]["axes"].items():
            checks.equal(rotation["axis"], axis, "rotation axis identity")
            checks.close(rotation["angleDegrees"], 232.75, axis + " pictured angle")
            v = [1+0j, 2+0j, 3+0j]
            R = [[complex(x) for x in row] for row in real_rotation(axis, 232.75)]
            B = product(product(F, R), adjoint(F))
            y, direct = apply(F, v), apply(R, v)
            transformed_output = apply(B, y)
            checks.vector(rotation["input"]["values"], v, axis + " raw input")
            checks.matrix(rotation["matrix"], R, axis + " independent real rotation")
            checks.matrix(rotation["transformedOperator"], B, axis + " conjugated operator")
            checks.vector(rotation["transformedInput"]["values"], y, axis + " F input")
            checks.vector(rotation["transformedOutput"], transformed_output, axis + " B F input")
            checks.vector(rotation["directOutput"], direct, axis + " direct R input")
            checks.vector(rotation["output"]["values"], direct, axis + " inverse output")
            checks.vector(apply(adjoint(F), transformed_output), direct, axis + " independent covariance")
            checks.close(norm(direct), math.sqrt(14), axis + " unnormalized raw norm")
            checks.equal(rotation["passed"], True, axis + " saved status")
            for key, check in rotation["checks"].items():
                checks.equal(check["passed"], True, axis + " reported " + key)
        pendulum = images["pendulum"]
        checks.equal(pendulum["samples"]["codec"]["profile"], "pendulum", "pictured pendulum source")
        checks.vector(pendulum["dataset"]["values"],
                      apply(fourier(Field("gf9")),
                            [as_complex(v) for v in pendulum["samples"]["values"]]),
                      "raw pendulum image transform")
        mellin = images["zetaGamma"]
        checks.equal(mellin["samples"]["codec"]["parameters"]["s"], 2,
                     "pictured zeta reference exponent")
        reference = math.pi ** 2 / 6
        kernel = lambda t: 1.0 if t == 0 else t / math.expm1(t)
        integral = adaptive_simpson(kernel, 0, 64)
        checks.close(integral, reference, "independent adaptive zeta2 integral")
        checks.close(mellin["reference"]["zeta"], reference, "known zeta2")
        checks.close(mellin["reference"]["gamma"], 1, "gamma2")
        checks.close(mellin["reference"]["product"], reference, "known product")
        checks.close(mellin["reference"]["integral"], integral, "separate quadrature")
        checks.vector(mellin["dataset"]["values"],
                      apply(fourier(Field("gf9")),
                            [as_complex(v) for v in mellin["samples"]["values"]]),
                      "raw Mellin image transform")
        checks.equal(images["rotation"]["passed"], True, "rotation family status")
        return {"axesChecked": ["x", "y", "z"], "rawCartesianNorm": math.sqrt(14),
                "zetaGammaReference": reference, "independentAdaptiveIntegral": integral}

    def exact_and_zero_records():
        polynomial_records, zero_records = [], []
        records = session["data"]["records"]
        mechanics_records = [r for r in records if r["data"]["kind"] == "gfm-dataset"]
        for record in mechanics_records:
            d = record["data"]["payload"]["dataset"]
            f = Field(d["field"])
            if d["domain"] == "field-values":
                polynomial_records.append(record)
            elif all(as_complex(x) == 0 for x in d["values"]):
                zero_records.append(record)
                checks.equal(all(x == 0j for x in apply(fourier(f), [0j] * f.q)), True,
                             record["id"] + " exact zero Fourier")
                _, samples = expected_samples(d)
                if samples is not None:
                    checks.equal(samples, [0j] * f.q, record["id"] + " independent zero source")
        checks.equal(len(polynomial_records) >= 1, True,
                     "exact-field coefficient record supplied")
        checks.equal(len(zero_records) >= 1, True, "zero data recorded and preserved")
        pairs = 0
        examples = packet["exactPolynomialExamples"]
        checks.equal(set(examples), set(Field.PROFILES), "all five exact field profiles")
        for name, example in examples.items():
            f = Field(name)
            original = example["input"]
            checks.equal(original["field"], name, name + " exact example field")
            checks.equal(original["values"], list(range(f.q - 1)), name + " declared exact input")
            transformed = f.polynomial_dft(original["values"])
            checks.equal(example["forward"]["dataset"]["values"], transformed,
                         name + " independent polynomial evaluation")
            recovered = f.polynomial_dft(transformed, True)
            checks.equal(example["inverse"]["dataset"]["values"], recovered,
                         name + " independent polynomial interpolation")
            checks.equal(recovered, original["values"], name + " exact input recovery")
            generator, powers = f.primitive()
            for direction, inverse in (("forward", False), ("inverse", True)):
                transform = example[direction]
                kernel = transform["kernel"]
                length = f.q - 1
                factor = f.inv(length % f.p) if inverse else 1
                expected_matrix = [[f.mul(factor, f.power(generator,
                                   (-1 if inverse else 1) * j * k))
                                   for j in range(length)] for k in range(length)]
                checks.equal(kernel["kind"], "finite-field-multiplicative-DFT",
                             name + " exact kernel kind")
                checks.equal(kernel["primitiveRoot"], generator, name + " primitive element")
                checks.equal(kernel["length"], length, name + " transform length")
                checks.equal(kernel["embeddedLength"], length % f.p, name + " embedded length")
                checks.equal(kernel["inverseLength"], f.inv(length % f.p),
                             name + " inverse embedded length")
                checks.equal(kernel["matrix"], expected_matrix, name + " " + direction + " matrix")
                checks.equal(transform["ordering"]["positions"], list(range(length)),
                             name + " polynomial positions")
                checks.equal(transform["ordering"]["nonzeroFieldNodes"], powers,
                             name + " polynomial nodes")
                checks.equal(transform["passed"], True, name + " reported exact status")
            for record in polynomial_records:
                d = record["data"]["payload"]["dataset"]
                if d["field"] == name and d["codec"] == original["codec"]:
                    expected = original if d["representation"] == "samples" else example["forward"]["dataset"]
                    checks.equal(d, expected, record["id"] + " matches independently checked exact example")
                    pairs += 1
        checks.equal(pairs > 0, True, "saved record exact transform checked")
        zero = packet["zeroPassageExample"]
        checks.vector(zero["samples"]["values"], [0j] * 9, "raw zero passage samples")
        checks.vector(zero["transform"]["dataset"]["values"], [0j] * 9,
                      "raw zero passage transformed values")
        checks.equal(zero["transform"]["inputNorm"], 0, "zero input norm")
        checks.equal(zero["transform"]["outputNorm"], 0, "zero output norm")
        checks.equal(zero["transform"]["passed"], True, "zero transform status")
        return {"polynomialRecords": len(polynomial_records), "pairedTransforms": pairs,
                "preservedZeroRecords": len(zero_records),
                "primitiveRoots": {name: Field(name).primitive()[0] for name in Field.PROFILES}}

    checks.run("Original-source and historical-byte preservation", provenance)
    checks.run("Canonical session and record integrity", envelopes)
    checks.run("Complete scoped applicability", scope)
    checks.run("Every saved dataset domain and independent transform", datasets)
    checks.run("Raw GF9 primary trace transform and inverse", primary)
    checks.run("All three real rotations and raw image transports", images)
    checks.run("Exact coefficient pairs and recorded zero data", exact_and_zero_records)
    return details


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    root = args.root.resolve()
    output = args.output or root / "validation/mechanics-independent-verification.json"
    required = ["mechanics-reapplication.json", "examples/GFM-Mechanics-session.json"]
    missing = [path for path in required if not (root / path).is_file()]
    result = {
        "validator": "Independent Python standard library; no production JavaScript execution",
        "version": "0.5.0", "tolerance": TOLERANCE,
        "scope": "Finite saved mechanics datasets, transform/rotation recovery, declared source laws, canonical integrity and unchanged historical bytes.",
        "limits": ["No validation of new physical theory or absent 500-equation suite.",
                   "No browser/download/live-iframe test.",
                   "Finite sample recovery does not certify continuum convergence."],
    }
    if missing:
        result.update(status="WAITING", assertionsEvaluated=0, missingFiles=missing)
        status = 2
    else:
        checks = Checks()
        try:
            packet = json.loads((root / required[0]).read_text(encoding="utf-8"))
            session = json.loads((root / required[1]).read_text(encoding="utf-8"))
            detail = validate(root, packet, session, checks)
        except (OSError, ValueError, TypeError) as error:
            checks.failures.append(str(error))
            detail = {}
        bound_files = required + ["src/gfm-mechanics.js"]
        result.update(status="FAIL" if checks.failures else "PASS",
                      assertionsEvaluated=checks.count,
                      maximumScaledError=checks.maximum_scaled_error,
                      testedFileHashes={path: byte_hash(root / path) for path in required},
                      testedFileBytes={path: (root / path).stat().st_size for path in required},
                      files={path: {"sha256": byte_hash(root / path),
                                    "bytes": (root / path).stat().st_size}
                             for path in bound_files},
                      groups=checks.groups, failures=checks.failures, details=detail)
        status = 1 if checks.failures else 0
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Status: {result['status']}; assertions: {result['assertionsEvaluated']}; report: {output}")
    return status


if __name__ == "__main__":
    sys.exit(main())

