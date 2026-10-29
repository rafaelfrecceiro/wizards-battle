# Auditoria de UI/HUD — 0.11.0, 29/10/2026 (WB-26)

Pedido do usuário: melhorar a HUD e o visual do jogo, com polimento, fluidez e sem cara de genérico. Análise feita no papel de art_director, como **refinamento da direção já escolhida** (Atlas C + Santuário A + Bestiário em Foco). Não é uma redefinição de identidade. Tudo abaixo é PROPOSTA; nada foi implementado nem aceito.

## Método (FATO OBSERVADO)

- Instância isolada da 0.11.0 (dist-v11) na porta 4197, com save temporário fora do projeto. A 4187 e os saves reais não foram tocados.
- Chromium via Playwright em 1920×1080: home, preparação, mão inicial, turnos 1–3 contra o bot (fonte, conjuração, combate, fim de turno), hover/clique na mão, menus Feedback e Histórico.
- `atlas-preview.html?cheio=1` (fixture, não partida legal) em 1920×1080 e 1366×768 para ver a mesa cheia.
- Coleção e Meus decks em 1920×1080.
- Leitura estática de `src/web/*.css` e de `main.tsx`.
- Não houve medição de FPS nem gravação frame a frame; capturas estáticas não comprovam a qualidade das animações.

Capturas nesta pasta: `01-home` … `19-decks`.

## Diagnóstico

### 1. Por que parece genérico

| # | Evidência | Impacto |
| --- | --- | --- |
| G1 | A home (01) é ilustrada e premium, mas tudo depois do clique vira formulário web: preparação com selects e lista (02), Feedback com dropdown (14), Coleção com cara de painel administrativo (18). | É a maior quebra de identidade. O jogador sai de uma catedral steampunk direto para um formulário de configurações. |
| G2 | Tipografia: só Georgia (títulos e números) e Inter/Segoe UI (Inter não é carregado, então cai na fonte do sistema). Nenhuma `@font-face`. | Georgia + fonte do sistema é a combinação “padrão do navegador”. Lá dentro, o logo desenhado da home não tem nenhum eco tipográfico. |
| G3 | Na batalha há seis botões HTML no canto superior direito, em duas linhas (Guia, Coleção, Meus decks, Feedback, Histórico, Santuário). Há também a faixa de debug “Duelo solo · Véspera + … · Autômato” (topo esquerdo) e o link solto “Como jogar?”. | Ferramentas de desenvolvimento ficam visíveis na mesa. Coleção e decks nem fazem sentido no meio do duelo. |
| G4 | Estados vazios escritos como tutorial e sempre impressos: “Vaga livre” ×12, “Sem fontes ativas / O poder do rival começa aqui”, “Sacrifique uma carta / Arraste da mão…”. | Texto em excesso, sensação de protótipo. |
| G5 | O tabuleiro inteiro é um PNG esticado em 100%×100% (`atlas.css:2`), com HTML por cima. | Zonas, painéis e molduras não se adaptam ao conteúdo. Por isso sobra pergaminho vazio e as cartas não podem crescer. |

### 2. Hierarquia e layout da batalha

| # | Evidência | Impacto |
| --- | --- | --- |
| L1 | Carta de campo com cerca de 104×145 px em 1080p (`--card-h: u*7.55`), numa faixa de cerca de 1100 px. O conjunto de 3 vagas ocupa cerca de 30% da faixa; a placa “FRENTE/RETAGUARDA” e o espaço morto ficam com o resto (08, 16). | As cartas, que são as protagonistas, ocupam cerca de 15% da tela. A arte das 140 frentes quase não aparece. |
| L2 | Nome da carta no campo é cortado (“Corredor das Bra…”, “Catadora de Lam…”), a placa de ATK/DEF cobre a base da arte e o badge de palavra-chave sobrepõe o canto (16, 17). | Leitura fraca justamente do que mais importa. |
| L3 | As colunas laterais (Fontes, Encantamentos, Véu) ocupam cerca de 35% da largura e ficam quase sempre vazias; as fontes aparecem como mini-cartas de cerca de 65 px (09, 12). | A área é desproporcional à informação que mostra. |
| L4 | Escola + Presença mostram 8 números por jogador (32 na tela), todos com o mesmo peso e quase sempre 0 (03, 16). | Parece planilha. Não diz qual requisito importa agora. |
| L5 | Dono do turno pouco claro: “Turno 3” em 14 px à esquerda, fases em 14 px no centro e “Autômato pensando” em 12 px dentro do anel de latão (12). | O jogador não sente a passagem de vez. |
| L6 | O botão de fase (“IR PARA COMBATE”/“ENCERRAR TURNO”) é uma etiqueta de pergaminho colada sobre o anel de latão pintado, e o anel fica vazio embaixo. A área “Conjurar magia” logo abaixo compete com ele (09, 16). | O botão mais importante do jogo não parece parte do mundo. |
| L7 | A mão em repouso mostra só cerca de 40 px das cartas, cortadas pela borda. Expandida, cobre o retrato, a Vida e a Energia do jogador. A prévia cobre a própria mão (05, 06). | Conflito entre mão, HUD e prévia. |
| L8 | A prévia repete o texto de regra duas vezes (na frente da carta e na coluna lateral). As ações aparecem como lista de links (“Fonte: Fênix do Motor →”) (06). | Ruído, e as ações parecem de site. |

