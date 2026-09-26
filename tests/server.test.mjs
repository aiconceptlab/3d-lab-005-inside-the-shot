import test from 'node:test';import assert from 'node:assert/strict';import {createServer} from '../server.mjs';
import {LOOKS} from '../src/look.mjs';
async function fixture(fn){const server=createServer({port:3099,live:true,ai:async()=>({action:'remove',part:'pump'})});await new Promise(r=>server.listen(3099,'127.0.0.1',r));try{await fn('http://127.0.0.1:3099');}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}}
test('HTTP rejects cross-origin, oversized and malformed calls; supports one validated request',()=>fixture(async base=>{
 assert.equal((await fetch(base+'/api/config',{headers:{Origin:'https://example.com'}})).status,403);
 assert.equal((await fetch(base+'/api/interpret',{method:'POST',headers:{'Content-Type':'text/plain'},body:'x'})).status,415);
 assert.equal((await fetch(base+'/api/interpret',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'})).status,400);
 assert.equal((await fetch(base+'/api/interpret',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'x'.repeat(10000)})})).status,413);
 const response=await fetch(base+'/api/interpret',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'remove the pump'})});assert.equal(response.status,200);assert.deepEqual(await response.json(),{action:'remove',part:'pump'});
 assert.equal((await fetch(base+'/api/interpret',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"text":"x"}'})).status,429);
 assert.equal((await fetch(base+'/.env')).status,404);assert.equal((await fetch(base+'/%2e%2e%5c.env')).status,404);
}));
test('design endpoint validates data, shares concurrency limits and never exposes configuration secrets',async()=>{
 let finish,started;const pending=new Promise(r=>started=r);let calls=0;
 const server=createServer({port:3100,live:true,designer:async()=>{calls++;started();return new Promise(r=>finish=r);}});
 await new Promise(r=>server.listen(3100,'127.0.0.1',r));const base='http://127.0.0.1:3100';
 const post=text=>fetch(base+'/api/design',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});
 try{
  assert.deepEqual(await(await fetch(base+'/api/config')).json(),{live:true,design:true});
  assert.equal((await post('')).status,400);assert.equal((await post('x'.repeat(1201))).status,400);
  assert.equal((await fetch(base+'/api/design',{method:'POST',headers:{Origin:'https://example.com','Content-Type':'application/json'},body:'{"text":"ivory"}'})).status,403);
  const first=post('Ivory ceramic');await pending;
  assert.equal((await post('Blue')).status,429);
  assert.equal((await fetch(base+'/api/interpret',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"text":"explode"}'})).status,429);
  finish(LOOKS.ivory);const result=await first;assert.equal(result.status,200);assert.deepEqual(await result.json(),LOOKS.ivory);assert.equal(calls,1);
 }finally{finish?.(LOOKS.ivory);server.closeAllConnections();await new Promise(r=>server.close(r));}
});
test('unconfigured design is explicit and does not invoke a paid service',async()=>{
 const server=createServer({port:3101,live:false,designer:()=>assert.fail('must not invoke')});await new Promise(r=>server.listen(3101,'127.0.0.1',r));
 try{assert.equal((await fetch('http://127.0.0.1:3101/api/design',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"text":"ivory"}'})).status,503);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
