// All model output passes through this bounded command vocabulary.
export const ACTIONS=['explode','assemble','flow','focus','remove','explain','help'];
export const initialState=()=>({mode:'assembled',selected:null,removed:[],flow:false});
export function validateManifest(parts){
 const ids=new Set(parts.map(p=>p.id));if(ids.size!==parts.length)throw Error('Duplicate part');
 for(const p of parts){if(!p.label||!p.description||p.offset.length!==3||!p.offset.every(Number.isFinite))throw Error('Invalid part');for(const id of p.requires)if(!ids.has(id))throw Error('Unknown dependency');}
 const visiting=new Set(),visited=new Set();function visit(id){if(visiting.has(id))throw Error('Dependency cycle');if(visited.has(id))return;visiting.add(id);for(const dep of parts.find(p=>p.id===id).requires)visit(dep);visiting.delete(id);visited.add(id);}for(const id of ids)visit(id);return parts;
}
export function removalOrder(id,parts){const order=[];const visit=x=>{if(order.includes(x))return;for(const dep of parts.find(p=>p.id===x).requires)visit(dep);order.push(x);};if(!parts.some(p=>p.id===id))throw Error('Unknown part');visit(id);return order;}
export function validateCommand(c,parts){
 if(!c||!ACTIONS.includes(c.action))throw Error('Unsupported command');
 const part=c.part??null;
 if(['focus','remove','explain'].includes(c.action)&&!parts.some(p=>p.id===part))throw Error('Unknown part');
 return {action:c.action,part:['focus','remove','explain'].includes(c.action)?part:null};
}
export function transition(state,command,parts){
 const c=validateCommand(command,parts),next=structuredClone(state),part=parts.find(p=>p.id===c.part);
 const out=(message,extra={})=>({state:next,message,blocked:false,...extra});
 if(c.action==='assemble')return {state:initialState(),message:'All assemblies returned to their rest positions. The anchored chassis stays in place.',blocked:false};
 if(c.action==='explode'||c.action==='flow'){
  next.mode='exploded';next.selected=null;next.removed=parts.filter(p=>p.id!=='chassis').map(p=>p.id);next.flow=c.action==='flow';
  return out(c.action==='flow'?'Reservoir → pump → heating assembly → brew group. Blue shows the feed; amber shows the heated section. This animated route is explanatory, not a fluid simulation.':'The housing opens first, followed by the internal assemblies. Fourteen prepared part groups, each with a name and an explanation.');
 }
 if(c.action==='help')return out('Try “take it apart”, “follow the water”, “show me the pump”, “remove the pump”, or “put it back together”. This demo uses a prepared fictional assembly.');
 if(c.action==='explain'){next.selected=part.id;return out(part.description);}
 if(c.action==='focus'){next.selected=part.id;next.flow=false;return out(part.description);}
 if(part.id==='chassis')return out('The chassis is anchored. This demonstration does not remove it.',{blocked:true,sequence:[]});
 if(next.removed.includes(part.id))return out(`${part.label} is already separated. Reassemble to test the removal order.`);
 const missing=part.requires.filter(id=>!next.removed.includes(id));
 if(missing.length){const sequence=removalOrder(part.id,parts).filter(id=>!next.removed.includes(id));return out(`Removal blocked. First release: ${missing.map(id=>parts.find(p=>p.id===id).label.toLowerCase()).join(', ')}. The required order is listed below.`,{blocked:true,sequence});}
 next.removed.push(part.id);next.selected=part.id;next.mode='partial';next.flow=false;return out(`${part.label} separated in the conceptual assembly. This checks authored dependencies, not physical clearance.`);
}
export function demoCommand(text,parts){
 const t=String(text).toLowerCase().trim();
 if(/\b(reassemble|assemble|reset)\b|put.*back|back together/.test(t))return {action:'assemble',part:null};
 if(/follow.*water|water.*(path|flow)|how.*(coffee|work)|flow/.test(t))return {action:'flow',part:null};
 if(/explode|take.*apart|open.*(machine|everything)|show.*inside/.test(t))return {action:'explode',part:null};
 const aliases={pump:['pump'],boiler:['boiler','heater','heating'],reservoir:['reservoir','tank'],portafilter:['portafilter','handle'],plumbing:['plumbing','lines','tubing'],controller:['controller','board'],gauge:['gauge','dial'],tray:['tray'],brew_group:['brew group'],shell_left:['left enclosure','left panel'],shell_right:['right enclosure','right panel'],top:['top','lid'],fasteners:['fasteners','screws'],chassis:['chassis','base']};
 const id=Object.keys(aliases).find(id=>aliases[id].some(a=>t.includes(a)));
 if(id){const action=/remove|detach|release/.test(t)?'remove':/what|explain|tell.*about/.test(t)?'explain':'focus';return validateCommand({action,part:id},parts);}
 return {action:'help',part:null};
}
