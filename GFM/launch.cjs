'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {execFile}=require('node:child_process');
const {createServer}=require('./server.cjs');
const {verifyInstallation}=require('./verify-install.cjs');
const RELEASE=require('./release-info.json');

async function listen(server,port){
 return new Promise((resolve,reject)=>{
  const failed=error=>{server.removeListener('listening',ready);reject(error);};
  const ready=()=>{server.removeListener('error',failed);resolve(port);};
  server.once('error',failed);server.once('listening',ready);server.listen(port,'127.0.0.1');
 });
}
async function launch(options={}){
 const receipt=verifyInstallation(__dirname);
 const first=options.port??8794;
 if(!Number.isInteger(first)||first<1024||first>65525)throw new Error('Choose a local starting port from 1024 to 65525.');
 const server=createServer({running:true});
 let port;
 try{
  for(let offset=0;offset<10;offset++){
   try{port=await listen(server,first+offset);break;}
   catch(error){if(error.code!=='EADDRINUSE')throw error;}
  }
  if(port===undefined)throw new Error('All ten local ports are occupied. Close this experiment’s previous window or choose another starting port.');
 }catch(error){server.close();throw error;}
 const url=`http://127.0.0.1:${port}/`;
 console.log(`${RELEASE.product} v${RELEASE.version}\n\nProject: ${__dirname}\nOpen this address: ${url}\n\n01: calculated electromagnetic pulse, plasma and material layers\n02: original neutral complex phase reference\n03: audited spacetime references and equation dispositions\n\nThe calculation is running. Leave this window open. Ctrl+C stops it.\nVerified ${receipt.files} packaged files; longest path ${receipt.longestPathCharacters} characters.`);
 if(options.openBrowser!==false&&process.platform==='win32'){
  // The URL is constructed solely from the validated numeric port above.
  execFile('cmd.exe',['/d','/s','/c',`start "" "${url}"`],{windowsHide:true},error=>{
   if(error)console.error(`Windows could not open its default browser: ${error.message}\nThe server is still running; use the printed address.`);
  });
 }
 return {server,port,url,receipt};
}
if(require.main===module){
 launch({port:process.env.GFM_PORT?Number(process.env.GFM_PORT):8794,openBrowser:!process.argv.includes('--no-browser')})
 .then(({server})=>{
  const stop=()=>server.close(()=>process.exit(0));process.on('SIGINT',stop);process.on('SIGTERM',stop);
 }).catch(error=>{console.error(`Startup could not complete: ${error.message}`);process.exitCode=1;});
}
module.exports={launch};
