#!/usr/bin/env python3
"""Independently verify the saved GF9 pendulum preview, without UI or JavaScript.

Only Python standard-library arithmetic is used. GF9 is F3[u]/(u^2+1),
labels a+3b encode a+b*u, and Tr(a+b*u)=2a in F3. The positive additive
character kernel acts on raw ordinary acceleration samples; it never
normalizes the sample vector or interprets energy as Born probability.
"""
from __future__ import annotations
import cmath
import csv
import hashlib
from html.parser import HTMLParser
import io
import json
import math
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
TOL = 1e-10
EXPECTED_ENGINE_SHA256 = "031cf5a05eb3ab3e48cab1f5db18cee6da5c43b78fd90a9a3a26322c7a77e28f"


def as_complex(v):
    if isinstance(v, dict):
        return complex(v["re"], v["im"])
    if isinstance(v, list):
        return complex(*v)
    return complex(v)


def gf9_trace_product(k, x):
    """Use the closed quotient formula, independent of production field code."""
    a, b, c, d = k % 3, k // 3, x % 3, x // 3
    return (2 * (a * c - b * d)) % 3


def transform(values, inverse=False):
    sign = -1 if inverse else 1
    return [sum(cmath.exp(sign * 2j * math.pi * gf9_trace_product(k, x) / 3)
                * values[x] / 3 for x in range(9)) for k in range(9)]


def expected_data():
    g, length, max_angle = 9.81, 1.0, .2
    angles = [max_angle * (2 * j / 8 - 1) for j in range(9)]
    samples = [-g / length * math.sin(theta) for theta in angles]
    coefficients = transform(samples)
    recovered = transform(coefficients, True)
    omega = math.sqrt(g / length)
    l2 = math.hypot(*samples)
    return {
        "field": {"id": "gf9", "p": 3, "n": 2, "q": 9, "polynomial": [1, 0, 1]},
        "parameters": {"g": g, "length": length, "maxAngle": max_angle},
        "formula": "theta_ddot=-(g/length)*sin(theta)",
        "units": {"theta": "radians", "value": "radians/second^2"},
        "omega": omega, "smallAnglePeriod": 2 * math.pi / omega,
        "inputNorm": l2, "outputNorm": math.hypot(*(abs(v) for v in coefficients)),
        "inputEnergy": l2 * l2,
        "expectedRecoveryResidual": max(abs(a - b) for a, b in zip(samples, recovered)) / l2,
        "rows": [{"label": j, "theta": angles[j], "sample": samples[j],
                  "coefficient": {"re": coefficients[j].real, "im": coefficients[j].imag},
                  "recovered": {"re": recovered[j].real, "im": recovered[j].imag}}
                 for j in range(9)],
    }


class Checks:
    def __init__(self):
        self.count = 0
        self.maximum_scaled_error = 0.0
        self.maximum_display_scaled_error = 0.0
        self.failures = []

    def equal(self, a, b, label):
        self.count += 1
        if a != b:
            raise ValueError(f"{label}: {a!r} != {b!r}")

    def close(self, a, b, label, scale=None, display=False):
        self.count += 1
        a, b = as_complex(a), as_complex(b)
        if not all(math.isfinite(v) for v in (a.real, a.imag, b.real, b.imag)):
            raise ValueError(f"{label}: nonfinite number")
        error = abs(a - b) / (scale if scale is not None else max(1, abs(b)))
        if display:
            self.maximum_display_scaled_error = max(self.maximum_display_scaled_error, error)
        else:
            self.maximum_scaled_error = max(self.maximum_scaled_error, error)
        if error > (1e-8 if display else TOL):
            raise ValueError(f"{label}: scaled error {error:.17g}")

    def vector(self, actual, expected, label):
        self.equal(len(actual), len(expected), label + " dimension")
        scale = math.hypot(*(abs(as_complex(v)) for v in expected))
        for i, (a, b) in enumerate(zip(actual, expected)):
            self.close(a, b, f"{label}[{i}]", scale=scale or 1)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class TableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_cell = False
        self.current = []
        self.rows = []
        self.cell_text = ""
        self.scripts = 0

    def handle_starttag(self, tag, attrs):
        if tag == "script":
            self.scripts += 1
        if tag == "tr":
            self.current = []
        if tag == "td":
            self.in_cell, self.cell_text = True, ""

    def handle_endtag(self, tag):
        if tag == "td":
            self.current.append(self.cell_text)
            self.in_cell = False
        if tag == "tr" and self.current:
            self.rows.append(self.current)

    def handle_data(self, data):
        if self.in_cell:
            self.cell_text += data


