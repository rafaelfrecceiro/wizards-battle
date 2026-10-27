# VES — auditoria individual das 80 cartas

23/10/2026 · Motor 0.6.0. Cada identidade passou por cenário de conjuração/efeito e cenário de fonte/custo/requisito/atomicidade. Condições, habilidades e interações têm cenários adicionais em [ves-audit.test.ts](../../src/tests/ves-audit.test.ts).

[Contratos impressos e nomes dos testes por carta](audit-cards.json) · [Relatório completo](tests.json) · [QA e limites](README.md).

Aprovação técnica limitada aos cenários executados; não equivale a cobertura de todas as combinações possíveis ou equilíbrio humano. As seis cartas não conjuradas pelo bot na matriz também têm cenários dirigidos de efeito.

| ID | Carta | Tipo | Capacidades auditadas | Cenários por carta |
| --- | --- | --- | --- | --- |
| VES-001 | Nara, Mecânica do Pulso | Monstro | enter | aprovados |
| VES-002 | Vigia da Caldeira | Monstro | atributos/Essência | aprovados |
| VES-003 | Ivo, Jardineiro das Fendas | Monstro | support_dawn | aprovados |
| VES-004 | Eco dos Soterrados | Monstro | support_end | aprovados |
| VES-005 | Comporta de Emergência | Prenúncio | trigger, trap | aprovados |
| VES-006 | A Última Descarga | Magia | cast | aprovados |
| VES-007 | Jardim nas Engrenagens | Encantamento | enchant_dawn | aprovados |
| VES-008 | Raízes sobre Cinzas | Magia | cast | aprovados |
| VES-009 | Faísca Desgarrada | Monstro | Ímpeto | aprovados |
| VES-010 | Mestre das Fornalhas | Monstro | aura | aprovados |
| VES-011 | Broto das Fissuras | Monstro | atributos/Essência | aprovados |
| VES-012 | Guardião do Viaduto | Monstro | Guardião | aprovados |
| VES-013 | Passagem Viva | Magia | cast | aprovados |
| VES-014 | Vulto da Fuligem | Monstro | atributos/Essência | aprovados |
| VES-015 | Vigia dos Túneis | Monstro | Alcance | aprovados |
| VES-016 | Silenciar o Motor | Magia | cast | aprovados |
| VES-017 | Fenda Preparada | Prenúncio | trigger, trap | aprovados |
| VES-018 | Aprendiz das Comportas | Monstro | atributos/Essência | aprovados |
| VES-019 | Leitora das Correntes | Monstro | support_dawn | aprovados |
| VES-020 | Sentinela dos Canais | Monstro | enter | aprovados |
| VES-021 | Recuo pelas Águas | Magia | cast | aprovados |
| VES-022 | Retorno da Chama | Prenúncio | trigger, trap | aprovados |
| VES-023 | Bastião da Passagem | Monstro | Guardião | aprovados |
| VES-024 | Pacto dos Nomes | Encantamento | enchant_dawn | aprovados |
| VES-025 | Corredor das Brasas | Monstro | Ímpeto | aprovados |
| VES-026 | Operária do Regulador | Monstro | support_dawn | aprovados |
| VES-027 | Falcão de Escória | Monstro | Alcance | aprovados |
| VES-028 | Demolidor do Pulso | Monstro | enter | aprovados |
| VES-029 | Titã das Fornalhas | Monstro | enter | aprovados |
| VES-030 | Bombeira de Brasa | Monstro | discount | aprovados |
| VES-031 | Estouro do Conduíte | Magia | cast | aprovados |
| VES-032 | Turno de Emergência | Magia | cast | aprovados |
| VES-033 | Ritmo das Fornalhas | Encantamento | enchant_end | aprovados |
| VES-034 | Conduítes Abertos | Encantamento | aura | aprovados |
| VES-035 | Faísca de Reserva | Prenúncio | trigger, trap | aprovados |
| VES-036 | Carregador de Raízes | Monstro | atributos/Essência | aprovados |
| VES-037 | Batedora dos Jardins | Monstro | Emboscada | aprovados |
| VES-038 | Arco Vivo | Monstro | atributos/Essência | aprovados |
| VES-039 | Ancião da Travessia | Monstro | Guardião | aprovados |
| VES-040 | Cuidadora das Fendas | Monstro | aura | aprovados |
| VES-041 | Cronista do Horto | Monstro | support_dawn | aprovados |
| VES-042 | Seiva de Socorro | Magia | cast | aprovados |
| VES-043 | Chamado dos Abrigos | Magia | cast | aprovados |
| VES-044 | Horto dos Refugiados | Encantamento | enchant_dawn | aprovados |
| VES-045 | Socorro nas Raízes | Prenúncio | trigger, trap | aprovados |
| VES-046 | Abrigo Preparado | Prenúncio | trigger, trap | aprovados |
| VES-047 | Catadora de Lamparinas | Monstro | enter | aprovados |
| VES-048 | Guia dos Túneis | Monstro | aura | aprovados |
| VES-049 | Ceifador das Válvulas | Monstro | Alcance | aprovados |
| VES-050 | Memória da Primeira Queda | Monstro | enter | aprovados |
| VES-051 | Arquivista da Fuligem | Monstro | support_dawn | aprovados |
| VES-052 | Portador dos Nomes | Monstro | death | aprovados |
| VES-053 | Apagar o Selo | Magia | cast | aprovados |
| VES-054 | Resgate de Memórias | Magia | cast | aprovados |
| VES-055 | Vigília dos Ausentes | Encantamento | enchant_end | aprovados |
| VES-056 | Último Recado | Encantamento | enchant_end | aprovados |
| VES-057 | Selo de Fuligem | Prenúncio | trigger, trap | aprovados |
| VES-058 | Ajustadora dos Canais | Monstro | enter | aprovados |
| VES-059 | Lanceiro das Correntes | Monstro | Alcance | aprovados |
| VES-060 | Condutora do Refluxo | Monstro | enter | aprovados |
| VES-061 | Serpente dos Aquedutos | Monstro | enter | aprovados |
| VES-062 | Guardiã da Cisterna | Monstro | store | aprovados |
| VES-063 | Cartógrafa das Águas | Monstro | support_dawn | aprovados |
| VES-064 | Pulso Regulamentado | Magia | cast | aprovados |
| VES-065 | Revelar a Comporta | Magia | cast | aprovados |
| VES-066 | Rotas Alternadas | Encantamento | reposition | aprovados |
| VES-067 | Compasso das Correntes | Encantamento | first_magic, magic_school | aprovados |
| VES-068 | Rota de Escape | Prenúncio | trigger, trap | aprovados |
| VES-069 | Enxertado das Fornalhas | Monstro | enter | aprovados |
| VES-070 | Abrir a Travessia | Magia | cast | aprovados |
| VES-071 | Fênix do Motor | Monstro | enter | aprovados |
| VES-072 | Detonar as Cinzas | Magia | cast | aprovados |
| VES-073 | Corredora de Vapor | Monstro | Ímpeto | aprovados |
| VES-074 | Avanço Pressurizado | Magia | cast | aprovados |
| VES-075 | Guardião do Depósito | Monstro | conditional_guard | aprovados |
| VES-076 | Reconstruir os Nomes | Magia | cast | aprovados |
| VES-077 | Curadora das Estações | Monstro | support_dawn | aprovados |
| VES-078 | Canais do Recomeço | Encantamento | enchant_end | aprovados |
| VES-079 | Intérprete dos Reflexos | Monstro | enter | aprovados |
| VES-080 | Reflexo dos Ausentes | Magia | cast | aprovados |
