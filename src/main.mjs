import './style.css';
import {initialState,validateManifest,transition,demoCommand} from './manual.mjs';
import {createScene} from './scene.mjs';
import {mountDesignStudio} from './design-ui.mjs';
const $=s=>document.querySelector(s);let state=initialState(),scene,parts,busy=false,pendingSequence=[];
function setBusy(value){busy=value;$('#send').disabled=value;$('#question').disabled=value;$('#send').textContent=value?'…':'↑';}
function renderResult(result){state=result.state;$('#answer').textContent=result.message;$('#response').classList.toggle('blocked',result.blocked);$('.response-label').textContent=result.blocked?'DEPENDENCY CHECK / BLOCKED':state.selected?'PART KNOWLEDGE':'ASSEMBLY GUIDE';$('#sequence').replaceChildren();
 if(result.sequence)pendingSequence=result.sequence;
 else if(state.mode!=='partial')pendingSequence=[];
 pendingSequence=pendingSequence.filter(id=>!state.removed.includes(id));
 if(pendingSequence.length){pendingSequence.forEach((id,index)=>{const b=document.createElement('button');b.textContent=`${index+1}. ${parts.find(p=>p.id===id).label}`;b.addEventListener('click',()=>execute({action:'remove',part:id}));$('#sequence').append(b);});}
 $('#view-state').textContent=state.flow?'WATER PATH':state.mode.toUpperCase();$('#flow-legend').hidden=!state.flow;$('#part-label').hidden=!state.selected;if(state.selected)$('#part-label').textContent=parts.find(p=>p.id===state.selected).label;
 for(const b of document.querySelectorAll('#parts button'))b.classList.toggle('active',b.dataset.part===state.selected);
 for(const b of document.querySelectorAll('.toolbar button'))b.classList.toggle('active',b.dataset.action===(state.flow?'flow':state.mode==='assembled'?'assemble':state.mode==='exploded'?'explode':''));
 scene?.apply(state);
}
function execute(c){renderResult(transition(state,c,parts));}
async function ask(text){if(busy)return;setBusy(true);try{let command;if($('#live-mode').checked){const r=await fetch('/api/interpret',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});const d=await r.json();if(!r.ok)throw Error(d.error||'Language service unavailable.');command=d;}else command=demoCommand(text,parts);execute(command);}catch(e){$('#answer').textContent=e.message;$('.response-label').textContent='REQUEST NOT APPLIED';}finally{setBusy(false);}}
try{
 const response=await fetch('/model/parts.json');if(!response.ok)throw Error('Part catalogue could not be loaded.');parts=validateManifest(await response.json());
 for(const p of parts){const b=document.createElement('button');b.textContent=p.label;b.dataset.part=p.id;b.addEventListener('click',()=>execute({action:'focus',part:p.id}));$('#parts').append(b);}
 scene=await createScene($('#canvas-host'),parts,id=>execute({action:'focus',part:id}));$('#loading').hidden=true;
 const designStudio=mountDesignStudio(scene);
 document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>execute({action:b.dataset.action,part:null})));
 document.querySelectorAll('[data-prompt]').forEach(b=>b.addEventListener('click',()=>ask(b.dataset.prompt)));
 $('#home').addEventListener('click',()=>scene.home(state.mode==='exploded'));
 $('#break-test').addEventListener('click',()=>{state=initialState();execute({action:'remove',part:'pump'});});
 $('#chat').addEventListener('submit',e=>{e.preventDefault();ask($('#question').value);});
 $('#live-mode').addEventListener('change',()=>{$('#mode-badge').textContent=$('#live-mode').checked?'LIVE LANGUAGE':'PREPARED DEMO';});
 try{const config=await fetch('/api/config');if(config.ok){const settings=await config.json();if(settings.live){$('#live-mode').disabled=false;$('#live-status').textContent='Available';}designStudio.configure(settings.design);}}catch{}
}catch(e){$('#loading').textContent='3D preview unavailable. '+e.message;$('#answer').textContent='Use a browser with WebGL 2 enabled. The part catalogue and editable Blender model are included in the source.';}
