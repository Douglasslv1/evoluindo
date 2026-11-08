# Atualizar para a versão 3 — Conteúdo universal e aulas ampliadas

Esta é uma atualização do mesmo sistema. O curso é comum a todos os grupos de acesso. Os grupos continuam organizando quem pode entrar, quais aulas estão abertas e quais entregas você acompanha.

## Se a versão anterior já funciona na Vercel

1. Faça uma cópia da pasta atual do projeto.
2. Extraia o ZIP da versão 3 na pasta do projeto e substitua os arquivos correspondentes. Inclua os novos arquivos `study.js`, `study.css`, `lib/learning.cjs` e `lib/universal.cjs`; somente substituir index.html não basta.
3. Preserve `.env.local`, se existir, e a pasta `.local`, que pode guardar os registros do uso local. O ZIP não contém nenhum desses dados privados.
4. Envie os arquivos atualizados ao mesmo repositório ligado à Vercel. Se a publicação usa o repositório, uma nova versão será gerada pelo fluxo normal do projeto. Confira o deploy que contém as alterações.
5. Mantenha o mesmo projeto Supabase e as mesmas variáveis `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `ADMIN_PASSWORD` e `SESSION_SECRET` na Vercel. Esta atualização não exige SQL nem criação de outras tabelas. Não é necessário refazer o banco ou cadastrar os alunos novamente.
6. Quando a publicação terminar, atualize o navegador. Se ainda aparecer o conteúdo antigo, faça uma atualização completa com Ctrl+F5.
7. Entre como professor, escolha o grupo existente e clique em Explorar na Aula 1. Você deverá ver oito estações, o percurso de 180 minutos e a separação entre estudo e missões com XP.

## O que foi preservado

- Estrutura e registros do banco: grupos, alunos, códigos pessoais, entregas, notas e liberações.
- Identificadores das quarenta missões e seus valores de XP: continuam sendo 4.400 XP possíveis no curso.
- Acesso docente e acesso por código pessoal + PIN.
- Regras de aprovação e revisão de respostas abertas.

Os textos de missões passaram a usar contextos gerais. Entregas e pontos anteriores são preservados. Há compatibilidade para respostas de texto e nomes de tabela da versão inicial. A atualização não concede novamente XP por uma missão já aprovada.

## O que há de novo

- Dez aulas com oito estações de estudo cada, totalizando oitenta estações.
- Explicações ampliadas, exemplos resolvidos, perguntas para conferir raciocínio e práticas em passos.
- Aula 1 com história, componentes, CPU, memória, unidades e periféricos, além de seis experimentos livres e do jogo de cabos.
- Experimentos de orçamento em planilha e condição SE.
- Marcador de estações exploradas e caderno de anotações com download, salvos neste navegador.
- Roteiros específicos que somam 180 minutos por encontro, incluindo prática, discussão e intervalo. A duração é uma sugestão de condução, não um tempo mínimo de leitura.

## Conferência rápida depois de atualizar

Abra uma aula como professor e como aluno de teste. Verifique se o nome e o XP de um aluno anterior continuam corretos. Feche uma aula, confira o bloqueio com esse aluno e reabra quando necessário. Realize uma prática livre e observe que ela não muda o XP. Envie uma missão e confira o registro no painel.

Para instalações novas ou problemas de configuração, use README.md. Para condução dos encontros, use GUIA-DO-PROFESSOR.md. AULA-1-ROTEIRO.md oferece uma versão de consulta da primeira aula.
