# Energia acumulada — 0.9.0 / WB-D25

Contrato: [WB-010](../../specs/WB-010-energia-acumulada.md). Implementação para teste humano, 24/10/2026.

- `regressao.json`: 399/399 testes aprovados. Inclui 18 casos novos em tests/energy-reserve.test.ts, seis duelos completos VES/TDP com bot, conservação de 40 peças por jogador e replay exato, replay histórico 0.8, exemplo 1×3 sem quarta geração, gastos, fontes múltiplas/destruídas, reserva no turno rival, Guardiã nos dois modos, API/convite/reinício/revanche. Mais um caso UI e ampliações de asserts nos testes Terras existentes.
- `http.json`: processo isolado em porta livre/banco dedicado, servidor reiniciado realmente, saldo/estado recuperados, convite exige regra, mão rival privada, geração soma ao saldo, replay e revanche conservam regra e reiniciam saldos. Encerrado somente o processo criado pelo driver de QA. Bancos isolados preservados nesta pasta.
- Build `npm run build` inclui typecheck, dist-v09 separado, CSS77,22kB/18,57gzip, JS principal372,72kB/107,80gzip antes do pequeno ajuste editorial final.
- `instancias-antes.json` / `operacao-final.json`: 4184/0.8 preservada com duas salas; 4183 já estava desligada. Novo processo iniciado pelo Iniciar-Energia-Acumulada.ps1 -Rede em 4185, banco exclusivo saves/rooms-energy-v1.sqlite. Sem túnel novo ou teste de outro dispositivo.
- `preparacao.png`: captura real1037×884 do navegador. A árvore acessível confirmou “Energia entre turnos: Acumulada — experimental”, regra e botão Iniciar duelo. A área inferior exige rolagem nessa resolução. Navegador foi desabilitado nas configurações do Work durante a rodada; a inspeção visual da partida não foi concluída. UI funcional validada por testes DOM, partida/saldo por motor e HTTP; não declarar esse percurso como playtest gráfico completo.

Guardiã da Cisterna mantém carta e arte originais. No modo reserva não abre escolha nem acrescenta energia; inspeção e guia explicam redundância. Redesenho posterior e equilíbrio humano pendentes. Nenhum valor de carta, arte VES/TDP, duração de fonte ou regra de Escola foi modificado.

Para testar: abrir http://127.0.0.1:4185, Jogar e iniciar. Energia acumulada já selecionada. Pode escolher conjunto experimental TDP ou a regra original de expiração para comparação. Decks locais pertencem à origem: exportar/importar backup JSON se vier de outra porta.
