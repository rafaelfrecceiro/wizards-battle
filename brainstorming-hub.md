# Wizards Battle — discussão de evolução

## 24/10/2026 — Nova edição completa, WB-D27

Usuário relata “está bem divertido” e pede as cartas completas e retirar o protótipo/sigla do selo. [WB-012](specs/WB-012-terras-completa.md) entregue:60TDP/6decks novos/140total,48ilustrações novas, símbolo próprio nativo, UIsem rótulo experimental. [Galeria](design/terras-despertas/galeria-edicao-v1.html), [QA](qa/terras-v110/README.md), servidor0.11 na4187. Preserva energia acumulada/feedback e sala viva0.10. Próximo feedback desejado: sensação dos seis decks e leitura do símbolo; não transformar elogio anterior em homologação das cartas novas.

Memória de discussão do projeto. Decisões aceitas vivem em [decisoes.md](decisoes.md); execução, exclusivamente em [progress.md](progress.md).

## 24/10/2026 — Feedback causal solicitado, WB-D26

Usuário testou a reserva e disse estar legal, mas relata cartas surgindo/sumindo sem causa visível. Pede polimento geral com movimento e ligação entre magia/Prenúncio/encantamento e vítima. [WB-011](specs/WB-011-feedback-causal.md) entregue funcionalmente na0.10/4186: apresentação causal, histórico “Por que aconteceu?”, ritmo ajustável, som opcional e bot aguardando.421testes/36duelos completos equivalentes à0.9/replay exato; reserva, dados e frentes preservados. [QA](qa/feedback-v100/README.md): navegador local desabilitado, sem captura real/parecer perceptivo em movimento. Próximo: usuário avaliar clareza e ritmo; completar revisão gráfica real quando disponível. Não é autorização para redefinir arte ou números.

## 24/10/2026 — Reserva implementada para teste, WB-D25

Usuário: “vamos implementar para eu testar”. [WB-010](specs/WB-010-energia-acumulada.md) e 0.9.0/4185 entregam saldo conservado sem teto novo, fontes e demais regras preservadas, escolha original comparável, solo/salas/replay/save. Guardiã não recebe efeito inventado: habilidade de guardar é redundante e explicitada no experimento. 399 testes, seis duelos completos/replay e HTTP/reinício real; inspeção da preparação observada, inspeção visual da partida interrompida por navegador local desabilitado no Work. [QA](qa/energia-v090/README.md). Feedback de ritmo/diversão e eventual redesign da Guardiã são próximos assuntos, sem presumir equilíbrio.

## 24/10/2026 — Feedback humano: energia acumulada entre turnos

**Relato do usuário:** jogou algumas partidas, achou que o jogo está ficando divertido, mas considera o sistema de fontes ainda lento. Propõe conservar a energia não gasta em uma reserva: uma fonte 1×3 entrega 1 no turno do sacrifício e 1 nos dois próximos turnos próprios; sem gastos, o saldo dessa única fonte é 1 → 2 → 3. Não informou versão/URL, decks, quantidade de partidas ou duração medida. É feedback humano de ritmo, sem métrica comparativa.

**Fato observado no código 0.8:** src/engine/engine.ts, operações $start/$end/sacrifice. O encerramento zera p.energy, com exceção de até 1 guardado por fx.store; o despertar substitui energia pelo saldo guardado e soma a geração das fontes. Na base/escolas-v1, o sacrifício gera imediatamente e já desconta uma unidade da duração: uma 1×3 tem três gerações totais. Mudar a conservação do saldo não exige prolongar fontes nem adicionar uma quarta geração. Fontes ainda podem expirar/virar Cinzas; isso é diferente de apagar energia já produzida.

**Proposta do usuário em discussão:** energia não utilizada atravessa turnos. **Contrato candidato do agente:** manter geração, duração, um sacrifício por turno, Escola e Presença atuais; conservar saldo entre turnos próprios e durante o turno rival, somando novas gerações; expiração/destruição da fonte interrompe gerações futuras, sem apagar saldo produzido. Sem teto novo no primeiro experimento; isso é proposta de teste, não regra publicada nem aprovação de valores adicionais.

