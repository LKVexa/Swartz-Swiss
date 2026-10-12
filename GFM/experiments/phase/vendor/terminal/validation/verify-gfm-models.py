#!/usr/bin/env python3
"""Independent standard-library validation of the saved v0.3 GFM packet.

No JavaScript module is imported or executed. Finite fields, Fourier kernels,
matrices, sample values, adaptive quadrature and Wigner expectations are
recomputed here. This checks the finite saved experiment, not new physics,
the unavailable 500-equation suite, browser behavior, or continuum convergence.
Run from the release folder: python validation/verify-gfm-models.py
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
TOL = 1e-10


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

    def close(self, actual, expected, label, tolerance=TOL):
        self.count += 1
        actual, expected = complex(actual), complex(expected)
        if not all(math.isfinite(v) for v in (actual.real, actual.imag,
                                              expected.real, expected.imag)):
            raise ValueError(f"{label}: nonfinite numeric value")
        error = abs(actual - expected) / max(1.0, abs(expected))
        self.maximum_scaled_error = max(self.maximum_scaled_error, error)
        if error > tolerance:
            raise ValueError(f"{label}: scaled error {error:.17g} > {tolerance}")

    def vector(self, actual, expected, label):
        actual = [as_complex(v) for v in actual]
        self.equal(len(actual), len(expected), label + " dimension")
        for i, (a, e) in enumerate(zip(actual, expected)):
            self.close(a, e, f"{label}[{i}]")

    def matrix(self, actual, expected, label):
        self.equal(len(actual), len(expected), label + " rows")
        for i, (row, expected_row) in enumerate(zip(actual, expected)):
            self.vector(row, expected_row, f"{label} row {i}")

    def run(self, name, function):
        before = self.count
        try:
            details = function()
            self.groups.append((name, self.count - before, details or ""))
        except (ValueError, KeyError, TypeError, IndexError, ZeroDivisionError) as error:
            self.failures.append(f"{name}: {error}")


def as_complex(value):
    if isinstance(value, dict):
        return complex(value["re"], value["im"])
    return complex(value)


class Field:
    """Polynomial quotient with independently fixed published release profiles."""
    PROFILES = {"gf3": (3, [0, 1]), "gf4": (2, [1, 1, 1]),
                "gf9": (3, [1, 0, 1])}

    def __init__(self, name):
        self.name = name
        self.p, self.polynomial = self.PROFILES[name]
        self.n = len(self.polynomial) - 1
        self.order = self.p ** self.n

    def coefficients(self, value):
        if type(value) is not int or not 0 <= value < self.order:
            raise ValueError(f"Invalid {self.name} field label {value!r}")
        return [(value // self.p ** i) % self.p for i in range(self.n)]

    def encode(self, coefficients):
        return sum((v % self.p) * self.p ** i for i, v in enumerate(coefficients))

    def integer(self, value):
        return value % self.p

    def add(self, a, b):
        return self.encode([x + y for x, y in
                            zip(self.coefficients(a), self.coefficients(b))])

    def neg(self, value):
        return self.encode([-v for v in self.coefficients(value)])

    def sub(self, a, b):
        return self.add(a, self.neg(b))

    def mul(self, a, b):
        aa, bb = self.coefficients(a), self.coefficients(b)
        result = [0] * (2 * self.n - 1)
        for i, x in enumerate(aa):
            for j, y in enumerate(bb):
                result[i + j] += x * y
        for degree in range(len(result) - 1, self.n - 1, -1):
            factor = result[degree] % self.p
            for j in range(self.n):
                result[degree - self.n + j] -= factor * self.polynomial[j]
        return self.encode(result[:self.n])

    def power(self, value, exponent):
        result = 1
        for _ in range(exponent):
            result = self.mul(result, value)
        return result

    def inv(self, value):
        if value == 0:
            raise ZeroDivisionError("Finite-field denominator is zero")
        return self.power(value, self.order - 2)

    def trace(self, value):
        total = 0
        for exponent in range(self.n):
            total = self.add(total, self.power(value, self.p ** exponent))
        coefficients = self.coefficients(total)
        if any(coefficients[1:]):
            raise ValueError("Absolute trace failed to land in the prime field")
        return coefficients[0]

    def character(self, value):
        return cmath.exp(2j * math.pi * self.trace(value) / self.p)


def norm(vector):
    return math.sqrt(math.fsum(abs(v) ** 2 for v in vector))


def fourier(field):
    q = field.order
    return [[field.character(field.mul(k, x)) / math.sqrt(q)
             for x in range(q)] for k in range(q)]


def adjoint(matrix):
    return [[matrix[i][j].conjugate() for i in range(len(matrix))]
            for j in range(len(matrix))]


def product(a, b):
    return [[sum(a[i][k] * b[k][j] for k in range(len(a)))
             for j in range(len(a))] for i in range(len(a))]


def apply(matrix, vector):
    return [sum(v * x for v, x in zip(row, vector)) for row in matrix]


def field_apply(field, matrix, vector):
    result = []
    for row in matrix:
        total = 0
        for value, coordinate in zip(row, vector):
            total = field.add(total, field.mul(value, coordinate))
        result.append(total)
    return result


def field_product(field, a, b):
    columns = [field_apply(field, a, [row[j] for row in b])
               for j in range(len(b))]
    return [list(row) for row in zip(*columns)]


def displacement(field, vector, xi, zeta):
    q = field.order
    half = field.inv(field.integer(2))
    central = field.character(field.neg(field.mul(half, field.mul(xi, zeta))))
    return [central * field.character(field.mul(zeta, x)) *
            vector[field.sub(x, xi)] for x in range(q)]


def reflection(field, vector, q0, p0):
    result = []
    for x in range(field.order):
        y = field.sub(field.add(q0, q0), x)
        result.append(field.character(field.mul(p0, field.sub(x, y))) * vector[y])
    return result


def wigner(field, vector):
    # Direct constrained double-index expectation, not a JS operator call.
    return [[sum(vector[x].conjugate() * vector[y] *
                 field.character(field.mul(p0, field.sub(x, y)))
                 for x in range(field.order) for y in range(field.order)
                 if field.add(x, y) == field.add(q0, q0)) / field.order
             for p0 in range(field.order)] for q0 in range(field.order)]


def verify_samples(checks, record, field, values, name):
    values = [complex(v) for v in values]
    scale = norm(values)
    normalized = [value / scale for value in values]
    F = fourier(field)
    transformed = apply(F, normalized)
    transform = record["transform"]
    checks.vector(transform["originalValues"], values, name + " raw samples")
    checks.close(transform["scale"], scale, name + " L2 scale")
    checks.vector(transform["normalizedSamples"], normalized, name + " normalized")
    checks.vector(transform["transformedState"], transformed, name + " positive Fourier")
    checks.vector(record["preparedState"], transformed, name + " prepared state")
    checks.vector(transform["restoredValues"], values, name + " restored raw samples")
    checks.vector(transform["unscaledCoefficients"], [v * scale for v in transformed],
                  name + " unscaled Fourier coefficients")
    checks.vector(apply(adjoint(F), transformed), normalized, name + " independent inverse")
    checks.close(record["preparation"]["originalL2Scale"], scale,
                 name + " preparation scale metadata")
    checks.equal(record["preparation"]["field"], field.name, name + " preparation field")
    checks.equal(transform["passed"], True, name + " reported sample status")
    return transformed


def verify_reapplication(checks, record, field, A, name):
    q = field.order
    reapplication = record["reapplication"]
    vector = [as_complex(v) for v in reapplication["input"]]
    checks.equal(len(vector), q, name + " input dimension")
    checks.close(norm(vector), 1, name + " input norm")
    F = fourier(field)
    transformed_input = apply(F, vector)
    B = product(product(F, A), adjoint(F))
    transformed_output = apply(B, transformed_input)
    output = apply(A, vector)
    checks.vector(reapplication["transformedInput"], transformed_input, name + " F input")
    checks.matrix(reapplication["transformedOperator"], B, name + " F A F adjoint")
    checks.vector(reapplication["transformedOutput"], transformed_output, name + " B F input")
    checks.vector(reapplication["output"], output, name + " original basis output")
    checks.vector(reapplication["directOutput"], output, name + " direct output")
    checks.vector(record["preparedState"], output, name + " final preparation")
    checks.matrix(product(product(adjoint(F), B), F), A, name + " operator recovery")
    checks.vector(apply(adjoint(F), transformed_output), output, name + " output covariance")
    checks.equal(record["passed"], True, name + " reported adapter status")


def adaptive_integral(function, left, right, tolerance=2e-13):
    # Adaptive recursive Simpson with its own refinement and interval choices;
    # independent of the production fixed 16,384-subinterval implementation.
    midpoint = (left + right) / 2
    fa, fm, fb = function(left), function(midpoint), function(right)
    initial = (right - left) * (fa + 4 * fm + fb) / 6

    def refine(a, b, va, vm, vb, estimate, budget, depth):
        mid = (a + b) / 2
        vl, vr = function((a + mid) / 2), function((mid + b) / 2)
        lower = (mid - a) * (va + 4 * vl + vm) / 6
        upper = (b - mid) * (vm + 4 * vr + vb) / 6
        delta = lower + upper - estimate
        if abs(delta) <= 15 * budget:
            return lower + upper + delta / 15
        if depth == 0:
            raise ValueError("Independent adaptive quadrature failed to converge")
        return (refine(a, mid, va, vl, vm, lower, budget / 2, depth - 1) +
                refine(mid, b, vm, vr, vb, upper, budget / 2, depth - 1))

    return refine(left, right, fa, fm, fb, initial, tolerance, 28)


def validate(packet, registry, image_registry, checks):
    gf9, gf3 = Field("gf9"), Field("gf3")

    def sources_and_coverage():
        checks.equal(packet["schema"], "RUSSL-GFM-reapplication/1", "packet schema")
        checks.equal(packet["version"], "0.3.0", "packet version")
        checks.equal(packet["sourceAudit"]["sha256"], registry["source"]["sha256"], "audit hash")
        original = (ROOT / registry["source"]["path"]).read_bytes()
        checks.equal(hashlib.sha256(original).hexdigest(), registry["source"]["sha256"], "source bytes")
        expected_ids = {"field-algebra", "eq-28", "eq-37", "eq-67", "eq-78", "eq-88",
                        "wigner", "mana", "eq-181", "eq-318", "eq-319", "eq-417", "eq-437",
                        "eq-438", "eq-370", "characteristic-two", "intervals", "stabilizer",
                        "complexity", "report-scope"}
        checks.equal(len(packet["entries"]), 20, "stored entry count")
        checks.equal({e["id"] for e in packet["entries"]}, expected_ids, "all stored IDs")
        checks.equal({e["id"] for e in registry["entries"]}, expected_ids, "registry IDs")
        lookup = {e["id"]: e for e in registry["entries"]}
        for entry in packet["entries"]:
            source = lookup[entry["id"]]
            checks.equal(entry["sourceStatus"], source["status"], entry["id"] + " status")
            checks.equal(entry["sourceFormula"], source["formula"], entry["id"] + " formula")
            if source["status"] in ("rejected", "unresolved"):
                checks.equal(entry["outcome"], "reference-only", entry["id"] + " inert disposition")
                checks.equal(entry["applied"], False, entry["id"] + " nonexecution")
        checks.equal(set(packet["images"]), {"pendulum", "rotation", "zetaGamma"}, "image families")
        checks.equal(packet["coverage"]["storedFindings"], 20, "coverage stored count")
        checks.equal(packet["coverage"]["imageFamilies"], 3, "coverage image count")
        checks.equal(packet["coverage"]["parsedImageStatements"], 15, "image statement count")
        checks.equal(dict(collections.Counter(e["outcome"] for e in packet["entries"])),
                     packet["coverage"]["outcomes"], "coverage outcome counts")
        image_sources = {e["id"]: e["source"] for e in packet["imageSources"]}
        for entry in image_registry["entries"]:
            source = entry["source"]
            checks.equal(image_sources[entry["id"]], source, entry["id"] + " packet provenance")
            raw = (ROOT / source["path"]).read_bytes()
            checks.equal(len(raw), source["bytes"], entry["id"] + " byte count")
            checks.equal(hashlib.sha256(raw).hexdigest(), source["sha256"], entry["id"] + " hash")
        checks.equal(gf9.mul(3, 3), 2, "GF9 x squared equals minus one")
        checks.equal(gf9.trace(1), 2, "GF9 absolute trace of one")
        checks.equal(gf9.trace(3), 0, "GF9 absolute trace of x")
        return "20 unique stored IDs, 3 image families, 15 source statements; original-byte hashes match."

    def pendulum():
        record = packet["images"]["pendulum"]
        params = record["parameters"]
        g, length, angle = params["g"], params["length"], params["maxAngle"]
        checks.equal(params, {"g": 9.81, "length": 1, "maxAngle": .2}, "saved pendulum parameters")
        values = []
        errors = []
        for label, sample in enumerate(record["samples"]):
            theta = angle * (2 * label / (gf9.order - 1) - 1)
            acceleration = -(g / length) * math.sin(theta)
            linear = -(g / length) * theta
            error = 0 if theta == 0 else abs(math.sin(theta) / theta - 1)
            checks.equal(sample["label"], label, "pendulum label")
            checks.close(sample["theta"], theta, "pendulum theta")
            checks.close(sample["acceleration"], acceleration, "pendulum acceleration")
            checks.close(sample["linearAcceleration"], linear, "pendulum linear acceleration")
            checks.close(sample["absoluteLinearError"], abs(acceleration - linear), "linear absolute error")
            checks.close(sample["relativeToLinear"], error, "linear relative error")
            if error > angle ** 2 / 6 + TOL:
                raise ValueError("Small-angle sine error exceeds theta_max squared / 6")
            values.append(acceleration)
            errors.append(error)
        checks.equal(len(values), 9, "pendulum sample count")
        checks.vector(record["codec"]["nodes"], [s["theta"] for s in record["samples"]], "pendulum grid metadata")
        reference = record["reference"]
        omega = math.sqrt(g / length)
        checks.close(reference["omega"], omega, "pendulum omega")
        checks.close(reference["frequency"], omega / (2 * math.pi), "pendulum frequency")
        checks.close(reference["smallAnglePeriod"], 2 * math.pi / omega, "pendulum period")
        checks.close(reference["maximumSampleRelativeLinearError"], max(errors), "maximum sine error")
        checks.close(reference["relativeLinearErrorBound"], angle ** 2 / 6, "sine error bound")
        verify_samples(checks, record, gf9, values, "pendulum")
        return f"omega={omega:.15g}, T={2 * math.pi / omega:.15g}; exact sine samples and scale recover."

    def rotation():
        record = packet["images"]["rotation"]
        checks.equal(set(record["otherAxes"]), {"y", "z"}, "all pictured rotation axes")
        theta = math.radians(232.75)
        c, s = math.cos(theta), math.sin(theta)
        real_matrices = {
            "x": [[1, 0, 0], [0, c, -s], [0, s, c]],
            "y": [[c, 0, s], [0, 1, 0], [-s, 0, c]],
            "z": [[c, -s, 0], [s, c, 0], [0, 0, 1]],
        }
        records = {"x": record, **record["otherAxes"]}
        for axis, axis_record in records.items():
            name = "R" + axis
            checks.equal(axis_record["axis"], axis, name + " axis")
            checks.equal(axis_record["angleDegrees"], 232.75, name + " degrees")
            A = [[complex(value) for value in row] for row in real_matrices[axis]]
            checks.matrix(axis_record["original"]["matrix"], A, "real " + name + " matrix")
            checks.close(axis_record["original"]["angleRadians"], theta, name + " degree conversion")
            checks.close(axis_record["original"]["determinant"], 1, name + " determinant")
            checks.matrix(product(adjoint(A), A), [[1, 0, 0], [0, 1, 0], [0, 0, 1]], name + " orthogonality")
            checks.vector(axis_record["reapplication"]["input"], [0, 1, 0], name + " saved basis input")
            verify_reapplication(checks, axis_record, gf3, A, "GF3 " + name)
        return "All pictured Rx, Ry and Rz at 232.75 degrees: positive GF3 Fourier conjugation, transformed input and inverse recovery agree."

    def zeta():
        record = packet["images"]["zetaGamma"]
        checks.equal(record["s"], 2, "saved Mellin exponent")
        values = []
        width = 12 / 9
        for label, sample in enumerate(record["samples"]):
            t = (label + .5) * width
            value = t / math.expm1(t)
            checks.equal(sample["label"], label, "Mellin label")
            checks.close(sample["t"], t, "Mellin sample coordinate")
            checks.close(sample["value"], value, "Mellin sample value")
            values.append(value)
        checks.equal(len(values), 9, "Mellin sample count")
        verify_samples(checks, record, gf9, values, "Mellin")
        reference = record["reference"]
        known = math.pi ** 2 / 6  # Exact zeta(2) * Gamma(2), Gamma(2)=1.
        integral = adaptive_integral(lambda t: 1 if t == 0 else t / math.expm1(t), 0, 64)
        checks.close(integral, known, "independent adaptive integral versus pi squared / 6", 2e-12)
        checks.close(reference["zeta"], known, "production zeta(2) reference")
        checks.close(reference["gamma"], 1, "Gamma(2)")
        checks.close(reference["product"], known, "zeta Gamma product")
        checks.close(reference["integral"], integral, "production Simpson versus adaptive integral")
        expected_residual = abs(reference["integral"] - reference["product"]) / max(1, abs(reference["product"]))
        checks.close(reference["relativeIdentityResidual"], expected_residual, "reported integral residual")
        checks.equal(reference["passed"], True, "reported integral status")
        for section, limit in ((reference, 64), (record["finiteSampling"], 12)):
            bound = math.exp(-limit) * (1 + limit) / (1 - math.exp(-limit))
            checks.close(section["tailUpperBound"], bound, "Mellin tail upper bound")
        coarse = width * math.fsum(values)
        checks.close(record["finiteSampling"]["coarseIntegral"], coarse, "finite midpoint integral")
        checks.close(record["finiteSampling"]["absoluteDifferenceFromReference"], abs(coarse - known), "finite-sampling error")
        return f"Saved s=2 only: adaptive integral={integral:.16g}, pi^2/6={known:.16g}. Other s are not certified by this packet check."

    def exact_analogues():
        osc = packet["exactAnalogues"]["oscillator"]
        checks.equal(osc["field"], "gf9", "oscillator field")
        kappa, h, steps = (osc["parameters"][key] for key in ("kappa", "h", "steps"))
        half, quarter = gf9.inv(gf9.integer(2)), gf9.inv(gf9.integer(4))
        h2k = gf9.mul(gf9.mul(h, h), kappa)
        a = gf9.sub(1, gf9.mul(h2k, half))
        lower = gf9.neg(gf9.mul(gf9.mul(h, kappa), gf9.sub(1, gf9.mul(h2k, quarter))))
        A = [[a, h], [lower, a]]
        checks.equal(osc["matrix"], A, "derived Verlet matrix")
        determinant = gf9.sub(gf9.mul(a, a), gf9.mul(h, lower))
        checks.equal(determinant, 1, "independent Verlet determinant")
        checks.equal(osc["determinant"], determinant, "reported Verlet determinant")
        omega = [[0, 1], [gf9.neg(1), 0]]
        transpose = [list(row) for row in zip(*A)]
        checks.equal(field_product(gf9, field_product(gf9, transpose, omega), A),
                     omega, "independent Verlet symplectic form")
        initial = [osc["initial"]["q"], osc["initial"]["v"]]
        state = initial[:]
        checks.equal(len(osc["trajectory"]), steps + 1, "trajectory length")
        for step, sample in enumerate(osc["trajectory"]):
            checks.equal(sample, {"step": step, "q": state[0], "v": state[1]}, "exact trajectory")
            if step < steps:
                state = field_apply(gf9, A, state)
        checks.equal(osc["final"], {"q": state[0], "v": state[1]}, "exact final coordinates")
        inverse = [[a, gf9.neg(h)], [gf9.neg(lower), a]]
        for _ in range(steps):
            state = field_apply(gf9, inverse, state)
        checks.equal(state, initial, "independent Verlet inverse")
        state, seen = initial[:], set()
        while tuple(state) not in seen:
            seen.add(tuple(state))
            state = field_apply(gf9, A, state)
        checks.equal(state, initial, "orbit closes at initial state")
        checks.equal(osc["orbit"]["length"], len(seen), "exact finite recurrence")
        checks.equal(osc["orbit"]["preperiod"], 0, "orbit preperiod")
        checks.equal(osc["orbit"]["statesVisited"], len(seen), "visited orbit states")
        checks.equal(osc["orbit"]["bound"], 81, "GF9 coordinate orbit bound")
        for name, passed in osc["checks"].items():
            checks.equal(passed, True, "reported oscillator " + name)
        rot = packet["exactAnalogues"]["rotation"]
        checks.equal(rot["field"], "gf9", "field rotation field")
        checks.equal(rot["axis"], "x", "field rotation axis")
        t = rot["parameter"]
        denominator = gf9.add(1, gf9.mul(t, t))
        c = gf9.mul(gf9.sub(1, gf9.mul(t, t)), gf9.inv(denominator))
        s = gf9.mul(gf9.add(t, t), gf9.inv(denominator))
        R = [[1, 0, 0], [0, c, gf9.neg(s)], [0, s, c]]
        checks.equal(rot["denominator"], denominator, "field rotation denominator")
        checks.equal(rot["c"], c, "rational cosine coordinate")
        checks.equal(rot["s"], s, "rational sine coordinate")
        checks.equal(gf9.add(gf9.mul(c, c), gf9.mul(s, s)), 1,
                     "independent finite-field unit circle")
        checks.equal(rot["matrix"], R, "exact field rotation matrix")
        checks.equal(field_product(gf9, [list(row) for row in zip(*R)], R),
                     [[1, 0, 0], [0, 1, 0], [0, 0, 1]], "independent field orthogonality")
        output = field_apply(gf9, R, rot["point"])
        checks.equal(rot["output"], output, "exact rotated coordinates")
        form = lambda vector: gf9.add(gf9.add(gf9.mul(vector[0], vector[0]), gf9.mul(vector[1], vector[1])), gf9.mul(vector[2], vector[2]))
        checks.equal(rot["inputQuadraticForm"], form(rot["point"]), "input quadratic form")
        checks.equal(rot["outputQuadraticForm"], form(output), "output quadratic form")
        checks.equal(form(output), form(rot["point"]), "independent quadratic-form preservation")
        checks.equal(rot["determinant"], 1, "field rotation determinant")
        checks.equal(field_apply(gf9, [[1, 0, 0], [0, c, s], [0, gf9.neg(s), c]], output), rot["point"], "exact rotation inverse")
        for name, passed in rot["checks"].items():
            checks.equal(passed, True, "reported field rotation " + name)
        return f"GF9 closed-form Verlet trajectory, inverse and orbit ({len(seen)} states); rational rotation and quadratic form agree exactly."

    def stored_adapters():
        for entry in packet["entries"]:
            field = Field(entry["field"])
            key = entry["id"]
            if key in ("eq-67", "eq-88"):
                xi, zeta = entry["parameters"]["xi"], entry["parameters"]["zeta"]
                operator = displacement if key == "eq-67" else reflection
                columns = [operator(field, [complex(int(i == j)) for i in range(field.order)], xi, zeta)
                           for j in range(field.order)]
                A = [[columns[j][i] for j in range(field.order)] for i in range(field.order)]
                verify_reapplication(checks, entry, field, A, key)
            elif key == "eq-181":
                r = 1 / math.sqrt(2)
                verify_reapplication(checks, entry, field,
                                     [[1, 0, 0, 0], [0, r, r, 0], [0, r, -r, 0], [0, 0, 0, 1]], key)
            elif key == "eq-417":
                dt, hbar = entry["parameters"]["dt"], entry["parameters"]["hbar"]
                A = [[(1 - 1j * dt * i / (2 * hbar)) / (1 + 1j * dt * i / (2 * hbar))
                      if i == j else 0j for j in range(field.order)] for i in range(field.order)]
                verify_reapplication(checks, entry, field, A, key)
            elif key in ("eq-28", "eq-37", "eq-318", "eq-319"):
                if key == "eq-28":
                    values = [field.character(x) for x in range(field.order)]
                elif key == "eq-37":
                    values = [0 if x == 0 else 1 if field.power(x, (field.order - 1) // 2) == 1 else -1
                              for x in range(field.order)]
                else:
                    values = [((x - x ** field.p) // field.p) % field.p for x in range(field.order)]
                verify_samples(checks, entry, field, values, key)
            elif key in ("wigner", "mana"):
                covariance = entry["covariance"]
                vector = [0j] * field.order
                vector[1] = 1
                grid = wigner(field, vector)
                checks.matrix(covariance["wigner"]["grid"], grid, key + " original grid")
                checks.matrix(covariance["transformedGrid"], grid, key + " covariant grid")
                checks.vector(covariance["transformedState"], apply(fourier(field), vector), key + " covariant state")
            elif key == "eq-78":
                checks.equal(entry["labelMap"]["output"], {"x": 2, "y": 1}, "symplectic shear labels")
                checks.equal(entry["labelMap"]["determinant"], 1, "symplectic label determinant")
        return "All implemented stored adapters independently checked; rejected/unresolved entries remain inert."

    def final_state():
        pendulum_record = packet["images"]["pendulum"]
        values = [complex(-(9.81) * math.sin(.2 * (2 * i / 8 - 1))) for i in range(9)]
        prepared = apply(fourier(gf9), [v / norm(values) for v in values])
        final = reflection(gf9, displacement(gf9, prepared, 3, 4), 3, 4)
        saved = packet["finalState"]
        checks.equal(saved["field"], "gf9", "final field")
        checks.vector(saved["vector"], final, "final D(3,4) then R(3,4) vector")
        expected_preparation = dict(pendulum_record["preparation"])
        expected_preparation["subsequentOperations"] = ["gf.displace 3 4", "gf.reflect 3 4"]
        checks.equal(saved["preparation"], expected_preparation, "final source-signal metadata and operator provenance")
        checks.close(norm(final), 1, "final norm")
        grid = wigner(gf9, final)
        checks.matrix(saved["wigner"]["grid"], grid, "full independent final Wigner grid")
        for row in grid:
            for value in row:
                checks.close(value.imag, 0, "independent Wigner reality")
        reals = [[value.real for value in row] for row in grid]
        position = [math.fsum(row) for row in reals]
        momentum = [math.fsum(row[j] for row in reals) for j in range(9)]
        expected_position = [abs(v) ** 2 for v in final]
        expected_momentum = [abs(v) ** 2 for v in apply(adjoint(fourier(gf9)), final)]
        checks.vector(position, expected_position, "independent position marginal")
        checks.vector(momentum, expected_momentum, "independent negative-Fourier momentum marginal")
        for key, expected in (("position", position), ("momentum", momentum),
                              ("expectedPosition", expected_position), ("expectedMomentum", expected_momentum)):
            checks.vector(saved["wigner"]["marginals"][key], expected, "saved marginal " + key)
        flat = [v for row in reals for v in row]
        l1 = math.fsum(abs(v) for v in flat)
        purity = 9 * math.fsum(v * v for v in flat)
        checks.close(saved["wigner"]["normalization"], math.fsum(flat), "Wigner normalization")
        checks.close(saved["wigner"]["purity"], purity, "Wigner purity")
        checks.close(purity, 1, "independent pure-state identity")
        checks.close(saved["wigner"]["l1Norm"], l1, "Wigner L1 norm")
        checks.close(saved["wigner"]["mana"], math.log2(l1), "base-two mana")
        checks.equal(saved["wigner"]["manaLogBase"], 2, "mana log base")
        checks.equal(saved["wigner"]["negativeCellCount"], sum(v < -TOL for v in flat), "negative Wigner count")
        checks.close(saved["wigner"]["minValue"], min(flat), "minimum Wigner value")
        checks.close(saved["wigner"]["maxValue"], max(flat), "maximum Wigner value")
        checks.equal(saved["wigner"]["passed"], True, "reported final Wigner status")
        checks.equal(saved["audit"]["passed"], True, "reported final state audit")
        return f"All 9 amplitudes and 81 Wigner cells checked; negative-Fourier marginal; mana2={math.log2(l1):.15g}."

    checks.run("Source provenance and complete applicability coverage", sources_and_coverage)
    checks.run("Pendulum samples, positive Fourier, scale and small-angle references", pendulum)
    checks.run("Real rotation and GF3 complex covariance", rotation)
    checks.run("Zeta(2) independent integral and finite sampled profile", zeta)
    checks.run("Exact GF9 coordinate analogues", exact_analogues)
    checks.run("Stored equation adapters", stored_adapters)
    checks.run("Final displacement/reflection state and Wigner grid", final_state)
    checks.run("Reported complete status", lambda: checks.equal(packet["passed"], True, "packet status"))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--packet", type=Path, default=ROOT / "gfm-reapplication.json")
    args = parser.parse_args()
    checks = Checks()
    raw = args.packet.read_bytes()
    packet = json.loads(raw)
    registry = json.loads((ROOT / "equation-audit.json").read_text(encoding="utf-8-sig"))
    image_registry = json.loads((ROOT / "image-equations.json").read_text(encoding="utf-8-sig"))
    validate(packet, registry, image_registry, checks)
    status = "PASS" if not checks.failures else "FAIL"
    lines = ["INDEPENDENT GFM VALIDATION — RUSSL 0.3.0", "",
             f"Status: {status}", f"Packet: {args.packet.name}",
             "Packet SHA-256: " + hashlib.sha256(raw).hexdigest(),
             f"Assertions evaluated: {checks.count}",
             f"Maximum scaled numeric comparison error: {checks.maximum_scaled_error:.17g}",
             f"Numerical acceptance tolerance: {TOL}", "",
             "Method: Python standard library only; no production JavaScript module calls.",
             "Fields are independently reconstructed from the declared polynomials.", ""]
    for name, count, details in checks.groups:
        lines += [f"PASS — {name} ({count} assertions)", str(details)]
    for failure in checks.failures:
        lines += ["FAIL — " + failure]
    lines += ["", "Scope: the saved default experiment and its concrete adapters. The integral",
              "check independently certifies saved s=2 against pi^2/6 and adaptive numerical",
              "quadrature; it does not certify all s=2..8 from this single packet. Fourier",
              "round trips certify the selected finite representation, not a continuum",
              "identity over a finite field, new physics, the unavailable 500-equation",
              "suite, native hardware, live browser rendering, downloads or iframe behavior.",
              "The sampled signals retain normalization scale and sampling metadata.",
              "Reference-only entries remain visible and are checked for nonexecution.", ""]
    report = "\n".join(lines)
    (ROOT / "validation" / "gfm-independent-validation.txt").write_text(report, encoding="utf-8")
    print(report)
    return 0 if not checks.failures else 1


if __name__ == "__main__":
    sys.exit(main())
