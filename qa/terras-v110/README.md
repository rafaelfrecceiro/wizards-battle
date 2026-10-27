# QA — As Terras Despertas completa / 0.11.0

24/10/2026 · [WB-012](../../specs/WB-012-terras-completa.md) · Node 24.19 / TypeScript 5.9 / Vite 8.3.5 / Vitest 4.1. Sem dependências novas.

## Evidência executada

- `npm run build`: typecheck e build de produção aprovados, em `src/dist-v11`. Bundle principal cerca de 437 kB / 121 kB gzip. Novas frentes copiadas antes do build.
- `npx vitest run --reporter=json --outputFile=../qa/terras-v110/regressao-final.json`: **540/540 testes aprovados**. [Relatório](regressao-final.json). Inclui 128 casos da edição completa: as 60 cartas conjuradas/armadas por ações reais e as 60 verificadas como fonte, custo de energia/atomicidade; metadados/decks, limites do atacante, pagamento de Cinzas, privacidade, morte por turno e replay 0.10. Regressões VES, salas/save e feedback incluídas. Teste histórico da auditoria VES delimitado às 80 VES; as 60 TDP têm fixtures com o conjunto apropriado.
- Revisão final da coleção: [interface-final.json](interface-final.json), 49/49 testes aprovados da interface/coleção/símbolo após refinar contagem de 140 e composição dos 12 decks. São testes DOM, sem captura de navegador.
- `npx tsx tests/terras-full-simulate.ts`: **144 duelos completos / 19.249 ações**, seis TDP × doze oponentes VES/TDP × duas iniciativas; todas as 60 conjuradas pelo bot. [Relatório final](simulations.json), versão com hash `d6d94759a5c8` das cartas TDP. Conservação de 40 peças/UIDs, energia não negativa, vagas, Escola monotônica, mão rival privada e replay integral idêntico. O relatório `simulations-inicial.json` é anterior ao ajuste final da Dívida; não usá-lo como evidência dos números finais.
- `npx tsx tests/http-terras-complete.ts`: **374 pedidos de API / 262 verificações aprovadas** em porta/banco temporários. [Relatório](http.json). Cria os seis modelos; confirma conjunto/regras do convite; rejeita carta nova no conjunto VES; joga novas cartas com dois assentos; reinicia processo real e compara visões/energia; replay e revanche; as 60 PNG servidas com SHA-256 igual ao public. O driver termina somente seus próprios processos de QA. Pedidos de imagens são adicionais à contagem de API.
- [Integridade](integridade.json): 140 PNG em public e build, 60 frentes TDP com hashes exatos do manifesto. **80 VES comparadas com dist-v10, zero diferenças**; hashes de dados/regras/decks VES também verificados pela regressão. Fontes de arte e dados históricos preservadas.
- [Servidor entregue](servidor-entregue.json): 0.11/4187 responde health/HTML/bundle da edição; instância 0.10/4186 continua com sua sala. [Instâncias anteriores](instancias-anteriores.json) registra 4184/4185 sem listener na observação, sem executar recuperação/migração. Launcher geral reexecutado e reutilizou 4187 sem reiniciar.
- Imagens inspecionadas com visualizador local: cinco pranchas com as 60 e três frentes individuais. [Arte/procedência](../../arte/terras-despertas/edicao-v1/README.md). Símbolo desenhado, textos legíveis nas amostras longas, ausência da sigla no selo e molduras preservadas.

## Limites

O navegador local foi desabilitado nas configurações do Work durante a rodada anterior; não houve novo playtest gráfico, captura da mesa, medição de FPS ou escuta de áudio. DOM e leitura de PNG são evidências distintas de percepção durante o jogo. Nenhuma automação alternativa contornou essa configuração.

Simulação determinística não demonstra equilíbrio, diversão, ausência de toda combinação problemática nem força estratégica do bot. A edição sai do piloto como conteúdo funcional publicado, continuando sujeita a ajustes de balanceamento após partidas humanas. As 48 cartas novas não receberam automaticamente o parecer positivo dado pelo usuário à versão anterior.

Não alterados: slots reais dos testes, partida viva 0.10, saves históricos, PDFs e dados físicos de VES, regra de suporte ou morte no próprio turno. A única correção de seleção genérica desta versão aplica limite de custo também a alvos nomeados.
