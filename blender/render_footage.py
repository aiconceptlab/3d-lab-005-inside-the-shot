"""Render deterministic footage from arc.blend. No model generation calls.
blender --background public/model/arc.blend --python blender/render_footage.py
Frames go to marketing/frames (gitignored). Encode with marketing/encode.py.
"""
import bpy,math,json
from pathlib import Path
from mathutils import Vector
root=Path(bpy.data.filepath).parents[2]
scene=bpy.context.scene;camera=scene.camera
scene.render.resolution_x=1080;scene.render.resolution_y=1080;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='JPEG';scene.render.image_settings.quality=95
scene.render.fps=24
if hasattr(scene,'eevee') and hasattr(scene.eevee,'taa_render_samples'):scene.eevee.taa_render_samples=32
parts=json.loads((root/'public/model/parts.json').read_text())
groups={p['id']:bpy.data.objects[p['id']] for p in parts}
for o in groups.values():o.animation_data_clear()
def smooth(t):t=max(0,min(1,t));return t*t*(3-2*t)
def aim(target):camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler()
def pose(t):
 for p in parts:
  x,y,z=p['offset'];groups[p['id']].location=Vector((x,-z,y))*t
pose(1)
anchors={'reservoir':Vector((-.086,.09,.178)),'pump':Vector((-.086,.005,.125)),'boiler':Vector((.066,.041,.245)),'brew_group':Vector((0,-.155,.274))}
route=[anchors[id]+groups[id].location for id in ['reservoir','pump','boiler','brew_group']]
flow_objects=[];dots=[]
def glowing(name,color):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=(*color,1);n.inputs['Emission Color'].default_value=(*color,1);n.inputs['Emission Strength'].default_value=2;return m
for i in range(3):
 color=(.035,.56,1) if i<2 else (1,.3,.035);m=glowing('Illustrative flow '+str(i),color)
 a,b=route[i:i+2];mid=(a+b)/2;mid.y-=.06
 curve=bpy.data.curves.new('Illustrated water path','CURVE');curve.dimensions='3D';curve.bevel_depth=.0022;curve.bevel_resolution=3;s=curve.splines.new('BEZIER');s.bezier_points.add(2)
 for p,co in zip(s.bezier_points,[a,mid,b]):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
 o=bpy.data.objects.new('Flow route '+str(i),curve);scene.collection.objects.link(o);o.data.materials.append(m);flow_objects.append(o)
 for j in range(4):
  bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=.005);dot=bpy.context.object;dot.name='Flow marker';dot.data.materials.append(m);flow_objects.append(dot);dots.append((dot,a,mid,b,j/4))
shots=[('hero',72),('explode',120),('flow',96),('pump',72)]
for name,count in shots:
 folder=root/'marketing/frames'/name;folder.mkdir(parents=True,exist_ok=True)
 for frame in range(count):
  t=frame/(count-1)
  for o in flow_objects:o.hide_render=name!='flow'
  for o in bpy.data.objects:
   if o.parent and o.parent.name in groups:o.hide_render=name=='pump' and o.parent.name!='pump'
  if name=='hero':pose(0);camera.data.ortho_scale=1.01;angle=.55+t*.10;target=(0,0,.21)
  elif name=='explode':
   for p in parts:
    delay=0 if p['id']=='fasteners' else .10 if p['id'] in ['shell_left','shell_right','top'] else .23
    x,y,z=p['offset'];groups[p['id']].location=Vector((x,-z,y))*smooth((t-delay)/.55)
   camera.data.ortho_scale=1.10+.38*smooth(t);angle=.62;target=(0,0,.25+.09*smooth(t))
  elif name=='flow':pose(1);camera.data.ortho_scale=1.48;angle=.62+t*.03;target=(0,0,.34)
  else:pose(1);camera.data.ortho_scale=.24;angle=.65+t*.17;target=tuple(anchors['pump']+groups['pump'].location)
  focus=Vector(target);camera.location=focus+Vector((math.sin(angle)*1.8,-math.cos(angle)*1.8,.68));aim(target)
  for dot,a,mid,b,phase in dots:
   u=(t*2+phase)%1;dot.location=(1-u)**2*a+2*(1-u)*u*mid+u*u*b
  scene.render.filepath=str(folder/f'{frame:04d}.jpg');bpy.ops.render.render(write_still=True)
  if frame==count//2:
   scene.render.image_settings.file_format='PNG';scene.render.filepath=str(root/'marketing'/f'{name}-still.png');bpy.ops.render.render(write_still=True);scene.render.image_settings.file_format='JPEG'
 print('SHOT_COMPLETE',name,flush=True)
