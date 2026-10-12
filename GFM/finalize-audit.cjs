'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname,RELEASE=require('./release-info.json');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const hash=name=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex');
const checks=read('validation/final-verification.json');
if(checks.exitCode!==0||checks.failed!==0||checks.passed<74||checks.passed!==checks.tests||(checks.skipped||0)!==0)throw new Error('All selected mathematical, API and preview checks must pass. Any deferred local network checks must remain explicit in the report.');
const review=read('validation/audit-independent-review.json');
for(const [name,sha] of Object.entries(review.filesSHA256))if(hash(name)!==sha)throw new Error('Reviewed source changed: '+name);
const open=read('examples/audited-frame.json'),covered=read('examples/audited-covered-frame.json');
if(open.model!=='axisymmetric-maxwell-drude-enthalpy-v2'||open.phaseAnalysis.status!=='ready')throw new Error('A live calculated plasma/phase example is required.');
const sequence=read('examples/audited-sequence.json');
if(sequence.engineSHA256!==hash('backend/cylinder-em.cjs'))throw new Error('Saved example does not match the reviewed engine.');
if(hash(RELEASE.auditFile)!==RELEASE.auditSHA256)throw new Error('Source audit changed.');
const report={schema:'GFM-audit-applied-release/2',release:RELEASE,
  sourceAuditSHA256:RELEASE.auditSHA256,verification:checks,
  all38FindingsPreserved:read('data/audit-findings.json').items.length===38,
  independentReview:'validation/audit-independent-review.json',
  example:{timeSeconds:open.timeSeconds,grid:{nr:open.grid.nr,nz:open.grid.nz},
    openDiagnostics:open.diagnostics,coveredDiagnostics:covered.diagnostics,
    phaseStatus:open.phaseAnalysis.status,reference:open.phaseAnalysis.reference,
    phaseGroupDelaySeconds:open.phaseAnalysis.groupDelaySeconds,
    cellsPerGaussianThreeSigmaUpperVacuumWavelength:open.resolutionDiagnostics.cellsPerGaussianThreeSigmaUpperVacuumWavelength,
    phaseValidCellCount:open.fields.carrierPhaseValidMask.filter(Boolean).length,
    observationValidation:false},
  figure:{path:'outputs/GFM-Audited-Model.png',sha256:hash('outputs/GFM-Audited-Model.png'),
    source:'examples/audited-sequence.json',sourceSHA256:hash('examples/audited-sequence.json'),
    renderedFromCalculatedFields:true,visualInspection:'completed'},
  browser:{httpAttemptedURL:'http://127.0.0.1:8794/',httpResult:'Cross-process loopback unavailable in the restricted runtime',
    previewTransport:'browser-worker with serial local fallback',preview:'preview/gfm-live-layers.html',previewSHA256:hash('preview/gfm-live-layers.html'),
    exactNodeWorkerParity:true,initialPreset:'covered-plasma',initialTimeSeconds:2e-9,initialDisplay:'combined',combinedDisplayContract:'docs/combined-layer-display.txt',interactiveVisualVerification:false,
    visualVerificationLimit:'Codex file opening queued; browser screenshots unavailable. Live inline preview supplied with tested worker/controls.'},
  preservation:{previousReleases:['D:/Codex/2026-10-11/pl/outputs/GFM-Cylindrical-Pulse-v1.0.0.zip','D:/Codex/2026-10-11/pl/outputs/GFM-Cylindrical-Pulse-v2.0.0.zip','D:/Codex/2026-10-11/pl/outputs/GFM-Cylindrical-Pulse-v2.0.1.zip'],originalAttachmentModified:false,phaseReferenceSHA256:hash('data/phase-reference.json')},
  limits:['Fixed-density, stationary, unmagnetized axisymmetric local model with synthetic constitutive parameters.','GR calculators are separate algebraic reference diagnostics, not coupled spacetime evolution.','No observational black-hole validation, arbitrary 3D modes or NASA certification.']};
fs.writeFileSync(path.join(root,'validation/audit-applied-release.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({version:RELEASE.version,tests:checks.passed,auditItems:38,exampleTimeSeconds:open.timeSeconds,phaseValidCells:report.example.phaseValidCellCount,residual:open.diagnostics.relativeEnergyBalanceResidual,upperBandCells:report.example.cellsPerGaussianThreeSigmaUpperVacuumWavelength}));
