# WB-004 — Gerenciamento de decks e duelos personalizados

23/10/2026, pedido WB-D12. Implementação 0.4.0 em http://127.0.0.1:4180. [GDD](../GDD.md), [QA](../qa/decks-v040.md); progresso único em ../progress.md.

## Fluxo do jogador

Meus decks acessível no lobby e durante partida. Criar lista vazia ou copiar Pira/Queimada, nomear, buscar/filtrar cartas por escola/edição/raridade, adicionar/remover cópias, conferir total, curva e mistura de raridades, salvar rascunho ou deck completo. Editar, duplicar com ID novo e excluir mediante confirmação na UI. Os modelos originais não são alterados.

Jogar com este deck salva e inicia um duelo contra o autômato. No lobby, o jogador pode escolher uma lista salva e o adversário Pira/Queimada, além da variante de fontes existente. Rascunhos incompletos não iniciam duelos. Abrir o gerenciador não substitui a partida; clicar para iniciar novo duelo faz isso explicitamente. Fechar/trocar lista com mudanças não salvas oferece salvar, descartar ou continuar editando. Foco preso ao modal e restaurado ao sair.

## Regras de montagem e autoridade

- Exatamente 40 cartas; até 3 cópias por identidade de regras, agregando entradas duplicadas e reimpressões. Sem quota de raridade, sem cota de tipos e sem limite novo de escolas.
- Conjunto inicial: 49 nomes de Pira/Queimada. O editor mostra somente cartas habilitadas. Carta conhecida mas sem cobertura pode existir em backup/rascunho, porém impede jogar. Carta desconhecida, quantidade não inteira/negativa/acima de três e estrutura inválida são rejeitadas.
- engine/decks.ts centraliza modelos, conjunto habilitado, normalização e validação. O frontend informa erros; o servidor e createGame revalidam independentemente, inclusive se a requisição foi montada fora da UI.
- Nome obrigatório de até 50 caracteres. Nome de usuário não pode substituir modelo ou apontar lista global mutável: lista personalizada é payload explícito. Oponente da API limitado aos dois modelos habilitados.

Config.customDecks guarda snapshot completo normalizado por assento. A configuração é copiada, sem referência à biblioteca do editor. Mudar/excluir um deck salvo não muda partidas já iniciadas. Presets continuam reproduzíveis a partir do nome; personalizados a partir do snapshot. Nenhuma lista ordenada/seed/config rival é adicionada à View. Exportação de replay completo continua apenas após término.

Versão atual wb-0.4.0/rules-0.3-custom-decks, mesmos snapshots das cartas/listas. Replay também aceita o identificador exato da 0.2/0.3 anterior com esses hashes quando não há listas personalizadas; demais versões incompatíveis são recusadas. Reconstrução de partida real da instância antiga foi comparada com o motor novo. Não altera efeitos/custos/raridades.

## Persistência e backups

Biblioteca local na chave wb-decks-v1 do localStorage, envelope schemaVersion 1, revisão, IDs e datas. Persistência por navegador/origem, sem conta ou sincronização em nuvem. A origem atual é 127.0.0.1:4180. Até 100 decks locais; listas incompletas/sem tamanho legal podem ser guardadas como rascunhos.

Dados ilegíveis não são sobrescritos automaticamente. Falha de escrita mantém editor e biblioteca anterior; erro permite exportar backup. Revisão detecta mudanças anteriores ao salvamento e evento storage atualiza a biblioteca de outras abas. Essa conferência é proteção de melhor esforço, não transação ou lock entre processos; evitar edição simultânea da mesma biblioteca. [Contrato da API de armazenamento](https://html.spec.whatwg.org/multipage/webstorage.html).

Exportar backup JSON inclui listas salvas e alterações atuais do editor. Importação valida esquema/tamanho/cópias/IDs de cartas, atribui IDs novos e adiciona listas sem substituir as existentes. Limite de arquivo 1 MB. Backup corrompido ou incompatível falha sem escrever. Backup exportado de armazenamento já corrompido preserva o texto bruto para recuperação, sem promessa de importação automática.

## Servidor e preservação de partidas

Nova instância em **4180**, build em **dist-v04/**. Instância 4179 mantém código em memória, frontend dist/ e mesas anteriores; não encerrada/reiniciada. Atalho/default atualizados para 4180. Os tokens e dados de sessão de 4179 não são migrados entre instâncias. Servidor ainda mantém partidas em memória; decks do navegador são persistência separada.

POST /api/new aceita customDeck { name, cards }, opponent e variant; preset por deck continua válido. Lista inválida não inicia mesa. Replays registram configuração normalizada. Não foram criados endpoints para substituir uma partida existente ou ler bibliotecas de terceiros.

## Validação e limites

97 testes: legalidade, dados persistidos, corrupção/erro de escrita, revisão alterada, importação, edição/duplicação/exclusão/rascunho, perda de mudanças, início de duelo e seleção no lobby. Partidas HTTP completas com preset e personalizado, privacidade e replay idêntico. Compatibilidade real com replay do servidor antigo em mesa isolada de QA. Build/typecheck e arquivos HTTP conferidos.

Browser local desativado impede revisão gráfica/movimento; DOM simulado não comprova layout final. Montagem livre pode criar combinações ainda sem playtest estratégico; validação de regras não demonstra equilíbrio ou força do bot. Habilitar 80 cartas, deck rival personalizado, posse/obtenção, publicação e sincronização entre dispositivos ficam para outros recortes.
