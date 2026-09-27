import {parentPort,workerData} from 'node:worker_threads';
import fs from 'node:fs/promises';import {fileURLToPath} from 'node:url';import path from 'node:path';import sharp from 'sharp';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {createCanvas} from '@napi-rs/canvas';
const {filePath,outDir,id,name,kind}=workerData;
const pdfAsset=name=>fileURLToPath(new URL('../node_modules/pdfjs-dist/'+name+'/',import.meta.url)).replaceAll('\\','/');
try{
 const data=await fs.readFile(filePath),pages=[];
 if(kind==='pdf'){
  const loading=getDocument({data:new Uint8Array(data),isEvalSupported:false,useSystemFonts:false,disableFontFace:true,standardFontDataUrl:pdfAsset('standard_fonts'),cMapUrl:pdfAsset('cmaps'),cMapPacked:true,wasmUrl:pdfAsset('wasm')});const document=await loading.promise;
  if(document.numPages>20)throw Error('For this POC, use a PDF with 20 pages or fewer.');
  for(let n=1;n<=document.numPages;n++){
   const page=await document.getPage(n),base=page.getViewport({scale:1});
   if(!Number.isFinite(base.width)||!Number.isFinite(base.height)||base.width<=0||base.height<=0||base.width/base.height>20||base.height/base.width>20)throw Error('Unsupported PDF page dimensions.');
   const viewport=page.getViewport({scale:Math.min(1.6,1400/Math.max(base.width,base.height))}),canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));
   await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
   const image=`${id}-p${n}.png`;await fs.writeFile(path.join(outDir,image),canvas.toBuffer('image/png'));
   const content=await page.getTextContent();const text=content.items.map(x=>x.str||'').join(' ').slice(0,16000);
   pages.push({id:`${id}-p${n}`,sourceId:id,kind,name,page:n,text,image});page.cleanup();
  }await loading.destroy();
 }else{
  const pipeline=sharp(data,{limitInputPixels:40000000,animated:false});const meta=await pipeline.metadata();
  if(!['jpeg','png','webp'].includes(meta.format)||!meta.width||!meta.height||(meta.pages||1)>1)throw Error('Use a still PNG, JPEG or WebP image.');
  const image=`${id}-p1.png`;await pipeline.rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).png().toFile(path.join(outDir,image));
  pages.push({id:`${id}-p1`,sourceId:id,kind:'image',name,page:1,text:'',image});
 }
 parentPort.postMessage({pages});
}catch(e){parentPort.postMessage({error:e.message});}
