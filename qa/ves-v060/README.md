# QA — VES completa, 0.6.0

23/10/2026 · WB-D20 / [WB-007](../../specs/WB-007-primeira-edicao.md). **Fechamento funcional entregue:** 80 identidades habilitadas, seis decks como modelos/oponentes, montagem livre e humano × bot. URL: [127.0.0.1:4182](http://127.0.0.1:4182/). Versão do motor `wb-0.6.0/rules-ves-complete/ac500ad45d98/7e65b53aa899`.

## Resultado técnico

- **309/309 testes aprovados**, incluindo 80 cenários individuais de conjuração/comportamento e 80 de fonte/custo/requisito/atomicidade. [Relatório](tests.json), [auditoria por carta](audit-cards.md), [contratos e nomes dos testes](audit-cards.json), [cenários executáveis](../../src/tests/ves-audit.test.ts).
- **252/252 duelos completos**: 21 pares dos seis decks incluindo espelhos × três variantes × duas seeds × dois primeiros jogadores. Conservação e identidade de 40 cartas por lado, zonas, energia e Escola monotônica verificados a cada ação; replay completo idêntico em todos. Máximo 65 turnos individuais. [Relatório reproduzível](simulations.json), comando `npm run simulate:ves`.
- O bot conjurou **74/80 nomes** nessa matriz. VES-008, 015, 029, 050, 061 e 069 não foram conjurados por ele; seus cenários individuais de efeito/fonte/custo passaram. Não confundir habilitação/cobertura dirigida com cobertura de uso natural pelo bot.
- **HTTP dos seis decks:** 622 requisições, seis partidas completas alternando presets e listas personalizadas, replay reconstruído igual à visão final, listas/ações inválidas recusadas, erros atômicos e sigilo verificado. [Relatório](http.json), comando `npx tsx tests/http-ves.ts`. Inspeções de Véu autorizadas podem aparecer somente ao jogador que as fez.
- Fumaça adicional: [preset](http-preset.json), 111 requisições / 102 ações / 24 turnos; [personalizado](http-custom.json), 164 requisições / 155 ações / 35 turnos. Comandos `npm run test:http` e `npm run test:http:decks`, agora gravando nesta pasta.
- `npm run build` / TypeScript aprovados: JS principal 347,36 kB / 100,76 kB gzip; CSS 75,65 kB / 18,25 kB gzip. Isso não é medição de FPS/memória.
- [Integridade e HTTP estático](integrity-http.json): JSONs de cartas/baralhos/identidade inalterados; **80 frentes** com SHA-256 original no public, dist-v06 e resposta HTTP; HTML/JS/CSS atuais iguais aos arquivos de build. [Hashes anteriores](baseline-hashes.json).

## Capacidades completadas e correções

Retorno de monstros e encantamentos; reset de dano/bônus e novo avanço de Escola ao rejogar; cancelamento de ataque quando o alvo sai da zona; consulta privada do topo com escolha topo/fundo; inspeção privada do Véu e memória apenas enquanto a carta permanece ali; dissipação com revelação pública para Cinzas; extensão de fonte sem energia imediata; bônus de Força/Ímpeto com expiração; desconto da primeira Magia não cumulativo/mínimo 1; escolha de reserva de energia limitada a 1; escolha de quantidade nas curas com “até”, inclusive zero.

Alvos ocultos não expõem nome/arte nem usam identidade oculta para pontuação. Pacto pode recusar inspeção sem cancelar sua frase independente de dano por Cinzas. Condições, ausência de alvos, custos e funções de suporte mantêm cenários negativos/interações além do caminho positivo.

Durante inspeção real, recursos sem `data-damage` geravam `+NaN`: corrigido e coberto em motion.test.tsx. Clique fixa a carta para que atravessar outra não substitua suas ações; hover sem seleção continua acompanhando o ponteiro. Decisão humana indica “Sua decisão” no painel de turno. Regressões DOM para seleção fixa, topo/fundo e cura zero.

## Navegador real

- Preparação inspecionada em **1366×768 e 1920×1080**: seis modelos e seis oponentes disponíveis. [1366](seis-decks-1366.png), [1920](seis-decks-1920.png), medidas [1366](browser-1366.json)/[1920](browser-1920.json). Em 1366×768 o painel de preparação tem rolagem interna para acessar controles inferiores; a home mantém sua composição sem formulário permanente.
- Partida legal **Vapor × Ilusão**, iniciada pela interface, com manutenção da mão, fontes, Escola/Presença, turnos do bot e Leitora na retaguarda. No turno 7, escolha privada de topo exibiu Faísca de Reserva; escolhido fundo, jogo continuou e comprou Compasso das Correntes. [Captura real da decisão](decisao-topo-partida-real.png). Essa captura precede a troca do rótulo de turno para “Sua decisão”. Não é fixture visual.
- Editor real mostrou **80 encontradas / 80 habilitadas**, seis modelos e Ilusão com 40/40 legal. [Captura](editor-80-ilusao.png). Rascunho descartado sem salvar; biblioteca inicial da nova origem estava vazia. Não foi executada transferência de biblioteca real da 0.5; ponte 4181→4182 validada em DOM com origem/janela/nonce e importação de IDs novos.
- Viewport temporário restaurado. Nova aba entregue na origem 4182, sem usar token ou mesa da 4181. Partida de QA iniciada pelo agente; retorno por Novo duelo removeu somente o token dessa nova origem.

## Compatibilidade e rastreabilidade

4181 foi preservada sem reinício, com motor 0.5.0/zero sessões no health consultado. dist-v05 não foi reconstruído; recebeu apenas nova ponte estática `transferir-decks-v05.html`, que lê biblioteca mediante pedido explícito da 4182. Demais versões e PDFs não alterados.

Motor/decks anteriores congelados em src/engine/legacy/; replays 0.2/0.4/0.5 passam pelo motor antigo, evitando reinterpretar regras corrigidas. Teste de partida 0.5 completa é reconstituído pelo ponto de entrada de replay 0.6. Partidas novas usam versão própria. Servidor continua guardando mesas em memória; persistência de jornada não foi adicionada por este recorte.

Incidente de evidência: dois scripts antigos sobrescreveram `qa/santuario-v050/http-preset.json` e `http-custom.json` com resultados desta 0.6 antes da correção dos destinos. As execuções novas foram copiadas para esta pasta; [QA histórico](../santuario-v050/README.md) sinaliza a substituição. Os JSONs 0.5 originais não foram recuperados; os números históricos documentais não são apresentados como relatórios novos. Nenhum estado de jogo foi perdido por esse incidente.

## Limites e próximo passo

Este fechamento é **funcional**, com auditoria individual e integração automatizada. Não é prova de todas as combinações possíveis, equilíbrio humano, força estratégica do bot, desempenho ou aceite artístico final. A matriz heurística não justifica buff/nerf nem força das raridades. Os textos/atributos/classificação e PDFs físicos foram preservados.

Próximo passo: playtest humano dos seis estilos com a edição completa; registrar problemas por carta/lista/versão e ajustar com evidência. Novos efeitos fortes de Presença exigem design específico: a infraestrutura existente permanece, sem reescrever VES arbitrariamente. PvP, campanha, ranking e novas edições continuam fora desta entrega.

Referências técnicas consultadas: [Vite — build.outDir](https://vite.dev/config/build-options#build-outdir), [TypeScript — Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html). APIs confirmadas também pelo TypeScript e build das dependências locais fixadas no lockfile.
