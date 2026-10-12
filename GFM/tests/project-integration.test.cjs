'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {PassThrough}=require('node:stream');
const {once}=require('node:events');
const {createServer}=require('../server.cjs');
const {verifyInstallation}=require('../verify-install.cjs');
const path=require('node:path');

test('project hub and declared verification record are served without exposing machine publication receipts',async()=>{
 const server=createServer({running:false});
 try {
  for(const [url,status] of [['/project.html',200],['/validation/pulse-wormhole-release.json',200],['/validation/desktop-publish.json',404]]){
   const response=new PassThrough(),chunks=[];
   response.writeHead=(code,headers)=>{response.statusCode=code;response.headers=headers;};
   response.setHeader=()=>{};
   response.on('data',chunk=>chunks.push(chunk));
   const finished=once(response,'finish');
   // Exercise the real request handler without binding a local socket.
   server.emit('request',{method:'GET',url,headers:{host:'127.0.0.1:8794'}},response);
   await finished;
   assert.equal(response.statusCode,status,url);
   const body=Buffer.concat(chunks).toString();
   if(url==='/project.html'){assert.match(body,/Open live simulator/);assert.doesNotMatch(body,/href="file:/);}
   if(url==='/validation/pulse-wormhole-release.json')assert.equal(typeof JSON.parse(body),'object');
  }
 } finally {server.emit('close');}
});

test('per-machine desktop publication status is excluded from immutable launch verification',()=>{
 const manifest=require('../release-manifest.json');
 assert.ok(!manifest.files.some(item=>item.path==='validation/desktop-publish.json'));
 assert.equal(verifyInstallation(path.resolve(__dirname,'..')).files,manifest.files.length);
});