def validate(checks, packet, expected):
    checks.equal(packet["schema"], "RUSSL-GFM-pendulum-example/1", "saved example schema")
    checks.equal(packet["equation"], expected["formula"], "ordinary acceleration equation")
    checks.equal(packet["parameters"], expected["parameters"], "declared parameter values")
    for key, value in expected["field"].items():
        checks.equal(packet["fieldDefinition"][key], value, "field definition " + key)
    checks.equal(packet["units"], expected["units"], "declared angle and acceleration units")
    angles = [row["theta"] for row in expected["rows"]]
    raw = [row["sample"] for row in expected["rows"]]
    coefficients = [as_complex(row["coefficient"]) for row in expected["rows"]]
    recovered = [as_complex(row["recovered"]) for row in expected["rows"]]
    input_data = packet["input"]
    checks.equal(input_data["field"], "gf9", "input field")
    checks.equal(input_data["domain"], "complex-signal", "ordinary coefficient domain")
    checks.equal(input_data["representation"], "samples", "raw input representation")
    checks.vector(input_data["values"], raw, "independent ordinary acceleration samples")
    checks.equal(input_data["codec"]["parameters"], expected["parameters"], "codec parameters")
    checks.equal(input_data["codec"]["units"], expected["units"], "codec units")
    checks.vector(input_data["codec"]["nodes"], angles, "ordered angle grid")
    checks.close(input_data["codec"]["reference"]["omega"], expected["omega"], "ordinary omega")
    checks.close(input_data["codec"]["reference"]["smallAnglePeriod"],
                 expected["smallAnglePeriod"], "ordinary small-angle period")
    checks.equal(input_data["operations"], [], "raw input operation history")
    checks.equal(expected["inputNorm"] > 1, True, "independent input is not normalized")
    for name, representation, values, sign in (
            ("forward", "trace-coefficients", coefficients, "+"),
            ("inverse", "samples", recovered, "-")):
        result = packet[name]
        d = result["dataset"]
        checks.equal(d["schema"], "RUSSL-GFM-dataset/1", name + " dataset schema")
        checks.equal(d["field"], "gf9", name + " field")
        checks.equal(d["domain"], "complex-signal", name + " ordinary coefficient domain")
        checks.equal(d["representation"], representation, name + " representation")
        checks.equal(d["codec"], input_data["codec"], name + " retains grid and units")
        checks.vector(d["values"], values, name + " independent raw values")
        checks.equal(d["operations"], ["trace.forward"] if name == "forward" else
                     ["trace.forward", "trace.inverse"], name + " operation history")
        checks.equal(result["passed"], True, name + " saved passed result")
        checks.equal(result["computationScale"], 1, name + " computation rescale")
        checks.equal(result["kernel"]["kind"], "complex-trace-character", name + " kernel domain")
        checks.equal(result["kernel"]["formula"],
                     "exp(" + sign + "2pi i Tr(kx)/p)/sqrt(q)", name + " kernel sign")
        checks.equal(result["kernel"]["normalization"], "kernel 1/sqrt(q); no dataset normalization",
                     name + " preserves raw scale convention")
        checks.equal(result["kernel"]["p"], 3, name + " kernel characteristic")
        checks.equal(result["kernel"]["q"], 9, name + " kernel dimension")
        checks.close(result["inputNorm"], expected["inputNorm"], name + " input raw norm")
        checks.close(result["outputNorm"], expected["inputNorm"], name + " output raw norm")
        for key, check in result["checks"].items():
            checks.equal(check["passed"], True, name + " reported check " + key)
            checks.equal(0 <= check["residual"] <= TOL, True, name + " bounded residual " + key)
        energy = result["checks"]["energyPreservation"]
        checks.close(energy["inputEnergy"], expected["inputEnergy"], name + " input raw energy")
        checks.close(energy["outputEnergy"], expected["inputEnergy"], name + " output raw energy")
    actual_raw = [as_complex(v) for v in input_data["values"]]
    actual_coefficients = [as_complex(v) for v in packet["forward"]["dataset"]["values"]]
    actual_recovered = [as_complex(v) for v in packet["inverse"]["dataset"]["values"]]
    checks.vector(transform(actual_coefficients, True), actual_raw,
                  "independent inverse of saved coefficients")
    measured_error = max(abs(a - b) for a, b in zip(actual_raw, actual_recovered))
    checks.close(packet["maximumAbsoluteRecoveryError"], measured_error,
                 "reported maximum absolute recovery error", scale=measured_error or 1)
    checks.equal(measured_error / expected["inputNorm"] <= TOL, True,
                 "independently measured scaled recovery error")
    checks.close(packet["forward"]["checks"]["inverseRecovery"]["absoluteResidual"],
                 measured_error, "forward inverse residual matches saved recovery",
                 scale=measured_error or 1)

    csv_path = ROOT / "docs/Pendulum_Example.csv"
    table = list(csv.DictReader(io.StringIO(csv_path.read_text(encoding="utf-8"))))
    checks.equal(len(table), 9, "CSV nine rows")
    checks.equal(set(table[0]), {"label", "input_angle_rad", "raw_acceleration_rad_s2",
                               "trace_coefficient_real", "trace_coefficient_imag",
                               "recovered_acceleration_rad_s2"}, "CSV columns and units")
    for j, row in enumerate(table):
        checks.equal(int(row["label"]), j, "CSV label order")
        checks.close(float(row["input_angle_rad"]), angles[j], "CSV angle")
        checks.close(float(row["raw_acceleration_rad_s2"]), raw[j], "CSV raw acceleration")
        checks.close(complex(float(row["trace_coefficient_real"]),
                             float(row["trace_coefficient_imag"])), coefficients[j],
                     "CSV trace coefficient")
        checks.close(float(row["recovered_acceleration_rad_s2"]), raw[j], "CSV inverse recovery")
        checks.equal(float(row["raw_acceleration_rad_s2"]), actual_raw[j].real,
                     "CSV exact raw value matches JSON")
        checks.equal(float(row["trace_coefficient_real"]), actual_coefficients[j].real,
                     "CSV exact coefficient real matches JSON")
        checks.equal(float(row["trace_coefficient_imag"]), actual_coefficients[j].imag,
                     "CSV exact coefficient imaginary matches JSON")
        checks.equal(float(row["recovered_acceleration_rad_s2"]), actual_recovered[j].real,
                     "CSV exact recovered real matches JSON")

    # Check the visible static numeric table as HTML source. This is not a
    # browser rendering or interactivity test. Nine significant digits have
    # their own display-rounding allowance, distinct from machine data.
    parser = TableParser()
    parser.feed((ROOT / "docs/Pendulum_Example.html").read_text(encoding="utf-8"))
    checks.equal(parser.scripts, 0, "standalone static document has no scripts")
    checks.equal(len(parser.rows), 9, "HTML nine numeric rows")
    for j, cells in enumerate(parser.rows):
        checks.equal(len(cells), 5, "HTML column count")
        checks.equal(int(cells[0]), j, "HTML label order")
        checks.close(float(cells[1]), angles[j], "HTML angle", display=True)
        checks.close(float(cells[2]), raw[j], "HTML raw acceleration", display=True)
        coefficient = complex(cells[3].replace("−", "-").replace(" ", "").replace("i", "j"))
        checks.close(coefficient, coefficients[j], "HTML trace coefficient", display=True)
        checks.close(float(cells[4]), raw[j], "HTML recovered acceleration", display=True)
    checks.equal(sha(ROOT / "src/gfm-mechanics.js"), EXPECTED_ENGINE_SHA256,
                 "production mechanics source remains unchanged")
    return {"maximumAbsoluteRecoveryError": measured_error,
            "relativeRecoveryError": measured_error / expected["inputNorm"],
            "csvRows": 9, "htmlRows": 9,
            "htmlVerification": "Static source table only; no browser/network/UI execution"}


