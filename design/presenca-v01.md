# Presença — diagnóstico e proposta Vínculos de escola

23/10/2026 · WB-D13 · **proposta modelada, não implementada nas partidas**.

**Atualização posterior WB-D15:** o usuário refinou o conceito para Escola permanente por fontes **e conjurações repetidas**, separada da Presença atual. Implementado como `escolas-v1` na 0.5.0/4181; ver [WB-005](../specs/WB-005-escola-e-presenca.md). O modelo e os resultados abaixo são históricos e não descrevem a regra atual.

## Fato observado e reprodução

Capturas do usuário na 0.4.0 mostram fontes expiradas, campo vazio, 2 de energia/0 presença e depois 4 de energia/0 presença ao sacrificar Silenciar o Motor. Não há perda da partida observada; há bloqueio de conjuração. O usuário já confirmou em teste físico que contava fontes, monstros e encantamentos, portanto não é uma dúvida de contagem.

Em src/engine/engine.ts, presence soma um por escola de cada fonte ativa, monstro e encantamento. Ao instalar fonte na base, duração começa em essência.duração−1. Energia entra e cleanup converte duração zero em Cinza imediatamente. No Despertar, fontes geram e perdem duração antes da fase principal. Uma fonte 2×1 pode, assim, nunca ficar disponível para cumprir requisito de escola na fase principal. O número em “Sombra 2” é requisito, não quantidade de presença fornecida.

Reprodução isolada executada com definições reais: Eco dos Soterrados (Sombra, 2×2) no turno 1; Despertar próprio no turno 3; Silenciar o Motor (Sombra, 2×1); Catadora (custo 2, Sombra 1) como possível jogada. Testes comparam cada etapa das políticas base e duração integral ao motor real, incluindo legalidade da Catadora.

## Comparação executada

| Momento | Regra atual | Duração integral existente | Vínculos propostos |
| --- | --- | --- | --- |
| Despertar após Eco | energia 2 / Sombra 0 / Cinzas 1 | 2 / 1 / 0 | 2 / 1 / 1 |
| Sacrificar Silenciar | energia 4 / Sombra 0 / Cinzas 2 | 4 / 2 / 0 | 4 / 2 / 2 |
| Catadora pode entrar? | não | sim | sim |
| Próximo Despertar, se não conjurar nada | energia 0 / Sombra 0 | energia 4 / Sombra 0 | energia 0 / Sombra 2 |

Duração integral resolve este instante, mas muda geração total e momento das Cinzas; se não houver permanentes, todas as fontes ainda podem expirar e zerar presença. Vínculos conserva energia e Cinzas da base nesta reprodução, separando o progresso de escola da vida útil da fonte.

## Regra candidata recomendada

1. Ao transformar uma carta em fonte pela ação de sacrifício, registre **um vínculo permanente em cada escola impressa da carta**. Dura até o fim da partida.
2. Presença de uma escola = vínculos dessa escola + monstros e encantamentos dessa escola em jogo. **Fontes ativas não somam outra vez.**
3. Energia, duração, limite de um sacrifício por turno e conversão em Cinzas seguem a base v0.3. Vínculo não gera energia e não é consumido ao conjurar.
4. Carta híbrida cria um vínculo em cada escola. “Chama 2” não cria dois vínculos. Sacrificar um monstro como custo de efeito não cria vínculo; somente criar fonte pela ação especificada.
5. Remover ou esgotar uma fonte não apaga vínculos. Tirar monstros/encantamentos do campo ainda remove a contribuição deles.

No exemplo: Eco deixa Sombra 1 mesmo depois de expirar. Silenciar deixa mais um vínculo: energia 4 / Sombra 2. Catadora pode entrar, custando 2 energia e passando a somar mais uma presença enquanto estiver no campo. No Despertar seguinte, a energia pode zerar, mas o avanço de escola permanece.

UI candidata: contador de escola detalha “Vínculos 2 + Campo 1 = 3”; registro “Vínculo de Sombra +1” na criação da fonte; fontes mostram energia e duração sem duplicar escola. Textos de ajuda e bloqueio citam requisitos atuais. Se adotada para teste, variante explícita, identificada no replay e no lobby, com estado próprio no motor e visão pública dos vínculos; sem reinterpretar silenciosamente partidas em andamento.

## Consequências e limites

- Requisitos de escola ficam mais fáceis após fontes expirarem; remoção do campo deixa de zerar todo o progresso. Energia continua limitada e ainda exige decisões de sacrifício.
- Monstros e encantamentos mantêm valor de presença; a progressão pode acelerar custos de escola altos. Pode haver efeito de bola de neve.
- Híbridas podem facilitar decks com muitas escolas e exigir revisão de seus custos/essências. Não criar quota arbitrária sem testar.
- Destruir fontes passa a atacar geração de energia, não a apagar os vínculos anteriores. Efeitos dependentes de presença precisam de auditoria.
- Fontes curtas continuam chegando cedo às Cinzas. Combos de Cinzas precisam de teste; manter o timing da base não prova que o novo acesso a cartas esteja balanceado.

Inventário executado dos seis decks: duração 1 em 13/40 cópias de Pira (32,5%), 7/40 Queimada, 7/40 Vapor, 2/40 Decomposição, 0/40 Estações e 2/40 Ilusão. É composição de listas, não frequência real de sacrifícios ou taxa de vitória.

## Evidências e próximo recorte

- Modelo isolado: src/research/presence-study.ts; exportador src/research/export-presence-study.ts.
- Seis testes novos: src/tests/presence-study.test.ts, [relatório](../qa/presenca-v01/tests.json).
- [Dados exportados](../qa/presenca-v01/comparacao.json) e [comparador interativo](http://127.0.0.1:4180/estudos/home-presenca.html), com/sem conjurar Catadora.
- Nenhuma importação do modelo no motor/servidor/bot/UI de partidas. Modelo não cobre todas as habilidades ou partidas completas com a regra candidata.

Depois da escolha da regra: integrar variante versionada, bot avaliando vínculos, testes de duração 1/expiração/híbridas/remoção/custos/visibilidade/replay, partidas automatizadas e playtest humano. Comparar turnos sem jogada, curvas de conjuração, presença após limpeza e uso de escolas/Cinzas, sem confundir simulação com diversão comprovada. Balanceamento das 80 e ampliação do recorte atual de 49 permanecem pendentes. PDFs físicos preservados.
