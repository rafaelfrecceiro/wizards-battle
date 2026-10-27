# Wizards Battle — estudo de evolução

23/10/2026 · Estudo solicitado pelo usuário. **Prioridade aceita em WB-D19: equilíbrio entre solo e duelos com amigos. A ordem detalhada e as funcionalidades abaixo continuam propostas, exceto o fechamento de VES autorizado posteriormente em WB-D20.** Execução e estado de tarefas continuam exclusivamente em [progress.md](progress.md).

**Atualização WB-D20:** conteúdo funcional de VES entregue na 0.6.0/4182: 80 cartas auditadas/habilitadas e seis decks, [QA](qa/ves-v060/README.md). O ponto de partida de 49 cartas abaixo é o retrato histórico anterior à implementação. M2 avançou na cobertura funcional; identidade percebida dos decks, raridades e equilíbrio humano ainda exigem playtest. Persistência, desafios e salas não foram incluídos automaticamente nessa entrega.

**WB-D22 / 24-10-2026:** M1/M4 avançaram com polimento técnico, persistência/reconexão, salas por convite/concessão/revanche e acesso LAN/HTTPS temporário na 0.7.0. [QA](qa/amigos-v070/README.md). Não equivale a hospedagem permanente, playtest humano de equilíbrio ou aprovação das demais propostas.

## Norte proposto

Fazer cada duelo oferecer uma decisão interessante, cada deck uma forma reconhecível de jogar e cada nova sessão um motivo para experimentar algo. Crescimento tem três sentidos: profundidade do jogo, vontade de voltar e capacidade de receber jogadores/conteúdo com confiança.

A identidade candidata já está no núcleo: escolher entre conjurar uma carta e sacrificá-la como fonte; administrar energia temporária e Cinzas; avançar Escola permanentemente; sustentar Presença vulnerável no campo; disputar frente/retaguarda e antecipar Prenúncios. A evolução deve explorar essas relações antes de acrescentar recursos e subsistemas independentes.

## Ponto de partida e confiança

**FATOS OBSERVADOS nesta rodada por leitura de código/dados: pontos abaixo não são um novo playtest.**

| Base real | Evidência | Consequência para o planejamento |
| --- | --- | --- |
| Catálogo com 80 cartas; 49 habilitadas para duelos e montagem livre | [cartas.json](src/data/cartas.json), [decks.ts](src/engine/decks.ts), [baralhos.json](src/data/baralhos.json) | Há 31 cartas existentes a auditar/habilitar antes de exigir uma segunda edição |
| Seis listas preservadas; apenas Pira e Queimada habilitadas como modelos/oponentes | `starterDecks`, `supportedCards` e `/api/new` em [server/index.ts](src/server/index.ts) | Mais variedade depende de regras, escolhas, feedback e bot; liberar IDs não basta |
| Escola avança por fontes e conjurações repetidas; Presença varia com o campo | [WB-005](specs/WB-005-escola-e-presenca.md), `advanceSchool`, `presence`, `schoolRequirement` em [engine.ts](src/engine/engine.ts) | Rejogar e manter o campo podem sustentar estratégias distintas; ainda precisam de validação humana |
| Condição de efeito `presence_min` existe, testada com fixture; as 80 cartas não foram redesenhadas para ela | [schools.test.ts](src/tests/schools.test.ts), WB-005 | Há base para um pequeno experimento de Presença, sem justificativa para reescrever a edição inteira |
| Bot escolhe por pontuação heurística de opções legais e recebe somente `View` | [bot.ts](src/engine/bot.ts), `options`/`choiceScore` em engine.ts | Dificuldade e identidade estratégica precisam evoluir; não há planejador avançado de combos |
| Mesas ficam em `Map` na memória; token no navegador não recupera processo encerrado | [server/index.ts](src/server/index.ts), [main.tsx](src/web/main.tsx) | Persistência de partidas é uma melhoria concreta para solo e pré-requisito de confiança para rede |
| Decks usam armazenamento local por origem e backup JSON | [deck-storage.ts](src/web/deck-storage.ts), [WB-004](specs/WB-004-gerenciamento-decks.md) | Coleção visual não equivale a posse; conta, aquisição e sincronização são decisões futuras |
| Há histórico público e exportação de replay após o término | `/api/replay` em server/index.ts e main.tsx | Um visualizador de replay pode aproveitar a base, mas ainda exige interface e política de informação |

