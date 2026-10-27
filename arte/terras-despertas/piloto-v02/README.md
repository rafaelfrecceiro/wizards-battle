# As Terras Despertas — frentes do piloto auditado 0.2

24/10/2026 · WB-D24. [Auditoria](../../../design/terras-despertas/auditoria-v02.md) e [textos](../../../design/terras-despertas/cartas-piloto-v02.md). Artes/raridades/números experimentais, sem homologação de equilíbrio ou aceite artístico final.

12 PNGs TD-P01–12, 536×749, mais três pranchas: [ameaças](prancha-1.png), [apoios](prancha-2.png), [respostas](prancha-3.png). [Galeria revisada](../../../design/terras-despertas/galeria-piloto-v02.html). Hashes/enquadramentos no [manifesto](manifesto.json). Cópias de runtime em src/public/cartas servidas na 0.8, verificadas por HTTP.

Reutiliza **as mesmas ilustrações originais da image_gen integrada** da prévia 0.1. [Prompt integral e origem](../piloto-v01/prompt-atlas-v01.txt); nenhuma geração nova ou mudança de direção. Atlas copiado intacto; molduras/ícones/tipos/espiral da referência aprovada, sem regenerar glifos. Regras e números atualizados por composição conforme 0.2; prévia 0.1 separada.

Reproduzir: `renderizar_cartas.py --revision v02`, com o runtime Python de dependências do workspace. Valores vêm de cartas-piloto-v02.json. Não é PDF físico pronto: intermediário PDF em memória e saída PNG. Selo textual TDP e raridade são camadas da UI.

[QA funcional, browser e limites](../../../qa/terras-v080/README.md).
