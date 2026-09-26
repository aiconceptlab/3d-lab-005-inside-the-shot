import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {animate} from 'animejs';

export async function createScene(host,parts,onPick){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x10191e,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;host.append(renderer.domElement);
 renderer.domElement.setAttribute('aria-label','Interactive ARC espresso machine. Use the part buttons below as a keyboard alternative.');
 const scene=new THREE.Scene();const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;room.dispose();pmrem.dispose();scene.environmentIntensity=.75;
 const camera=new THREE.PerspectiveCamera(34,1,.01,30);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=.45;controls.maxDistance=3;controls.maxPolarAngle=Math.PI*.49;controls.target.set(0,.23,0);
 const ambient=new THREE.HemisphereLight(0xcce6ff,0x2c2119,1.4);scene.add(ambient);
 function lamp(color,power,pos){const l=new THREE.DirectionalLight(color,power);l.position.set(...pos);scene.add(l);return l;}
 const key=lamp(0xffdab8,3,[-1,2,2]);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-1,right:1,top:1,bottom:-1,near:.1,far:5});key.shadow.normalBias=.002;lamp(0x8ac9ff,2,[1,1,-1]);
 const plinth=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.022,96),new THREE.MeshStandardMaterial({color:0x202c33,roughness:.3,metalness:.35}));plinth.position.y=-.014;plinth.receiveShadow=true;scene.add(plinth);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.07}));floor.rotation.x=-Math.PI/2;floor.position.y=-.026;floor.receiveShadow=true;scene.add(floor);
 const gltf=await new GLTFLoader().loadAsync('/model/arc.glb');const model=gltf.scene;scene.add(model);
 const groups=new Map(),rest=new Map(),materials=[];
 for(const p of parts){const group=model.getObjectByName(p.id);if(!group)throw Error('Missing part in model: '+p.id);groups.set(p.id,group);rest.set(p.id,group.position.clone());group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.partId=p.id;o.material=o.material.clone();materials.push({o,m:o.material,base:o.material.color.clone()});}});}
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
 home();return {apply,home};
}
