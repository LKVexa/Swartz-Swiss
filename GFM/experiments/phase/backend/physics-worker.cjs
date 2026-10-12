'use strict';
const {parentPort}=require('node:worker_threads');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const sourceHash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const solverSourceSha256=sourceHash(path.join(__dirname,'relativity.cjs'));
const workerSourceSha256=sourceHash(__filename);
const {computeBundle}=require('./relativity.cjs');
parentPort.on('message',job=>{
  try {
    const start=performance.now();
    const result=computeBundle(job.inputs);
    parentPort.postMessage({key:job.key,result,milliseconds:performance.now()-start,solverSourceSha256,workerSourceSha256});
  } catch(error) {parentPort.postMessage({key:job.key,error:error.message});}
});
