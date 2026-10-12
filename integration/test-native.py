"""Run the native console's verification mode and record actual process evidence."""
from pathlib import Path
import json, subprocess
root=Path(__file__).resolve().parents[1]
work=root/'workspace/verification';work.mkdir(parents=True,exist_ok=True)
result={'schema':'GFM-JA21-native-process-test/1','executable':str(root/'GfmJa21.exe'),'arguments':['--verify'],'windowsPolicyChanged':False}
try:
    process=subprocess.run([str(root/'GfmJa21.exe'),'--verify'],cwd=root,capture_output=True,text=True,timeout=60)
    result.update(exitCode=process.returncode,stdout=process.stdout,stderr=process.stderr)
except (OSError,subprocess.TimeoutExpired) as error:
    result.update(error=str(error),winerror=getattr(error,'winerror',None))
report=work/'native-console.json'
result['nativeReportExists']=report.is_file()
if report.is_file():result['nativeReport']=json.loads(report.read_text(encoding='utf-8-sig'))
(work/'native-process.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result,indent=2))
raise SystemExit(0 if result.get('exitCode')==0 and result['nativeReportExists'] and result['nativeReport'].get('status')=='passed' else 1)