**Inferência de design:** conserva investimento e permite alcançar custos maiores com menos desperdício; amplia a escolha entre desenvolver campo agora e poupar para uma sequência futura. Pode agilizar acesso às jogadas sem necessariamente encurtar a duração total dos duelos: poupança também pode incentivar espera ou concentrar várias ações num turno. Requisitos de Escola e cartas na mão continuam limitando uso, mas não demonstram equilíbrio.

**Impacto concreto:** VES-062 / Guardiã da Cisterna guarda até 1 no encerramento, habilidade que fica redundante sob conservação geral. Precisaria de novo efeito/texto no experimento, sem modificar silenciosamente a carta original. Também reavaliar a força da destruição de fontes, bônus de geração e política do bot para poupar; fonte destruída deixa de produzir, mas reserva já acumulada permanece no contrato candidato.

**Próximo experimento proposto:** variante identificada com os mesmos decks e mesmas regras restantes; comparar energia desperdiçada, turnos sem jogada, acesso a cartas caras, concentração de ações e experiência de recuperação/ritmo em solo e amigos. Regressões precisam cobrir 1×3 com/sem gasto, várias fontes, expiração/destruição, pagamentos, replay, persistência e bot. Não houve implementação, teste de partida ou alteração de instâncias/saves nesta rodada. A discussão não homologa diversão/equilíbrio nem inicia uma migração automática das mesas.

## 24/10/2026 — Passos 1–3 executados, WB-D24

Usuário autoriza seguir até implementar o lote experimental. [Auditoria das 12](design/terras-despertas/auditoria-v02.md) comparou as 80 VES: Garça diferenciada do Lanceiro, Guardião paga o potencial adicional e Raízes passa a cura distribuída. Custos/textos/frentes revisados em 0.2, mantendo 0.1 como histórico. Não se presume equilíbrio por comparação estática.

Contrato de Ressonância no [WB-009](specs/WB-009-terras-piloto.md). Entrega 0.8/4184/dist-v08: conjunto VES + 12 TDP explicitamente selecionado, três modelos mistos e listas próprias, bot/replay/solo/salas. 380 testes, 108 duelos/replays idênticos com 12 nomes conjurados, HTTP com consulta privada de Lia preservada após reinício e percurso browser; [QA](qa/terras-v080/README.md). VES/4183/saves/arte e rejogo de Escola preservados.

Próximo assunto é o passo 4 humano: jogar listas mistas e avaliar retomadas, clareza e variedade. Não criar as outras 48 cartas, campanha ou ranking automaticamente. A meta de 60 continua proposta. Túnel 0.7 existente não passa a publicar a 0.8; launcher pode iniciar outro quando necessário.

## 24/10/2026 — Próximos passos da expansão

Usuário pergunta pela sequência após ver as cartas. Recomendação do agente: auditar as 12 contra VES (custos, Essência, funções e ciclos); consolidar o contrato de Ressonância e ajustar redação/valores; implementar um lote experimental separado com seleção explícita, bot e replay; testar listas mistas em solo e amigos, incluindo recuperação após perder campo; só então ampliar a coleção, decidir o alvo de 60 e finalizar metadados/artes. Tema aceito e prévia visível não equivalem a aprovação de números ou integração. A resposta é orientação de próximos passos, sem iniciar desenvolvimento. Primeira ação recomendada: auditoria comparativa das 12, com justificativa de cada ajuste.

## 24/10/2026 — Cartas visíveis solicitadas

Usuário: “cade as cartas para eu ver?”. A rodada anterior tinha somente funções de carta. Produzida [prévia de 12 cartas](design/terras-despertas/galeria.html), com textos completos de proposta, custos/requisitos de Escola, Força/Vigor, Essência e raridades iniciais. [Dados](design/terras-despertas/cartas-piloto-v01.json) e [texto consultável](design/terras-despertas/cartas-piloto-v01.md).

Atlas original com 12 ilustrações via image_gen integrada, composto com os componentes da referência Bestiário em Foco aprovada. [PNGs, três pranchas, prompt e procedência](arte/terras-despertas/piloto-v01/README.md). Não é reutilização de ilustrações VES nem nova escolha de direção visual. Selo/código definitivo de edição ainda não definidos; TD-P01–12 são IDs de estudo.

