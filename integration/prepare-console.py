"""Materialize the supplied console with reversible Windows-safe reference aliases."""
from pathlib import Path, PurePosixPath
import hashlib, json, re, shutil, stat, zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\russe\Downloads\JA21-Blank-Console-main.zip")
PREFIX = "JA21-Blank-Console-main/"
RESERVED = re.compile(r"^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)", re.I)
records, aliases, seen = [], [], set()
with zipfile.ZipFile(SOURCE) as archive:
    for item in archive.infolist():
        if item.is_dir():
            continue
        if not item.filename.startswith(PREFIX):
            raise ValueError("Unexpected archive root: " + item.filename)
        original = item.filename[len(PREFIX):]
        parts = PurePosixPath(original).parts
        if not parts or original.startswith("/") or any(p in {"", ".", ".."} or re.search(r'[<>:"\\|?*]', p) or p[-1] in ". " or RESERVED.match(p) for p in parts):
            raise ValueError("Unsafe archive member: " + original)
        if stat.S_ISLNK(item.external_attr >> 16):
            raise ValueError("Archive link rejected: " + original)
        relative = original
        if len(relative) > 150:
            if not original.startswith(("substrate/DF_Xtra_Large/", "substrate/DF_Large/", "engine/df_medium/baseline/", "corpora/")):
                raise ValueError("Active file needs explicit path review: " + original)
            relative = "references/" + hashlib.sha256(original.encode()).hexdigest()[:24] + PurePosixPath(original).suffix
            aliases.append({"original": original, "installed": relative})
        key = relative.casefold()
        if key in seen:
            raise ValueError("Windows filename collision: " + relative)
        seen.add(key)
        target = ROOT.joinpath(*PurePosixPath(relative).parts)
        if len(str(target)) > 240:
            raise ValueError("Unsafe extraction target: " + str(target))
        target.parent.mkdir(parents=True, exist_ok=True)
        data = archive.read(item)
        if target.exists():
            if target.read_bytes() != data:
                raise ValueError("Preserving a changed extraction target: " + str(target))
        else:
            target.write_bytes(data)
        records.append({"original": original, "installed": relative, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()})
provenance = ROOT / "provenance"
provenance.mkdir(exist_ok=True)
backup = provenance / "JA21-original.zip"
if backup.exists():
    if hashlib.sha256(backup.read_bytes()).digest() != hashlib.sha256(SOURCE.read_bytes()).digest():
        raise FileExistsError(backup)
else:
    shutil.copy2(SOURCE, backup)
receipt = {"schema": "GFM-JA21-source-materialization/1", "source": str(SOURCE), "sourceSHA256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(), "files": records, "referenceAliases": aliases, "sourceBytesPreserved": True, "aliasScope": "Reference and baseline files only; active native runtime paths unchanged.", "longestInstalledPath": max(len(str(ROOT / r["installed"])) for r in records)}
(provenance / "console-source.json").write_text(json.dumps(receipt, indent=2), encoding="utf-8")
print(json.dumps({"files": len(records), "referenceAliases": len(aliases), "longestPath": receipt["longestInstalledPath"], "originalZipPreserved": str(backup)}))
