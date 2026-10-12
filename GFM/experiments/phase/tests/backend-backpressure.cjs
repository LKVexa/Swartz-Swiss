'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createEventWriter } = require('../server.cjs');
test('SSE backpressure retains the latest pending frame and resumes on drain without disconnecting', () => {
  const response = new EventEmitter(); const sent = []; let writable = false, ends = 0, closes = 0;
  response.write = message => { sent.push(message); return writable; }; response.end = () => ends++;
  const writer = createEventWriter(response, () => closes++);
  writer.send('initial state'); writer.send('intermediate state'); writer.send('latest state');
  assert.deepEqual(sent,['initial state']); assert.equal(ends,0); assert.equal(closes,0);
  // The resumed large write may fill the buffer again; it must also wait safely.
  response.emit('drain'); assert.deepEqual(sent,['initial state','latest state']); assert.equal(ends,0);
  writer.send('next state'); writer.send('newest state'); writable = true; response.emit('drain');
  assert.deepEqual(sent,['initial state','latest state','newest state']);
  writer.send('live state'); assert.equal(sent.at(-1),'live state'); assert.equal(ends,0);
  writer.end(); assert.equal(ends,1); assert.equal(closes,1);
});
test('closed or failed SSE connections discard pending data and release drain listeners', () => {
  for (const event of ['close','error']) {
    const response = new EventEmitter(); const sent = []; let closes = 0;
    response.write = message => { sent.push(message); return false; }; response.end = () => {};
    const writer = createEventWriter(response, () => closes++); writer.send('first'); writer.send('pending');
    response.emit(event, new Error('connection ended')); writer.send('after close'); response.emit('drain');
    assert.deepEqual(sent,['first']); assert.equal(closes,1); assert.equal(response.listenerCount('drain'),0);
  }
});
