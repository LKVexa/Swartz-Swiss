"""Exercise downloaded native startup without changing Windows execution policy."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import sys


def absolute(path):
    return Path(os.path.abspath(path))


def reject_reparse_points(path):
    for probe in (path, *path.parents):
        try:
            info = probe.lstat()
        except FileNotFoundError:
            continue
        if stat.S_ISLNK(info.st_mode) or getattr(info, "st_file_attributes", 0) & 0x400:
            raise ValueError(f"Test paths cannot contain reparse points: {probe}")


def copy_package(source, destination):
    destination.mkdir()
    for folder, directories, filenames in os.walk(source, followlinks=False):
        parent = Path(folder)
        relative = parent.relative_to(source)
        excluded = {".git", "workspace", "outputs", "work"} if parent == source else {".git"}
        directories[:] = sorted(name for name in directories if name not in excluded)
        target = destination / relative
        for name in directories:
            reject_reparse_points(parent / name)
            (target / name).mkdir()
        for name in sorted(filenames):
            if name in excluded:
                continue
            member = parent / name
            reject_reparse_points(member)
            if not stat.S_ISREG(member.lstat().st_mode):
                raise ValueError(f"Package contains a nonregular file: {member}")
            shutil.copyfile(member, target / name)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).absolute().parents[1])
    parser.add_argument("--work", type=Path, required=True, help="Fresh short folder outside the source package")
    parser.add_argument("--baseline-exe", type=Path)
    parser.add_argument("--timeout-seconds", type=int, default=120)
    args = parser.parse_args()
    root, work = absolute(args.root), absolute(args.work)
    package = work / "package"
    reject_reparse_points(root)
    reject_reparse_points(work)
    if not root.is_dir():
        parser.error(f"Package root is missing: {root}")
    if os.path.lexists(work):
        parser.error(f"Choose a fresh test folder; existing files are preserved: {work}")
    try:
        within_root = os.path.normcase(os.path.commonpath([root, work])) == os.path.normcase(str(root))
    except ValueError:
        within_root = False
    if within_root:
        parser.error("The test folder must be outside the source package.")
    if len(str(package)) > 89:
        parser.error("Choose a shorter test folder so Work/package is at most 89 characters.")
    if not 10 <= args.timeout_seconds <= 600:
        parser.error("--timeout-seconds must be between 10 and 600.")
    baseline_exe = absolute(args.baseline_exe) if args.baseline_exe else None
    if baseline_exe:
        reject_reparse_points(baseline_exe)
        if not baseline_exe.is_file():
            parser.error(f"Baseline executable is missing: {baseline_exe}")
    if os.name != "nt":
        parser.error("This native startup regression requires Windows.")
    work.mkdir(parents=True)
    sdk = package / "runtime/webview2-sdk/1.0.4191.47"
    core = sdk / "Microsoft.Web.WebView2.Core.dll"
    wpf = sdk / "Microsoft.Web.WebView2.Wpf.dll"
    seal = package / "engine/ja21/runtime.integrity.json"
    exe = package / "GfmJa21.exe"
    checks, runs = [], []
    originals = {}
    failure = None

    def check(name, passed, detail=None):
        checks.append({"name": name, "passed": bool(passed), "detail": detail})
        if not passed:
            raise RuntimeError(f"Downloaded-startup regression failed: {name}")

    def check_internet_marks():
        for adapter in (core, wpf):
            with open(str(adapter) + ":Zone.Identifier", encoding="ascii") as stream:
                mark = stream.read()
            check(f"Internet mark remains: {adapter.name}", re.search(r"(?m)^ZoneId=3\s*$", mark) is not None)

    def mark_downloaded(adapter):
        with open(str(adapter) + ":Zone.Identifier", "w", encoding="ascii", newline="") as stream:
            stream.write("[ZoneTransfer]\r\nZoneId=3\r\n")

    def update_copied_seal(relative, path):
        document = json.loads(seal.read_text(encoding="utf-8-sig"))
        entries = [entry for entry in document["files"] if entry["path"] == relative]
        if len(entries) != 1:
            raise ValueError(f"Expected exactly one runtime seal entry: {relative}")
        data = path.read_bytes()
        entries[0].update(bytes=len(data), sha256=hashlib.sha256(data).hexdigest())
        seal.write_text(json.dumps(document, indent=2) + "\n", encoding="utf-8")

    def write_output(name, stdout, stderr):
        for suffix, content in (("stdout", stdout), ("stderr", stderr)):
            if isinstance(content, bytes):
                content = content.decode("utf-8", errors="replace")
            (work / f"{name}.{suffix}.txt").write_text(content or "", encoding="utf-8")

    def run_verification(name):
        try:
            process = subprocess.run(
                [str(exe), "--verify"], cwd=package, capture_output=True,
                encoding="utf-8", errors="replace", timeout=args.timeout_seconds,
                creationflags=subprocess.CREATE_NO_WINDOW,
            )
        except subprocess.TimeoutExpired as error:
            write_output(name, error.stdout, error.stderr)
            raise RuntimeError(f"Verification timed out after {args.timeout_seconds} seconds: {name}") from error
        write_output(name, process.stdout, process.stderr)
        receipt_path = package / "workspace/verification/native-console.json"
        if not receipt_path.is_file():
            raise RuntimeError(f"Verification produced no receipt: {name}")
        receipt_text = receipt_path.read_text(encoding="utf-8-sig")
        (work / f"{name}.json").write_text(receipt_text, encoding="utf-8")
        receipt = json.loads(receipt_text)
        error_path = package / "workspace/logs/native-startup-error.txt"
        startup_error = error_path.read_text(encoding="utf-8-sig") if process.returncode and error_path.is_file() else ""
        result = {"name": name, "exitCode": process.returncode, "status": receipt["status"], "startupError": startup_error}
        runs.append(result)
        return result

    try:
        copy_package(root, package)
        originals = {path: path.read_bytes() for path in (core, seal, exe)}
        for adapter in (core, wpf):
            mark_downloaded(adapter)
        check_internet_marks()
        if baseline_exe:
            exe.write_bytes(baseline_exe.read_bytes())
            update_copied_seal("GfmJa21.exe", exe)
            baseline = run_verification("baseline-downloaded")
            check("Baseline reproduces the downloaded-assembly error",
                  baseline["exitCode"] != 0 and re.search(r"loadFromRemoteSources|0x80131515", baseline["startupError"]) is not None,
                  baseline["startupError"])
            exe.write_bytes(originals[exe])
            seal.write_bytes(originals[seal])
        fixed = run_verification("fixed-downloaded")
        check("Fixed executable verifies with Internet-marked adapters",
              fixed["exitCode"] == 0 and fixed["status"] == "passed", fixed["status"])
        check_internet_marks()

        # A trailing byte keeps the assembly recognizable while changing its digest.
        core.write_bytes(originals[core] + b"\x01")
        # Replacing the main stream can discard ADS on Windows. Reapply the mark
        # after this test mutation to simulate a downloaded, tampered library.
        mark_downloaded(core)
        tampered = run_verification("tampered-downloaded")
        check("Runtime seal rejects a modified downloaded adapter",
              tampered["exitCode"] != 0 and "Runtime integrity failure: runtime/webview2-sdk/1.0.4191.47/Microsoft.Web.WebView2.Core.dll" in tampered["startupError"],
              tampered["startupError"])
        update_copied_seal("runtime/webview2-sdk/1.0.4191.47/Microsoft.Web.WebView2.Core.dll", core)
        resealed = run_verification("tampered-resealed-downloaded")
        check("Hardcoded adapter pin rejects a modified adapter even with an updated seal",
              resealed["exitCode"] != 0 and re.search(r"adapter.*(integrity|hash|digest|pin|SHA-256)|(integrity|hash|digest|pin|SHA-256).*adapter", resealed["startupError"], re.I | re.S) is not None,
              resealed["startupError"])
        check_internet_marks()
    except Exception as error:
        failure = str(error)
    finally:
        restoration_failures = []
        for path, data in originals.items():
            try:
                path.write_bytes(data)
                if path == core:
                    mark_downloaded(core)
            except Exception as error:
                restoration_failures.append(f"{path}: {error}")
        if core in originals:
            try:
                check_internet_marks()
            except Exception as error:
                restoration_failures.append(str(error))
        if restoration_failures:
            failure = ((failure + "; ") if failure else "") + "Restoration failed: " + "; ".join(restoration_failures)
        report = {
            "schema": "GFM-JA21-downloaded-startup/1", "status": "failed" if failure else "passed",
            "root": str(root), "packageCopy": str(package), "baselineSupplied": bool(baseline_exe),
            "checks": checks, "runs": runs, "failure": failure,
            "windowsPolicyChanged": False, "sourcePackageChanged": False,
        }
        report_path = work / "downloaded-startup.json"
        report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        print(f"Downloaded startup checks: {report['status']}; report: {report_path}")
        if failure:
            print(failure, file=sys.stderr)
    return 1 if failure else 0


if __name__ == "__main__":
    raise SystemExit(main())
