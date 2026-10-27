"""Diagrama as frentes oficiais com os componentes editáveis aprovados.

Arte ilustrada vem exclusivamente da image_gen; este script compõe os arquivos
de produção e o símbolo vetorial, sem redesenhar ou transformar as ilustrações.
"""
from pathlib import Path
import argparse,hashlib,io,json,shutil,sys,html
HERE=Path(__file__).resolve().parent
PROJECT=HERE.parents[1];HUB=PROJECT.parents[1];ORIGIN=HUB/'ideias/duelo-de-magos'
OUTPUT=PROJECT/'arte/terras-despertas/edicao-v1';OUTPUT.mkdir(parents=True,exist_ok=True)
parser=argparse.ArgumentParser();parser.add_argument('--only-ready',action='store_true');args=parser.parse_args()
sys.path.insert(0,str(ORIGIN/'scripts'))
import exportar_fiel as F
from PIL import Image,ImageDraw
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
import pypdfium2 as pdfium

data=json.loads((HERE/'cartas-edicao-v1.json').read_text(encoding='utf-8'));cards=data['cards']
F.ROOT=HUB;F.QA=OUTPUT/'componentes-qa';F.QA.mkdir(exist_ok=True)
F.COMPONENTS=OUTPUT/'componentes';F.COMPONENTS.mkdir(exist_ok=True)
for path in (ORIGIN/'arte/referencia-fixa/componentes-v0.4').iterdir():
    if path.is_file() and path.suffix in ['.png','.json'] and not (F.COMPONENTS/path.name).exists():shutil.copy2(path,F.COMPONENTS/path.name)
F.CHECKS[:]=[c['id'] for c in cards];F.B.ARTROOT=OUTPUT;F.B.ARTS={};F.BOUNDS={}
atlas=OUTPUT/'atlas-original.png'
if not atlas.exists():shutil.copy2(OUTPUT.parent/'piloto-v02/atlas-ilustracoes.png',atlas)
aw,ah=Image.open(atlas).size
ready=[]
for c in cards:
    if c['number']<=12:
        row,col=divmod(c['artIndex'],4);F.B.ARTS[c['id']]={'file':atlas.name}
        F.BOUNDS[c['id']]={'box':(col*aw/4+2,row*ah/3+2,(col+1)*aw/4-2,(row+1)*ah/3-2)}
    else:
        art=OUTPUT/'ilustracoes'/(c['id']+'.png')
        if not art.exists():
            if args.only_ready:continue
            raise FileNotFoundError(art)
        w,h=Image.open(art).size;F.B.ARTS[c['id']]={'file':'ilustracoes/'+art.name};F.BOUNDS[c['id']]={'box':(0,0,w,h)}
    ready.append(c)
original_markup=F.markup
F.markup=lambda t:original_markup(t).replace('\n','<br/>').replace('Ressonância','<b>Ressonância</b>')
original_footer=F.footer
def symbol(cv,x,y,size,metal):
    cv.saveState();cv.translate(x,y);cv.scale(size/32,size/32)
    cv.setLineWidth(1.3);cv.setStrokeColor(colors.HexColor('#272329'));cv.setFillColor(colors.HexColor(metal));cv.circle(16,23,6,stroke=1,fill=1)
    p=cv.beginPath();p.moveTo(2,11)
    for a,b in [(10,22),(16,13),(22,22),(30,11),(24,9),(8,9)]:p.lineTo(a,b)
    p.close();cv.drawPath(p,stroke=1,fill=1)
    cv.setStrokeColor(colors.HexColor(metal));cv.setLineWidth(2)
    for x1,y1,x2,y2 in [(16,13,16,2),(16,7,9,3),(16,7,23,3),(13,10,6,8),(19,10,26,8)]:cv.line(x1,y1,x2,y2)
    cv.restoreState()
metals={'Comum':'#847b70','Incomum':'#a4becb','Rara':'#d6a440'}
def footer(cv,c):
    original_footer(cv,c)
    if c['type']=='Monstro':
        F.box_at(cv,(838,692,986,743),312,646,148,51);cv.setFillColor(F.INK);cv.setFont('RefBold',32);cv.drawCentredString(386,23,f"{c['force']} / {c['vigor']}")
    # Mesmo local/escala do selo HTML. O PNG exportado também tem símbolo real.
    cv.setFillColor(F.PAPER);cv.circle(434,593,17,stroke=0,fill=1)
    symbol(cv,418,577,32,metals[c['rarity']])
    cv.setFillColor(F.INK);cv.setFont('RefBody',8);cv.drawString(27,5,f"TDP {c['number']:03}/060  ·  {c['rarity']}")
