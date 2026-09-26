"""ARC conceptual espresso machine. Metres. Blender 4.5 / 5.2.
Run: blender --background --python blender/build_scene.py -- --out public/model
In Higgsfield 3D Jutsu: run this source with scene_builder_3d_run_python.
No external assets, proprietary geometry or network access.
"""
import bpy, math, json, sys, os
from mathutils import Vector
from pathlib import Path

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version=0
scene=bpy.context.scene
scene.unit_settings.system='METRIC'
scene.unit_settings.scale_length=1
scene.render.engine='BLENDER_EEVEE' if bpy.app.version >= (5,0,0) else 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x=1400
scene.render.resolution_y=1100
scene.render.resolution_percentage=100
scene.render.fps=30
scene.frame_start=1
scene.frame_end=360
if scene.world is None: scene.world=bpy.data.worlds.new('ARC studio environment')
scene.world.color=(.12,.12,.12)
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.14,.18,.23,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.35
try: scene.view_settings.view_transform='AgX'
except: pass

def mat(name,color,metal=0,rough=.35):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal
    p.inputs['Roughness'].default_value=rough
    return m
steel=mat('Satin machined aluminium',(.51,.57,.62),.92,.24)
dark=mat('Graphite powder coat',(.032,.044,.051),.65,.32)
copper=mat('Brushed copper',(.64,.255,.11),.88,.23)
brass=mat('Brass compression fittings',(.57,.37,.105),.78,.26)
rubber=mat('EPDM black rubber',(.012,.016,.019),.05,.66)
wood=mat('Walnut handle',(.155,.061,.025),.06,.32)
white=mat('Warm porcelain',(.88,.83,.73),.05,.21)
ink=mat('Dial ink',(.02,.024,.027),0,.5)
water=mat('Reservoir smoked blue',(.062,.21,.26),.35,.22)
pcb=mat('Circuit board green',(.014,.082,.065),.35,.44)
lightblue=mat('Water path cyan',(.035,.62,.91),.2,.22)
amber=mat('Hot water amber',(.95,.31,.045),.35,.25)
for m in [lightblue,amber]:
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Emission Color'].default_value=m.diffuse_color; p.inputs['Emission Strength'].default_value=.6
groups={}; meta=[]
def group(id,label,offset,requires,description):
    o=bpy.data.objects.new(id,None); scene.collection.objects.link(o); groups[id]=o
    o['partId']=id; o['label']=label
    meta.append(dict(id=id,label=label,offset=[offset[0],offset[2],-offset[1]],requires=requires,description=description))
    return o
def finish(o,name,m,parent=None,bevel=0):
    o.name=name; o.data.materials.append(m)
    if parent: o.parent=groups[parent]
    if bevel:
        b=o.modifiers.new('Machined edge radius','BEVEL');b.width=bevel;b.segments=3
        n=o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
    if o.type=='MESH':
        for f in o.data.polygons:f.use_smooth=True
    return o
def box(name,loc,size,m,parent=None,r=.003):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,m,parent,r)
def cyl(name,loc,r,depth,m,parent=None,axis='Z',vertices=48):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=loc)
    o=bpy.context.object
    if axis=='Y':o.rotation_euler[0]=math.pi/2
    if axis=='X':o.rotation_euler[1]=math.pi/2
    return finish(o,name,m,parent,min(.0015,r/6))
def tube(name,points,r,m,parent=None):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=12;curve.bevel_depth=r;curve.bevel_resolution=3
    s=curve.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
    for p,co in zip(s.bezier_points,points):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,curve);scene.collection.objects.link(o);o.data.materials.append(m)
    if parent:o.parent=groups[parent]
    return o
def text(name,body,loc,size,m,parent=None):
    c=bpy.data.curves.new(name,'FONT');c.body=body;c.size=size;c.extrude=.00025;c.align_x='CENTER';c.align_y='CENTER'
    o=bpy.data.objects.new(name,c);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(math.pi/2,0,0);o.data.materials.append(m)
    if parent:o.parent=groups[parent]
    return o

