# Segunda expansão — estudo de conceito

24/10/2026 · Pedido: “vamos elaborar uma segunda expansao pro jogo”.

**Registro da proposta inicial.** No momento da comparação, tema, nome, tamanho, mecânicas e cartas estavam em discussão; a escolha posterior está registrada abaixo. “Segunda expansão” é interpretada aqui como o próximo conjunto depois de VES — O Coração de Véspera, primeira edição de Wizards Battle. Este documento não publica cartas nem altera regras, PDFs ou partidas.

**Atualização WB-D23 / 24-10:** usuário escolheu **As Terras Despertas**. O estudo comparativo abaixo é preservado como origem; a elaboração vigente está em [terras-despertas.md](terras-despertas.md). Tamanho, mecânica e cartas continuam propostas.

## Base e objetivo

Fatos observados na documentação e no código: VES tem 80 cartas habilitadas e seis modelos de deck; a versão 0.7.0 oferece solo e salas humanas. A prioridade WB-D19 é equilibrar solo e duelos com amigos. Escola permanente e Presença atual são recursos diferentes; o motor possui condição de efeito por Presença, mas isso não constitui um conjunto novo pronto. Equilíbrio humano de VES permanece em playtest.

O desfecho criativo de Véspera prevê libertar o colosso, salvar parte da cidade e reconstruir sem a antiga abundância. A origem não estabelece que toda a magia do mundo venha dele. A direção Bestiário em Foco, a home A, a mesa C e os menus opacos continuam vigentes.

Objetivo proposto: oferecer novas decisões de campo e novas combinações com VES, além de um tema reconhecível. A expansão deve ampliar maneiras de vencer e montar decks; aumentar números das cartas antigas não é uma identidade suficiente.

## Três caminhos comparáveis

| Caminho provisório | Fantasia e conflito | Decisão central no duelo | Ganho e custo |
| --- | --- | --- | --- |
| **A — As Terras Despertas** | Expedições deixam Véspera e encontram um vale onde feras e antigos santuários despertaram. Reconstruir a cidade exige negociar com um território vivo. | Sustentar Presença para potencializar efeitos ou converter o campo em pressão imediata. | Dá função concreta a uma regra já desejada e destaca criaturas. Risco de favorecer demais quem já está à frente. |
| **B — As Cidades Errantes** | Comunidades viajam em fortalezas móveis por rotas instáveis; caravanas disputam abrigo e passagem. | Alternar frente e retaguarda, expondo suportes e preparando ataques de posição. | Mais manobras e identidade espacial. Exige cuidado com limite/custo de movimento e leitura da mesa; pode sobrepor Estações/Ilusão se apenas multiplicar gatilhos existentes. |
| **C — O Conclave dos Juramentos** | Ordens rivais oferecem acordos para reconstruir Véspera, cobrando promessas incompatíveis. | Escolher entre cumprir um plano público de vários turnos ou abandoná-lo para reagir ao rival. | Acrescenta compromisso e blefe público. Exige definir registro, cancelamento e recompensa dos juramentos; maior custo de motor, bot e interface. |

**Recomendação do agente: A.** Une a consequência narrativa de VES a uma lacuna de gameplay já reconhecida: habilidades fortes por Presença. B e C permanecem alternativas completas; não foram descartadas nem aprovadas como expansões futuras.

## Desenvolvimento do caminho A — As Terras Despertas

### Promessa e história

“Você aprendeu a extrair poder de uma cidade. Agora precisa aprender a conviver com um mundo que responde.”

Após a libertação do colosso, expedições de Véspera alcançam um vale antes inacessível. Feras ocupam rotas, ruínas voltam a emitir sinais e comunidades locais já possuem relações próprias com esses lugares. O conflito é decidir o que levar de volta, o que proteger e quais acordos aceitar — não repetir a prisão de outro coração.

Três interesses candidatos: expedicionários que precisam manter Véspera viva; guardiões locais que recusam nova extração; comerciantes que querem controlar as passagens. Esses grupos não são escolas nem impõem restrições de deck. Nara/Ivo/Ecos podem aparecer pontualmente, deixando espaço para novos protagonistas; participações e acontecimentos ainda precisam de escolha editorial.

Fantasia de jogo: montar uma pequena comunidade de criaturas e suportes que faz o campo “despertar”. Prazer esperado: uma carta conhecida de VES passa a sustentar uma combinação nova; o jogador decide quando pode arriscar perder esse apoio. Isso é hipótese de diversão, ainda não resultado de teste.

### Mecânica principal candidata: Ressonância

