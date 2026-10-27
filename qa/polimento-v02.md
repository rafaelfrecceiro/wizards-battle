# QA de polimento — 0.2

Data local: 22/10/2026. Critério visual/movimento pendente; não homologado pelo usuário.

- [48 testes aprovados](polimento-v02-tests.json): 39 de motor/mapeamento e 9 de UI simulada (Testing Library + jsdom). Drag para Fontes/fileira/alvo, drop inválido, Esc, alternativa por clique, help, ordem de gatilhos, emissão de animação de posição e feedback numérico após confirmação. Eventos de ponteiro/limites DOM simulados: não comprovam fluidez nem layout real.
- 40 simulações determinísticas completas após a mudança de gatilhos, invariantes e replay; máximo 58 turnos/42 nomes conjurados. Método/limites em simulacoes.json. Não é medida de equilíbrio humano.
- Build e TypeScript aprovados. Cliente JS 248,22 kB/77,72 kB gzip, CSS 27,52 kB. Tamanhos de bundle não são FPS ou tempo de resposta.
- Fumaça HTTP na versão 0.2 confirmada por health: 201 requisições/49 turnos/192 ações; partida completa, auth/origem, privacidade, ação inválida sem mutação e replay. Ver http-smoke.json.
- Frentes originais preservadas; nenhuma regeneração de arte ou mudança no PDF. layout-v01.css é histórico do CSS anterior, sem status de execução.

## Bloqueio de observação

Tentativa de criar aba em http://127.0.0.1:4179 retornou **Local browser use is disabled in Work settings**. Não se usou ferramenta alternativa para contornar essa configuração. Usuário foi orientado pela [documentação oficial de configurações](https://learn.chatgpt.com/docs/reference/settings#browser) e perguntou como reativar. Aguardar reativação; capturas da 0.1 continuam históricas, não mostram 0.2.

## Revisão ainda necessária

1366×900 e 1920×1080, preferências de movimento reduzido, mão com 7/8 cartas, fontes numerosas, fronteiras dos drop targets, flecha de ataque, retorno após soltar fora/Esc, resolução com múltiplos alvos e ordem de gatilhos, contraste/legibilidade e bot em movimento. Fonte da execução: ../progress.md.

APIs consultadas: [Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events), [Element.animate](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate) e [useLayoutEffect](https://react.dev/reference/react/useLayoutEffect). Regras próprias; nenhuma dependência de runtime de Magic Battle.
