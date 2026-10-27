# Feedback causal — 0.10.0 / WB-D26

Contrato: [WB-011](../../specs/WB-011-feedback-causal.md). Entrega funcional para teste humano,24/10/2026.

## Evidências executadas

- `regressao-final.json`:421/421 testes aprovados.22 casos novos de cadeia causal/fila/DOM: magia letal, Prenúncio interrompendo combate, morte simultânea, encantamento/suporte, cura escolhida, retorno, fonte destruída, Cuidadora condicional, privacidade, limite/ordem, replay0.9, polling/recarga/revanche/falha, sequência visual, preferências, movimento reduzido, aba oculta e desmontagem. Os seis testes DOM usam WAAPI simulada; não são captura gráfica.
- `feedback-final.json`: recorte de feedback/UI; relatório completo acima é a evidência consolidada.
- `simulations.json`:36 duelos completos, nove modelos×duas iniciativas×duas regras de energia.4829 ações também aplicadas ao motor congelado0.9; jogadores/RNG/vencedor idênticos.40 peças por jogador/energia não negativa/replay final exato. Eventos incluem conjuração, intenção/ataque/interrupção, dano/morte/expiração, revelação, cura/reforço, movimento/retorno/descarte. Não mede diversão.
- `http.json`: processo/banco isolados em porta livre;33 chamadas/27 verificações. Eventos numerados, compra rival sem nome/frente/UID, sacrifício/destino, reserva, reinício real com estado exato, replay causal e revanche. Só o processo do driver foi encerrado; bancos de QA preservados.
- Build/typecheck aprovados; dist-v10 separado, JS principal389,07kB/112,92gzip, CSS81,19kB/19,50gzip. Sem dependências novas.
- `frentes.json`:92 PNGs comparados por SHA256 a dist-v09, zero diferenças. Dados/textos/números/energia mantidos.
- `instancias-antes.json`/`operacao-final.json`: versões/salas anteriores preservadas; novo banco exclusivo. Iniciar-Feedback-Visual.ps1 executado; geral delega, internet padrão4186 sem abrir túnel novo.

## Achados e limites

Antes o cliente animava apenas diferenças entre snapshots finais. Agora motor registra a cadeia e cliente mantém estado anterior/representações transitórias até explicar as consequências. Bot aguarda. Animações usam frentes nativas e CSS/WAAPI; áudio é sintetizado por Web Audio, desligado por padrão.

Regressão inicial encontrou fixtures carimbando versão antiga sobre estado novo com metadados adicionais, consulta de status DOM ambígua e asserção da animação antiga. Corrigidas para usar motor histórico congelado e verificar apresentação causal. Fixture Terras limpa acontecimentos da mão inicial ao substituir artificialmente todas as zonas; teste adicional verifica diretamente o alvo secreto recuperado das Cinzas. Uma execução completa concorrente teve dois casos do editor com STACK_TRACE_ERROR; execução final passou. Relatórios intermediários são históricos.

Navegador local indisponível: cua.getState informou “Local browser use is disabled in Work settings”. Não contornado por outra automação. Portanto não houve partida gráfica assistida, captura/vídeo real, avaliação sonora ou FPS desta versão. DOM/WAAPI simulados verificam ordem/limpeza/estado, não qualidade perceptiva. Revisão visual e ajuste fino de tempos pendentes.

Documentação primária conferida: [Element.animate](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate), [AudioContext.resume](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume), [useEffect/limpeza](https://react.dev/reference/react/useEffect).

Catálogo local consultado: [animação e janelas de gameplay](../../../../catalogo/padroes/animacao-com-janelas-de-gameplay.md), referência observacional de sincronização/limpeza de estados. Adaptado apenas o princípio de separar confirmação autoritativa e apresentação interrompível; nenhuma regra, asset ou tempo de Blasphemous incorporado ao jogo.

## Usar

Abrir http://127.0.0.1:4186 e iniciar novo duelo. Energia acumulada já selecionada, conjunto TDP opcional. Menu **Feedback**: Cinemático/Rápido e som; **Histórico / Por que aconteceu?**: origem, alvo, consequência/destino. Partidas4185 permanecem na0.9. Decks de outra origem podem ser trazidos por backup JSON.