**Ressonância é um nome editorial para bônus condicionados à Presença atual.** Não cria outro recurso, contador permanente ou requisito global para conjurar.

Exemplo de texto de estudo: “Cause 2 de dano a um monstro. **Ressonância —** Se você tiver Presença de Chama 3, cause 3 em vez disso.” Valores apenas ilustrativos.

- A carta tem uma função útil sem o bônus. O bônus precisa melhorar uma decisão, sem tornar a versão básica uma armadilha de montagem.
- Conferir o limiar quando o efeito correspondente resolver; Escola acumulada não o substitui. Uma carta híbrida pode exigir Presença em duas escolas, com texto explícito.
- Para habilidades de entrada, o monstro já está no campo ao resolver sua habilidade e pode contribuir para o limiar, se ainda estiver lá. Confirmar esse contrato ao especificar/implementar.
- Neste primeiro desenho, usar bônus de entrada, de magia e de gatilho identificado. Não introduzir bônus contínuos que exigiriam recalcular atributos e mortes a cada mudança de Presença.
- Sem gatilhos retroativos: alcançar o limiar depois não repete uma entrada já resolvida. Se uma habilidade de encerramento verificar o limiar, essa verificação ocorre naquele encerramento.
- Não congelar Presença por turno nem mudar duração de fontes. Uma fonte que expira pode reduzir o limiar disponível; isso deve aparecer na ajuda e no planejamento do jogador.
- Remover suportes/fontes/permanentes no próprio turno pode enfraquecer a próxima jogada rival. Não prometer uma nova janela de interrupção durante a resolução: as regras atuais não são alteradas por esse conceito.

O valor da escolha deve ser visível: usar uma carta como fonte para ganhar energia agora; mantê-la como peça de campo para sustentar um efeito futuro; ou atacar/trocar e abrir mão de parte da combinação. Presença usa as zonas existentes, sem nova zona de território nesta proposta.

### Identidade das quatro escolas

| Escola | Expressão temática candidata | Maneira de usar Presença |
| --- | --- | --- |
| Chama | Feras de calor, clareiras abrasadas e exploradores de risco | Transformar uma preparação curta em ataque; bônus pontual, sem dano inevitável recorrente. |
| Raiz | Guardiões, simbioses e santuários vivos | Sustentar o grupo, proteger uma peça e recuperar depois de trocas. |
| Sombra | Vestígios, predadores noturnos e memórias dos lugares | Converter perdas em alternativas, com custos e limites claros para recuperação. |
| Maré | Migrações, nascentes e guias de passagem | Reorganizar o campo e escolher a hora do bônus, pagando o custo real de devolver/rejogar. |

### O que muda nos seis pares

São candidatos de variação dos estilos existentes, não seis decks já balanceados.

| Par | Variação proposta | Tensão a preservar |
| --- | --- | --- |
| Chama/Sombra | Predadores que preparam uma investida e usam Cinzas para concluí-la | Gastar o campo cedo demais reduz os bônus seguintes. |
| Chama/Raiz | Manada agressiva com um suporte importante | Proteger o suporte custa espaço e recursos que poderiam virar ataque. |
| Chama/Maré | Explosão de magia após preparar Presença | Devolver uma peça facilita nova entrada, mas também perde Presença até rejogá-la. |
| Raiz/Sombra | Recuperação depois das baixas, com efeitos menores quando atrás | Evitar ciclos gratuitos e impedir que toda morte vire vantagem automática. |
| Raiz/Maré | Rede de suportes e reposicionamento calculado | Preservar o grupo pode atrasar o fechamento do duelo. |
| Sombra/Maré | Pressão seletiva sobre o apoio adversário, acompanhada de uma ameaça própria | Informação e retorno precisam produzir avanço, sem travar a partida indefinidamente. |

### Seis sementes de cartas

Rascunhos de função: nomes provisórios, sem custo, requisitos, atributos, Essência ou raridade final. Não são cartas prontas para jogar. Nenhuma habilidade abaixo foi implementada nesta rodada.

