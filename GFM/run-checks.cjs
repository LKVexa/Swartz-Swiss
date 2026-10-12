'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const root=__dirname;
const offline=process.argv.includes('--offline');
const deferredNetworkTests=offline?['audit provenance, all findings and corrected GR references reach the live API without changing physical state','research presets reset history and export causal plasma/material fields through the same backend','launcher recovers from an occupied port and starts the new computed backend','local API produces computed fields, controls state, and retains valid state after rejected input']:[];
const files=[
 'tests/cylinder-em.test.cjs','tests/independent-em-validation.cjs',
 'tests/audit-physics.test.cjs','tests/plasma-mode-validation.cjs','tests/gr-reference.test.cjs','tests/audit-api.test.cjs',
 'tests/view-mapping.test.cjs','tests/combined-layers.test.cjs','tests/pulse-diagnostics.test.cjs','tests/pulse-wormhole-view.test.cjs','tests/combined-ui.test.cjs','tests/browser-backend.test.cjs','tests/preview-build.test.cjs',
 'tests/performance-pacing.test.cjs','tests/project-integration.test.cjs','tests/server-scheduler.test.cjs','tests/server.test.cjs','tests/launcher.test.cjs'];
const excluded=new Set(['tests/audit-api.test.cjs','tests/server.test.cjs','tests/launcher.test.cjs']);
const execute=args=>spawnSync(process.execPath,['--test','--test-concurrency=1',...args],{cwd:root,encoding:'utf8',maxBuffer:4*1024*1024});
const results=[execute(offline?files.filter(file=>!excluded.has(file)):files)];
if(offline)results.push(execute(['--test-name-pattern=preserved audit source|Windows packaging handles','tests/audit-api.test.cjs','tests/launcher.test.cjs']));
const logs=results.map(result=>(result.stdout||'')+(result.stderr||''));
const log=logs.join('\n');
const exitCode=results.some(result=>result.status!==0)?1:0;
process.stdout.write(log);
// Save only after tests finish: launcher integrity checks must see stable files.
fs.writeFileSync(path.join(root,'validation/all-tests.txt'),log);
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
const number=(name,output)=>Number(output.match(new RegExp('(?:^|\\n).*?'+name+' (\\d+)(?:\\r?\\n|$)'))?.[1]??NaN);
const sum=name=>logs.reduce((total,output)=>total+number(name,output),0);
const report={date:require('./release-info.json').date,version:require('./release-info.json').version,exitCode,tests:sum('tests'),passed:sum('pass'),failed:sum('fail'),
 skipped:sum('skipped'),verificationMode:offline?'offline; four local connection checks excluded; file provenance and Windows path checks executed separately':'complete including local connections',deferredNetworkTests,
 testRuns:logs.map((output,index)=>({scope:offline?(index===0?'Math, browser worker and viewer':'File provenance and Windows path fixtures'):'Complete',tests:number('tests',output),passed:number('pass',output),failed:number('fail',output)})),
 engineSHA256:hash('backend/cylinder-em.cjs'),phaseReferenceSHA256:hash('data/phase-reference.json'),
 scope:'Reduced Maxwell/Drude/material equations, analytic convergence, audited GR references, exact browser-worker/Node numerical parity, combined physical layer mapping and live UI/WebGL submission flows, preview transport, serial scheduling, HTTP controls, launcher and Windows integrity checks.',
 browserVisualVerification:'Live self-contained Codex preview supplied; HTTP browser opening blocked by cross-process loopback denial. Worker numerical and transport behavior verified independently of network.',
 observationValidation:false,fullAzimuthallyGeneral3D:false};
fs.writeFileSync(path.join(root,'validation/final-verification.json'),JSON.stringify(report,null,2)+'\n');
for(const result of results)if(result.error)console.error(result.error.message);
process.exitCode=exitCode;