### 3. Defeitos objetivos (corrigíveis já)

- **D1:** título “FONTES” do rival cortado pela moldura superior; “VÉU” dos dois lados também (09, 16).
- **D2:** rótulo “DESCARTE” e contador do jogador cortados pela moldura (09).
- **D3:** contadores “0/3 ?” das zonas cobertos pelos cantos da moldura (Fontes e Encantamentos do rival).
- **D4:** o aviso “O duelo começou…” cobre Escola/Presença do rival (03).
- **D5:** na troca de mão, o botão secundário “Trocar as 7 cartas” fica com texto escuro sobre fundo escuro (ilegível) e o rótulo “SEU PRIMEIRO PASSO” também; o modal é pequeno para a decisão (03).
- **D6:** o mesmo evento aparece em três lugares ao mesmo tempo: aviso inferior esquerdo, faixa da fase à direita e Histórico.
- **D7:** fontes mínimas de 8–9 px na HUD (`sacrifice-hint` 8–9 px, rótulos de pilha 8–10 px, `battle-name` 9–11 px).
- **D8 (a confirmar):** um quadro capturado logo após a conjuração mostrou a mesa deslocada/duplicada verticalmente (`08-conjurou`). Na captura seguinte, 1,5 s depois, estava normal e com `scrollY = 0`. Pode ser artefato do screenshot durante a animação; precisa ser verificado gravando em vídeo.

### 4. Base técnica

- O CSS da UI está distribuído em camadas que se sobrescrevem: `style.css` (1980 linhas, 11 `!important`), `readability.css` (596) e `atlas.css` (70 linhas muito longas, minificadas à mão). Não há tokens de cor, tipo, espaçamento ou z-index. Cada polimento novo vira mais uma sobrescrita.
- Para crescer as cartas e enxugar as laterais é preciso separar o tabuleiro em camadas: fundo, moldura 9-slice e zonas em CSS/SVG. Hoje tudo é uma imagem única.

## Propostas

### A. Correções rápidas (baixo risco, sem mexer na direção)

1. Corrigir D1–D5: recuos internos das zonas, aviso abaixo da faixa de recursos, botões do modal no kit novo (item C2).
2. Remover a faixa de debug. Juntar os seis botões em um único botão-medalhão de “Grimório” (Guia, Histórico, Feedback, Sair para o Santuário). Coleção e decks ficam fora do duelo.
3. Estados vazios sem texto: vaga vazia vira um glifo gravado no pergaminho/ardósia (♜/⚔) com no máximo 25% de opacidade. Dicas só no primeiro duelo ou ao passar o mouse.
4. Piso de 12 px em 1080p para qualquer texto; zeros de Escola/Presença esmaecidos.
5. Cada evento em um único lugar: narrador compacto mais o Histórico; tirar a duplicata da faixa de fase.

### B. Reorganização da mesa (maior ganho visual)

1. **Cartas maiores:** carta de campo com cerca de 150×210 px em 1080p (+45%). As placas FRENTE/RETAGUARDA viram uma etiqueta vertical estreita, ou só o ícone no início da faixa, e as vagas ocupam a faixa.
2. **Laterais mais finas** (cerca de 22% em vez de 35%). Fontes deixam de ser mini-cartas e viram *medalhões de fonte*: recorte circular da ilustração, anel na cor da escola, pips de duração e “+2” de geração. É mais legível e cria uma linguagem própria. O mesmo vale para encantamentos ativos.
3. **Variante “carta de campo”:** a arte domina, os atributos ficam em dois selos de latão nos cantos inferiores (espada/escudo) e o nome aparece inteiro no hover/foco. Dano tinge o selo de coral; buff, de âmbar. As frentes originais continuam intactas na mão e na inspeção.
4. **Widget Escola/Presença:** um anel por escola (só as escolas do deck). A Escola aparece como pips no anel e a Presença como número central. O anel brilha quando atende o requisito de uma carta da mão. Reduz de 8 para 2–4 elementos por jogador.
5. **Vez do turno:** a faixa central vira um eixo de latão com um ponteiro que gira para o lado ativo. Banner “Sua vez / Vez do Autômato” de cerca de 600 ms. A moldura do lado ativo ganha um brilho âmbar suave. O medalhão do rival “respira” enquanto o bot pensa.
6. **Botão de turno dentro do anel pintado:** um botão circular de engrenagem que ocupa o anel e muda o rótulo (Combate → Encerrar). Fica âmbar pulsante quando não há mais jogadas legais. “Conjurar magia” vira o destino de arrastar que só aparece durante o drag de uma magia.
7. **Mão:** leque em arco mostrando cerca de 45% de cada carta em repouso. Hover sobe só a carta, sem cobrir a HUD (retrato, Vida e Energia vão para a esquerda da mão). A prévia mostra a carta grande e só o glossário de palavras-chave, sem repetir o texto. As ações viram botões de latão com ícone (Fonte ✦, Frente ⚔, Retaguarda ♜).

