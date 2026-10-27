# QA — legibilidade e manipulação 0.2.1

23/10/2026. Pedido WB-D07. [Captura fornecida pelo usuário](referencia-usuario-2026-10-23.png) mostra a versão anterior e seus problemas; não comprova a revisão.

- [52 testes aprovados](legibilidade-v021-tests.json), 39 motor/mapeamento e 13 de interface. Regressores novos: preview local troca com hover, mão expande/recolhe por mouse e foco, ataque mantém monstro e mostra apenas flecha/conexão, alvo inválido não envia ação. Testes anteriores de drop/recursos/ordem/privacidade preservados.
- Build Vite e TypeScript aprovados. [JS/CSS novos servidos com HTTP 200](legibilidade-v021-http.json). Nenhum restart do servidor/mesas; somente frontend atualizado.
- Novo CSS posterior ao estilo anterior amplia escala/tipografia, usa mão sobreposta e preview ao lado da posição da carta. A mira aparece ao pressionar, tem destino autorizado pelo motor e conexão breve após soltar; ghost continua apenas para mover/jogar cartas.
- Dimensões e tempos descritos no progresso são parâmetros CSS/JS, não medições no navegador.

**Limite:** ferramenta de browser retornou “Local browser use is disabled in Work settings” em 23/10. Testes jsdom simulam DOM/ponteiro e não validam a pintura, sensação, tamanho efetivo, hit testing real ou fluidez. Sem screenshot novo. Falta revisar preview nas bordas, mão com 7/8 cartas, drop com mão sobreposta, texto e estatísticas, mira/alvos e movimento reduzido nas resoluções previstas. Progresso apenas em ../progress.md.
