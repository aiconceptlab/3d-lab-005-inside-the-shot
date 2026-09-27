import fs from 'node:fs/promises';import path from 'node:path';import {randomUUID,createHash} from 'node:crypto';import {Worker} from 'node:worker_threads';
export const ROOT=path.resolve(import.meta.dirname,'..');
export const DATA=path.resolve(process.env.LAB_DATA_DIR||path.join(ROOT,'data/projects'));
export const ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export function projectDir(id){if(!ID.test(id))throw Error('Invalid project ID.');return path.join(DATA,id);}
export async function saveProject(project){const dir=projectDir(project.id);await fs.mkdir(dir,{recursive:true});project.updatedAt=new Date().toISOString();const file=path.join(dir,'project.json'),tmp=path.join(dir,'project-'+randomUUID()+'.tmp');await fs.writeFile(tmp,JSON.stringify(project,null,2));await fs.rename(tmp,file);return project;}
export async function readProject(id){return JSON.parse(await fs.readFile(path.join(projectDir(id),'project.json'),'utf8'));}
export async function listProjects(){await fs.mkdir(DATA,{recursive:true});const entries=await fs.readdir(DATA);const projects=await Promise.all(entries.filter(x=>ID.test(x)).map(async id=>{try{return await readProject(id);}catch{return null;}}));return projects.filter(Boolean).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
export function detectFile(data){
 if(data.subarray(0,5).toString()==='%PDF-')return {kind:'pdf',extension:'.pdf',type:'application/pdf'};
 if(data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return {kind:'image',extension:'.png',type:'image/png'};
 if(data[0]===255&&data[1]===216&&data[2]===255)return {kind:'image',extension:'.jpg',type:'image/jpeg'};
 if(data.subarray(0,4).toString()==='RIFF'&&data.subarray(8,12).toString()==='WEBP')return {kind:'image',extension:'.webp',type:'image/webp'};
 throw Error('Unsupported file contents. Upload a PNG, JPEG, WebP or PDF.');
}
export async function ingestFiles(files){
 if(!Array.isArray(files)||files.length<1||files.length>4)throw Error('Upload 1–4 files.');
 let total=0;const validated=files.map(file=>{
  if(!file||typeof file.name!=='string'||file.name.length>180||typeof file.data!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(file.data))throw Error('Invalid upload.');
  const data=Buffer.from(file.data,'base64');total+=data.length;
  if(!data.length||data.length>8*1024*1024||total>12*1024*1024)throw Error('Use files under 8 MB, up to 12 MB total.');
  const detected=detectFile(data);return {...detected,data,name:path.basename(file.name.replaceAll('\\','/')).replace(/[\x00-\x1f]/g,'')||'Source',hash:createHash('sha256').update(data).digest('hex')};
 });
 const project={id:randomUUID(),title:'Untitled object',status:'ingesting',createdAt:new Date().toISOString(),sources:[],pages:[],analysis:null,manifest:null,job:null,attempts:0,build:null};
 const dir=projectDir(project.id);await fs.mkdir(path.join(dir,'sources'),{recursive:true});await fs.mkdir(path.join(dir,'pages'),{recursive:true});
 try{for(let i=0;i<validated.length;i++){
  const file=validated[i],id=`source-${i+1}`,stored=id+file.extension;await fs.writeFile(path.join(dir,'sources',stored),file.data);
  const pages=await processFile({filePath:path.join(dir,'sources',stored),outDir:path.join(dir,'pages'),id,name:file.name,kind:file.kind});
  if(project.pages.length+pages.length>24)throw Error('Upload at most 24 pages/images in total.');
  project.sources.push({id,name:file.name,stored,type:file.type,hash:file.hash,size:file.data.length});project.pages.push(...pages);
 }project.status='uploaded';return await saveProject(project);
 }catch(e){project.status='failed';project.error=e.message;await saveProject(project);throw e;}
}
function processFile(workerData){return new Promise((resolve,reject)=>{
 const worker=new Worker(new URL('./ingest-worker.mjs',import.meta.url),{workerData,execArgv:[],resourceLimits:{maxOldGenerationSizeMb:384}});
 const timer=setTimeout(()=>{worker.terminate();reject(Error('Document processing timed out. Try a smaller PDF.'));},45000);
 worker.once('message',value=>{clearTimeout(timer);worker.terminate();value.error?reject(Error(value.error)):resolve(value.pages);});worker.once('error',e=>{clearTimeout(timer);reject(Error('Could not process this document: '+e.message));});
 worker.once('exit',code=>{clearTimeout(timer);if(code!==0)reject(Error('Document processing did not complete.'));});
});}
export function publicProject(project){return {...project,pages:project.pages.map(p=>({...p,url:`/api/projects/${project.id}/pages/${p.image}`})),sources:project.sources.map(s=>({...s,url:`/api/projects/${project.id}/sources/${s.stored}`}))};}
