'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname,read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
const checks=read('validation/final-verification.json'),release=read('release-info.json');
if(checks.exitCode!==0||checks.failed!==0||checks.passed!==checks.tests)throw Error('All selected checks must pass.');
const frame=read('examples/audited-covered-frame.json'),view=require('./public/app.js');
const diagnostics=require('./backend/pulse-diagnostics.cjs').computePulseDiagnostics(frame);
const options={presentationShape:'wormhole',showEnergyFlow:true,absorptionLayer:'plasma-power',coverResponseLayer:'cover-heating',scales:{fluxWPerM2:20,plasmaPowerWPerM3:20,coverHeatingWPerM3:100}};
const scene=view.combinedLayerGeometry(frame,options);
const report={schema:'GFM-pulse-wormhole-display/1',version:release.version,date:release.date,
 testedFilesSHA256:Object.fromEntries(['backend/cylinder-em.cjs','backend/pulse-diagnostics.cjs','public/app.js','public/pulse-diagnostics.js','tests/pulse-wormhole-view.test.cjs','tests/combined-ui.test.cjs'].map(file=>[file,sha(file)])),
 tests:{selected:checks.tests,passed:checks.passed,failed:checks.failed,mode:checks.verificationMode,deferredLocalConnectionChecks:checks.deferredNetworkTests},
 example:{timeSeconds:frame.timeSeconds,display:options,phaseAnalysisTimeSeconds:scene.layer.phaseAnalysisTimeSeconds,forwardNetFlowGlyphs:scene.energyFlow.samples.filter(sample=>sample.axialFluxWPerM2>0).length,returningNetFlowGlyphs:scene.energyFlow.samples.filter(sample=>sample.axialFluxWPerM2<0).length,vacuumPort:diagnostics.vacuumPort,energy:diagnostics.energy},
 scientificReview:'Independent pure diagnostics tests pass; display preserves raw scalars, maps vector tangents with its Jacobian, distinguishes current powers from cumulative heat, includes initial stored energy and guards degenerate geometry.',
 originalSolverEquationsChanged:false,shapeRole:'Visual coordinate remapping of the solved cylinder; no GR or traversal claim',nativeRasterizationVerified:false,networkRequiredForPreview:false};
fs.writeFileSync(path.join(root,'validation/pulse-wormhole-release.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({version:release.version,selectedChecks:checks.tests,passed:checks.passed,deferredLocalConnectionChecks:checks.deferredNetworkTests.length,forwardGlyphs:report.example.forwardNetFlowGlyphs,returningGlyphs:report.example.returningNetFlowGlyphs,engineSHA256:sha('backend/cylinder-em.cjs')}));
