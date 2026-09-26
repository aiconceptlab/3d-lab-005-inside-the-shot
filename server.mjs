import http from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';
import {interpret} from './src/interpret.mjs';import {validateManifest} from './src/manual.mjs';
import {generateLook} from './src/generate-look.mjs';
import {validateLook} from './src/look.mjs';
const ROOT=import.meta.dirname;
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.glb':'model/gltf-binary','.blend':'application/octet-stream'};
export function createServer({port=Number(process.env.PORT||3018),ai=interpret,designer=generateLook,live=!!(process.env.OPENAI_API_KEY&&process.env.OPENAI_MODEL)}={}){
 let inFlight=false,lastRequest=0;
 return http.createServer(async(req,res)=>{
  const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  if(!['localhost:'+port,'127.0.0.1:'+port].includes(req.headers.host)||req.headers.origin&&!['http://localhost:'+port,'http://127.0.0.1:'+port].includes(req.headers.origin))return send(403,{error:'Local access only.'});
  try{
   const pathname=new URL(req.url,'http://localhost').pathname;
   if(req.method==='GET'&&pathname==='/api/config')return send(200,{live,design:live});
   if(req.method==='POST'&&['/api/interpret','/api/design'].includes(pathname)){
    if(!live)return send(503,{error:'Live mode is not configured.'});
    if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'Use JSON.'});
    if(inFlight||Date.now()-lastRequest<1000)return send(429,{error:'Please wait before another request.'});
    let body='',bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>8000)return send(413,{error:'Request too large.'});body+=chunk;}
    const input=JSON.parse(body);if(!input||typeof input.text!=='string'||!input.text.trim()||input.text.length>1200)return send(400,{error:'Enter 1–1200 characters.'});
    if(inFlight||Date.now()-lastRequest<1000)return send(429,{error:'Please wait before another request.'});
    inFlight=true;lastRequest=Date.now();try{
     if(pathname==='/api/design')return send(200,validateLook(await designer(input.text)));
     const parts=validateManifest(JSON.parse(await fs.readFile(path.join(ROOT,'public/model/parts.json'),'utf8')));
     return send(200,await ai(input.text,parts));
    }finally{inFlight=false;}
   }
   if(req.method!=='GET'&&req.method!=='HEAD')return send(405,{error:'Unsupported method.'});
   const rel=decodeURIComponent(pathname.slice(1)||'index.html');if(rel.split(/[\\/]/).some(p=>p.startsWith('.')))return send(404,{error:'Not found.'});
   const base=path.join(ROOT,'dist'),file=path.resolve(base,rel);if(!file.startsWith(base+path.sep))return send(404,{error:'Not found.'});
   const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:data);
  }catch(e){send(e.code==='ENOENT'?404:400,{error:e.code==='ENOENT'?'Not found.':e instanceof SyntaxError?'Invalid JSON.':e.message});}
 });
}
if(process.argv[1]===import.meta.filename){const port=Number(process.env.PORT||3018);createServer({port}).listen(port,'127.0.0.1',()=>console.log(`Inside the Shot: http://127.0.0.1:${port}`));}
