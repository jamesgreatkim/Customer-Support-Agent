export const ticketStatuses = ['Open', 'In progress', 'Resolved'];
export const ticketPriorities = ['Low', 'Normal', 'High', 'Urgent'];
export const ticketAssignees = ['Unassigned', 'You', 'Technical support', 'Billing specialist', 'Sales Specialist', 'Compliance Specialist', 'Customer Success', 'Orders & Shipping', 'Returns & Refunds', 'Account & Security', 'Product Specialist', 'Support Manager'];
const storageKey = 'northstar-demo-tickets-v1';
function generateTicketId() {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return 'DEMO-' + cryptoApi.randomUUID().slice(0,8).toUpperCase();
  }
  return 'DEMO-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2,6).toUpperCase();
}
export function createTicket({messages, customer, id, now = new Date().toISOString()}) {
  id = id || generateTicketId();
  const latest = messages.at(-1);
  const technical = latest?.technical;
  const orderId = [...messages].reverse().find(m => m.orderId)?.orderId || null;
  const issue = technical?.issue || messages.find(m => m.role === 'user')?.content || 'Support request';
  return {id, subject: issue.slice(0,100), summary: issue, customer: {id:customer.id,name:customer.name,email:customer.email}, orderId,
    category: technical ? 'Technical support' : /charg|bill|payment/i.test(issue) ? 'Billing' : 'Customer support',
    status:'Open', priority:'Normal', assignee:'Unassigned', createdAt:now, updatedAt:now, sample:false,
    attempts: (technical?.attempts || []).map(a => ({step:a.step, customerReply:a.customerReply})),
    transcript: messages.map(m => ({role:m.role,content:m.content,time:m.time || ''})), notes:[],
    activity:[{at:now,text:'Nova created this ticket from a customer handoff.'}]};
}
export function updateTicket(ticket, field, value, now = new Date().toISOString()) {
  const options = {status:ticketStatuses,priority:ticketPriorities,assignee:ticketAssignees};
  if (!options[field]?.includes(value) || ticket[field] === value) return ticket;
  return {...ticket,[field]:value,updatedAt:now,activity:[...ticket.activity,{at:now,text:`${field[0].toUpperCase()+field.slice(1)} changed from ${ticket[field]} to ${value}.`}]};
}
export function addTicketNote(ticket, text, now = new Date().toISOString()) {
  const body = text.trim().slice(0,2000);
  if (!body) return ticket;
  return {...ticket,updatedAt:now,notes:[...ticket.notes,{at:now,author:'You',text:body}],activity:[...ticket.activity,{at:now,text:'You added an internal note.'}]};
}
export function filterTickets(tickets, {query='',status='All',priority='All'}={}) {
  const q=query.trim().toLowerCase();
  return tickets.filter(t => (status==='All'||t.status===status) && (priority==='All'||t.priority===priority) &&
    (!q || [t.id,t.subject,t.summary,t.customer.name,t.customer.email,t.orderId||''].join(' ').toLowerCase().includes(q)));
}
export function loadTickets(storage) {
  try {
    const data=JSON.parse(storage.getItem(storageKey) || '[]');
    return Array.isArray(data) ? data.filter(t => typeof t.id==='string' && typeof t.subject==='string' && typeof t.summary==='string' &&
      typeof t.customer?.name==='string' && typeof t.customer?.email==='string' && ticketStatuses.includes(t.status) && ticketPriorities.includes(t.priority) &&
      ticketAssignees.includes(t.assignee) && Array.isArray(t.transcript) && Array.isArray(t.attempts) && Array.isArray(t.notes) && Array.isArray(t.activity)) : [];
  } catch {return [];}
}
export function saveTickets(storage, tickets) {
  try {storage.setItem(storageKey, JSON.stringify(tickets));return true;} catch {return false;}
}
export function sampleTicket(customer) {
  const messages=[{role:'user',content:'My wireless charging pad will not charge my phone.',time:'10:20 AM'},
    {role:'assistant',content:'Check the power adapter and cable, then center the phone on the pad.',time:'10:20 AM'},
    {role:'user',content:'I checked the cable and placement. It still does not charge.',time:'10:21 AM'},
    {role:'assistant',content:'A technical specialist can review the accessory and warranty.',time:'10:21 AM',orderId:'NS-19104',
      technical:{issue:'Wireless charging pad does not charge',attempts:[{step:'Check cable, power adapter, and phone placement.',customerReply:'Cable and placement checked; still does not charge.'}]}}];
  return {...createTicket({messages,customer}),sample:true};
}

export function submitTicketFeedback(ticket, {rating, comment = '', customerId}, now = new Date().toISOString()) {
  const score = Number(rating);
  if (ticket.status !== 'Resolved' || ticket.feedback || customerId !== ticket.customer.id || !Number.isInteger(score) || score < 1 || score > 5) return ticket;
  return {...ticket,updatedAt:now,feedback:{rating:score,comment:String(comment).trim().slice(0,1000),submittedAt:now},
    activity:[...ticket.activity,{at:now,text:`Customer submitted a satisfaction rating of ${score}/5.`}]};
}
export function satisfactionSummary(tickets) {
  const feedback=tickets.map(t=>t.feedback).filter(f=>f && Number.isInteger(f.rating) && f.rating>=1 && f.rating<=5);
  const count=feedback.length;
  return {count,average:count?feedback.reduce((total,f)=>total+f.rating,0)/count:null,
    satisfiedPercent:count?Math.round(feedback.filter(f=>f.rating>=4).length/count*100):null};
}
