import test from 'node:test';
import assert from 'node:assert/strict';
import {createTicket,updateTicket,addTicketNote,filterTickets,loadTickets,saveTickets} from '../src/tickets.js';
import {respond} from '../src/agent.js';
import {customers} from '../src/data.js';
function memoryStorage(){const data=new Map();return {getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};}
function escalatedTicket(){const messages=[];for(const content of ['My device won’t connect','still not working','still not working','still not working']){messages.push({role:'user',content});const result=respond(content,messages);messages.push({role:'assistant',content:result.reply,...result});}return {messages,ticket:createTicket({messages,customer:customers[0],id:'DEMO-TEST'})};}
test('handoff becomes an independent ticket with all diagnostic checks and conversation',()=>{
 const {messages,ticket}=escalatedTicket();assert.equal(messages.at(-1).escalate,true);assert.equal(ticket.attempts.length,3);assert.equal(ticket.transcript.length,8);assert.equal(ticket.summary,'My device won’t connect');assert.equal(ticket.customer.id,customers[0].id);
 messages[0].content='changed';messages.at(-1).technical.attempts[0].customerReply='changed';assert.equal(ticket.transcript[0].content,'My device won’t connect');assert.equal(ticket.attempts[0].customerReply,'still not working');
});
test('agent can assign, prioritize, resolve, reopen and add notes with audit history',()=>{
 let {ticket}=escalatedTicket();ticket=updateTicket(ticket,'assignee','You');ticket=updateTicket(ticket,'priority','High');ticket=updateTicket(ticket,'status','In progress');ticket=addTicketNote(ticket,'Re-pairing confirmed; customer reports connected.');ticket=updateTicket(ticket,'status','Resolved');assert.equal(ticket.notes.length,1);assert.equal(ticket.activity.length,6);assert.equal(ticket.status,'Resolved');
 ticket=updateTicket(ticket,'status','Open');assert.equal(ticket.status,'Open');assert.equal(updateTicket(ticket,'status','invalid'),ticket);assert.equal(addTicketNote(ticket,'  '),ticket);
});
test('browser persistence survives reload and filters combine customer, status and priority',()=>{
 const {ticket}=escalatedTicket();const storage=memoryStorage();assert.equal(saveTickets(storage,[ticket]),true);const restored=loadTickets(storage);assert.equal(restored[0].transcript.length,8);assert.equal(filterTickets(restored,{query:'alex',status:'Open',priority:'Normal'}).length,1);assert.equal(filterTickets(restored,{query:'alex',status:'Resolved'}).length,0);
 assert.deepEqual(loadTickets({getItem(){return '{bad';}}),[]);assert.equal(saveTickets({setItem(){throw Error('blocked');}},[ticket]),false);assert.deepEqual(loadTickets(undefined),[]);
});
