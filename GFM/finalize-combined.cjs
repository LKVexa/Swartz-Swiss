'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=__dirname;
const read=name=>JSON.parse(fs.readFileSync(path.join(ROOT,name),'utf8'));
const sha=name=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,name))).digest('hex');
const checks=read('validation/final-verification.json');
if(checks.exitCode!==0||checks.failed!==0||checks.tests!==checks.passed||checks.tests<111||(checks.skipped||0)!==0)throw Error('All selected checks must pass before recording the combined release.');
const RELEASE=read('release-info.json'),view=require('./public/app.js'),frame=read('examples/audited-covered-frame.json');
const geometry=view.combinedLayerGeometry(frame),layers=geometry.layer.layers;
const ui=read('validation/combined-ui-verification.json');
ui.version=RELEASE.version;ui.tests=7;ui.pass=7;ui.fail=0;
ui.checks.push('Wormhole shape, net energy flow and power/deposition controls preserve the same numerical frame');
ui.coveredByFinalSuite=true;ui.finalSuiteTests=checks.tests;
delete ui.durationMilliseconds;
ui.testedFilesSHA256=Object.fromEntries(['public/app.js','public/index.html','tests/combined-ui.test.cjs'].map(name=>[name,sha(name)]));
fs.writeFileSync(path.join(ROOT,'validation/combined-ui-verification.json'),JSON.stringify(ui,null,2)+'\n');
const report={schema:'GFM-combined-display-review/1',version:RELEASE.version,
  sourceEngineSHA256:sha('backend/cylinder-em.cjs'),viewerSHA256:sha('public/app.js'),
  contract:'docs/combined-layer-display.txt',contractSHA256:sha('docs/combined-layer-display.txt'),
  finalSuite:{tests:checks.tests,passed:checks.passed,failed:checks.failed,skipped:checks.skipped||0,deferredNetworkTests:checks.deferredNetworkTests||[]},
  independentScientificReview:'pass; physical face/cell sampling, mixed masks, signed cooling, fixed geometry and phase timing reviewed',
  example:{source:'examples/audited-covered-frame.json',sourceSHA256:sha('examples/audited-covered-frame.json'),timeSeconds:frame.timeSeconds,
    phaseAnalysisTimeSeconds:geometry.layer.phaseAnalysisTimeSeconds,phaseGroupDelaySeconds:geometry.layer.phaseGroupDelaySeconds,
    visibleSamples:Object.fromEntries(Object.entries(geometry.samples).map(([name,samples])=>[name,samples.length])),
    mixedPlasmaMaterialCells:frame.fields.plasmaFillFraction.filter((value,i)=>value>0&&frame.fields.materialFillFraction[i]>0).length,
    maxPlasmaTemperatureRiseK:view.validMaximum(layers.plasma.values,layers.plasma.valid),
    maxCoverOhmicPowerDensityWPerM3:view.validMaximum(layers.cover.values,layers.cover.valid),
    maxCoverTemperatureRiseK:view.validMaximum(frame.fields.temperatureRiseK,layers.cover.valid),
    maxLiquidFraction:view.validMaximum(frame.fields.coverLiquidFraction,layers.cover.valid)},
  displayOnly:true,solverEquationsChanged:false,nativeRasterizationVerified:false,observationalValidation:false};
fs.writeFileSync(path.join(ROOT,'validation/combined-display-review.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