Galeria oferece seleção e texto legível, mantendo as artes e molduras opacas. Revisão de composição e interação da prévia, sem simular legalidade ou equilíbrio destas cartas. Próximo assunto: feedback do usuário nas cartas e nas combinações propostas; ajustar antes de ampliar a coleção. Runtime, 80 cartas VES e sessões preservados.

## 24/10/2026 — As Terras Despertas escolhida, WB-D23

**Resposta explícita:** “as terras despertas”. Escolhe o caminho A apresentado; não aprova automaticamente todos os números, cartas e contratos mecânicos sugeridos.

[Desenvolvimento 0.1](design/terras-despertas.md): conflito candidato de abastecimento de Véspera versus rota de migração no Vale dos Ecos Vivos; três interesses compreensíveis, Lia/Aru/Mael como elenco novo, quatro momentos e 12 funções de cartas. Nomes, trama/final, personagens e efeitos são propostas. Ressonância segue candidata por Presença na resolução, com efeitos básicos úteis e respostas para quem perdeu o campo. Quatro ameaças, quatro apoios e quatro respostas/recuperações; raridades, custos, requisitos, atributos e Essências ainda por redigir.

**Próximo assunto:** avaliar a fantasia e o conflito, depois tornar o lote de 12 comparável às cartas VES com textos completos e auditoria de interações. Preservadas as alternativas históricas, VES, a arte aprovada e o equilíbrio solo/amigos. Sem teste de partida, arte nova ou alteração de runtime nesta rodada.

## 24/10/2026 — Segunda expansão em elaboração

**Pedido explícito:** “vamos elaborar uma segunda expansao pro jogo”. Interpretado como concepção do próximo conjunto depois de VES; sem escolha de tema ou execução de cartas implícitas.

[Estudo persistido](design/segunda-edicao-estudo.md): A/As Terras Despertas (expedições, feras e bônus por Presença), B/As Cidades Errantes (caravanas e manobra entre fileiras), C/O Conclave dos Juramentos (compromissos públicos e recompensas futuras). Recomendação do agente: A, conectando o desfecho de Véspera à direção já desejada de habilidades fortes por Presença. Nenhuma opção aprovada automaticamente.

No caminho A: Ressonância como nome editorial para condição de Presença na resolução, seis sementes de cartas e seis variações de pares; proposta de 60 cartas e experimento inicial de 12. Nomes, números e regras são rascunhos. Risco central: vantagem cumulativa de quem já domina o campo; prever efeitos básicos úteis, respostas e recuperação antes de preencher a coleção. Preservar Escola/rejogo, arte, VES e prioridade solo/amigos. Nenhuma partida, teste ou alteração do runtime nesta rodada.

**Próxima incerteza:** qual fantasia e conflito o usuário deseja explorar. Depois da escolha, desenvolver mecânica e lista piloto concretas, sem exigir produção das 60 de uma vez.

## 23/10/2026 — Estudo de roadmap solicitado

**Pedido do usuário:** estudar crescimento, amadurecimento, melhorias funcionais e novas implementações para tornar o jogo cada vez mais divertido. Escopo desta rodada: análise e proposta; não iniciar automaticamente desenvolvimento.

**Base lida:** README/AGENTS/GDD/decisões/progress do projeto, origem Duelo de Magos, WB-003/004/005, QA Atlas, catálogo MTGA e arquivos reais de motor/bot/servidor/armazenamento/dados. `hub/relacoes.json` não existe nesta leitura; rastreabilidade veio dos links documentais. Não houve execução de partida/testes/servidores nesta rodada.

**Documento de trabalho:** [roadmap proposto](roadmap.md), com caminhos de produto, marcos, dependências, critérios de avanço, hipóteses de diversão e protocolo de playtest. Datas/prazos de entrega não definidos.

**Fatos estáticos relevantes:** 80 cartas catalogadas, 49 habilitadas, 31 restantes; Decomposição tem apenas VES-008/075/076 ainda bloqueadas. Estações tem 13 nomes bloqueados, Ilusão 17 e Vapor 18, com sobreposição. Isso não estima esforço: capacidades e interações precisam de auditoria. Bot é heurístico com visão limitada; mesas vivem em memória; decks têm persistência local/backup, e replay é exportável após fim.

