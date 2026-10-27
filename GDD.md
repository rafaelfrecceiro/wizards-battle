# GDD — Wizards Battle

**Edição completa WB-D27 /0.11:** [WB-012](specs/WB-012-terras-completa.md) publica As Terras Despertas com60 cartas, seis decks próprios,30comuns/20incomuns/10raras, total140cartas/12modelos comVES. Ressonância mantém Presença atual; Escola/rejogo, energia acumulada e feedback causal preservados. UI abandona marca de piloto, mostra selo vale/sol/raízes e inicia coleção emTDP/conjunto completo. [Galeria](design/terras-despertas/galeria-edicao-v1.html). Conteúdo funcional publicado, sujeito a ajustes de equilíbrio depois de playtests humanos; sem campanha/economia nova.

**Apresentação WB-D26 /0.10:** [WB-011](specs/WB-011-feedback-causal.md) serializa origem → alvo → impacto → saída, com cartas em movimento, ataques/interrupções, valores e mortes atribuídas à origem real. Histórico e menu Feedback com ritmo/som; bot aguarda. Privacidade/regras autoritativas preservadas,0.9/saves mantidos. Revisão perceptiva real pendente; Atlas C/Santuário A preservados.

**Experimento WB-D25 / 0.9:** [WB-010](specs/WB-010-energia-acumulada.md) adiciona reserva de energia entre turnos, sem teto novo, a Escola + Presença. Selecionada por padrão na preparação 4185; regra original continua disponível. Saldo não gasto permanece, geração soma ao despertar e expiração/destruição de fonte só interrompe produção futura. Duração/geração/custos/sacrifício preservados. Guardiã da Cisterna sem bônus adicional no experimento, com explicação na UI. Ritmo/equilíbrio aguardam teste humano; sem alterar PDFs/carta original ou mesas anteriores.

Consolidado para o recorte WB-001 em 22/10/2026. [Origem física](../../ideias/duelo-de-magos/README.md), [decisões](decisoes.md), [progresso](progress.md).

## Visão

Duelo de cartas no navegador com aplicação automática das regras de O Coração de Véspera. Escolher entre jogar cada carta e transformá-la em fonte temporária; desenvolver presença de escolas, disputar duas fileiras e preparar Prenúncios ocultos. A versão digital também serve para experimentar ajustes do jogo físico.

**Visão ampliada pelo usuário em 23/10/2026, WB-D10:** Wizards Battle deve evoluir como TCG, com edições de temas distintos, cartas comuns/incomuns/raras e novas mecânicas por edição. As 80 cartas atuais pertencem à primeira edição, **VES — O Coração de Véspera**. Cada impressão tem código, número, raridade e símbolo da edição. Preservar a identidade Bestiário em Foco e compatibilidade do jogo ao ampliar a coleção. [Contrato de edições](specs/WB-003-edicoes-e-raridades.md).

Primeira classificação editorial implementada: 40 comuns, 28 incomuns e 12 raras, **proposta inicial sujeita a revisão e playtest**. Raras concentram efeitos marcantes e maior potencial; comuns sustentam curva/respostas e incomuns conectam sinergias. A mistura das raridades nos decks é objetivo de design; não foi aprovada cota obrigatória. A classificação não alterou atributos/custos/efeitos. [Classificação das 80](design/classificacao-VES.md).

## Regras do recorte

**Atualização digital WB-D15 / 0.5.0:** variante `escolas-v1`, padrão da nova instância 4181. Escola é progresso permanente: +1 por escola ao criar fonte ou conjurar/armar carta, inclusive ao jogar novamente a mesma carta. Requisitos de escola são conferidos antes do avanço. Presença segue contando o campo atual (fontes ativas, monstros e encantamentos), caindo com a saída das cartas. Fonte conserva energia/duração/Cinzas da base; Escola não produz energia. Presença poderá condicionar habilidades fortes; infraestrutura entregue sem reescrever os efeitos das 80. [Contrato WB-005](specs/WB-005-escola-e-presenca.md). Os parágrafos históricos de Presença abaixo descrevem a base v0.3, ainda selecionável, não a nova variante.

Dois jogadores, 15 de Vida, decks de 40 cartas e até três cópias por nome. Mão inicial 7, uma troca integral opcional, ambos compram no primeiro turno (base experimental v0.3). Baralho vazio causa perda de 2 de Vida por compra. Limite de mão 8 com descarte escolhido.

Despertar gera energia/decrementa fontes, expira Prenúncios e resolve suportes/encantamentos; compra; principal para sacrificar uma vez, conjurar/armar e reposicionar uma vez; combate com ataques individuais; encerramento resolve limpeza e efeitos. Dano persiste. Máximo três monstros por fileira, três encantamentos e dois Prenúncios.

Presença: fontes ativas, monstros e encantamentos fornecem um ponto por escola; híbridas contam para ambas. Verificar ao conjurar sem gastar. Magias e Prenúncios no Véu não contam. Prenúncios custam 1 para armar, sem presença, e só disparam no turno rival.

Energia neutra, temporária. Essência geração × duração. Base v0.3 gera e decrementa imediatamente no sacrifício. Variante explicitamente experimental conserva marcador nesse instante; gerações extras e atraso de Cinzas não são automaticamente aprovados como design definitivo.

