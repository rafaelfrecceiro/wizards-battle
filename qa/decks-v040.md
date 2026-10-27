# QA — gerenciador de decks 0.4.0

23/10/2026, WB-D12. [Spec](../specs/WB-004-gerenciamento-decks.md). Código em src/; endereço atual **http://127.0.0.1:4180**.

- **97/97 testes aprovados**, [JSON](decks-v040-tests.json): 39 motor/mapeamento, 30 UI/posicionamento, 8 catálogo, 14 decks e 6 persistência. Fluxos de criar por modelo, renomear, salvar/reabrir, limite de cópias, rascunho, duplicar/excluir, proteção de alterações, jogar e selecionar no lobby exercitados em jsdom.
- Rejeição de IDs/quantidades/nomes/listas inválidos, carta não habilitada, agregação de reimpressões, snapshot copiado, partida personalizada completa com bot e replay idêntico cobertos em testes de motor. Biblioteca corrompida/falha de escrita/revisão anterior e importação inválida preservam dados nos cenários executados. Não afirmar bloqueio transacional entre abas.
- [HTTP personalizado](decks-v040-http-custom.json): 131 requisições, partida completa em 27 turnos/121 ações; listas inválidas rejeitadas, privacidade mantida e replay reproduz a View final do servidor. [Preset](decks-v040-http-preset.json): 62 requisições, 11 turnos/53 ações; autenticação/origem/erro atômico e replay após término aprovados. Seeds HTTP aleatórias; números são desta execução.
- [Compatibilidade legada](decks-v040-legacy.json): mesa **nova e isolada** de QA na instância 4179, 53 requisições/50 ações/10 turnos; View final igual à reconstrução com motor novo e replay idêntico. Nenhum token/partida existente do usuário foi acessado ou alterado.
- Build/typecheck aprovados. JS 337,43 kB / 97,95 kB gzip, CSS 49,92 kB. [Arquivos estáticos](decks-v040-static.json): bundles 0.4.0 em 4180 e 0.3.0 em 4179 retornam 200 e são iguais aos respectivos builds. 80 PNGs originais e cópias no novo build mantêm os SHA-256 do manifesto.
- Nova instância 4180, dist-v04. Servidor 4179/dist preservado. Nova instância reportou duas mesas de QA; antiga quatro sessões após o teste legado isolado. Esses contadores não demonstram persistência após reinício: partidas continuam em memória. Decks salvos são localStorage da origem/navegador.

Execução intermediária da suíte teve uma falha não reproduzida no caso de filtros da Coleção. Rodada isolada de 30 testes UI e rodada final de 97 passaram. Configuração Vitest limita workers a dois e amplia timeout para 15 s no ambiente Windows; isso não é medição de performance do jogo.

**Limite real:** cua.getState retornou “Local browser use is disabled in Work settings”. Não houve screenshot novo nem interação manual/avaliação visual em 1366/1920. Revisar modal, cartões, legibilidade, scroll, foco, confirmação de alterações e início real pelo usuário antes de aceite visual. Download/importação pelo seletor nativo não foram testados manualmente; parsing/persistência têm testes automatizados.

Reprodução: npm run build; npm test; npm start; em outra sessão npm run test:http e npm run test:http:decks. Teste legado adicional: npm exec -- tsx tests/http-legacy.ts, apenas enquanto 4179 estiver na versão antiga esperada. Progresso único em ../progress.md.
