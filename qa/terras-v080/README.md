# As Terras Despertas — piloto jogável 0.8.0

24/10/2026 · WB-D24 / WB-009 · passos 1–3 entregues tecnicamente. Equilíbrio e diversão humanos continuam pendentes.

## Como acessar

**http://127.0.0.1:4184/** → Jogar → Conjunto de cartas → **Experimental — Véspera + 12 de As Terras Despertas**. Escolher modelo Terras ou lista própria mista; solo e salas por convite usam o mesmo conjunto. Véspera com 80 cartas é o padrão. Coleção → Edição TDP mostra as 12.

Três modelos de 40: Terras — Manada do Vale (Chama/Raiz), Nascentes Vivas (Raiz/Maré), Nomes e Brasas (Chama/Sombra). Convidado consulta metadados do convite e confirma o conjunto; não há mistura silenciosa de conjuntos. Piloto só usa Escola + Presença.

`Iniciar-Terras-Despertas.ps1 -Rede` executado desde a porta vazia: build, typecheck e inicialização reais. Instância própria dist-v08 / saves/rooms-terras-v1.sqlite. Testes HTTP usam bancos/porta efêmeros na subpasta http-* desta pasta. Não usar dois servidores no mesmo banco.

## 1 — Auditoria

[Comparação individual com VES](../../design/terras-despertas/auditoria-v02.md), [dados auditados 0.2](../../design/terras-despertas/cartas-piloto-v02.json), [textos completos](../../design/terras-despertas/cartas-piloto-v02.md) e [frentes revisadas](../../arte/terras-despertas/piloto-v02/README.md). Proposta 0.1 preservada.

Garça passa a custo 4, 2/4, Alcance e retorno opcional condicionado; Guardião custa 4; Raízes custa 2 e cura 1 de cada monstro, distinguindo-se de Passagem Viva. Restantes mantêm números iniciais, com alvos/custos/condições precisados. TDP tem cinco comuns, seis incomuns, uma rara; classificação para teste, sem quotas obrigatórias.

## 2 — Contrato e efeitos

[WB-009](../../specs/WB-009-terras-piloto.md): bônus de Presença materializado no começo da resolução, conservado na escolha e aplicado ao mesmo alvo. Própria entrada conta; Escola acumulada não substitui campo. Fonte expira normalmente; híbridas verificam cada escola; Ímpeto não renova ataque; temporários expiram.

Lia permite escolher topo/fundo e ordenar as duas cartas, com identidades só para seu dono. Catadora exige três Cinzas no mínimo (alvo + duas outras), reserva o alvo e mantém a recuperação privada na mão. Mortes seguem no descarte. Sem restrição nova de rejogo/UID ou janela de interrupção.

## 3 — Implementação e evidências

- **380/380 testes aprovados**, [relatório final](regressao-final.json). Auditoria das 80 VES e 12 Terras; limiares/negativos, alvo único, híbridas, expiração, cura parcial, reserva/pagamento, consulta privada/reordenação, modelos, salas, coleção/editor/preparação e replay 0.7 congelado.
- **108/108 duelos automatizados completos**, [relatório](simulations.json): três modelos Terras × nove adversários × dois assentos × duas iniciativas. As 12 foram conjuradas pelo bot; 40 peças por jogador, vagas/energia e Escola monotônica preservadas, replay completo idêntico. Conjuração não prova que todo bônus aconteceu; cenários dirigidos verificam os efeitos.
- **HTTP em processo isolado**, [relatório](http.json): 309 chamadas de API, 124 POSTs e 144 verificações incluindo ações repetidas. Rejeição de conjunto/variante/lista inválidos; metadados mínimos, confirmação do convidado, sigilo por assento; reinício real durante consulta privada de Lia e posteriormente em partida; replay, revanche, lista própria e 12 PNGs servidos byte a byte iguais. Amostra HTTP de até 110 ações pode terminar por concessão; término natural é verificado separadamente nas 108 simulações.
- `npm run build` aprovado: tsc sem erro + Vite em dist-v08, CSS 77,22 kB; JS principal 370,73 kB (107,20 kB gzip). Sem dependência nova.
- Bot heurístico, limitado à visão autorizada; avalia bônus/entradas/seleção revelada e custo de oportunidade de sacrificar apoio. A primeira bateria conjurou 11/12, com Santuário sempre sacrificado. Ajustado valor do encantamento ativo e preservação quando há outra fonte equivalente; bateria final cobre 12/12. Não demonstra força estratégica avançada ou equilíbrio humano.

## Browser e preservação

Percurso real: coleção/preparação em 1280×720, mesa capturada em 1037×884 (tamanho natural do navegador na captura). Coleção TDP/12 e Garça revisada; copiar Nascentes no editor, salvar lista QA de 40, preparar explicitamente piloto e iniciar contra Nomes e Brasas; mão mista, fontes/Escola e fases, conjuração da Bruma e do Javali, Raízes como fonte e retomada da mesma mesa após recarregar. [Coleção](colecao.png), [preparação](preparacao.png), [mesa](mesa.png). Capturas não substituem parecer humano sobre arte ou ritmo. Demais resoluções do novo piloto não homologadas nesta rodada.

Na revisão corrigida indicação “Amigo conectado” indevida em solo experimental; status agora mostra Autômato, coberto por teste. Build estático atualizado sem reiniciar a instância ou perder o duelo QA.

[Operação e integridade](operacao.json): 80 frentes VES comparadas ao manifesto de origem, **zero hashes diferentes**. 4183 permaneceu em 0.7.0 e não foi reiniciada. Seus saves/túnel não foram usados pelo piloto. Motor/decks/catálogo 0.7 congelados em src/engine/legacy para replay; caminhos históricos anteriores preservados.

## Limites e próximo passo

São **12 cartas experimentais**, não expansão completa de 60. Símbolo definitivo aberto; TDP é identificação textual provisória. Raridades, custos/Essências e artes novas sem aceite humano final. Sem campanha, aquisição/posse, ranking ou rotação.

Não houve sessão de playtest humano com amigo, teste em dois dispositivos físicos ou homologação de equilíbrio. Próximo passo 4: jogar listas mistas e observar retomadas, clareza Escola/Presença e variedade. O túnel 0.7 existente não publica automaticamente a 0.8; Iniciar-Internet.ps1 usa 4184 por padrão para abrir outro túnel quando solicitado. LAN habilitada pelo launcher; nenhum firewall/roteador alterado.

Referência técnica consultada: [React — useState](https://react.dev/reference/react/useState). Consulta web à documentação Node 24 SQLite falhou; a API de persistência existente foi reutilizada e validada por reinício real isolado.
