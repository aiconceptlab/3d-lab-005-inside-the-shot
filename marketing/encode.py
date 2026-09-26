"""Requires FFmpeg on PATH, or pip install imageio-ffmpeg. No external media."""
import subprocess,shutil
from pathlib import Path
root=Path(__file__).resolve().parent
ff=shutil.which('ffmpeg')
if not ff:
 import imageio_ffmpeg
 ff=imageio_ffmpeg.get_ffmpeg_exe()
for name in ['hero','explode','flow','pump']:
 subprocess.run([ff,'-hide_banner','-loglevel','error','-y','-framerate','24','-i',str(root/'frames'/name/'%04d.jpg'),'-c:v','libx264','-crf','18','-preset','slow','-pix_fmt','yuv420p','-movflags','+faststart',str(root/(name+'.mp4'))],check=True)
subprocess.run([ff,'-hide_banner','-loglevel','error','-y','-i',str(root/'explode.mp4'),'-vf','reverse','-c:v','libx264','-crf','18','-preset','slow','-pix_fmt','yuv420p','-movflags','+faststart',str(root/'assemble.mp4')],check=True)
