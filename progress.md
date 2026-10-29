# Progresso — Wizards Battle

- Fase: desenvolvimento
- Atualização: 29/10/2026 (produção em https://wizardsbattle.freccs.com.br)
- Objetivo atual: As Terras Despertas completa0.11/4187 entregue; receber playtest dos seis decks novos e leitura do selo. Energia acumulada, feedback causal, VES e sala0.10 preservados.
- Código: `C:/Users/rafaf/Documents/Projects/Pessoal/Hub/GamesCodex/projetos/wizards-battle/src`.
- Stack confirmada: Node 24.19.0, TypeScript 5.9.3, React 19.3.1, Vite 8.3.5, Vitest 4.1.12; lockfile em src/package-lock.json.

Fonte única de execução. [GDD](GDD.md) · [Decisões](decisoes.md) · [Spec](specs/WB-001.md).

## Hospedagem pública — 29/10/2026

| ID | Tarefa | Estado | Evidência |
| --- | --- | --- | --- |
| WB-28 | Publicar na VPS em https://wizardsbattle.freccs.com.br | concluida | Pedido explícito do usuário; commit/push `56c67ac` confirmado por ele. VPS KingHost 191.252.209.31 (compartilhada). `/opt/wizards-battle` (clone HTTPS do repositório público), contêiner `wizards-battle` em 127.0.0.1:4200 (healthy, ~231 MB de 384 MB), volume `wizards-battle_dados` com o SQLite das salas. Apache `wizardsbattle.conf` + `wizardsbattle-le-ssl.conf` (certbot com redirect 301). Validado de fora: `/api/health` 0.11.0, home/JS gzip/cartas 200, fontes `font/woff2`, duelo solo iniciado no navegador sem erro no console; Magic Battle e InkDuels seguem 200. [DEPLOY.md](DEPLOY.md). Aviso central reposicionado acima da pílula de turno (medido 11–15 px de folga em 1920×1080, 1366×768 e 1600×1000). Pendente: salas com amigo em dois dispositivos ainda não testadas no domínio. |

## Auditoria de UI/HUD — 29/10/2026

| ID | Tarefa | Estado | Evidência |
| --- | --- | --- | --- |
| WB-26 | Auditoria de layout/HUD/UI e plano de polimento | correções A + tokens D1 implementados; mockup B/C1 aguardando escolha | 29/10, usuário escolheu “Correções + mockup”. Novos `src/web/tokens.css` e `polish.css` (camada final só com tokens). Em `main.tsx`: Grimório substitui os seis botões; faixa de debug só aparece em duelo com amigo; vagas sem “Vaga livre”; fontes vazias só com glifo e tooltip; dica de sacrifício só durante o arrasto; “Como jogar?” da mão removido. Avisos movidos para o eixo central; troca de mão em ardósia/latão, acima do campo; títulos e contadores longe da moldura; piso de ~12 px; zeros de Escola/Presença esmaecidos; eixo mostra “Sua decisão/Vez do rival” e fases centralizadas. Testes ajustados ao Grimório (+1 teste novo; mock de terras-ui passa a devolver a mesa nas consultas). Typecheck/build aprovados; **541/541 testes**. Capturas reais 1920×1080 e 1366×768 em qa/ui-auditoria-v011/depois-A. Mockup em [arte/direcoes/mesa-v2](arte/direcoes/mesa-v2/README.md) com três pares tipográficos. Build em dist-v11 (4187 recarrega a UI; servidor não reiniciado). Pendente: texto “+N energia” das fontes aliadas encosta na divisória com campo cheio em 1080p. |
| WB-27 | Mesa v2 e par tipográfico C (WB-D30) | implementada; aceite humano em movimento pendente | Usuário: “Par C + fichas”. Alegreya SC/Sans 5.3.0 (OFL-1.1) empacotadas via @fontsource, sem CDN; tokens e todos os CSS sem Georgia/Segoe fixos. Novo `src/web/mesa-v2.css`: ardósia sobre a área jogável; magos e fontes na coluna esquerda; Escola/Presença como placas por escola na direita, acesas pelas escolas de cartas conjuráveis; rituais em painéis de pergaminho; quatro faixas com fichas de 142×196 px em 1080p (recorte da arte, nome em fita, selos de Força/Vigor, coral = ferido, dourado = reforçado); eixo com mostrador de vez; engrenagem de turno pulsando quando só resta avançar; “Conjurar magia” só com carta selecionada ou em arrasto; `overflow:clip` na arena. `main.tsx`: placas separadas da barra do mago, classes `wanted`/`boosted`/`has-selection`/`only-action`. **542/542 testes**, typecheck e build dist-v11. Capturas reais em qa/ui-auditoria-v011/mesa-v2: fixture cheia 1080/1366, preparação, coleção, partida real turno 2 e decisão de descarte; sem scroll de página. Limites: fontes com mais de 6 medalhões rolam dentro do painel em 1366; nomes longos truncam na fita; sem vídeo/FPS e sem teste de arrasto real nesta rodada. |
| WB-26a | (histórico) primeira entrega da auditoria | análise entregue | [Relatório e 14 capturas](qa/ui-auditoria-v011/README.md). Instância isolada 4197 com save temporário; Playwright 1920×1080 com home, preparação, mulligan, turnos 1–3 contra o bot, mão/prévia, menus, coleção, e fixture cheia também em 1366×768. Achados: identidade quebrada fora da home, tipografia de sistema, cartas de campo ~104×145 px, laterais vazias, 32 contadores de Escola/Presença, turno pouco visível, defeitos de corte/contraste (D1–D5). Propostas A–D são refinamento do Atlas C, não decisões aceitas. Sem FPS/vídeo; D8 a confirmar. 4187 e saves reais não tocados. |

## Publicação Git — 27/10/2026

| ID | Tarefa | Estado | Evidência |
| --- | --- | --- | --- |
| WB-25 | Publicar no GitHub e manter sincronizado | concluida; novos commits sob confirmação | Commit inicial 208b6e5 publicado em origin/main, upstream configurado. 2.191 arquivos; saves/logs/dependências/builds/segredos excluídos. npm test: 540/540 em 19 arquivos; npm run typecheck aprovado em 27/10/2026. Automação sincronizar-wizards-battle-com-github pausada conforme WB-D29. Após novas alterações, perguntar se o usuário deseja commitar/publicar; aguardar confirmação. Divergências/falhas geram aviso, sem force-push. |

## Entrega atual — WB-24 / WB-D27, 24/10/2026

Pedido de completar a edição e retirar protótipo/sigla atendido em0.11.0/4187/dist-v11, banco exclusivo saves/rooms-terras-complete-v1.sqlite. [WB-012](specs/WB-012-terras-completa.md), [QA](qa/terras-v110/README.md), [60cartas](design/terras-despertas/galeria-edicao-v1.html).

| ID | Tarefa | Estado | Evidência |
| --- | --- | --- | --- |
| WB-24 | Completar As Terras Despertas e sua apresentação publicada | concluida funcionalmente; equilíbrio e inspeção gráfica de gameplay humanos em acompanhamento | 60cartas/6decks próprios/140total;48ilustrações novas/60frentes/selo nativo, publicação sem rótulo experimental.540testes;144duelos completos/19249ações comtodas60conjuradas/replay idêntico;HTTP374pedidos/262checks/reinício/revanche/60PNG. Cinco pranchas e3frentes individuais inspecionadas; navegador indisponível. Servidor4187 ativo;4186comuma sala preservado. |

Arquivos: quatroJSON de edição completa; engine/{engine,types,decks}, catalog/catalogue, server/{index,rooms}, legacy/*-v10 e tipos de decks-v08/v09; web/{main,collection,cards,deck-manager,sanctuary}; public/cartas/TDP* eTD-P*, arte/terras-despertas/edicao-v1 e scripts editoriais; package/lock/vite; testes novos de edição/símbolo/HTTP/simulação e fixtures/regressões ajustadas; launchersgeral/completa/feedback/internet. Dados e80imagensVES preservados porhash. Internamente TD-P01–12conservados para listas/replays; frente usa número editorial001–060. Atualização de max_cost vale para atacante/defensor/event_source, replay0.10delegado àcópia congelada.

Próximo: usuário jogar os seis decks e combinar VES/TDP, registrando cartas dominantes/raramente úteis e feedback da legibilidade. Disponibilidade funcional completa não encerra ajustes de equilíbrio. Não criar tarefas/progresso paralelos nem migrar bancos antigos. Navegador/áudio/FPS não validados nesta rodada.

## Entrega anterior — WB-23 / WB-D26, 24/10/2026

Implementado [WB-011](specs/WB-011-feedback-causal.md), 0.10.0/4186/dist-v10 e banco exclusivo saves/rooms-feedback-v1.sqlite. Motor emite acontecimentos numerados com origem/alvo/valor/causa; servidor filtra identidades privadas por assento. Cliente serializa a apresentação antes de confirmar cada snapshot e solicitar a próxima ação do bot. [QA e limites](qa/feedback-v100/README.md).

| ID | Entrega | Estado | Critério / evidência |
| --- | --- | --- | --- |
| WB-23 | Feedback causal e polimento de apresentação | concluida funcionalmente; revisão perceptiva em movimento pendente | 421/421 testes; 36 duelos completos/4829 ações comparadas ao motor 0.9, jogadores/RNG/vencedor idênticos e replay exato; HTTP/reinício real/privacidade. DOM/WAAPI simulados verificam sequência e limpeza. Navegador local desabilitado no Work impede captura, áudio ouvido e FPS reais. |

Conjuração em destaque/viagem à zona, intenção de ataque/impacto/retorno/interrupção, ligação de efeitos à origem, dano/cura/duração/energia com valores, mortos ao descarte e fontes às Cinzas. Cartas recém-entradas persistem durante efeitos. Suportes contínuos explicam ganho/perda de Força e habilidades, incluindo Cuidadora quando o alvo fica ferido. Histórico “Por que aconteceu?” e último evento compacto; menu Feedback opaco com Cinemático/Rápido e som sintetizado opcional desligado por padrão. Movimento reduzido, aba oculta, desmontagem, nova rodada e falha de animação preservam confirmação do servidor.

Arquivos: engine/{engine,types,feedback}.ts e legacy/*-v09.ts; web/{battle-feedback,feedback-motion,use-feedback,feedback.css,main,motion,sanctuary}; server/index.ts; build/package/lock; tests/{feedback,feedback-ui,http-feedback,feedback-simulate} e ajustes de fixtures/asserts históricos; launchers Feedback-Visual/geral/internet. Dados, custos, energia e 92 frentes preservados por hash. Launcher dedicado executado, servidor4186 ativo, instâncias anteriores mantidas.

Próximo: teste humano da clareza/ritmo e captura real para ajustar tempos. Não homologar qualidade visual/sonora por DOM. Não alterar arte/números automaticamente. Mesas4185 continuam na0.9; banco não migrado. Decks de outra origem via backup JSON.

## Entrega anterior — WB-22 / WB-D25, 24/10/2026

Usuário autoriza “vamos implementar para eu testar” após propor conservação da energia. Entregue 0.9.0/4185/dist-v09 com banco exclusivo saves/rooms-energy-v1.sqlite. Jogar seleciona “Acumulada — experimental” por padrão em Escola + Presença; VES e conjunto TDP opcionais. Regra anterior selecionável. [Contrato WB-010](specs/WB-010-energia-acumulada.md), [QA](qa/energia-v090/README.md).

| ID | Entrega | Estado | Critério / evidência |
| --- | --- | --- | --- |
| WB-22 | Reserva de energia entre turnos | concluida funcionalmente; inspeção visual da partida parcial | 399 testes aprovados, seis duelos completos/replay exato incluídos, HTTP/reinício real/revanche e validação dos dois assentos. Preparação observada no navegador com reserva selecionada; percurso de partida interrompido porque o uso local do navegador foi desabilitado nas configurações do Work. Ritmo/equilíbrio e inspeção visual completa aguardam teste humano. |

Reserva pública sem teto, pagamentos normais, geração/duração/sacrifício/Escola/Presença preservados; fonte destruída/expirada não apaga saldo produzido. Guardiã da Cisterna não duplica energia nem abre escolha redundante nesse modo; guia/inspeção explicam habilidade sem efeito adicional no experimento. Sua regra original continua funcionando quando selecionada. Sem redesign de carta/arte aprovado.

Arquivos: engine/{engine,types}.ts, legacy/{engine,decks,catalogue}-v08.ts, server/{rooms,index}.ts, web/{main,network,sanctuary}, vite/package/lock, testes energy-reserve/terras-ui/terras/http-energy, launchers e WB-010. Build/typecheck aprovados; launch dedicado executado e servidor novo ativo. 4184 continuou em 0.8 com as mesmas duas salas; 4183 estava desligada e não foi iniciada. Não migrar saves antigos nem iniciar dois processos no mesmo banco. Launcher histórico 0.8 só reutiliza instância existente; se desligada encaminha à versão atual em outro banco.

Próximo: usuário testar o ritmo com energia acumulada, incluindo turno de poupança e resposta após perder campo. Não declarar melhoria de diversão por testes automatizados. Completar inspeção visual da mesa quando navegador estiver disponível; nenhuma liberação solicitada nesta rodada.

## Entrega anterior — 24/10/2026, WB-21 / WB-D24

Passos 1–3 concluídos na 0.8.0: auditoria das 12 contra VES e revisão 0.2; Ressonância com bônus no próprio efeito; consulta privada/reordenação de Lia e recuperação de Cinzas com alvo reservado da Catadora. Runtime/catálogo/decks/coleção/preparação/salas/bot/replay integrados ao conjunto opcional terras-pilot-v1. Três modelos mistos de 40 e listas próprias. [Contrato](specs/WB-009-terras-piloto.md), [evidências completas e pendências](qa/terras-v080/README.md).

Build/typecheck e 380 testes aprovados. 108 duelos completos, replay idêntico e 12 nomes Terras conjurados; HTTP isolado com 309 chamadas e reinício real de consulta privada. Percurso browser: coleção TDP, editor/lista QA, preparação explícita, fontes, Bruma/Javali, fases e recarga com retomada. Comparados os 80 hashes de frentes VES, nenhum alterado. Launcher iniciado na 4184 e reexecutado para conferir reutilização sem outro processo. 4183/0.7 e seus saves/túnel preservados.

Arquivos principais: src/engine/{engine,decks,types}.ts e legacy/*-v07.ts; src/catalog/; quatro JSONs src/data/terras-*; src/server/{index,rooms}.ts; src/web/{main,collection,deck-manager,cards,sanctuary,network}; três testes/driver Terras mais HTTP; frentes revisadas arte/terras-despertas/piloto-v02 e src/public/cartas/TD-P*.png; launchers e dist-v08. Save vivo exclusivo saves/rooms-terras-v1.sqlite, QA em arquivos separados.

Próximo passo: playtest humano de equilíbrio/diversão (passo 4), sem ampliar automaticamente para 60 cartas. Nova inspeção desta entrega cobre 1280×720 e a mesa no tamanho natural 1037×884, sem homologar outros dispositivos/latência pública. Túnel antigo continua servindo 0.7; o piloto pode abrir outro via launcher quando solicitado.

| ID | Entrega | Estado | Critério / evidência |
| --- | --- | --- | --- |
| WB-00 | Registro e formalização | concluida | Documentos, índices e vínculo de origem criados; WB-D01/02 |
| WB-01 | Motor interativo Pira/Queimada | concluida para protótipo | 49 nomes nos dois decks, ações, escolhas/custos, combate, suportes, Prenúncios e replay; 33 cenários aprovados. Não é homologação individual das 49 cartas |
| WB-02 | Servidor e bot com visão limitada | concluida para protótipo | HTTP local, token, motor autoritativo, visão filtrada, bot heurístico e partidas completas; estratégia avançada pendente |
| WB-03 | Mesa browser e assets aprovados | concluida para protótipo | Lobby, inspeção, ações, zonas, histórico e 80 frentes nativas reaproveitadas; capturas em 1366×900/1920×1080, sem aprovação humana da mesa |
| WB-04 | Verificação e primeiro playtest | em-andamento | Build/typecheck, 33 testes, 40 partidas simuladas e partida HTTP completos; teste humano e balanceamento pendentes |
| WB-05 | Habilitar 80 cartas/seis decks nos duelos | concluida funcionalmente | WB-D20/[WB-007](specs/WB-007-primeira-edicao.md), 0.6.0/4182/dist-v06: 80 cartas auditadas individualmente e habilitadas, seis modelos/oponentes, montagem livre; 309 testes, 252 duelos/replays e HTTP dos seis decks. [QA e limites](qa/ves-v060/README.md). Equilíbrio humano permanece em WB-04; 4181 preservada. |
| WB-06 | Salas humanas e publicação | concluida para piloto LAN/HTTPS temporário | WB-D22/WB-008, 0.7.0/4183/dist-v07: assentos privados, convite/lista própria, polling/reconexão, SQLite, revisão/deduplicação, concessão/revanche; HTTP com reinício e percurso browser. Hospedagem permanente e dois dispositivos físicos não homologados. [QA](qa/amigos-v070/README.md). |
| WB-07 | Polimento de UI, drag, feedback e gatilhos | concluida tecnicamente na 0.7.0 | Consolidada em WB-18/WB-008: drag/clique/teclado, cancelamentos, foco estável, inspeção/habilidades e decisões privadas, movimento reduzido. Cenários automáticos e percurso legal browser; aceite humano separado. [QA](qa/amigos-v070/README.md). |
| WB-08 | Prévia local, legibilidade, mira e mão recolhida | concluida tecnicamente na 0.7.0 | Consolidada em WB-18/WB-008: drag/clique/teclado, cancelamentos, foco estável, inspeção/habilidades e decisões privadas, movimento reduzido. Cenários automáticos e percurso legal browser; aceite humano separado. [QA](qa/amigos-v070/README.md). |
| WB-09 | Habilidades explicadas e prévia flutuante no mouse | concluida tecnicamente na 0.7.0 | Consolidada em WB-18/WB-008: drag/clique/teclado, cancelamentos, foco estável, inspeção/habilidades e decisões privadas, movimento reduzido. Cenários automáticos e percurso legal browser; aceite humano separado. [QA](qa/amigos-v070/README.md). |
| WB-10 | Fundação TCG: edições, raridades e catálogo | em-andamento | WB-D10/11: UI 0.3.0, 80 impressões VES classificadas, símbolo vetorial, Coleção/busca/filtros e seis decks mistos. 71 testes/build/HTTP e 80 hashes aprovados; classificação/visual/playtest pendentes |
| WB-11 | Gerenciamento e duelos com decks personalizados | em-andamento | WB-D12/WB-004, 0.4.0: CRUD, rascunhos, persistência/backup e seleção/jogo; servidor valida 40/3/conjunto habilitado e snapshot/replay. 97 testes/build/HTTP/compatibilidade legada aprovados; revisão visual/manual pendente |

## Evidências e execução

| ID | Entrega | Estado | Critério / evidência |
| --- | --- | --- | --- |
| WB-12 | Pesquisa e três direções da home | implementação entregue; aceite visual pendente | WB-D14 escolhe A. Home usa o PNG aprovado; decks/coleção recebem ambientes ilustrados. 0.5.0 em 4181; [QA/capturas](qa/santuario-v050/README.md). Home sem scroll em 1366×768/1920×900; inspeção final de 1080 pendente. |
| WB-13 | Refinamento de presença | implementada para teste; balanceamento pendente | WB-D15/WB-005: Escola permanente por fonte/conjuração, inclusive rejogar; Presença do campo separada. Motor/bot/replay/UI e condição futura de efeito por Presença. 118 testes e build aprovados; playtest e cartas fortes de Presença pendentes. |
| WB-14 | Direções da arte da batalha | concluida; C escolhida | WB-D16/17: três pranchas originais A/Mesa, B/Arena, C/Atlas, prompts e comparação. Usuário escolheu C explicitamente. [Propostas históricas](arte/direcoes/batalha-propostas.md). |
| WB-15 | Batalha Atlas do Conclave | concluida tecnicamente na 0.7.0; aceite humano separado | WB-D17/22: arte C preservada; revisão de interação e polimento consolidados em WB-18. Capturas desktop reais em frames, amostra rAF e limites em [QA 0.7](qa/amigos-v070/README.md); [QA histórico](qa/atlas-v051/README.md) preservado. |
| WB-16 | Estudo de evolução e roadmap | concluida como estudo; detalhamento em discussão | [Roadmap](roadmap.md) e [memória](brainstorming-hub.md), 23/10: inspeção estática de dados/motor/bot/servidor, referências primárias e marcos com critérios de avanço. WB-D19 escolhe equilíbrio entre solo e amigos; sequência ajustada para pequenos ganhos solo e salas cedo. Não autoriza implementação dos candidatos; diversão/equilíbrio não validados nesta rodada. |
| WB-17 | Menus opacos | implementada; revisão humana pendente | WB-D21: preparação, decks, coleção, guia e inspeção com fundos sólidos. Build/typecheck e inspeção real de menus aprovados; [QA/capturas](qa/menus-opacos/README.md). Sem alteração de motor, cartas ou sessões. |
| WB-20 | Concepção da segunda expansão | concepção concluida; edição completa entregue em WB-24 | WB-D23: As Terras Despertas. [Conceito](design/terras-despertas.md) e [prévia original 0.1](design/terras-despertas/galeria.html) preservados. Piloto auditado/jogável entregue em WB-21; dimensão final, equilíbrio humano e demais cartas continuam em discussão. |
| WB-21 | Auditar, fechar Ressonância e implementar piloto de 12 | concluida tecnicamente; equilíbrio humano pendente | WB-D24/WB-009: [auditoria](design/terras-despertas/auditoria-v02.md), 12 frentes/textos 0.2, conjunto explícito, três modelos mistos/listas próprias, solo/salas, bot/replay; 380 testes, 108 duelos completos com 12 nomes conjurados/replays idênticos, HTTP/reinício privado de Lia e percurso browser. [QA/capturas/limites](qa/terras-v080/README.md). 0.8/4184/dist-v08/save próprio; 4183/VES preservados. Passo 4 humano não homologado. |

## 23/10/2026 — Home e presença, WB-D13

Capturas fornecidas mostram home com rolagem dupla e sequência com 2→4 de energia/zero presença. Causa reproduzida em testes: duração 1 expira no próprio sacrifício na base; expiração no Despertar retira presença antes da principal. Não atribuir a erro de contagem: usuário já confirmara fontes/monstros/encantamentos. [Proposta de Vínculos](design/presenca-v01.md) deixa +1 permanente por escola ao criar fonte, sem contar a fonte duas vezes e mantendo energia/Cinzas da base. Modelo não importado por partidas/bot, sem regra global aceita.

Pesquisa MTG Arena, hub de Path of Champions e menu histórico Hearthstone registrada em [home-propostas](arte/direcoes/home-propostas.md). Três conceitos originais gerados por imagegen: A/Santuário do Pulso, B/Ateliê do Invocador, C/Portais de Véspera; prompts e PNGs por direção. Recomendação A para hub, escolha humana pendente. Menus conceituais não substituem símbolos/cartas aprovadas. Home de produção ainda não redesenhada.

Adicionados src/research/presence-study.ts/export-presence-study.ts, tests/presence-study.test.ts e página estática src/public/estudos/home-presenca.html com imagens/dados. Copiados somente novos estáticos para dist-v04/estudos, sem build/reinício ou mudança do motor em memória. [Comparação JSON](qa/presenca-v01/comparacao.json), [seis testes novos](qa/presenca-v01/tests.json), [regressão 103/103](qa/presenca-v01/regressao.json); npm run typecheck aprovado. Testes base/integral usam ações reais do motor; proposta isolada não prova equilíbrio das 80 nem estratégia do bot.

Navegador acessível nesta rodada: galeria aberta em aba separada, A/B/C e slider/checkbox da comparação inspecionados no browser real em 1280×720. Galeria sem scroll de página nessa resolução; isto não valida a home de produção nem seus alvos finais. [Captura B](qa/presenca-v01/galeria-b-browser.png), [C](qa/presenca-v01/galeria-c-browser.png), [comparador](qa/presenca-v01/comparador-browser.png). Partida do usuário preservada. Bloqueio anterior de browser não se aplica a esta rodada; demais validações antigas continuam pendentes até execução específica.

Próximo passo: usuário escolhe direção A/B/C e avalia a regra candidata separadamente; então implementar home escolhida e variante versionada com auditoria de habilidades, bot/replay/visibilidade e playtest. Não registrar escolha de arte como aprovação automática da regra.

Resultados de 22/10/2026 em [qa/README.md](qa/README.md). Comandos executados a partir de src/:

```powershell
npm ci
npm run build
npm test
npm run simulate
npm start
# Com servidor ativo:
npm run test:http
```

Nesta rodada a instalação executada foi `npm install --no-audit --no-fund`; `npm ci` é a instrução para reproduzir o lockfile, ainda não executada. Build/typecheck e demais comandos acima, exceto ci, confirmados. Desenvolvimento com `npm run dev` também executado. Servidor final em **http://127.0.0.1:4178**, modo de produção local. Atalho preparado: Iniciar-Wizards-Battle.ps1 (fluxo completo do atalho não executado).

33 testes aprovados. 40 partidas determinísticas, 20 por variante: todas terminadas, máximo 58 turnos individuais, 42/49 nomes efetivamente conjurados. Conservação de 80 cartas totais por partida, recursos/vagas e replay conferidos. HTTP final: 129 requisições, partida completa em 28 turnos/120 ações, autenticação/origem/privacidade/erro atômico e replay após término aprovados. Não inferir força do bot ou equilíbrio humano.

Na revisão do navegador, observada heurística que recuava atacante sem vantagem: corrigida e coberta por regressão. Nova bateria de testes/simulações e fumaça HTTP executadas após a correção. Interação no navegador incluiu base v0.3 com fontes/Cinzas/armar/turnos do bot e variante com fonte duradoura, conjuração e escolha de fileira. Sessão pode ser retomada por token enquanto o processo estiver ativo; reiniciar servidor perde mesas em memória.

Magic Battle foi somente inspecionado na origem, sem alteração. Nenhuma nova regra física aprovada. Assets e dados de runtime são cópias próprias dentro do projeto; hashes em qa/origem-artes.json e src/data/identity.json.

## Polimento 0.2 — implementação em 22/10/2026

Pedido WB-D06: mesa anterior criticada como amadora e sem manipulação fluida. Novo frontend em src/web/main.tsx/style.css, destinos autorizados em interaction.ts e transições confirmadas pelo servidor em motion.ts. Mão em leque, zonas nomeadas com função/ajuda, preview flutuante, Pointer Events com captura, destinos válidos, cancelamento/retorno, linha de ataque, clique/teclado alternativos, dano/cura, última ação e histórico.

Motor agora agrupa habilidades simultâneas e oferece ao dono escolher a próxima a resolver; efeitos de cada habilidade permanecem juntos. Grupos em início/encerramento, mortes próprias simultâneas, encantamentos pós-magia/reposicionamento e Prenúncios do mesmo ataque. Escolhas privadas filtradas; Prenúncios revelados antes da ordem. Replay versionado wb-0.2.0/rules-0.3-trigger-order; antigos incompatíveis são rejeitados. [Spec](specs/WB-002.md).

**Endereço atual para testar: http://127.0.0.1:4179**, servidor 0.2 confirmado por /api/health. Porta 4178 é da instância anterior; não usá-la para validar a 0.2. Atalho/default atualizados para 4179. Instância antiga não foi encerrada para preservar eventual mesa aberta. Reinício da instância isolada 4179 ocorreu apenas durante desenvolvimento desta revisão.

Resultados: **48 testes aprovados** (39 motor/mapeamento + 9 UI em jsdom), [relatório](qa/polimento-v02-tests.json); **40 partidas completas** após mudança dos gatilhos, máximo 58 turnos/42 nomes conjurados; build/typecheck aprovados (JS 248,22 kB / 77,72 kB gzip, CSS 27,52 kB). Última fumaça HTTP 0.2: 201 requisições, 49 turnos/192 ações, privacidade/autorização/erro atômico/replay aprovados. Números variam no HTTP porque seed da API é aleatória. [QA](qa/polimento-v02.md).

**Pendência real:** cua_repl retornou “Local browser use is disabled in Work settings”. Não houve inspeção visual nem teste manual de drag da versão 0.2, medição de fluidez ou novas capturas. Usuário perguntou como reativar; consultada documentação oficial, orientado Configurações > Browser > ativar navegador e revisar Browse para localhost. Aguardar liberação e revisar em 1366×900/1920×1080. Nenhuma aprovação humana presumida.

## Limitações materiais

### 23/10/2026 — UI 0.2.1, WB-D07

Usuário forneceu [captura real da 0.2](qa/referencia-usuario-2026-10-23.png) e relatou preview/textos pequenos, carta flutuante ocultando alvo e muito espaço usado pela mão. A captura é evidência do estado anterior, não da revisão nova. “Está melhorando” é avaliação parcial, não aceite final.

Alterações em src/web/main.tsx e novo readability.css: prévia da mão local de 540–660 px totais (arte + coluna de regra em 16 px), posicionada acima da mão e limitada às bordas laterais; hover muda de carta mesmo com outra selecionada. Fontes de interface ampliadas (nomes das zonas 13–14 px, funções 10–11 px, descrições/ações 13–16 px, estatísticas 17 px). Cartas originais intactas.

Mão ocupa uma faixa de 66–72 px recolhida e abre 210–242 px sobre o campo por hover/foco; permanece aberta durante drag iniciado na mão. Campo ganha altura; tamanho das cartas segue altura disponível (100–184 px), sem afirmar medição real desses tamanhos. Ataque inicia mira ao pressionar o monstro, mantém origem visível e não cria ghost de carta; ao soltar conecta centros origem/alvo por 650 ms após ação válida. Drop inválido e Esc cancelam sem gastar ataque. Clique curto continua abrindo ações.

Validação: **52/52 testes** em [legibilidade-v021-tests.json](qa/legibilidade-v021-tests.json), incluindo 4 novas regressões (prévia/hover, expansão da mão, ataque sem ghost com conexão, ataque cancelado fora). Build/typecheck aprovados. [HTTP estático](qa/legibilidade-v021-http.json): HTML serve JS/CSS novos com 200 em http://127.0.0.1:4179. Motor inalterado, processo/mesas não reiniciados; não repetir simulação como se houvesse nova regra.

Tentativa de browser em 23/10 ainda respondeu “Local browser use is disabled in Work settings”. Nenhuma captura 0.2.1, medição de FPS/fluidez ou inspeção do layout novo pelo agente. Revisão visual real continua necessária; não apresentar artefato antigo como prova nova. [QA desta revisão](qa/legibilidade-v021.md).

- Sete nomes não foram conjurados na bateria final: VES-010, 013, 029, 039, 049, 050 e 071. Alguns têm exercícios dirigidos; isso não equivale a observar todas as interações em partida.
- Bot é heurístico, sem busca profunda/planejamento de combos em múltiplos turnos. Regra correta e força estratégica são aceites separados.
- Ordem de gatilhos do mesmo dono implementada na 0.2 e testada; UX da decisão ainda exige revisão em navegador. Bot escolhe uma ordem válida por heurística. Cinzas próprias podem ser consultadas para pagamento; rival recebe só quantidade.
- Replays completos só disponíveis após o fim, para evitar revelar segredos durante a partida. Importação visual de replay e persistência de mesas ainda não existem.
- Rede pública/salas humanas, mobile, áudio e aprovação visual/funcional humana continuam pendentes. O snapshot de 80 cartas não significa 80 habilitadas; primeiro recorte tem Pira/Queimada.

## Próxima ação

Testar **motor 0.5.0 / UI Atlas 0.5.1 em http://127.0.0.1:4181** com Escola/Presença; avaliar ritmo de conjuração, híbridas, fontes curtas e combos de rejogar. Concluir comparação visual com a prancha C, mesa cheia, hover/mira/drag em movimento e home 1920×1080 quando browser estiver acessível. Definir primeiras habilidades fortes de Presença. Preservar 4180/4179/4178 e mesas. Raridades e liberação das demais cartas/seis decks seguem pendentes.

## 23/10/2026 — UI 0.2.2, WB-D08

Duas capturas fornecidas pelo usuário mostram a 0.2.1: [badges](qa/referencia-badges-usuario-v021.png) e [prévia lateral](qa/referencia-previa-usuario-v021.png). Fato confirmado nos dados/motor: Catadora de Lamparinas recebe Alcance do Guia dos Túneis na retaguarda; Corredor das Brasas tem Ímpeto impresso. A UI exibia apenas um símbolo por carta, sem explicar sua origem.

Implementados em src/web/main.tsx, presentation.ts e readability.css: badges nomeados para todas as palavras-chave; prévia com descrição/origem pública, atributos atuais e estado do Suporte. O helper explica apenas keywords confirmadas na visão do servidor, sem habilitar ações ou consultar informação oculta. Prévia do campo passa a ampliar sobre a posição da carta em hover/foco, com 620 px de largura total máxima e duas colunas, limitada pelas bordas e altura real do painel. Hover não captura ponteiro. Mão mantém prévia local anterior; cartas/frentes e motor não foram alterados.

Validação executada: **57/57 testes** (39 motor/mapeamento + 18 UI/posicionamento), [relatório](qa/habilidades-v022-tests.json). Novos casos: Alcance concedido versus Ímpeto próprio; habilidades simultâneas; perda de Alcance após reposicionar o Guia pelo motor; âncora da prévia do campo por hover/foco; limites nas quatro bordas em 1366×768 e 1920×1080. Build/typecheck aprovados: JS 253,66 kB / 79,37 kB gzip, CSS 35,00 kB. [HTTP estático](qa/habilidades-v022-http.json): bundles novos retornam 200, iguais byte a byte ao build e com marcadores 0.2.2. Servidor 4179 permanece no motor 0.2.0, duas sessões reportadas, sem reinício nesta rodada.

Tentativa atual de cua.getState retornou “Local browser use is disabled in Work settings”; sem inspeção real de pintura/fluidez ou captura nova pelo agente. As duas imagens são referências da versão anterior enviadas pelo usuário. Não concluir aceite visual com DOM simulado. [QA](qa/habilidades-v022.md).

## 23/10/2026 — UI 0.2.3, WB-D09

Usuário rejeitou o preview fixo da 0.2.2 e especificou flutuação ancorada no mouse enquanto houver hover. Implementado em src/web/main.tsx/presentation.ts/readability.css: mouseenter registra coordenadas, mousemove atualiza posição do painel em requestAnimationFrame, sem rerender da mesa por pixel. Painel fica afastado 20 px lateralmente, troca de lado perto da borda e permanece limitado à janela. Vale para campo e mão; hover não captura input e fecha ao sair, salvo inspeção mantida por clique. Ações por clique e foco por teclado preservados. Frames pendentes são cancelados ao sair/desmontar; prévia é suprimida durante drag/ataque.

**60/60 testes aprovados** (39 motor/mapeamento + 21 UI/posicionamento), [relatório](qa/preview-v023-tests.json). Três casos novos verificam deslocamento nos eixos X/Y sem trocar o painel, fechamento/cancelamento ao sair, mão flutuante e ações por clique/Esc, além de troca de lado e limites. Build/typecheck aprovados: JS 254,93 kB / 79,76 kB gzip, CSS 35,32 kB. [HTTP estático](qa/preview-v023-http.json) confirma bundles novos byte a byte e marcador 0.2.3. Servidor 4179 não reiniciado; motor 0.2.0 preservado, três sessões reportadas.

`cua.getState()` ainda retorna “Local browser use is disabled in Work settings”. Sem captura nova ou teste real de pintura/fluidez. Não declarar aceite visual; [QA 0.2.3](qa/preview-v023.md).

## 23/10/2026 — Fundação TCG 0.3.0, WB-D10/11

**Pedido explícito:** usuário quer TCG com edições temáticas, possibilidade de mecânicas inéditas, símbolo de edição e três raridades. As 80 atuais compõem a primeira edição. Visão registrada como aceita; proporção/classificação/ícone são aplicação inicial proposta, sem aprovação presumida.

Criados src/catalog/types.ts/catalogue.ts e src/data/colecao.json: VES — O Coração de Véspera, 80 impressões numeradas, 40 C/28 I/12 R com notas individuais. Identidades de impressão e de regras separadas para futura reimpressão, validadas com fixture. [Classificação das 80](design/classificacao-VES.md) e [WB-003](specs/WB-003-edicoes-e-raridades.md) documentam critérios, compatibilidade e requisitos para novas mecânicas. Raridade não muda atributos nem habilita cartas. Sem limite novo por raridade, boosters ou regra física alterada.

Frontend src/web/cards.tsx/collection.tsx/collection.css e integração em main.tsx/style.css: CardFace com novo selo SVG de coração mecânico, cores por raridade e identificação textual/número na consulta. Camada sobre as frentes aprovadas, sem rasterizar/regravar originais. Nova tela Coleção apresenta as 80, filtros por edição/raridade, busca sem acento, detalhe e composição dos seis decks. Clique/teclado/foco modal e hover flutuante preservados em testes. Lista dos seis não significa seis decks habilitados para jogar.

**Verificado:** [71/71 testes](qa/tcg-v030-tests.json), 39 motor/mapeamento + 24 UI/posicionamento + 8 catálogo. Todos os seis decks têm 40 cópias e as três raridades: Queimada 24/12/4, Pira 23/12/5, Vapor 27/11/2, Decomposição 23/15/2, Estações 29/7/4, Ilusão 22/12/6 (C/I/R). Build/typecheck aprovados, JS 321,44 kB/93,70 kB gzip, CSS 42,43 kB. [HTTP estático e hashes](qa/tcg-v030-http.json): bundles novos iguais byte a byte ao dist e 80 PNGs com os mesmos SHA-256 do manifesto de origem. Snapshots de regras/listas mantêm hashes originais. Servidor 4179 não reiniciado, motor 0.2.0, três sessões reportadas.

**Limites:** browser desativado confirmado novamente por cua.getState; sem screenshot novo, revisão visual ou medição de fluidez. Mistura de raridades e testes não validam equilíbrio ou força relativa das cartas. Catálogo tem 80, duelos continuam com 49 nomes/Pira e Queimada. Montagem livre, posse/obtenção, trocas, boosters, formatos/rotação e segunda edição não implementados. [QA completo](qa/tcg-v030.md). Rastreabilidade visual/referências em direcao-arte.md/WB-003; recomendação do agente não convertida em aprovação humana.

Esclarecimento posterior solicitado pelo usuário sobre os critérios: classificação manual por função/impacto/recorrência/versatilidade, com alvo editorial 40/28/12; sem modelo quantitativo ou win rate por raridade. Comparação nos dados identifica justificativa fraca para Ancião da Travessia (rara, 6, 4/6 Guardião) frente a Guardião do Viaduto (comum, 5, 3/6 Guardião). Candidato documentado em design/classificacao-VES.md para revisão de design; nenhuma classificação/efeito foi alterada nesta resposta explicativa. WB-10 permanece em revisão.

## 23/10/2026 — Decks personalizados 0.4.0, WB-D12

Usuário pediu gerenciamento para criar e jogar com seus decks. Implementados em src/web/deck-manager.tsx/deck-storage.ts/deck-manager.css/main.tsx: criar/editar/renomear/copiar modelos/duplicar/excluir, lista e cópias, filtros, texto legível/atributos, curva/raridades, rascunhos, avisos de mudanças não salvas, backup JSON e seleção no lobby ou início direto. Persistência local por origem/navegador, erro de leitura/escrita sem sobrescrita automática, revisão de melhor esforço e importação com IDs novos. Não é conta/coleção possuída/sincronização.

engine/decks.ts centraliza lista habilitada e validação 40 cartas/3 cópias por identidade, com alias de reimpressão testado. Apenas 49 cartas suportadas, sem quota de raridade/tipo/escola. Config.customDecks guarda snapshot independente, servidor revalida antes de criar mesa. Motor passa a wb-0.4.0/rules-0.3-custom-decks com hashes de regras/listas intactos. Replays legados 0.2 com presets/hashes correspondentes mantêm compatibilidade; listas personalizadas exigem versão nova. Partidas existentes não são migradas.

**Nova instância em http://127.0.0.1:4180**, build dist-v04 e sessão exec 68538. 4179/dist e 4178 foram preservados. Default/atalho/API de QA atualizados para 4180. Biblioteca de decks é localStorage dessa origem; partidas ainda são memória do servidor.

**97 testes aprovados**: 39 motor/mapeamento, 30 UI, 8 catálogo, 14 montagem/partida e 6 persistência. [JSON](qa/decks-v040-tests.json). Build/typecheck aprovados (JS 337,43 kB/97,95 kB gzip, CSS 49,92 kB). [HTTP personalizado](qa/decks-v040-http-custom.json): 131 requisições, 27 turnos/121 ações, fim de partida e replay com View idêntica; listas inválidas recusadas e privacidade preservada. [Preset](qa/decks-v040-http-preset.json): 62 requisições, 11 turnos/53 ações, fluxo completo/atomicidade/autorização. [Legado](qa/decks-v040-legacy.json): mesa isolada nova de QA na 4179, 53 requisições/50 ações/10 turnos, View reconstruída e replay iguais. Nenhuma mesa/token do usuário acessado.

[Estáticos](qa/decks-v040-static.json): builds 0.4 em 4180 e 0.3 em 4179 servidos com 200 e igualdade de bytes; 80 imagens originais e cópias do novo build mantêm SHA-256. Browser segue desativado em cua.getState: sem screenshot/inspeção manual de layout ou seletor de arquivos, sem medição de fluidez ou validação estratégica dos novos decks. [QA completo](qa/decks-v040.md). Implementação funcional entregue para uso; aceite visual e playtest continuam pendentes.

## 23/10/2026 — Santuário A e Escola/Presença 0.5.0, WB-D14/15

Usuário escolheu A, pediu fidelidade e qualidade semelhante nas telas internas. Home usa a própria prancha aprovada como cenário, com quatro destinos acessíveis nas placas e deck ativo dinâmico. Jogar abre painel próprio, sem formulário permanente/scroll duplo. Novos ambientes de bancada e arquivo gerados por imagegen integrada, prompts e assets em arte/santuario-producao-v1; CSS comum em src/web/sanctuary.css. Frentes das 80 preservadas e SHA da home idêntico à prancha. Decks, coleção e guia recebem os materiais do santuário; mesa de batalha ainda precisa evoluir artisticamente.

Escola/Presença refinada expressamente pelo usuário: fontes e conjurações incrementam +1 por escola, inclusive ao rejogar mesma carta; não impor contagem única por UID. Contrato [WB-005](specs/WB-005-escola-e-presenca.md). Nova variante escolas-v1, versão 0.5.0; requisito antes do avanço, Escola permanente e Presença dinâmica separadas no motor e na UI. Fontes mantêm energia/duração/Cinzas da base; avançar escola não gera energia. Condição Effect.presence_min consulta campo na resolução; testada com fixture, sem publicar carta nova ou reescrever as 80. Prenúncio avança Escola pública sem revelar nome/face, consequência documentada para playtest. Bot heurístico pontua desbloqueios, sem planejamento avançado de loops.

Nova instância **4181**, build dist-v05, sessão exec 67805; 4180/4179/4178 preservadas. Biblioteca local separada por origem: botão de cópia explícita da 4180 ou backup JSON, sem copiar sessão/token. Ponte limitada a origem/janela/nonce, validação da lista e IDs novos. Browser desta sessão tinha biblioteca 4180 vazia, aviso observado; transferência de lista real existente não executada. Rascunho temporário de Pira usado na inspeção e descartado sem salvar.

Validação final: **118/118 testes**, build/typecheck aprovados, 11 cenários de Escola incluindo oito partidas com conservação/progresso monotônico/replay idêntico. HTTP preset 180 requisições/171 ações/44 turnos; custom 88/78/15, ambos completos, replay consistente e validações/privacidade. JS 342,26 kB/99,19 kB gzip, CSS 58,20/14,24. [QA, relatórios, capturas e hashes](qa/santuario-v050/README.md). Ponto verde da mão corrigido para conjuração legal, não mera possibilidade de sacrifício. Novo duelo retorna à home sem reabrir a sessão anterior ao recarregar.

Inspeção real anterior à interrupção: home sem scroll em 1366×768 e 1920×900; preparação 694/694 em 1366×768, editor 40 cartas/aviso de rascunho, coleção 80 cartas. Ao retomar após o fim da sessão, navegador voltou a responder desativado nas configurações do Work. Não concluir 1920×1080, reset do viewport ou mesa com dois contadores em movimento sem acesso. Documentação atualizada na retomada; implementação funcional entregue para playtest, não balanceamento/aceite visual final. Habilidades fortes de Presença e demais cartas continuam próximas tarefas, não promessas cumpridas por testes.

## 23/10/2026 — Três direções da batalha, WB-D16/WB-14

Pedido explícito de estudos enquanto o usuário faz playtest. Produzidas três pranchas originais com imagegen integrada e mesmo briefing de duelo: A/Mesa do Pulso, B/Arena do Coração, C/Atlas do Conclave. Arquivos e prompts em arte/direcoes/batalha-*/; [documentação comparativa](arte/direcoes/batalha-propostas.md) inclui paletas, composição, UI, personagens/cenário, feedback/VFX, custos, riscos, escalas propostas e QA futuro. A recomendada, não aceita automaticamente.

Referências internas: home A, frentes originais Vigia/Catadora e captura histórica do usuário apenas para zonas; consultado padrão de composição em camadas no catálogo. Pranchas inspecionadas diretamente e limitações documentadas: redesenhos de faces/ícones, fontes fictícias, divergências de contadores e apresentação de energia em B. Não importar esses elementos gerados como assets/estado legal; manter frentes/dados canônicos na implementação escolhida. Nenhuma frente alterada.

Nova galeria estática 4181/estudos/batalha-direcoes.html, com três botões e imagem integral, copiada de src/public/estudos para dist-v05/estudos sem rebuild/reinício. HTML e três PNGs retornam 200. Sem alterações de regras, UI em execução ou acesso à sessão do usuário. Não repetir testes de motor para estudo puramente visual. Galeria sem inspeção em browser/movimento nesta rodada; capturas não alegadas. Próximo: usuário escolher A/B/C ou combinação e então produzir assets/componentes reais, com validação dos alvos desktop e input. As pendências de playtest/regra anteriores seguem vigentes.

## 23/10/2026 — Atlas do Conclave, WB-D17/WB-15

Usuário escolheu C explicitamente e pediu máxima fidelidade. Produzidos cenário limpo a partir da prancha e dois medalhões transparentes, via imagegen integrada; [assets/prompts](arte/atlas-producao-v1/prompts.md). Cenário estático preserva proporção integral; HUD/cartas/recursos/ações são componentes reais. src/web/atlas.css, atlas-icons.tsx e atlas.ts, integração em main.tsx/motion.ts: quatro fileiras, pergaminhos laterais, Vida/Energia e Escola/Presença separados, vagas restantes, mão recolhida/expandida, mira curva por atualização direta do SVG e pulso de recursos confirmados. Frentes das 80 preservadas.

UI Atlas 0.5.1 disponível em **http://127.0.0.1:4181/**, motor 0.5.0 e duas sessões reportadas pelo health mantidos. Nenhum reinício ou ação sobre mesas humanas. Vite mantém bundles antigos em dist-v05; reload carrega UI nova sem exigir novo duelo. Prévia somente visual em /atlas-preview.html, com ?cheio=1 para lotação, sem API/escrita de token/decks. Fixture de composição não conserva deck e não prova partida legal; ações exibem aviso. [WB-006](specs/WB-006-atlas-do-conclave.md).

Build/typecheck aprovados, **120/120 testes**, incluindo isolamento da prévia e estrutura de vagas/HUD; regressão da mira verifica curva e destino. JS principal 345,91 kB/100,49 gzip, CSS 75,13/18,21. HTML, bundles e assets atuais HTTP 200 com igualdade de bytes; bundle antigo ainda disponível. [QA e relatórios](qa/atlas-v051/README.md).

**Pendência concreta:** navegador segue retornando “Local browser use is disabled in Work settings”, inclusive após retomada. Sem screenshot real da UI Atlas, comparação pintada com C, drag real ou FPS medido. Usuário perguntou como reativar; consultada skill openai-docs e documentação oficial de configurações/browser/comandos. Orientado codex://settings/browser-use ou Configurações > Browser, habilitar navegador integrado e revisar permissão de navegação de localhost. Causa da desativação recorrente não identificada; não atribuir a ação do usuário ou bug confirmado. Aguardando acesso para validar em aba isolada, sem tocar a mesa em teste.

Usuário enviou depois captura mostrando Navegador ativado (toggle azul). Rechecagem de cua.getState ainda informou bloqueio. Configuração visual correta, acesso efetivo divergente; não continuar pedindo para habilitar a mesma opção como se estivesse desligada. Causa não diagnosticada; revisão do Atlas continua pendente, sem mexer no sandbox ou apagar dados do navegador.

## 23/10/2026 — Navegador recuperado e inspeção do Atlas

Usuário fechou/reabriu o aplicativo e pediu nova validação. cua.getState voltou a listar navegador integrado. 4181 respondeu conexão recusada, portas antigas sem listener; iniciado npm start na 4181, exec 27422. Health confirmado com motor 0.5.0/zero sessões. Partidas em memória do processo anterior já estavam indisponíveis; nenhuma sessão ou biblioteca local foi apagada pelo agente.

Inspecionada a prévia isolada em 1366×768, 1920×900 e 1920×1080: scrollWidth/Height iguais ao viewport, quadro integral. Campo cheio Full HD com 12 monstros, oito fontes por lado/oito cartas na mão/rituais lotados; mão abre sobre a mesa. Capturas reais em qa/atlas-v051. Corrigidos em atlas.css badges sobre atributos, pilhas desalinhadas e seleção acidental de texto do campo. Textos da inspeção/ajuda/histórico continuam selecionáveis. Build/typecheck aprovados; JS 345,91 kB/100,49 gzip, CSS 75,31/18,21. Estáticos finais: nove endpoints 200 e bytes iguais ao dist; 120 testes anteriores preservados como regressão funcional, sem simulação redundante por ajuste CSS.

Hover do Guia com classe following-pointer, sem pinned, em dois pontos: ponteiro +10/+25 px move prévia +10/+25; dimensão 620×449,406 px. Drag Catadora→Bastião confirmou aviso de ação na fixture, sem API ou resolução real. Não houve vídeo/frame a frame da flecha ou medição de FPS. Última checagem adicional de fechamento/lotação menor foi interrompida por timeout da conexão da aba, sem declarar aprovação. Viewport restaurado ao padrão. [QA e capturas](qa/atlas-v051/README.md).

Próximo recorte de revisão: playtest humano do Atlas e fluxo completo de input/decisões/gatilhos, cancelamento/retorno de drag, movimento reduzido e desempenho. Comparação visual inicial agora executada, sem equivaler a aceite artístico humano. Regras de Escola/Presença continuam em teste de ritmo/balanceamento; nenhuma carta ou efeito foi alterado nesta revisão.

## 23/10/2026 — Molduras desobstruídas, WB-D18

Usuário apontou retângulos de fundo sobre a moldura direita. Causa: fundos bege translúcidos/bordas dos contêineres .ritual-zone e .source-well duplicavam o pergaminho já pintado e cobriam ouro/cantos. atlas.css remove essas camadas, mantém geometria/alvos e desloca títulos para dentro. Destinos válidos realçam rótulos, sem preencher novamente o contêiner retangular; slots/cartas mantêm seu feedback. Faixa de fontes recebeu recuo direito de 8 px para não cobrir a borda.

Build/typecheck aprovados, CSS 75,65 kB/18,25 gzip; motor e servidor 4181 mantidos, sem ação sobre mesas humanas. Inspeção real da prévia em 1280×720, normal/cheia: seis painéis com fundo/borda transparentes e sombra none; quatro áreas de rituais com scrollWidth=clientWidth e scrollHeight=clientHeight. Capturas [normal](qa/atlas-v051/molduras-corrigidas.png) e [cheia](qa/atlas-v051/molduras-campo-cheio.png), medidas em molduras-verificacao.json e estáticos em molduras-http.json. Drop ativo foi revisado em CSS, sem afirmar execução de conjuração/arrasto válido nesta rodada. Sem testes novos para correção somente visual; 120 testes anteriores não foram reexecutados. Demais pendências de input/decisões/desempenho continuam.


## 23/10/2026 — VES completa, WB-D20 / WB-05

Pedido explícito para fechar a primeira edição. Entrega 0.6.0 em **http://127.0.0.1:4182/**, build dist-v06 e servidor exec 64403, sem reiniciar a 4181. [WB-007](specs/WB-007-primeira-edicao.md), [QA](qa/ves-v060/README.md), [auditoria das 80](qa/ves-v060/audit-cards.md).

Motor: sete operações completadas (retorno/retorno de encantamento, topo, inspeção, dissipação, extensão e bônus), desconto de Magia, reserva explícita de energia, cura “até” com quantidade, cancelamento de ataque por saída da zona e conhecimento privado limitado ao Véu atual. 80 IDs/seis listas liberados no gerenciador/lobby/API. Bot pontua apenas opções/informação autorizadas, continua heurístico. Escolas/rejogo e dados/atributos/textos/raridades físicos preservados. Motor/decks anteriores congelados em src/engine/legacy para replays 0.2/0.4/0.5.

**Validação:** 309/309 testes; 80 cenários individuais de conjuração/comportamento + 80 de fonte/custo/requisito/atomicidade, condições negativas e interações. Matriz de 252 duelos (21 pares incluindo espelhos × três variantes × duas seeds × dois primeiros jogadores), todos terminados com replay idêntico, conservação/identidades/vagas/energia/Escola verificadas a cada ação. Máximo 65 turnos; 74/80 nomes conjurados pelo bot, seis restantes cobertos em cenários dirigidos. HTTP dos seis decks: 622 requisições, presets/listas personalizadas, privacidade/atomicidade/replay. Fumaças adicionais 111/164 requisições. Build/typecheck aprovados, JS 347,36 kB/100,76 gzip e CSS 75,65/18,25.

**Browser real:** seis modelos/oponentes em 1366×768 e 1920×1080; editor 80/80 e Ilusão 40/40 legal. Partida Vapor × Ilusão iniciada pela UI; fontes, turnos do bot, suporte Leitora e topo/fundo exercitados legalmente no turno 7. Rascunho do editor descartado sem salvar; viewport restaurado. Descobertos/corrigidos +NaN nos recursos e ações de carta substituídas por hover enquanto selecionada; regressões acrescidas. Houve cliques instáveis no leque em movimento durante a automação; caminho por teclado foi exercitado. Não alegar revisão completa de drag/FPS ou aceite humano.

**Integridade:** JSONs de cartas/baralhos/identidade iguais à base e 80 frentes originais iguais no public/build/HTTP. 4181 confirmada no motor 0.5/zero sessões; recebeu só ponte estática de biblioteca para 4182, sem sessão/token. Transferência de biblioteca real não foi executada; fluxo validado em DOM. Servidor continua com mesas em memória.

**Incidente de relatórios:** scripts HTTP antigos sobrescreveram dois JSONs de qa/santuario-v050 com resultados 0.6; novos destinos corrigidos para qa/ves-v060 e evidência histórica sinalizada. JSONs 0.5 originais não recuperados. Nenhum motor ou estado de partida foi alterado por isso.

WB-05 concluída funcionalmente. WB-04 mantém playtest/equilíbrio humano; UI/movimento/performance e aceite artístico pendentes não foram encerrados por esses testes. Próximo passo é jogar os seis estilos na edição completa e registrar ajustes por carta/lista/versão. Novas cartas de Presença, campanha, PvP e demais propostas do roadmap continuam outros recortes.


## 23/10/2026 — Menus opacos, WB-D21 / WB-17

Usuário rejeitou transparência no fundo dos menus. style.css/sanctuary.css/atlas.css passam superfícies de preparação, decks, coleção, guia e inspeção para cores/gradientes opacos, com overlays sólidos sem blur; mantidas molduras de latão e identidade Santuário/Atlas. Build/typecheck aprovados, CSS 75,40 kB/18,17 gzip. Browser real: preparação/decks/coleção/guia em 1920×1080, guia em 1366×768; screenshots e estilos computados em [qa/menus-opacos](qa/menus-opacos/README.md).

4182 atualizada só por build estático, sem reiniciar servidor ou manipular mesas/decks. Viewport restaurado. 309 regressões funcionais anteriores não repetidas por ajuste CSS. Implementação entregue para avaliação humana; preferência persistida em AGENTS/direção de arte/decisões. Próximo é parecer sobre os painéis sólidos, sem retomar vidro/transparência por iniciativa própria.

## 24/10/2026 — Polimento e jogar com amigos, WB-D22

| ID | Entrega | Estado | Critério / evidência |
| --- | --- | --- | --- |
| WB-18 | Fechamento técnico do polimento da mesa | concluida tecnicamente; parecer humano separado | WB-008: destinos por assento/soltura, cancelamento por perda de foco/aba, teclado e foco sem rolagem da arte, movimento reduzido, reset de animações na revanche. Percurso legal de arrasto/reposicionamento/ataque/cancelamento/decisão privada/concessão/revanche e layouts 1280/1366/1920; [QA e método](qa/amigos-v070/README.md). |
| WB-19 | Persistência, salas por convite e acesso LAN/internet | concluida para piloto | SQLite/WAL com snapshots/recibos, dois assentos secretos, variante/listas validadas, atualização 1s, reconexão, concessão/revanche. HTTP isolado com reinício real; LAN↔HTTPS testado. Túnel temporário ativo nesta entrega, sem hospedagem permanente prometida. |

**Autorização:** usuário pediu fechar polimento e implementar jogar com amigos; confirmou LAN e internet. Nova versão 0.7.0 em 4183/dist-v07, versões anteriores preservadas. Código em server/rooms.ts, server/index.ts, web/main.tsx/network.ts/friends.css/interaction.ts/motion.ts/sanctuary.tsx e diagnóstico opt-in qa-probe.ts/qa-layout.html. Engine 0.7 acrescenta concessão reproduzível; replay VES 0.6 conserva regras e metadado. Não mudou dados das cartas, listas canônicas, Escola/rejogo ou frentes.

**Validação:** build/typecheck aprovados; 330 cenários distintos aprovados (329 na regressão, 44 na checagem final de UI/movimento, com sobreposição e um caso novo). Resumo agregado em qa/amigos-v070/validacao-resumo.json. HTTP isolado: 18 verificações/26 pedidos, com criação/entrada concorrente/assentos/repetição/revisão antiga/replay e reinício. LAN↔HTTPS: oito pedidos bem-sucedidos; 80 frentes com hashes iguais entre public/dist-v06/dist-v07. Browser: dois clientes do mesmo computador, sacrifício, conjuração por arrasto, movimento, ataque inválido e válido (15→14), decisão privada de topo por teclado (nome só no convidado), reload dos dois assentos, concessão e revanche. Reinício apenas do servidor 4183 criado pelo agente conservou salas.

**Achados corrigidos no QA:** foco de ações deslocava todo o DOM em relação à arte; overflow clip e preventScroll mantêm scroll zero. Soltura podia usar destino do último movimento; agora consulta ponto final. Perda de foco/aba cancela arrasto. Revanche gerava cura falsa por reaproveitar memória de animações; identidade de sala/rodada reinicia o baseline. Tests intermediários que falharam foram corrigidos (fixture de fonte que expira na base e prefixo de versão do replay legado); relatórios finais são identificados no QA.

**Desempenho/visual:** alvo externo IAB ficou 1280×720 apesar da API de override; layouts 1366×768/1920×900/1920×1080 validados com frames de dimensões reais e screenshots de página inteira, sem scroll dentro da mesa. Amostra móvel de 180 rAF em 1280×720 próxima de 16,67ms médio/16,8ms p95, animações e atualização remota presentes; sem benchmark universal de GPU ou latência. Fonte/método/capturas em QA.

**Operação:** servidor 4183 ligado na LAN; HTTPS temporário `https://pretty-packet-fleece-thermal.trycloudflare.com/`, túnel cloudflared oficial portátil 2026.10.3 com SHA verificado. Launcher Iniciar-Internet.ps1 executado reutilizando servidor existente; bootstrap sem servidor não exercitado pelo launcher, embora servidor isolado tenha sido iniciado nos testes. Nenhum serviço/firewall/roteador alterado. O link depende dos processos/PC ligados e muda após reiniciar túnel. Sessões antigas em memória não são importadas; decks por backup JSON. Não apagar saves/rooms-v1.sqlite e WAL.

**Pendências/próximo passo:** playtest humano dos seis decks e da UI final, experimentar com amigo em outro dispositivo/rede. Para uso contínuo na internet, escolher hospedagem/domínio estável e recuperação de acesso; piloto atual não valida escala pública/contas. WB-04 continua aberto por equilíbrio/diversão. Campanha, desafios, raridades e demais propostas seguem separados.
