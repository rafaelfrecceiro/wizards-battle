# QA — polimento e amigos 0.7.0

24/10/2026 · WB-D22 · build `src/dist-v07` · servidor separado na 4183.

## Resultado técnico

Salas humanas por convite, dois assentos privados, sincronização por polling de 1 segundo, reconexão, snapshots SQLite confirmados antes da resposta, controle de revisão, deduplicação persistida, concessão e revanche por dois aceites. Solo também persiste. Nenhuma alteração de custos/atributos/textos/raridades das 80 cartas. Escola/rejogo preservados; a ação explícita de concessão passa a ter registro reproduzível no motor 0.7. Replays 0.6 aceitos com as mesmas regras de cartas, versões 0.2/0.4/0.5 continuam no motor histórico.

- **330 cenários distintos aprovados**: regressão completa com 329 casos e checagem final de UI/movimento com 44, sobrepostos; [resumo agregado](validacao-resumo.json). [Regressão completa](tests.json), [verificação final do polimento](polimento-final-tests.json). O arquivo interacao-tests.json é execução intermediária anterior à correção da fixture de fonte: VES-002 expira imediatamente na base; o teste final usa VES-009. Não é o resultado final.
- [HTTP isolado](http.json): 18 verificações, 26 requisições, entrada concorrente, privacidade, repetição da mesma ação, revisão atrasada, concessão/replay/revanche, reinício real do processo e retomada solo. Cada execução usa sua própria pasta http-isolado-*; não toca saves reais.
- [LAN + HTTPS](https-lan.json): oito requisições, host via LAN e convidado via túnel público; cabeçalho Origin real, assentos privados, sincronização, resultado e replay. [Acessos](acesso.json).
- [Integridade](integridade.json): 80/80 frentes com SHA-256 iguais entre public, dist-v06 preservado e dist-v07.

## Inspeção real e polimento

Dois clientes IAB independentes, mesmo computador: host Pira, convidado Ilusão, convite e seleção de deck pela interface. Mãos mantidas, fontes, Escola/Presença, arrasto legal de Guia dos Túneis para retaguarda, reposicionamento para frente, ataque inválido cancelado sem ação e ataque válido ao mago (15→14). Reload do host e convidado preservou assentos diferentes. Reinício somente da 4183 criada nesta rodada preservou os snapshots; instâncias anteriores não foram encerradas.

Teclado: Enter na carta abre ações e foca a primeira; fonte confirmada por Enter. Convidado conjura Ajustadora dos Canais e decide topo/fundo por teclado. [Decisão privada](decisao-privada-convidado.png), [foco e sigilo](privacidade-browser.json): topo Ceifador das Válvulas só no cliente autorizado. Resultado relativo correto, concessão confirmada e revanche aceita pelos dois. [Nova rodada](revanche.png). Gatilhos/ordem, alvos, zonas, cancelamento por Esc/pointercancel/blur, atomicidade e movimento reduzido também têm cenários automatizados; não equivalem a executar manualmente todas as combinações das 80 cartas.

Correções: destino de drop recalculado na soltura; cancelamento ao perder foco/ocultar a aba; retorno sem animação quando movimento reduzido; foco de decisões e resultado; bloqueio de rolagem programática que desalinhava o tabuleiro durante ações; reset da memória de animação entre rodadas para não simular cura/entrada de cartas da partida anterior. Frentes e molduras aprovadas preservadas; menus continuam opacos.

[1280×720, ataque real](ataque-real-1280.png), [1366×768](mesa-1366x768.png), [1920×900](mesa-1920x900.png), [1920×1080](mesa-1920x1080.png), [medidas](resolucoes.json). O override de viewport do IAB foi anunciado mas não aplicado: ficou em 1280×720. Para testar os três layouts maiores, foi usado iframe de dimensões reais, com a própria partida autenticada, capturado em página inteira. Não são três monitores físicos. As imagens nomeadas por resolução foram substituídas pelas capturas corretas dos frames; medidas registram o método.

[Intervalos de quadros](frames.json): amostra móvel de 180 frames em 1280×720, média próxima de 16,67 ms, p95 próximo de 16,8 ms. Probe opt-in `?qa=frames`, com animações CSS e atualização de reposicionamento remoto. Mede cadência rAF neste ambiente, sem alegar profiler GPU, latência ponta a ponta, desempenho universal ou captura frame a frame da flecha. Não há probe ativo no fluxo normal.

## Acesso e operação

- Local: http://127.0.0.1:4183/.
- LAN observada: http://192.168.15.27:4183/. IPv4 pode mudar; não foi criada regra de firewall.
- HTTPS temporário desta execução: https://pretty-packet-fleece-thermal.trycloudflare.com/.
- [Convite HTTPS pronto](convite-https.png). Criar sala a partir do endereço que o amigo usará, ou entrar pelo código no mesmo servidor. Convite não é credencial do assento.
- `Iniciar-Wizards-Battle.ps1 -Rede` inicia LAN; `Iniciar-Internet.ps1` verifica/reutiliza a 0.7 na porta, inicia se ausente e abre túnel temporário. Caminho com servidor existente e túnel foi executado; bootstrap automático com servidor ausente foi analisado, não exercitado pelo launcher. O servidor em processo separado foi exercitado nos testes HTTP.
- cloudflared 2026.10.3 oficial, executável portátil em tools/cloudflared, SHA-256 verificado contra digest da release; não instalou serviço, não alterou roteador/firewall. [Documentação oficial](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).
- Save em `saves/rooms-v1.sqlite` fora dos estáticos, tokens persistidos apenas como hashes. Não apagar/limpar essa pasta. Uma instância por arquivo; backup SQLite precisa incluir WAL ou ser feito com servidor parado.
- Decks locais continuam por origem. Para levar listas à 4183/HTTPS, exportar/importar backup JSON no gerenciador; não migrou tokens de versões antigas.

## Limites restantes

Aceite estético e balanceamento humanos não presumidos. Não houve dois dispositivos físicos, rede móvel de terceiro, teste de carga pública ou auditoria de segurança de produção. Túnel público atravessou Cloudflare com HTTPS e foi testado, mas é temporário, depende do PC/servidor/túnel ligados, muda de endereço ao reiniciar e não oferece garantia de uptime. Origem nova tem armazenamento de navegador separado; preserve o acesso no endereço atual. Para uso contínuo, falta escolher hospedagem/domínio estável e política de recuperação de conta/dispositivo; contas, matchmaking/ranking, campanha e economia não entram no recorte.

Referências técnicas consultadas: [React useEffect](https://react.dev/reference/react/useEffect), [Node SQLite](https://nodejs.org/api/sqlite.html) e documentação de SQLite indicada na API; APIs usadas foram executadas no Node local 24.19.0 (DatabaseSync). A página principal atual do Node apresenta versão mais nova; a execução e os tipos locais confirmam a API empregada.
