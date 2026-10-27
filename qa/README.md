# QA — Wizards Battle 0.1

Data local: 22/10/2026. Inspeção e execução pelo agente; nenhuma homologação humana.

## Verificação executada

- `npm run build`: TypeScript sem erros e build Vite concluídos. Bundle cliente 233,75 kB / 73,42 kB gzip; CSS 13,88 kB. Não é medição de uso de memória, FPS ou carregamento real.
- `npm test`: **33 cenários aprovados**, em src/tests/engine.test.ts. Legalidade atômica, presença/energia, fontes, variante, Emboscada, Guardião/Alcance, dano simultâneo/persistente, morte antes do dano, suportes, alvos, custos, opcionais, privacidade e replay.
- [40 simulações](simulacoes.json): seeds 220000–220019 por variante, 20 base e 20 variante. Todas terminadas, máximo 58 turnos individuais. Conferidas conservação das 80 cartas totais, vagas, energia não negativa e replays de amostras. 42 dos 49 nomes dos dois decks conjurados; nomes não observados listados no progresso.
- [HTTP](http-smoke.json): 129 requisições; partida completa em 28 turnos/120 ações. Conferidos token, rejeição de origem externa, ação inválida sem mutação, mão/Véu ocultos em todas as respostas e replay bloqueado até o fim.
- [Origem das 80 frentes](origem-artes.json): renderização PNG do PDF existente, sem redesenho, hashes de fonte e saídas. Não altera o PDF ou seus checks físicos. Snapshot de dados fixado por hash em src/data/identity.json e conferido por teste.

## Revisão no navegador

Navegador integrado, servidor local real, sem mock de regras. Lobby/deck/variante, manter mão, inspeção de carta, sacrifício, bloqueio por requisito, armar Prenúncio, avançar fases, resposta do bot, fonte duradoura, escolha de fileira e conjuração conferidos. Recarregar preservou a sessão enquanto o servidor permaneceu ativo.

- [Lobby em 1366×900](lobby-1366.png).
- [Mesa em 1366×900](mesa-1366.png).
- [Mesa em 1920×1080](mesa-1920.png).

Corrigido encaixe vertical da mão nos dois tamanhos. Observado recuo sem vantagem de atacante do bot; heurística corrigida para preferir avanço de fase a ações avaliadas negativamente, com regressão e nova bateria. Algumas ações do navegador precedem essa correção; capturas finais de Queimada/variante são da versão estável posterior.

Bot decide exclusivamente sobre View. Teste altera identidade da mão, biblioteca e Véu rivais e exige visão/decisão idênticas. Nenhuma auditoria de segurança pública ou concorrência massiva foi feita; servidor ligado somente em 127.0.0.1.

## Fontes técnicas consultadas

Arquitetura própria do motor e inspeção estática do Magic Battle do usuário, conforme estudo da ideia. APIs de interface/servidor conferidas na documentação oficial de [React](https://react.dev/learn/managing-state), [Vite](https://vite.dev/guide/) e [HTTP Node](https://nodejs.org/api/http.html). A documentação não comprova comportamento deste projeto; os resultados acima vêm das execuções locais.

## Limites

Nenhum resultado mede diversão humana, equilíbrio definitivo ou bot forte. Outros quatro decks, sete cartas não observadas em autoplay, escolha de ordem de gatilhos, replays visuais, persistência e salas humanas precisam de trabalho. A variante de fontes continua experimento. Progresso e próximos passos exclusivamente em ../progress.md.
