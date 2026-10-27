# WB-009 — As Terras Despertas, auditoria e lote jogável

24/10/2026 · WB-D24 · alvo 0.8.0 / 4184 / dist-v08.

Usuário autoriza os passos 1–3: auditoria comparativa, contrato de Ressonância e implementação das 12 em lote experimental, incluindo bot e replay. Conteúdo em design/terras-despertas e arte/terras-despertas/piloto-v01 fornece a base; revisões são versionadas sem sobrescrever a proposta visual inicial.

## Contrato

- Conjuntos `ves` (padrão; 80 cartas) e `terras-pilot-v1` (VES + 12 experimentais) escolhidos explicitamente ao preparar solo ou criar sala. Piloto usa Escola + Presença; servidor rejeita outras variantes para esse conjunto e deck experimental fora dele. Convidado herda o conjunto da sala e vê sua identificação; terceiro jogador, sigilo e recibos preservados.
- Coleção/decks identificam a edição experimental TDP (12 cartas do piloto, não uma declaração de expansão completa). Biblioteca aceita rascunhos mistos; iniciar exige conjunto compatível, 40/até três cópias e capacidades implementadas. Modelos mistos de exemplo acompanham o lote.
- Ressonância é condição de Presença real. Bônus modifica o próprio efeito, inclusive seu alvo, na resolução; ao abrir escolha, os valores ficam definidos para essa resolução. Não troca Escola por Presença nem reabre uma habilidade depois. Carta entrando conta; magia não conta. Híbrida verifica cada escola. Gatilhos condicionais de encerramento exigem a condição no momento do gatilho e ao resolver.
- Fonte expira normalmente; bônus de Força/Ímpeto termina no encerramento, sem renovar ataque usado. Retorno/rejogo preserva avanço repetido de Escola WB-D15.
- Catadora: alvo Monstro nas próprias Cinzas; duas OUTRAS Cinzas são pagas com escolha do dono. Não selecionar a carta recuperada como pagamento. Recuperação não revela identidade ao rival enquanto vai para a mão. Mortes continuam no descarte.
- Lia: consulta privada de duas cartas, escolha de fundo e ordem do topo pelo dono. Não substituir por duas consultas consecutivas da mesma carta nem revelar identidades ao rival/bot fora de sua visão.
- Bot usa somente informação autorizada, reconhece bônus/recuperação/seleção e respostas. Replays incluem versão e conjunto/listas; VES 0.6/0.7 e versões anteriores conservam caminhos históricos congelados.

## Preservação e operação

Dados/80 frentes VES e dist-v07/saves/rooms-v1.sqlite intactos. Instância nova usa somente saves/rooms-terras-v1.sqlite; QA usa bancos separados. Não reiniciar 4183 nem seu túnel. Launcher dedicado ao piloto; manter acesso a VES anterior explícito. Home/Atlas e menus opacos preservados; alterações de regras/custos refletem nas novas frentes, catálogo e inspeção.

## Evidências necessárias

Auditoria individual das 12 e justificativa dos ajustes; testes de entrada/limiares, híbridas, mesma escolha/alvo, expiração, temporários, cura parcial, pagamento reservado, consulta privada/reordenação e ações inválidas atômicas. Testes de conjunto na API/sala/retomada/revanche e replay antigo/novo. Build/typecheck e regressões relevantes; partidas automatizadas completas com modelos mistos e replay idêntico; percurso real no browser de coleção/editor/preparação/duelo e captura. Testes técnicos não encerram equilíbrio/diversão humanos do passo 4.

## Entrega técnica

Concluída em 24/10/2026 na 0.8.0/4184. [Auditoria 0.2](../design/terras-despertas/auditoria-v02.md), [QA, relatórios e capturas](../qa/terras-v080/README.md). 380 testes aprovados, 108 duelos completos/replays idênticos, 12 cartas conjuradas pelo bot e HTTP com reinício de consulta privada. Revisão no browser e launcher executados. Limites e passo 4 humano permanecem explícitos no QA; não é conclusão da coleção de 60.