group('chassis','Anchored chassis',(0,0,0),[],'The fixed base supports the prepared assembly. It stays anchored during the demonstration.')
group('fasteners','Housing fasteners',(0,0,.30),[],'Four illustrative housing screws. The dependency graph requires these to be released before the panels.')
group('shell_left','Left enclosure',(-.29,0,.045),['fasteners'],'Graphite side panel. Opens access to the reservoir and pump in this concept.')
group('shell_right','Right enclosure',(.31,.04,.045),['fasteners'],'Right panel and rear enclosure protect the internal assemblies.')
group('top','Top & control fascia',(0,.28,.29),['fasteners'],'The aluminium lid, front shield and upper fascia lift away together as a simplified assembly.')
group('reservoir','Water reservoir',(-.17,.17,.16),['shell_left','top'],'Stores the water supply. Its translucent-blue appearance is stylized; it is not a measured capacity.')
group('pump','Pressure pump',(-.25,-.12,.045),['shell_left','plumbing'],'The pump moves water from the reservoir towards the heating assembly. No pressure rating is claimed.')
group('boiler','Heating assembly',(.19,.045,.17),['shell_right','top','plumbing'],'Copper heating body warms the water before it reaches the brew group. Temperature is not simulated.')
group('plumbing','Water lines',(.02,.04,.105),['shell_left','shell_right'],'Prepared copper tubing connects the conceptual components. The highlighted route explains the sequence, not fluid physics.')
group('controller','Control module',(.32,.12,.17),['shell_right'],'A representative low-voltage control board. Components and wiring are illustrative.')
group('brew_group','Brew group',(0,-.16,.025),['top','plumbing','portafilter'],'Routes heated water through the coffee basket. This is an educational assembly, not service guidance.')
group('portafilter','Portafilter',(0,-.18,-.025),[],'The removable basket and walnut handle sit below the brew group.')
group('tray','Drip tray',(0,-.21,0),[],'Removable grate and tray beneath the brew area.')
group('gauge','Pressure dial',(-.10,-.16,.13),['top'],'A decorative pressure dial gives the concept a familiar interface; its needle is not a sensor reading.')

box('Base casting',(0,0,.035),(.36,.365,.035),dark,'chassis',.012)
box('Brushed base reveal',(0,0,.052),(.349,.354,.007),steel,'chassis',.004)
for x in [-.133,.133]:
    for y in [-.134,.134]:cyl('Vibration isolator',(x,y,.014),.022,.025,rubber,'chassis')
for x in [-.151,.151]:box('Internal chassis upright',(x,.114,.215),(.013,.035,.32),steel,'chassis')
box('Rear brace',(0,.12,.364),(.315,.025,.013),steel,'chassis')
for id,x in [('shell_left',-.17),('shell_right',.17)]:
    box('Side panel', (x,.016,.227),(.011,.321,.334),dark,id,.006)
    for z in [.15+i*.012 for i in range(12)]:box('Side ventilation detail',(x+(-.006 if x<0 else .006),.076,z),(.0015,.115,.003),rubber,id,.001)
box('Rear cover',(0,.172,.227),(.337,.01,.334),dark,'shell_right',.006)
box('Top plate',(0,.017,.398),(.354,.334,.012),steel,'top',.006)
box('Control fascia',(0,-.146,.353),(.327,.018,.075),steel,'top',.004)
box('Front interior shield',(0,-.128,.211),(.322,.009,.211),dark,'top',.004)
text('ARC wordmark','A R C',(.071,-.157,.355),.019,ink,'top')
text('Model designation','S T U D I O   /   0 1',(.063,-.157,.333),.0055,ink,'top')
for x in [.109,.131]:cyl('Control button',(x,-.161,.378),.006,.008,dark,'top','Y')
for x in [-.145,.145]:
    for y in [-.118,.147]:
        cyl('Housing screw',(x,y,.409),.004,.005,steel,'fasteners',vertices=24)
        box('Screw head slot',(x,y,.412),(.0045,.001,.0006),ink,'fasteners',.0002)