**EVIDÊNCIA HISTÓRICA:** interface Atlas 0.5.1 sobre motor 0.5.0, 120 testes registrados e inspeções de composição em três resoluções. A correção WB-D18 foi inspecionada depois. Fluxo completo de decisões/input, desempenho e aceite humano continuam com pendências em [QA Atlas](qa/atlas-v051/README.md) e progress.md. Esses testes não foram reexecutados neste estudo e não comprovam diversão ou equilíbrio.

**INFERÊNCIA:** o maior ganho próximo tende a vir de ampliar decisões e oponentes usando Véspera, enquanto se elimina fricção e perda de continuidade. A preferência de produto foi explicitada em WB-D19: equilíbrio entre solo e amigos. Não há dados de retenção ou tamanho de público suficientes para estimar crescimento de audiência.

## Três caminhos de produto

| Caminho | Promessa ao jogador | Ganhos | Custos e riscos |
| --- | --- | --- | --- |
| A — Duelista e construtor de decks | Criar uma estratégia própria e confrontar amigos | Valoriza montagem, leitura do rival, testes de listas e revanche | Salas, reconexão, persistência, sincronização e balanceamento humano; ranking requer população |
| B — Jornada solo em Véspera | Conhecer rivais, vencer desafios e desenvolver combinações | Funciona sem outros jogadores; permite encontros autorais, narrativa e progressão | Produção recorrente de encontros, bot e saves; bônus permanentes exigem regras próprias do modo |
| C — Base comum com solo e duelos por convite | Experimentar sozinho e levar o deck para jogar com amigos | Reaproveita cartas, tutorial, editor e regras; oferece duas razões de retorno | Precisa de sequência disciplinada para não construir dois produtos completos ao mesmo tempo |

**Escolha do usuário, WB-D19:** “Equilíbrio entre solo e duelos com amigos”. Isso orienta o caminho C. A escolha define prioridade de produto; não aprova automaticamente todas as funcionalidades ou a sequência proposta.

**Sequência recomendada para esse equilíbrio:** consolidar a base; oferecer um pequeno ganho solo com rivais/desafios; entregar sala por convite e revanche; aprofundar o solo e as ferramentas sociais conforme playtest. A primeira sala não precisa esperar campanha, todas as 80 cartas ou seis decks completos: pode começar com o conjunto já validado. Compartilhar montagem de decks, regras, clareza e persistência dá valor aos dois lados. Equilíbrio significa manter ambos úteis desde cedo, sem exigir a mesma quantidade de funcionalidades em cada entrega.

**Ciclo de experiência proposto:** descobrir uma combinação no solo → ajustar e compartilhar o deck → testar com um amigo → voltar ao solo para preparar outra estratégia. Campanha longa, ranqueada e economia continuam posteriores a evidências de uso.

## Marcos propostos

São resultados a validar, sem calendário artificial ou versão prometida. O esforço é relativo ao projeto atual, não estimativa de dias. As etapas podem sobrepor pequenos ajustes; não exigem polimento visual perfeito para experimentar uma mecânica.

