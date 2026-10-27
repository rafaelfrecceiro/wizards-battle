# As Terras Despertas — desenvolvimento da segunda expansão

**Vigente WB-D27 / edição completa1.0:** publicada na[0.11/4187](http://127.0.0.1:4187/) com60cartas e seisdecks próprios. [Ver todas](terras-despertas/galeria-edicao-v1.html) · [Textos/números](terras-despertas/cartas-edicao-v1.md) · [Fonte reproduzível](terras-despertas/fechar_edicao.py) · [WB-012](../specs/WB-012-terras-completa.md) · [QA](../qa/terras-v110/README.md). O pedido de completar a edição substitui a limitação ao lote inicial. Dimensão60adotada da proposta anterior, sem alegar escolha numérica expressa.30comuns/20incomuns/10raras,48monocolores/12híbridas. Selo próprio vale/sol/raízes, sem sigla no lugar do emblema. As seções a seguir preservam a elaboração e os recortes históricos; valores vigentes estão na edição1.0 acima.

24/10/2026 · Revisão de design 0.1 · [Escolha WB-D23](../decisoes.md).

**Escolhido pelo usuário:** caminho A, As Terras Despertas, como tema da próxima expansão depois de VES. **Propostas desta revisão:** história detalhada, personagens, nome da região, Ressonância, composição e cartas. Escolher o caminho não homologa automaticamente esses detalhes ou seu equilíbrio.

**Atualização WB-D24:** passos 1–3 entregues no [piloto jogável 0.8](http://127.0.0.1:4184/). [Auditoria e contrato](terras-despertas/auditoria-v02.md), [12 cartas revisadas 0.2](terras-despertas/cartas-piloto-v02.md), [QA](../qa/terras-v080/README.md). Ressonância implementada para teste; custos/efeitos/raridades ainda sujeitos a equilíbrio humano. A narrativa e as funções iniciais abaixo são o estudo de origem; os valores jogáveis vigentes estão na revisão 0.2. Expansão completa em 60 não definida.

**Prévia solicitada em seguida pelo usuário:** [galeria das 12 cartas](terras-despertas/galeria.html), [textos completos 0.1](terras-despertas/cartas-piloto-v01.md), [dados editoriais](terras-despertas/cartas-piloto-v01.json) e [artes/pranchas](../arte/terras-despertas/piloto-v01/README.md). A seção de funções abaixo registra o desenho inicial; a prévia agora atribui custos, requisitos, atributos, Essências e raridades como propostas para revisão. Sem integração ao runtime ou playtest.

## Identidade e promessa

Uma expansão de exploração e fantasia selvagem: feras com comportamento próprio, povos que conhecem o território e ruínas que ainda cumprem funções. Véspera deixa de ser o centro do mundo, mas suas necessidades continuam movendo a história.

Promessa jogável: **formar um campo que desperta poderes e escolher quanto dele arriscar para vencer.** Algumas cartas novas devem revalorizar cartas de VES como peças de uma combinação; outras precisam funcionar sozinhas para dar acesso a essa combinação.

Tom proposto: maravilhamento, perigo e esperança com consequências concretas. Criaturas não são apenas obstáculos hostis, e os habitantes locais possuem objetivos próprios. Preservar a direção Bestiário em Foco; este documento não redefine molduras, UI, estilo de ilustração ou cosmologia.

## O conflito que move a coleção

Depois de libertar o colosso, Véspera precisa de água, materiais e novas rotas de abastecimento. Uma expedição atravessa uma passagem recém-aberta e alcança o **Vale dos Ecos Vivos**, nome provisório. Ali, grandes criaturas seguem percursos entre santuários antigos, e comunidades locais mantêm essas passagens habitáveis.

A expedição encontra uma nascente capaz de abastecer parte de Véspera. Seu plano de represamento interromperia o caminho de uma migração da qual o próprio vale depende. Enquanto se discutem alternativas, um entreposto bloqueia a passagem e provoca ataques de feras. Cada lado interpreta esses ataques de maneira diferente.

Pergunta dramática: **como salvar uma cidade sem transferir sua crise para quem vive do outro lado da rota?** A saída exige trabalho, negociação e perdas reais; não basta derrotar uma criatura e recolher seu poder.

Não estabelecer como fato que a libertação do colosso criou a vida do vale ou toda sua magia. A relação entre ambos pode ser investigada na história, sem encerrar as possibilidades do universo.

### Três interesses em conflito

| Grupo provisório | Necessidade legítima | Risco de sua resposta |
| --- | --- | --- |
| **Expedição das Lanternas** | Trazer água e suprimentos antes que Véspera entre em nova crise. | Tratar acordos e rotas existentes como atrasos que podem ser ignorados. |
| **Guardiões das Passagens** | Manter migrações, nascentes e comunidades conectadas. | Fechar o vale e abandonar quem depende de ajuda externa. |
| **Companhia do Primeiro Marco** | Tornar o abastecimento previsível e proteger viajantes. | Converter cada passagem segura em controle de acesso e dependência. |

As quatro escolas aparecem entre os três grupos. Nenhum grupo é uma nova escola, tipo de carta ou restrição de construção de deck.

### Elenco candidato

- **Lia, Cartógrafa das Passagens — Maré.** Jovem adulta de Véspera que registra correntes e trilhas móveis. Quer provar que existe uma rota de abastecimento sem bloquear a migração. Papel nas cartas: observar, selecionar e reposicionar. Não precisa ser uma rara indispensável para o deck funcionar.
- **Aru, Guardião das Raízes Altas — Raiz.** Habitante do vale encarregado de manter uma passagem. Reconhece que isolamento também cobra vidas, mas teme perder a confiança de sua comunidade. Papel: proteção de aliados e escolhas sobre o que preservar.
- **Mael, Chefe do Primeiro Marco — Chama/Sombra.** Organiza abrigos e transporte; calcula que perder uma passagem agora custará vidas em Véspera. Sua busca por segurança pode justificar coerção. Não reduzir Sombra à vilania nem Chama à destruição.
- **Nara e Ivo:** possíveis elos pontuais com VES. A nova história deve sustentar seus protagonistas, sem exigir que os antigos resolvam todo o conflito. Participações e cartas novas de personagens antigos permanecem abertas.

### Quatro momentos da história

1. **A passagem aberta:** primeiros encontros, travessias difíceis e descoberta de criaturas que reconhecem sinais dos santuários.
2. **O vale em movimento:** viajantes aprendem que as rotas mudam com as migrações; nasce uma cooperação ainda frágil.
3. **O primeiro marco:** construção do entreposto e bloqueio provocam conflito. A necessidade de Véspera fica evidente; os custos da solução também.
4. **A travessia das grandes feras:** clímax candidato. Os protagonistas precisam manter uma rota de água e abrir a passagem ao mesmo tempo. Vitória parcial possível, com abastecimento menor e compromisso de manutenção conjunta.

Esse final é proposta, não novo cânone aceito. A narrativa organiza ilustrações e textos; as cartas continuam jogáveis em qualquer ordem e o duelo mantém sua condição de vitória.

## Mecânica candidata — Ressonância

Ressonância identifica um bônus por **Presença atual**, conferido na resolução do efeito indicado. Escola continua sendo o progresso permanente necessário para conjurar; não é o valor usado nesse bônus.

Exemplo de rascunho: “Cause 2 de dano a um monstro. Ressonância — Com Presença de Chama 3, cause 3 em vez disso.” Números apenas para explicar o contrato.

Proposta de contrato para o lote piloto:

1. O efeito básico funciona sem o limiar. A Presença modifica somente a parte explicitamente indicada.
2. Entrada: a própria carta já no campo pode contar. Magias não passam a fornecer Presença por serem resolvidas.
3. Híbridas podem exigir dois valores separados, ambos atendidos naquele momento. Não somar escolas diferentes num total genérico.
4. Expiração de fontes, retirada de permanentes e retorno para a mão continuam reduzindo Presença. O bônus não fica armazenado para a próxima ação.
5. Primeiros textos usam entrada, magia ou um gatilho temporal identificado; bônus contínuos e gatilhos extras por atingir o limiar ficam fora do piloto.
6. Ressonância não dá ações no turno rival, não modifica limite de movimento e não limita o avanço de Escola por rejogo autorizado em WB-D15.

**O que pode tornar isso divertido:** decidir entre sacrificar, manter ou trocar uma peça muda a força de uma jogada futura. **O que pode estragar:** um jogador com campo maior recebe mais poder e cartas repetidamente, deixando o outro sem recuperação.

Por isso, o lote deve conter ameaças e respostas úteis sem bônus. Algumas cartas terão apenas habilidades conhecidas; encher todos os textos de Ressonância tornaria a coleção dependente demais de uma só engrenagem.

## Lote piloto proposto — 12 funções de carta

**Rascunhos editoriais, não cartas legais de runtime.** Nomes e efeitos ainda precisam de custos, requisitos de Escola, atributos, Essência, raridade e redação normativa. Não atribuir códigos definitivos antes de definir a edição. Os quatro grupos de ameaça/apoio/resposta são funções de design, não novos tipos de carta.

| Referência de estudo | Carta / escola | Função e efeito candidato |
| --- | --- | --- |
| TD-P01 — ameaça | **Lince da Pedra Quente — Chama** | Entrada aumenta pontualmente a força de outro aliado; Ressonância acrescenta Ímpeto ao mesmo alvo até o encerramento. Testa explosão preparada e interação com VES. |
| TD-P02 — ameaça | **Javali das Raízes Altas — Raiz** | Corpo de combate com Guardião, sem Ressonância. Referência simples para comparar eficiência e sustentar a formação. |
| TD-P03 — ameaça | **Predador dos Nomes Vazios — Sombra** | Usa uma quantidade finita de Cinzas como custo para um efeito de entrada ofensivo. Não gera a própria reposição; testa o custo de fechar uma partida. |
| TD-P04 — ameaça | **Garça dos Espelhos d’Água — Maré** | Monstro com Alcance, sem Ressonância. Pressiona suportes rivais e precisa sobreviver ao combate normal. |
| TD-P05 — apoio | **Guardião das Raízes Suspensas — Raiz** | Suporte: no encerramento próprio, cura um aliado ferido; Ressonância aumenta a cura. Não recupera cartas nem gera novos corpos. |
| TD-P06 — apoio | **Lia, Cartógrafa das Passagens — Maré** | Entrada permite seleção limitada do topo. Sem compra automática a cada reposicionamento; retorno/rejogo deve continuar tendo custo real. |
| TD-P07 — apoio | **Catadora de Nomes Perdidos — Sombra** | Entrada recupera outro monstro de custo limitado das Cinzas, com pagamento adicional de Cinzas; Ressonância amplia o limite de custo. Excluir a própria carta e investigar ciclos com cópias/recuperadores VES. |
| TD-P08 — apoio | **Santuário da Primeira Chuva — Raiz/Maré** | Encantamento: num encerramento próprio, se atender às duas Presenças, permite seleção pequena do topo. No máximo uma ocorrência daquele gatilho por turno; sem acumular energia e compra no mesmo texto. |
| TD-P09 — resposta | **Quebrar o Círculo — Chama/Sombra** | Remove um encantamento de custo limitado. Efeito independente de Ressonância para atacar uma rede de apoio estando atrás. Não destrói uma categoria indefinida de “suportes”. |
| TD-P10 — resposta | **Bruma entre as Passagens — Maré** | Retorna um monstro rival elegível à mão. Custo/limite devem impedir remoção universal barata e repetível. |
| TD-P11 — recuperação | **Raízes sob o Acampamento — Raiz** | Cura um aliado ferido sem exigir Presença alta. Serve para sobreviver ao turno de disputa; eventual bônus precisa competir com outras opções de recuperação. |
| TD-P12 — resposta | **Faísca de Sinalização — Chama** | Dano pequeno a monstro com incremento por Ressonância. Exercício mais claro da condição, comparável às remoções de VES. |

O lote cobre as quatro escolas e dois pares. Não cobre ainda Prenúncios, todas as curvas, todos os seis pares ou raras de clímax; esses papéis entram ao desenvolver a coleção completa. O nome Guia das Nascentes Altas, citado no estudo inicial, fica como semente adicional de reposicionamento, fora destas 12 funções.

## Composição e formatos — propostas mantidas abertas

Alvo editorial sugerido: **60 cartas novas**, 48 de escola simples e 12 híbridas. Isso permanece proposta do agente, mesmo após a escolha do tema. A divisão por tipos e raridades virá da curva de jogo, dos espaços dos seis pares e das respostas necessárias.

Mistura com VES em decks de 40/até três cópias é o uso pretendido; definir também como selecionar só VES e como apresentar o lote experimental sem torná-lo legal nas salas atuais. Nenhuma rotação, aquisição/posse, cota de raridade ou regra de campanha decorre desta expansão.

O mesmo conteúdo deve atender solo e amigos. Desafios solo candidatos: preservar uma passagem com recursos escassos; vencer desmontando um apoio; vencer depois de perder a formação. São exercícios possíveis, sem aprovar uma campanha ou um novo modo de jogo.

## Validação que falta e próximo trabalho de design

Antes de publicar cartas: comparar custos/Essências e efeitos com as 80 VES; redigir os 12 textos completos; auditar ciclos de retorno, recuperação, desconto e Ímpeto; definir expectativas do bot, visibilidade e replay. O mecanismo de condição já existente não garante a implementação de todo o texto proposto.

Protocolo candidato: listas mistas contra estilos VES de agressão, controle e recuperação, alternando iniciativa; testes dirigidos de campo vazio, entrada que atinge o próprio limiar, fonte expirada, híbrida, retorno/rejogo e perda de apoio. Registrar decisões e oportunidades de retomada, além dos resultados.

Critério de revisão: se a recompensa só aparece para quem já domina e não muda escolhas interessantes, rever os bônus antes de ampliar a coleção. Bônus repetidos de compra/energia e remoções dependentes de alto campo merecem atenção especial.

Próximo ponto material de discussão: **a história e o conflito apresentados expressam a aventura desejada?** Em seguida, fechar a redação do lote de 12 e seu mapa de compatibilidade. Esta revisão é elaboração documental: sem teste de partida, arte nova ou modificação de motor/dados/servidores.

Referências: [estudo e alternativas](segunda-edicao-estudo.md), [bíblia de Véspera](../../../ideias/duelo-de-magos/expansao/biblia-vespera.md), [GDD](../GDD.md), [WB-005](../specs/WB-005-escola-e-presenca.md), tipos e implementação atuais em `../src/engine/`.
