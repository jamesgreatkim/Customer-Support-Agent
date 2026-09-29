// Free, deterministic sales qualification. All offerings are fictional demo concepts.
export const salesFields=['company','need','volume','budget','timeline','contact'];
export const salesQuestions=[
 'What is your company or store name? You can use a fictional name for this demo.',
 'What is the biggest challenge you want to solve: repetitive questions, slow replies, or tracking support issues?',
 'About how many customer requests does your team handle each month? An estimate is fine.',
 'Do you have a budget range in mind? You can say “not sure” or “skip”.',
 'When would you like to get started?',
 'What email should be included for a demo sales follow-up? Use a fictional address such as alex@example.com, or say “skip”.',
 'May I save this qualification summary in this browser’s demo Sales Inbox inbox? Say “yes” to save or “no” to decline. No email is sent and no real salesperson is contacted.'
];
export function salesReply(input,state={step:0,details:{}}){
 const text=String(input).trim().slice(0,1000);const clean=text.toLowerCase();
 if(state.done)return {state,reply:'Your sales conversation is complete. Start a new conversation to qualify another lead, or switch to Support for customer service.'};
 if(/\b(price|pricing|cost|features|recommend)\b|what.*offer/i.test(text))return {state,reply:'For this portfolio demo, we offer three fictional solution paths: FAQ automation for repetitive questions, guided troubleshooting, and an agent inbox for escalations. There are no real plans or prices. '+salesQuestions[state.step]};
 if(/why|explain|what do you mean/i.test(text))return {state,reply:'These questions help prepare a useful sales summary. You can skip any qualification detail. '+salesQuestions[state.step]};
 if(state.step===6){
  if(/^(yes|yes please|i agree|save|ok|okay)[!. ]*$/.test(clean))return {state:{...state,done:true,consent:true},save:true,reply:'Thanks! Your demo lead is saved in Agent View → Sales Inbox with our conversation and qualification details. No real outreach has been scheduled.'};
  if(/^(no|no thanks|decline|skip)[!. ]*$/.test(clean))return {state:{...state,done:true,consent:false},reply:'Understood. I haven’t saved a lead or sent anything. You can still explore Support or start a new sales conversation.'};
  return {state,reply:salesQuestions[6]};
 }
 if(state.step===5&&!/^skip$/i.test(text)&&! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text))return {state,reply:'Please use an email format such as alex@example.com, or say “skip”.'};
 const next={...state,step:state.step+1,details:{...state.details,[salesFields[state.step]]:/^skip$/i.test(text)?'Not provided':text}};
 return {state:next,reply:(state.step===1?'Thanks. '+recommendation(text)+' ':'Thanks, noted. ')+salesQuestions[next.step]};
}
export function recommendation(need=''){
 if(/repet|faq|same question/i.test(need))return 'FAQ automation could be a useful demo starting point.';
 if(/slow|response|reply/i.test(need))return 'Guided replies plus human handoff could help demonstrate faster support.';
 return 'An agent inbox with preserved conversation context could be a useful demo starting point.';
}
export function makeLead(state,transcript){if(!state.consent)throw Error('Consent required');return {id:'LEAD-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase(),details:{...state.details},recommendation:recommendation(state.details.need),status:'New',createdAt:new Date().toISOString(),consentAt:new Date().toISOString(),transcript:transcript.map(m=>({role:m.role,content:m.content})),notes:''};}
export function loadLeads(storage){try{const data=JSON.parse(storage?.getItem('northstar-demo-leads-v1')||'[]');return Array.isArray(data)?data.filter(l=>l&&typeof l.id==='string'&&l.details&&Array.isArray(l.transcript)&&typeof l.status==='string'):[];}catch{return [];}}
export function saveLeads(storage,leads){try{if(!storage)return false;storage.setItem('northstar-demo-leads-v1',JSON.stringify(leads));return true;}catch{return false;}}
