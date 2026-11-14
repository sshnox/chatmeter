import {test} from 'node:test';
import assert from 'node:assert/strict';
import '../state.js';
const core=globalThis.ChatMeterCore;
test('fresh install contains no fake activity',()=>{const s=core.initialState();assert.equal(s.used,0);assert.equal(s.resetAt,null);assert.deepEqual(s.events,[]);});
test('observed prompts count past configured estimate',()=>{let s=core.initialState();s.limit=1;s=core.count(s,'2026-11-15T09:00:00Z');s=core.count(s,'2026-11-15T09:02:00Z');assert.equal(s.used,2);assert.equal(s.events.length,2);});
test('estimated cycle rolls over without deleting history',()=>{let s=core.count(core.initialState(),'2026-11-15T09:00:00Z');s=core.count(s,'2026-11-15T12:01:00Z');assert.equal(s.used,1);assert.equal(s.events.length,2);});
test('settings do not reset existing observations',()=>{let s=core.count(core.initialState(),'2026-11-15T09:00:00Z');s=core.settings(s,{limit:1,cycleHours:4,showPrivacy:false});assert.equal(s.used,1);assert.equal(s.prefs.showPrivacy,false);});
test('daily chart derives from observed counts',()=>{assert.equal(core.days(core.initialState()).reduce((v,row)=>v+row.count,0),0);});
test('bad data is sanitized',()=>{const s=core.clean({used:-1,limit:0,events:[null,{at:'invalid'}]});assert.equal(s.used,0);assert.equal(s.limit,1);assert.equal(s.events.length,0);});
test('reset returns to zero',()=>{const s=core.initialState();assert.equal(s.used,0);assert.deepEqual(s.totalsByDate,{});});

test('account allowance is absent until a user enters it',()=>{
 const s=core.initialState();assert.equal(s.official,null);
});
test('manual snapshot is timestamped and independent of observed events',()=>{
 let s=core.settings(core.initialState(),{official:{remaining:67,label:'Work and Codex',resetAt:'2026-12-01T10:00:00Z'}});
 assert.equal(s.official.remaining,67);assert.equal(s.official.source,'manually copied from ChatGPT');
 const before=s.official.capturedAt;s=core.count(s,'2026-11-15T09:00:00Z');
 assert.equal(s.official.remaining,67);assert.equal(s.official.capturedAt,before);
});
test('invalid percentages cannot be saved as official allowances',()=>{
 assert.throws(()=>core.settings(core.initialState(),{official:{remaining:101}}));
 assert.throws(()=>core.settings(core.initialState(),{official:{remaining:-1}}));
 assert.throws(()=>core.settings(core.initialState(),{official:{remaining:20.5}}));
});
test('snapshot can be cleared without deleting observed activity',()=>{
 let s=core.count(core.initialState(),'2026-11-15T09:00:00Z');
 s=core.settings(s,{official:{remaining:50}});
 s=core.settings(s,{official:null});
 assert.equal(s.official,null);assert.equal(s.events.length,1);
});
