# WB-007 — Fechamento funcional de VES

23/10/2026 · WB-D20: usuário solicita “vamos fechar completamente essa primeira edição”. Executar a auditoria, reparos e validação das 80 cartas/seis decks, com montagem livre e humano × bot. Preservar regras aceitas WB-D15, arte e dados físicos. Campanha e PvP permanecem outros recortes.

## Contrato

- 80 identidades habilitadas somente com capacidades completas. Auditoria individual confronta texto, dados e comportamento; testes dirigidos de condições, custos, alvos, zonas, timings e habilidades, além de duelos de integração.
- Completar retorno de monstros/encantamentos, consulta privada do topo com decisão topo/fundo, inspeção privada de Prenúncio, dissipação, extensão de fonte, bônus/Ímpeto temporários, desconto não cumulativo da primeira magia e armazenamento de energia.
- Escolhas humanas explícitas; informação privada visível apenas ao decisor. Selecionar um Prenúncio oculto não revela as outras identidades, nem as usa para pontuar opções do bot. Informações legitimamente vistas podem ser lembradas enquanto a carta continuar naquela zona.
- Retornar remove dano/bônus e cancela combate se atacante/defensor saiu da zona; rejogar incrementa Escola novamente. Guardião e Alcance continuam respeitados. Efeitos simultâneos mantêm escolha de ordem.
- Primeiro desconto só em magia da escola indicada, enquanto suporte na retaguarda; mínimo 1, não cumulativo, consumo na primeira magia. Energia guardada no encerramento limitada a 1 e entregue no próximo turno.
- Ações inválidas atômicas, conservação de cartas, capacidade de zonas, privacidade, replay determinístico e bot legal. Versão nova não reinterpreta replays anteriores sob correções novas.
- Nova instância 4182/build dist-v06, preservando 4181 e bundles antigos. Decks locais podem ser transferidos explicitamente por backup; sessão/token não migram.

## Aceite e evidência

Build/typecheck e regressões; testes individuais das 80 e cenários negativos/interações relevantes; matriz de confrontos dos seis decks nas variantes; duelos HTTP e reconstrução de replay; inspeção real da seleção dos seis decks, montagem e fluxo de decisão privada quando browser permitir. Relatórios em qa/ves-v060/. Não chamar simulação de balanceamento/diversão humana; registrar parecer humano como pendência separada.
