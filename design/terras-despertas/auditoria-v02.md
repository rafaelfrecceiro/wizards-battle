# Auditoria estática das 12 cartas — revisão 0.2

24/10/2026 · WB-D24 / passo 1. Comparadas as definições reais das 80 VES em src/data/cartas.json e a proposta 0.1. Ajustes autorizados como parte do piloto; não representam equilíbrio comprovado.

| Carta | Comparação verificável em VES | Diagnóstico e revisão |
| --- | --- | --- |
| TD-P01 Lince | VES-074 Avanço Pressurizado: custo 2, +1/Ímpeto; VES-071 Fênix: custo 4, 3/3 e Ímpeto próprio | Manter 4/3/3, bônus para OUTRO aliado e Ímpeto só com Chama 3. Entrada é paga novamente ao rejogar; não renova ataque usado. |
| TD-P02 Javali | VES-023 Bastião: custo 4, 3/4 Guardião; VES-037 Batedora: custo 3, 2/3 Emboscada | Manter custo 3, 2/4 Guardião e Raiz 2. Troca Força por defesa e paga acesso de escola; comparar eficiência no playtest. |
| TD-P03 Predador | VES-050 Memória: custo 6, 5/4, duas Cinzas por 2 de dano; VES-071 Fênix: custo 4 híbrido 3/3, Ímpeto e dano opcional | Manter 4/3/3 mono Sombra; dano só na frente, sem Ímpeto. Pagar duas Cinzas exige decisão e não gera recurso de volta. |
| TD-P04 Garça | VES-059 Lanceiro: custo 3, 2/3, Alcance, Essência 1×3 — igual à proposta inicial; VES-060 Condutora: custo 4, 3/4, retorno próprio até 2 | Revisar para custo 4, 2/4, Alcance e retorno opcional de OUTRO aliado até 2 somente com Maré 3. Incomum. Reduz Força e condiciona retorno, em troca de Alcance. |
| TD-P05 Guardião | VES-003 Ivo: custo 3, 1/3, cura 1 no Despertar, Essência 1×3 | Proposta inicial ganhava Vigor e teto de cura sem pagar mais. Custo sobe de 3 para 4; mantém 1/4 e cura de encerramento 1→2 por Raiz 3. Timing diferente e vulnerabilidade de Suporte precisam de teste. |
| TD-P06 Lia | VES-058 Ajustadora: custo 2, 2/3 e consulta de uma carta; VES-019 Leitora: custo 3, 1/4 e consulta recorrente de uma | Manter 3/1/4 e Essência 1×2; consulta duas UMA vez e permite ordenar o topo. Rejogo custa energia; não compra nem acelera fontes. |
| TD-P07 Catadora | VES-043 Chamado: custo 3, recupera do descarte até 3; VES-076 Reconstruir: custo 3, recupera do descarte e ganha Vida | Manter custo 5, 2/4, teto 2→4 por Sombra 3 e pagar duas OUTRAS Cinzas. Alvo vem de fonte expirada/efeitos de Cinzas, não de morte comum; alvo reservado não paga o efeito. Não recupera cópia própria de custo 5. |
| TD-P08 Santuário | VES-019/058 consulta; VES-066 Rotas: custo 3, compra após movimento | Manter custo 2 híbrido, consulta de uma carta por encerramento com Raiz 2 E Maré 2. Não compra carta, não gera energia e não dispara em cada mudança de Presença. |
| TD-P09 Quebrar | VES-053 Apagar: custo 2, Sombra 2, destrói qualquer encantamento | Não é remoção mais eficiente: só até 3 e exige duas escolas, mas acessível em Chama/Sombra 1+1. Manter como resposta de baixo acesso ao campo. |
| TD-P10 Bruma | VES-021 Recuo: custo 3, qualquer custo na frente; VES-080 Reflexo: custo 2, retaguarda e compra por Cinzas | Manter custo 2 e teto 3 em qualquer fileira. Restrição de custo paga a flexibilidade de zona; devolver pode beneficiar entrada/Escola do rival. |
| TD-P11 Raízes | VES-013 Passagem: custo 1, cura até 2, Essência 2×3; VES-007 Jardim: custo 2, cura recorrente de retaguarda | A proposta repetia a cura com Essência menos eficiente. Revisar para custo 2 e cura de 1 em CADA monstro seu, uma vez, Essência 1×4. Papel passa a recuperação distribuída, sem reviver mortos. |
| TD-P12 Faísca | VES-031 Estouro: custo 2, 2 na frente ou 1 no mago; VES-006 Última Descarga: custo 3, 3 na frente | Manter custo 2, dano 2→3 por Chama 3; sem dano ao mago quando não há alvo. Última Descarga continua garantindo 3 sem campo preparado. |

## Interações e risco de ciclos

- Rejogo WB-D15 preservado. Lia/Garça/Lince não geram energia. Desconto VES-030 vale só para a primeira Magia de Chama, com mínimo 1; não torna conjuração de monstro gratuita. Guardar energia VES-062 conserva limite total 1.
- Catadora consome duas Cinzas por recuperação; estas vão ao descarte. O alvo não pode ser gasto no pagamento. Recuperação cruzada com VES-043/076 custa cartas/energia e não cria fontes sem a ação de sacrifício, limitada a uma por turno. Testes precisam verificar reserva, pagamento parcial impossível e replay com escolha pendente.
- Ímpeto autoriza ataque na entrada, sem limpar attacked/retreated. Temporários do Lince expiram no encerramento. Garça não devolve a si própria; alvos de até 2 não incluem Lia/Catadora/Lince.
- Presença inclui fontes ativas/monstros/encantamentos; não inclui Escola permanente, Magias ou Véu. Própria entrada conta; fonte expirada deixa de contar antes de habilidades do Despertar. Nenhuma carta nova muda isso.
- Ressonância deve modificar um único efeito/alvo; não resolver cura 1 e depois escolher outro alvo para cura extra. Valores são definidos quando a habilidade começa a resolver e não recalculados no meio da escolha.
- Santuário só seleciona compras e Guardião só cura sobreviventes. Respostas Bruma/Quebrar/Faísca funcionam sem campo grande. Ainda existe risco de vantagem cumulativa; observar no passo 4 humano.

## Contrato resultante de Ressonância

Verificar a Presença no início da resolução do efeito e fixar os valores para suas escolhas/pagamento. O bônus não é permanente e não exige gastar Presença. Nos gatilhos condicionais (Garça/Santuário), a condição precisa ser satisfeita para o efeito acontecer. No encerramento, o gatilho é formado somente se já atender e a condição é conferida novamente quando resolver; não nasce retroativamente. Híbridas verificam cada escola. Sem nova janela de interrupção ou limite artificial de Escola/UID.

Auditoria de implementação e resultados técnicos serão registrados no QA do piloto. Sem declaração de que estes ajustes tornaram as cartas equilibradas ou mais divertidas.