| Marco | Resultado percebido pelo jogador | Escopo candidato | Dependência / esforço | Condição proposta para avançar |
| --- | --- | --- | --- | --- |
| M1 — Duelo claro e confiável | “Entendo o que aconteceu e consigo executar minha intenção” | Fechar input/decisões do Atlas; ajuda contextual; feedback audiovisual legível; explicação dos recursos da mesa; recuperação de partida solo | Base atual / médio | Partidas humanas completas, decisões e cancelamentos exercitados; recuperação após reinício em teste isolado; nenhum bloqueador conhecido de ação ou informação |
| M2 — Mais formas de vencer | “Mudar meu deck muda minhas decisões” | Auditar Decomposição; liberar Maré em lotes; completar 80/seis decks com cobertura individual; revisar papéis/raridades | M1 mínimo + capacidades por lote / médio a alto | Todas as cartas liberadas têm texto/efeito/timing consistentes, escolha humana, bot, replay e interações verificadas; estilos distinguíveis em playtest |
| M3 — Domínio e desafios | “Aprendi uma jogada e quero experimentar outra” | Tutorial em situações jogáveis; rivais com estilos; pacote curto de desafios; pós-partida útil; ferramentas de deck | M1; cada desafio usa pool já validado de M2 / médio | Jogador novo resolve situações sem condução constante; desafios admitem escolhas e repetição voluntária; dificuldade vem de decisões explicáveis |
| M4 — Duelo com amigos | “Posso convidar alguém e terminar a partida com confiança” | Sala privada por link/código, assentos separados, reconexão, ações ordenadas, revanche; publicação controlada | M1 + persistência/autorização de assentos; não depende de completar M2/M3 / alto | Dois navegadores/dispositivos concluem duelo; desconexão e repetição de requisição não duplicam ação; segredos e versões de regras preservados |
| M5 — Motivos para voltar | “Tenho um objetivo e novidades para explorar” | Escolher um piloto: jornada curta, desafios recorrentes ou mini-liga privada; perfil e conquistas conforme necessidade | M3/M4 conforme caminho / alto e recorrente | Piloto completo e recuperável; retorno voluntário observado; capacidade de produzir conteúdo sem quebrar duelos comuns |
| M6 — TCG sustentável | “Uma edição nova abre possibilidades e conversa com minha coleção” | Segunda edição com tema escolhido, sinergias entre edições, pipeline de cartas, balanceamento/versionamento; formatos e aquisição se escolhidos | Base VES validada + pipeline de capacidades / alto e contínuo | Lote novo cria decisões identificáveis, possui respostas acessíveis e não exige abandonar toda a base anterior; custo de manutenção conhecido |

### M1: maturidade que ajuda a diversão

- Mostrar claramente por que a carta não pode ser jogada, o que é requisito de Escola e o que depende de Presença. Destacar mudanças confirmadas pelo servidor. A ajuda deve ensinar a decisão, sem sobrecarregar o turno com popups.
- Testar mão, hover, arrasto/clique/teclado, cancelamento, alvos, ordem de gatilhos, campo cheio e movimento reduzido em partidas legais. A fixture visual não substitui esses percursos.
- Adicionar som e efeitos curtos para conjuração, ataque, dano, morte, fonte/Cinzas e Prenúncio. Volume/mute, intensidade e ritmo configuráveis; efeitos que permitam acompanhar a resolução sem alongar cada ação trivial. Preservar Santuário A, Atlas C e frentes aprovadas.
- Persistir mesa/configuração/ações aceitas com versão de regras e retomada explícita. Testar escrita interrompida, reinício, replay e credencial de retomada. Migração/incompatibilidade precisa ser comunicada; não reinterpretar partida antiga sob regra nova.
- Observar clareza e tempo de decisão antes de acelerar animações ou automatizar escolhas. Se a pessoa sabe o que quer fazer e a interface impede, corrigir o fluxo; se não entende a regra, revisar explicação e feedback.

### M2: expansão guiada por decisões

Comparação estática das listas com a união de IDs de Pira/Queimada em 23/10: **Decomposição tem 3 nomes ainda não habilitados; Estações 13; Ilusão 17; Vapor 18.** Há sobreposição entre listas; esses números não somam as 31 restantes e não medem esforço de implementação.

**Candidato de menor escopo:** auditar Raízes sobre Cinzas (VES-008), Guardião do Depósito (VES-075) e Reconstruir os Nomes (VES-076) para liberar Decomposição. Seus dados usam cura condicional por Cinzas, Guardião condicional e recuperação + Vida. Parte das capacidades já aparece no motor; a comparação de IDs não demonstra que todos os casos funcionam. A lista pede auditoria dirigida, não só remoção do bloqueio.

