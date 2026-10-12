'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const bridge = require('../../src/workbench-bridge.js');
const project = path.resolve(__dirname, '../..');

// Isolated DOM surface for app command/UI integration, not browser scheduling.
// Every computation uses production modules; every envelope uses Web Crypto.
function fixture() {
  const nodes = new Map(), downloads = [], blobs = new Map(), timers = new Map();
  let timerId = 0, messageListener, objectId = 0;
  class Node {
    constructor(tag = 'div', id = '') {
      this.tagName = tag; this.id = id; this.children = []; this.events = new Map();
      this.attributes = {}; this.style = {}; this.dataset = {}; this.value = '';
      this.textContent = ''; this.className = ''; this.disabled = false;
      this.classList = { toggle: (name, active) => {
        const classes = new Set(this.className.split(/\s+/).filter(Boolean));
        if (active === undefined ? !classes.has(name) : active) classes.add(name); else classes.delete(name);
        this.className = [...classes].join(' ');
      } };
    }
    append(...children) { for (const child of children) { child.parent = this; this.children.push(child); } }
    replaceChildren(...children) { this.children.forEach(child => { child.parent = null; }); this.children = []; this.append(...children); }
    get childElementCount() { return this.children.length; }
    get firstElementChild() { return this.children[0]; }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); this.parent = null; }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    getAttribute(key) { return this.attributes[key] ?? (key === 'src' ? this.src : null); }
    addEventListener(type, callback) { if (!this.events.has(type)) this.events.set(type, []); this.events.get(type).push(callback); }
    emit(type, event = {}) { return Promise.all((this.events.get(type) || []).map(callback => callback(event))); }
    focus() { this.focused = true; }
    click() { if (this.tagName === 'a') downloads.push({ name: this.download, blob: blobs.get(this.href) }); else void this.emit('click'); }
  }
  function getNode(id) { if (!nodes.has(id)) nodes.set(id, new Node('div', id)); return nodes.get(id); }
  function descendants(root) { return root.children.flatMap(child => [child, ...descendants(child)]); }
  function matches(node, selector) {
    if (selector.startsWith('.')) return node.className.split(/\s+/).includes(selector.slice(1));
    if (selector.startsWith('#')) return node.id === selector.slice(1);
    return node.tagName === selector;
  }
  function querySelectorAll(query) {
    const connected = [...new Set([...nodes.values()].flatMap(root => [root, ...descendants(root)]))];
    return connected.filter(node => query.split(',').some(selector => {
      const terms = selector.trim().split(/\s+/);
      if (!matches(node, terms.at(-1))) return false;
      let ancestor = node.parent;
      for (let i = terms.length - 2; i >= 0; i--) {
        while (ancestor && !matches(ancestor, terms[i])) ancestor = ancestor.parent;
        if (!ancestor) return false;
        ancestor = ancestor.parent;
      }
      return true;
    }));
  }
  const tabs = getNode('fixture-return-tabs'); tabs.className = 'return-tabs';
  for (const value of ['summary', 'details', 'raw']) { const tab = new Node('button'); tab.dataset.result = value; tabs.append(tab); }
  const workspaceTabs = getNode('fixture-workspace-tabs');
  for (const value of ['terminal', 'workbench', 'evidence', 'architecture', 'equations', 'gfm', 'horizon']) { const tab = new Node('button'); tab.className = 'workspace-tab'; tab.dataset.view = value; workspaceTabs.append(tab); }
  getNode('equation-filter').value = 'all';
  const workbench = getNode('workbench-frame');
  workbench.dataset.src = 'reference/workbench.html';
  workbench.contentWindow = {
    postMessage(raw) {
      const request = JSON.parse(JSON.stringify(raw));
      if (request.kind === 'hello') return;
      bridge.validateRequest(request);
      const value = request.method === 'snapshot'
        ? { schema: 'RUSSL-research-slice/1', manifest: {}, pixelPayloadHex: '0001' }
        : { schema: 'RUSSL-research-result/1', field: 'GF(2^80)', valid: true };
      const reply = bridge.validateReply({ protocol: bridge.protocol, id: request.id, ok: true, value }, request.method);
      queueMicrotask(() => messageListener({ source: workbench.contentWindow, data: reply }));
    }
  };
  const context = vm.createContext({
    document: { getElementById: getNode, createElement: tag => new Node(tag), querySelectorAll },
    window: { addEventListener(type, callback) { if (type === 'message') messageListener = callback; }, open() {} },
    addEventListener(type, callback) { if (type === 'message') messageListener = callback; },
    RusslConfig: { sources: [{ role: 'SOURCE', title: 'Fixture source', scope: 'Data only', sha256: '0'.repeat(64), path: 'reference/source.txt' }] },
    TextEncoder, Blob, crypto: webcrypto, performance,
    URL: { createObjectURL(blob) { const url = `blob:fixture-${++objectId}`; blobs.set(url, blob); return url; }, revokeObjectURL() {} },
    setTimeout(callback, delay) { const id = ++timerId; if (delay === 20) queueMicrotask(callback); else timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); }, console
  });
  vm.runInContext(fs.readFileSync(path.join(project, 'src/startup.js'), 'utf8'), context, { filename: 'startup.js' });
  for (const name of ['engine.js', 'refined-field.js', 'refined-scalar.js', 'gfm-matrix.js', 'gfm-exact.js', 'gfm-models.js', 'horizon-gr.js', 'horizon-scenario.js', 'horizon-models.js']) vm.runInContext(fs.readFileSync(path.join(project, 'src', name), 'utf8'), context, { filename: name });
  vm.runInContext('globalThis.RusslEquationRegistry=' + fs.readFileSync(path.join(project, 'equation-audit.json'), 'utf8') + ';', context, { filename: 'equation-audit.json' });
  vm.runInContext('globalThis.RusslImageRegistry=' + fs.readFileSync(path.join(project, 'image-equations.json'), 'utf8') + ';', context, { filename: 'image-equations.json' });
  vm.runInContext('globalThis.RusslReapplication=' + fs.readFileSync(path.join(project, 'gfm-reapplication.json'), 'utf8') + ';', context, { filename: 'gfm-reapplication.json' });
  vm.runInContext('globalThis.RusslHorizonRegistry=' + fs.readFileSync(path.join(project, 'horizon-equations.json'), 'utf8') + ';', context, { filename: 'horizon-equations.json' });
  vm.runInContext('globalThis.RusslHorizonData=' + fs.readFileSync(path.join(project, 'horizon-reapplication.json'), 'utf8') + ';', context, { filename: 'horizon-reapplication.json' });
  vm.runInContext(fs.readFileSync(path.join(project, 'src/gfm-mechanics.js'), 'utf8'), context, { filename: 'gfm-mechanics.js' });
  vm.runInContext(fs.readFileSync(path.join(project, 'src/app.js'), 'utf8'), context, { filename: 'app.js' });
  function plain(value) { return JSON.parse(JSON.stringify(value)); }
  async function settled() {
    const deadline = Date.now() + 3000;
    while (getNode('import-session').disabled) {
      if (Date.now() > deadline) throw Error('App operation did not settle');
      await new Promise(resolve => setImmediate(resolve));
    }
  }
  return {
    app: context.RusslTerminal, engine: context.RusslEngine, field: context.RusslRefinedField, scalar: context.RusslRefinedScalar,
    matrix: context.RusslGFMMatrix, exact: context.RusslGFMExact, models: context.RusslGFMModels,
    horizonGR: context.RusslHorizonGR, scenario: context.RusslHorizonScenario, horizon: context.RusslHorizonModels,
    mechanics: context.RusslGFMMechanics,
    horizonRegistry: plain(context.RusslHorizonRegistry), horizonData: plain(context.RusslHorizonData),
    images: plain(context.RusslImageRegistry), reapplication: plain(context.RusslReapplication),
    registry: plain(context.RusslEquationRegistry), node: getNode, query: querySelectorAll, descendants, plain, downloads, settled,
    ready() { messageListener({ source: workbench.contentWindow, data: { protocol: bridge.protocol, kind: 'ready' } }); },
    async exported(command = 'session.export') {
      const result = await context.RusslTerminal.run(command);
      assert.equal(result.ok, true, result.summary);
      const saved = downloads.at(-1);
      assert.ok(saved && saved.blob, 'Export must trigger a JSON download');
      return JSON.parse(await saved.blob.text());
    },
    async import(packet) {
      const text = JSON.stringify(packet);
      getNode('session-file').files = [{ size: new TextEncoder().encode(text).length, text: async () => text }];
      await getNode('session-file').emit('change');
      await settled();
    }
  };
}

module.exports = { fixture, project };
