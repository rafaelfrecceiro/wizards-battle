# WB-003 — Edições e raridades do TCG

23/10/2026, visão solicitada em WB-D10. Primeira implementação editorial/digital 0.3.0; classificação e aplicação visual são propostas WB-D11. [GDD](../GDD.md), [classificação das 80](../design/classificacao-VES.md), [QA](../qa/tcg-v030.md). Progresso único em ../progress.md.

## Identidade da coleção

Primeira edição: **VES — O Coração de Véspera**, 80 nomes/impressões, números 001–080. VES-001…VES-080 existentes permanecem estáveis; versão de regras v0.3 não é número de edição. Edições futuras recebem código/símbolo/tema próprios e preservam as quatro escolas, linguagem visual e estrutura de turnos, salvo decisão explícita posterior.

Dados editoriais em src/data/colecao.json, contratos/validação em src/catalog/. Edição registra código, nome, ordem, total, símbolo, tema e mecânicas; impressão registra ID, identidade da carta de regras, edição, número, raridade e nota de design. Identidade de regras e impressão são separadas para permitir reimpressões. A 0.3.0 testa esse vínculo num catálogo de teste; seleção de impressões em decks/replays ainda é trabalho futuro.

Código e número únicos por edição, impressão única, raridade válida, referência a regras conhecida e total completo são validados. Adicionar uma impressão desconhecida às regras não libera sua conjuração. Metadados editoriais não alteram a versão de regras ou multiplicam força, vigor, energia ou cópias permitidas.

Atualização WB-D12/0.4.0: gerenciador permite montagem livre no conjunto de 49 cartas habilitadas. Validação agrega cópias por identidade de regras, inclusive aliases de reimpressão, impedindo contornar o limite de 3. Teste com alias de outra edição cobre essa fronteira; produção ainda só tem VES. Seis listas iniciais preservadas e apenas Pira/Queimada disponíveis como modelos/oponentes. [WB-004](WB-004-gerenciamento-decks.md).

## Raridade e função

| Raridade | Identificação | Papel proposto |
| --- | --- | --- |
| Comum | C · grafite | Base da curva, presença, respostas eficientes e efeitos de leitura direta |
| Incomum | I · prata | Suportes, motores especializados e conexões de sinergia |
| Rara | R · ouro | Cartas marcantes, motores de maior impacto, finalizadores e versatilidade excepcional |

Usuário espera raras normalmente melhores. Proposta de aplicação: maior potencial/impacto condicionado a custos e preparação, mantendo comuns eficientes e relevantes. Não fazer de rara uma cópia estritamente superior da comum pelo mesmo custo; isso prejudicaria o objetivo de misturar raridades. Raridade não é apenas custo alto, quantidade de palavras ou importância narrativa. Nenhum buff automático ou mudança de efeito foi aplicado nesta rodada.

Distribuição inicial **40 C / 28 I / 12 R**, proposta editorial e não probabilidade de booster. Motivo individual em cada registro. Os seis decks existentes contêm as três raridades sem alterar listas: Queimada 24/12/4; Pira 23/12/5; Vapor 27/11/2; Decomposição 23/15/2; Estações 29/7/4; Ilusão 22/12/6. Ordem C/I/R, contando cópias. Não há quota de raridade obrigatória na legalidade.

Playtest deve revisar eficiência por custo, curvas, dependência de motores raros, respostas comuns a ameaças raras, cartas comuns úteis no fim e funcionamento de decks sem comprar sua rara. A distribuição não demonstra equilíbrio; nenhuma promessa de tier ou win rate.

## Identificação visual e consulta

Símbolo VES original: coração mecânico com engrenagem e pulso central; mesma silhueta, metal por raridade. Selo pequeno na faixa do tipo, aplicado por SVG sobre a frente preservada. Na consulta: nome da edição + VES + número/080 + raridade/abreviação. Sem trocar símbolos de escola/tipo/Essência ou substituir a arte aprovada. Classificação inicial explicitamente indicada na Coleção.

Coleção acessível no lobby e na partida, sem iniciar/reiniciar duelo. Filtros por edição e raridade e busca por nome/escola/tipo/efeito/ID; detalhe com texto original, identidade e papel na edição. Mostra catálogo, não inventário possuído. Catálogo 80 não significa 80 cartas jogáveis: motor mantém Pira/Queimada, 49 nomes. Foco modal, Esc e restauração de foco cobertos em DOM simulado.

## Edições futuras e novas mecânicas

Fluxo proposto: escolher tema/plot, definir identidade e símbolo, mapear arquétipos das quatro escolas, planejar raridades e respostas, produzir lote, implementar capacidades novas no motor, testar legalidade/interações/gatilhos/privacidade/replay e comportamento do bot, fazer playtest humano e liberar apenas cartas cobertas. Edição combina cartas que usam o núcleo existente com novidades que se conectam a edições anteriores.

Proposta de contenção inicial: uma ou duas mecânicas novas por edição, com comuns que ensinem o básico, incomuns que as conectem e raras que explorem seu maior potencial. Quantidade e tema da segunda edição ainda não escolhidos. Não há entendimento automático de texto livre: efeitos novos exigem código, testes e política do bot. Mudança real de regras/dados exige versionamento apropriado; metadados editoriais ficam separados.

Aquisição/posse, boosters, trocas, monetização, formatos e rotação ainda não decididos. Montagem livre no conjunto habilitado foi autorizada e implementada em WB-004. Desenvolver a fundação do TCG não aprova os demais sistemas implicitamente.

## Referências consultadas

Catálogo local MTGA steam-25763111 usado como contexto, sem copiar assets ou presumir reconstrução completa. Referências primárias de design: [Quite the Rarity, Mark Rosewater](https://magic.wizards.com/en/news/making-magic/quite-rarity-2018-03-12) distingue complexidade, tamanho de efeito e impacto; [Anatomy of a Magic Card](https://magic.wizards.com/en/news/feature/anatomy-magic-card-2006-10-21) descreve símbolo de expansão e número de coleção. Adaptação própria; não importar regras/raridades adicionais ou modelo comercial de Magic.
