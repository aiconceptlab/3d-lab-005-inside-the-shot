"""Trusted builder for validated scene JSON. No generated Python is executed.
blender --background --python blender/build_project.py -- --scene scene.json --out build
For Jutsu: set SCENE_SPEC to the validated JSON object before running this source.
"""
import bpy, json, math, sys
from pathlib import Path
from mathutils import Vector, Matrix, Euler

if 'SCENE_SPEC' not in globals():
    import argparse
    p=argparse.ArgumentParser();p.add_argument('--scene',required=True);p.add_argument('--out',required=True);p.add_argument('--renders',action='store_true')
    args=p.parse_args(sys.argv[sys.argv.index('--')+1:]);SCENE_SPEC=json.loads(Path(args.scene).read_text(encoding='utf-8-sig'))

spec=SCENE_SPEC
assert isinstance(spec.get('parts'),list) and 1<=len(spec['parts'])<=24
assert sum(len(p['elements']) for p in spec['parts'])<=240
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version=0
scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE' if bpy.app.version>=(5,0,0) else 'BLENDER_EEVEE_NEXT'
scene.unit_settings.system='METRIC';scene.render.resolution_x=1000;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.render.fps=30;scene.frame_start=1;scene.frame_end=180
scene.world=bpy.data.worlds.new('Product studio');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.16,.19,.23,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.3
try:scene.view_settings.view_transform='AgX'
except:pass
def linear(c):return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
def color(hex):return tuple(linear(int(hex[i:i+2],16)/255) for i in (1,3,5))
def coords(v):return Vector((v[0],-v[2],v[1]))
C=Matrix(((1,0,0),(0,0,-1),(0,1,0)))
groups={};product=[]
for part in spec['parts']:
    parent=bpy.data.objects.new(part['id'],None);scene.collection.objects.link(parent);parent['partId']=part['id'];groups[part['id']]=parent;product.append(parent)
    for i,el in enumerate(part['elements']):
        shape=el['shape'];size=el['size']
        assert shape in ['box','cylinder','sphere','torus'] and all(.002<=v<=3 for v in size)
        if shape=='box':bpy.ops.mesh.primitive_cube_add(size=1)
        elif shape=='cylinder':bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=.5,depth=1)
        elif shape=='sphere':bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=24,radius=.5)
        else:bpy.ops.mesh.primitive_torus_add(major_segments=64,minor_segments=12,major_radius=.49,minor_radius=.01)
        o=bpy.context.object;o.name=f"{part['id']}__{i:02d}";o.parent=parent;o['materialRole']=el['role']
        # Convert canonical Three.js primitive axes to Blender coordinates in mesh space.
        if shape in ['box','sphere']:basis=C
        elif shape=='cylinder':basis=Matrix.Identity(3) # Blender Z cylinder corresponds to Three Y.
        else:basis=C # Three torus lies in XY; Blender XY is remapped to XZ.
        for vertex in o.data.vertices:vertex.co=basis@vertex.co
        o.scale=(size[0],size[2],size[1]);o.location=coords(el['position'])
        o.rotation_euler=(C@(Matrix.Rotation(el['rotation'][0],3,'X')@Matrix.Rotation(el['rotation'][1],3,'Y')@Matrix.Rotation(el['rotation'][2],3,'Z'))@C.inverted()).to_euler()
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        if shape in ['box','cylinder']:
            b=o.modifiers.new('Subtle machined edges','BEVEL');b.width=min(size)*.075;b.segments=3
            o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
        for poly in o.data.polygons:poly.use_smooth=True
        m=bpy.data.materials.new(el['role']);m.use_nodes=True;m.diffuse_color=(*color(el['color']),1)
        bsdf=m.node_tree.nodes['Principled BSDF'];bsdf.inputs['Base Color'].default_value=m.diffuse_color;bsdf.inputs['Metallic'].default_value=el['metalness'];bsdf.inputs['Roughness'].default_value=el['roughness']
        if el['role']=='body':bsdf.inputs['Coat Weight'].default_value=.2
        o.data.materials.append(m);product.append(o)
    for frame,offset in [(1,(0,0,0)),(25,(0,0,0)),(90,part['offset'] if spec['mode']=='assembly' else (0,0,0)),(125,part['offset'] if spec['mode']=='assembly' else (0,0,0)),(180,(0,0,0))]:
        parent.location=coords(offset);parent.keyframe_insert('location',frame=frame)
scene.frame_set(1);bpy.context.view_layer.update()
points=[o.matrix_world@Vector(c) for o in product if o.type=='MESH' for c in o.bound_box]
lo=Vector(tuple(min(p[i] for p in points) for i in range(3)));hi=Vector(tuple(max(p[i] for p in points) for i in range(3)));centre=(lo+hi)/2;span=max(hi-lo)
def aim(o,t):o.rotation_euler=(t-o.location).to_track_quat('-Z','Y').to_euler()
def light(name,position,power,colour,size):
    d=bpy.data.lights.new(name,'AREA');d.energy=power*span*span;d.color=colour;d.shape='DISK';d.size=size*span;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=centre+Vector(position)*span;aim(o,centre)
light('Warm studio key',(-1,-1,1.7),220,(1,.84,.67),1.4);light('Cool rim',(1,.7,1.2),300,(.60,.78,1),1);light('Soft front fill',(.6,-1.4,.4),90,(.87,.94,1),1.5)
bpy.ops.object.camera_add(location=centre+Vector((1.1,-1.65,.95))*span);cam=bpy.context.object;cam.name='Product camera';cam.data.type='ORTHO';cam.data.ortho_scale=span*1.8;aim(cam,centre);scene.camera=cam
scene.eevee.taa_render_samples=24
result={'parts':len(groups),'elements':len(product)-len(groups),'span':span,'restFrame':1,'explodedFrame':100,'finalFrame':180}
if 'artifacts' in globals():
    scene.eevee.taa_render_samples=8
else:
    out=Path(args.out).resolve();out.mkdir(parents=True,exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(out/'model.blend'))
    bpy.ops.object.select_all(action='DESELECT')
    for o in product:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(out/'model.glb'),use_selection=True,export_format='GLB',export_animations=False,export_extras=True,export_apply=True)
    if args.renders:
        for name,frame in [('assembled',1),('exploded',100)]:
            scene.frame_set(frame);bpy.context.view_layer.update()
            pts=[o.matrix_world@Vector(c) for o in product if o.type=='MESH' for c in o.bound_box]
            mn=Vector(tuple(min(p[i] for p in pts) for i in range(3)));mx=Vector(tuple(max(p[i] for p in pts) for i in range(3)));target=(mn+mx)/2
            cam.data.ortho_scale=max(mx-mn)*1.85;cam.location=target+Vector((1.1,-1.65,.95))*span;aim(cam,target)
            scene.render.image_settings.file_format='PNG';scene.render.filepath=str(out/(name+'.png'));bpy.ops.render.render(write_still=True)