**Candidato de maior novidade:** um lote de Maré com devolução/rejogo, seguido de seleção de compra, duração de fonte e informação. VES-060/Condutora do Refluxo devolve aliado barato; VES-020/Sentinela dos Canais devolve inimigo barato; VES-068/Rota de Escape interrompe ataque ao devolver o defensor. Custos, zonas, estados ao voltar e timing exigem regras e escolhas explícitas.

Um lote vertical pode habilitar só as cartas necessárias a uma experiência representativa, mantendo as demais bloqueadas. Isso permite testar novidade antes de concluir toda a edição. A ordem final de Vapor/Estações/Ilusão deve seguir capacidades compartilhadas e valor no playtest, não apenas quantidade de IDs faltantes.

**Hipóteses a investigar, sem mudar a regra WB-D15:**

- Escola permanente reduz partidas travadas, mas pode tornar requisitos irrelevantes cedo demais. Medir quando requisitos deixam de restringir as opções e se mono/duas/muitas escolas preservam razões distintas de existir.
- Rejogar pode criar combos expressivos, como o usuário deseja. Investigar energia, cartas, ações disponíveis, ganho de Escola, tempo e oportunidade de resposta; não impor contagem única por UID ou teto artificial sem discussão.
- Presença pode criar o dilema “usar agora ou preservar meu campo para um efeito maior”. Experimentar poucas cartas de laboratório com efeito básico útil e bônus condicionado, comparando campo sustentado e campo removido. O exemplo não altera automaticamente os textos de VES.
- Fontes devem manter tensão real: sacrificar uma carta útil agora precisa ter custo percebido, e energia/Cinzas devem permitir viradas sem tornar o resultado inevitável cedo.
- Raras podem ter maior impacto e potencial, conforme WB-D10, mantendo funções competitivas para comuns/incomuns. Revisar pares concretos e respostas; não usar raridade como bônus automático de atributos.

### M3: ensinar, desafiar e apoiar a autoria

**Tutorial candidato:** situações curtas para fonte versus carta, Escola versus Presença, proteger suporte na retaguarda, responder a Guardião, Prenúncio e ordem de gatilhos. Usar cartas liberadas e a mesma legalidade do duelo; ensinar um conceito por situação.

**Rivais candidatos:** agressivo, sustentação, controle e combo de retorno, habilitados conforme o pool. Dificuldades por qualidade das decisões e planejamento, sempre com informação autorizada. Um rival de campanha com bônus especiais precisa anunciá-los como regra do encontro; isso é diferente de bot comum enxergar a mão rival.

**Ferramentas candidatas do construtor:** código compacto para compartilhar listas; modelos com plano de jogo; comparação de duas versões; filtros por função/sinergia; testes contra oponente escolhido; sugestões explicadas como hipóteses. Curva, filtros, duplicação e backup já existem e devem ser refinados conforme fricção observada, sem tratá-los como features ausentes.

**Pós-partida candidato:** resultado, lista utilizada e momentos públicos relevantes. Primeiro uma navegação simples no histórico/replay; depois análise mais sofisticada. Separar “você ficou sem energia” de “a jogada certa era X”: a segunda afirmação exige avaliação que o bot atual não fornece. Perspectiva do replay e momento de revelação devem respeitar sigilo; exportar replay não equivale a visualizador implementado.

### M4: rede em um recorte pequeno

Começar com convite e revanche. A base autoritativa é útil, mas hoje `/api/state` e `/api/action` expõem o assento humano 0, enquanto o assento 1 é do bot. PvP requer credenciais/visões/ações separadas para ambos, ciclo de sala e política de abandono; não é apenas publicar o servidor atual.

Persistência e reconexão devem vir com revisão de estado, deduplicação de comandos e tratamento de cliente desatualizado. A comunicação pode usar polling ou canal persistente conforme necessidade verificada; escolher protocolo não é o principal resultado de produto.

