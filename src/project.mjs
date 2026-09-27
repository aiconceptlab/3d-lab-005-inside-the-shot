// The portable scene contract is shared by the provider, server, viewer and Blender.
export const ROLES=['body','metal','accent','detail'];
const obj=properties=>({type:'object',additionalProperties:false,required:Object.keys(properties),properties});
const str=(maxLength=300)=>({type:'string',maxLength});
const num=(minimum,maximum)=>({type:'number',minimum,maximum});
const arr=(items,maxItems,minItems=0)=>({type:'array',items,minItems,maxItems});
const vector=(min=-3,max=3)=>arr(num(min,max),3,3);
export const SCENE_SCHEMA=obj({
 title:str(80),summary:str(700),mode:{type:'string',enum:['assembly','exterior','knowledge']},
 scaleBasis:{type:'string',enum:['documented','approximate']},limitations:arr(str(260),8),
 parts:arr(obj({id:{type:'string',pattern:'^[a-z][a-z0-9_]{0,39}$'},label:str(80),description:str(600),aliases:arr(str(40),6),
 evidence:{type:'string',enum:['visible','documented','inferred']},geometryBasis:{type:'string',enum:['source-guided','schematic','none']},
 sources:arr(obj({pageId:str(60),quote:str(300)}),6),anchored:{type:'boolean'},offset:vector(),
 elements:arr(obj({shape:{type:'string',enum:['box','cylinder','sphere','torus']},position:vector(),rotation:vector(-6.284,6.284),size:vector(.002,3),
 role:{type:'string',enum:ROLES},color:{type:'string',pattern:'^#[0-9a-fA-F]{6}$'},metalness:num(0,1),roughness:num(.12,.9)}),24)
 }),24)
});
function check(v,s,p='scene'){
 if(s.type==='object'){
  if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==s.required.length||s.required.some(k=>!Object.hasOwn(v,k)))throw Error(`Invalid fields: ${p}`);
  return Object.fromEntries(s.required.map(k=>[k,check(v[k],s.properties[k],`${p}.${k}`)]));
 }
 if(s.type==='array'){if(!Array.isArray(v)||v.length<s.minItems||v.length>s.maxItems)throw Error(`Invalid list: ${p}`);return v.map((x,i)=>check(x,s.items,`${p}[${i}]`));}
 if(typeof v!==s.type||(s.type==='number'&&(!Number.isFinite(v)||v<s.minimum||v>s.maximum))||(s.enum&&!s.enum.includes(v))||(s.type==='string'&&((s.maxLength&&v.length>s.maxLength)||(s.pattern&&!new RegExp(s.pattern).test(v)))))throw Error(`Invalid value: ${p}`);
 return v;
}
export function validateScene(input,pages=[]){
 const scene=check(input,SCENE_SCHEMA),pageMap=new Map(pages.map(p=>[p.id,p]));
 if(!scene.title.trim())throw Error('Object title is required.');
 const ids=new Set();let count=0;
 for(const part of scene.parts){
  if(ids.has(part.id)||!part.label.trim())throw Error('Part IDs must be unique and labels must be present.');ids.add(part.id);
  count+=part.elements.length;
  if(part.evidence!=='inferred'&&!part.sources.length)throw Error('Visible/documented parts need source references.');
  for(const ref of part.sources){const page=pageMap.get(ref.pageId);if(!page)throw Error('Source citation is not in this project.');
   if(ref.quote&&page.text&&!normalize(page.text).includes(normalize(ref.quote)))throw Error('Quoted text is not on the cited page.');
  }
  if(part.anchored&&part.offset.some(n=>n!==0))throw Error('Anchored parts cannot have explosion offsets.');
  if(scene.mode==='knowledge'&&part.elements.length)throw Error('Knowledge-only projects cannot contain invented geometry.');
  if(scene.mode!=='knowledge'&&!part.elements.length)throw Error('Every visible part needs geometry.');
 }
 if(count>240)throw Error('Scene is too complex for this POC (240 elements maximum).');
 if(scene.mode!=='knowledge'&&!scene.parts.length)throw Error('No renderable parts found.');
 if(scene.mode==='assembly'&&scene.parts.length<2)throw Error('An assembly needs at least two separate parts.');
 // An exterior photo cannot establish a hidden internal assembly.
 if(scene.mode==='assembly'&&pages.length&&!pages.some(p=>p.kind==='pdf'))scene.mode='exterior';
 return scene;
}
const normalize=s=>String(s).toLowerCase().replace(/\s+/g,' ').trim();
export function asManifest(scene){return {...scene,version:1,modelUrl:null,process:null,parts:scene.parts.map((p,i)=>({...p,node:p.id,requires:[],stage:i,role:null}))};}
export const initialAssembly=()=>({mode:'assembled',selected:null,removed:[],flow:false});
export function assemblyAction(state,command,project){
 const next=structuredClone(state),part=project.parts.find(p=>p.id===command.part);
 if(command.action==='assemble')return {state:initialAssembly(),message:'All parts returned to their original positions.'};
 if(command.action==='explode'){
  if(project.mode!=='assembly')return {state,message:'This source supports exterior exploration only. An assembly diagram is needed for a parts reveal.'};
  next.mode='exploded';next.selected=null;next.flow=false;next.removed=project.parts.filter(p=>!p.anchored).map(p=>p.id);
  return {state:next,message:'Named parts separated for a conceptual overview. This is a presentation sequence, not repair instructions.'};
 }
 if(command.action==='flow'&&project.process){next.mode='exploded';next.selected=null;next.flow=true;next.removed=project.parts.filter(p=>!p.anchored).map(p=>p.id);return {state:next,message:project.process.description};}
 if(['focus','explain'].includes(command.action)&&part){next.selected=part.id;next.flow=false;return {state:next,message:part.description,sources:part.sources};}
 return {state,message:'Select a part to read its source-backed description, or ask a question about the uploaded sources.'};
}
export function localCommand(text,project){
 const t=normalize(text);
 if(/\b(reassemble|assemble|reset)\b|back together/.test(t))return {action:'assemble'};
 if(/explode|take.*apart|show.*parts/.test(t))return {action:'explode'};
 if(project.process&&/flow|water|route/.test(t))return {action:'flow'};
 const part=project.parts.find(p=>[p.label,p.id.replaceAll('_',' '),...(p.aliases||[])].some(a=>a.length>2&&t.includes(normalize(a))));
 return part?{action:'focus',part:part.id}:{action:'help'};
}
