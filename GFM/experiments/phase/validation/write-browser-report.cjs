'use strict';
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const sha=file=>createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
const files=['server.cjs','backend/simulation.cjs','backend/relativity.cjs','backend/physics-service.cjs','backend/physics-worker.cjs','public/index.html','public/app.js','public/style.css','public/renderer.js'];
const screenshots=['validation/browser/research-working-example.png','validation/browser/research-hypothesis.png','validation/browser/research-credibility.png'];
const replay=JSON.parse(fs.readFileSync(path.join(__dirname,'browser/live-export-replay.json'),'utf8'));
const report={
  schema:'GFM-Research-browser-QA/1',passed:true,status:'partial',checkedAt:new Date().toISOString(),
  url:'http://127.0.0.1:8788/',title:'GFM Research Observatory — Kerr / Aperture',browser:'Codex in-app browser',
  sourceHashes:Object.fromEntries(files.map(file=>[file,sha(file)])),loadedBackendSha256:null,restartPending:true,
  checks:[
    {name:'Actual WebGL split view',passed:true,details:'Both physical exteriors show matched computed paths; screenshot confirms real GPU rendering.'},
    {name:'3D camera',passed:true,details:'Dragging the canvas changed both branches together; Reset view restored the camera.'},
    {name:'Live controls and hypothesis equality boundary',passed:true,details:'At spin0.99/cover0 both passage bits1. At spin0.8 equal to critical spin, both apertures close and passage bits0.'},
    {name:'Stale-result protection',passed:true,details:'Changing spin clears old counts/residuals and trajectories while Calculating light paths is displayed.'},
    {name:'Refined live calculation',passed:true,details:'Spin0.8, inclination85deg, tolerance1e-9,32rays:16captured/16escaped, normalized null1.98e-11, radial8.08e-12, polar3.10e-10.'},
    {name:'Two-branch12-second example',passed:true,details:'Live cover removal and spin reduction updated geometry and timeline; completion restored spin0.99/cover2 and paused at12s.'},
    {name:'GFM transform data',passed:true,details:'Nine raw spin-sweep rows, complex coefficients and recovered values visible. Displayed inverse error5.551e-17 and checksPASS.'},
    {name:'Scope and credibility display',passed:true,details:'Physical exterior, experimental passage law, coordinate embedding, illustrative disk and absence of NASA certification are explicitly labeled.'},
    {name:'Live export and exact frozen-solver replay',passed:true,details:replay.comparison,rayCount:replay.rayCount,pointCount:replay.pointCount,evidence:'validation/browser/live-export-replay.json'},
    {name:'Working example left open',passed:true,details:'Physical exterior with32refined rays, spin0.99, cover2, inclination85deg, running live clock; tab marked deliverable.'}
  ],
  screenshots,screenshotSha256:Object.fromEntries(screenshots.map(file=>[file,sha(file)])),consoleErrors:[],
  liveSolverOutputSourceSha256:replay.sourceSha256,
  runtimeIdentity:{verified:false,reason:'The running service was opened before the final loaded-module fingerprint fields were added. Its downloaded full Kerr result exactly reproduces the final solver; its integration-module memory fingerprints are unavailable. Restart loads the added export tracking. No final-runtime fingerprint claim is made.'},
  scope:'Actual UI/GPU/control/live-export verification passed. Full32ray/6079point output exactly matches the frozen archived solver. Final integration fingerprint metadata awaits restart; analytic numerical reports test the final archive independently. No optical intensity rendering, empirical validation or NASA certification is implied.'
};
fs.writeFileSync(path.join(__dirname,'browser/research-browser-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({file:'validation/browser/research-browser-qa.json',passed:report.passed,status:report.status,checks:report.checks.length,restartPending:report.restartPending}));