# Reservoir, lid and visible level ribs.
box('Reservoir tank',(-.086,.09,.275),(.09,.105,.199),water,'reservoir',.013)
box('Reservoir cap',(-.086,.09,.38),(.10,.115,.012),rubber,'reservoir',.004)
for z in [.21,.24,.27,.30,.33]:box('Level marking',(-.086,.036,z),(.045,.0015,.0015),steel,'reservoir',.0005)
# Pump motor, end caps, saddle and cable.
cyl('Pump motor',(-.086,.005,.125),.029,.105,steel,'pump','Y')
for y in [-.051,.061]:cyl('Pump vibration boot',(-.086,y,.125),.032,.012,rubber,'pump','Y')
box('Pump saddle',(-.086,.005,.085),(.079,.099,.013),dark,'pump')
cyl('Pump outlet',(-.086,-.063,.126),.009,.02,brass,'pump','Y',24)
# Copper heater with seams, bolts, heating terminals.
cyl('Copper heat vessel',(.066,.041,.245),.058,.185,copper,'boiler')
for z in [.151,.338]:
    cyl('Heater end plate',(.066,.041,z),.063,.013,brass,'boiler')
    for i in range(6):
        a=i*math.tau/6;cyl('Heater flange bolt',(.066+.047*math.cos(a),.041+.047*math.sin(a),z+.008),.0038,.006,steel,'boiler',vertices=6)
for z in [.176,.311]:cyl('Heater rolled seam',(.066,.041,z),.0595,.006,copper,'boiler')
for x in [.045,.087]:
    cyl('Insulated terminal',(x,.04,.36),.008,.03,white,'boiler')
    cyl('Terminal pin',(x,.04,.38),.003,.012,brass,'boiler')
# Deliberately prepared routing, kept one semantic assembly.
tube('Feed from tank',[(-.086,.09,.178),(-.112,.076,.15),(-.112,.016,.126),(-.086,-.059,.126)],.0045,copper,'plumbing')
tube('Pressure line',[(-.086,-.062,.126),(-.055,-.084,.139),(.05,-.081,.16),(.065,-.018,.185)],.0045,copper,'plumbing')
tube('Brew feed',[(.069,.036,.343),(.069,-.029,.36),(0,-.087,.335),(0,-.164,.281)],.0045,copper,'plumbing')
for x,y,z in [(-.086,-.065,.126),(.065,-.018,.185),(0,-.165,.285)]:cyl('Compression nut',(x,y,z),.009,.011,brass,'plumbing',vertices=6)
# PCB mounted to right interior.
box('Controller board',(.134,.081,.267),(.008,.132,.133),pcb,'controller',.002)
for y in [.032,.07,.111]:
    for z in [.237,.275]:box('Controller chip',(.125,y,z),(.012,.023,.022),ink,'controller',.001)
for z in [.219,.308]:box('Connector bank',(.12,.076,z),(.019,.086,.012),white,'controller',.001)
# Brew group and portafilter.
cyl('Brew group upper',(0,-.155,.274),.047,.049,steel,'brew_group')
cyl('Brew group locking ring',(0,-.155,.242),.054,.017,dark,'brew_group')
cyl('Shower screen',(0,-.155,.23),.040,.006,steel,'brew_group')
cyl('Portafilter basket',(0,-.155,.212),.044,.028,steel,'portafilter')
cyl('Portafilter collar',(0,-.155,.229),.048,.008,steel,'portafilter')
cyl('Handle stem',(0,-.221,.213),.011,.074,steel,'portafilter','Y')
cyl('Walnut handle',(0,-.297,.213),.016,.12,wood,'portafilter','Y')
cyl('Handle end cap',(0,-.359,.213),.015,.004,brass,'portafilter','Y')
tube('Dual spout',[(-.023,-.151,.186),(0,-.151,.181),(.023,-.151,.186)],.005,steel,'portafilter')
# Pressure instrument, fine tick marks and needle.
cyl('Dial bezel',(-.094,-.169,.355),.026,.013,steel,'gauge','Y')
cyl('Dial face',(-.094,-.1765,.355),.0225,.002,white,'gauge','Y')
for i in range(21):
    a=math.radians(-135+i*13.5);r=.018
    o=box('Dial tick',(-.094+math.sin(a)*r,-.178,.355+math.cos(a)*r),(.001,.0008,.003 if i%5==0 else .0015),ink,'gauge',.0001);o.rotation_euler[1]=a
