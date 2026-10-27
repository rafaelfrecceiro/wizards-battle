# WB-010 — Reserva de energia experimental

Autorização WB-D25, 24/10/2026: “vamos implementar para eu testar”. Versão candidata 0.9.0, porta 4185, dist-v09 e saves/rooms-energy-v1.sqlite; preservar instâncias e saves anteriores.

## Contrato

- Config.energyRule: `turn` (regra anterior; padrão quando omitido para compatibilidade) ou `reserve-v1` (experimento). A preparação nova seleciona a reserva por padrão e a envia explicitamente. Disponível com Escola + Presença, tanto VES quanto VES + TDP.
- Reserva é o saldo público de energia de cada jogador. Não é apagada no encerramento, no turno rival nem no despertar seguinte. Nova geração soma ao saldo. Sem teto novo, juros, regeneração automática ou transferência entre jogadores.
- Pagamentos continuam consumindo energia normalmente, sem saldo negativo; todos os requisitos e custos adicionais continuam valendo. Um sacrifício por turno.
- Geração/duração das fontes mantêm o timing de escolas-v1: sacrificar gera e já desconta uma duração; cada despertar próprio gera e desconta novamente. Uma 1×3 produz 1 agora + 1 no próximo turno próprio + 1 no seguinte. Depois vira Cinza; não gera uma quarta vez.
- Expiração/destruição da fonte interrompe produção futura e retira sua Presença; energia já produzida continua na reserva. Escola permanente permanece.
- Guardiã da Cisterna mantém carta/arte/atributos originais. Sua conservação de até 1 é redundante neste experimento: não abre escolha, não acrescenta energia e não impõe limite de 1 à reserva. UI explica a interação no guia e na inspeção. Redesenho da carta fica para balanceamento posterior; não inventar bônus ao testar esta única variável.
- Regra original continua selecionável. Nela a sobra expira e a Guardiã conserva até 1 como antes.

## Integração e aceite

Motor autoritativo, visão por assento, saldo no HUD/guia, configuração de salas/convites/revanche e replay. Convidado consulta e confirma a regra do anfitrião antes de ocupar o assento. A API não permite trocar a regra de uma partida existente. Rejeitar valores forjados e combinações incompatíveis sem criar/alterar salas.

Congelar motor/decks/catálogo 0.8 para replays; não reinterpretar seus históricos como reserva. Não migrar bancos vivos para o experimento. Testes de persistência em diretórios isolados.

Verificar: exemplo 1×3 com/sem gastos; múltiplas fontes; saldo no turno rival; destruição/expiração e Cinzas; pagamentos/ilegalidade; Guardiã nos dois modos; configuração de convite/revanche; reinício de SQLite; replays antigos/novos; duelos completos VES/TDP e percurso real de navegador. Automação não homologa ritmo/diversão/equilíbrio.
