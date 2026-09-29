import test from 'node:test';
import assert from 'node:assert/strict';
import {respond} from '../src/agent.js';
import {articles,scenarios} from '../src/data.js';
import handler from '../api/chat.js';
function turn(history,input){history.push({role:'user',content:input});const result=respond(input,history);history.push({role:'assistant',content:result.reply,...result});return result;}
test('connectivity checks advance, preserve results, then escalate',()=>{
 const h=[];assert.match(turn(h,'My device won’t connect').reply,/Check 1 of 3/);
 assert.match(turn(h,'still not working').reply,/Check 2 of 3/);
 assert.match(turn(h,'no luck').reply,/Check 3 of 3/);
 const final=turn(h,'still not working');assert.equal(final.escalate,true);assert.equal(final.technical.attempts.length,3);assert.equal(final.technical.issue,'My device won’t connect');assert.deepEqual(final.sources,['KB-107']);
});
test('resolution, early specialist request, and sensitive login escalate appropriately',()=>{
 const h=[];turn(h,'My device won’t connect');assert.equal(turn(h,'resolved').technical.status,'resolved');
 const j=[];turn(j,'I cannot log in');assert.equal(turn(j,'I am locked out').escalate,true);
 const k=[];turn(k,'My app crashes');assert.equal(turn(k,'human please').escalate,true);
});
test('technical topic chooser and topic switching preserve order behavior',()=>{
 const h=[];assert.match(turn(h,'technical support').reply,/Which issue/);assert.match(turn(h,'login').reply,/Login troubleshooting/);
 const order=turn(h,'Where is my order NS-20481?');assert.equal(order.orderId,'NS-20481');assert.match(turn(h,'Can I cancel it?').reply,/no longer/);
 assert.equal(articles.length,9);assert.equal(scenarios[0].title,'Technical support');
});
test('serverless technical support follows the same workflow without an API key',async()=>{
 const previous=process.env.OPENAI_API_KEY;delete process.env.OPENAI_API_KEY;
 const messages=[{role:'user',content:'My device won’t connect'},{role:'assistant',content:'Check 1'},{role:'user',content:'still not working'}];
 let status,result;const res={status(code){status=code;return this;},json(data){result=data;return this;}};
 try {await handler({method:'POST',body:{messages}},res);assert.equal(status,200);assert.match(result.reply,/Check 2 of 3/);assert.equal(result.mode,'demo');}
 finally{if(previous!==undefined)process.env.OPENAI_API_KEY=previous;}
});
