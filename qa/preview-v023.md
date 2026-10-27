# QA — prévia seguindo o mouse 0.2.3

23/10/2026. WB-D09: usuário rejeitou a ampliação fixa da 0.2.2 e pediu prévia flutuante acompanhando o mouse durante hover.

- main.tsx captura mouseenter/mousemove, guarda coordenadas em ref e atualiza apenas a posição do painel a cada frame solicitado. Não há setState por pixel. presentation.ts calcula afastamento de 20 px, troca de lado e limites da janela; readability.css mantém hover transparente ao input. Campo e mão usam esse comportamento. Foco por teclado permanece ancorado na carta.
- Mouseleave fecha a prévia transitória e cancela frame pendente; clicar mantém inspeção e ações acessíveis após sair da carta. Drag/ataque continua suprimindo a prévia. Imagens originais e motor inalterados.
- **60 testes aprovados**, [JSON](preview-v023-tests.json), incluindo três casos novos: seguimento X/Y e fechamento ao sair; mão flutuante com clique/Esc; troca de lado e clamp. Asserções de movimento usam DOM simulado e requestAnimationFrame, não pintura real.
- `npm run build` aprovado, incluindo TypeScript. [HTTP](preview-v023-http.json): JS/CSS novos com 200 e igualdade byte a byte com dist, versão UI 0.2.3, motor 0.2.0, três sessões reportadas. Nenhum restart nesta rodada.

**Pendente:** cua.getState ainda informa “Local browser use is disabled in Work settings”. Não houve captura, medição de fluidez ou teste real do hover. Revisar seguimento contínuo, troca de lado nas bordas, troca entre cartas, mão sobreposta e clique/drag no navegador antes de aceite visual. Progresso único em ../progress.md.
