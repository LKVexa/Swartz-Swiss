#!/usr/bin/env python3
"""Independent standard-library validation of the saved v0.4 horizon packets.

No JavaScript module is imported or executed. Finite fields, Fourier kernels,
matrices, sample values and Wigner expectations are
recomputed here. This checks the finite saved experiment, not new physics,
the unavailable 500-equation suite, browser behavior, or continuum convergence.
Run from the release folder: python validation/verify-horizon-models.py
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


def js_number(value):
    """ECMAScript JSON number spelling from a finite binary64 value.

    Python and ECMAScript both choose shortest round-tripping digits, but their
    fixed/scientific thresholds and exponent spelling differ. No JS is called.
    The retained envelopes provide an end-to-end check of this serialization.
    """
    if type(value) is int and abs(value) <= 2 ** 53:
        return str(value)
    value = float(value)
    if not math.isfinite(value):
        raise ValueError("Nonfinite value in canonical envelope")
    if value == 0:
        return "0"
    sign = "-" if value < 0 else ""
    text = repr(abs(value)).lower()
    mantissa, exponent = (text.split("e") + ["0"])[:2] if "e" in text else (text, "0")
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
        # Dataset keys are ASCII. The general sort follows UTF-16 code units.
        keys = sorted(value, key=lambda k: k.encode("utf-16-be", errors="surrogatepass"))
        return "{" + ",".join(canonical(k) + ":" + canonical(value[k]) for k in keys) + "}"
    raise TypeError("Unsupported canonical JSON type")


def canonical_hash(value):
    return hashlib.sha256(canonical(value).encode("utf-8")).hexdigest()


def determinant(matrix):
    """General pivoted elimination, independent of the production block formula."""
    a = [list(map(float, row)) for row in matrix]
    result = 1.0
    for j in range(len(a)):
        pivot = max(range(j, len(a)), key=lambda i: abs(a[i][j]))
        if a[pivot][j] == 0:
            return 0.0
        if pivot != j:
            a[pivot], a[j] = a[j], a[pivot]
            result = -result
        result *= a[j][j]
        for i in range(j + 1, len(a)):
            factor = a[i][j] / a[j][j]
            for k in range(j + 1, len(a)):
                a[i][k] -= factor * a[j][k]
    return result


def reference(M, a, Q):
    disc = M * M - a * a - Q * Q
    if M <= 0 or disc < 0:
        raise ValueError("Reference parameters outside the real horizon domain")
    gap = math.sqrt(disc)
    rp, rm = M + gap, M - gap
    b = rp * rp + a * a
    return {"M": M, "a": a, "Q": Q, "J": M * a, "discriminant": disc,
            "rPlus": rp, "rMinus": rm, "area": 4 * math.pi * b,
            "omegaH": a / b, "kappa": gap / b, "phiH": Q * rp / b,
            "temperature": gap / (2 * math.pi * b), "entropy": math.pi * b,
            "irreducibleMass": math.sqrt(b) / 2}


def metric(M, a, Q, r, theta):
    """Expand the compact quadratic KN line element via outer products."""
    sigma = r * r + a * a * math.cos(theta) ** 2
    delta = r * r - 2 * M * r + a * a + Q * Q
    sine2 = math.sin(theta) ** 2
    u, v = [1, 0, 0, -a * sine2], [-a, 0, 0, r * r + a * a]
    g = [[-delta / sigma * u[i] * u[j] + sine2 / sigma * v[i] * v[j]
          for j in range(4)] for i in range(4)]
    g[1][1], g[2][2] = sigma / delta, sigma
    return g, sigma, delta


def derivative(function, direction, origin, step=1e-3):
    """Five-point numerical directional derivative; no analytic production reuse."""
    def at(t):
        return function(*(x + t * dx for x, dx in zip(origin, direction)))
    return (at(-2 * step) - 8 * at(-step) + 8 * at(step) - at(2 * step)) / (12 * step)


def relative(checks, actual, expected, label):
    if expected == 0:
        checks.close(actual, 0, label)
    else:
        checks.close(actual / expected, 1, label + " relative comparison")


def validate(packet, session, registry, previous_registry, checks):
    gf9, gf4 = Field("gf9"), Field("gf4")
    state_result = {}

    def provenance():
        checks.equal(packet["schema"], "RUSSL-horizon-reapplication/1", "horizon packet schema")
        checks.equal(packet["version"], "0.4.0", "horizon packet version")
        checks.equal(packet["equationRegistry"], registry, "embedded registry is current")
        for source in packet["sources"] + registry["sources"]:
            path = (ROOT / source["path"]).resolve()
            checks.equal(path.is_relative_to(ROOT), True, "source stays within release")
            raw = path.read_bytes()
            checks.equal(len(raw), source["bytes"], source["path"] + " bytes")
            checks.equal(hashlib.sha256(raw).hexdigest(), source["sha256"], source["path"] + " hash")
        checks.equal(len(packet["sources"]), 6, "five equation sources plus user writeup")
        writeup = (ROOT / "reference/blackhole-specification/User_Simulation_Writeup.txt").read_text(encoding="utf-8")
        checks.equal(packet["simulationSpecification"]["userWriteup"], writeup, "preserved user writeup text")
        checked_envelopes = 0
        def walk(value, location):
            nonlocal checked_envelopes
            if isinstance(value, dict):
                if "sha256" in value and "data" in value:
                    checks.equal(value["sha256"], canonical_hash(value["data"]), location + " canonical SHA-256")
                    checked_envelopes += 1
                for key, child in value.items():
                    walk(child, location + "." + key)
            elif isinstance(value, list):
                for i, child in enumerate(value):
                    walk(child, location + f"[{i}]")
        walk(session, "session")
        checks.equal(checked_envelopes, 4, "one session and three record envelopes")
        data = session["data"]
        checks.equal(data["version"], "0.4.0", "session version")
        checks.equal(data["returns"][0]["details"], packet, "session return equals saved horizon packet")
        checks.equal(data["commandProvenance"], ["horizon.reapply"], "recorded command provenance")
        return "Five equation sources and user writeup bytes match; session and all three record canonical hashes match."

    def coverage():
        checks.equal(len(packet["entries"]), 49, "49 horizon findings")
        checks.equal(len({e["id"] for e in packet["entries"]}), 49, "unique horizon IDs")
        lookup = {e["id"]: e for e in registry["entries"]}
        checks.equal({e["id"] for e in packet["entries"]}, set(lookup), "complete registry ID coverage")
        numbers = [e["sourceEquationNumber"] for e in registry["entries"] if "sourceEquationNumber" in e]
        checks.equal(sorted(numbers), list(range(1, 24)), "all 23 numbered PDF equations")
        checks.equal(packet["coverage"], {"newFindings": 49, "pdfNumberedEquations": 23,
                                        "previousFindings": 20, "previousImageFamilies": 3}, "coverage counts")
        computed = {f"pdf-{n:02}" for n in [1,2,4,5,6,*range(8,21)]}
        computed |= {"image-etm-schwarzschild", "image-etm-rn", "image-event-functions", "image-event-frame-dragging"}
        outcomes = collections.Counter()
        for e in packet["entries"]:
            source = lookup[e["id"]]
            for key in ["status", "domain", "formula", "correctedFormula", "title"]:
                checks.equal(e[key], source[key], e["id"] + " source " + key)
            expected = ("logical-map-transformed" if e["id"] == "image-tensor-map" else
                        "hypothetical-rule-evaluated" if source["status"] == "toy-assumption" else
                        "reference-calculated" if e["id"] in computed else "reference-only")
            checks.equal(e["outcome"], expected, e["id"] + " scoped disposition")
            checks.equal(e["applied"], False, e["id"] + " no original-law execution claim")
            outcomes[e["outcome"]] += 1
        old = packet["previousReapplication"]
        checks.equal(len(old["entries"]), 20, "20 prior findings")
        checks.equal(len({e["id"] for e in old["entries"]}), 20, "unique prior IDs")
        old_lookup = {e["id"]: e for e in previous_registry["entries"]}
        checks.equal({e["id"] for e in old["entries"]}, set(old_lookup), "all prior registry IDs")
        for e in old["entries"]:
            checks.equal(e["sourceStatus"], old_lookup[e["id"]]["status"], e["id"] + " prior status")
            checks.equal(e["sourceFormula"], old_lookup[e["id"]]["formula"], e["id"] + " prior formula")
            if e["sourceStatus"] in ("rejected", "unresolved"):
                checks.equal(e["outcome"], "reference-only", e["id"] + " prior inert disposition")
                checks.equal(e["applied"], False, e["id"] + " prior nonexecution")
        checks.equal(set(old["images"]), {"pendulum", "rotation", "zetaGamma"}, "all three prior image families")
        checks.equal(set(old["images"]["rotation"]["otherAxes"]), {"y", "z"}, "all pictured rotation axes retained")
        return "Complete 49/23 and prior 20/3 coverage. Dispositions: "+str(dict(outcomes))+". No PDE or unsupported physical claim marked executed."

    def geometry():
        standard = packet["standard"]
        for name in ["schwarzschild", "neutralRotating", "chargedRotating", "reissnerNordstrom"]:
            saved = standard[name]
            expected = reference(saved["M"], saved["a"], saved["Q"])
            for key, value in expected.items():
                checks.close(saved[key], value, name + "." + key)
            M,a,Q=expected["M"],expected["a"],expected["Q"]
            for root in [expected["rPlus"],expected["rMinus"]]:
                checks.close(root*root-2*M*root+a*a+Q*Q, 0, name + " horizon root")
            mi=expected["irreducibleMass"]
            mass_rhs=(mi+Q*Q/(4*mi))**2+expected["J"]**2/(4*mi*mi)
            smarr=2*expected["omegaH"]*expected["J"]+expected["kappa"]*expected["area"]/(4*math.pi)+expected["phiH"]*Q
            checks.close(mass_rhs,M*M,name+" independently charged mass relation")
            checks.close(smarr,M,name+" independently Smarr relation")
            checks.close(saved["massRelation"]["rhs"],mass_rhs,name+" recorded mass RHS")
            checks.close(saved["smarr"]["rhs"],smarr,name+" recorded Smarr RHS")
            checks.equal(saved["passed"],True,name+" reported status")
        for name in ["chargedMetric","schwarzschildMetric","reissnerNordstromMetric","neutralMetric"]:
            saved=standard[name]
            p=saved["parameters"]
            g,sigma,delta=metric(p["M"],p["a"],p["Q"],p["r"],p["theta"])
            ref=reference(p["M"],p["a"],p["Q"])
            checks.equal(p["r"]>ref["rPlus"],True,name+" exterior domain")
            checks.matrix(saved["matrix"],g,name+" coframe-expanded metric")
            for key,value in [("sigma",sigma),("delta",delta),("rPlus",ref["rPlus"]),("rMinus",ref["rMinus"]),
                              ("frameOmega",-g[0][3]/g[3][3]),("lineElementCrossCoefficient",2*g[0][3])]:
                checks.close(saved[key],value,name+"."+key)
            det=determinant(g)
            expected_det=-sigma*sigma*math.sin(p["theta"])**2
            checks.close(det,expected_det,name+" independent determinant identity")
            checks.close(saved["determinant"],det,name+" stored determinant")
            checks.close(saved["componentDeterminant"],det,name+" stored component determinant")
            checks.equal(g[0][0]*g[3][3]-g[0][3]**2<0 and g[1][1]>0 and g[2][2]>0,True,name+" one negative signature")
            checks.equal(saved["signature"],"-+++",name+" signature convention")
            checks.equal(saved["ergoregion"],g[0][0]>0,name+" ergoregion sign")
            if p["a"] == 0:
                f=1-2*p["M"]/p["r"]+p["Q"]**2/p["r"]**2
                checks.close(g[0][0],-f,name+" spherical gtt limit")
                checks.close(g[1][1],1/f,name+" spherical radial limit")
        return "Schwarzschild, Kerr and charged KN scalars; RN and four metric tensors/determinants agree with independently expanded quadratic line elements."

    def first_law():
        saved=packet["standard"]["firstLaw"]
        p,d=saved["parameters"],saved["direction"]
        origin=[p[k] for k in ["M","a","Q"]]
        direction=[d[k] for k in ["dM","da","dQ"]]
        dA=derivative(lambda M,a,Q:reference(M,a,Q)["area"],direction,origin)
        dr=derivative(lambda M,a,Q:reference(M,a,Q)["rPlus"],direction,origin)
        dJ=derivative(lambda M,a,Q:M*a,direction,origin)
        for key,value in [("drPlus",dr),("dA",dA),("dJ",dJ),("dS",dA/4)]:
            checks.close(saved[key],value,"five-point first-law "+key)
        ref=reference(*origin)
        terms={"area":ref["kappa"]*dA/(8*math.pi),
               "angularMomentum":ref["omegaH"]*dJ,"charge":ref["phiH"]*direction[2]}
        for key,value in terms.items():
            checks.close(saved["terms"][key],value,"first-law "+key+" term")
        rhs=math.fsum(terms.values())
        checks.close(rhs,direction[0],"independent differential first law")
        checks.close(saved["rhs"],rhs,"saved differential first-law RHS")
        checks.equal(saved["passed"],True,"first-law reported status")
        return f"Independent five-point derivative gives dA={dA:.15g}, dJ={dJ:.15g}; RHS={rhs:.15g}, dM={direction[0]:.15g}."

    def si():
        saved=packet["standard"]["SI"]
        M=saved["Mkg"]
        G,c,h,kB=6.67430e-11,299792458.0,6.62607015e-34,1.380649e-23
        hb=h/(2*math.pi)
        for key,value in [("G",G),("c",c),("h",h),("hbar",hb),("kB",kB)]:
            relative(checks,saved["constants"][key],value,"fixed SI constant "+key)
        radius=2*G*M/(c*c)
        area=4*math.pi*radius*radius
        T=hb*c**3/(8*math.pi*G*M*kB)
        SB=math.pi**2*kB**4/(60*hb**3*c*c)
        power=area*SB*T**4
        entropy=kB*c**3*area/(4*G*hb)
        values={"radius":radius,"area":area,"surfaceGravity":c**4/(4*G*M),"temperature":T,
                "entropy":entropy,"entropyOverKB":entropy/kB,"radiationPower":power,
                "evaporationTime":M*c*c/(3*power)}
        for key,value in values.items():
            relative(checks,saved[key],value,"SI "+key)
        checks.equal("Blackbody approximation" in saved["approximation"]["scope"],True,"approximation label")
        return f"Solar reference radius={radius:.12g} m, T={T:.12g} K; ideal power={power:.12g} W and formal lifetime={values['evaporationTime']:.12g} s. Relative checks include tiny and huge quantities."

    def comparison(saved, gaseous, aggie, prior, name):
        identical=gaseous == aggie
        checks.equal(saved["identical"],identical,name+" equality")
        checks.close(saved["priorGaseous"],prior,name+" prior")
        if identical:
            checks.close(saved["posteriorGaseous"],prior,name+" posterior unchanged")
        else:
            checks.equal(saved["posteriorGaseous"],None,name+" distinguishable posterior not inferred")
        checks.close(saved["optimalAccuracy"],max(prior,1-prior) if identical else 1,name+" ideal optimal accuracy")

    def aperture(alpha, critical, r0):
        return r0*math.sqrt(1-(critical/alpha)**2) if alpha>critical else 0.0

    def toy():
        saved=packet["scenario"]
        p=saved["parameters"]
        alpha=p["alphaCritical"] if p["epsilonSpin"]==1-p["alphaCritical"] else 1-p["epsilonSpin"]
        radius=aperture(alpha,p["alphaCritical"],p["r0"])
        checks.close(saved["alpha"],alpha,"scenario spin alpha")
        checks.equal(saved["exterior"],{"M":p["M"],"a":p["M"]*alpha,"Q":p["Q"]},"scenario shared exterior")
        for name,load in [("gaseous",0),("aggie",p["aggieLoad"])]:
            b=saved["branches"][name]
            C=int(load>=p["sealThreshold"])
            checks.close(b["apertureRadius"],radius,name+" radius")
            checks.close(b["integratedCoverLoad"],load,name+" integrated load")
            checks.equal(b["cover"],C,name+" cover threshold")
            checks.equal(b["geometricOpen"],radius>0,name+" opening")
            checks.equal(b["passage"],(1-C)*int(radius>0),name+" passage")
            checks.equal(b["status"],"toy-assumption",name+" status")
        obs=saved["observations"]
        values=[p["M"],p["M"]*alpha,p["Q"]]
        checks.equal(obs["gaseous"],values,"gaseous exterior observations")
        checks.equal(obs["aggie"],values,"aggie exterior observations")
        comparison(obs["comparison"],values,values,p["priorGaseous"],"exterior-only")
        probe=saved["optionalPassageProbe"]
        comparison(probe["comparison"],probe["gaseous"],probe["aggie"],p["priorGaseous"],"toy passage probe")
        checks.equal(saved["electromagneticClaim"]["status"],"unresolved","zap mechanism unresolved")
        checks.equal("equality is closed" in saved["thresholdConventions"]["aperture"],True,"aperture equality metadata")
        checks.equal("equality is sealed" in saved["thresholdConventions"]["cover"],True,"cover equality metadata")
        checks.close(aperture(p["alphaCritical"],p["alphaCritical"],p["r0"]),0,"independent threshold convention")
        checks.equal(int(p["sealThreshold"]>=p["sealThreshold"]),1,"independent equality seals")
        return f"Saved aperture={radius:.15g}, gaseous/aggie passage=1/0. Exterior posterior remains prior; the optional toy passage probe is distinguishable. Equality checks validate the declared rules, not unsaved production executions."

    def profiles():
        radial=packet["radialProfile"]
        codec=radial["codec"]
        p=codec["referenceParameters"]
        lo,hi=codec["range"]
        values=[]
        for label,s in enumerate(radial["samples"]):
            radius=lo+(hi-lo)*label/(gf9.order-1)
            g,_,_=metric(p["M"],p["a"],p["Q"],radius,codec["theta"])
            value=g[0][0] if codec["component"]=="gtt" else -g[0][3]/g[3][3]
            checks.equal(s["label"],label,"radial label")
            checks.close(s["r"],radius,"radial grid")
            checks.close(s["theta"],codec["theta"],"radial theta")
            checks.close(s["value"],value,"independent radial metric sample")
            values.append(value)
        checks.vector(codec["nodes"],[s["r"] for s in radial["samples"]],"radial codec nodes")
        state_result["prepared"]=verify_samples(checks,radial,gf9,values,"radial exterior")
        for kind,record in packet["toyProfiles"].items():
            sampling=record["sampling"]
            p=sampling["parameters"]
            nodes=[i/(gf9.order-1) for i in range(gf9.order)]
            radii=[aperture(x,p["alphaCritical"],p["r0"]) for x in nodes]
            gas=[int(v>0) for v in radii]
            C=int(p["aggieLoad"]>=p["sealThreshold"])
            expected={"aperture":radii,"gaseousPassage":gas,"aggiePassage":[(1-C)*v for v in gas]}
            checks.vector(sampling["nodes"],nodes,kind+" spin grid")
            checks.equal(sampling["cover"],C,kind+" cover bit")
            for nested,values in expected.items():
                profile=sampling["profiles"][nested]
                checks.vector(profile["values"],values,kind+" nested "+nested+" values")
                if all(v==0 for v in values):
                    checks.equal(profile["preparedState"],None,kind+" nested zero no state")
                    checks.equal(profile["scale"],0,kind+" nested zero scale")
                else:
                    expected_transformed=apply(fourier(gf9),[v/norm(values) for v in values])
                    checks.vector(profile["preparedState"],expected_transformed,kind+" nested "+nested+" Fourier")
            values=expected[kind]
            if all(v==0 for v in values):
                checks.equal(record["encoding"],"zero-signal-no-state","zero profile encoding")
                for key in ["preparedState","preparation","transform"]:
                    checks.equal(record[key],None,"zero profile "+key)
            else:
                verify_samples(checks,record,gf9,values,"toy "+kind)
        observer=packet["observerResult"]
        checks.equal(observer["observations"]["gaseous"],observer["observations"]["aggie"],"radial branches identical observations")
        checks.vector(observer["observations"]["gaseous"],[as_complex(v) for v in radial["transform"]["originalValues"]],"observer radial values")
        comparison(observer["comparison"],observer["observations"]["gaseous"],observer["observations"]["aggie"],.5,"radial observer")
        checks.close(observer["transformedDifference"],0,"identical encodings no extra information")
        return "All 9 radial metric samples and all 3 toy families independently regenerated, including nested samples, L2 scales, positive GF9 Fourier and inverse recovery. Zero aggie passage has no prepared state."

    def logical_map():
        saved=packet["logicalMap"]
        eps=saved["epsilonMap"]
        K=[[as_complex(v) for v in row] for row in saved["K"]]
        T=[[complex(i==j)+eps*K[i][j] for j in range(4)] for i in range(4)]
        checks.equal(eps,0,"default logical epsilonMap")
        checks.matrix(K,[[0]*4 for _ in range(4)],"default unspecified K bookkeeping zeros")
        checks.matrix(saved["T"],T,"logical I4+epsilonMap K")
        re=saved["reapplication"]
        v=[as_complex(x) for x in re["input"]]
        F=fourier(gf4)
        B=product(product(F,T),adjoint(F))
        output=apply(T,v)
        for key,expected in [("input",[1,0,0,0]),("transformedInput",apply(F,v)),
                             ("transformedOutput",apply(B,apply(F,v))),("output",output),("directOutput",output)]:
            checks.vector(re[key],expected,"logical "+key)
        checks.matrix(re["transformedOperator"],B,"logical F4 T F4 adjoint")
        checks.matrix(product(product(adjoint(F),B),F),T,"logical map operator inverse")
        checks.matrix(product(adjoint(F),F),[[complex(i==j) for j in range(4)] for i in range(4)],"independent F4 unitarity")
        checks.equal(saved["statePreserved"],True,"logical inspect-only flag")
        checks.equal(re["unitarity"]["isUnitary"],True,"default logical identity unitary")
        return "Default supplied logical map is bookkeeping I4; independent polynomial GF4 trace Fourier conjugation, input/output and inverse agree. This is not a metric equivalence."

    def final_state():
        prepared=state_result.get("prepared")
        if prepared is None:
            raise ValueError("No independently reconstructed radial preparation")
        final=reflection(gf9,displacement(gf9,prepared,3,4),3,4)
        saved=packet["finalState"]
        checks.equal(saved["field"],"gf9","final GF9 field")
        checks.vector(saved["vector"],final,"D(3,4) followed by R(3,4)")
        checks.close(norm(final),1,"independent final state norm")
        checks.equal(saved["preparation"]["subsequentOperations"],["gf.displace 3 4","gf.reflect 3 4"],"operation order provenance")
        checks.equal(saved["preparation"]["codec"],packet["radialProfile"]["codec"],"final radial codec retained")
        grid=wigner(gf9,final)
        checks.matrix(saved["wigner"]["grid"],grid,"all 81 final Wigner cells")
        reals=[[v.real for v in row] for row in grid]
        for row in grid:
            for v in row:
                checks.close(v.imag,0,"Wigner reality")
        position=[math.fsum(row) for row in reals]
        momentum=[math.fsum(row[j] for row in reals) for j in range(9)]
        expected_pos=[abs(v)**2 for v in final]
        expected_mom=[abs(v)**2 for v in apply(adjoint(fourier(gf9)),final)]
        checks.vector(position,expected_pos,"independent position marginal")
        checks.vector(momentum,expected_mom,"independent negative-Fourier momentum marginal")
        for key,value in [("position",position),("momentum",momentum),
                          ("expectedPosition",expected_pos),("expectedMomentum",expected_mom)]:
            checks.vector(saved["wigner"]["marginals"][key],value,"stored "+key)
        flat=[v for row in reals for v in row]
        l1=math.fsum(abs(v) for v in flat)
        for key,value in [("normalization",math.fsum(flat)),("purity",9*math.fsum(v*v for v in flat)),
                          ("l1Norm",l1),("mana",math.log2(l1)),("negativity",(l1-1)/2),
                          ("minValue",min(flat)),("maxValue",max(flat))]:
            checks.close(saved["wigner"][key],value,"Wigner "+key)
        checks.equal(saved["wigner"]["negativeCellCount"],sum(v<-TOL for v in flat),"negative cell count")
        checks.equal(saved["wigner"]["manaLogBase"],2,"mana log base")
        snapshot=session["data"]["snapshot"]
        checks.vector(snapshot["state"],final,"session active state")
        checks.close(snapshot["normSquared"],norm(final)**2,"session norm squared")
        checks.equal(snapshot["preparation"],saved["preparation"],"session active source provenance")
        simulation=session["data"]["horizonSimulation"]
        checks.equal(simulation["parameters"],packet["scenario"]["parameters"],"session scenario parameters")
        checks.equal(simulation["probe"],"exterior","session observation protocol")
        records=session["data"]["records"]
        aperture_record=packet["toyProfiles"]["aperture"]
        old_values=[-9.81*math.sin(.2*(2*i/8-1)) for i in range(9)]
        old_prepared=apply(fourier(gf9),[v/norm(old_values) for v in old_values])
        old_final=reflection(gf9,displacement(gf9,old_prepared,3,4),3,4)
        vectors=[final,[as_complex(v) for v in aperture_record["preparedState"]],old_final]
        families=["horizon-gtt","hypothetical-aperture","image-pendulum"]
        checks.equal(len(records),3,"three saved research records")
        for i,(record,expected,family) in enumerate(zip(records,vectors,families)):
            snap=record["data"]["payload"]["snapshot"]
            checks.vector(snap["state"],expected,f"research record {i} state")
            checks.equal(snap["preparation"]["family"],family,f"research record {i} family")
            checks.close(snap["normSquared"],norm(expected)**2,f"research record {i} norm")
        return f"All 9 final amplitudes, 81 Wigner cells, marginals, purity and mana2={math.log2(l1):.15g} agree; active session and three research-record states verified."

    def reported():
        checks.equal(packet["passed"],True,"packet overall reported status")
        for name,record in packet["checks"].items():
            checks.equal(record["passed"],True,"reported "+name+" status")
            checks.equal(0<=record["residual"]<=TOL,True,"reported "+name+" bounded residual")
        return "Reported aggregate checks are consistent with the independently validated saved quantities."

    for name,function in [
        ("Byte provenance, canonical SHA envelopes and session packet equality",provenance),
        ("Complete source coverage and scoped dispositions",coverage),
        ("Independent KN/RN/Schwarzschild geometry and metric determinants",geometry),
        ("Independent numerical directional first law",first_law),
        ("SI values and explicitly ideal blackbody estimates",si),
        ("Toy assumptions, thresholds and observation inference",toy),
        ("GF9 radial/toy signal Fourier, scale and inverse",profiles),
        ("Logical map and GF4 trace Fourier identity",logical_map),
        ("Final D/R state, Wigner and recorded session states",final_state),
        ("Reported result status",reported)]:
        checks.run(name,function)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--packet",type=Path,default=ROOT/"horizon-reapplication.json")
    parser.add_argument("--session",type=Path,default=ROOT/"examples/Horizon-Simulation-session.json")
    parser.add_argument("--report",type=Path,default=ROOT/"validation/horizon-independent-validation.txt")
    args=parser.parse_args()
    checks=Checks()
    raw,args_session_raw=args.packet.read_bytes(),args.session.read_bytes()
    packet,session=json.loads(raw),json.loads(args_session_raw)
    registry=json.loads((ROOT/"horizon-equations.json").read_text(encoding="utf-8-sig"))
    previous_registry=json.loads((ROOT/"equation-audit.json").read_text(encoding="utf-8-sig"))
    validate(packet,session,registry,previous_registry,checks)
    status="PASS" if not checks.failures else "FAIL"
    lines=["INDEPENDENT HORIZON VALIDATION — RUSSL 0.4.0","",
           "Status: "+status,"Packet: "+args.packet.name,
           "Packet byte SHA-256: "+hashlib.sha256(raw).hexdigest(),
           "Session byte SHA-256: "+hashlib.sha256(args_session_raw).hexdigest(),
           args.packet.name+" SHA-256: "+hashlib.sha256(raw).hexdigest(),
           args.session.name+" SHA-256: "+hashlib.sha256(args_session_raw).hexdigest(),
           "Session canonical data SHA-256: "+session["sha256"],
           f"Assertions evaluated: {checks.count}",
           f"Maximum scaled numeric comparison error: {checks.maximum_scaled_error:.17g}",
           f"Maximum scaled error: {checks.maximum_scaled_error:.17g}",
           f"Numerical acceptance tolerance: {TOL}","",
           "Method: Python standard library only; no production JavaScript module is imported, called or executed.",
           "Polynomial finite fields, positive trace characters, matrix products, Fourier inverse and Wigner expectations are independently calculated.",
           "GR metric uses compact quadratic coframes; determinant uses general pivoted elimination.",
           "First-law differentials use independent five-point numerical directional differentiation.",
           "SI checks use fixed constants and relative comparisons even for tiny radiation power and huge lifetime.",
           "Canonical envelope verification independently reproduces sorted UTF-16 keys, JSON strings and ECMAScript number formatting.",""]
    for name,count,details in checks.groups:
        lines += [f"PASS — {name} ({count} assertions)",str(details)]
    for failure in checks.failures:
        lines += ["FAIL — "+failure]
    lines += ["","Scope: this saved default experiment, its source byte identities and recorded numeric states.",
              "This does not certify a global wormhole/black-hole equivalence, physical traversal, an electromagnetic zap",
              "mechanism, timeless material, a Teukolsky solution, full Hawking spectrum/lifetime, the unavailable",
              "500-equation suite, continuum convergence, live browser rendering, downloads or iframe behavior.",
              "Toy equality-boundary calculations check the declared conventions; they do not call unsaved production configurations.",
              "The transformed radial/toy profiles are chosen finite complex signal encodings with retained scale.",
              "Repeat the script after regenerated packets; hashes in this report identify the files actually checked."]
    args.report.write_text("\n".join(lines)+"\n",encoding="utf-8")
    print(f"{status}: {checks.count} assertions; maximum scaled error {checks.maximum_scaled_error:.6g}; {len(checks.failures)} failed groups.")
    for failure in checks.failures:
        print(failure)
    return 0 if not checks.failures else 1


if __name__=="__main__":
    sys.exit(main())


