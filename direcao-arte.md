# Direção visual — Wizards Battle

## 24/10/2026 — Selo e cartas completas de As Terras Despertas, WB-D27

Refinamento da direção aprovada Bestiário em Foco:48ilustrações novas em tinta/aquarela sobre marfim, com as molduras existentes. Pedido explícito para substituir a sigla por selo; novo glifo de vale, sol e raízes nativo nas60frentes e SVG nosmetadados, metalporraridade. Sem nova definição de identidade/mesa. [Pranchas/galeria/procedência/prompts](arte/terras-despertas/edicao-v1/README.md). Todas as60revisadas emcinco pranchas e3frentes individuais; VESintacta. Não alegar validação de escala/hover/mesa por navegador, indisponível noWork nesta rodada.

WB-D26 /24/10: refino na direção existente Atlas C/Santuário A. [WB-011](specs/WB-011-feedback-causal.md): antecipação/avanço/impacto/retorno, frente nativa em destaque, ligação âmbar origem→alvo, valores e destinos distintos para dano/cura/reforço/morte/retorno/expiração. Narrador opaco em ardósia/latão, versão compacta fora do centro da mão; configuração em diálogo sem deslocar o tabuleiro. Som opcional e movimento reduzido. Arte/geometria/frentes preservadas. DOM validado; qualidade em movimento/áudio/FPS não homologada por navegador desabilitado. [QA](qa/feedback-v100/README.md).

Herdada da origem física: **Bestiário em Foco**, decisão D-014. Não é uma redefinição de arte. Molduras, ícones, Essência e ilustrações das cartas devem vir da exportação existente, preservados. [Referência e limites](../../ideias/duelo-de-magos/arte/referencia-fixa/README.md).

Primeira mesa: fundo escuro, contraste de ouro/papel, zonas legíveis e presença por escola. É aplicação funcional candidata da identidade existente, sujeita à revisão humana. Novas direções para o ambiente da mesa, se solicitadas, devem apresentar alternativas comparáveis.

## Revisão de UI 0.2 — WB-D06

**Atualização WB-D07 / 23-10:** refinamento solicitado a partir da captura do usuário: prévia grande próxima da mão, texto acessível ao lado da arte, fontes de UI maiores, mão em gaveta que se sobrepõe ao campo e mira de ataque sem carta flutuante. Implementado em 0.2.1, mantendo a identidade e as frentes; revisão visual pelo agente pendente por browser desativado. Ver [QA](qa/legibilidade-v021.md).

Usuário rejeitou a mesa 0.1 como amadora e pouco clara. A revisão preserva a direção das cartas e refina composição/interação: fileiras centrais, áreas laterais nomeadas por função, mão em leque, detalhes flutuantes, paleta escura quente e dourado, destinos em verde, dano em coral e cura em verde claro. Sem gerar/substituir ilustrações ou cenário. Não é aprovação da nova mesa; layout/fluidez precisam de revisão em movimento.

Prévia acompanha ponteiro; 7 px distinguem clique/drag; retorno em destino inválido; linha de ataque; transição de posição ~380 ms, saída ~420 ms e dano ~1100 ms; movimento reduzido respeitado. Tempos são parâmetros, não medições de desempenho. [Contrato](specs/WB-002.md).

Em 22/10/2026 a ferramenta respondeu **“Local browser use is disabled in Work settings”**. Revisão visual real da 0.2 pendente de reativação. Não reutilizar captura da 0.1 como evidência desta revisão.

Artes de produção vêm do acervo gerado para Véspera, não de Magic. Frentes derivadas de renderização do PDF atual para PNGs web, com manifesto de origem/hash. Imagens originais/PDFs preservados. No hover/inspeção mostrar a frente integral e texto acessível; valores dinâmicos em marcadores separados.

## Extensão da iconografia — edições, WB-D10/11

