# WB-006 — Batalha Atlas do Conclave

23/10/2026 · WB-D17 · UI 0.5.1, motor 0.5.0 inalterado.

## Escolha e contrato

Usuário escolheu C explicitamente: “Adorei o C” e pediu máxima fidelidade, beleza e fluidez. Referência aprovada: [prancha C](../arte/direcoes/batalha-c-atlas-do-conclave/conceito-v1.png). A aprovação da direção autoriza implementação, sem presumir aceite do resultado jogável.

Preservar ardósia azul, latão trabalhado, pergaminhos laterais, quatro fileiras, medalhões e composição retangular. Cartas são as frentes canônicas de Véspera, com selo de edição como camada existente; faces redesenhadas pela geração conceitual não entram no produto. Home permanece Santuário A.

## Produção visual

Imagegen integrada editou a prancha C para remover cartas, números, inscrições, slots e retratos, mantendo arquitetura e materiais. Cenário limpo em arte/atlas-producao-v1/tabuleiro-v1.png; medalhões separados maga-v1.png e automato-v1.png, com exterior transparente. Cópias de runtime em src/public/arte/atlas-*.png. [Prompts completos](../arte/atlas-producao-v1/prompts.md). Assets autorais gerados para este projeto; nenhuma imagem externa incorporada.

O cenário é uma imagem estática, sem prometer relevo 3D ou animação da arquitetura. Textos, recursos, cartas, capacidades, alvos e ações são componentes reais. Proporção integral de 1672×941 preservada com margens conforme a janela; não esticar/cortar a prancha para ocupar qualquer formato. HUD e proporções das cartas precisam acomodar dados reais, inclusive estados ausentes da cena conceitual. Não declarar reprodução pixel a pixel sem captura comparativa.

## Interface e interação

- src/web/atlas.css aplica a composição apenas à batalha. Centro com quatro fileiras e faixa de turno; fontes à esquerda, encantamentos e Véu à direita. Slots correspondem à capacidade restante; fontes usam faixa horizontal sem inventar limite novo.
- Vida e Energia recebem recipientes próprios; Escola e Presença ficam em grupos separados. Ícones SVG novos são somente do HUD; ícones impressos e Essência das cartas permanecem os originais.
- Mão parcialmente recolhida, expandida sobre o campo ao apontar/focar; cartas originais, prévia flutuante e explicações de habilidades preservadas. Decisões e histórico recebem materiais do Atlas.
- Mira passa a curva quadrática com ponta e atualização direta no SVG durante o ponteiro. Carta atacante permanece no campo; autorização e escolha do alvo continuam no motor.
- Recursos confirmados pelo servidor recebem pulso de 280 ms; transições existentes de entrada/movimento/saída permanecem. Movimento reduzido respeitado. Tempos configurados não são medição de FPS/latência.

Código principal: src/web/main.tsx, atlas.css, atlas-icons.tsx, atlas.ts e motion.ts. Não houve alteração em regras, bot, listas ou efeitos. Nenhuma carta nova foi publicada.

## Disponibilidade e sessão

http://127.0.0.1:4181/ serve src/dist-v05. Motor em memória permanece wb-0.5.0/rules-escolas-v1/ac500ad45d98/7e65b53aa899; processo não reiniciado. Build preserva bundles anteriores com emptyOutDir:false, evitando remover arquivos ainda referidos por clientes abertos. Recarregar carrega a interface nova e reutiliza token da mesma origem; não clicar Novo duelo para apenas atualizar o visual.

http://127.0.0.1:4181/atlas-preview.html é uma composição isolada para QA, com mesma UI e cartas reais. Não chama ações da API nem altera token, mesa ou biblioteca de decks. ?cheio=1 apresenta 12 monstros, oito fontes por lado, rituais cheios e mão própria de oito cartas. Estados são montados manualmente e não conservam um deck legal: servem à inspeção de layout, não a balanceamento/replay/partida real. Ações exibem aviso, sem jogar.

## Evidência e aceite restante

Build/typecheck e 120 testes aprovados; duas regressões novas cobrem isolamento da prévia e estrutura do HUD/vagas. Teste de mira existente verifica curva e atualização do destino. Arquivos estáticos respondem com bytes do build; 80 frentes intactas. [Relatórios e limites](../qa/atlas-v051/README.md).

Bloqueio observado: cua.getState retorna “Local browser use is disabled in Work settings”. Sem nova captura de jogo, inspeção visual do Atlas, drag em browser ou medição de desempenho. Não usar imagem gerada como evidência de implementação.

Após reativação: comparar prancha e captura real em 1366×768, 1920×900 e 1920×1080; conferir capacidade cheia, oito fontes, mão expandida, hover seguindo ponteiro, mira sem ocultar destino, decisões/gatilhos e movimento reduzido. Layout desktop; responsividade mobile não foi entregue. Aceite visual humano e fluidez permanecem pendentes.

Atualização após o usuário fechar/reabrir o aplicativo: navegador reativado. Inspeção executada nas três resoluções, sem rolagem da página; capturas do campo cheio/mão/hover no QA. Badges movidos ao canto superior e pilhas centralizadas, seleção acidental de texto do campo impedida. Hover de 620×449 px deslocou +10/+25 px junto com o ponteiro; drag de ataque chegou ao destino na fixture, sem resolução de partida real. Sem medição de FPS ou verificação completa de decisões/movimento reduzido. A última checagem extra foi interrompida por timeout da aba; viewport restaurado.

Servidor estava encerrado após a reabertura e foi iniciado novamente na 4181 (exec 27422, zero sessões); as mesas antigas em memória não estão disponíveis. A preservação descrita na entrega inicial acima não se estende ao encerramento externo do processo.
