import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'inside-anything-test-'));process.env.LAB_DATA_DIR=tmp;
const {createServer}=await import('../server.mjs');const {validateScene,asManifest,assemblyAction,initialAssembly}=await import('../src/project.mjs');
const chair=JSON.parse(await fs.readFile(new URL('../public/samples/chair/scene.json',import.meta.url)));const pages=JSON.parse(await fs.readFile(new URL('../public/samples/chair/pages.json',import.meta.url)));
test.after(async()=>{await fs.rm(tmp,{recursive:true,force:true});});
test('scene validation rejects unknown evidence, executable fields, over-budget geometry and duplicate IDs',()=>{
 const good=validateScene(chair,pages);assert.equal(good.parts.length,9);
 for(const corrupt of [s=>s.parts[0].sources[0].pageId='another-project',s=>s.parts[0].sources[0].quote='unsupported quotation',s=>s.parts[0].elements[0].code='exec()',s=>s.parts[0].elements[0].size[0]=999,s=>s.parts[1].id=s.parts[0].id,s=>s.parts[0].offset=[1,0,0]]){const s=structuredClone(chair);corrupt(s);assert.throws(()=>validateScene(s,pages));}
 assert.equal(chair.parts[0].offset[0],0);
});
test('photo-only sources cannot unlock explosion; knowledge mode cannot invent geometry',()=>{
 const scene=validateScene(chair,pages.map(p=>({...p,kind:'image'})));assert.equal(scene.mode,'exterior');const initial=initialAssembly();assert.deepEqual(assemblyAction(initial,{action:'explode'},asManifest(scene)).state,initial);
 const knowledge={...structuredClone(chair),mode:'knowledge'};assert.throws(()=>validateScene(knowledge,pages));knowledge.parts.forEach(p=>p.elements=[]);assert.equal(validateScene(knowledge,pages).mode,'knowledge');
});
test('prepared chair and fan GLBs contain every semantic group and material roles',async()=>{
 for(const slug of ['chair','fan']){const root=new URL('../public/samples/'+slug+'/',import.meta.url),spec=JSON.parse(await fs.readFile(new URL('scene.json',root))),b=await fs.readFile(new URL('model.glb',root));assert.equal(b.toString('utf8',0,4),'glTF');const json=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));for(const p of spec.parts)assert.ok(json.nodes.some(n=>n.name===p.id));assert.ok(json.meshes.length>=spec.parts.length);assert.ok(json.materials.every(m=>/body|metal|accent|detail/.test(m.name)));}
});
test('upload → evidence import → review → build → export stays project-scoped, with no paid calls',async()=>{
 let paid=0;const port=3112,server=createServer({port,live:false,labOptions:{builder:async()=>null,analyzer:()=>{paid++;throw Error('Must not call');}}});await new Promise(r=>server.listen(port,'127.0.0.1',r));const base='http://127.0.0.1:'+port;
 const post=(route,body)=>fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 try{
  assert.equal((await post('/api/projects',{files:[{name:'pretend.pdf',data:Buffer.from('<script>').toString('base64')}]})).status,400);
  const data=(await fs.readFile(new URL('../public/samples/chair/manual.pdf',import.meta.url))).toString('base64');const upload=await post('/api/projects',{files:[{name:'../../chair.pdf',data}]});assert.equal(upload.status,201);const p=await upload.json();assert.equal(p.status,'uploaded');assert.equal(p.sources[0].name,'chair.pdf');assert.equal(p.pages.length,2);assert.ok(p.pages[0].text.includes('Seat'));
  const root='/api/projects/'+p.id;
  assert.equal((await post(root+'/analyze',{budgetConfirmed:true})).status,503);
  const imported=await post(root+'/import-scene',{scene:chair});assert.equal(imported.status,200);assert.equal((await imported.json()).manifest,null);
  const renamed=chair.parts.map(x=>({id:x.id,label:x.label}));renamed[0].label='Reviewed seat';assert.equal((await post(root+'/review',{title:'My chair',parts:renamed})).status,200);
  assert.equal((await post(root+'/build',{})).status,202);let ready;for(let i=0;i<60;i++){ready=await(await fetch(base+root)).json();if(ready.status==='ready')break;await new Promise(r=>setTimeout(r,20));}assert.equal(ready.status,'ready');assert.equal(ready.manifest.parts[0].label,'Reviewed seat');assert.equal(ready.manifest.modelUrl,null);
  assert.equal((await fetch(base+p.pages[0].url)).headers.get('content-type'),'image/png');assert.equal((await fetch(base+root+'/pages/not-a-page.png')).status,404);
  assert.equal((await fetch(base+root+'/export')).headers.get('content-type'),'application/zip');assert.equal(paid,0);
  const example=await(await post('/api/examples/fan',{})).json();assert.notEqual(example.id,p.id);assert.equal(example.manifest.parts.length,7);assert.equal((await fetch(base+root+'/build/model.blend')).status,404);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
test('concurrent analysis is single-flight, retry budget persists, provider failure never auto-retries',async()=>{
 let release,started,calls=0;const signal=new Promise(r=>started=r);const port=3113,server=createServer({port,live:true,labOptions:{analyzer:async()=>{calls++;started();await new Promise(r=>release=r);throw Error('Provider unavailable');}}});await new Promise(r=>server.listen(port,'127.0.0.1',r));const base='http://127.0.0.1:'+port,post=(url,body)=>fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 try{const example=await(await post('/api/examples/chair',{})).json(),root='/api/projects/'+example.id;assert.equal((await post(root+'/analyze',{retry:true,budgetConfirmed:false})).status,400);assert.equal((await post(root+'/analyze',{retry:true,budgetConfirmed:true})).status,202);await signal;assert.equal((await post(root+'/analyze',{retry:true,budgetConfirmed:true})).status,409);release();let p;for(let i=0;i<60;i++){p=await(await fetch(base+root)).json();if(p.job.status==='failed')break;await new Promise(r=>setTimeout(r,20));}assert.equal(p.job.status,'failed');assert.equal(p.attempts,1);assert.equal(calls,1);assert.equal(p.error,'Provider unavailable');}finally{release?.();server.closeAllConnections();await new Promise(r=>server.close(r));}
});


test('vision integration sends rendered evidence with strict output and validates returned citations',async()=>{
 const {ingestFiles}=await import('../server/store.mjs');const {analyzeSources,answerSources}=await import('../server/vision.mjs');
 const image=(await fs.readFile(new URL('../public/samples/chair/assembled.png',import.meta.url))).toString('base64');const p=await ingestFiles([{name:'chair.png',data:image}]);
 const sourceScene=structuredClone(chair);for(const part of sourceScene.parts){part.evidence='visible';part.sources=[{pageId:p.pages[0].id,quote:''}];}let calls=0;
 const options={apiKey:'fixture-key-not-a-real-secret',model:'fixture-model',fetcher:async(url,req)=>{calls++;const body=JSON.parse(req.body);assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(body.store,false);assert.equal(body.text.format.strict,true);assert.ok(body.input[0].content.some(c=>c.type==='input_image'&&c.image_url.startsWith('data:image/png;base64,')));return new Response(JSON.stringify({id:'fixture-response',status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(sourceScene)}]}]}),{headers:{'x-request-id':'fixture-request'}});}};
 const result=await analyzeSources(p,options);assert.equal(result.scene.mode,'exterior');assert.equal(result.provenance.requestId,'fixture-request');assert.equal(calls,1);
 const fail={...options,fetcher:async()=>new Response('{}',{status:429})};await assert.rejects(analyzeSources(p,fail),/429/);
 const incomplete={...options,fetcher:async()=>new Response(JSON.stringify({status:'incomplete'}))};await assert.rejects(analyzeSources(p,incomplete),/incomplete/);
 p.analysis=result.scene;p.manifest=asManifest(result.scene);
 const answer={...options,fetcher:async()=>new Response(JSON.stringify({output:[{content:[{type:'output_text',text:JSON.stringify({answer:'The cushion rests on the seat.',part:'cushion',pageIds:[p.pages[0].id]})}]}]}))};assert.equal((await answerSources('Where is the cushion?',p,answer)).part,'cushion');
 answer.fetcher=async()=>new Response(JSON.stringify({output:[{content:[{type:'output_text',text:JSON.stringify({answer:'Invented',part:'nonexistent',pageIds:['foreign-page']})}]}]}));await assert.rejects(answerSources('Question',p,answer),/Invalid sourced answer/);
});