23/10/2026: usuário pediu símbolo por edição e raridade nas cartas. Extensão da direção já escolhida, sem redefinir ilustrações/molduras ou reabrir estilos do Bestiário. Símbolo original de **VES**: engrenagem envolvendo um coração com pulso/fenda central, ligado ao coração mecânico da cidade. Implementado como SVG nativo em src/web/cards.tsx, não copiado de Magic. Aplicação é proposta visual para revisão, não aprovação presumida.

Mesmo desenho em grafite (comum), prata (incomum) e ouro (rara); texto/abreviação C/I/R na inspeção e no catálogo para não depender de cor. Ícone ocupa um selo na extremidade direita da faixa de tipo (~7% da largura da carta); edição e número completos ficam na consulta. Não recolorir escolas, ícones de tipo ou Essência. Camada vetorial independente das frentes PNG, que mantêm seus hashes originais.

Componente CardFace reutilizado na mão, campo, fontes, encantamentos, cartas reveladas, escolhas, inspeção, zoom, lobby, drag e catálogo; previews continuam flutuantes. Consulta Coleção apresenta os 80 casos e raridades para revisão. Browser desativado em 23/10: pintura, encaixe do selo em todas as molduras/tipos e legibilidade em tamanho pequeno precisam de revisão real antes do aceite. [QA](qa/tcg-v030.md).

## Home — pesquisa e alternativas de 23/10, WB-D13

Usuário rejeitou o lobby com scroll duplo e pediu direções antes de escolher. [A — Santuário do Pulso, B — Ateliê do Invocador, C — Portais de Véspera](arte/direcoes/home-propostas.md): pranchas originais, pesquisa, prompts, paletas, UI, movimento, custos e tradeoffs. Recomendação A; nenhuma direção aceita automaticamente. Cartas Bestiário em Foco mantidas.

Galeria em http://127.0.0.1:4180/estudos/home-presenca.html, inspecionada no browser real nesta rodada, com comparação de presença em aba interna. Não é implementação da nova home jogável. Texto/símbolos gerados nos conceitos não substituem a iconografia aprovada na produção.

## A consolidada — WB-D14, Santuário 0.5.0

Usuário escolheu explicitamente A e pediu máxima fidelidade. A home usa o mesmo PNG da prancha, sem reinterpretação por CSS ou regeneração: cinco alvos operáveis nas placas e deck ativo dinâmico. Proporção preservada; margens recebem fundo desfocado. Cenário estático, microfeedback por hover/foco/pressionado. Não declarar coração animado, áudio ou novos assets em camadas ainda inexistentes.

Dois ambientes internos produzidos por imagegen integrada com a referência A: bancada de decks e arquivo da coleção. [Assets e prompts](arte/santuario-producao-v1/prompts.md), cópias de runtime em src/public/arte/. Molduras metálicas, azul de pedra/latão/âmbar, áreas escuras de leitura e controles HTML acessíveis. Nenhuma frente das 80 modificada; hashes no [QA](qa/santuario-v050/artes-integridade.json).

Home e preparação sem scroll de página verificadas no browser em 1366×768; home também medida em 1920×900. Editor/coleção inspecionados com rolagem própria da lista. 1920×1080 e campo com dois contadores ainda precisam de inspeção real; browser desativado ao retomar. Arte da mesa de batalha e demais telas devem evoluir na mesma direção, sem reiniciar a escolha artística. [Capturas e limites](qa/santuario-v050/README.md).

## Batalha — alternativas WB-D16 / 23-10

Enquanto testa a 0.5.0, usuário pediu direções da batalha no padrão do santuário. [Três pranchas e contrato](arte/direcoes/batalha-propostas.md): **A — Mesa do Pulso**, física e tátil; **B — Arena do Coração**, círculo ritual; **C — Atlas do Conclave**, mesa estratégica com ardósia/pergaminho. Recomendação A pela continuidade; escolha humana pendente. Referência da home escolhida preservada, não é reabertura da identidade geral.

