'use strict';
const net = require('node:net');
const {createServer} = require('./server.cjs');
async function available(port){return new Promise((resolve,reject)=>{const probe=net.createServer();probe.once('error',error=>error.code==='EADDRINUSE'?resolve(false):reject(error));probe.listen(port,'127.0.0.1',()=>probe.close(()=>resolve(true)));});}
(async()=>{
  const requested=Number(process.env.PORT||8787);
  if(!Number.isInteger(requested)||requested<1||requested>65535)throw new Error('PORT must be in 1..65535.');
  let port=requested;
  while(!await available(port)){port++;if(port>Math.min(requested+10,65535))throw new Error('No free local port found. Set PORT to a free port and try again.');}
  const server=createServer();
  server.on('error',error=>{console.error(error.message);process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>{
    server.simulation.control('play');
    console.log('\nGFM Research Observatory — computed Kerr light paths\n');
    console.log('Open this address in your browser: http://127.0.0.1:'+port+'/');
    console.log('The phase fields start automatically in the viewer. Use field controls and inspect individual cells.');
    console.log('The 3D Kerr / aperture references and held-out observation report are below the field lab.');
    console.log('Leave this window running. Press Ctrl+C to stop the backend.\n');
  });
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.closeSimulation().then(()=>process.exit(0)));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
