# QA — habilidades e prévia local 0.2.2

23/10/2026, WB-D08. Entrada: capturas reais do usuário da **0.2.1**, [badges](referencia-badges-usuario-v021.png) e [prévia lateral](referencia-previa-usuario-v021.png). Não são evidência visual da revisão nova.

- Confirmado em dados/engine: Guia dos Túneis concede Alcance aos monstros de Sombra na frente enquanto está na retaguarda; Corredor das Brasas tem Ímpeto próprio. Badge anterior mostrava apenas um símbolo, escolhendo uma prioridade entre habilidades.
- UI 0.2.2 mostra todas as habilidades por nome, com tooltip e seção explicativa na inspeção. Origem identificada com informação pública e keywords do servidor. Estatísticas atuais e estado do Suporte também visíveis. Nenhuma mudança de regras/arte original.
- Prévia do campo expande sobre a posição da carta, com âncora DOM capturada por hover/foco, medição do painel/carregamento da imagem e clamp das bordas. Hover não captura o ponteiro. Alternativas de clique/teclado preservadas.
- **57 testes aprovados**, [JSON](habilidades-v022-tests.json): 39 motor/mapeamento + 18 UI/posicionamento. Cinco casos novos cobrem origem, simultaneidade, remoção do suporte, âncora local e bordas. Testes anteriores de ataque/drag/gatilhos mantidos.
- `npm run build` aprovado, incluindo TypeScript. [HTTP estático](habilidades-v022-http.json) confirma JS/CSS com 200 e igualdade byte a byte com dist, marcadores 0.2.2; servidor/motor e duas sessões em memória preservados. Não foi necessário repetir autoplay, pois o motor não mudou.

**Limitação real:** `cua.getState()` retornou “Local browser use is disabled in Work settings” nesta rodada. Não há screenshot novo do agente, medição de FPS ou validação de hit testing/pintura. Revisar no navegador, especialmente preview ao mudar cartas e junto às bordas, várias habilidades, carregamento da arte, foco/clique e drag sem interferência da ampliação. O teste de geometria usa dimensões simuladas; não comprova o layout pintado. Progresso único em ../progress.md.