### C. Identidade própria (o que tira a cara de genérico)

1. **Tipografia:** uma display com serifa de inscrição/gravura para títulos, números de Vida/Energia e botões, mais uma humanista legível para regras e UI. As fontes devem ser empacotadas no projeto (sem CDN) e ter a licença registrada. Proponho 2–3 pares para você escolher numa prancha antes de aplicar.
2. **Kit de componentes ardósia/latão** para todo menu: painel com cantoneiras de latão, botão primário de latão gravado, botão secundário de ardósia com borda, seletor segmentado no lugar de dropdown, abas tipo marcador de livro. Aplicado em troca de mão, Feedback, Guia, Histórico e confirmações.
3. **Preparação como cena:** os decks viram capas de grimório/caixas com a arte-chave e os medalhões das escolas, e o oponente vira um retrato. Regras avançadas (energia, Escola) ficam recolhidas em “Regras do duelo”.
4. **Coleção como arquivo:** fichário com páginas, cartas maiores, filtros como medalhões de escola/raridade e a bancada ilustrada já produzida (`arte/santuario-producao-v1`) como fundo real.
5. **Movimento com o vocabulário do próprio jogo:**
   - Energia corre como luz da fonte até o orbe.
   - Cartas que morrem se desfazem em brasas que voam até a pilha de Cinzas.
   - Conjuração tem arco e anel de impacto na vaga.
   - Ataque tem avanço e recuo, e o número de dano sai do selo.
   - Vida perdida racha o escudo.

   Isso conecta o feedback causal da 0.10 às mecânicas, em vez de usar brilho genérico.
6. **Ambiente leve:** velas e o coração mecânico do fundo pulsando devagar, com poucas partículas de poeira. Tudo desligável e respeitando movimento reduzido.
7. **Som:** pacote mínimo ligado por padrão em volume baixo (carta, conjuração, impacto, turno), com controle visível.

### D. Fundação técnica (habilita B e C)

1. Tokens CSS (cor por função, escala tipográfica, espaçamento, raio, sombra, camadas z) em um único arquivo. As camadas antigas são migradas aos poucos, sem novo `!important`.
2. Tabuleiro em camadas: fundo, moldura 9-slice gerada a partir da arte C e zonas desenhadas em CSS/SVG. É a peça que permite B1/B2.
3. QA visual: capturas automáticas em 1366×768 e 1920×1080 da mesa vazia, cheia e com a mão aberta, comparadas a cada mudança; gravação em vídeo para validar movimento e FPS.

## Ordem sugerida

1. **A** inteira mais **D1**: pequeno, elimina os defeitos visíveis e cria a base.
2. Prancha/mockup da mesa reorganizada (**B**) e dos pares tipográficos (**C1**), com as frentes reais em 1920×1080, para você aprovar antes de implementar.
3. Implementar **B** mais **D2**, depois **C2–C4** (menus e telas) e por fim **C5–C7** (movimento, ambiente e som), com captura e vídeo reais em cada etapa.

## Depois das correções A + D1 (29/10/2026)

Capturas reais em `depois-A/`: `mulligan-1080`, `grimorio-1080`, `cheio-1080` e `cheio-768`. Instância isolada na porta 4197, com save temporário.

- D1–D3 resolvidos nas capturas: “FONTES” do rival, “VÉU” e “DESCARTE” visíveis; contadores longe dos cantos.
- D4 resolvido: o aviso fica no eixo central. D5 resolvido: troca de mão legível, acima do campo, sem colidir com o aviso.
- D6 parcial: o eixo não repete mais o último evento; o narrador e o Histórico continuam.
- D7 resolvido: textos da HUD com piso de cerca de 12 px em 1080p (11 px em 1366).
- Pendente novo: com o campo cheio em 1080p, a linha “+N energia” das fontes aliadas encosta na divisória do painel. A solução prevista são os medalhões do bloco B.
- D8 não reapareceu nestas capturas; ainda não foi verificado em vídeo.

## Mesa v2 implementada (WB-D30 / WB-27, 29/10/2026)

Capturas reais em `mesa-v2/`, instância isolada na porta 4197:

| Captura | Conteúdo |
| --- | --- |
| `mesa-cheia-1080`, `mesa-cheia-1366` | Fixture com a mesa cheia |
| `partida-turno2-1080` | Partida real contra o bot |
| `partida-decisao-1080` | Partida real na decisão de descarte |
| `preparacao-1080`, `colecao-1080` | Telas fora da mesa com as fontes novas |

- Em todas as capturas o documento ocupa exatamente o viewport (sem scroll de página).
- A `.arena` não rola mais ao passar o mouse na mão (scrollTop 0 com `overflow:clip`).
- Durante a animação de feedback, as ações do inspetor seguem bloqueadas por design (`feedback-in-progress`); o QA automatizado precisa esperar a mesa ficar ociosa.
- Não verificados nesta rodada: arrasto real até as fichas, mira de ataque sobre o novo layout e desempenho/FPS.
