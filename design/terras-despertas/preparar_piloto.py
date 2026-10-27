"""Converte a proposta 0.1 em revisão auditada 0.2 e dados independentes.

Não modifica cartas.json, baralhos.json, colecao.json ou a prévia original.
"""
from pathlib import Path
import json
import hashlib

HERE = Path(__file__).resolve().parent
PROJECT = HERE.parents[1]
data = json.loads((HERE / "cartas-piloto-v01.json").read_text(encoding="utf-8"))
cards = {card["id"]: card for card in data["cards"]}
def effect(op, n, target, **extra):
    return {"op":op,"n":n,"target":target,**extra}
def resonance(school, minimum, **bonus):
    return {"presence":{school:minimum},**bonus}

cards["TD-P01"]["fx"] = {"enter":[effect("boost",1,"own_monster",exclude_self=True,resonance=resonance("Chama",3,haste=True))]}
cards["TD-P02"]["fx"] = {}
cards["TD-P03"]["fx"] = {"enter":[effect("spend_damage",2,"enemy_front",ashes=2)]}
c = cards["TD-P04"]
c.update(cost=4,force=2,vigor=4,rarity="Incomum")
c["text"] = "Alcance.\nRessonância — Ao entrar, com Presença de Maré 3, você pode devolver outro monstro seu de custo 2 ou menos à mão."
c["role"] = "Alcance e retorno preparado de um aliado pequeno; diferença de custo/corpo em relação ao Lanceiro das Correntes e à Condutora do Refluxo."
c["fx"] = {"enter":[effect("bounce",0,"own_monster",max_cost=2,exclude_self=True,optional=True,presence_min={"Maré":3})]}
cards["TD-P05"]["cost"] = 4
cards["TD-P05"]["fx"] = {"support_end":[effect("heal",1,"own_front",up_to=True,resonance=resonance("Raiz",3,n=2))]}
cards["TD-P06"]["fx"] = {"enter":[effect("survey",2,"own")]}
cards["TD-P07"]["fx"] = {"enter":[effect("recover_ashes",0,"own_ashes",max_cost=2,ashes=2,optional=True,resonance=resonance("Sombra",3,max_cost=4))]}
cards["TD-P08"]["text"] = "No seu encerramento, se tiver Presença de Raiz 2 e Maré 2, olhe a carta do topo do seu baralho. Você pode colocá-la no fundo."
cards["TD-P08"]["fx"] = {"enchant_end":[effect("scry",1,"own",presence_min={"Raiz":2,"Maré":2})]}
cards["TD-P09"]["fx"] = {"cast":[effect("destroy_enchant",0,"enemy_enchant",max_cost=3)]}
cards["TD-P10"]["fx"] = {"cast":[effect("bounce",0,"enemy_monster",max_cost=3)]}
c = cards["TD-P11"]
c.update(cost=2,text="Cure 1 de dano de cada monstro seu.")
c["role"] = "Recuperação distribuída para um campo ferido; distingue-se da cura concentrada de Passagem Viva e da cura recorrente de Jardim nas Engrenagens."
c["fx"] = {"cast":[effect("heal_all",1,"own")]}
cards["TD-P12"]["fx"] = {"cast":[effect("damage",2,"enemy_front",resonance=resonance("Chama",3,n=3))]}
data.update(version="pilot-0.2",state="experimental-implementacao-WB-D24",edition="TDP",cardPool="terras-pilot-v1")
data["rulesNote"] = "Piloto experimental VES + 12, somente escolas-v1. Escola permanente habilita conjurar; Presença atual condiciona Ressonância. Números/raridades ajustados por auditoria estática, ainda sem homologação de equilíbrio humano."
data["cards"] = list(cards.values())
for path in [HERE/"cartas-piloto-v02.json",PROJECT/"src/data/terras-piloto.json"]:
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

rarities={"Comum":"common","Incomum":"uncommon","Rara":"rare"}
catalogue={"edition":{"code":"TDP","name":"As Terras Despertas — piloto experimental","order":2,"cardCount":12,"symbol":"terras-pilot","theme":"Expedições num território vivo depois de Véspera; lote de 12 em teste.","mechanics":["Ressonância","Presença","Suporte","Cinzas"],"experimental":True},"printings":[{"id":c["id"],"cardId":c["id"],"edition":"TDP","number":i+1,"rarity":rarities[c["rarity"]],"designNote":c["role"]} for i,c in enumerate(data["cards"])]}
(PROJECT/"src/data/terras-catalogo.json").write_text(json.dumps(catalogue,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
base_lists = json.loads((PROJECT/"src/data/baralhos.json").read_text(encoding="utf-8"))
def mixed(name, base, swaps):
    original = next(d for d in base_lists if d["name"] == base)
    counts = {c["id"]:c["copies"] for c in original["cards"]}
    for source,target,copies in swaps:
        assert counts[source] >= copies
        counts[source] -= copies
        counts[target] = counts.get(target,0)+copies
    entries = [{"id":id,"copies":n} for id,n in counts.items() if n]
    assert sum(c["copies"] for c in entries) == 40 and all(c["copies"]<=3 for c in entries)
    return {"name":name,"cards":entries}
mixed_lists = [
    mixed("Terras — Manada do Vale","Queimada",[("VES-002","TD-P01",2),("VES-023","TD-P02",1),("VES-037","TD-P02",1),("VES-003","TD-P05",2),("VES-013","TD-P11",2),("VES-006","TD-P12",2)]),
    mixed("Terras — Nascentes Vivas","Estações",[("VES-059","TD-P04",1),("VES-060","TD-P04",1),("VES-058","TD-P06",2),("VES-044","TD-P08",2),("VES-021","TD-P10",2),("VES-038","TD-P02",1),("VES-003","TD-P05",1),("VES-042","TD-P11",1)]),
    mixed("Terras — Nomes e Brasas","Pira",[("VES-028","TD-P03",1),("VES-050","TD-P03",1),("VES-051","TD-P07",1),("VES-052","TD-P07",1),("VES-053","TD-P09",1),("VES-057","TD-P09",1),("VES-006","TD-P12",2),("VES-002","TD-P01",1)]),
]
(PROJECT/"src/data/terras-baralhos.json").write_text(json.dumps(mixed_lists,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
identity = {"source":"As Terras Despertas, piloto auditado 0.2 / WB-D24", "cardsSha256":hashlib.sha256((PROJECT/"src/data/terras-piloto.json").read_bytes()).hexdigest(),"decksSha256":hashlib.sha256((PROJECT/"src/data/terras-baralhos.json").read_bytes()).hexdigest()}
(PROJECT/"src/data/terras-identity.json").write_text(json.dumps(identity,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("Revisão 0.2: 12 cartas com efeitos explícitos; VES intacta.")
