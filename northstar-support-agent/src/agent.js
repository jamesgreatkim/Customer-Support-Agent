import {articles,customers} from './data.js';
import {respondTechnical} from './technical.js';
const words=s=>(s.toLowerCase().match(/[a-z]{3,}/g)||[]).filter(w=>!['what','with','this','that','your','have','from','would','about','please','there','order'].includes(w));
export function lookupOrder(input){const match=input.match(/NS[- ]?(\d{5})/i);if(!match)return null;for(const customer of customers){const order=customer.orders.find(o=>o.id===`NS-${match[1]}`);if(order)return {order,customer};}return null;}
export function retrieve(input){const q=new Set(words(input));return articles.map(a=>({article:a,score:words(`${a.title} ${a.category} ${a.body}`).reduce((n,w)=>n+(q.has(w)?1:0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,2).map(x=>x.article);}
const conversationalPolicies={
 'KB-101':'Standard shipping takes **3–5 business days** after dispatch; express takes **1–2 business days**. These are estimates and carrier delays can affect them. Are you checking an existing order?',
 'KB-102':'You can generally return unused items in their original packaging within **30 days of delivery**. Final-sale items aren’t eligible. Refunds take **5–10 business days** after inspection.',
 'KB-103':'We can review changes while an order is still processing. Once it’s packed or shipped, cancellation isn’t available. What’s your order number?',
 'KB-104':'A pending payment can be an authorization rather than a settled charge. Duplicate charges need a specialist’s review. Are you seeing a pending payment or two settled charges?',
 'KB-105':'Products include a **one-year limited warranty** for manufacturing defects. Accidental damage and normal wear aren’t covered. What’s happening with your product?',
 'KB-106':'You can update your email and shipping address in **Account Settings**. Access verification and data deletion need a specialist. What would you like to change?'
};
function topicOf(text){
 if(/return|refund|exchange|send (?:it|this|them) back|money back/i.test(text))return 'returns';
 if(/cancel|change.*order|edit.*order|wrong address/i.test(text))return 'changes';
 if(/bill|payment|charged?|card|pending|authorization|settled/i.test(text))return 'billing';
 if(/warranty|guarantee|defect|broken|damaged/i.test(text))return 'warranty';
 if(/account|email|address|privacy/i.test(text))return 'account';
 if(/shipping|delivery time|how (?:long|fast)|express|standard delivery/i.test(text))return 'shipping';
 if(/order|tracking|package|parcel|shipment|arriv|deliver|where.*stuff/i.test(text))return 'order';
 return null;
}
export function respond(input,history=[]){
 const originalInput=String(input||'').trim();
 input=originalInput.replace(/[’‘]/g,"'");
 const prior=[...history];if(prior.at(-1)?.role==='user'&&prior.at(-1).content.replace(/[’‘]/g,"'")===input)prior.pop();
 const previous=[...prior].reverse().find(m=>m.role==='assistant');
 const previousUser=[...prior].reverse().find(m=>m.role==='user')?.content||'';
 const answer=(reply,sources=[],escalate=false,orderId)=>({reply,sources,escalate,...(orderId?{orderId}:{})});
 if(/^(hi|hello|hey|good morning|good afternoon)[!. ]*$/i.test(input))return answer('Hi! I’m here to help with orders, returns, or technical issues. What can I help you with today?');
 if(/^(thanks|thank you|thank you so much|great|awesome)[!. ]*$/i.test(input))return answer('You’re welcome! Is there anything else you’d like help with?');
 const technical=respondTechnical(originalInput,history);if(technical)return technical;
 const lastOrder=[...prior].reverse().find(m=>m.orderId)?.orderId||[...prior].reverse().map(m=>lookupOrder(m.content)).find(Boolean)?.order.id;
 const explicit=input.match(/NS[- ]?\d{5}/i)?.[0];
 if(explicit&&!lookupOrder(explicit))return answer(`I couldn’t find **${explicit.toUpperCase()}** in the sample orders. Could you check the number? This demo only has fictional order records.`);
 const numberOnly=/^NS[- ]?\d{5}[!. ]*$/i.test(input);
 let topic=topicOf(numberOnly?previousUser:input);
 if(!topic&&/^(yes|yeah|yep|no|nope|it|that|how do i do that|how long does it take|what next|still need help)[?.! ]*$/i.test(input)){
  const previousTopic=topicOf(previousUser);
  if(/^(yes|yeah|yep)/i.test(input)&&previous?.content.includes('existing order'))topic='order';
  else if(/^(no|nope)/i.test(input)&&previous?.content.includes('existing order'))return answer('No problem. Standard shipping takes 3–5 business days after dispatch; express takes 1–2. These are estimates.', ['KB-101']);
  else topic=previousTopic;
 }
 const found=lookupOrder(input)||((lastOrder&&['order','returns','changes'].includes(topic))?lookupOrder(lastOrder):null);
 if(/\b(human|person|agent|representative|complaint|fraud|stolen|dispute)\b|duplicate charge|charged twice|two settled|delete my data|can(?:not|'t) access/i.test(input))return answer('I can help get this ready for a specialist. Select **Create handoff** below, and I’ll include our conversation so you won’t need to explain it again. This creates a demo ticket; it doesn’t contact a real support team.',[],true,found?.order.id);
 if(/explain|simpler|what does that mean|don.t understand/i.test(input)&&previous?.sources?.length){
  const id=previous.sources[0];const simple={'KB-101':'Shipping times start after your order leaves the warehouse. Standard delivery usually takes 3–5 business days.', 'KB-102':'Keep the item unused and in its original packaging. Eligible returns must be within 30 days of delivery. Refunds take 5–10 business days after inspection.', 'KB-103':'An order can only be reviewed for changes before fulfillment. Once packed or shipped, it cannot be canceled.', 'KB-104':'A pending authorization is a temporary hold. Two settled charges need a specialist’s review.'};
  if(simple[id])return answer(simple[id],[id]);
 }
 if(found){const {order}=found;
  if(topic==='changes')return answer(order.status==='Processing'?`**${order.id}** is still processing, so a specialist can review a change or cancellation. I can’t make the change here. Select **Create handoff** to create a demo request.`:`**${order.id}** is ${order.status.toLowerCase()}, so it can no longer be canceled. An eligible item can be returned after delivery.`,['KB-103'],order.status==='Processing',order.id);
  if(topic==='returns')return answer(`For **${order.id}**, returns generally require an unused item in its original packaging within **30 days of delivery**. Final-sale items aren’t eligible. I can’t confirm eligibility or issue a refund here. Select **Create handoff** for a demo specialist review.`,['KB-102'],true,order.id);
  if(topic==='order'||numberOnly||!topic)return answer(`**${order.product}** (${order.id}) is **${order.status.toLowerCase()}**. ${order.status==='Delivered'?'Delivered':'Estimated delivery'}: **${order.eta}**. ${order.tracking.startsWith('Not')?'Tracking will be available after dispatch.':`Tracking reference: **${order.tracking}**.`}`,[],false,order.id);
 }
 if(topic==='order')return answer('Let’s check that. What’s your order number? You can try **NS-20481** from the sample orders in this demo.');
 if(topic==='billing'&&/pending|authorization/i.test(input))return answer('A pending payment may be a temporary authorization rather than a settled charge. I can’t inspect your payment account here. If you need an account review, select **Create handoff**.', ['KB-104'],true);
 if(topic==='returns'&&/how long|when.*refund/i.test(input))return answer('Refunds generally reach the original payment method within **5–10 business days after inspection**. I can’t confirm the progress of a real refund here.', ['KB-102']);
 if(topic==='shipping'&&/express/i.test(input))return answer('Express delivery usually takes **1–2 business days after dispatch**. Carrier delays can affect the estimate.', ['KB-101']);
 const ids={shipping:'KB-101',returns:'KB-102',changes:'KB-103',billing:'KB-104',warranty:'KB-105',account:'KB-106'};
 const id=ids[topic];if(id)return answer(conversationalPolicies[id]+(topic==='returns'?' What’s the order number for the item you’d like to return?':''),[id]);
 if(/who are you|are you (?:a bot|human)|what can you do/i.test(input))return answer('I’m Nova, the demo support assistant. I can help with sample orders, shipping, returns, billing, warranty, and technical troubleshooting. What would you like help with?');
 if(/frustrat|angry|upset|annoy|terrible/i.test(input))return answer('That sounds frustrating. Let’s focus on getting you help. What happened?',[],false);
 if(!topic&&previous?.content.includes('I don’t have a verified answer'))return answer('I still don’t have enough verified information to answer that reliably. Select **Create handoff** to save your question and this conversation in a demo ticket.',[],true);
 return answer('I don’t have a verified answer to that in this demo. I can help with orders, returns, shipping, billing, warranty, or technical issues. Which of those is closest to what you need?');
}
