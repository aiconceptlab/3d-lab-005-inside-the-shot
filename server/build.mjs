import fs from 'node:fs/promises';import path from 'node:path';import {spawn} from 'node:child_process';
import {ROOT,projectDir} from './store.mjs';
export async function buildBlender(project){
 if(!process.env.BLENDER_PATH)return null;
 const dir=path.join(projectDir(project.id),'build');await fs.mkdir(dir,{recursive:true});const input=path.join(dir,'scene.json');await fs.writeFile(input,JSON.stringify(project.analysis));
 await new Promise((resolve,reject)=>{
  const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>/^(PATH|SystemRoot|WINDIR|TEMP|TMP|HOME|USERPROFILE|APPDATA|LOCALAPPDATA|PROGRAMDATA)$/i.test(k)));
  const child=spawn(process.env.BLENDER_PATH,['--background','--factory-startup','--disable-autoexec','--python',path.join(ROOT,'blender/build_project.py'),'--','--scene',input,'--out',dir,'--renders'],{shell:false,windowsHide:true,env,stdio:['ignore','ignore','pipe']});
  let error='';child.stderr.on('data',b=>error=(error+b).slice(-4000));
  const timer=setTimeout(()=>{child.kill();reject(Error('Blender exceeded its 90-second build limit.'));},90000);
  child.once('error',()=>{clearTimeout(timer);reject(Error('Could not launch Blender. Check BLENDER_PATH.'));});
  child.once('exit',code=>{clearTimeout(timer);code===0?resolve():reject(Error('Blender could not build this scene. The browser preview remains available.'));});
 });
 for(const name of ['model.glb','model.blend','assembled.png','exploded.png'])await fs.access(path.join(dir,name));
 return {glb:`/api/projects/${project.id}/build/model.glb`,blend:`/api/projects/${project.id}/build/model.blend`,preview:`/api/projects/${project.id}/build/assembled.png`};
}
