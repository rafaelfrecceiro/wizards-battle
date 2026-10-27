# QA — Atlas UI 0.5.1

23/10/2026 · [WB-006](../../specs/WB-006-atlas-do-conclave.md) · motor 0.5.0 sem alterações.

## Executado

- npm run build: typecheck e Vite 8.3.5 aprovados, 40 módulos. Build após revisão visual: main-Cm6cJ822.js 345,91 kB / 100,49 gzip; main-DGRbSCcG.css 75,31 / 18,21; atlasPreview-CzNFeiSM.js 12,77 / 5,26. Entradas index.html e atlas-preview.html.
- npm test -- --reporter=json --outputFile=../qa/atlas-v051/testes.json: **120/120 aprovados**, incluindo motor, catálogo, decks e UI. [JSON](testes.json). Novas regressões verificam prévia sem API/alteração de token e HUD Atlas/slots restantes; mira verifica curva e destino atualizado. jsdom não valida pintura, hover real ou desempenho.
- [HTTP estático final](http-estaticos-final.json): HTML, bundles atuais e assets comparados byte a byte com dist-v05; bundles antigos preservados. Health confirma motor original; nenhuma ação de partida enviada nesta rodada.
- [Integridade](artes-integridade.json): 80 frentes mantidas; hashes dos três assets Atlas registrados. [Primeira verificação de endpoints](http-estaticos.json).
- Na entrega inicial, servidor 4181/sessão exec 67805 foi preservado. Após o usuário fechar/reabrir o aplicativo, não havia servidor escutando; nova execução 27422, zero sessões. Ver inspeção posterior abaixo. Nenhuma partida humana acessada pelo agente.

## Bloqueio anterior — encerrado após reiniciar o aplicativo

Navegador permanece indisponível: “Local browser use is disabled in Work settings” em cua.getState. Não há screenshot real do novo Atlas, comparação visual concluída, teste de drag em browser ou medição de FPS. Cenário e retratos gerados foram vistos diretamente; isso não valida o layout da aplicação.

Atualização posterior do usuário: captura das configurações mostra o toggle Navegador azul/ativado (“Permitir que o ChatGPT controle o navegador integrado”). Nova consulta cua.getState continuou retornando o mesmo bloqueio. Evidência de divergência entre configuração exibida e acesso da ferramenta; não afirmar que o usuário deixou a opção desativada. Causa não identificada. Nenhuma configuração de sandbox/permissão foi alterada pelo agente.

Próxima inspeção: 1366×768, 1920×900 e 1920×1080, fontes/mão cheias, todas as zonas, tooltip móvel, mira, decisões e movimento reduzido. QA deve usar aba nova da prévia ou mesa própria, preservando a partida humana.

## Inspeção real após reinício — 23/10/2026

O acesso voltou em cua.getState. Servidor inicialmente respondeu conexão recusada e nenhuma das portas 4181/4180/4179/4178 estava escutando. Iniciado npm start na 4181, sessão exec 27422. Health agora mostra zero sessões: as partidas em memória do processo anterior não sobreviveram ao encerramento. Nenhum token ou biblioteca local foi apagado; não afirmar preservação da mesa anterior após esse evento.

Capturas reais da **prévia isolada**, sem partida humana/API de ações:

- [1366×768](atlas-1366x768.png), [1920×900](atlas-1920x900.png) e [1920×1080](atlas-1920x1080.png): dimensões scrollWidth/scrollHeight iguais ao viewport em cada caso, sem rolagem de página; quadro integral com margens laterais na janela larga.
- [Campo cheio em Full HD](atlas-cheio-1920x1080.png): 12 monstros, oito fontes por lado, oito cartas na mão e rituais cheios. Fontes têm faixa interna de 324 px/scrollWidth 1297 px. Inspecionada a presença da rolagem interna; não percorridos todos os oito itens.
- [Mão aberta](atlas-mao-aberta-1920x1080.png): expansão sobre o campo e inspeção grande da carta. Abertura observada por entrada/clique; não houve medição de latência.
- [Hover do campo](atlas-hover-1920x900.png): Guia dos Túneis em following-pointer, sem pinned. Em dois pontos, ponteiro (925,625)→(935,650), prévia (945,400,297)→(955,425,297), largura 620 px/altura 449,406 px. Deslocamento acompanha +10/+25 px. Captura e coordenadas não medem FPS.
- Arrastar Catadora (1050,520) até Bastião (947,350) produziu o aviso “Prévia isolada — nenhuma partida real é alterada.” Isso confirma encaminhamento ao destino válido na UI; não é resolução de combate/replay real nem registro de todos os frames da flecha.

Corrigidos após observar a pintura: badges passaram ao canto superior, liberando atributos; ícone/contador das pilhas centralizados; campo não seleciona acidentalmente textos durante arrastos. Texto de inspeção/ajuda/histórico continua selecionável. Rebuild/typecheck aprovados; 120 testes anteriores permanecem referência funcional, sem repetir simulação de regras para ajuste só de CSS.

A última tentativa de fechamento do hover e lotação em 1366 foi interrompida por timeout da conexão da aba; não registrá-la como aprovada. Tamanho do navegador restaurado pelo viewport.reset. Sem acesso às abas de trabalho/partida do usuário. Ainda pendem: movimento reduzido em browser, todos os fluxos de decisões/gatilhos no Atlas, arrasto da mão em partida real, cancelamento/retorno em movimento e medição de desempenho. Aceite artístico humano continua necessário; captura da fixture não comprova conservação de deck ou balanceamento.

## Prévia isolada

Atualização WB-D18: vazamento dos fundos sobre molduras corrigido em atlas.css. Painéis laterais transparentes, títulos recuados e barra das fontes dentro da borda; estado valid-drop não repinta fundo/borda/sombra/outline do contêiner, realça o rótulo. Build/typecheck aprovados: main-CFSuCZ8j.js 345,91 kB/100,49 gzip, main-0HUI4fBY.css 75,65/18,25, atlasPreview-0V6nTtyr.js 12,77/5,27. [HTTP atual](molduras-http.json) com bytes iguais ao dist, servidor preservado. Sem nova execução dos 120 testes para ajuste de CSS.

[Captura normal corrigida](molduras-corrigidas.png) · [Campo cheio corrigido](molduras-campo-cheio.png) · [Medidas](molduras-verificacao.json). Inspeção no browser em 1280×720 confirma transparência dos seis contêineres e ausência de overflow nas quatro áreas de rituais; fundo/cantos originais visíveis. Estado ativo de drop revisado no código, sem execução de conjuração nesta rodada. Assets/regras não alterados.

[Cena de referência](http://127.0.0.1:4181/atlas-preview.html) · [Campo cheio](http://127.0.0.1:4181/atlas-preview.html?cheio=1). Fixture pública montada manualmente, sem conservação de deck legal; comparação de composição e limites, não evidência de partida, equilíbrio ou privacidade de uma sessão real. Mesma UI de produção, ações somente mostram aviso; token da mesa e decks não são escritos. Capturas posteriores desta prévia estão listadas na inspeção real acima.
