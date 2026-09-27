import * as THREE from 'three';
export function createProduct(project){
 const root=new THREE.Group();root.name=project.title;
 for(const part of project.parts){const group=new THREE.Group();group.name=part.id;root.add(group);
  for(const el of part.elements){let geometry;
   if(el.shape==='box')geometry=new THREE.BoxGeometry(1,1,1);
   else if(el.shape==='cylinder')geometry=new THREE.CylinderGeometry(.5,.5,1,48);
   else if(el.shape==='sphere')geometry=new THREE.SphereGeometry(.5,40,24);
   else geometry=new THREE.TorusGeometry(.49,.01,12,64); // Full outside diameter = 1; axis Z.
   const material=new THREE.MeshPhysicalMaterial({name:el.role,color:el.color,metalness:el.metalness,roughness:el.roughness,clearcoat:el.role==='body'?.2:0,clearcoatRoughness:.25});
   const mesh=new THREE.Mesh(geometry,material);mesh.scale.set(...el.size);mesh.position.set(...el.position);mesh.rotation.set(...el.rotation);mesh.userData.materialRole=el.role;group.add(mesh);
  }
 }
 return root;
}
