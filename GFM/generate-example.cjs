'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {createModel}=require('./backend/cylinder-em.cjs');
const out=path.join(__dirname,'examples');fs.mkdirSync(out,{recursive:true});
const model=createModel(),frames=[];
for(let k=0;k<=50;k++){
 if(k)model.step(4e-11);
 const f=model.snapshot();
 frames.push(f);
}
const engineSHA256=crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'backend/cylinder-em.cjs'))).digest('hex');
fs.writeFileSync(path.join(out,'sequence.json'),JSON.stringify({schema:'GFM-cylinder-example-sequence/1',engineSHA256,scope:'Computed axisymmetric Maxwell/Ohmic fields; forty-picosecond output spacing',frames}));
const first=model.snapshot({includeStaggered:true});
fs.writeFileSync(path.join(out,'computed-frame.json'),JSON.stringify(first,null,2)+'\n');
const covered=createModel({coverFraction:1});for(let k=0;k<50;k++)covered.step(4e-11);
fs.writeFileSync(path.join(out,'covered-frame.json'),JSON.stringify(covered.snapshot({includeStaggered:true}),null,2)+'\n');
const coverSnapshot=covered.snapshot();
fs.writeFileSync(path.join(out,'cover-comparison.json'),JSON.stringify({schema:'GFM-cover-comparison/1',engineSHA256,
 scope:'Matched 50 advances of 40 ps; only cover fraction differs. Generic finite-volume Ohmic matter, not a horizon or measured metal.',
 open:{coverFraction:0,timeSeconds:first.timeSeconds,diagnostics:first.diagnostics},
 covered:{coverFraction:1,timeSeconds:coverSnapshot.timeSeconds,diagnostics:coverSnapshot.diagnostics}},null,2)+'\n');
console.log(JSON.stringify({frames:frames.length,endTimeSeconds:first.timeSeconds,engineSHA256,diagnostics:first.diagnostics}));