Ímpeto permite atacar ao entrar; Alcance alcança retaguarda; Guardião na frente restringe ataques contra monstros; Emboscada entra atrás e avança sem energia usando a ação de reposicionar. Frente vazia permite atacar mago ou fonte (remove 2 de duração). Combate simultâneo; morte e gatilhos resolvidos com escolhas explícitas. Texto/efeitos e exceções: snapshot em src/data/ e spec WB-001.

## Interface e conteúdo

**WB-D14:** direção A — Santuário do Pulso escolhida. Home ocupa a janela sem formulário longo; Jogar abre preparação. Meus decks, Coleção e Guia são destinos nas placas da imagem aprovada. Ambientes internos de decks/coleção seguem o santuário. [QA e limites](qa/santuario-v050/README.md). Mesa de batalha ainda precisa de revisão artística para alcançar o mesmo padrão.

**WB-D20 / 0.6.0:** escolher Pira, Queimada, Vapor, Decomposição, Estações, Ilusão ou um deck personalizado salvo, a variante e o deck do autômato. Gerenciador permite criar, editar, duplicar, excluir e guardar rascunhos; montagem livre entre as **80 cartas habilitadas**, 40 cartas e máximo de 3 cópias por identidade, sem quota de raridade ou restrição adicional de escolas. Backup JSON e ponte explícita da 0.5 transportam listas. Servidor revalida e registra snapshot independente. [WB-004](specs/WB-004-gerenciamento-decks.md), [WB-007](specs/WB-007-primeira-edicao.md).

Mesa com vida, energia, presença, mão própria, campo, fontes/duração, Cinzas, Encantamentos e Véu. Selecionar carta/ação, escolher alvos e avançar fases. Inspeção ampliada mantém a frente original e explica palavras-chave. Histórico de ações públicas, sem vazar cartas ocultas.

Coleção completa de 80 cartas/seis decks funcional na 0.6.0, com auditoria individual e integração; [evidências e limites](qa/ves-v060/README.md). Artes Bestiário em Foco preservadas; home Santuário A e batalha Atlas C mantidas. Áudio e refinamentos visuais continuam posteriores.

Catálogo digital 0.3.0 apresenta as 80 cartas por edição, com busca, filtro de raridade e consulta da classificação. Símbolo original de coração mecânico representa VES; tons grafite/prata/ouro distinguem comum/incomum/rara, com texto e letra na consulta. Nova camada de metadados mantém as frentes raster preservadas. Catálogo não representa posse do jogador nem libera automaticamente as cartas ainda sem cobertura de motor.

## Tecnologia e validação

Navegador desktop, motor TypeScript independente do DOM e servidor local autoritativo. Estado serializável, configuração/semente/ações para replay. Bot decide com sua visão, sem acesso à mão rival, baralho ordenado ou Prenúncios ocultos. Testar ações inválidas sem mutação, condições/custos/alvos, simultaneidade, gatilhos, privacidade e partidas completas. Automação não comprova diversão ou equilíbrio.

## Depois do primeiro recorte

**Segunda expansão — WB-D23 / 24-10-2026:** usuário escolheu **As Terras Despertas**, caminho de exploração de um território vivo depois de Véspera. [Conceito em elaboração](design/terras-despertas.md). Ressonância por Presença, 60 cartas e lote piloto de 12 são propostas; conteúdo ainda não publicado ou incorporado às regras de duelo.

**Atualização WB-D24 / 0.8.0:** passos 1–3 autorizados e entregues: [auditoria](design/terras-despertas/auditoria-v02.md), Ressonância na resolução e 12 cartas experimentais jogáveis, conjunto explícito VES + TDP, três modelos mistos, bot/replay e salas. [Contrato WB-009](specs/WB-009-terras-piloto.md), [QA e limites](qa/terras-v080/README.md). Só escolas-v1; VES é padrão. Piloto tem 12 cartas, sem definir a expansão completa em 60. Equilíbrio humano ainda não homologado; narrativa/personagens/arte nova seguem refináveis.

**Prioridade de produto WB-D19 / 23-10-2026:** usuário escolheu equilíbrio entre solo e duelos com amigos. Evolução deve atender experimentação/aprendizado solo e confrontos por convite com base compartilhada de regras/decks. O [roadmap](roadmap.md) propõe entregas pequenas para ambos; a ordem detalhada e as novas funcionalidades permanecem em discussão, sem início automático de implementação.

Com a cobertura funcional das 80/seis decks entregue em WB-D20, seguir para playtest humano da edição completa, força estratégica do bot e evolução solo/amigos conforme roadmap. Mecânicas inéditas exigem implementação, testes e política do bot. Aquisição/posse, boosters, trocas, formatos/rotação, ranking, monetização, contas e campanha continuam sem decisões de produto ou implementação. Público definitivo, nome comercial e publicação permanecem abertos.


## Duelo com amigos — WB-D22 / 0.7.0

Modo adicional por convite, na mesma base das 80 cartas: dois jogadores escolhem seus decks, anfitrião define a variante, partida começa quando o convidado entra. Cada pessoa vê seu próprio lado embaixo e apenas sua mão/decisões privadas. Reconexão e reinício do servidor preservam o duelo; concessão explícita e revanche por dois aceites. LAN e internet via HTTPS temporário entregues; sem matchmaking/contas/economia. [WB-008](specs/WB-008-polimento-e-amigos.md), [QA](qa/amigos-v070/README.md). Balanceamento humano continua em teste.