Publicação controlada vem antes de fila aberta. Observador, chat, ranking e torneios públicos acrescentam problemas próprios de sigilo, moderação, população e operação. Um torneio pequeno por convite pode testar desejo de competição antes de investir em matchmaking.

### M5: escolher um piloto de retorno

| Piloto | Experimento pequeno proposto | Por que pode divertir | Risco/custo principal |
| --- | --- | --- | --- |
| Desafios do Conclave | Três encontros autorais com condições claras e objetivos opcionais | Descoberta de soluções, aprendizado e comparação de listas | Puzzle com uma única resposta pode ter pouca repetição; evitar transformar todo duelo em tarefa |
| Jornada de Véspera | Três duelos conectados e uma escolha de recompensa entre encontros, sem grande mapa inicial | Construir uma trajetória, adaptar deck e conhecer o mundo | Saves e recompensas aumentam escopo; bônus da jornada ficam isolados das regras de duelo/PvP |
| Mini-liga de amigos | Convites, listas compartilháveis, resultados e revanche; organização inicialmente simples | Rivalidade, adaptação ao grupo e histórias emergentes | Depende de pessoas disponíveis e rede confiável; não demonstra necessidade de ranking público |

Quantidades acima são limites candidatos de experimento, não conteúdo aprovado ou produzido. Para o equilíbrio escolhido em WB-D19, recomendo um pacote pequeno de Desafios do Conclave e a sala por convite no primeiro ciclo de evolução, em entregas separadas; não expandir a campanha continuamente antes de oferecer o duelo humano. Uma mini-liga pode ser organizada depois que convite/revanche funcionarem, sem depender inicialmente de uma plataforma de torneios.

Progressão pode reconhecer domínio de escolas, experimentação e conquistas, além de cosméticos e novos desafios. Se houver aquisição de cartas, definir separadamente catálogo, propriedade, quantidade de cópias, desbloqueio e acesso competitivo. A montagem livre atual é o ambiente de teste; bloquear cartas mudaria a experiência e o balanceamento das recompensas.

### M6: conteúdo novo com identidade

Cada edição deve ter um tema e conflito próprios, novas estratégias e conexões com Véspera. O tamanho, tema e número de mecânicas dependem de escolha do usuário e do custo demonstrado pelo pipeline. O contrato WB-003 sugere contenção inicial de uma ou duas mecânicas, ainda como proposta.

Fluxo candidato: intenção de design → protótipo de texto/dados → capacidades do motor e escolhas → bot/privacidade/replay → teste contra estratégias existentes → arte no padrão aprovado → lote liberado e acompanhado. Ajustes de regras/texto digital precisam de versões que permitam reproduzir partidas históricas; frentes e PDFs físicos preservados não se tornam automaticamente atualizados.

Booster, trocas, crafting, passe, loja, rotação e ranking ficam como opções futuras. Cada um deve responder a um problema real de experiência e operação. Uma nova edição pode oferecer combinações laterais e contrajogo sem aumentar continuamente a força média.

## Como verificar se ficou mais divertido

**Protocolo proposto, não executado:** usar a mesma versão, registrar listas/primeiro jogador e alternar lados. Começar com uma rodada curta de 6–10 duelos legais, incluindo jogador que já conhece o jogo e, se disponível, alguém novo. O tamanho é triagem qualitativa, insuficiente para homologar equilíbrio. Repetir por hipótese após mudanças, evitando misturar variantes nas conclusões.

