import fs from 'node:fs/promises';import path from 'node:path';import {randomUUID} from 'node:crypto';import {zipSync,strToU8} from 'fflate';
import {ROOT,projectDir,readProject,saveProject,listProjects,ingestFiles,publicProject} from './store.mjs';
import {SCENE_SCHEMA,validateScene,asManifest} from '../src/project.mjs';import {analyzeSources,answerSources,assistedInstructions} from './vision.mjs';import {buildBlender} from './build.mjs';
export const EXAMPLES=[{id:'chair',title:'FORM / Lounge chair',description:'9 named parts · Illustrated manual',image:'/samples/chair/assembled.png'},{id:'fan',title:'BREEZE / Desk fan',description:'7 named parts · Illustrated manual',image:'/samples/fan/assembled.png'},{id:'arc',title:'ARC / Espresso machine',description:'14 prepared assemblies · Original lab demo',image:'/model/assembled.png'}];
export function createLabApi({live,analyzer=analyzeSources,builder=buildBlender,answerer=answerSources}={}){
 const active=new Set();let ingesting=false,providerBusy=false;
 const recovery=(async()=>{for(const p of await listProjects())if(['analyzing','building'].includes(p.status)){p.status=p.analysis?'review':'uploaded';p.job={...p.job,status:'interrupted',message:'Previous work was interrupted. Check provider usage before explicitly retrying.'};await saveProject(p);}})();
 async function launch(project,stage,work){active.add(project.id);project.status=stage;project.error=null;project.job={id:randomUUID(),stage,status:'running',startedAt:new Date().toISOString()};try{await saveProject(project);}catch(e){active.delete(project.id);throw e;}
  void(async()=>{try{await work(project);project.job.status='completed';}catch(e){project.status=project.analysis?'review':'uploaded';project.error=e.message;project.job.status='failed';project.job.message=e.message;}finally{project.job.finishedAt=new Date().toISOString();try{await saveProject(project);}catch(error){console.error('Could not save project status:',project.id,error.code||'write error');}finally{active.delete(project.id);}}})();return project;
 }
 return async(req,res,pathname,{readJson,send})=>{
  await recovery;
  if(pathname==='/api/examples'&&req.method==='GET')return send(200,EXAMPLES);
  if(pathname.startsWith('/api/examples/')&&req.method==='POST'){
   const slug=pathname.split('/')[3];if(!EXAMPLES.some(e=>e.id===slug))return send(404,{error:'Example not found.'});return send(201,publicProject(await createExample(slug)));
  }
  if(pathname==='/api/projects'){
   if(req.method==='GET')return send(200,(await listProjects()).map(p=>({id:p.id,title:p.title,status:p.status,updatedAt:p.updatedAt,sample:p.sample||null})));
   if(req.method==='POST'){
    if(ingesting)return send(429,{error:'Another upload is processing. Please wait.'});ingesting=true;
    try{return send(201,publicProject(await ingestFiles((await readJson(18*1024*1024)).files)));}finally{ingesting=false;}
   }
  }
  const match=pathname.match(/^\/api\/projects\/([^/]+)(?:\/(.*))?$/);if(!match)return send(404,{error:'Unknown project route.'});
  const [,id,action='']=match;let p=await readProject(id);
  if(req.method==='GET'){
   if(!action)return send(200,publicProject(p));
   if(action==='export'||action==='assistant-package'){
    const files={'project.json':strToU8(JSON.stringify(p,null,2)),'scene-schema.json':strToU8(JSON.stringify(SCENE_SCHEMA,null,2)),'ASSISTANT-INSTRUCTIONS.txt':strToU8(assistedInstructions(p))};
    if(p.analysis)files['scene.json']=strToU8(JSON.stringify(p.analysis,null,2));
    for(const source of p.sources)files['sources/'+source.stored]=new Uint8Array(await fs.readFile(path.join(projectDir(id),'sources',source.stored)));
    for(const page of p.pages)files['pages/'+page.image]=new Uint8Array(await fs.readFile(path.join(projectDir(id),'pages',page.image)));
    if(p.build)for(const name of ['model.glb','model.blend'])try{files[name]=new Uint8Array(await fs.readFile(path.join(projectDir(id),'build',name)));}catch{}
    const zip=zipSync(files,{level:5});res.writeHead(200,{'Content-Type':'application/zip','Content-Disposition':`attachment; filename="inside-anything-${id.slice(0,8)}.zip"`});res.end(zip);return;
   }
   const f=action.match(/^(sources|pages|build)\/([a-zA-Z0-9_.-]+)$/);if(f){const [,folder,name]=f;
    const allowed=folder==='sources'?p.sources.some(x=>x.stored===name):folder==='pages'?p.pages.some(x=>x.image===name):p.build&&['model.glb','model.blend','assembled.png','exploded.png'].includes(name);
    if(!allowed)return send(404,{error:'Asset not found.'});const data=await fs.readFile(path.join(projectDir(id),folder,name));
    const type=folder==='sources'?p.sources.find(x=>x.stored===name).type:name.endsWith('.png')?'image/png':name.endsWith('.glb')?'model/gltf-binary':'application/octet-stream';
    res.writeHead(200,{'Content-Type':type,'Cache-Control':'private, no-store'});res.end(data);return;
   }return send(404,{error:'Not found.'});
  }
  if(req.method!=='POST')return send(405,{error:'Unsupported method.'});
  if(active.has(id))return send(409,{error:'This project is already processing.'});
  const body=await readJson(500000);
  p=await readProject(id);
  if(active.has(id))return send(409,{error:'This project is already processing.'});
  if(action==='analyze'){
   if(!p.pages.length)return send(400,{error:'Upload usable source pages before requesting analysis.'});
   if(p.analysis&&!body.retry)return send(200,publicProject(p));
   if(!live)return send(503,{error:'AI analysis needs OPENAI_API_KEY and a vision-capable model. Download the assistant package to use connected MCP tools instead.'});
   if(!body.budgetConfirmed)return send(400,{error:'Confirm the single paid analysis request first.'});
   if(p.attempts>=Number(process.env.MAX_SOURCE_CALLS_PER_PROJECT||2))return send(429,{error:'This project reached its analysis-call budget. Reuse/import a scene or increase MAX_SOURCE_CALLS_PER_PROJECT deliberately.'});
   if(providerBusy)return send(429,{error:'A provider request is already running.'});providerBusy=true;p.attempts++;
   try{p=await launch(p,'analyzing',async project=>{try{const result=await analyzer(project);project.analysis=validateScene(result.scene,project.pages);project.provenance=result.provenance;project.title=project.analysis.title;project.status='review';}finally{providerBusy=false;}});}catch(e){providerBusy=false;throw e;}
   return send(202,publicProject(p));
  }
  if(action==='import-scene'){
   p.analysis=validateScene(body.scene,p.pages);p.title=p.analysis.title;p.provenance={provider:'Assistant import',createdAt:new Date().toISOString()};p.status='review';p.error=null;p.manifest=null;p.build=null;p.buildWarning=null;return send(200,publicProject(await saveProject(p)));
  }
  if(action==='review'){
   if(!p.analysis)throw Error('Analyze or import a scene first.');
   if(typeof body.title!=='string'||!body.title.trim()||body.title.length>80)throw Error('Use a title under 80 characters.');
   if(!Array.isArray(body.parts)||body.parts.length!==p.analysis.parts.length)throw Error('Review must include all parts.');
   const edits=new Map(body.parts.map(x=>[x.id,x.label]));if(edits.size!==body.parts.length)throw Error('Duplicate part edits.');
   const updated={...p.analysis,title:body.title,parts:p.analysis.parts.map(part=>({...part,label:edits.get(part.id)}))};p.analysis=validateScene(updated,p.pages);p.title=p.analysis.title;return send(200,publicProject(await saveProject(p)));
  }
  if(action==='build'){
   if(!p.analysis)throw Error('Analyze or import a scene first.');
   p=await launch(p,'building',async project=>{
    project.manifest=asManifest(validateScene(project.analysis,project.pages));project.build=null;project.buildWarning=null;
    if(project.analysis.mode!=='knowledge')try{project.build=await builder(project);if(project.build)project.manifest.modelUrl=project.build.glb;}catch(e){project.buildWarning=e.message;}
    project.status='ready';
   });return send(202,publicProject(p));
  }
  if(action==='ask'){
   if(!live)return send(503,{error:'Use the part descriptions and source pages, or configure live AI questions.'});
   if(!p.manifest||typeof body.text!=='string'||!body.text.trim()||body.text.length>1200)throw Error('Enter a question for a ready project.');
   if(providerBusy)return send(429,{error:'A provider request is already running.'});providerBusy=true;
   try{return send(200,await answerer(body.text,p));}finally{providerBusy=false;}
  }
  return send(404,{error:'Unknown action.'});
 };
}
async function createExample(slug){
 const p={id:randomUUID(),title:'',status:'ready',createdAt:new Date().toISOString(),sources:[],pages:[],analysis:null,manifest:null,job:null,attempts:0,build:null,sample:slug,provenance:{provider:'Prepared example',createdAt:new Date().toISOString()}};
 const dir=projectDir(p.id);await fs.mkdir(dir,{recursive:true});
 if(slug==='arc'){
  const parts=JSON.parse(await fs.readFile(path.join(ROOT,'public/model/parts.json'),'utf8')).map((x,i)=>({...x,node:x.id,aliases:[x.label.toLowerCase()],anchored:x.id==='chassis',stage:i,evidence:'inferred',geometryBasis:'schematic',sources:[],elements:[]}));
  p.title='ARC / Espresso machine';p.manifest={version:1,title:p.title,summary:'The original authored espresso-machine concept. Its internal geometry is prepared, not recovered from a photograph.',mode:'assembly',scaleBasis:'approximate',limitations:['Prepared fictional assembly; no uploaded manufacturer evidence.'],parts,modelUrl:'/model/arc.glb',process:{ids:['reservoir','pump','boiler','brew_group'],anchors:[[-.086,.18,-.09],[-.086,.125,.005],[.066,.25,-.041],[0,.275,.155]],description:'An illustrated reservoir → pump → heater → brew-group route; no fluid simulation.'}};
 }else{
  const src=path.join(ROOT,'public/samples',slug);p.pages=JSON.parse(await fs.readFile(path.join(src,'pages.json'),'utf8'));await fs.cp(path.join(src,'pages'),path.join(dir,'pages'),{recursive:true});await fs.mkdir(path.join(dir,'sources'));await fs.copyFile(path.join(src,'manual.pdf'),path.join(dir,'sources/source-1.pdf'));
  p.sources=[{id:'source-1',name:slug+'-manual.pdf',stored:'source-1.pdf',type:'application/pdf'}];p.analysis=validateScene(JSON.parse(await fs.readFile(path.join(src,'scene.json'),'utf8')),p.pages);p.title=p.analysis.title;p.manifest=asManifest(p.analysis);p.manifest.modelUrl=`/samples/${slug}/model.glb`;
 }
 const assetRoot=slug==='arc'?path.join(ROOT,'public/model'):path.join(ROOT,'public/samples',slug);
 await fs.mkdir(path.join(dir,'build'),{recursive:true});
 for(const [from,to] of [[slug==='arc'?'arc.glb':'model.glb','model.glb'],[slug==='arc'?'arc.blend':'model.blend','model.blend'],['assembled.png','assembled.png'],['exploded.png','exploded.png']])await fs.copyFile(path.join(assetRoot,from),path.join(dir,'build',to));
 p.build={glb:`/api/projects/${p.id}/build/model.glb`,blend:`/api/projects/${p.id}/build/model.blend`,preview:`/api/projects/${p.id}/build/assembled.png`};p.manifest.modelUrl=p.build.glb;
 return saveProject(p);
}
