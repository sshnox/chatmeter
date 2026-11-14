import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../content.js', import.meta.url), 'utf8');

function environment(initial = []) {
  let now = 100000;
  const callbacks = {};
  const recorded = [];
  let observer;
  const messages = [...initial];
  const pageLocation = { href: 'https://chatgpt.com/c/original' };
  const composer = { value: 'Hello' };
  class Element {
    constructor(kind = 'textarea') { this.kind = kind; this.isContentEditable = kind === 'editable'; }
    matches(selector) { return selector.includes('textarea') && this.kind === 'textarea' || selector.includes('#prompt-textarea') && this.kind === 'editable'; }
    closest(selector) { return selector.startsWith('button') && this.kind === 'button' ? { disabled: false } : null; }
  }
  function node(text, id) {
    return {
      innerText: text, textContent: text,
      getAttribute: key => key === 'data-message-id' ? id : null,
      closest: () => null
    };
  }
  const document = {
    documentElement: {},
    querySelector: () => composer,
    querySelectorAll: () => messages,
    addEventListener: (type, fn) => { callbacks[type] = fn; }
  };
  class MutationObserver {
    constructor(fn) { observer = fn; }
    observe() {}
  }
  class Clock extends Date { static now() { return now; } }
  vm.runInNewContext(source, { document, MutationObserver, Date: Clock, HTMLElement: Element, Element,
    location: pageLocation, chrome: { runtime: { sendMessage: async message => { recorded.push(message); } } } });
  return {
    recorded, messages, node, composer, location: pageLocation,
    advance(ms) { now += ms; },
    enter() { callbacks.keydown({ key: 'Enter', isTrusted: true, target: new Element(), shiftKey: false, ctrlKey: false, metaKey: false, altKey: false }); },
    click() { callbacks.click({ isTrusted: true, target: new Element('button') }); },
    shiftEnter() { callbacks.keydown({ key: 'Enter', isTrusted: true, shiftKey: true, target: new Element() }); },
    mutate() { observer(); },
    add(text, id) { const n = node(text, id); messages.push(n); observer(); return n; }
  };
}
test('two real sends 700 ms apart both count', () => {
  const e = environment(); e.enter(); e.add('first','a'); e.advance(700); e.enter(); e.add('second','b');
  assert.equal(e.recorded.length,2);
});
test('two independent sends 80 ms apart both count', () => {
  const e=environment(); e.enter(); e.add('first','a'); e.advance(80); e.enter(); e.add('second','b');
  assert.equal(e.recorded.length,2);
});
test('same send rendered twice with same id counts once',()=>{
  const e=environment(); e.enter(); e.add('first','a'); e.messages.pop();
  e.advance(200);e.enter();e.add('first again','a');
  assert.equal(e.recorded.length,1);
});
test('one DOM node observed repeatedly counts once',()=>{
  const e=environment();e.enter();e.add('hello','a');e.mutate();e.mutate();assert.equal(e.recorded.length,1);
});
test('an edited existing user message is not a new submission',()=>{
  const e=environment();e.enter();const n=e.add('hello','a');n.innerText='hello updated';e.mutate();assert.equal(e.recorded.length,1);
});
test('regenerate without a send gesture does not count',()=>{
  const e=environment();e.add('hydrated user text','historical');e.mutate();assert.equal(e.recorded.length,0);
});
test('route navigation discards pending sends and baselines loaded history',()=>{
  const e=environment();e.enter();e.location.href='https://chatgpt.com/c/another';e.add('old conversation','history');
  assert.equal(e.recorded.length,0);
  e.enter();e.add('real new send','fresh');assert.equal(e.recorded.length,1);
});
test('new node populated after initial empty insertion counts once',()=>{
  const e=environment();e.enter();const n=e.add('','delayed');assert.equal(e.recorded.length,0);
  n.innerText='now loaded';e.mutate();assert.equal(e.recorded.length,1);
});
test('empty composer and Shift+Enter never arm',()=>{
  const e=environment();e.composer.value='';e.enter();e.add('historical','a');e.composer.value='hi';e.shiftEnter();e.add('historical2','b');
  assert.equal(e.recorded.length,0);
});
test('expired send gestures cannot count unrelated messages',()=>{
  const e=environment();e.enter();e.advance(10001);e.add('unrelated','a');assert.equal(e.recorded.length,0);
});
test('Enter and click within 120 ms do not double arm same send',()=>{
  const e=environment();e.enter();e.advance(40);e.click();e.add('message','a');e.add('unrelated','b');
  assert.equal(e.recorded.length,1);
});
test('button clicks can count send after visible user message appears',()=>{
  const e=environment();e.click();e.add('clicked send','a');assert.equal(e.recorded.length,1);
});
