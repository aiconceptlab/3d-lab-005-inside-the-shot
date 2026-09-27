// Native Higgsedit showcase using actual app screenshots and Blender stills.
// This is an animated presentation, not footage of an automatic AI reconstruction.
import path from 'node:path';
export default async({project})=>{
 const root=path.resolve(process.env.INSIDE_ROOT||process.cwd()),tall=process.env.REEL_FORMAT==='9x16',H=tall?1920:1350,format=tall?'9x16':'4x5';
 const p=await project({dir:path.join(root,'marketing/higgsedit-anything-'+format),size:`1080x${H}`,fps:30,background:'#10191e'});
 const files=['public/samples/chair/exploded.png','public/samples/fan/pages/source-1-p1.png','public/samples/fan/exploded.png','marketing/inside-anything-fan.png','public/samples/chair/assembled.png'];const media=[];for(const f of files)media.push(await p.add(path.join(root,f)));
 const scenes=[['Your manual.\nNow in 3D.','Upload. Review. Explore.','PREPARED CHAIR EXAMPLE'],['Start with\nwhat you have.','Photos, an illustrated manual, or both.','SOURCE PAGES + PART REFERENCES'],['One lab.\nDifferent objects.','Separate parts. An approximate concept.','PREPARED FAN EXAMPLE'],['Light it.\nMake it yours.','Finishes, specularity and studio lighting.','ACTUAL APP / MATERIAL PRESET'],['Free source.\nYour next build.','Optional vision API or connected-assistant import.','BLENDER + HIGGSFIELD MCP GUIDE']];
 const white='#eff3f0',accent='#eeb58a',muted='#a8bcc4',brandY=tall?175:65,titleY=tall?335:185,imageY=tall?650:462,imageSize=tall?850:655,duration=22.4;
 for(let i=0;i<5;i++){const at=i*4.4,dur=4.8,entry=[{property:'opacity',from:0,to:1,at:.18,duration:.4,easing:'smooth'},{property:'offsetY',from:24,to:0,at:.18,duration:.6,easing:'house'}];
  p.compose(<frame x={0} y={0} width={1080} height={H} layout="none" background="#10191e" animate={[{property:'opacity',from:0,to:1,duration:.4,easing:'smooth'}]}>
   <text x={72} y={titleY} width={936} height={210} fontFamily="Montserrat" fontWeight={700} fontSize={tall?84:78} lineHeight={1.12} color={white} animate={entry}>{scenes[i][0]}</text>
   <text x={72} y={titleY+205} width={936} height={65} fontFamily="Montserrat" fontSize={26} color={muted} animate={entry}>{scenes[i][1]}</text>
   <frame x={(1080-imageSize)/2} y={imageY} width={imageSize} height={imageSize} layout="none" radius={12} clip={true} animate={[{property:'opacity',from:0,to:1,at:.2,duration:.5,easing:'smooth'},{property:'offsetY',from:16,to:0,at:.2,duration:.8,easing:'house'}]}><media x={0} y={0} width={imageSize} height={imageSize} file={media[i]} fit="contain"/></frame>
   {i<4&&<text x={72} y={tall?1580:1170} width={936} height={45} fontFamily="Montserrat" fontSize={23} fontWeight={600} color={accent} animate={entry}>{scenes[i][2]}</text>}
   {i===4&&<frame x={72} y={tall?1535:1125} width={936} height={92} layout="none" radius={12} background={accent} animate={[{property:'opacity',from:0,to:1,at:.6,duration:.5},{property:'offsetY',from:20,to:0,at:.6,duration:.6,easing:'house'}]}><text x={20} y={25} width={896} height={58} fontFamily="Montserrat" fontSize={35} fontWeight={700} align="center" color="#10191e">Comment “CODE” to get the link →</text></frame>}
  </frame>,{at,dur:i===4?4.8:dur,name:scenes[i][2]});
 }
 const end=22.4;
 p.compose(<frame x={0} y={0} width={1080} height={H} layout="none"><text x={72} y={brandY} width={580} height={35} fontFamily="Montserrat" fontSize={23} fontWeight={600} letterSpacing={2} color={white}>AI CONCEPT LAB</text><text x={791} y={brandY} width={237} height={35} fontFamily="Montserrat" fontSize={22} color={white}>3D LAB // 005</text><rect x={72} y={brandY+48} width={936} height={1} fill="#46545a"/><rect x={72} y={brandY+47} width={936} height={3} fill={accent} animate={[{property:'scaleX',from:0,to:1,duration:end,easing:'linear'}]}/><rect x={72} y={tall?1710:1240} width={936} height={1} fill="#46545a"/><text x={72} y={tall?1738:1265} width={936} height={42} fontFamily="Montserrat" fontSize={19} color={muted}>INSIDE ANYTHING / CONCEPT GEOMETRY, NOT ENGINEERING CAD</text></frame>,{at:0,dur:end,name:'Brand + progress'});
 await p.frame(1.2,path.join(root,`marketing/inside-anything-reel-cover-${format}.png`));
 if(!process.env.PREVIEW_ONLY)await p.render(path.join(root,`marketing/inside-anything-reel-${format}.mp4`),{depth:8,bitrate:8000000,concurrency:2});
};
