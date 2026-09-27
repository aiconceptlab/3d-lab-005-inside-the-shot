import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const el=(shape,position,size,role='body',color='#b78754',rotation=[0,0,0])=>({shape,position,size,role,color,rotation,metalness:role==='metal'?.85:.04,roughness:role==='metal'?.25:.38});
const part=(id,label,description,elements,offset,anchored=false)=>({id,label,description,aliases:[label.toLowerCase()],evidence:'documented',geometryBasis:'source-guided',sources:[{pageId:'source-1-p1',quote:label}],anchored,offset,elements});
const chair={title:'FORM / Lounge chair',summary:'An original nine-part chair study. The accompanying illustrated manual identifies each assembly; the 3D dimensions and materials are a design concept.',mode:'assembly',scaleBasis:'approximate',limitations:['Original sample design, not a manufacturer product.','Part geometry and dimensions are illustrative. The reveal is not a validated assembly procedure.'],parts:[
 part('seat','Seat frame','The seat frame supports the cushion and connects the four legs.',[el('box',[0,.43,0],[.48,.07,.46])],[0,0,0],true),
 part('cushion','Seat cushion','A separate upholstered cushion rests on the seat frame.',[el('box',[0,.49,-.01],[.445,.065,.425],'detail','#d9dfd0')],[0,.24,0]),
 part('back','Backrest','A broad back panel is supported by two uprights.',[el('box',[0,.73,-.19],[.47,.25,.047],'body','#b78754',[-.09,0,0]),el('box',[-.18,.61,-.205],[.035,.27,.035]),el('box',[.18,.61,-.205],[.035,.27,.035])],[0,.16,-.3]),
 ...[[-1,-1],[-1,1],[1,-1],[1,1]].map(([x,z],i)=>part('leg_'+i,`${z===1?'Front':'Rear'} ${x===1?'right':'left'} leg`,'A tapered visual approximation of one independent supporting leg.',[el('cylinder',[x*.185,.215,z*.16],[.042,.43,.042],'body','#94623a',[z*.06,0,-x*.06])],[x*.23,-.02,z*.20])),
 part('rail_left','Left side rail','A side rail links the left leg pair.',[el('box',[-.185,.24,0],[.027,.04,.33])],[-.29,.05,0]),
 part('rail_right','Right side rail','A side rail links the right leg pair.',[el('box',[.185,.24,0],[.027,.04,.33])],[.29,.05,0])
]};
const ring=(z,r)=>el('torus',[0,.49,z],[r,r,.02],'metal','#8298a1');
function guard(z){return [ring(z,.34),ring(z,.23),ring(z,.12),...Array.from({length:12},(_,i)=>el('cylinder',[0,.49,z],[.003,.335,.003],'metal','#8298a1',[0,0,i*Math.PI/12]))];}
const fan={title:'BREEZE / Desk fan',summary:'An original desk-fan assembly study with separate guards, rotor and support. The manual names the visible assemblies; operation and airflow are not simulated.',mode:'assembly',scaleBasis:'approximate',limitations:['Original sample product; no electrical or airflow specifications.','Guard, motor and rotor geometry is schematic. This is not a repair guide.'],parts:[
 part('base','Weighted base','A low circular base supports the fan.',[el('cylinder',[0,.025,0],[.27,.05,.22],'body','#234b56')],[0,0,0],true),
 part('stand','Support stem','The support stem joins the base to the head.',[el('cylinder',[0,.20,-.015],[.04,.31,.04],'metal','#b2c3c9'),el('box',[0,.34,-.04],[.07,.07,.09],'body','#234b56')],[0,.12,-.24]),
 part('motor','Motor housing','The rear housing is represented by a rounded exterior body. Hidden motor internals are not modelled.',[el('cylinder',[0,.49,-.045],[.12,.135,.12],'body','#234b56',[Math.PI/2,0,0])],[0,.08,-.32]),
 part('rear_guard','Rear guard','A ring and wire pattern represents the rear guard.',guard(-.04),[-.27,0,-.20]),
 part('rotor','Rotor and hub','Three blades attach to a central hub. This is a static conceptual rotor.',[el('cylinder',[0,.49,.035],[.065,.035,.065],'accent','#d59c6d',[Math.PI/2,0,0]),...Array.from({length:3},(_,i)=>{const a=i*Math.PI*2/3;return el('sphere',[Math.sin(a)*.065,.49+Math.cos(a)*.065,.035],[.09,.20,.016],'body','#537e88',[0,0,-a-.2]);})],[0,0,.24]),
 part('front_guard','Front guard','The front guard covers the blade area with a decorative wire pattern.',guard(.082),[.28,0,.20]),
 part('dial','Control dial','A side-mounted dial is represented as an exterior control only.',[el('cylinder',[.073,.49,-.055],[.035,.035,.035],'detail','#172a30',[0,0,Math.PI/2])],[.25,.13,0])
]};
for(const [id,scene] of Object.entries({chair,fan})){const dir=path.join(root,'public/samples',id);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'scene.json'),JSON.stringify(scene,null,2));}
console.log('Original chair and fan scene specifications written.');
