import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {LOOKS,validateLook,finishRole} from './look.mjs';
import {createProduct} from './geometry.mjs';
import {animate} from 'animejs';

export async function createScene(host,project,onPick){
 const parts=project.parts,renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x10191e,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;host.append(renderer.domElement);
 renderer.domElement.setAttribute('aria-label','Interactive '+project.title+'. Use the part buttons as a keyboard alternative.');
 const scene=new THREE.Scene(),pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();scene.environmentIntensity=.65;
 const camera=new THREE.PerspectiveCamera(34,1,.005,30),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=.15;controls.maxDistance=7;controls.maxPolarAngle=Math.PI*.49;
 scene.add(new THREE.HemisphereLight(0xcce6ff,0x2c2119,.35));RectAreaLightUniformsLib.init();
 function softbox(color,power,pos,width,height){const l=new THREE.RectAreaLight(color,power,width,height);l.position.set(...pos);l.lookAt(0,.25,0);scene.add(l);return l;}
 const key=softbox(0xffe2c6,6,[-.65,.9,.65],.7,1),fill=softbox(0xd7e8ff,1.6,[.6,.45,.85],.65,.7),rim=softbox(0x90caff,8,[.65,.75,-.5],.18,.95);
 const shadowKey=new THREE.SpotLight(0xffe2c6,1.5,5,Math.PI/3,.6,2);shadowKey.position.copy(key.position);shadowKey.target.position.set(0,.2,0);shadowKey.castShadow=true;shadowKey.shadow.mapSize.set(2048,2048);shadowKey.shadow.normalBias=.001;shadowKey.shadow.bias=-.0001;shadowKey.shadow.camera.near=.1;scene.add(shadowKey,shadowKey.target);
 const plinth=new THREE.Mesh(new THREE.CylinderGeometry(.39,.39,.022,96),new THREE.MeshStandardMaterial({color:0x202c33,roughness:.3,metalness:.35}));plinth.position.y=-.014;plinth.receiveShadow=true;scene.add(plinth);
 const edge=new THREE.Mesh(new THREE.TorusGeometry(.39,.0012,8,128),new THREE.MeshBasicMaterial({color:0xeeb58a}));edge.rotation.x=Math.PI/2;edge.position.y=-.015;scene.add(edge);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.08}));floor.rotation.x=-Math.PI/2;floor.position.y=-.026;floor.receiveShadow=true;scene.add(floor);
 const model=project.modelUrl?(await new GLTFLoader().loadAsync(project.modelUrl)).scene:createProduct(project);scene.add(model);
 model.updateMatrixWorld(true);const rawBox=new THREE.Box3().setFromObject(model),rawSize=rawBox.getSize(new THREE.Vector3()),factor=.60/Math.max(rawSize.x,rawSize.y,rawSize.z,.001),centre=rawBox.getCenter(new THREE.Vector3());
 model.scale.multiplyScalar(factor);model.position.set(-centre.x*factor,-rawBox.min.y*factor,-centre.z*factor);model.updateMatrixWorld(true);
 const groups=new Map(),rest=new Map(),materials=[];
 for(const p of parts){const group=model.getObjectByName(p.node||p.id);if(!group)throw Error('Missing part in model: '+p.id);groups.set(p.id,group);rest.set(p.id,group.position.clone());group.traverse(o=>{if(o.isMesh){
  o.castShadow=true;o.receiveShadow=true;o.userData.partId=p.id;const old=o.material;
  const named=old.name.match(/^(body|metal|accent|detail)(?:\.\d+)?$/)?.[1];const role=o.userData.materialRole||named||finishRole(old.name);
  o.material=role?new THREE.MeshPhysicalMaterial({name:old.name,color:old.color,metalness:old.metalness,roughness:old.roughness,side:old.side,clearcoat:role==='body'?.2:0,clearcoatRoughness:.25}):old.clone();materials.push({o,m:o.material,base:o.material.color.clone(),role});
 }});}
 const assembledBox=new THREE.Box3().setFromObject(model);
 for(const p of parts)if(!p.anchored)groups.get(p.id).position.add(new THREE.Vector3(...p.offset));model.updateMatrixWorld(true);const expandedBox=new THREE.Box3().setFromObject(model);
 for(const p of parts)groups.get(p.id).position.copy(rest.get(p.id));model.updateMatrixWorld(true);
 let currentLook=structuredClone(LOOKS.studio),brightness=1;currentLook.name='Source palette';currentLook.description='Original project colors under cinematic studio lighting.';
 for(const role of Object.keys(currentLook.finishes)){const item=materials.find(m=>m.role===role);if(item)currentLook.finishes[role]={color:'#'+item.m.color.getHexString(),metalness:item.m.metalness,roughness:Math.min(.85,Math.max(.12,item.m.roughness)),clearcoat:item.m.clearcoat||0};}
 function setLook(input,changeMaterials=true){const look=validateLook(input);
  if(changeMaterials)for(const item of materials){if(!item.role)continue;const f=look.finishes[item.role];item.m.color.set(f.color);item.base.copy(item.m.color);item.m.metalness=f.metalness;item.m.roughness=f.roughness;item.m.clearcoat=f.clearcoat;item.m.needsUpdate=true;}
  const l=look.lighting;key.color.set(l.keyColor);key.intensity=l.keyIntensity;fill.color.set(l.fillColor);fill.intensity=l.fillIntensity;rim.color.set(l.rimColor);rim.intensity=l.rimIntensity;
  const a=l.azimuth*Math.PI/180;key.position.set(-.65*Math.cos(a)+.65*Math.sin(a),.9,.65*Math.cos(a)+.65*Math.sin(a));key.lookAt(0,.24,0);shadowKey.position.copy(key.position);shadowKey.color.copy(key.color);shadowKey.intensity=l.keyIntensity*.25;
  scene.environmentIntensity=l.environment;renderer.toneMappingExposure=Math.max(.65,Math.min(1.6,l.exposure*brightness));edge.material.color.copy(rim.color).lerp(key.color,.7);host.closest('.viewer').style.background=`radial-gradient(ellipse at 45% 40%, ${l.background}, #0b1117 85%)`;currentLook=look;return structuredClone(look);
 }
 function setBrightness(value){brightness=Math.max(.7,Math.min(1.3,Number(value)||1));renderer.toneMappingExposure=Math.max(.65,Math.min(1.6,currentLook.lighting.exposure*brightness));}
 function getLook(){const look=structuredClone(currentLook);look.lighting.exposure=Math.max(.65,Math.min(1.6,look.lighting.exposure*brightness));return look;}
 const flow=new THREE.Group();scene.add(flow);let dots=[],animations=[],generation=0,lastState={mode:'assembled',selected:null,removed:[],flow:false};const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function clearFlow(){for(const o of [...flow.children]){flow.remove(o);o.geometry.dispose();o.material.dispose();}dots=[];}
 function makeFlow(){clearFlow();if(!project.process)return;const route=project.process,anchors=route.ids.map((id,i)=>model.localToWorld(new THREE.Vector3(...route.anchors[i]).add(groups.get(id).position)));
  for(let i=0;i<anchors.length-1;i++){const a=anchors[i],b=anchors[i+1],mid=a.clone().lerp(b,.5);mid.z+=.07;const curve=new THREE.CatmullRomCurve3([a,mid,b]),color=i<2?0x50cbff:0xffac52;const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,40,.0025,8,false),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.6,depthTest:false}));flow.add(tube);for(let j=0;j<4;j++){const dot=new THREE.Mesh(new THREE.SphereGeometry(.004,10,8),new THREE.MeshBasicMaterial({color,depthTest:false}));flow.add(dot);dots.push({dot,curve,phase:j/4});}}
 }
 function frame(box){const size=box.getSize(new THREE.Vector3()),target=box.getCenter(new THREE.Vector3()),angle=Math.min(camera.fov*Math.PI/180,2*Math.atan(Math.tan(camera.fov*Math.PI/360)*camera.aspect));const distance=Math.max(.4,size.length()*.5/Math.sin(angle/2)*1.12);camera.position.copy(target).add(new THREE.Vector3(.8,.55,1.15).normalize().multiplyScalar(distance));controls.target.copy(target);controls.update();}
 function home(exploded=lastState.mode==='exploded'){frame(exploded?expandedBox:assembledBox);}
 function apply(state){lastState=state;generation++;const ticket=generation;for(const a of animations)a.pause();animations=[];flow.visible=false;home(state.mode==='exploded');
  for(const p of parts){const o=groups.get(p.id),target=rest.get(p.id).clone();if(state.removed.includes(p.id))target.add(new THREE.Vector3(...p.offset));animations.push(animate(o.position,{x:target.x,y:target.y,z:target.z,duration:reduced.matches?1:1050,delay:reduced.matches?0:state.mode==='exploded'?Math.min(p.stage||0,8)*40:0,ease:'inOut(3)',onComplete:()=>{if(ticket===generation&&state.flow){model.updateMatrixWorld(true);makeFlow();flow.visible=true;}}}));}
  for(const {o,m,base} of materials){const dim=state.selected&&o.userData.partId!==state.selected;m.color.copy(base);m.transparent=!!dim;m.opacity=dim?.1:1;m.depthWrite=!dim;o.castShadow=!dim;}
  if(state.selected){const group=groups.get(state.selected),box=new THREE.Box3().setFromObject(group),target=box.getCenter(new THREE.Vector3()),desired=rest.get(state.selected).clone();if(state.removed.includes(state.selected))desired.add(new THREE.Vector3(...parts.find(p=>p.id===state.selected).offset));target.add(desired.sub(group.position).multiplyScalar(factor));const distance=Math.max(.25,box.getSize(new THREE.Vector3()).length()*2.1),position=target.clone().add(new THREE.Vector3(.65,.4,.85).normalize().multiplyScalar(distance));animations.push(animate(controls.target,{x:target.x,y:target.y,z:target.z,duration:reduced.matches?1:650}),animate(camera.position,{x:position.x,y:position.y,z:position.z,duration:reduced.matches?1:650}));}
 }
 const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let down;
 renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);const hit=ray.intersectObject(model,true).find(h=>h.object.material.opacity>.4);if(hit?.object.userData.partId)onPick(hit.object.userData.partId);});
 let previousAspect=0;const observer=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();if(!previousAspect||Math.abs(previousAspect-camera.aspect)>.25)home();previousAspect=camera.aspect;});observer.observe(host);
 renderer.setAnimationLoop(ms=>{controls.update();if(flow.visible)for(const {dot,curve,phase} of dots)dot.position.copy(curve.getPointAt(reduced.matches?phase:((ms/2600)+phase)%1));renderer.render(scene,camera);});
 setLook(currentLook,false);home();return {apply,home,setLook,setBrightness,getLook,dispose(){for(const a of animations)a.pause();observer.disconnect();renderer.setAnimationLoop(null);controls.dispose();clearFlow();const geometries=new Set(),mats=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)mats.add(o.material);});for(const g of geometries)g.dispose();for(const m of mats)m.dispose();environment.dispose();renderer.dispose();renderer.domElement.remove();}};
}
