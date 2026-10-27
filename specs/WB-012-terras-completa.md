# WB-012 — As Terras Despertas completa

24/10/2026 · WB-D27 · jogo 0.11.0 · edição editorial 1.0.0.

Pedido: “está bem divertido, pode incluir as cartas completas da nova edição, e tira de prototipo (vi que a logo da edição na carta está uma sigla)”. Autoriza concluir a expansão, integrá-la ao jogo e substituir a sigla por um símbolo. A dimensão de 60 cartas retoma a proposta anterior como recorte de implementação; não é uma escolha numérica expressa do usuário.

## Conteúdo entregue

- 60 cartas TDP: as 12 existentes preservadas em efeitos/atributos e 48 novas. 28 Monstros, 16 Magias, 8 Encantamentos e 8 Prenúncios; 30 comuns, 20 incomuns e 10 raras.
- 12 cartas monocolores por escola e duas híbridas para cada um dos seis pares. Ressonância usa Presença atual, com a mesma resolução já auditada no lote inicial. Escola continua permanente por fonte/conjuração, inclusive rejogo.
- Seis decks completos de 40 cartas, com duas cópias de cada um dos seus 20 nomes, cobrem a edição inteira. Manada do Vale, Nomes e Brasas, Nascentes Vivas, Última Semente, Correntes de Brasa e Caminhos do Crepúsculo. Total com VES: 140 cartas e 12 modelos; montagem livre pode combinar as edições.
- 48 ilustrações individuais novas no estilo Bestiário em Foco. As 12 anteriores conservam suas ilustrações; as 60 frentes recebem selo nativo de vale/sol/raízes e numeração 001–060. Raridade distingue metal cinza/prata/ouro. A sigla TDP permanece apenas como identificação editorial.
- Coleção inicia em TDP, apresenta textos/raridades e os decks da edição escolhida; “Todas” mostra 140 e 12 modelos. Preparação inicia com conjunto completo, Escola + Presença e energia acumulada. Retiradas as marcações de piloto/experimental dessa apresentação.

Dados reproduzíveis: [fonte editorial](../design/terras-despertas/fechar_edicao.py), [textos completos](../design/terras-despertas/cartas-edicao-v1.md), [galeria](../design/terras-despertas/galeria-edicao-v1.html). `src/data/terras-despertas.json`, `terras-edicao.json`, `terras-decks.json` e `terras-edicao-identity.json` são os dados do runtime. As 12 primeiras conservam IDs TD-P01–12 por compatibilidade com listas próprias; as novas usam TDP-013–060. Nenhuma marca de protótipo é impressa nas frentes.

## Regras e auditoria

As novas cartas usam operações já suportadas: dano, cura, compra, suporte, retorno, recuperação/pagamento de Cinzas, inspeção privada do Véu/topo, reposicionamento e auras. Não há efeito somente ilustrativo nem escolha do humano resolvida silenciosamente.

Correção do motor: alvos nomeados `attacker`, `defender` e `event_source` agora também respeitam `max_cost`; isso impede Espelho da Água Quieta de devolver atacante acima de custo 3. O motor 0.10 foi congelado antes da correção para conservar replays históricos. Habilidades “Ao morrer durante seu turno” continuam restritas ao turno do dono; Memória das Sementes reage no turno rival como Prenúncio.

Ajuste editorial antes da publicação: Dívida do Primeiro Marco compra 1 e perde 1 de Vida; com Presença de Sombra 3 compra 2. Evita oferecer compra 2 universal por apenas 1 energia de armação. Isso é julgamento de design, não prova de equilíbrio. A matriz automatizada mede execução, conservação, privacidade e determinismo, não força relativa humana.

## Compatibilidade e operação

- `terras-v1`: conjunto completo; `ves`: 80 VES; `terras-pilot-v1`: compatibilidade da seleção histórica de 12, sem aceitar as 48 novas. API sem conjunto continua VES por compatibilidade.
- Interface usa o conjunto completo por padrão; convites confirmam regras/conjunto antes de entrar. Solo, amigos, bot, replay e revanche usam os mesmos dados.
- 0.11: porta 4187, `dist-v11`, banco exclusivo `saves/rooms-terras-complete-v1.sqlite`, launcher `Iniciar-Edicao-Completa.ps1`. Launcher geral delega; internet passa a sugerir 4187 sem abrir túnel automaticamente.
- Não migrar bancos vivos. 0.10/4186 e sua sala existente preservadas. 4184/4185 estavam sem listener nesta rodada; seus saves e builds permanecem. Engine/decks/catálogo 0.10 congelados em `src/engine/legacy/*-v10.ts`.
- Dados e 80 imagens VES preservados; os arquivos históricos do piloto não foram reescritos. As novas frentes só entram no public e no build 0.11.

## Aceite e limites

Edição funcional completa: todas as cartas habilitadas, textos/frentes/símbolo, seis decks, validação de regras e fluxos de persistência. [QA executado](../qa/terras-v110/README.md). Imagens revisadas nas cinco pranchas e amostras de texto longo; a inspeção gráfica do jogo em navegador está indisponível nas configurações atuais do Work. Não declarar captura de gameplay novo, FPS, qualidade sonora ou equilíbrio humano como medidos. O parecer “está bem divertido” é do usuário sobre a versão anterior; não é playtest das 48 cartas novas.
