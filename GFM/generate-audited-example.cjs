'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {createModel}=require('./backend/cylinder-em.cjs');
const {presetParameters}=require('./backend/research-presets.cjs');
const RELEASE=require('./release-info.json');
const root=__dirname;
const engineSHA256=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'backend/cylinder-em.cjs'))).digest('hex');
const write=(name,data)=>fs.writeFileSync(path.join(root,'examples',name),JSON.stringify(data)+'\n');
const model=createModel(presetParameters('plasma-pulse')),frames=[];
for(let k=0;k<=20;k++){
  if(k)model.step(1e-10);
  frames.push(model.snapshot());
}
write('audited-sequence.json',{schema:'GFM-audited-local-sequence/2',release:RELEASE,engineSHA256,
  sampleIntervalSeconds:1e-10,description:'Controlled axisymmetric pulse/plasma/material example. Envelope history is sampled inside the integrator, independently of these output intervals.',frames});
const open=model.snapshot({includeStaggered:true});
write('audited-frame.json',open);
const cover=createModel(presetParameters('covered-plasma'));
for(let k=0;k<20;k++)cover.step(1e-10);
const covered=cover.snapshot({includeStaggered:true});
write('audited-covered-frame.json',covered);
write('audited-cover-comparison.json',{schema:'GFM-audited-cover-comparison/2',engineSHA256,release:RELEASE,
  scope:'Matched source and constitutive parameters, 20 intervals of 100 ps. Cover fraction alone differs. Stored energy and signed work are recorded; no absorptance or passage inference.',
  open:{parameters:open.parameters,timeSeconds:open.timeSeconds,diagnostics:open.diagnostics},
  covered:{parameters:covered.parameters,timeSeconds:covered.timeSeconds,diagnostics:covered.diagnostics}});
const hot=createModel(presetParameters('hot-cover'));
write('audited-hot-cover-initial.json',hot.snapshot());
console.log(JSON.stringify({version:RELEASE.version,frames:frames.length,engineSHA256,timeSeconds:open.timeSeconds,phaseAnalysis:open.phaseAnalysis,diagnostics:open.diagnostics}));
