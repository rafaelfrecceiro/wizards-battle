# QA — catálogo TCG, edições e raridades 0.3.0

23/10/2026, WB-D10/11. Implementação editorial inicial; não valida equilíbrio humano ou aprovação visual. [Spec](../specs/WB-003-edicoes-e-raridades.md), [classificação](../design/classificacao-VES.md).

- VES com 80 impressões, numeração única 001–080, classificação inicial 40 comuns/28 incomuns/12 raras. Registros e notas individuais em src/data/colecao.json. Nova edição/reimpressão de identidade existente exercitada em fixture de teste, não publicada como conteúdo real.
- **71/71 testes aprovados**, [JSON](tcg-v030-tests.json): 39 motor/mapeamento, 24 UI/posicionamento e 8 catálogo. Casos novos: cobertura das 80 e seus arquivos, validade/duplicidade de edição/número/carta/raridade, reimpressão, seis decks mistos de 40, hashes das regras/listas, identificação na frente/preview flutuante, filtros/busca sem acento, ausência de resultados e foco/fechamento do modal. Regressores anteriores de mira, drag, gatilhos e privacidade preservados.
- Build/TypeScript aprovados. JS 321,44 kB / 93,70 kB gzip; CSS 42,43 kB. Catálogo público acrescenta dados das 80 cartas ao bundle, sem estado privado de partidas.
- [HTTP estático](tcg-v030-http.json): JS/CSS com 200, byte a byte iguais ao build, marcador 0.3.0. Motor continua 0.2.0/rules-0.3-trigger-order, três sessões reportadas; nenhum restart nesta rodada.
- **80/80 PNGs originais** comparados por SHA-256 com qa/origem-artes.json, todos iguais. Novo símbolo é camada SVG de UI; PDFs e snapshots físicos preservados. Cartas/listas de regras conservam hashes originais. Não repetir autoplay como se houvesse mudança de efeitos.
- Mistura efetiva por cópias (C/I/R): Queimada 24/12/4; Pira 23/12/5; Vapor 27/11/2; Decomposição 23/15/2; Estações 29/7/4; Ilusão 22/12/6. Isso comprova composição, não diversidade competitiva nem equilíbrio.

**Limites reais:** cua.getState ainda retorna “Local browser use is disabled in Work settings”. Sem screenshot novo/medição de fluidez; testes jsdom não comprovam pintura ou encaixe do selo. Revisar símbolo sobre cada tipo/moldura, legibilidade em miniatura, redução das imagens na inspeção, modal/scroll/foco nas resoluções previstas, drag e hover após introduzir CardFace. Aprovação da classificação/ícone e playtest pendentes.

O catálogo apresenta 80, mas duelos seguem restritos aos 49 nomes dos dois decks habilitados. Sem deckbuilder livre, posse/troca/boosters ou nova edição de conteúdo. Progresso único em ../progress.md.