**Recomendação do agente na proposta inicial:** base compartilhada para solo e duelos por convite, em sequência. Consolidar confiança/clareza; ampliar estilos usando VES; tutorial/rivais/desafios; rede por convite; escolher piloto de retorno; depois novas edições e sistemas de crescimento. Decomposição é candidato de menor escopo; Maré oferece novidade por retorno, seleção e informação. Priorizar experimentos por valor, sem obrigar polimento completo antes de testar mecânicas. A prioridade foi respondida pelo usuário abaixo; a sequência detalhada continua proposta.

**Hipóteses:** fonte versus carta precisa continuar uma escolha interessante; avanço de Escola deve abrir opções sem apagar identidades de escolas; rejogo autorizado em WB-D15 pode gerar combos; Presença pode recompensar sustentar o campo com oportunidades de resposta. Testar poucos casos em laboratório versionado antes de reescrever cartas publicadas. Nenhuma restrição nova de UID/teto de Escola foi aprovada.

**Alternativas comparadas:** A/duelista e amigos, B/jornada solo, C/base comum sequenciada. Usuário respondeu à pergunta assíncrona escolhendo equilíbrio solo/amigos, registrado em WB-D19. Campanha, posse/aquisição, ranking, monetização, trocas, segunda edição e datas continuam em aberto.

**Candidato inicial:** sessão curta de playtest para separar fricção e regra, auditoria Decomposição, lote mínimo Maré e comparação de um combo de retorno/um bônus de Presença. Quantidades e ordem são propostas, sem tarefa de implementação aprovada nesta conversa.

**Próxima incerteza:** quais situações de duelo e desafios curtos melhor expressam o jogo; resolver por experimentos e playtest, mantendo solo e convite no primeiro ciclo proposto.

## 23/10/2026 — Prioridade escolhida: solo e amigos

**Resposta explícita:** “Equilíbrio entre solo e duelos com amigos”. Registrada em [WB-D19](decisoes.md). Define a prioridade de produto, sem iniciar desenvolvimento ou aprovar todos os candidatos do roadmap.

**Ajuste de proposta:** base compartilhada → pequeno ganho solo com rivais/desafios → sala por convite e revanche → aprofundamentos alternados. A sala pode usar o conjunto validado, sem aguardar as 80 cartas/seis decks ou campanha completa. O ciclo desejado é experimentar solo, ajustar o deck, duelar com amigos e voltar para testar uma nova ideia. Essa organização é recomendação do agente; detalhes e escopos seguem em discussão.

## 23/10/2026 — Fechamento de VES autorizado e entregue

Usuário pergunta pela auditoria faltante e, após esclarecimento de 49 habilitadas/31 bloqueadas, solicita explicitamente fechar toda a primeira edição. WB-D20 autoriza executar. Entrega funcional em 0.6.0/4182/dist-v06, com 80 cartas auditadas individualmente, seis modelos/oponentes e montagem livre. [QA completo](qa/ves-v060/README.md), 309 testes, 252 duelos/replays e HTTP dos seis decks. Conteúdos/arte/Escola preservados. Balanceamento humano não convertido em aprovação por automação. Próximo assunto: playtest dos seis estilos com a base completa; roadmap solo/amigos segue vigente.


## 24/10/2026 — Polimento e amigos autorizados, WB-D22

Usuário solicita fechar polimento da mesa e implementar jogar com amigos; confirma LAN e internet. Recorte passa de proposta a execução em WB-008. Entrega 0.7.0/4183/dist-v07 com salas humanas, persistência/reconexão, concessão/revanche, orientação dos dois assentos e correções de drag/foco/movimento. Internet por túnel HTTPS temporário; hospedagem permanente/contas não escolhidas. [Progresso único](progress.md), [evidências e limites](qa/amigos-v070/README.md). Próximo assunto: playtest humano dos seis estilos e teste entre dispositivos; não reabrir arte por iniciativa própria.
