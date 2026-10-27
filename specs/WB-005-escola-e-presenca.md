# WB-005 — Escola permanente e Presença do campo

23/10/2026 · WB-D15 · implementação digital 0.5.0, variante `escolas-v1`.

## Decisão do usuário

“Escola só aumenta, e presença muda conforme as cartas na mesa.” Na resposta à pergunta de contagem, escolheu fontes e cartas conjuradas, **incluindo jogar novamente a mesma carta**, para permitir combos e decks de retorno. Isso substitui a proposta anterior de contar apenas fontes e a sugestão de contar cada carta uma única vez.

## Contrato implementado

- Cada criação de fonte e cada conjuração/armação resolvida acrescenta **+1 por escola impressa da carta** ao jogador. Híbridas avançam um em cada escola, não o valor numérico do requisito.
- Escola começa em zero, não é gasta, não reinicia no turno e não cai por morte, devolução ou expiração. Rejogar o mesmo UID soma novamente. Reposicionar, comprar, recuperar para a mão ou sacrificar um monstro como custo não concede avanço.
- Os antigos requisitos do campo `Card.presence` do snapshot passam a consultar Escola nesta variante. O nome do campo de dados permanece por compatibilidade com a base; as frentes mostram “Chama 1” etc., sem mudança de símbolo ou imagem.
- Validar requisito **antes** do avanço da própria conjuração: uma carta bloqueada não se habilita sozinha. Fonte não exige escola e continua limitada a uma por turno. Custos de energia e custos adicionais continuam valendo.
- Presença permanece calculada a partir de monstros nas duas fileiras, fontes ativas e encantamentos; cada carta fornece um por escola. Magias resolvidas, descarte, Cinzas e Prenúncios ocultos não fornecem Presença.
- A fonte segue o timing da **base**: gera e perde duração ao ser criada. Uma 2×1 gera 2 energia, vira Cinza imediatamente e deixa o avanço de Escola, mas não Presença ativa. Duração integral continua como variante anterior separada.
- Prenúncio armado também avança Escola. **O incremento de escola é público**, mesmo no Véu: revela a escola, não nome/ID/face da carta. Essa é uma consequência da regra universal aplicada à armação; avaliar inferência estratégica no playtest. Não alegar sigilo total da escola.
- Avanço é registrado no histórico público. Servidor mantém a autoridade; cliente exibe Escola e Presença separadas. Bot pontua desbloqueios apenas com informação própria/pública. Ainda é heurístico, não planejador de combos de retorno.

## Presença para habilidades fortes

A intenção de reservar condições impactantes à Presença foi aceita como direção de design; **nenhum efeito das 80 cartas foi reescrito**. O contrato `Effect.presence_min` foi adicionado e consulta a Presença na resolução, independentemente da Escola. Teste sintético verifica efeito com Sombra 2 presente versus Escola 20/campo vazio. A fixture não é uma carta nova publicada.

Cartas futuras podem exigir, por exemplo, Presença Sombra 3 para um efeito mais forte; esse exemplo não é conteúdo aprovado. Definir se a condição deve valer no anúncio, na resolução ou continuamente por habilidade, e implementar o timing correspondente. A infraestrutura entregue cobre condição de efeito na resolução, não uma linguagem completa para todos os futuros tipos de habilidade.

## Versão e compatibilidade

0.5.0 em **http://127.0.0.1:4181**, build `dist-v05`; partidas anteriores ficam na 4180/4179, sem reinício/migração. Lobby novo seleciona `escolas-v1` por padrão, com identificação de teste e opções antigas disponíveis. Replays 0.4 com variantes antigas continuam aceitos; não reinterpretar um replay antigo como Escola. Snapshot de cartas/listas e PDFs físicos preservados.

Decks no navegador são separados por origem. Gerenciador novo oferece cópia explícita da biblioteca local da 4180 por ponte de leitura restrita às duas origens, janela e nonce. Revalida listas e cria novos IDs; não copia token de partida. Backup JSON permanece alternativa. Não há migração automática nem sincronização.

## Evidências e limites

[Testes específicos](../src/tests/schools.test.ts): fonte curta e conjuração sem Presença, requisito antes do avanço, rejogar mesmo UID, reposicionar, híbridas, magia, sigilo da identidade de Prenúncio, condição de Presença, variantes antigas, replay 0.4 e oito partidas completas com bot/conservação/Escola monotônica/replay igual. O retorno à mão é preparado por fixture; os duelos com cartas de devolução fora do conjunto habilitado ainda não foram liberados.

[QA 0.5.0](../qa/santuario-v050/README.md). Testes de término/replay não comprovam balanceamento, diversão ou ausência de combos dominantes. Próximo playtest deve observar turnos sem conjuração, requisitos altos liberados cedo, híbridas/muitas escolas e loops de retorno. Energia e limites atuais continuam sendo custos, sem teto artificial novo no avanço.
