# WB-008 — polimento da mesa e duelos com amigos

24/10/2026 · WB-D22 · aplicação 0.7.0 / 4183 / dist-v07.

Pedido autorizado: fechar o polimento da mesa e implementar jogar com amigos; usuário especificou LAN e internet. Refinar a direção Atlas C existente, sem redefinir arte ou regras de VES. Preservar builds/instâncias anteriores, frentes e Escola/rejogo.

## Contrato entregue

Modos Solo, Criar sala e Entrar por convite na preparação; cada pessoa escolhe modelo ou lista própria validada (40 cartas/até três cópias). Variante é escolhida pelo anfitrião; convite com 80 bits aleatórios não concede controle sobre nenhum assento já ocupado. Sala só começa após dois jogadores. Credencial aleatória própria de 192 bits por assento; chave de entrada/criação permite repetir pedido após perda de resposta, sem reservar outro assento. Terceiro jogador bloqueado. Visão sempre filtrada pelo assento; seed/config, mão e escolhas privadas não são publicados durante a partida. Bot proibido em sala humana. Sem chat/matchmaking.

Polling de um segundo com limpeza ao mudar token/desmontar; reconnect conserva chave, sem apagá-la em erro transitório. Revisão monotônica e ID de ação obrigatório no PvP, recibo persistido antes da resposta; duplicata idêntica retorna estado atual, ID reaproveitado com outra ação e revisão atrasada retornam 409. Cliente repete automaticamente transporte uma vez com a mesma chave, reconsulta estado em conflito. Não promete execução offline de jogadas.

Snapshot SQLite/WAL com synchronous FULL antes de confirmar; alterações trabalham sobre cópia para que erro de persistência não avance o estado em memória. Convite/assentos/listas/config/estado/fila/escolhas/histórico/revisão/recibos/rodada persistidos. Arquivo com versão desconhecida impede iniciar, preservando dados. Snapshots de QA VES 0.6 da mesma entrega recebem metadado 0.7 sem reexecutar a partida. Concessão explícita, inclusive fora do turno, registra derrota no replay; revanche exige dois aceites e alterna o primeiro jogador, com as mesmas listas.

Mesa se orienta pelo assento autenticado: próprio lado embaixo, próprios destinos de fontes/fileiras/magia, alvo rival correto, decisões e vitória relativas. Cancelar por Esc/pointercancel/blur/aba oculta; soltura revalida posição final. Ações acessíveis por clique/teclado, foco sem rolar tabuleiro, movimento reduzido e reset das animações na revanche. Menus opacos.

## Rede e limites

Padrão localhost; WB_HOST=0.0.0.0 habilita LAN. Internet por túnel HTTPS temporário cloudflared oficial, com launcher verificando SHA-256. Instância usa apenas dist-v07 e saves próprios; não expõe fontes/saves pelo HTTP. API limita tamanho e frequência, valida Origin e assento, sem CORS aberto. Piloto de dois amigos, uma instância por banco; hospedagem permanente, contas/recuperação entre dispositivos, matchmaking e produção pública em escala ficam fora do recorte.

## Evidência e aceite

[QA completo](../qa/amigos-v070/README.md): build/typecheck, regressões, testes de sala, HTTP com dois clientes/concorrência/reinício, percurso legal no navegador, sigilo de decisão do convidado, concessão/revanche, layouts reais em frames de desktop e amostra rAF. Fechamento técnico do recorte; não substitui parecer humano de estética, equilíbrio ou diversão.
