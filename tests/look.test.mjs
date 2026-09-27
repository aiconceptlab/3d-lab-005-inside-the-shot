import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {LOOKS,validateLook,finishRole} from '../src/look.mjs';
import {generateLook} from '../src/generate-look.mjs';
test('material roles match the actual GLB; every preset is a valid independent recipe',async()=>{
 const b=await fs.readFile(new URL('../public/model/arc.glb',import.meta.url));const glb=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());
 assert.deepEqual(new Set(glb.materials.map(m=>finishRole(m.name)).filter(Boolean)),new Set(['body','metal','accent','detail']));
 assert.equal(finishRole('Dial ink'),null);assert.equal(finishRole('EPDM black rubber'),null);
 for(const recipe of Object.values(LOOKS)){const copy=validateLook(recipe);assert.deepEqual(copy,recipe);copy.finishes.body.color='#000000';assert.notEqual(recipe.finishes.body.color,copy.finishes.body.color);}
});
test('untrusted recipes reject executable strings, extra fields, missing roles, NaN and unbounded lights',()=>{
 for(const mutate of [r=>r.finishes.body.color='url(https://example.com)',r=>r.lighting.keyIntensity=99999,r=>r.lighting.exposure=NaN,r=>r.lighting.azimuth=-90,r=>r.finishes.metal.roughness=0,r=>r.script='alert(1)',r=>delete r.finishes.detail,r=>r.name='',r=>r.description='x'.repeat(241)]){
  const recipe=structuredClone(LOOKS.ivory);mutate(recipe);assert.throws(()=>validateLook(recipe));
 }
});
test('AI design calls Responses with a strict schema, no storage and validated settings',async()=>{
 let request;const result=await generateLook('Ivory ceramic and warm brass',{apiKey:'test-fixture',model:'fixture-model',fetcher:async(url,options)=>{assert.equal(url,'https://api.openai.com/v1/responses');request=JSON.parse(options.body);return {ok:true,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(LOOKS.ivory)}]}]})};}});
 assert.equal(request.store,false);assert.equal(request.text.format.strict,true);assert.equal(request.input,'Ivory ceramic and warm brass');assert.deepEqual(result,LOOKS.ivory);
});
test('AI failures, refusals, incomplete output and invalid settings fail without an applicable recipe',async()=>{
 const options={apiKey:'test-fixture',model:'fixture-model'};
 for(const payload of [{status:'incomplete'},{output:[{content:[{type:'refusal',refusal:'No'}]}]},{output:[{content:[{type:'output_text',text:'{"script":"do something"}'}]}]},{output:[{content:[{type:'output_text',text:'not JSON'}]}]}]){
  await assert.rejects(generateLook('Make it brass',{...options,fetcher:async()=>({ok:true,json:async()=>payload})}),/unchanged/);
 }
 await assert.rejects(generateLook('x',{...options,fetcher:async()=>({ok:false})}),/unchanged/);
 await assert.rejects(generateLook('x',{...options,fetcher:async()=>{throw Error('private upstream details');}}),/could not connect/);
 await assert.rejects(generateLook('x',{apiKey:'',model:'',fetcher:()=>assert.fail('No request without a key')}),/not configured/);
});
