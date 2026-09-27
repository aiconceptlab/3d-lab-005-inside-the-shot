import bpy, json
from pathlib import Path
root=Path.cwd()
for slug in ['chair','fan']:
 spec=json.loads((root/'public/samples'/slug/'scene.json').read_text())
 bpy.ops.wm.open_mainfile(filepath=str(root/'public/samples'/slug/'model.blend'))
 scene=bpy.context.scene
 scene.frame_set(1);rest={p['id']:tuple(bpy.data.objects[p['id']].location) for p in spec['parts']}
 scene.frame_set(100)
 for p in spec['parts']:
  pos=tuple(bpy.data.objects[p['id']].location)
  assert (pos==rest[p['id']])==p['anchored'], (slug,p['id'],'incorrect exploded state')
 scene.frame_set(180)
 assert all(tuple(bpy.data.objects[p['id']].location)==rest[p['id']] for p in spec['parts'])
 print('VERIFIED',slug,len(rest),'parts; rest/explosion/return')