| Carta provisória | Escola / tipo | Rascunho do efeito e papel |
| --- | --- | --- |
| **Lince da Pedra Quente** | Chama / monstro | Entrada com pequeno bônus ofensivo; com Ressonância, pode conceder Ímpeto a outro aliado. Preparar uma investida sem fazer todo atacante ser autossuficiente. |
| **Guardião das Raízes Suspensas** | Raiz / monstro de suporte | No encerramento próprio, cura pequena de aliado; com Ressonância, melhora essa cura. Efeito básico útil para quem ainda está formando campo. |
| **Catadora de Nomes Perdidos** | Sombra / monstro | Entrada recupera uma carta de custo limitado das Cinzas para a mão, pagando Cinzas adicionais; com Ressonância, amplia a escolha. Custo e elegibilidade precisam impedir autorrecuperação circular. |
| **Guia das Nascentes Altas** | Maré / magia | Reposiciona um aliado; com Ressonância, acrescenta seleção limitada do topo. Não concede deslocamentos gratuitos ilimitados. |
| **Santuário da Primeira Chuva** | Raiz/Maré / encantamento | Um gatilho identificado no encerramento próprio recompensa sustentar as duas Presenças com recuperação pequena. Sem comprar cartas automaticamente a cada movimento. |
| **Quebrar o Círculo** | Chama/Sombra / magia | Remoção limitada de uma peça de apoio. O efeito básico funciona sem Ressonância própria; é uma resposta possível para quem está atrás. Alvos/custo ainda por especificar. |

As duas últimas testam lados opostos da mesma hipótese: preparar uma rede precisa ser prazeroso, e desmontar parte dessa rede precisa ser possível. Bônus de compra, Ímpeto e recuperação serão pontos de atenção junto às cartas VES existentes.

### Dimensão editorial candidata

**60 cartas novas**, se o tema for escolhido: 12 de cada escola simples (48) e duas para cada um dos seis pares (12). Isso é uma proposta de cobertura, não obrigação de preencher vagas com cartas repetitivas. Quantidades de monstros/magias/encantamentos/Prenúncios e raridades dependem da curva e dos papéis necessários.

Priorizar comuns que ensinem o plano e respostas acessíveis; incomuns que conectem estratégias; raras de impacto e construção específica. Não aprovar uma escalada geral de eficiência por raridade. Preservar variedade de custos/Essências e escolhas de fonte, em vez de distribuir Presença alta por todas as cartas.

Compatibilidade proposta: novas cartas misturáveis com VES em decks de 40/até três cópias; conservar a possibilidade de duelar só com VES. Código, símbolo e política de formatos ainda não definidos. O desenho é comum a solo e amigos, sem cartas com regras distintas conforme o oponente.

Visual: aplicar Bestiário em Foco a feras, exploradores e santuários; o cenário do vale deve aparecer na ilustração sem competir com leitura e silhueta. Esta descrição temática não troca molduras, direção da UI nem constitui aprovação de novas artes. Pranchas/assets entram depois da escolha do conceito.

## Primeiro experimento proposto, após escolha

Começar com **12 cartas de laboratório**: quatro ameaças, quatro apoios e quatro respostas/recuperações; cobrir as quatro escolas e ao menos dois pares. Misturar com VES em listas de 40. Esse lote testa a promessa antes de fechar as 60 e produzir arte final.

Premissa mais arriscada: Ressonância pode premiar apenas quem já domina o campo. Comparar partidas com o lote e listas VES de agressão, controle e recuperação, alternando iniciativa. Incluir testes dirigidos de campo vazio, limiar atingido pela própria entrada, fonte que expira, híbrida, retorno/rejogo e perda de suporte.

Registrar quando o bônus é relevante, se o efeito básico continua útil, quais escolhas mudam a sequência de jogadas e se há retomada depois de perder o campo. Perguntar aos jogadores em qual turno tiveram uma decisão difícil e se entenderam Escola versus Presença. Frequências e vitórias isoladas não provam diversão ou equilíbrio.

Critério de revisão: se vencer o campo cedo torna todos os turnos seguintes melhores sem uma rota de recuperação viável, reduzir recompensas cumulativas, fortalecer efeitos básicos/respostas e revisar limiares antes de ampliar o lote. O bot precisa avaliar o novo plano, mas sua taxa de vitória não substitui playtest humano.

## Próxima escolha e rastreabilidade

Escolha posterior: **A/Terras Despertas**, aceita em WB-D23. B e C permanecem alternativas históricas. Continuação: conflito central, protagonistas, contrato da mecânica e lote de cartas em [terras-despertas.md](terras-despertas.md).

Fontes internas: [GDD](../GDD.md), [WB-D15/19/20/22](../decisoes.md), [WB-005](../specs/WB-005-escola-e-presenca.md), [bíblia de Véspera](../../../ideias/duelo-de-magos/expansao/biblia-vespera.md), [sinergias VES](../../../ideias/duelo-de-magos/expansao/sinergias-v0.3.md), motor/tipos e dados em `../src/`. Catálogo consultado: [análise MTGA](../../../catalogo/jogos/mtga/steam-25763111/analise.md), evidência parcial de cliente; nenhum novo sistema é atribuído a essa referência. Sem testes de jogo nesta rodada de design.
