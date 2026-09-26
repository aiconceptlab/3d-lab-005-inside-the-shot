import test from 'node:test';import assert from 'node:assert/strict';import {createServer} from '../server.mjs';
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
