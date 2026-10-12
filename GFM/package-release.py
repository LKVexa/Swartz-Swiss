"""Create and verify a Windows-safe archive from the frozen release manifest."""
import hashlib
import argparse
import json
from pathlib import Path
import re
import zipfile

root = Path(__file__).resolve().parent
manifest_path = root / "release-manifest.json"
manifest = json.loads(manifest_path.read_text(encoding="utf-8-sig"))
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--archive-name", help="A new ZIP filename for an integrated package; existing archives are preserved.")
args = parser.parse_args()
destination = Path(r"D:\Codex\2026-10-11\pl\outputs")
destination.mkdir(parents=True, exist_ok=True)
archive_name = args.archive_name or ("GFM-Cylindrical-Pulse-v" + manifest["version"] + ".zip")
if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]*\.zip", archive_name):
    raise ValueError("Use a simple ZIP filename without directories: " + archive_name)
archive = destination / archive_name
if archive.exists():
    raise FileExistsError("Preserving the existing release: " + str(archive))
prefix = "GFM-Cylindrical-Pulse-Simulator/"
members = [(record["path"], record) for record in manifest["files"]]
members.append(("release-manifest.json", None))
for relative, record in members:
    for part in relative.split("/"):
        if not part or part in {".", ".."} or re.search(r'[<>:"\\|?*]', part) or part[-1] in ". ":
            raise ValueError("Unsafe archive member: " + relative)
        if re.match(r"^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)", part, re.I):
            raise ValueError("Reserved Windows member: " + relative)
    file = root / relative
    if not file.is_file() or file.is_symlink():
        raise ValueError("Missing or linked packaged file: " + relative)
    if len(str(file)) > 240:
        raise ValueError("Overlong extracted Windows path: " + str(file))
    data = file.read_bytes()
    if record and (len(data) != record["bytes"] or hashlib.sha256(data).hexdigest() != record["sha256"]):
        raise ValueError("File changed after manifest generation: " + relative)
with zipfile.ZipFile(archive, "x", zipfile.ZIP_DEFLATED, compresslevel=6, allowZip64=True) as z:
    for relative, _ in members:
        z.write(root / relative, prefix + relative)
with zipfile.ZipFile(archive) as z:
    if z.testzip() is not None:
        raise ValueError("Archive CRC verification failed")
    for relative, record in members:
        expected = record["sha256"] if record else hashlib.sha256(manifest_path.read_bytes()).hexdigest()
        if hashlib.sha256(z.read(prefix + relative)).hexdigest() != expected:
            raise ValueError("Archive member digest differs: " + relative)
receipt = {
    "product": manifest["product"], "version": manifest["version"],
    "archive": str(archive), "bytes": archive.stat().st_size,
    "sha256": hashlib.sha256(archive.read_bytes()).hexdigest(),
    "members": len(members), "allMemberCRCsVerified": True,
    "allMemberSHA256Verified": True,
    "longestMemberPathCharacters": max(len(prefix + relative) for relative, _ in members),
    "longestInstalledPathCharacters": max(len(str(root / relative)) for relative, _ in members),
    "engineSHA256": manifest["engineSHA256"],
}
archive.with_suffix(".receipt.json").write_text(json.dumps(receipt, indent=2), encoding="utf-8")
print(json.dumps(receipt, indent=2))
