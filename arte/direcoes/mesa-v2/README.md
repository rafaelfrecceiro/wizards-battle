# Mesa v2 — mockup de reorganização (WB-26, 29/10/2026)

**Aprovado em WB-D30 (29/10/2026): par C + fichas de campo, implementado em WB-27.** O texto abaixo preserva a proposta original. É um refinamento do Atlas C (WB-D17), sem nova direção de arte. Os itens B1–B7 e C1 da [auditoria](../../../qa/ui-auditoria-v011/README.md) aparecem juntos numa mesma situação de jogo.

- Página: `src/public/estudos/mesa-v2.html`, servida em `/estudos/mesa-v2.html` (cópia em `dist-v11/estudos`).
- Parâmetros: `?par=a|b|c|atual` escolhe a tipografia e `?limpo` esconde a barra do estudo.
- É uma fixture estática: as cartas e os números são escolhidos à mão, sem regras, servidor ou interação real. Não comprova legalidade, animação ou desempenho.
- Usa as frentes reais (`/cartas/*.png`), os medalhões `atlas-automato`/`atlas-maga` e o tabuleiro `atlas-tabuleiro.png` como moldura externa. Nenhum asset novo foi gerado.

## Capturas (Chromium/Playwright)

| Arquivo | Conteúdo |
| --- | --- |
| `mockup-par-a.png` | 1920×1080, par A |
| `mockup-par-b.png` | 1920×1080, par B |
| `mockup-par-c.png` | 1920×1080, par C |
| `mockup-par-atual.png` | 1920×1080, Georgia/Segoe (referência atual) |
| `mockup-par-a-1366.png` | 1366×768, o palco 1920×1080 reduzido proporcionalmente |

## O que muda em relação à mesa 0.11

| Item | 0.11 (observado) | Mockup |
| --- | --- | --- |
| Carta no campo | Frente inteira com cerca de 104×145 px, nome cortado e placa de atributos sobre a arte | Ficha de 142×196 px: recorte da ilustração, faixa na cor da escola, nome em fita, Força em selo redondo e Vigor em escudo nos cantos. Selo coral = ferido; dourado = reforçado |
| Placas FRENTE/RETAGUARDA | Placas de pergaminho de cerca de 200 px por faixa | Rótulo vertical discreto com a contagem |
| HUD dos jogadores | Barras em cima e embaixo, ocupando altura | Retrato, Vida e Energia na coluna esquerda, ao lado das próprias fontes. Mostra a previsão “+3 próximo turno” |
| Fontes | Mini-cartas de cerca de 65 px | Medalhões circulares da ilustração, anel na cor da escola, “+N” de geração e pips de duração |
| Escola/Presença | 8 números por jogador | Uma placa por escola do deck: Presença em destaque e Escola abaixo. A placa acende quando atende o requisito de uma carta da mão (exemplo: Chama aliada) |
| Turno | “Turno 7” e fases em 14 px | Eixo central com mostrador, “Sua vez” e a fase ativa marcada |
| Botão de turno | Etiqueta sobre o anel pintado | Engrenagem circular própria, pulsando quando não restam jogadas |
| Mão | Cerca de 40 px visíveis; aberta, cobre a HUD | Arco com cerca de 35% visível; a carta em foco sobe sem cobrir a HUD; cartas jogáveis com contorno verde |
| Atalhos | Seis botões | Grimório (já implementado na correção A) |

## Pares tipográficos (C1)

Todos são OFL. Na produção, as fontes seriam empacotadas no projeto; o estudo carrega do Google Fonts.

- **A · Gravura:** IM Fell English SC + Alegreya Sans. É o mais próximo da tinta do Bestiário e da gravura do logo. Risco: os algarismos antigos fazem “12” e “10” parecerem “I2” e “Io” (visível na captura). Se for escolhido, os números precisam de outra fonte.
- **B · Inscrição:** Marcellus SC + Source Sans 3. Letras de placa de latão, algarismos alinhados e a leitura mais clara de números. É o par mais neutro dos três.
- **C · Caligrafia:** Alegreya SC + Alegreya Sans. Mesma superfamília, coesa, com bons acentos em português e algarismos legíveis. Tem personalidade sem perder legibilidade.

Recomendação do agente: **C**, pela coesão e pela legibilidade dos números, ou **A só nos títulos** com C nos números. A escolha é do usuário.

## Riscos e decisões pendentes

- A ficha de campo deixa de mostrar a frente impressa inteira na mesa; a frente completa continua no hover e na inspeção. Isso muda a apresentação das cartas no tabuleiro, então precisa de aprovação explícita (a direção preserva as frentes, não necessariamente a frente inteira em cada zona).
- O recorte automático usa a mesma janela para todas as frentes (cerca de 20–70% da altura). Algumas ilustrações podem precisar de ajuste por carta.
- Com o palco reduzido em 1366×768, os textos de 12–13 px ficam perto de 9 px. A implementação real deve escalar por `--u` com pisos, não por `transform`.
- A superfície de ardósia cobre o tabuleiro pintado C na área central. Para manter a pintura, seria preciso uma versão do tabuleiro com as zonas novas (camadas e 9-slice, item D2 da auditoria).
