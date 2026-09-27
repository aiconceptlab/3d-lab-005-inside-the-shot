"""Create original, reusable sample manuals; requires reportlab."""
import json,textwrap
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
root=Path(__file__).resolve().parents[1]
for slug in ['chair','fan']:
    folder=root/'public/samples'/slug;spec=json.loads((folder/'scene.json').read_text())
    c=canvas.Canvas(str(folder/'manual.pdf'),pagesize=(595,842));c.setTitle(spec['title']+' - Original concept manual')
    def frame(n,title):
        c.setFillColor(HexColor('#10191e'));c.rect(0,0,595,842,fill=1,stroke=0)
        c.setFillColor(HexColor('#eeb58a'));c.setFont('Helvetica-Bold',9);c.drawString(36,800,'AI CONCEPT LAB / ORIGINAL SAMPLE MANUAL')
        c.setFillColor(HexColor('#eef2f0'));c.setFont('Helvetica-Bold',25);c.drawString(36,757,title)
        c.setStrokeColor(HexColor('#52626a'));c.line(36,734,559,734);c.line(36,44,559,44)
        c.setFont('Helvetica',8);c.setFillColor(HexColor('#afc2ca'));c.drawString(36,27,'Concept visualization. Not a manufacturer specification or repair guide.');c.drawRightString(559,27,str(n))
    frame(1,spec['title'])
    c.drawImage(str(folder/'assembled.png'),36,435,300,280,preserveAspectRatio=True,anchor='c',mask='auto')
    c.setFillColor(HexColor('#eeb58a'));c.setFont('Helvetica-Bold',12);c.drawString(352,686,'PARTS INDEX')
    c.setFillColor(HexColor('#eef2f0'));c.setFont('Helvetica',10)
    for i,p in enumerate(spec['parts']):c.drawString(352,659-i*23,f"{i+1:02d}  {p['label']}")
    y=406
    for p in spec['parts']:
        c.setFillColor(HexColor('#eeb58a'));c.setFont('Helvetica-Bold',10);c.drawString(36,y,p['label']);y-=14
        c.setFillColor(HexColor('#e3ecec'));c.setFont('Helvetica',9)
        for line in textwrap.wrap(p['description'],100):c.drawString(36,y,line);y-=12
        y-=9
    c.showPage();frame(2,'How the components fit')
    c.drawImage(str(folder/'exploded.png'),36,188,523,523,preserveAspectRatio=True,mask='auto')
    c.setFillColor(HexColor('#e3ecec'));c.setFont('Helvetica',11)
    for i,line in enumerate(textwrap.wrap('This illustration separates the named components for inspection. Positions, surface finishes and dimensions are a design concept. The order of movement is presentation staging, not a tested disassembly or assembly procedure.',87)):c.drawString(36,159-i*17,line)
    c.save()
print('Two original illustrated manuals created.')
