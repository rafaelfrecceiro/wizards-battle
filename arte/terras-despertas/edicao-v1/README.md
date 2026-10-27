# As Terras Despertas — arte da edição completa

24/10/2026 · WB-012 · Bestiário em Foco preservado, sem redefinir direção visual.

48 ilustrações produzidas com **image_gen embutido**, uma chamada por carta nova TDP-013–060. Modo geração de ilustração nova; sem referência visual anexada nessas chamadas. Os prompts descrevem tinta, aquarela/gouache e papel marfim, com silhueta clara e ausência de letras, molduras e UI na ilustração.

- Prompts exatos: [ilustracoes-edicao-jobs.json](../../../design/terras-despertas/ilustracoes-edicao-jobs.json).
- Originais retornados pela ferramenta e caminhos preservados: [procedencia.json](procedencia.json). Cópias de produção em `ilustracoes/`. Não são assets extraídos de outro jogo; não atribuir licença de terceiros inventada.
- As 12 ilustrações iniciais vêm do atlas próprio [piloto-v02](../piloto-v02/README.md); cópia preservada em `atlas-original.png`, com procedência histórica naquele diretório.
- Composição determinística de molduras/componentes próprios: [renderizar_edicao.py](../../../design/terras-despertas/renderizar_edicao.py). Não altera os bitmaps originais de ilustração; compõe frentes com tipografia, regras, símbolos de escola, atributos, Essência e selo novo.
- Selo vetorial: [simbolo-terras.svg](simbolo-terras.svg), vale com sol nascente e raízes. Metais por raridade. Impresso nativamente nas 60 PNG/WebP; símbolo correspondente nos metadados da interface. O fallback de letras não é usado por TDP.
- [Manifesto de hashes/dimensões/métricas](manifesto.json): 60 frentes de 536×749; fonte de regras 8,8–9,2 pt no documento de composição, altura máxima 24,94 mm. Presença do texto foi conferida visualmente nas pranchas; métrica não substitui inspeção de leitura no jogo.

Inspeção executada: cinco pranchas (todas as 60) e frentes individuais do Grifo, Dívida do Primeiro Marco e Porta do Crepúsculo. Ilustração, nome, requisitos, regras e atributos sem recorte nas amostras; nenhuma sigla ocupa o selo. [Prancha 1](prancha-1.png), [2](prancha-2.png), [3](prancha-3.png), [4](prancha-4.png), [5](prancha-5.png), [galeria completa](../../../design/terras-despertas/galeria-edicao-v1.html).

PNG finais copiados para `src/public/cartas` e `src/dist-v11/cartas`; 80 PNG VES comparados por SHA-256 com dist-v10, todos iguais. Builds históricos permanecem independentes. Navegador local indisponível no Work; não alegar inspeção real das 60 em hover/mesa nem validação de escala de UI.
