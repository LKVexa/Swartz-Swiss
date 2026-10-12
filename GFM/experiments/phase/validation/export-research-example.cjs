'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const R=require('../backend/relativity.cjs');
const inputs={spin:.99,observerRadius:20,inclination:Math.PI/3,rayCount:16,tolerance:1e-7};
const result=R.computeBundle(inputs);
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'..',file))).digest('hex');
const example={schema:'GFM-Kerr-reproducible-example/1',inputs,result,software:{'backend/relativity.cjs':hash('backend/relativity.cjs')},scopes:{physical:'Neutral vacuum Kerr exterior light paths; G=c=M=1',hypothesis:'Aperture/cover law is independent; no material cover affects this metric',view:'Oblate coordinate embedding, not proper distance; emission is illustrative'}};
fs.writeFileSync(path.join(__dirname,'../examples/kerr-default.json'),JSON.stringify(example,null,2)+'\n');
console.log(JSON.stringify({file:'examples/kerr-default.json',captured:result.diagnostics.captured,escaped:result.diagnostics.escaped,normalizedNullError:result.diagnostics.maxNormalizedNullResidual,solver:example.software},null,2));