F.footer=footer
manifest=[]
for c in ready:
    path=OUTPUT/(c['id']+'.png')
    buf=io.BytesIO();cv=canvas.Canvas(buf,pagesize=(F.B.CW,F.B.CH),pageCompression=1);F.draw_card(cv,c,0,0,c['number']);cv.showPage();cv.save()
    doc=pdfium.PdfDocument(buf.getvalue());page=doc[0];bitmap=page.render(scale=3,fill_color=(255,255,255,255));image=bitmap.to_pil();image.save(path)
    image.convert('RGB').save(OUTPUT/(c['id']+'.webp'),quality=87,method=6)
    manifest.append(dict(id=c['id'],number=c['number'],sha256=hashlib.sha256(path.read_bytes()).hexdigest(),width=image.width,height=image.height,metrics=F.B.METRICS[c['id']]))
    bitmap.close();page.close();doc.close()

svg='''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g fill="#d6a440" stroke="#272329" stroke-width="1.3"><circle cx="16" cy="9" r="6"/><path d="M2 21 10 10l6 9 6-9 8 11-6 2H8z"/></g><path d="M16 19v11m0-5-7 4m7-4 7 4m-10-7-7 2m13-2 7 2" fill="none" stroke="#d6a440" stroke-width="2"/><path d="m10 15 3 5H7zm12 0 3 5h-6z" fill="#302936" stroke="#f8efd8" stroke-width=".8"/></svg>'''
(OUTPUT/'simbolo-terras.svg').write_text(svg,encoding='utf-8')
# Galeria local com arquivos relativos: sem embutir dezenas de MB de imagens.
entries=[]
for c in ready:entries.append(f'<article><img loading="lazy" src="../../arte/terras-despertas/edicao-v1/{c["id"]}.webp" alt="{html.escape(c["name"])}"><h2>{c["number"]:03} — {html.escape(c["name"])}</h2><p>{html.escape(c["text"]).replace(chr(10),"<br>")}</p></article>')
gallery='<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>As Terras Despertas — 60 cartas</title><style>body{background:#14212c;color:#f5e8ce;margin:30px;font:16px Georgia}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px}article{background:#23333f;padding:16px;border:1px solid #a57a3d;border-radius:6px}img{width:100%;height:auto}h2{font-size:19px}p{line-height:1.5}</style><h1>As Terras Despertas</h1><p>Edição completa · 60 cartas · 30 comuns / 20 incomuns / 10 raras</p><main>'+''.join(entries)+'</main></html>'
(HERE/'galeria-edicao-v1.html').write_text(gallery,encoding='utf-8')
manifest_data=dict(status='published-1.0',source='image_gen built-in; native card layout',originalAtlas=str(atlas),cards=manifest)
(OUTPUT/'manifesto.json').write_text(json.dumps(manifest_data,ensure_ascii=False,indent=2),encoding='utf-8')
if len(ready)==60:
    # Copia apenas as novas frentes TDP; imagens VES e builds históricos intactos.
    for c in ready:shutil.copy2(OUTPUT/(c['id']+'.png'),PROJECT/'src/public/cartas'/(c['id']+'.png'))
    for start in range(0,60,12):
        sample=Image.open(OUTPUT/(ready[0]['id']+'.png'));cw,ch=sample.size;thumb_w=220;thumb_h=round(ch*thumb_w/cw)
        sheet=Image.new('RGB',(4*thumb_w,3*thumb_h),(240,233,218))
        for n,c in enumerate(ready[start:start+12]):sheet.paste(Image.open(OUTPUT/(c['id']+'.png')).convert('RGB').resize((thumb_w,thumb_h)),((n%4)*thumb_w,(n//4)*thumb_h))
        sheet.save(OUTPUT/f'prancha-{start//12+1}.png')
print(json.dumps(dict(rendered=len(ready),metrics=manifest,output=str(OUTPUT)),ensure_ascii=False))