o=box('Dial needle',(-.094,-.179,.36),(.0014,.001,.021),copper,'gauge',.0004);o.rotation_euler[1]=-.7
cyl('Needle pin',(-.094,-.180,.355),.0025,.0015,ink,'gauge','Y',24)
# Drip tray: slotted grate made of individual bars.
box('Drip tray basin',(0,-.11,.072),(.294,.134,.019),dark,'tray',.008)
for x in [-.135+i*.012 for i in range(23)]:box('Drainage grate bar',(x,-.11,.086),(.005,.12,.005),steel,'tray',.002)
box('Tray front lip',(0,-.18,.074),(.303,.009,.025),steel,'tray',.003)

# Stage and cinematography. Studio is excluded from portable product export locally.
cyl('Stage / obsidian plinth',(0,0,-.013),.365,.022,mat('Obsidian stone',(.018,.025,.03),.2,.32),vertices=128)
box('Studio floor',(0,0,-.035),(200,200,.012),mat('Studio charcoal',(.012,.018,.024),.05,.5),r=0)
def aim(o,target):o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(1.05,-1.55,.91));camera=bpy.context.object;camera.name='Delivery camera';camera.data.type='ORTHO';camera.data.ortho_scale=1.30;aim(camera,(0,0,.29));scene.camera=camera
def lamp(name,loc,power,color,size):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=color;d.shape='DISK';d.size=size
    o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=loc;aim(o,(0,0,.23))
lamp('Warm softbox / camera left',(-.7,-.65,1.2),90,(1,.77,.55),.8)
lamp('Cool strip / rim',(.75,.45,.9),140,(.52,.72,1),.6)
lamp('Front bounce',(.25,-1,.3),32,(.82,.91,1),.7)
d=bpy.data.lights.new('Portable warm key','POINT');d.energy=12;d.color=(1,.77,.57);d.shadow_soft_size=.35
o=bpy.data.objects.new('Portable warm key',d);scene.collection.objects.link(o);o.location=(-.6,-.5,1)

# Animation: rest 1-45, sequential reveal 45-145, hold to 270, close 285-345.
for i,p in enumerate(meta):
    o=groups[p['id']];off=p['offset'];offset=Vector((off[0],-off[2],off[1]))
    start=46+(0 if p['id']=='fasteners' else 16 if p['id'] in ['shell_left','shell_right','top'] else 35)
    for frame,position in [(1,Vector((0,0,0))),(start,Vector((0,0,0))),(start+62,offset),(270,offset),(345,Vector((0,0,0))),(360,Vector((0,0,0)))]:
        o.location=position;o.keyframe_insert(data_path='location',frame=frame)
scene.frame_set(1)
result={'parts':len(meta),'meshes':sum(o.type=='MESH' for o in bpy.data.objects),'units':'metres','restFrame':1,'explodedFrame':180,'finalFrame':360,'manifest':meta}

if 'artifacts' in globals():
    scene.render.resolution_x=512;scene.render.resolution_y=420
    for name,frame in [('assembled',1),('exploded',180)]:
        scene.frame_set(frame)
        camera.data.ortho_scale=1.5 if frame>1 else 1.02
        aim(camera,(0,0,.34 if frame>1 else .20))
        target=artifacts.file(name=name+'.png',media_type='image/png')
        if hasattr(scene.render.image_settings,'media_type'):scene.render.image_settings.media_type='IMAGE'
        scene.render.image_settings.file_format='PNG';scene.render.filepath=str(target.path)
        bpy.ops.render.render(write_still=True);target.publish()
    scene.frame_set(1);camera.data.ortho_scale=1.5;aim(camera,(0,0,.34))
else:
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('--out',default='public/model');parser.add_argument('--renders',action='store_true')
    args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
    out=Path(args.out).resolve();out.mkdir(parents=True,exist_ok=True)
    (out/'parts.json').write_text(json.dumps(meta,indent=2))
    bpy.ops.wm.save_as_mainfile(filepath=str(out/'arc.blend'))
    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.data.objects:
        if o.name in groups or (o.parent and o.parent.name in groups):o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(out/'arc.glb'),use_selection=True,export_format='GLB',export_animations=False,export_extras=True,export_apply=True)
    if args.renders:
        for name,frame in [('assembled',1),('exploded',180)]:
            scene.frame_set(frame);camera.data.ortho_scale=1.5 if frame>1 else 1.02;aim(camera,(0,0,.34 if frame>1 else .20));scene.render.image_settings.file_format='PNG';scene.render.filepath=str(out/(name+'.png'));bpy.ops.render.render(write_still=True)
