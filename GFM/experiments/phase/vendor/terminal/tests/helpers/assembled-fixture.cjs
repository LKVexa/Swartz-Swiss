'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const project = path.resolve(__dirname, '../..');
const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', ndash: '–', mdash: '—' };
const decode = value => value.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (whole, code) => {
  if (code[0] === '#') { const n = parseInt(code.slice(code[1].toLowerCase() === 'x' ? 2 : 1), code[1].toLowerCase() === 'x' ? 16 : 10); return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '\ufffd'; }
  return entities[code] || whole;
});
const descendants = node => node.children.flatMap(child => [child, ...descendants(child)]);

// This bounded DOM model executes the assembled trusted application in a VM.
// It checks actual markup, defaults, script order and event wiring. It does not
// emulate a browser renderer, CSP, file-preview policy or the native GF80 iframe.
function assembledFixture(options = {}) {
  const missingIds = [], scriptErrors = [], windowListeners = new Map(), downloads = [], blobs = new Map(), timers = new Map();
  let objectId = 0, timerId = 0;
  class Element {
    constructor(tag = 'div', attributes = {}) {
      this.tagName = tag.toUpperCase(); this.attributes = { ...attributes }; this.id = attributes.id || '';
      this.className = attributes.class || ''; this._nodes = []; this.parent = null; this.style = {}; this.events = new Map();
      this.dataset = Object.fromEntries(Object.entries(attributes).filter(([key]) => key.startsWith('data-'))
        .map(([key, value]) => [key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase()), value]));
      this.hidden = Object.hasOwn(attributes, 'hidden'); this.disabled = Object.hasOwn(attributes, 'disabled');
      this.selected = Object.hasOwn(attributes, 'selected'); this._selectionTouched = false; this._value = attributes.value || '';
      this.classList = { toggle: (name, force) => {
        const values = new Set(this.className.split(/\s+/).filter(Boolean));
        if (force === undefined ? !values.has(name) : force) values.add(name); else values.delete(name);
        this.className = [...values].join(' ');
      } };
      if (tag === 'iframe') this.contentWindow = { postMessage() { throw Error('Native GF80 iframe is outside assembled startup verification.'); } };
    }
    get children() { return this._nodes.filter(node => typeof node !== 'string'); }
    get textContent() { return this._nodes.map(node => typeof node === 'string' ? node : node.textContent).join(''); }
    set textContent(value) { this.children.forEach(node => { node.parent = null; }); this._nodes = [String(value)]; }
    get value() {
      if (this.tagName === 'SELECT') { const options = this.children.filter(node => node.tagName === 'OPTION'); const selected = options.find(node => node.selected) || (!this._selectionTouched ? options[0] : null); return selected ? selected.value : ''; }
      if (this.tagName === 'OPTION') return Object.hasOwn(this.attributes, 'value') ? this.attributes.value : this.textContent;
      return this._value;
    }
    set value(value) { this._value = String(value); if (this.tagName === 'SELECT') { this._selectionTouched = true; this.children.filter(node => node.tagName === 'OPTION').forEach(node => { node.selected = node.value === this._value; }); } }
    get childElementCount() { return this.children.length; }
    get firstElementChild() { return this.children[0] || null; }
    append(...children) { children.forEach(node => { if (typeof node !== 'string') node.parent = this; this._nodes.push(node); }); }
    replaceChildren(...children) { this.children.forEach(node => { node.parent = null; }); this._nodes = []; this.append(...children); }
    remove() { if (this.parent) this.parent._nodes = this.parent._nodes.filter(node => node !== this); this.parent = null; }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    getAttribute(key) { return this.attributes[key] ?? null; }
    addEventListener(type, callback) { if (!this.events.has(type)) this.events.set(type, []); this.events.get(type).push(callback); }
    effectivelyDisabled() { if (this.disabled) return true; for (let parent = this.parent; parent; parent = parent.parent) if (parent.tagName === 'FIELDSET' && parent.disabled) return true; return false; }
    async emit(type, event = {}) { if (['click', 'change', 'submit'].includes(type) && this.effectivelyDisabled()) return; for (const callback of this.events.get(type) || []) await callback({ target: this, preventDefault() {}, ...event }); }
    focus() { this.focused = true; }
    click() { if (this.effectivelyDisabled()) return; if (this.tagName === 'A') downloads.push({ name: this.download, blob: blobs.get(this.href) }); else void this.emit('click'); }
  }
  const documentRoot = new Element('document'), stack = [documentRoot], scripts = [];
  const html = options.html ?? fs.readFileSync(options.htmlPath || path.join(project, 'index.html'), 'utf8');
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  let position = 0;
  // Raw-text script/style and textarea handling is separate from tag parsing;
  // a quoted '>' in an attribute never terminates a start tag.
  while (position < html.length) {
    if (html.startsWith('<!--', position)) { const end = html.indexOf('-->', position + 4); assert.ok(end >= 0, 'Unclosed HTML comment'); position = end + 3; continue; }
    if (html[position] !== '<') { const next = html.indexOf('<', position); const end = next < 0 ? html.length : next; stack.at(-1).append(decode(html.slice(position, end))); position = end; continue; }
    let end = position + 1, quote = null;
    for (; end < html.length; end++) { const char = html[end]; if (quote) { if (char === quote) quote = null; } else if (char === '"' || char === "'") quote = char; else if (char === '>') break; }
    assert.ok(end < html.length, 'Unclosed HTML tag');
    const raw = html.slice(position + 1, end); position = end + 1;
    if (raw[0] === '!') continue;
    const close = /^\/\s*([a-z][\w-]*)/i.exec(raw);
    if (close) { const tag = close[1].toUpperCase(); const i = stack.findLastIndex(node => node.tagName === tag); if (i > 0) stack.splice(i); continue; }
    const start = /^([a-z][\w-]*)/i.exec(raw); assert.ok(start, 'Unsupported HTML syntax ' + raw.slice(0, 80));
    const tag = start[1].toLowerCase(), attrs = {};
    const tail = raw.slice(start[0].length).replace(/\/\s*$/, '');
    for (const match of tail.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attrs[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? match[4] ?? '');
    const node = new Element(tag, attrs); stack.at(-1).append(node);
    if (['script', 'style', 'textarea'].includes(tag)) {
      const closing = new RegExp('</' + tag + '\\s*>', 'ig'); closing.lastIndex = position; const match = closing.exec(html);
      assert.ok(match, 'Missing closing raw-text tag ' + tag); const text = html.slice(position, match.index);
      node.append(tag === 'textarea' ? decode(text) : text); if (tag === 'textarea') node._value = node.textContent;
      if (tag === 'script') scripts.push({ source: text, attributes: attrs }); position = closing.lastIndex;
    } else if (!voidTags.has(tag) && !/\/\s*$/.test(raw)) stack.push(node);
  }
  const all = () => [documentRoot, ...descendants(documentRoot)];
  const declaredIds = all().map(node => node.id).filter(Boolean); assert.equal(new Set(declaredIds).size, declaredIds.length, 'Actual markup contains duplicate IDs');
  function matches(node, selector) { if (selector[0] === '.') return node.className.split(/\s+/).includes(selector.slice(1)); if (selector[0] === '#') return node.id === selector.slice(1); return node.tagName.toLowerCase() === selector; }
  function query(query) { return all().filter(node => query.split(',').some(selector => {
    const terms = selector.trim().split(/\s+/); if (!matches(node, terms.at(-1))) return false;
    let parent = node.parent;
    for (let i = terms.length - 2; i >= 0; i--) { while (parent && !matches(parent, terms[i])) parent = parent.parent; if (!parent) return false; parent = parent.parent; }
    return true;
  })); }
  const document = { getElementById(id) { const node = all().find(node => node.id === id) || null; if (!node) missingIds.push(id); return node; }, createElement: tag => new Element(tag), querySelectorAll: query };
  const onWindow = (type, callback) => { if (!windowListeners.has(type)) windowListeners.set(type, []); windowListeners.get(type).push(callback); };
  const context = vm.createContext({ document, console, TextEncoder, Blob, crypto: webcrypto, performance, addEventListener: onWindow, open() {},
    URL: { createObjectURL(blob) { const url = 'blob:assembled-' + ++objectId; blobs.set(url, blob); return url; }, revokeObjectURL() {} },
    setTimeout(callback, delay) { const id = ++timerId; if (delay === 20) queueMicrotask(callback); else timers.set(id, callback); return id; }, clearTimeout(id) { timers.delete(id); } });
  vm.runInContext('globalThis.window=globalThis;globalThis.self=globalThis;', context);
  for (const name of options.omitGlobals || []) vm.runInContext('delete globalThis[' + JSON.stringify(name) + '];', context);
  function dispatchWindow(type, event) { for (const callback of windowListeners.get(type) || []) callback(event); }
  function execute() { scripts.forEach((script, i) => {
    assert.equal(script.attributes.src, undefined, 'Assembled startup must not fetch external scripts');
    try { vm.runInContext(script.source, context, { filename: 'assembled-index-script-' + (i + 1), timeout: 10000 }); }
    catch (error) { scriptErrors.push({ script: i + 1, message: error.message }); dispatchWindow('error', { message: error.message, error }); }
  }); }
  if (options.execute !== false) execute();
  async function settled() { const deadline = Date.now() + 5000; while (document.getElementById('import-session').disabled) { assert.ok(Date.now() < deadline, 'Assembled event did not settle'); await new Promise(resolve => setImmediate(resolve)); } }
  return { context, app: context.RusslTerminal, scripts, declaredIds, missingIds, scriptErrors, downloads, execute, dispatchWindow,
    node(id) { const node = document.getElementById(id); assert.ok(node, 'Actual HTML lacks ' + id); return node; }, query, descendants, settled,
    plain: value => JSON.parse(JSON.stringify(value)) };
}
module.exports = { assembledFixture, project };
