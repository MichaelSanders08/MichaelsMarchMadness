import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleField} from '../src/field.js';
import {games, fill, choose, statistics, validateField, restore, probability} from '../src/bracket.js';
test('complete tournament has 63 games and one valid champion',()=>{
 const picks=fill(sampleField,{},'test',50),rounds=games(sampleField,picks);
 assert.deepEqual(rounds.map(r=>r.length),[32,16,8,4,2,1]);assert.equal(statistics(sampleField,picks).picked,63);
 for(const game of rounds.flat())assert.ok(game.teams.some(t=>t.id===game.winner.id));
});
test('same seed reproduces picks; different seeds permit different outcomes',()=>{
 assert.deepEqual(fill(sampleField,{},'same',50),fill(sampleField,{},'same',50));
 assert.notDeepEqual(fill(sampleField,{},'same',100),fill(sampleField,{},'different',100));
});
test('manual underdog survives fill and changing it clears invalid descendants',()=>{
 const early=choose(sampleField,{},'r0-0','south-16');const all=fill(sampleField,early,'test',0);
 assert.equal(all['r0-0'],'south-16');const changed=choose(sampleField,all,'r0-0','south-1');
 assert.equal(changed['r0-0'],'south-1');assert.ok(!Object.values(changed).includes('south-16'));
});
test('clearing a winner invalidates all descendants that depended on the game',()=>{
 const all=fill(sampleField,{},'demo',0);const changed=choose(sampleField,all,'r0-0',all['r0-0']);
 for(const id of ['r0-0','r1-0','r2-0','r3-0','r4-0','r5-0'])assert.equal(changed[id],undefined);
 assert.equal(Object.keys(changed).length,57);
});
test('chalk never advances a worse seed',()=>assert.equal(statistics(sampleField,fill(sampleField,{},'a',0)).upsets,0));
test('chaos has symmetric probabilities and bounded interpolation',()=>{
 for(let a=1;a<=16;a++)for(let b=1;b<=16;b++)for(const chaos of [0,25,50,75,100]){
 const p=probability({seed:a},{seed:b},chaos);assert.ok(p>=0&&p<=1);assert.ok(Math.abs(p+probability({seed:b},{seed:a},chaos)-1)<1e-12);
 }
 assert.equal(probability({seed:1},{seed:16},100),.5);
});
test('field requires exactly one seed per region and unique ids',()=>{
 assert.equal(validateField(sampleField).length,64);
 assert.throws(()=>validateField(sampleField.slice(1)));
 const copy=structuredClone(sampleField);copy[1].seed=1;assert.throws(()=>validateField(copy));
 copy[1].seed=2;copy[1].id=copy[0].id;assert.throws(()=>validateField(copy));
});
test('export roundtrip preserves picks and strips impossible picks',()=>{
 const raw={version:1,field:sampleField,label:'Demo',picks:fill(sampleField),seed:'michael-8',chaos:50};
 assert.deepEqual(restore(JSON.parse(JSON.stringify(raw))),raw);
 raw.picks['r5-0']='unknown';assert.equal(restore(raw).picks['r5-0'],undefined);
 assert.throws(()=>restore({...raw,chaos:-2}));assert.throws(()=>restore({...raw,version:4}));
});
test('unavailable games cannot be picked',()=>assert.throws(()=>choose(sampleField,{},'r5-0','south-1')));