Imagegen integrada com referência da home A, captura histórica de zonas e duas frentes aprovadas. Prompts e conceito-v1.png por direção em arte/direcoes/batalha-*/; cópias da galeria em src/public/estudos/ e dist-v05/estudos/. Pranchas mostram combate e dois recursos separados. Arte/ícones/valores redesenhados pela geração são ilustração conceitual; não serão assets de cartas de produção. Limites específicos registrados nas propostas.

Galeria http://127.0.0.1:4181/estudos/batalha-direcoes.html. Apenas arquivos estáticos novos, sem build, reinício, mudança de bundle/motor ou acesso à mesa do usuário. Endpoint HTML e três imagens retornaram HTTP 200. Browser desativado na retomada anterior, sem alegar inspeção da galeria em UI real ou revisão de movimento nesta rodada. As imagens foram inspecionadas diretamente; não são capturas de batalha implementada.

## C consolidada — WB-D17, Atlas UI 0.5.1

Usuário escolheu C — Atlas do Conclave e pediu máxima fidelidade. A recomendação A acima é histórica, substituída pela escolha humana. [WB-006](specs/WB-006-atlas-do-conclave.md) define proporção integral da prancha, ardósia/latão/pergaminho e quatro fileiras. Cenário limpo editado a partir de C e medalhões separados em [arte/atlas-producao-v1](arte/atlas-producao-v1/prompts.md); HUD, textos, recursos e cartas são componentes dinâmicos. Frentes aprovadas mantêm seus hashes; ícones novos pertencem somente ao HUD.

Interface servida na mesma 4181, motor e sessão preservados. Recursos recebem pulso, mira curva acompanha ponteiro e mão recolhida abre sobre o campo. Arte de fundo permanece estática; sem alegar arquitetura animada ou FPS medido. 120 testes/build/estáticos aprovados. [QA](qa/atlas-v051/README.md): browser bloqueado, comparação visual e movimento ainda pendentes. A prévia isolada não é screenshot de partida legal nem aceite final.

Revisão posterior após reiniciar o aplicativo: navegador voltou; capturas reais da fixture em 1366×768/1920×900/1920×1080 e cenário cheio Full HD no QA. Materiais e quadro C preservados; badges no canto superior liberam atributos, pilhas centralizadas. Hover móvel medido em dois pontos e arrastar de ataque encaminhado na prévia. Sem medição de FPS/aceite artístico final. Servidor precisou ser iniciado novamente: processo anterior e partidas em memória já estavam encerrados.

## Menus opacos — WB-D21

Usuário rejeitou transparência de fundo nos menus. Preferência vigente: painéis sólidos, sem aparência de vidro ou imagem do cenário sob textos. Preparação, gerenciador, coleção e guia usam gradiente totalmente opaco entre ardósia #23333f/#14212c/#101a23, com moldura de latão. Overlays de menu em #0b1219, sem backdrop-filter. Bibliotecas, editor, cabeçalhos, detalhes e entradas têm superfícies próprias opacas; seleção de deck em bronze/ardósia com borda clara. Inspeção de carta no Atlas também opaca.

Home ilustrada A, mesa C, frentes e geometria preservadas. Não aplicar fundos retangulares novos sobre a moldura pintada do tabuleiro, conforme WB-D18: a preferência trata das superfícies de menu/leitura. [QA/capturas](qa/menus-opacos/README.md), browser real em Full HD e guia em 1366×768; sem aceite humano automático.


24/10/2026 · WB-D22: polimento 0.7 mantém Atlas C, Santuário A e menus opacos. Faixa compacta de conexão/concessão e sala de espera em ardósia/latão; jogador humano usa o medalhão de maga existente, sem gerar nova identidade visual. Foco não desloca a mesa; animações reiniciam entre rodadas. [Capturas reais e método](qa/amigos-v070/README.md). Aceite visual humano não presumido.
