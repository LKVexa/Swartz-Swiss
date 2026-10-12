'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { createSimulation } = require('./backend/simulation.cjs');
const { createPhysicsService } = require('./backend/physics-service.cjs');
const { createPhaseService } = require('./backend/phase-service.cjs');
const { getReport } = require('./backend/observations.cjs');
const { createHash } = require('node:crypto');
const sourceFiles=['server.cjs','backend/simulation.cjs','backend/relativity.cjs','backend/physics-service.cjs','backend/physics-worker.cjs','backend/phase-service.cjs','backend/phase-mhd.js','backend/phase-session.js','public/phase-worker.js'];
const hashesOnDisk=()=>Object.fromEntries(sourceFiles.map(file=>[file,createHash('sha256').update(fs.readFileSync(path.join(__dirname,file))).digest('hex')]));
// Keep startup identity separate from later disk edits. Worker identity travels with its results.
const startupHashes=hashesOnDisk();
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.txt':'text/plain; charset=utf-8', '.csv':'text/csv; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.pdf':'application/pdf', '.zip':'application/zip' };
function createEventWriter(response, onClose = () => {}) {
  let blocked = false, pending = null, closed = false;
  function close() {
    if (closed) return;
    closed = true; pending = null; response.off('drain', drain); onClose();
  }
  function send(message) {
    if (closed) return;
    // A false write means the buffer is full, not that the client disconnected.
    // Retain only the newest unsent frame; complete history remains in exports.
    if (blocked) { pending = message; return; }
    try { blocked = !response.write(message); } catch { close(); }
  }
  function drain() {
    blocked = false;
    const message = pending; pending = null;
    if (message !== null) send(message);
  }
  response.on('drain', drain); response.on('close', close); response.on('error', close);
  return Object.freeze({ send, end() { close(); response.end(); } });
}
function createServer(options = {}) {
  const simulation = options.simulation ?? createSimulation(), base = options.base ?? __dirname, clients = new Set();
  let timer = null;
  const phase = createPhaseService({enabled:options.phaseEnabled ?? options.autoTick!==false});
  const physics = createPhysicsService({enabled:options.physicsEnabled ?? options.autoTick!==false,onUpdate:()=>queueMicrotask(()=>broadcast(attach(simulation.snapshot())))});
  function attach(state){return {...state,physics:physics.snapshot(),research:{version:'3.0.0',credibility:'Numerical verification and a failed held-out EHT comparison of geometric reference models; local plasma/phase model is not observationally validated',physicalExteriorShared:true}};}
  function broadcast(state){const message='id: '+state.sequence+'\nevent: state\ndata: '+JSON.stringify(state)+'\n\n';for(const writer of clients)writer.send(message);}
  function provenance(){const running=physics.snapshot();return {...startupHashes,'backend/relativity.cjs':running.solverSourceSha256,'backend/physics-worker.cjs':running.workerSourceSha256};}
  const json = (res, status, value) => { res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' }); res.end(JSON.stringify(value)); };
  function safeHost(req) {
    const port = server.address()?.port;
    return typeof req.headers.host === 'string' && ['127.0.0.1:' + port, 'localhost:' + port, '[::1]:' + port].includes(req.headers.host.toLowerCase());
  }
  async function readJSON(req) {
    if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] ?? '')) throw Object.assign(new Error('Use application/json.'), { status: 415 });
    let bytes = 0, chunks = [];
    for await (const chunk of req) { bytes += chunk.length; if (bytes > 4096) throw Object.assign(new Error('Request body exceeds 4096 bytes.'), { status: 413 }); chunks.push(chunk); }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw Object.assign(new Error('Invalid JSON body.'), { status: 400 }); }
  }
  function staticFile(req, res, pathname) {
    let decoded;
    try { decoded = decodeURIComponent(pathname); } catch { return json(res, 400, { error:'Invalid path.' }); }
    const terminal = decoded === '/terminal' || decoded.startsWith('/terminal/');
    const root = path.resolve(base, terminal ? 'vendor/terminal' : 'public');
    const relative = terminal ? decoded.slice('/terminal'.length).replace(/^\//,'') : decoded.replace(/^\//,'');
    const filename = path.resolve(root, relative || 'index.html');
    if (filename !== root && !filename.startsWith(root + path.sep) || relative.includes('\\') || relative.split('/').some(part => part.startsWith('.'))) return json(res, 403, { error:'Path denied.' });
    let real;
    try { real = fs.realpathSync(filename); if (!real.startsWith(root + path.sep) || !fs.statSync(real).isFile()) return json(res,403,{error:'Path denied.'}); } catch { return json(res,404,{error:'File not found.'}); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(real).toLowerCase()] ?? 'application/octet-stream', 'X-Content-Type-Options':'nosniff', 'Cache-Control':'no-cache' });
    if (req.method === 'HEAD') return res.end();
    const stream = fs.createReadStream(real); stream.on('error', () => res.destroy()); stream.pipe(res);
  }
  const server = http.createServer(async (req, res) => {
    if (!safeHost(req)) return json(res,403,{error:'Only the local service hostname is accepted.'});
    let pathname;
    try { pathname = new URL(req.url, 'http://' + req.headers.host).pathname; } catch { return json(res,400,{error:'Invalid URL.'}); }
    if (req.method === 'POST') {
      if (req.headers.origin && req.headers.origin !== 'http://' + req.headers.host) return json(res,403,{error:'Cross-origin writes are denied.'});
      if (req.headers['sec-fetch-site'] && !['same-origin','none'].includes(req.headers['sec-fetch-site'])) return json(res,403,{error:'Cross-site writes are denied.'});
      if (!['/api/parameters','/api/control','/api/physics','/api/phase/parameters','/api/phase/control'].includes(pathname)) return json(res,404,{error:'Unknown API.'});
      try {
        const body = await readJSON(req);
        if(pathname==='/api/phase/parameters')return json(res,200,await phase.command('parameters',{parameters:body}));
        if(pathname==='/api/phase/control'){
          if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).join(',')!=='action')throw new Error('Control body contains only action.');
          return json(res,200,await phase.command('control',{action:body.action}));
        }
        if (pathname === '/api/physics') return json(res,200,{physics:physics.configure(body)});
        if (pathname === '/api/parameters') return json(res,200,attach(simulation.setParameters(body)));
        if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).join(',') !== 'action') throw new Error('Control body contains only action.');
        return json(res,200,attach(simulation.control(body.action)));
      } catch (error) { return json(res,error.status ?? 400,{error:error.message}); }
    }
    if (!['GET','HEAD'].includes(req.method)) { res.setHeader('Allow','GET, HEAD, POST'); return json(res,405,{error:'Method not allowed.'}); }
    if (pathname === '/api/health') return json(res,200,{ok:true,product:'GFM Phase Texture Simulator',version:'3.0.0',phaseSchema:'GFM-Phase-MHD-frame/1',backend:'RUSSL GFM Terminal 0.5.1 calculation modules',schema:'GFM-Aperture-Aggie-frame/1',streamHz:10,phaseComputeHz:5});
    if (pathname === '/api/state') return json(res,200,attach(simulation.snapshot()));
    if (pathname === '/api/physics') return json(res,200,physics.snapshot());
    if (pathname === '/api/phase') return json(res,200,phase.snapshot());
    if (pathname === '/api/observations') return json(res,200,getReport());
    if (pathname === '/api/phase/export.json') {res.setHeader('Content-Disposition','attachment; filename="GFM-phase-fields.json"');return json(res,200,{schema:'GFM-phase-export/1',frame:await phase.command('snapshot'),observations:getReport().provenance,software:provenance()});}
    if (pathname === '/api/provenance') {const sha256={...provenance(),...phase.snapshot().software},onDiskSha256=hashesOnDisk();return json(res,200,{version:'3.0.0',sha256,onDiskSha256,runningMatchesDisk:Object.keys(onDiskSha256).every(file=>sha256[file]===onDiskSha256[file]),scope:'sha256 identifies loaded backend code; onDiskSha256 identifies current files. Restart after source changes.',gfm:'SOURCE_PROVENANCE.json'});}
    if (pathname === '/api/physics-export.json') {res.setHeader('Content-Disposition','attachment; filename="GFM-Kerr-geodesics.json"');return json(res,200,{...physics.exportData(),software:provenance()});}
    if (pathname === '/api/export.json') { res.setHeader('Content-Disposition','attachment; filename="GFM-Aperture-Aggie-recording.json"'); return json(res,200,{...simulation.exportData(),physics:physics.exportData(),software:provenance()}); }
    if (pathname === '/api/export.csv') { res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="GFM-Aperture-Aggie-history.csv"','Cache-Control':'no-store'}); return res.end(simulation.exportCSV()); }
    if (pathname === '/api/events') {
      if (req.method === 'HEAD') return json(res,405,{error:'SSE requires GET.'});
      if (clients.size >= 32) return json(res,503,{error:'Too many event clients.'});
      res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-store','Connection':'keep-alive','X-Accel-Buffering':'no'}); res.flushHeaders();
      const writer = createEventWriter(res, () => clients.delete(writer)); clients.add(writer);
      writer.send('event: state\ndata: ' + JSON.stringify(attach(simulation.snapshot())) + '\n\n'); return;
    }
    if (pathname.startsWith('/api/')) return json(res,404,{error:'Unknown API.'});
    return staticFile(req,res,pathname);
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  const unsubscribe = simulation.subscribe(state => {
    physics.request(state.parameters.spin);broadcast(attach(state));
  });
  server.on('listening', () => { if (options.autoTick !== false) { timer = setInterval(() => simulation.tick(.1),100); timer.unref(); } });
  server.on('close', () => { if (timer) clearInterval(timer); unsubscribe(); physics.close(); phase.close(); for (const writer of clients) writer.end(); clients.clear(); });
  server.closeSimulation = async () => { if (timer) clearInterval(timer); await Promise.all([physics.close(),phase.close()]); for (const writer of clients) writer.end(); clients.clear(); return new Promise((resolve,reject) => server.close(error => error ? reject(error) : resolve())); };
  server.simulation = simulation;
  server.physics = physics;
  server.phase = phase;
  return server;
}
if (require.main === module) {
  const port = Number(process.env.PORT ?? 8787);
  if (!Number.isInteger(port) || port < 1 || port > 65535) { process.stderr.write('PORT must be an integer in 1..65535.\n'); process.exit(1); }
  const server = createServer();
  server.on('error', error => { process.stderr.write(error.code === 'EADDRINUSE' ? 'Port ' + port + ' is in use. Close the previous simulation or set PORT to another local port.\n' : error.message + '\n'); process.exitCode = 1; });
  server.listen(port,'127.0.0.1', () => process.stdout.write('GFM aperture/aggie simulation: http://127.0.0.1:' + port + '/\n'));
  for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => server.closeSimulation().then(() => process.exit(0)));
}
module.exports = { createServer, createEventWriter };
