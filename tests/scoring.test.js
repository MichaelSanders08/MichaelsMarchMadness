import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleField} from '../src/field.js';
import {fill,choose,scoreBracket,restore} from '../src/bracket.js';
test('perfect complete bracket earns 192 with no remaining points',()=>{
 const picks=fill(sampleField,{},'perfect',0),score=scoreBracket(sampleField,picks,picks);
 assert.equal(score.earned,192);assert.equal(score.remaining,0);assert.equal(score.recorded,63);
 assert.deepEqual(score.rounds.map(r=>r.earned),[32,32,32,32,32,32]);
});
test('upset removes all future potential for eliminated champion without changing predictions',()=>{
 const picks=fill(sampleField,{},'a',0);for(const id of ['r0-0','r1-0','r2-0','r3-0','r4-0','r5-0'])picks[id]='south-1';
 const before=JSON.stringify(picks),results=choose(sampleField,{},'r0-0','south-16');
 const score=scoreBracket(sampleField,picks,results);
 assert.equal(score.maximum,129);assert.equal(score.earned,0);assert.equal(score.recorded,1);assert.equal(JSON.stringify(picks),before);
 assert.equal(score.rounds[5].entries[0].status,'eliminated');
});
test('partial and empty predictions never gain unpicked potential',()=>{
 assert.equal(scoreBracket(sampleField,{},{}).maximum,0);
 const picks=choose(sampleField,{},'r0-0','south-1');assert.equal(scoreBracket(sampleField,picks).maximum,1);
});
test('results export roundtrip and corrected early results invalidate descendants',()=>{
 const picks=fill(sampleField),raw={version:1,field:sampleField,label:'Test',picks,results:picks,seed:'a',chaos:50};
 assert.deepEqual(restore(JSON.parse(JSON.stringify(raw))).results,picks);
 const changed=choose(sampleField,picks,'r0-0',picks['r0-0']);
 assert.equal(changed['r5-0'],undefined);assert.equal(restore({...raw,results:changed}).results['r0-0'],undefined);
});
