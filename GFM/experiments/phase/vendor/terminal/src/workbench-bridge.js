/* Modified research integration, 2026. Source documents remain data.
 * This relay delegates to the original bounded GF80 adapter in the retained
 * workbench. It never evaluates commands, opens files, or accesses storage. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) {
    root.RUSSLVirtualWorkbenchBridge = api;
    api.install(root, root.document);
  }
})(typeof window !== 'undefined' ? window : null, function createBridgeApi() {
  'use strict';
  var PROTOCOL = 'RUSSL-virtual-terminal/1';
  var MAX_BYTES = 2 * 1024 * 1024;
  var METHODS = ['snapshot', 'replay'];
  var MARKER = 'data-russl-virtual-relay';
  var ID = /^[A-Za-z0-9_-]{1,80}$/;
  var unsafeKeys = ['__proto__', 'constructor', 'prototype'];

  function isObject(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    var proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
  }

  function boundedJson(value) {
    var nodes = 0;
    var ancestors = new Set();
    function visit(item, depth) {
      if (++nodes > 100000 || depth > 32) throw Error('Record exceeds the bounded JSON structure.');
      if (item === null || typeof item === 'boolean' || typeof item === 'string') return;
      if (typeof item === 'number' && Number.isFinite(item)) return;
      if (!item || typeof item !== 'object') throw Error('Record must contain only plain JSON data.');
      if (ancestors.has(item)) throw Error('Record contains a cycle.');
      if (!Array.isArray(item) && !isObject(item)) throw Error('Record must contain only plain JSON objects.');
      if (Array.isArray(item) && Object.getPrototypeOf(item) !== Array.prototype) throw Error('Record must contain only plain JSON arrays.');
      ancestors.add(item);
      var descriptors = Object.getOwnPropertyDescriptors(item);
      var keys = Reflect.ownKeys(descriptors);
      if (Array.isArray(item) && item.length > 100000) throw Error('Record array is too large.');
      keys.forEach(function (key) {
        if (Array.isArray(item) && key === 'length') return;
        if (typeof key !== 'string' || unsafeKeys.indexOf(key) !== -1) throw Error('Unsupported record property.');
        var descriptor = descriptors[key];
        if (!('value' in descriptor) || !descriptor.enumerable) throw Error('Record must contain data properties only.');
        if (Array.isArray(item) && (!/^(?:0|[1-9][0-9]*)$/.test(key) || Number(key) >= item.length)) throw Error('Record array has extra properties.');
        visit(descriptor.value, depth + 1);
      });
      if (Array.isArray(item) && keys.length !== item.length + 1) throw Error('Record arrays cannot contain holes.');
      ancestors.delete(item);
    }
    visit(value, 0);
    var serialized = JSON.stringify(value);
    if (typeof serialized !== 'string' || new TextEncoder().encode(serialized).byteLength > MAX_BYTES) throw Error('Record exceeds the 2 MiB UTF-8 limit. Reduce the slice size.');
    return JSON.parse(serialized);
  }

  function exactKeys(value, expected) {
    var keys = Object.keys(value);
    if (keys.length !== expected.length || keys.some(function (key) { return expected.indexOf(key) < 0; })) throw Error('Unsupported adapter message properties.');
  }

  function validId(id) { return typeof id === 'string' && ID.test(id); }

  function snapshotShape(value) {
    if (!isObject(value) || value.schema !== 'RUSSL-research-slice/1' || !isObject(value.manifest) || typeof value.pixelPayloadHex !== 'string' || value.pixelPayloadHex.length % 2 || !/^[0-9a-f]*$/i.test(value.pixelPayloadHex)) throw Error('Invalid bounded Pixel160 research snapshot.');
  }

  function validateRequest(value) {
    var data = boundedJson(value);
    if (!isObject(data) || data.protocol !== PROTOCOL || !validId(data.id)) throw Error('Invalid virtual terminal adapter request.');
    if (METHODS.indexOf(data.method) < 0) throw Error('Unsupported adapter method. Use snapshot or replay.');
    exactKeys(data, data.method === 'replay' ? ['protocol', 'id', 'method', 'snapshot'] : ['protocol', 'id', 'method']);
    if (data.method === 'replay') snapshotShape(data.snapshot);
    return data;
  }

  function validateReply(value, method) {
    var data = boundedJson(value);
    if (!isObject(data) || data.protocol !== PROTOCOL || !validId(data.id) || typeof data.ok !== 'boolean') throw Error('Invalid virtual terminal adapter response.');
    exactKeys(data, data.ok ? ['protocol', 'id', 'ok', 'value'] : ['protocol', 'id', 'ok', 'error']);
    if (!data.ok) {
      if (typeof data.error !== 'string' || data.error.length > 2048) throw Error('Invalid adapter error response.');
    } else if (method === 'snapshot') snapshotShape(data.value);
    else if (method === 'replay') {
      if (!isObject(data.value) || data.value.schema !== 'RUSSL-research-result/1' || data.value.field !== 'GF(2^80)' || typeof data.value.valid !== 'boolean') throw Error('Invalid GF80 replay result.');
    } else throw Error('Unexpected adapter response method.');
    return data;
  }

  function failure(id, error) {
    return { protocol: PROTOCOL, id: id, ok: false, error: String(error && error.message || error || 'Adapter request failed.').slice(0, 2048) };
  }

  function installInnerRelay(win) {
    if (win.parent === win) return;
    var busy = false;
    function send(value) { win.parent.postMessage(value, '*'); }
    function ready() {
      if (win.RUSSLResearchAdapter && typeof win.RUSSLResearchAdapter.request === 'function') send({ protocol: PROTOCOL, kind: 'ready' });
    }
    win.addEventListener('message', function (event) {
      if (event.source !== win.parent || !isObject(event.data) || event.data.protocol !== PROTOCOL) return;
      if (event.data.kind === 'hello' && Object.keys(event.data).length === 2) { ready(); return; }
      if (!validId(event.data.id)) return;
      var request;
      try { request = validateRequest(event.data); }
      catch (error) { send(failure(event.data.id, error)); return; }
      if (busy) { send(failure(request.id, 'A virtual terminal request is already running.')); return; }
      if (!win.RUSSLResearchAdapter || typeof win.RUSSLResearchAdapter.request !== 'function') { send(failure(request.id, 'The original workbench adapter is not ready.')); return; }
      busy = true;
      Promise.resolve().then(function () {
        return win.RUSSLResearchAdapter.request(request.method, request.snapshot);
      }).then(function (value) {
        send(validateReply({ protocol: PROTOCOL, id: request.id, ok: true, value: value }, request.method));
      }).catch(function (error) {
        send(failure(request.id, error));
      }).finally(function () { busy = false; });
    });
    ready();
  }

  function relayMarkup() {
    var source = ';(function(){var api=(' + createBridgeApi.toString() + ')();api.installInnerRelay(window);})();';
    // Split the closing tag so this file is also safe for inline injection.
    return '<script ' + MARKER + '>' + source.replace(/<\x2fscript/gi, '<\\/script') + '<' + '/script>';
  }

  function instrumentSrcdoc(html) {
    if (typeof html !== 'string' || !html) throw Error('The retained research terminal source is missing.');
    if (html.indexOf('<script ' + MARKER + '>') >= 0) return html;
    var close = html.toLowerCase().lastIndexOf('<' + '/body>');
    if (close < 0) throw Error('The research terminal source has no closing body tag.');
    return html.slice(0, close) + relayMarkup() + html.slice(close);
  }

  function install(win, doc) {
    if (!win.parent || win.parent === win || win.__RUSSLVirtualBridgeInstalled) return;
    win.__RUSSLVirtualBridgeInstalled = true;
    var frame = null;
    var ready = false;
    var pending = null;
    var mounted = false;
    var restoreWords = false;
    var installedFrames = new WeakSet();
    var mountTimer = null;

    function send(value) { win.parent.postMessage(value, '*'); }
    function finish(value) {
      if (!pending) return;
      win.clearTimeout(pending.timer);
      pending = null;
      send(value);
    }
    function forward() {
      if (ready && frame && pending && !pending.sent) {
        pending.sent = true;
        frame.contentWindow.postMessage(pending.request, '*');
      }
    }
    function scan() {
      if (!mounted) {
        var researchTab = doc.getElementById('research-view-tab');
        var wordsTab = doc.getElementById('word-view-tab');
        if (researchTab) {
          mounted = true;
          restoreWords = !!wordsTab && wordsTab.getAttribute('aria-selected') === 'true';
          researchTab.click();
        }
      }
      var next = doc.querySelector('iframe[title="GFM research terminal"]');
      if (!next) return;
      if (next !== frame) {
        if (frame && pending && pending.sent) finish(failure(pending.request.id, 'The workbench iframe was replaced. Retry the request.'));
        frame = next;
        ready = false;
      }
      if (installedFrames.has(next)) return;
      installedFrames.add(next);
      next.addEventListener('load', function () {
        if (next === frame) next.contentWindow.postMessage({ protocol: PROTOCOL, kind: 'hello' }, '*');
      });
      try { next.srcdoc = instrumentSrcdoc(next.srcdoc); }
      catch (error) { if (pending) finish(failure(pending.request.id, error)); }
    }
    win.addEventListener('message', function (event) {
      var data = event.data;
      if (!isObject(data) || data.protocol !== PROTOCOL) return;
      if (frame && event.source === frame.contentWindow) {
        if (data.kind === 'ready' && Object.keys(data).length === 2) {
          ready = true;
          if (mountTimer) { win.clearTimeout(mountTimer); mountTimer = null; }
          if (restoreWords) {
            restoreWords = false;
            var wordsTab = doc.getElementById('word-view-tab');
            if (wordsTab) wordsTab.click();
          }
          send({ protocol: PROTOCOL, kind: 'ready' });
          forward();
          return;
        }
        if (!pending || !pending.sent || data.id !== pending.request.id) return;
        try { finish(validateReply(data, pending.request.method)); }
        catch (error) { finish(failure(pending.request.id, error)); }
        return;
      }
      if (event.source !== win.parent) return;
      if (data.kind === 'hello' && Object.keys(data).length === 2) {
        if (ready) send({ protocol: PROTOCOL, kind: 'ready' });
        else scan();
        return;
      }
      if (!validId(data.id)) return;
      var request;
      try { request = validateRequest(data); }
      catch (error) { send(failure(data.id, error)); return; }
      if (pending) { send(failure(request.id, 'A virtual terminal request is already running.')); return; }
      pending = { request: request, sent: false, timer: win.setTimeout(function () {
        if (pending) finish(failure(pending.request.id, 'The workbench did not respond within 22 seconds.'));
      }, 22000) };
      scan();
      forward();
    });
    var observer = new win.MutationObserver(scan);
    observer.observe(doc.documentElement, { childList: true, subtree: true });
    scan();
    mountTimer = win.setTimeout(function () {
      mountTimer = null;
      if (!ready) send({ protocol: PROTOCOL, kind: 'unavailable', error: 'The retained workbench could not initialize its research adapter.' });
    }, 22000);
  }

  return Object.freeze({ protocol: PROTOCOL, maxBytes: MAX_BYTES, methods: Object.freeze(METHODS), validId: validId, boundedJson: boundedJson, validateRequest: validateRequest, validateReply: validateReply, instrumentSrcdoc: instrumentSrcdoc, installInnerRelay: installInnerRelay, install: install });
});
