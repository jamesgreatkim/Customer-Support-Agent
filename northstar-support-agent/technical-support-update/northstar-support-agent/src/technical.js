// Guided demo diagnostics. State is reconstructed from user turns so browser
// fallback and the serverless endpoint follow the same steps.
export const technicalTopics = {
  connection: {title:'Device connectivity',source:'KB-107',steps:[
    'Check that the device is powered on and charged, and that Bluetooth is enabled on your phone or computer. Keep the devices nearby. What device and operating system are you using, and does the device appear in your Bluetooth list?',
    'Restart the accessory and toggle Bluetooth off and on on your phone or computer. Close and reopen the companion app, if you use one. Try connecting again. Does it connect now?',
    'If you have previously paired this accessory, remove only that accessory from the Bluetooth list, then pair it again using its manufacturer’s instructions. Check whether it is already connected to another device. What happens when you retry?'
  ]},
  login: {title:'Login troubleshooting',source:'KB-108',steps:[
    'Check that you are using the intended account email and review the sign-in error. Never share your password, recovery codes, or verification codes here. What does the error message say?',
    'Try the official sign-in page in a private browser window or another browser. If the password is rejected, use the official Forgot password option. Does sign-in work now?',
    'Check for a password-reset email in spam or junk folders if you requested one. If you are locked out, cannot receive a verification code, or need account verification, a human specialist must review access. Did the official reset or alternate browser resolve it?'
  ]},
  app: {title:'App and error troubleshooting',source:'KB-109',steps:[
    'Save any work, then close and reopen the app or refresh the page. What app or page is affected, what is the exact error message, and what device or browser are you using? Leave out personal information.',
    'Check your internet connection and try the page in a private window or another browser. Install an available app update from the official store if applicable. Does the same error still appear?',
    'Record the error code, the action that triggers it, and the steps you tried. Avoid reinstalling, clearing app data, or factory-resetting a device unless its official instructions explain the effects and your data is backed up. Did the previous checks resolve the issue?'
  ]}
};
const resolved=/\b(fixed|resolved|working now|works now|connected now|it works|that worked)\b/i;
const human=/\b(human|person|specialist|representative|agent)\b/i;
const otherTopic=/\b(order|shipping|delivery|return|refund|billing|charge|warranty)\b|NS[- ]?\d{5}/i;
function detect(input){
  if(/login|log[ -]?in|sign[ -]?in|password|locked out|verification code|account access/i.test(input))return 'login';
  if(/bluetooth|wi-?fi|connectivity|device.*connect|connect.*device|pair(?:ing)?|device won.t/i.test(input))return 'connection';
  if(/app.*(crash|error|load|freeze)|error code|error message|page.*load|troubleshoot.*error|app and error/i.test(input))return 'app';
  return null;
}
function advance(input, state){
  const topic=detect(input);
  const generic=/technical support|technical help|troubleshooting|tech support/i.test(input);
  if(otherTopic.test(input)&&!topic)return {state:null,result:null};
  if(!state&&!topic&&!generic)return {state:null,result:null};
  if(state?.done&&!topic&&!generic)return {state:null,result:null};
  if(!topic&&!state?.topic){
    if(generic||state?.choose)return {state:{choose:true},result:{reply:'I can guide you through **technical support**. Which issue are you having: **device connectivity**, **login**, or an **app error**? These are general demo checks; I cannot inspect your device or account.',sources:[],escalate:false}};
    return {state:null,result:null};
  }
  const nextTopic=topic||state.topic;
  const current=state?.topic===nextTopic?state:{topic:nextTopic,step:0,attempts:[],issue:input};
  const info=technicalTopics[nextTopic];
  const attempts=[...current.attempts];
  if(human.test(input)||/locked out|cannot receive|can.t receive|compromised|hacked/i.test(input)){
    return finish(current,info,attempts,'This requires a human specialist to review access or continue troubleshooting.');
  }
  if(resolved.test(input)&&state?.topic){return {state:{...current,done:true},result:{reply:`Glad that resolved it. We worked through **${info.title.toLowerCase()}**. You can start another support question whenever you need.`,sources:[info.source],escalate:false,technical:{...current,status:'resolved'}}};}
  if(current.done)return {state:current,result:{reply:'The technical handoff is ready. Select **Create handoff** below to preserve the issue and troubleshooting context. No real specialist is contacted in this demo.',sources:[info.source],escalate:true,technical:{...current,status:'escalated'}}};
  let step=current.step;
  // First turn presents the first check. Each subsequent troubleshooting
  // reply records the previous check and advances one bounded step.
  if(state?.topic===nextTopic&&!generic){
    attempts.push({step:info.steps[step],customerReply:input});
    if(step>=info.steps.length-1)return finish(current,info,attempts,'The guided checks are complete. I cannot verify or repair the device from here.');
    step++;
  }
  const next={topic:nextTopic,step,attempts,issue:current.issue};
  return {state:next,result:{reply:`**${info.title} · Check ${step+1} of ${info.steps.length}**\n\n${info.steps[step]}\n\n${step===0?'These are general demo checks. ':''}Tell me the result, or say **“still not working”**, **“resolved”**, or **“human”**.`,sources:[info.source],escalate:false,technical:{...next,status:'in-progress'}}};
}
function finish(current, info, attempts, reason){const next={...current,attempts,done:true};return {state:next,result:{reply:`${reason} I can prepare a **technical support handoff** with your issue and the checks attempted. Select **Create handoff** below. This demo does not contact a real support team.`,sources:[info.source],escalate:true,technical:{...next,status:'escalated'}}};}
export function respondTechnical(input,history=[]){
  const previous=[...history];
  // The caller may include the newly submitted user message in history.
  if(previous.at(-1)?.role==='user'&&previous.at(-1)?.content===input)previous.pop();
  let state=null;
  for(const message of previous){if(message.role==='user')state=advance(message.content,state).state;}
  return advance(input,state).result;
}
