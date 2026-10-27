"""Renderiza as frentes existentes, sem redesenho ou alteração dos PDFs físicos."""
from pathlib import Path
import json, hashlib
import pypdfium2 as pdfium

PROJECT=Path(__file__).resolve().parents[1]
SOURCE=PROJECT.parents[1]/'ideias/duelo-de-magos'
PDF=SOURCE/'output/pdf/Vespera-80-cartas-A4.pdf'
OUT=PROJECT/'src/public/cartas'
OUT.mkdir(parents=True,exist_ok=True)
layout=json.loads((SOURCE/'qa/impressao-v0.4/diagrama.json').read_text(encoding='utf-8'))
doc=pdfium.PdfDocument(PDF)
manifest={'source':str(PDF),'sha256':hashlib.sha256(PDF.read_bytes()).hexdigest(),'method':'PDFium render at 3 px/pt, crop by original card placement; PNG, no redraw','cards':[]}
mm=72/25.4
for card in layout['collection']:
    page=doc[card['page']-1]
    x,y,w,h=[card[k]*mm for k in ('x_mm','y_mm','width_mm','height_mm')]
    # PDFium crop=(left,bottom,right,top), in canvas units.
    bitmap=page.render(scale=3,crop=(x,y,page.get_width()-x-w,page.get_height()-y-h))
    target=OUT/(card['id']+'.png')
    bitmap.to_pil().save(target)
    manifest['cards'].append({'id':card['id'],'file':target.name,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'size':[bitmap.width,bitmap.height]})
    bitmap.close();page.close()
doc.close()
(PROJECT/'qa/origem-artes.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'{len(manifest["cards"])} frentes preservadas para web.')
