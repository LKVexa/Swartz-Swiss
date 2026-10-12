"""Record the integrated application identity while retaining the supplied baseline."""
from pathlib import Path
import json

root=Path(__file__).resolve().parents[1]
metadata=json.loads((root/'CONSOLE_BUILD.json').read_text(encoding='utf-8'))
(root/'provenance/console-build-original.json').write_text(json.dumps(metadata,indent=2),encoding='utf-8')
metadata.update(product='GFM JA21 Console',console_version='1.3.0',starts_blank=False,default_size=[1280,900],minimum_size=[760,600],simulation_integration='Bundled GFM 2.1.0 through native WebView2 composition control and exact virtual origin',release_date='2026-10-12')
metadata['blank_console_baseline_validation']=metadata.pop('validation')
metadata['validation']={'report':'validation/integration-release.json','blank_console_baseline_is_not_integration_validation':True}
(root/'CONSOLE_BUILD.json').write_text(json.dumps(metadata,indent=2),encoding='utf-8')
(root/'CONSOLE_VERSION').write_text('1.3.0\n',encoding='utf-8')
for source,backup in [('README.md','README-console-original.md'),('READ ME - Console.txt','Readme-console-original.txt')]:
    (root/'provenance'/backup).write_bytes((root/source).read_bytes())
(root/'README.md').write_text('''# GFM inside the JA21 console

**Console 1.3.0 · GFM model 2.1.0 · Windows x64**

Open **Start GFM Console.cmd**. The existing JA21 WPF window contains the live
3D simulator, controls, equation registry, data export and local project records.
WebView2 maps the bundled `GFM/` application to its reserved virtual HTTPS origin;
no localhost backend or external browser window is needed for this path.

Read **READ ME - GFM Console.txt** for requirements, Windows paths and model scope.
Run **Verify GFM Console.cmd** for the native compilation, integrity and origin
checks. Integration evidence and exact testing limits are under `validation/`.

The supplied blank console and all original source bytes remain recoverable from
`provenance/JA21-original.zip`. Deep reference paths have reversible aliases in
`provenance/console-source.json`. Earlier model verification records describe
their original versions; the new integration is recorded separately.

The mathematical solver retains its audited source identity. The visual wormhole
mapping remains distinct from the local axisymmetric Maxwell/plasma/material solve.

Original GPL-3.0-only license, copyright and third-party notices are retained.
The original console README is `provenance/README-console-original.md`.
''',encoding='utf-8')
(root/'READ ME - Console.txt').write_text('GFM JA21 Console 1.3.0\n\nDouble-click Start GFM Console.cmd.\nRead READ ME - GFM Console.txt for the integrated package.\nThe original blank host documentation is preserved under provenance/.\n',encoding='utf-8')
(root/'GFM/docs/README-standalone-original.txt').write_bytes((root/'GFM/README.txt').read_bytes())
(root/'GFM/README.txt').write_text('GFM 2.1.0 BUNDLED INSIDE JA21\n\nOpen ..\\Start GFM Console.cmd to run this application in the native console.\nThe simulator, controls, audit, equation registry and project records are all\ninside this GFM directory. No local server is needed for the console path.\n\nModel documentation: docs/scientific-specification.txt\nOriginal standalone instructions: docs/README-standalone-original.txt\nCurrent console instructions: ..\\READ ME - GFM Console.txt\n',encoding='utf-8')
print('Recorded JA21 console 1.3.0 with unchanged GFM model 2.1.0.')
