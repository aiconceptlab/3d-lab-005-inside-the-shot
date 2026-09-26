import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {LOOKS,validateLook,finishRole} from './look.mjs';
import {animate} from 'animejs';

export async function createScene(host,parts,onPick){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x10191e,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;host.append(renderer.domElement);
 renderer.domElement.setAttribute('aria-label','Interactive ARC espresso machine. Use the part buttons below as a keyboard alternative.');
 const scene=new THREE.Scene();const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;room.dispose();pmrem.dispose();scene.environmentIntensity=.75;
 const camera=new THREE.PerspectiveCamera(34,1,.01,30);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=.45;controls.maxDistance=3;controls.maxPolarAngle=Math.PI*.49;controls.target.set(0,.23,0);
 const ambient=new THREE.HemisphereLight(0xcce6ff,0x2c2119,.35);scene.add(ambient);
 RectAreaLightUniformsLib.init();
 function softbox(color,power,pos,width,height){const l=new THREE.RectAreaLight(color,power,width,height);l.position.set(...pos);l.lookAt(0,.24,0);scene.add(l);return l;}
 const key=softbox(0xffe2c6,6,[-.65,.9,.65],.7,1.0);
 const fill=softbox(0xd7e8ff,1.6,[.6,.45,.85],.65,.7);
 const rim=softbox(0x90caff,8,[.65,.75,-.5],.18,.95);
 // Area lights give broad specular highlights; this aligned spot supplies shadows.
 const shadowKey=new THREE.SpotLight(0xffe2c6,2,5,Math.PI/3,.6,2);shadowKey.position.copy(key.position);shadowKey.target.position.set(0,.2,0);shadowKey.castShadow=true;shadowKey.shadow.mapSize.set(2048,2048);shadowKey.shadow.normalBias=.001;shadowKey.shadow.bias=-.0001;shadowKey.shadow.camera.near=.1;scene.add(shadowKey,shadowKey.target);
 const plinth=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.022,96),new THREE.MeshStandardMaterial({color:0x202c33,roughness:.3,metalness:.35}));plinth.position.y=-.014;plinth.receiveShadow=true;scene.add(plinth);
 const edge=new THREE.Mesh(new THREE.TorusGeometry(.36,.0012,8,128),new THREE.MeshBasicMaterial({color:0xeeb58a}));edge.rotation.x=Math.PI/2;edge.position.y=-.015;scene.add(edge);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.08}));floor.rotation.x=-Math.PI/2;floor.position.y=-.026;floor.receiveShadow=true;scene.add(floor);
 const gltf=await new GLTFLoader().loadAsync('/model/arc.glb');const model=gltf.scene;scene.add(model);
 const groups=new Map(),rest=new Map(),materials=[];
 for(const p of parts){const group=model.getObjectByName(p.id);if(!group)throw Error('Missing part in model: '+p.id);groups.set(p.id,group);rest.set(p.id,group.position.clone());group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.partId=p.id;const old=o.material,role=finishRole(old.name);o.material=role?new THREE.MeshPhysicalMaterial({name:old.name,color:old.color,metalness:old.metalness,roughness:old.roughness,side:old.side,clearcoatRoughness:.2}):old.clone();materials.push({o,m:o.material,base:o.material.color.clone(),role});}});}
 let currentLook=validateLook(LOOKS.studio),brightness=1;
 function setLook(input){
  const look=validateLook(input); // Validate the whole recipe before changing any material.
  for(const item of materials){if(!item.role)continue;const finish=look.finishes[item.role];item.m.color.set(finish.color);item.base.copy(item.m.color);item.m.metalness=finish.metalness;item.m.roughness=finish.roughness;item.m.clearcoat=finish.clearcoat;item.m.needsUpdate=true;}
  const l=look.lighting;key.color.set(l.keyColor);key.intensity=l.keyIntensity;fill.color.set(l.fillColor);fill.intensity=l.fillIntensity;rim.color.set(l.rimColor);rim.intensity=l.rimIntensity;
  const a=l.azimuth*Math.PI/180;key.position.set(-.65*Math.cos(a)+.65*Math.sin(a),.9,.65*Math.cos(a)+.65*Math.sin(a));key.lookAt(0,.24,0);shadowKey.position.copy(key.position);shadowKey.color.copy(key.color);shadowKey.intensity=l.keyIntensity*.25;
  scene.environmentIntensity=l.environment;renderer.toneMappingExposure=Math.max(.65,Math.min(1.6,l.exposure*brightness));edge.material.color.copy(rim.color).lerp(key.color,.7);
  host.closest('.viewer').style.background=`radial-gradient(ellipse at 45% 40%, ${l.background}, #0b1117 85%)`;
  currentLook=look;return structuredClone(look);
 }
 function setBrightness(value){brightness=Math.max(.7,Math.min(1.3,Number(value)||1));renderer.toneMappingExposure=Math.max(.65,Math.min(1.6,currentLook.lighting.exposure*brightness));}
 function getLook(){const look=structuredClone(currentLook);look.lighting.exposure=Math.max(.65,Math.min(1.6,look.lighting.exposure*brightness));return look;}
 const flow=new THREE.Group();scene.add(flow);let tubes=[],dots=[];
 const anchors={reservoir:new THREE.Vector3(-.086,.18,-.09),pump:new THREE.Vector3(-.086,.125,.005),boiler:new THREE.Vector3(.066,.25,-.041),brew_group:new THREE.Vector3(0,.275,.155)};
 const point=id=>anchors[id].clone().add(groups.get(id).position);
 function makeFlow(){for(const o of [...flow.children]){flow.remove(o);o.geometry?.dispose();o.material?.dispose();}tubes=[];dots=[];
  const ids=['reservoir','pump','boiler','brew_group'];
  for(let i=0;i<3;i++){const a=point(ids[i]),b=point(ids[i+1]),mid=a.clone().lerp(b,.5);mid.z+=.065;const curve=new THREE.CatmullRomCurve3([a,mid,b]);const color=i<2?0x50cbff:0xffac52;const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,40,.0025,8,false),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.58,depthTest:false}));tube.renderOrder=5;flow.add(tube);tubes.push(curve);
   for(let j=0;j<4;j++){const dot=new THREE.Mesh(new THREE.SphereGeometry(.0045,10,8),new THREE.MeshBasicMaterial({color,depthTest:false}));dot.renderOrder=6;flow.add(dot);dots.push({dot,curve,phase:j/4});}
  }
 }
 let animations=[],generation=0,flowActive=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function home(exploded=false){const portrait=host.clientWidth<500,scale=exploded?1.34:1;camera.position.set(.78*scale,.64*scale,1.04*scale);if(portrait)camera.position.multiplyScalar(1.18);controls.target.set(0,exploded?.32:.22,0);controls.update();}
 function apply(state){generation++;const ticket=generation;for(const a of animations)a.pause();animations=[];flow.visible=false;flowActive=state.flow;
  const expanded=state.mode==='exploded';home(expanded);
  for(const p of parts){const o=groups.get(p.id),target=rest.get(p.id).clone();if(state.removed.includes(p.id))target.add(new THREE.Vector3(...p.offset));const stage=p.id==='fasteners'?0:['top','shell_left','shell_right'].includes(p.id)?160:330;animations.push(animate(o.position,{x:target.x,y:target.y,z:target.z,duration:reduced.matches?1:1100,delay:reduced.matches?0:expanded?stage:0,ease:'inOut(3)',onComplete:()=>{if(ticket===generation&&state.flow){makeFlow();flow.visible=true;}}}));}
  for(const {o,m,base} of materials){const dim=state.selected&&o.userData.partId!==state.selected;m.color.copy(base);m.transparent=!!dim;m.opacity=dim?.10:1;m.depthWrite=!dim;o.castShadow=!dim;}
  if(state.selected){const group=groups.get(state.selected),box=new THREE.Box3().setFromObject(group),target=box.getCenter(new THREE.Vector3()),desired=rest.get(state.selected).clone();if(state.removed.includes(state.selected))desired.add(new THREE.Vector3(...parts.find(p=>p.id===state.selected).offset));target.add(desired.sub(group.position));const distance=Math.max(.40,box.getSize(new THREE.Vector3()).length()*1.7),position=target.clone().add(new THREE.Vector3(.65,.4,.85).normalize().multiplyScalar(distance));animations.push(animate(controls.target,{x:target.x,y:target.y,z:target.z,duration:reduced.matches?1:800,ease:'inOut(3)'}),animate(camera.position,{x:position.x,y:position.y,z:position.z,duration:reduced.matches?1:800,ease:'inOut(3)'}));}
 }
 const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let down;
 renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
 renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);const hit=ray.intersectObject(model,true).find(h=>h.object.material.opacity>.4);if(hit?.object.userData.partId)onPick(hit.object.userData.partId);});
 let lastWidth=0;new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();if(!lastWidth)home();lastWidth=w;}).observe(host);
 renderer.setAnimationLoop(ms=>{controls.update();if(flow.visible&&flowActive)for(const {dot,curve,phase} of dots)dot.position.copy(curve.getPointAt(reduced.matches?phase:((ms/2600)+phase)%1));renderer.render(scene,camera);});
 setLook(LOOKS.studio);home();return {apply,home,setLook,setBrightness,getLook};
}
