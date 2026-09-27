import {LOOKS,validateLook} from './look.mjs';
export function mountDesignStudio(scene){
 const $=s=>document.querySelector(s);let current={look:scene.getLook(),origin:'SOURCE PALETTE',preset:null},history=[],ready=false,busy=false;
 for(const name of ['manual','design'])$('#'+name+'-tab').addEventListener('click',()=>{
  $('#manual-panel').hidden=name!=='manual';$('#look-panel').hidden=name!=='design';
  $('#manual-tab').setAttribute('aria-expanded',String(name==='manual'));$('#design-tab').setAttribute('aria-expanded',String(name==='design'));
 });
 function render(){
  $('#look-name').textContent=current.look.name;$('#look-description').textContent=current.look.description;$('#look-origin').textContent=current.origin;
  $('#look-swatches').replaceChildren(...Object.entries(current.look.finishes).map(([role,finish])=>{const s=document.createElement('span');s.style.background=finish.color;s.title=`${role}: ${finish.color}`;s.setAttribute('aria-label',s.title);return s;}));
  document.querySelectorAll('[data-look]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.look===current.preset));b.disabled=busy;});
  $('#undo-look').disabled=busy||!history.length;$('#import-look').disabled=busy;$('#generate-look').disabled=busy||!ready;$('#design-prompt').disabled=busy;$('#generate-look').textContent=busy?'Designing…':'Generate with AI ↗';
 }
 function apply(look,origin,preset){
  look=validateLook(look);history.push({...current,look:scene.getLook()});if(history.length>12)history.shift();
  scene.setBrightness(1);scene.setLook(look);$('#brightness').value='100';$('#brightness-value').textContent='100%';current={look,origin,preset};render();
 }
 document.querySelectorAll('[data-look]').forEach(b=>b.addEventListener('click',()=>{if(busy)return;apply(LOOKS[b.dataset.look],'PREPARED PRESET',b.dataset.look);$('#design-status').textContent='Preset applied. Orbit or explode the object to inspect the finish.';}));
 $('#brightness').addEventListener('input',e=>{scene.setBrightness(Number(e.target.value)/100);$('#brightness-value').textContent=e.target.value+'%';});
 $('#undo-look').addEventListener('click',()=>{if(!history.length||busy)return;current=history.pop();scene.setBrightness(1);scene.setLook(current.look);$('#brightness').value='100';$('#brightness-value').textContent='100%';$('#design-status').textContent='Previous look restored.';render();});
 $('#design-form').addEventListener('submit',async e=>{
  e.preventDefault();if(busy||!ready)return;busy=true;render();$('#design-status').textContent='Creating finishes and lighting…';
  try{const r=await fetch('/api/design',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(60000),body:JSON.stringify({text:$('#design-prompt').value})});const result=await r.json();if(!r.ok)throw Error(result.error||'Could not create a look.');apply(result,'AI GENERATED',null);$('#design-status').textContent='AI design applied. Compare it from any angle, or use Undo.';}
  catch(e){$('#design-status').textContent=e.name==='TimeoutError'?'Request timed out. Your current look is unchanged.':e.message;}
  finally{busy=false;render();}
 });
 $('#export-look').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({version:1,origin:current.origin,look:scene.getLook()},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='product-studio-look.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 $('#import-look').addEventListener('click',()=>{if(!busy)$('#look-file').click();});
 $('#look-file').addEventListener('change',async e=>{
  const file=e.target.files[0];if(!file||busy)return;
  try{if(file.size>12000)throw Error('Look files must be smaller than 12 KB.');const data=JSON.parse(await file.text());if(data.version!==1)throw Error('Unsupported look format.');apply(data.look,'IMPORTED LOOK',null);$('#design-status').textContent='Saved look restored. No API request was made.';}
  catch{$('#design-status').textContent='That file is not a valid saved look. Your current look is unchanged.';}
  finally{e.target.value='';}
 });
 render();
 return {configure(enabled){ready=!!enabled;$('#design-availability').textContent=ready?'Live AI is ready. Each generation uses your configured OpenAI account.':'Add OPENAI_API_KEY and OPENAI_MODEL to .env and restart to enable AI.';render();}};
}
