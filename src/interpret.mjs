import {ACTIONS,validateCommand} from './manual.mjs';
export async function interpret(text,parts,{apiKey=process.env.OPENAI_API_KEY,model=process.env.OPENAI_MODEL,fetcher=fetch}={}){
 if(typeof text!=='string'||!text.trim()||text.length>1200)throw Error('Enter 1–1200 characters.');
 if(!apiKey||!model)throw Error('Live language mode is not configured. Use prepared commands.');
 const response=await fetcher('https://api.openai.com/v1/responses',{method:'POST',signal:AbortSignal.timeout(30000),headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model,store:false,max_output_tokens:150,instructions:'Map a request about the fictional ARC coffee machine to ONE allowed scene action. Never invent geometry, specifications or maintenance advice. Unsupported requests map to help. A user asking to remove a part must map to remove, never explode: the local dependency engine decides if removal is possible. Part IDs: '+parts.map(p=>`${p.id} (${p.label})`).join(', '),input:text,text:{format:{type:'json_schema',name:'scene_command',strict:true,schema:{type:'object',additionalProperties:false,required:['action','part'],properties:{action:{type:'string',enum:ACTIONS},part:{anyOf:[{type:'string',enum:parts.map(p=>p.id)},{type:'null'}]}}}}}})});
 if(!response.ok)throw Error('Language service unavailable. Try the prepared commands.');
 const data=await response.json();const raw=data.output?.flatMap(o=>o.content??[]).find(c=>c.type==='output_text')?.text;
 if(!raw)throw Error('No scene command was returned.');
 return validateCommand(JSON.parse(raw),parts);
}
