# QA da prévia de cartas — 24/10/2026

Escopo: composição e consulta de propostas. Não valida legalidade no motor, equilíbrio ou diversão.

- 12 IDs editoriais únicos; 12 PNGs de 536×749 e 12 WebPs. Três pranchas de quatro cartas inspecionadas, além dos casos individuais Lince/Catadora. Textos não excederam os painéis do exportador; todos a 9,2 pt no diagrama interno.
- Referência fixa, dados, prompt integral e hashes ligados no [README da entrega](../README.md) e manifesto. Original do atlas preservado.
- Galeria autocontida final: 964.837 bytes no disco, abaixo de 1 MB. Sem fetch, recursos remotos ou acesso a partidas.
- Navegador real IAB: Próxima mudou Lince → Javali; miniatura selecionou Catadora e depois Lince; nome, atributos, imagem, efeito e estado selecionado atualizaram. Na versão final, 13 imagens carregadas (principal + 12 miniaturas), todas com largura nativa 536.
- Layout desktop observado: raiz 990 px e scrollWidth 990 px. [Captura real](galeria-desktop.png).
- Tela de 360×800: raiz 298 px, scrollWidth 298 px e estágio em uma coluna de 298 px, com 12 miniaturas. [Captura real](galeria-mobile.png). Override de viewport removido após conferir.
- Prévia em `http://127.0.0.1:4194/galeria-browser.html`, servidor isolado só em loopback. Aba mantida como entrega, sem navegar ou reiniciar mesas do jogo.

Reparo na produção da prévia: RefTitle omitia a barra entre Força/Vigor; usado RefBold na mesma chapa, renderizações/galeria regeneradas e leitura `3 / 3` conferida. O primeiro arquivo de template não preservou o marcador ao lidar com CRLF; corrigido e regeneração concluída. O adaptador usa agora galeria-template.html separado. Sem alterações nos scripts ou cartas da origem.

Pendências: opinião do usuário sobre artes e funções, revisão das raridades, custos/Essências e compatibilidade com VES; depois implementação e testes de cartas/mecânica/bot/replay em recorte próprio. Nenhum resultado de duelo com este lote foi produzido.
