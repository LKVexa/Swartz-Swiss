"""Bundle the verified current simulator and its cited project records into JA21."""
from pathlib import Path
import hashlib, json, shutil

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"D:\Codex\GFM-Cylindrical-Pulse-Simulator")
TARGET = ROOT / "GFM"
manifest = json.loads((SOURCE / "release-manifest.json").read_text(encoding="utf-8-sig"))
for item in manifest["files"]:
    source = SOURCE / item["path"]
    data = source.read_bytes()
    if len(data) != item["bytes"] or hashlib.sha256(data).hexdigest() != item["sha256"]:
        raise ValueError("Source package changed: " + item["path"])
    target = TARGET / item["path"]
    if target.exists():
        raise FileExistsError("Preserving existing bundled app: " + str(target))
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
shutil.copy2(SOURCE / "release-manifest.json", TARGET / "release-manifest.json")
records = {
 "file:///D:/Codex/JA21_GFM_Console/READ%20ME%20-%20GFM%20Integration.txt": (Path(r"D:\Codex\JA21_GFM_Console\READ ME - GFM Integration.txt"), "project-references/JA21-earlier-integration.txt"),
 "file:///D:/Codex/2026-10-11/pl/GFM_Phase_Texture_Simulator/README-Phase.txt": (Path(r"D:\Codex\2026-10-11\pl\GFM_Phase_Texture_Simulator\README-Phase.txt"), "project-references/phase-texture.txt"),
 "file:///D:/Codex/2026-10-11/pl/GFM_Research_Simulator/README.txt": (Path(r"D:\Codex\2026-10-11\pl\GFM_Research_Simulator\README.txt"), "project-references/research-observatory.txt"),
 "file:///D:/Codex/GFM-Phase-Coupling-Study/": (Path(r"D:\Codex\GFM-Phase-Coupling-Study\coupling-study.json"), "project-references/coupling-study.json"),
}
references=[]
for original,(source,relative) in records.items():
    target=TARGET/relative
    target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(source,target)
    references.append({"source":str(source),"installed":relative,"sha256":hashlib.sha256(target.read_bytes()).hexdigest()})
for entry in ["public/project.html","GFM Project.html"]:
    target=TARGET/entry
    text=target.read_text(encoding="utf-8")
    for original,(_,relative) in records.items():
        text=text.replace(original,relative)
    text=text.replace('D:\\Codex\\GFM-Cylindrical-Pulse-Simulator','Bundled GFM application inside the JA21 console')
    text=text.replace('<p id="local-project-note" hidden>Open GFM Project.html from the project folder to follow these local references. Browsers restrict local file links from a server page.</p>','')
    text=text.replace('<script>if(location.protocol!==\'file:\'){document.getElementById(\'local-project-note\').hidden=false;for(const link of document.querySelectorAll(\'a[href^="file:"]\')){const label=document.createElement(\'span\');label.textContent=link.textContent;link.replaceWith(label);}}</script>','')
    text=text.replace('Phase coupling study</a>','Phase coupling study record</a>')
    target.write_text(text,encoding="utf-8")
(ROOT/"provenance/gfm-bundle.json").write_text(json.dumps({"schema":"GFM-JA21-app-bundle/1","sourceRoot":str(SOURCE),"sourceManifestSHA256":hashlib.sha256((SOURCE/"release-manifest.json").read_bytes()).hexdigest(),"sourceFilesVerified":len(manifest["files"]),"engineSHA256":manifest["engineSHA256"],"currentModelFilesBundled":True,"projectReferences":references,"historicalModelsEvolved":False},indent=2),encoding="utf-8")
print(json.dumps({"sourceFilesVerified":len(manifest["files"]),"bundledRoot":str(TARGET),"projectReferences":len(references)}))
