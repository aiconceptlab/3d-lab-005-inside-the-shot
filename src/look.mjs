// Shared, bounded material/light contract. Never evaluate model-generated code.
const object = properties => ({type:'object',additionalProperties:false,required:Object.keys(properties),properties});
const number = (minimum,maximum) => ({type:'number',minimum,maximum});
const color = {type:'string',pattern:'^#[0-9a-fA-F]{6}$'};
const material = object({color,metalness:number(0,1),roughness:number(.12,.85),clearcoat:number(0,1)});
export const LOOK_SCHEMA = object({
 name:{type:'string',minLength:1,maxLength:48},description:{type:'string',minLength:1,maxLength:240},
 finishes:object({shell:material,trim:material,copper:material,handle:material}),
 lighting:object({keyColor:color,keyIntensity:number(1,12),fillColor:color,fillIntensity:number(.2,6),rimColor:color,rimIntensity:number(.5,12),environment:number(.15,1.5),exposure:number(.65,1.6),azimuth:number(-60,60),background:color})
});
function validate(value,schema,path='look'){
 if(schema.type==='object'){
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error(`Invalid ${path}.`);
  const keys=Object.keys(schema.properties);
  if(Object.keys(value).length!==keys.length||keys.some(k=>!Object.hasOwn(value,k)))throw Error(`Invalid fields in ${path}.`);
  return Object.fromEntries(keys.map(k=>[k,validate(value[k],schema.properties[k],`${path}.${k}`)]));
 }
 if(schema.type==='number'&&(typeof value!=='number'||!Number.isFinite(value)||value<schema.minimum||value>schema.maximum))throw Error(`Invalid ${path}.`);
 if(schema.type==='string'&&(typeof value!=='string'||(schema.pattern&&!new RegExp(schema.pattern).test(value))||(schema.minLength&&value.trim().length<schema.minLength)||(schema.maxLength&&value.length>schema.maxLength)))throw Error(`Invalid ${path}.`);
 return value;
}
export const validateLook = value => validate(value,LOOK_SCHEMA);
const m=(color,metalness,roughness,clearcoat=0)=>({color,metalness,roughness,clearcoat});
export const LOOKS={
 studio:{name:'Copper studio',description:'Graphite enamel, satin aluminium and warm copper. A broad warm key meets a cool edge light.',finishes:{shell:m('#293c45',.45,.3,.28),trim:m('#b9c7cf',.92,.24),copper:m('#d08855',.88,.24),handle:m('#694025',.02,.36,.2)},lighting:{keyColor:'#ffe2c6',keyIntensity:6,fillColor:'#d7e8ff',fillIntensity:1.6,rimColor:'#90caff',rimIntensity:8,environment:.65,exposure:1.05,azimuth:0,background:'#13212b'}},
 ivory:{name:'Ivory gallery',description:'Glazed ivory, champagne brass and walnut under a soft, warm gallery light.',finishes:{shell:m('#efe6d3',.05,.23,.7),trim:m('#d9b773',.84,.28),copper:m('#c7845a',.85,.28),handle:m('#573525',.02,.4,.25)},lighting:{keyColor:'#fff1df',keyIntensity:5.2,fillColor:'#edf3ff',fillIntensity:2.2,rimColor:'#ffd5a3',rimIntensity:6,environment:.8,exposure:1,azimuth:15,background:'#262622'}},
 midnight:{name:'Midnight blue',description:'Deep blue lacquer and cool titanium. A cyan rim defines the silhouette against a dark studio.',finishes:{shell:m('#163354',.5,.22,.65),trim:m('#90a9bf',.94,.2),copper:m('#b87955',.88,.22),handle:m('#202b35',.2,.32,.4)},lighting:{keyColor:'#dbe9ff',keyIntensity:6,fillColor:'#b6d2ff',fillIntensity:1.2,rimColor:'#69e0ed',rimIntensity:10,environment:.5,exposure:1.1,azimuth:-20,background:'#0a182a'}}
};
export function finishRole(name){
 if(/Graphite.*powder.*coat/i.test(name))return 'shell';
 if(/Satin.*aluminium|Brass.*fittings/i.test(name))return 'trim';
 if(/Brushed.*copper/i.test(name))return 'copper';
 if(/Walnut.*handle/i.test(name))return 'handle';
 return null;
}
