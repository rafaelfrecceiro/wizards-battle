# Menus opacos — WB-D21

23/10/2026 · Refinamento visual solicitado pelo usuário. Disponível na mesma [4182](http://127.0.0.1:4182/); recarregar a página carrega o CSS novo. Motor 0.6.0, processo e sessões preservados.

Alterados somente `src/web/style.css`, `sanctuary.css` e `atlas.css`: overlays em #0b1219 sem backdrop-filter; preparação/decks/coleção/guia com gradientes totalmente opacos de ardósia, sem imagem sob a leitura; superfícies internas sólidas e seleção de deck mais marcada. Inspeção Atlas também recebe gradiente opaco. Molduras, home, mesa e frentes preservadas. A transparência de contêineres geométricos que apenas deixam ver a própria arte pintada da mesa continua conforme WB-D18; não foi introduzida camada retangular sobre suas molduras.

`npm run build`/TypeScript aprovados. CSS 75,40 kB/18,17 kB gzip. Os 309 testes funcionais anteriores não foram reexecutados: correção somente CSS, validada visualmente e por estilos computados.

## Evidências reais

- [Preparação Full HD](preparar-1920.png): fundo sólido, seis decks e seleção em bronze/ardósia; nenhum cenário visível por trás do painel.
- [Decks](decks-1920.png), [coleção](colecao-1920.png) e [guia](guia-1920.png), em 1920×1080.
- [Guia em 1366×768](guia-1366.png): rolagem interna, documento medido em 1366×768; painel de 703 px com conteúdo rolável de 914 px. Viewport restaurado depois.
- [Estilos computados](superficies.json): quatro overlays com `rgb(11, 18, 25)` e backdrop-filter `none`; painéis com gradientes RGB opacos/cores sólidas e opacity 1, sem imagem de cenário.

Aba isolada, sem ações de jogo, alteração de decks ou acesso à mesa do usuário. Inspeção da prévia de carta no Atlas limitada à alteração CSS/build nesta rodada, sem nova partida ou captura desse painel. Aceite artístico final pertence ao usuário.
