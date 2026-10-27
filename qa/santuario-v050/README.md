# QA — Santuário e Escola/Presença 0.5.0

23/10/2026. Implementação entregue para revisão humana em **http://127.0.0.1:4181/**. Instância exec 67805, build separado `src/dist-v05`; 4180/4179 preservadas. Servidor confirmado acessível ao retomar a sessão.

## Funcional

Nota de rastreabilidade, 23/10/2026: os scripts HTTP antigos foram executados durante WB-007 e sobrescreveram `http-preset.json`/`http-custom.json` com resultados 0.6.0. As cópias dessa execução estão em [ves-v060](../ves-v060/README.md); os scripts passaram a gravar nessa nova pasta. Os números 0.5.0 abaixo são o registro histórico desta página, não os relatórios JSON atuais. Os JSON originais sobrescritos não foram recuperados. Demais evidências desta pasta permanecem preservadas.

- `npm run build` aprovado: TypeScript sem erros; JS 342,26 kB / 99,19 kB gzip, CSS 58,20 kB / 14,24 kB gzip. Arte raster é carregada separadamente; esses tamanhos não medem memória/fluidez.
- [Relatório completo](testes.json): **118/118 aprovados**, motor, UI, catálogo, decks, persistência, modelo anterior, Escola e ponte de transferência. Execução final concluída após a retomada da sessão.
- [Escola](escolas-testes.json): 11 cenários, incluindo oito partidas bot × bot, conservação de 80 cartas, avanço monotônico e replay idêntico. Sem taxa de vitória usada como prova de equilíbrio.
- [HTTP preset](http-preset.json): partida completa com Escola, 180 requisições / 171 ações / 44 turnos; autorização, origem, atomicidade, privacidade e replay ao terminar.
- [HTTP custom](http-custom.json): lista personalizada, rejeição de listas inválidas, snapshot independente, replay e privacidade; 88 requisições / 78 ações / 15 turnos.
- Ponte local testada em DOM simulado com validação de origem/janela/nonce, revalidação da lista, novos IDs, timeout e preservação do armazenamento. No browser real a biblioteca 4180 desta sessão estava vazia e o aviso correspondente foi exibido. Não alegar transferência real de uma lista existente.

## Fidelidade visual e origem

[Manifesto de hashes](artes-integridade.json): home usa o mesmo PNG da direção A, SHA-256 `D5D58CDC69ED627D31F95C521AFC565DB0B18226186A117BA6D3DA49D39A1429`; 80 frentes comparadas à 0.4.0, todas preservadas. Cenários internos gerados por imagegen integrada com A como referência, salvos em [arte/santuario-producao-v1](../../arte/santuario-producao-v1/prompts.md) e `src/public/arte/`. Sem assets externos incorporados.

Home: imagem inteira em escala proporcional, placas com botões acessíveis sobrepostos; texto do deck ativo é dinâmico. Nas proporções diferentes, completar margens com fundo desfocado em vez de cortar a arte aprovada. Microfeedback por hover/foco/pressionado; cenário de fundo estático nesta entrega, sem animação de coração ou áudio.

## Inspeção real executada antes da interrupção

- Home **1366×768**: viewport e documento 1366×768, cinco botões dentro da janela; [captura](home-1366.png). Preparação de duelo 694 px de altura útil/scrollHeight 694, sem rolagem nesse alvo; [captura](duelo-1366.png).
- **1920×900**: documento 1920×900, cena proporcional 1599×900, sem rolagem de página; [captura](home-1920x900.png).
- Gerenciador com busca/filtros e cópia temporária de Pira 40 cartas; proteção de rascunho ao sair observada, rascunho de QA descartado sem salvar; [captura](decks-1366.png).
- Coleção: 80 frentes, painel com clientHeight/scrollHeight 726 em 1366×768, consulta/lista com rolagem própria; [captura](colecao-1366.png). A ausência de rolagem é requisito da home, não da lista de 80 cartas.
- Preparação também inspecionada na janela natural 1037×884, documento sem overflow e painel 694/694. Gerenciador nessa janela tinha rolagem interna da grade, sem overflow de página.

## Limites pendentes

Ao retomar, `cua.getAXState()` retornou **“Local browser use is disabled in Work settings”**. Não foi possível concluir a inspeção de 1920×1080, resetar o override do viewport ou revisar o campo de batalha com os dois contadores em movimento. Tentativa de screenshot após mudar para 1080 não foi suficiente para confirmar o novo enquadramento; não apresentada como evidência validada. Validação real do hover/foco, tempos/fluidez, mesa com Escola/Presença e resoluções restantes continua pendente. As capturas acima são reais, anteriores ao bloqueio.

Presença forte é infraestrutura testada; não há cartas novas de Presença ou revisão de balanceamento das 80. Montagem/duelos continuam com 49 nomes habilitados. Arte da mesa de batalha, áudio, demais telas e feedback avançado ainda precisam evoluir para o mesmo padrão do santuário. Não há aceite humano final da nova UI.