| Pergunta | Evidência útil | Decisão que ajuda a tomar |
| --- | --- | --- |
| Há decisões ou espera? | Momentos sem jogada desejada, motivo (regra/interface/energia/Escola/alvo), tempo de turno e pausas de resolução | Ajustar clareza, curva, fontes ou ritmo, conforme a causa |
| O jogador percebe autoria? | Uma decisão de sacrifício, fileira, Prenúncio ou combo que consiga explicar | Investir na interação que gera histórias e reduzir rotinas automáticas |
| Existe chance de responder? | Turno em que o resultado pareceu inevitável, respostas disponíveis e possibilidade de remontar o campo | Rever ameaça/resposta, janela de interação ou condição de bônus |
| Os decks são diferentes? | Plano de vitória e mudanças de decisão descritos pelo jogador; confrontos alternando quem começa | Revisar identidade/curva antes de adicionar mais cartas parecidas |
| A experiência convida ao retorno? | Vontade declarada de revanche, modificação de deck ou tentativa de outro desafio; depois, repetição voluntária real | Escolher entre aprofundar deckbuilding, solo ou social |
| O jogo é confiável? | Ações recusadas corretamente, ausência de travas, retomada e replay; perfis reais de tempo de resposta/renderização | Corrigir base antes de ampliar exposição pública |

Métricas futuras: duração e distribuição dos duelos, começo/fim/abandono com motivo, taxa de primeiro jogador, confrontos por lista, cartas usadas versus apenas sacrificadas, turnos de desbloqueio por Escola e momentos de Presença decisiva. Os dados existentes de bloqueios/casts em `Game.metrics` são um começo; não há coleta analítica completa implementada. Definir metas após observar uma linha de base, segmentando humano/bot/variante e sem tratar popularidade de carta como prova de força.

## Primeiro recorte recomendado para discutir

1. Registrar uma sessão curta da base atual e fechar os problemas que impedem jogar/entender.
2. Auditar as três cartas de Decomposição e propor um lote mínimo de Maré, com bot e escolhas completos para esse lote.
3. Executar um experimento de retorno/rejogo e um de bônus de Presença em laboratório versionado, preservando WB-D15 e o conteúdo publicado.
4. Usar o resultado para dimensionar um primeiro pacote curto de desafios e a sala por convite. Ambos entram cedo na sequência proposta, conforme WB-D19; persistência serve aos dois. Não esperar todas as cartas ou campanha extensa para validar o duelo humano.

Não há necessidade de concluir todos os acabamentos antes do passo 2. Há necessidade de distinguir bug, falta de explicação e problema de regra antes de reagir ao playtest com novas mecânicas.

## Referências e limites do estudo

Catálogo consultado: [MTGA steam-25763111](../../catalogo/jogos/mtga/steam-25763111/analise.md). A recuperação do cliente é parcial; não houve observação de partidas desse jogo nesta rodada, nem inferência de backend a partir do catálogo.

- [Wizards — Play Design Lessons Learned, 2019](https://magic.wizards.com/en/news/feature/play-design-lessons-learned-2019-11-18): discute revisão de cartas/estratégias e falhas nas hipóteses de contrajogo. **Adaptação proposta:** testar ameaças e suas respostas juntas; custo e existência de resposta no catálogo não bastam para demonstrar interação viável.
- [Blizzard — Let’s Get Brewing with Deck Recipes!, 2016](https://hearthstone.blizzard.com/en-us/news/20056279): modelos básicos e temáticos como apoio à montagem. **Adaptação proposta:** planos de jogo e sugestões compreensíveis para os decks de Véspera, preservando liberdade de edição.
- [Riot — The Path of Champions: In-Depth Look, 2021](https://playruneterra.com/en-us/news/game-updates/the-path-of-champions-in-depth-look): encontros PvE e progressão em um modo próprio. [World Adventures, suporte](https://support.riotgames.com/en-us/legends-of-runeterra/gameplay/world-adventures-the-path-of-champions/) descreve aventuras repetíveis com requisitos de conclusão. **Adaptação proposta:** piloto curto e autoral antes de mapa/campanha; não importar a economia ou bônus desses jogos como decisões do projeto.

Referências consultadas na web nesta rodada, com documentos de datas diferentes; servem a princípios específicos, não a uma comparação completa das versões atuais. Não houve execução do jogo, simulação, benchmark, geração de arte ou implementação neste estudo. Não existem estimativas validadas de prazo, custo comercial ou crescimento de público.
