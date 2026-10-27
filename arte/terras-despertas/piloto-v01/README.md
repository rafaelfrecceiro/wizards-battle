# As Terras Despertas — primeiras 12 cartas para revisão

24/10/2026 · Propostas visuais/editoriais 0.1. Tema escolhido em WB-D23; cartas, raridades, números e ilustrações ainda sem aceite humano ou playtest.

- [Galeria interativa](../../../design/terras-despertas/galeria.html), autocontida para mostrar no chat.
- [Textos completos](../../../design/terras-despertas/cartas-piloto-v01.md) e [dados editoriais](../../../design/terras-despertas/cartas-piloto-v01.json).
- [Prancha 1 — ameaças](prancha-1.png), [prancha 2 — apoios](prancha-2.png), [prancha 3 — respostas](prancha-3.png). PNGs individuais TD-P01 até TD-P12 nesta pasta; WebP somente para a prévia leve.
- [Atlas original de ilustrações](atlas-ilustracoes.png) gerado pela ferramenta **image_gen integrada**, sem fallback CLI. [Prompt integral](prompt-atlas-v01.txt). Origem da saída e hashes em [manifesto](manifesto.json).

## Procedência e composição

Ilustrações originais novas, geradas nesta rodada a partir da descrição da direção Bestiário em Foco. Nenhuma ilustração VES foi renomeada para representar carta nova. O atlas gerado foi copiado sem alteração para o projeto; as células são enquadradas na composição sem editar o original.

Molduras, placas, ícones de escola/tipo e espiral de Essência reutilizam os componentes da [referência fixa aprovada](../../../../../ideias/duelo-de-magos/arte/referencia-fixa/README.md). Fontes seguem o exportador da origem. Os números e regras são texto composto pelo adaptador [renderizar_cartas.py](../../../design/terras-despertas/renderizar_cartas.py), derivado do exportador existente: PDF em memória para diagramação e PNG final em 536×749. Não foi entregue PDF imprimível ou homologação de impressão. Barra Força/Vigor usa RefBold para manter o separador legível nesta instalação; glifos ilustrados preservados.

Cópias locais dos componentes ficam em componentes/. O adaptador redireciona seus caches/QA para esta pasta e inibe o bloco histórico que escreve progress.md da ideia. Não altera as 80 cartas, seus PNGs/PDFs, coleção de runtime, saves, builds ou servidores do jogo. Raridade e IDs de estudo são apresentados na galeria; selo definitivo da segunda edição não foi inventado.

## Verificação e limites

12 renderizações concluídas, todas com texto de regra a 9,2 pt no diagrama de 63×88 mm usado internamente pelo exportador. Conferência visual das três pranchas e casos individuais; enquadramentos e hashes no manifesto. Isso não prova legibilidade de uma futura impressão física.

Galeria abaixo de 1 MB; navegador real exercita navegação Próxima, seleção por miniatura e sincronização dos textos/imagem. QA da prévia nesta subpasta qa/; servidor de prévia isolado em 127.0.0.1:4194, sem substituir o jogo 4183.

Não executado: partidas com estas cartas, auditoria final de equilíbrio, comportamento do bot, publicação na coleção ou comparação de todas as combinações com VES. A base da expansão continua em [design](../../../design/terras-despertas.md).
