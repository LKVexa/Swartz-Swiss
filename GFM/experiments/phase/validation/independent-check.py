#!/usr/bin/env python3
"""Independent stdlib reconstruction of saved aperture/aggie simulator data.

Usage: python validation/independent-check.py snapshot.json [recording.json ...]
       node <snapshot producer> | python validation/independent-check.py -
       python validation/independent-check.py --self-test

No production module, browser, server, network, or third-party package is loaded.
The illustrative clock/motion are checked only for explicit scope and data bounds;
they are not inferred physical dynamics.
"""
import argparse
import cmath
import json
import math
import sys
from pathlib import Path

TOLERANCE = 1e-10
MAX_BYTES = 16 * 1024 * 1024
RANGES = {
    "spin": (0, 1), "coverLoad": (0, 1e6),
    "alphaCritical": (0, 1 - 1e-12), "r0": (1e-9, 1e6),
    "sealThreshold": (1e-9, 1e6),
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def number(value, label, low=-math.inf, high=math.inf):
    require(type(value) in (int, float) and math.isfinite(value), label + " must be a finite number")
    require(low <= value <= high, label + " is outside its declared domain")
    return float(value)


def close(actual, expected, label, scale=None):
    actual = number(actual, label)
    scale = max(abs(expected), 1) if scale is None else scale
    require(abs(actual - expected) <= TOLERANCE * scale + 32 * math.ulp(0.0),
            f"{label}: {actual:.17g} differs from independent {expected:.17g}")


def complex_number(value, label):
    if type(value) in (int, float):
        return complex(number(value, label), 0)
    require(isinstance(value, dict) and set(value) == {"re", "im"}, label + " must contain only re and im")
    return complex(number(value["re"], label + ".re"), number(value["im"], label + ".im"))


def vector(values, label):
    require(isinstance(values, list) and len(values) == 9, label + " must have nine values")
    return [complex_number(value, f"{label}[{i}]") for i, value in enumerate(values)]


def gf9_multiply(left, right):
    # Integer label a+3b represents a+b alpha, alpha^2=-1 over GF3.
    a, b = left % 3, left // 3
    c, d = right % 3, right // 3
    return (a * c - b * d) % 3 + 3 * ((a * d + b * c) % 3)


def gf9_trace(value):
    # (a+b alpha)^3=a-b alpha, hence Tr(a+b alpha)=2a.
    return 2 * (value % 3) % 3


def transform(values, inverse=False):
    sign = -1 if inverse else 1
    return [sum(value * cmath.exp(sign * 2j * math.pi * gf9_trace(gf9_multiply(k, x)) / 3)
                for x, value in enumerate(values)) / 3 for k in range(9)]


def vector_close(actual, expected, label, scale):
    error = max(abs(a - e) for a, e in zip(actual, expected))
    require(error <= TOLERANCE * scale + 32 * math.ulp(0.0), f"{label} maximum error {error:.17g} exceeds the reconstruction tolerance")
    return error


def aperture(alpha, critical, radius):
    return radius * math.sqrt((1 - critical / alpha) * (1 + critical / alpha)) if alpha > critical else 0.0


def selected_alpha(parameters):
    # Match the source's explicit control round-trip convention, not a broad
    # threshold tolerance. Direct spin-sweep nodes do not use this conversion.
    epsilon = 1.0 - parameters["spin"]
    critical = parameters["alphaCritical"]
    return critical if epsilon == 1.0 - critical else 1.0 - epsilon


def validate_snapshot(snapshot, label="snapshot"):
    require(isinstance(snapshot, dict), label + " must be an object")
    p = snapshot.get("parameters")
    require(isinstance(p, dict) and set(p) == set(RANGES), label + " has invalid parameters")
    p = {key: number(p[key], "parameters." + key, *bounds) for key, bounds in RANGES.items()}
    alpha = selected_alpha(p)
    radius = aperture(alpha, p["alphaCritical"], p["r0"])
    branches = snapshot.get("branches")
    require(isinstance(branches, dict) and set(branches) == {"gaseous", "aggie"}, label + " must have both branches")
    for name, load in (("gaseous", 0.0), ("aggie", p["coverLoad"])):
        branch = branches[name]
        require(isinstance(branch, dict) and branch.get("id") == name, name + " branch identity differs")
        close(branch.get("integratedCoverLoad"), load, name + ".integratedCoverLoad")
        cover = 1 if load >= p["sealThreshold"] else 0
        require(type(branch.get("cover")) is int and branch["cover"] == cover, name + " cover threshold differs")
        close(branch.get("apertureRadius"), radius, name + ".apertureRadius", p["r0"])
        require(branch.get("geometricOpen") is (radius > 0), name + " geometric aperture threshold differs")
        passage = (1 - cover) * int(radius > 0)
        require(type(branch.get("passage")) is int and branch["passage"] == passage, name + " passage rule differs")
        require(branch.get("status") == "toy-assumption", name + " branch must retain hypothetical scope")

    # Independent stationary M=1, a=spin, Q=0 horizon reference.
    spin = p["spin"]
    discriminant = (1 - spin) * (1 + spin)
    root = math.sqrt(discriminant)
    r_plus = 1 + root
    r_minus = spin * spin / r_plus
    denominator = r_plus * r_plus + spin * spin
    exterior = snapshot.get("exterior")
    require(isinstance(exterior, dict), "Missing stationary exterior reference")
    expected = {"M": 1, "a": spin, "Q": 0, "J": spin, "discriminant": discriminant,
                "rPlus": r_plus, "rMinus": r_minus, "area": 4 * math.pi * denominator,
                "omegaH": spin / denominator, "kappa": root / denominator, "phiH": 0,
                "temperature": root / denominator / (2 * math.pi), "entropy": math.pi * denominator,
                "irreducibleMass": math.sqrt(denominator) / 2}
    for key, value in expected.items():
        close(exterior.get(key), value, "exterior." + key)
    require(exterior.get("extremal") is (spin == 1), "Exterior extremal limit differs")
    require(exterior.get("firstLawAvailable") is (spin != 1), "Exterior first-law availability differs")
    require(exterior.get("passed") is True, "Exterior source checks did not pass")
    observation = snapshot.get("observation")
    require(isinstance(observation, dict) and observation.get("identical") is True,
            "Shared exterior observations must remain unidentifiable")
    close(observation.get("priorGaseous"), .5, "observation prior")
    close(observation.get("posteriorGaseous"), .5, "observation posterior")
    close(observation.get("optimalAccuracy"), .5, "observation optimal accuracy")

    gfm = snapshot.get("gfm")
    require(isinstance(gfm, dict) and gfm.get("field") == "gf9", "Expected GF9 signal data")
    require(isinstance(gfm.get("nodes"), list) and len(gfm["nodes"]) == 9, "Expected nine spin-sweep nodes")
    nodes = [j / 8 for j in range(9)]
    for i, node in enumerate(gfm["nodes"]):
        close(node, nodes[i], f"gfm.nodes[{i}]")
    expected_raw = [complex(aperture(node, p["alphaCritical"], p["r0"]), 0) for node in nodes]
    raw = vector(gfm.get("raw"), "gfm.raw")
    coefficients = vector(gfm.get("coefficients"), "gfm.coefficients")
    recovered = vector(gfm.get("recovered"), "gfm.recovered")
    raw_norm = math.hypot(*(abs(value) for value in expected_raw))
    raw_error = vector_close(raw, expected_raw, "Unnormalized aperture samples", raw_norm)
    coefficient_error = vector_close(coefficients, transform(expected_raw), "Positive trace coefficients", raw_norm)
    inverse_error = vector_close(recovered, transform(coefficients, True), "Negative trace inverse", raw_norm)
    recovery_error = vector_close(recovered, expected_raw, "Recovered aperture samples", raw_norm)
    close(math.hypot(*(abs(value) for value in coefficients)), raw_norm, "Raw transform norm", raw_norm)
    require(gfm.get("passed") is True, "GF9 source checks did not pass")
    source_checks = gfm.get("checks")
    require(isinstance(source_checks, dict) and source_checks, "Missing GF9 source checks")
    for name, check in source_checks.items():
        require(isinstance(check, dict) and check.get("passed") is True, name + " source check failed")
        number(check.get("residual"), "gfm.checks." + name + ".residual", 0, TOLERANCE)
    measured_recovery = max(abs(value - raw[i]) for i, value in enumerate(recovered))
    close(gfm.get("maxRecoveryError"), measured_recovery, "gfm.maxRecoveryError", raw_norm)
    kernel = gfm.get("kernel")
    require(isinstance(kernel, dict) and kernel.get("kind") == "complex-trace-character", "Wrong GF9 coefficient domain")
    require(kernel.get("p") == 3 and kernel.get("q") == 9, "Wrong GF9 kernel size")
    require(kernel.get("normalization") == "kernel 1/sqrt(q); no dataset normalization", "Raw data normalization convention differs")
    require(gfm.get("units") == "toy length", "Aperture sweep units differ")

    scopes = snapshot.get("scopes")
    require(isinstance(scopes, dict), "Missing physical scope declarations")
    require("illustrat" in str(scopes.get("geometry", "")).lower(), "Motion must remain explicitly illustrative")
    require("illustrat" in str(scopes.get("clock", "")).lower(), "Clock must remain explicitly illustrative")
    require("spin-parameter sweep" in str(scopes.get("gfm", "")), "GF9 nodes must be labelled as a spin sweep")
    if snapshot.get("experiment") is not None:
        require(snapshot["experiment"].get("physicalDynamics") is False, "Scripted experiment must not claim physical dynamics")
    elapsed = number(snapshot.get("elapsed"), "Illustration clock", 0)
    motion = snapshot.get("motion")
    require(isinstance(motion, dict), "Missing illustrative motion data")
    number(motion.get("phase"), "Illustration phase", 0, 2 * math.pi)
    require("illustrat" in str(motion.get("scope", "")).lower(), "Particle/geometry motion must retain illustrative scope")
    if "history" in snapshot:
        history = snapshot["history"]
        require(isinstance(history, list) and 0 < len(history) <= 10000, "Invalid illustrative history length")
        last_time = -math.inf
        for i, frame in enumerate(history):
            require(isinstance(frame, dict), "History entries must be data objects")
            time = number(frame.get("time"), f"history[{i}].time", 0, elapsed)
            require(time >= last_time, "Illustration clock history must not run backward")
            last_time = time
            number(frame.get("spin"), f"history[{i}].spin", 0, 1)
            number(frame.get("coverLoad"), f"history[{i}].coverLoad", 0, 1e6)
            number(frame.get("apertureRadius"), f"history[{i}].apertureRadius", 0, 1e6)
            require(frame.get("gaseousPassage") in (0, 1) and frame.get("aggiePassage") in (0, 1), "History passage values must be bits")
            require(frame["aggiePassage"] <= frame["gaseousPassage"], "Cover cannot open a geometrically closed history aperture")
        close(last_time, elapsed, "Last illustration history time")
        close(history[-1]["spin"], spin, "Last history spin")
        close(history[-1]["coverLoad"], p["coverLoad"], "Last history cover load")
        close(history[-1]["apertureRadius"], radius, "Last history aperture", p["r0"])
    return {"label": label, "spin": spin, "coverLoad": p["coverLoad"], "apertureRadius": radius,
            "rawNorm": raw_norm, "maxRawError": raw_error, "maxCoefficientError": coefficient_error,
            "maxInverseError": inverse_error, "maxRecoveredError": recovery_error}


def snapshots_from_document(document):
    if isinstance(document, list):
        require(0 < len(document) <= 10000, "Snapshot list is empty or too large")
        return [(f"snapshot[{i}]", value) for i, value in enumerate(document)]
    require(isinstance(document, dict), "Expected a snapshot, snapshot list, or recording object")
    if document.get("schema") == "GFM-Aperture-Aggie-recording/1":
        frames = document.get("frames")
        require(isinstance(frames, list) and 0 < len(frames) <= 10000, "Invalid recording frames")
        return [("recording.state", document.get("state"))] + [(f"recording.frames[{i}]", value) for i, value in enumerate(frames)]
    return [("snapshot", document)]


def self_test():
    require(gf9_multiply(3, 3) == 2, "alpha^2 must equal -1")
    require(gf9_multiply(4, 4) == 6, "(1+alpha)^2 must equal 2alpha")
    require([gf9_trace(i) for i in range(9)] == [0, 2, 1, 0, 2, 1, 0, 2, 1], "Absolute traces differ")
    impulse = [1 + 0j] + [0j] * 8
    vector_close(transform(impulse), [1 / 3 + 0j] * 9, "Impulse trace transform", 1)
    for index in range(9):
        basis = [complex(j == index) for j in range(9)]
        vector_close(transform(transform(basis), True), basis, "Independent basis inverse", 1)
    require(aperture(.8, .8, 1) == 0, "Critical equality is closed")
    close(aperture(1, .8, 1), .6, "Unit-spin aperture")
    require(selected_alpha({"spin": .3, "alphaCritical": .3}) == .3, "Critical control round trip differs")
    return {"selfTest": "passed", "basisRoundTrips": 9, "domain": "GF3[alpha]/(alpha^2+1), raw complex signal transform"}


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("files", nargs="*", help="Snapshot/recording JSON paths; '-' reads standard input")
    parser.add_argument("--self-test", action="store_true", help="Check independent field and threshold reference cases")
    args = parser.parse_args()
    require(args.self_test or args.files, "Supply JSON data or --self-test")
    results = []
    if args.self_test:
        results.append(self_test())
    for name in args.files:
        if name == "-":
            raw = sys.stdin.buffer.read(MAX_BYTES + 1)
        else:
            require(Path(name).stat().st_size <= MAX_BYTES, "JSON input exceeds 16 MiB")
            raw = Path(name).read_bytes()
        require(len(raw) <= MAX_BYTES, "JSON input exceeds 16 MiB")
        document = json.loads(raw.decode("utf-8-sig"), parse_constant=lambda value: (_ for _ in ()).throw(ValueError("Nonfinite JSON constant " + value)))
        cases = snapshots_from_document(document)
        checked = [validate_snapshot(snapshot, label) for label, snapshot in cases]
        results.append({"file": name, "passed": True, "snapshots": len(checked),
                        "maxCoefficientError": max(case["maxCoefficientError"] for case in checked),
                        "maxRecoveredError": max(case["maxRecoveredError"] for case in checked),
                        "checks": checked if len(checked) <= 10 else checked[:3] + checked[-3:]})
    print(json.dumps({"passed": True, "results": results,
                      "scope": "Independent aperture/cover, stationary exterior, GF9 raw trace and inverse reconstruction. Time/motion remain illustrative."}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, TypeError, KeyError, OSError, UnicodeError) as error:
        print(json.dumps({"passed": False, "error": str(error)}), file=sys.stderr)
        sys.exit(1)
