"""Run as a separate read-only scene_builder_3d_query_python after the build settles.
This uses the Higgsfield artifacts API, not local filesystem output.
"""
import bpy
s=bpy.context.scene
s.frame_set(180)
s.render.engine='BLENDER_EEVEE'
s.eevee.taa_render_samples=8
s.render.resolution_x=384;s.render.resolution_y=384;s.render.resolution_percentage=100
s.render.image_settings.media_type='IMAGE';s.render.image_settings.file_format='PNG'
target=artifacts.file(name='arc-cloud-exploded.png',media_type='image/png')
s.render.filepath=str(target.path)
bpy.ops.render.render(write_still=True)
target.publish()
result={'frame':180,'engine':s.render.engine,'size':384}