def main():
    expected = expected_data()
    packet_path = ROOT / "docs/Pendulum_Example.json"
    report_path = ROOT / "validation/pendulum-preview-independent-verification.json"
    checks = Checks()
    result = {
        "validator": "Independent Python standard library; no JavaScript/UI/network execution",
        "scope": "Saved raw GF9 pendulum angles, ordinary acceleration, positive trace coefficients, inverse recovery and CSV table.",
        "tolerance": TOL,
        "expected": expected,
    }
    if not packet_path.is_file():
        result.update(status="WAITING", assertionsEvaluated=0,
                      missingFiles=["docs/Pendulum_Example.json"])
        status = 2
    else:
        try:
            packet = json.loads(packet_path.read_text(encoding="utf-8"))
            details = validate(checks, packet, expected)
        except (ValueError, KeyError, TypeError, OSError, IndexError) as error:
            checks.failures.append(str(error))
        files = ["docs/Pendulum_Example.json", "docs/Pendulum_Example.csv",
                 "docs/Pendulum_Example.html", "src/gfm-mechanics.js"]
        result.update(status="FAIL" if checks.failures else "PASS",
                      assertionsEvaluated=checks.count,
                      maximumScaledError=checks.maximum_scaled_error,
                      maximumDisplayScaledError=checks.maximum_display_scaled_error,
                      displayTolerance=1e-8,
                      details=locals().get("details", {}),
                      failures=checks.failures,
                      files={path: {"sha256": sha(ROOT / path),
                                    "bytes": (ROOT / path).stat().st_size}
                             for path in files if (ROOT / path).is_file()})
        status = int(bool(checks.failures))
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Status: {result['status']}; assertions: {checks.count}; report: {report_path}")
    print(f"Independent raw norm: {expected['inputNorm']:.17g}; omega: {expected['omega']:.17g}; period: {expected['smallAnglePeriod']:.17g}")
    return status


if __name__ == "__main__":
    sys.exit(main())

