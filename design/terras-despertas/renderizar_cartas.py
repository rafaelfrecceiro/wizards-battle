"""Prévia isolada: reutiliza componentes aprovados, sem escrever na origem/VES.

Novas ilustrações vêm da image_gen. PDF em memória é somente o intermediário de
diagramação; a saída de revisão é PNG, WebP e galeria autocontida.
"""
from pathlib import Path
import base64
import hashlib
import html
import io
import json
import shutil
import sys
import argparse

HERE = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--revision', choices=['v01','v02'], default='v01')
REVISION = parser.parse_args().revision
HUB = HERE.parents[3]
ORIGIN = HUB / "ideias/duelo-de-magos"
OUTPUT = HUB / ("projetos/wizards-battle/arte/terras-despertas/piloto-"+REVISION)
OUTPUT.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(ORIGIN / "scripts"))
import exportar_fiel as F
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import pypdfium2 as pdfium

DATA = json.loads((HERE / ("cartas-piloto-"+REVISION+".json")).read_text(encoding="utf-8"))
CARDS = DATA["cards"]
GENERATED = Path("C:/Users/rafaf/.codex/generated_images/01a16a00-43f5-7453-bea2-a8a019e71410/exec-e4580141-b71e-4d77-8cf2-7c813d75cbb9.png")
ATLAS = OUTPUT / "atlas-ilustracoes.png"
if not ATLAS.exists():
    shutil.copy2(GENERATED if GENERATED.exists() else OUTPUT.parent/"piloto-v01/atlas-ilustracoes.png", ATLAS)

# Toda escrita que o exportador fizer usa exclusivamente a nova pasta.
F.ROOT = HUB
F.QA = OUTPUT / "qa"
F.QA.mkdir(exist_ok=True)
F.COMPONENTS = OUTPUT / "componentes"
F.COMPONENTS.mkdir(exist_ok=True)
for component in (ORIGIN / "arte/referencia-fixa/componentes-v0.4").iterdir():
    if component.is_file() and component.suffix in (".png", ".json"):
        destination = F.COMPONENTS / component.name
        if not destination.exists():
            shutil.copy2(component, destination)
# O bloco histórico de atualização de progress.md não executa neste adaptador.
F.CHECKS[:] = [card["id"] for card in CARDS]
F.B.ARTROOT = OUTPUT
F.B.ARTS = {card["id"]: {"file": ATLAS.name} for card in CARDS}
atlas_reader = ImageReader(str(ATLAS))
aw, ah = atlas_reader.getSize()
F.BOUNDS = {}
for card in CARDS:
    row, col = divmod(card["artIndex"], 4)
    F.BOUNDS[card["id"]] = {"box": (col*aw/4+2, row*ah/3+2, (col+1)*aw/4-2, (row+1)*ah/3-2)}

original_markup = F.markup
F.markup = lambda text: original_markup(text).replace("\n", "<br/>").replace("Ressonância", "<b>Ressonância</b>")
original_footer = F.footer
def preview_footer(cv, card):
    original_footer(cv, card)
    if card["type"] == "Monstro":
        # A fonte RefTitle desta instalação omite a barra; reutilizar a chapa
        # original e escrever a leitura Força/Vigor com a fonte de corpo bold.
        F.box_at(cv, (838,692,986,743), 312,646,148,51)
        cv.setFillColor(F.INK)
        cv.setFont("RefBold",32)
        cv.drawCentredString(386,709-686,f"{card['force']} / {card['vigor']}")
F.footer = preview_footer
manifest = []
gallery_cards = []
for index, card in enumerate(CARDS):
    buffer = io.BytesIO()
    cv = canvas.Canvas(buffer, pagesize=(F.B.CW, F.B.CH), pageCompression=1)
    F.draw_card(cv, card, 0, 0, index+1)
    cv.showPage()
    cv.save()
    document = pdfium.PdfDocument(buffer.getvalue())
    page = document[0]
    bitmap = page.render(scale=3, fill_color=(255,255,255,255))
    rendered = bitmap.to_pil()
    png = OUTPUT / (card["id"] + ".png")
    rendered.save(png)
    webp = OUTPUT / (card["id"] + ".webp")
    rendered.convert("RGB").save(webp, quality=82, method=6)
    gallery_cards.append({**card, "image": "data:image/webp;base64,"+base64.b64encode(webp.read_bytes()).decode("ascii")})
    manifest.append({"id": card["id"], "png": png.name, "sha256": hashlib.sha256(png.read_bytes()).hexdigest(), "width": rendered.width, "height": rendered.height, "artBox": F.BOUNDS[card["id"]]["box"], "metrics": F.B.METRICS[card["id"]]})
    bitmap.close()
    page.close()
    document.close()

