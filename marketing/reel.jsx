// Native Higgsedit. Actual Blender footage; no generative calls or third-party music.
import path from 'node:path';
export default async ({project})=>{
 const root=path.resolve(process.env.INSIDE_ROOT||process.cwd()),local=p=>path.join(root,p);
 const tall=process.env.REEL_FORMAT!=='4x5',H=tall?1920:1350,format=tall?'9x16':'4x5';
 const p=await project({dir:local(`marketing/higgsedit-${format}`),size:`1080x${H}`,fps:30,background:'#10191e'});
 const assets={};for(const name of ['hero','explode','flow','pump','assemble'])assets[name]=await p.add(local(`marketing/${name}.mp4`));assets.still=await p.add(local('public/model/assembled.png'));
 const white='#eff3f0',muted='#a8bcc4',accent='#eeb58a',brandY=tall?190:65,titleY=tall?330:185,subY=tall?540:354,imageY=tall?655:425,imageSize=tall?936:760;
 const scenes=[
  {at:0,dur:3,asset:'hero',k:'INSIDE THE SHOT',title:'This manual\ntakes itself apart.',sub:'An interactive product manual.'},
  {at:2.6,dur:5,asset:'explode',k:'01 / OPEN THE ASSEMBLY',title:'“Take it apart.”',sub:'Fourteen named assemblies. One prepared model.'},
  {at:7.2,dur:4,asset:'flow',k:'02 / FOLLOW THE WATER',title:'“Show me\nhow it works.”',sub:'Reservoir → pump → heater → brew group.'},
  {at:10.8,dur:3,asset:'pump',k:'03 / GET SPECIFIC',title:'“Just show\nme the pump.”',sub:'One part. Its role. A closer look.'},
  {at:13.4,dur:4.2,asset:'still',k:'04 / TEST THE RULES',title:'“Remove the\npump first.”',sub:'The authored dependency graph says no.',blocked:true},
  {at:17.2,dur:5,asset:'assemble',k:'05 / PUT IT BACK TOGETHER',title:'A manual\nyou can talk to.',sub:'Prepared commands + optional live language.'},
  {at:21.8,dur:5.2,asset:'still',k:'FREE SOURCE / EDITABLE MODEL',title:'Your product.\nIts next interface.',sub:'App + Blender source + Higgsfield / MCP guide.',cta:true}
 ];
 for(const s of scenes){const size=s.cta?(tall?700:590):imageSize,y=s.cta?(tall?680:433):imageY;
  const entrance=[{property:'opacity',from:0,to:1,at:.22,duration:.35,easing:'smooth'},{property:'offsetY',from:22,to:0,at:.18,duration:.5,easing:'house'}];
  const textFade=s.cta?[]:[{property:'opacity',keyframes:[{at:0,value:1},{at:s.dur-.4,value:1},{at:s.dur-.22,value:0},{at:s.dur,value:0}]}];
  p.compose(<frame x={0} y={0} width={1080} height={H} layout="none">
   <frame x={(1080-size)/2} y={y} width={size} height={size} layout="none" clip={true} radius={10} animate={[{property:'opacity',from:0,to:1,duration:.4,easing:'smooth'}]}>
    <media x={0} y={0} file={assets[s.asset]} width={size} height={size} fit="contain" />
   </frame>
   <frame x={72} y={titleY-48} width={936} height={252} layout="none" animate={textFade}>
    <text x={0} y={0} width={936} height={34} fontFamily="Montserrat" fontSize={22} fontWeight={600} letterSpacing={2} color={accent} animate={entrance}>{s.k}</text>
    <text x={0} y={48} width={936} height={185} fontFamily="Montserrat" fontSize={tall?76:65} fontWeight={700} lineHeight={1.1} color={white} animate={entrance}>{s.title}</text>
   </frame>
   <text x={72} y={subY} width={936} height={65} fontFamily="Montserrat" fontSize={25} color={muted} animate={[{property:'opacity',keyframes:[{at:0,value:0},{at:.22,value:0},{at:.6,value:1},{at:s.dur-.4,value:1},{at:s.dur-.22,value:s.cta?1:0}]}]}>{s.sub}</text>
   {s.blocked&&<frame x={112} y={tall?1110:805} width={856} height={245} layout="none" radius={12} background="#10191e" animate={[{property:'opacity',from:0,to:1,at:.4,duration:.4},{property:'offsetY',from:30,to:0,at:.4,duration:.6,easing:'house'},...textFade]}>
    <rect x={0} y={0} width={5} height={245} fill={accent}/>
    <text x={30} y={29} width={796} height={48} fontFamily="Montserrat" fontSize={30} fontWeight={700} color={accent}>REMOVAL BLOCKED</text>
    <text x={30} y={93} width={796} height={120} fontFamily="Montserrat" fontSize={28} lineHeight={1.45} color={white}>Release fasteners. Open the enclosure.\nDisconnect the water lines. Then remove.</text>
   </frame>}
   {s.cta&&<frame x={72} y={tall?1480:1103} width={936} height={105} layout="none" radius={12} background={accent} animate={[{property:'opacity',from:0,to:1,at:.4,duration:.5},{property:'offsetY',from:22,to:0,at:.4,duration:.6,easing:'house'}]}>
    <text x={24} y={30} width={888} height={62} fontFamily="Montserrat" fontSize={36} fontWeight={700} align="center" color="#10191e">Comment “CODE” to get the link →</text>
   </frame>}
  </frame>,{at:s.at,dur:s.dur,name:s.k});
 }
 p.compose(<frame x={0} y={0} width={1080} height={H} layout="none">
  <text x={72} y={brandY} width={600} height={35} fontFamily="Montserrat" fontSize={23} fontWeight={600} letterSpacing={2} color={white}>AI CONCEPT LAB</text>
  <text x={791} y={brandY} width={237} height={35} fontFamily="Montserrat" fontSize={22} color={white}>3D LAB // 005</text>
  <rect x={72} y={brandY+48} width={936} height={1} fill="#46545a"/>
  <rect x={72} y={brandY+47} width={936} height={3} fill={accent} animate={[{property:'scaleX',from:0,to:1,duration:27,easing:'linear'}]}/>
  <rect x={72} y={tall?1705:1240} width={936} height={1} fill="#46545a"/>
  <text x={72} y={tall?1729:1262} width={936} height={45} fontFamily="Montserrat" fontSize={19} color={muted}>CONCEPTUAL ASSEMBLY / HIGGSFIELD 3D JUTSU + BLENDER</text>
 </frame>,{at:0,dur:27,name:'Brand and progress'});
 await p.frame(.9,local(`marketing/reel-preview-${format}.png`));
 if(!process.env.PREVIEW_ONLY)await p.render(local(`marketing/inside-the-shot-reel-${format}.mp4`),{depth:8,bitrate:8000000,concurrency:2});
};
