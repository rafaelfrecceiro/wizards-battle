# WB-011 — A mesa conta cada jogada

WB-D26 / 24/10/2026. Usuário relata cartas aparecendo/sumindo durante ações do bot sem explicar a causa e pede polimento geral, movimentação das cartas e ligação visual entre magia/Prenúncio/encantamento e vítima. Implementação na direção Atlas C/Santuário A existente, sem redefinir arte ou reabrir opções.

## Contrato de apresentação

- Fonte autoritativa: cada evento numera uma consequência confirmada pelo motor, com turno, tipo, origem, alvo, valor e causa. Nunca inferir morte apenas porque uma carta saiu do campo. Retorno para mão, custo de sacrifício, descarte, morte e expiração são distinguíveis.
- Resolver em ordem: anunciar carta pública/ativação → mover/conectar ao alvo → impacto e valor → morte ou outra saída com destino. Manter estado visual anterior até a sequência explicar a ação. Cartas recém-conjuradas permanecem visíveis como representações temporárias durante seus efeitos de entrada.
- Monstro atacante avança até alvo e retorna; dano de combate é simultâneo nas regras, com apresentação sequencial dos dois valores. Cada morte aponta o oponente que efetivamente a causou. Um atacante morto por Prenúncio antes do combate não mostra um ataque resolvido fictício.
- Magia mostra a própria frente; habilidades destacam a origem, projetam ligação luminosa ao alvo e mostram valor. Cura e reforço têm linguagem distinta do dano. Mortos viajam ao descarte; fontes esgotadas para Cinzas; retorno à mão não recebe VFX de morte.
- Origem permanece nas escolhas de alvos, curas opcionais e pagamentos/efeitos encadeados. O histórico “Por que aconteceu?” preserva origem → alvo → consequência após a animação.
- Ataque é primeiro anunciado como intenção; se um Prenúncio matar/devolver atacante ou alvo, a interrupção é explicada sem exibir golpe resolvido. Suportes contínuos também anunciam ganho/perda de Força ou habilidade, incluindo a condição de ferido da Cuidadora.
- O autômato só pede outra ação após a apresentação terminar e ainda aguarda um intervalo. Nenhum pedido humano é enviado enquanto a mesa explica um resultado anterior. Escolhas novas só aparecem após confirmar visualmente o snapshot.
- Fila por partida/rodada e sequência de evento; polling não reproduz os mesmos eventos. Primeira conexão/recarga começa do estado atual, sem repetir todo o passado. Revanche/troca de sala cancela animações anteriores. Aba oculta alcança o resultado sem acumular espera.
- Preferências: Cinemático/Rápido e som opcional inicialmente desligado, persistidos localmente. Áudio sintetizado pelo navegador após gesto explícito; sem arquivos/licenças externos. Movimento reduzido preserva valores/explicação/histórico, sem deslocamento. Falha de animação não bloqueia o estado confirmado.
- Menus/painel narrativo opacos, ardósia/latão. Configuração em diálogo com foco e Esc; não deslocar a mesa ilustrada por inserir linhas de controles no fluxo. Aviso ativo central e último acontecimento compacto fora do centro da mão.

## Privacidade e compatibilidade

Eventos públicos nunca expõem nome, frente ou UID de compras rivais, cartas ainda ocultas no Véu ou recuperação privada de Cinzas. Cada ator privado é filtrado por assento no servidor. Uma carta publicamente conjurada/revelada pode aparecer no evento correspondente; consulta privada não equivale a revelação pública. Replay completo mantém a restrição de só exportar após fim.

0.10.0/4186/dist-v10 e saves/rooms-feedback-v1.sqlite isolados. Motor/decks/catálogo 0.9 congelados para replays, preservando cadeia anterior. As partidas em 4185 e seus saves continuam na 0.9. Reserva de energia, textos, números, frentes e regras VES/TDP preservados.

## Aceite e limites

Testes dirigidos de cadeia causal, simultaneidade, cancelamento por Prenúncio, cura/retorno, privacidade, fila/polling/recarga/revanche, DOM/WAAPI simulados, desmontagem/aba oculta e preferências. Partidas completas com estado/RNG/vencedor comparados por ação ao motor 0.9 e replay exato. HTTP e reinício em banco isolado.

Capturas/vídeo reais e revisão perceptiva de movimento dependem do navegador local, desabilitado nas configurações do Work nesta rodada. Não usar teste DOM/simulação como prova de fluidez visual, qualidade sonora ou FPS. Registrar evidências e limites em qa/feedback-v100; progresso somente em progress.md.