# Três pranchas com quatro cartas cada, usando a mesma saída de diagramação.
for group in range(3):
    buffer = io.BytesIO()
    width, height = 2*F.B.CW+18, 2*F.B.CH+35
    cv = canvas.Canvas(buffer, pagesize=(width, height), pageCompression=1)
    cv.setFillColorRGB(.96,.94,.90)
    cv.rect(0,0,width,height,fill=1,stroke=0)
    cv.setFillColorRGB(.12,.14,.13)
    cv.setFont("Body",7)
    cv.drawString(6,height-10,"AS TERRAS DESPERTAS — "+("PILOTO 0.2 / EXPERIMENTAL" if REVISION=='v02' else "PROPOSTAS 0.1 / SEM PLAYTEST"))
    for position, card in enumerate(CARDS[group*4:group*4+4]):
        row, col = divmod(position,2)
        cv.drawImage(str(OUTPUT/(card["id"]+".png")),6+col*(F.B.CW+6),6+(1-row)*(F.B.CH+6),F.B.CW,F.B.CH)
    cv.showPage();cv.save()
    document = pdfium.PdfDocument(buffer.getvalue());page=document[0];bitmap=page.render(scale=2.5)
    bitmap.to_pil().save(OUTPUT/("prancha-"+str(group+1)+".png"))
    bitmap.close();page.close();document.close()

template = HERE / "galeria-template.html"
content = template.read_text(encoding="utf-8")
marker = "__TD_CARDS_DATA__"
if marker in content:
    content = content.replace(marker, json.dumps(gallery_cards, ensure_ascii=False).replace("</", "<\\/"))
else:
    raise RuntimeError("A galeria já foi preenchida. Não sobrescrever sem restaurar o template de autoria.")
assert len(content.encode("utf-8")) < 1_000_000, "Limite da prévia inline excedido"
if REVISION=='v02':
    content=content.replace('12 propostas','12 cartas experimentais')
(HERE / ("galeria-piloto-v02.html" if REVISION=='v02' else "galeria.html")).write_text(content,encoding="utf-8")
(OUTPUT/"manifesto.json").write_text(json.dumps({"status":"piloto-experimental-02" if REVISION=='v02' else "propostas-nao-jogaveis", "generator":"image_gen built-in", "sourceAtlas":str(GENERATED), "reference":str(F.REF), "referenceSha256":hashlib.sha256(F.REF.read_bytes()).hexdigest(), "cards":manifest, "galleryBytes":len(content.encode("utf-8"))},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
markdown = ["# As Terras Despertas — 12 cartas, revisão "+("0.2 experimental" if REVISION=='v02' else "0.1 proposta"), "", DATA["rulesNote"], ""]
for card in CARDS:
    requirements = ", ".join(f"{school} {value}" for school,value in card["presence"].items())
    markdown += ["## "+card["id"]+" — "+card["name"], "", f"{card['type']} · {card['rarity']} proposta · Custo {card['cost']} · Escola {requirements} · Essência {card['essence']['generation']}×{card['essence']['duration']}"+(f" · Força/Vigor {card['force']}/{card['vigor']}" if card['force'] is not None else ""), "", card["text"], "", "Função: "+card["role"], ""]
(HERE/("cartas-piloto-"+REVISION+".md")).write_text("\n".join(markdown)+"\n",encoding="utf-8")
print(json.dumps({"cards":len(manifest), "galleryBytes":len(content.encode("utf-8")), "output":str(OUTPUT)},ensure_ascii=False))
