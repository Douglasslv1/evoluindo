# Evoluindo — arquitetura de integração

Este diretório é a nova aplicação unificada. Os projetos `informbasic` e `desenhomecduel` permanecem intactos como fontes de regras e testes.

## Domínio central

- A turma é o grupo permanente em que o aluno entra por código.
- A disciplina existe independentemente e pode ser associada a várias turmas.
- O aluno pertence à turma, não a uma edição isolada de campeonato.
- Conteúdos, bancos de questões, simulados e campeonatos pertencem a uma disciplina.
- Um campeonato pertence simultaneamente a uma turma e a uma disciplina.
- XP deve ser registrado por eventos idempotentes e pode alimentar uma nota complementar configurável, sem substituir a nota oficial.

## Entregas planejadas

1. Fundação: identidade Evoluindo, turmas, disciplinas e vínculos.
2. Conteúdo configurável: retirar o curso fixo do código e publicar conteúdos por disciplina/turma.
3. Banco de questões e simulados: migrar o catálogo multidisciplinar do Champions.
4. Campeonatos: adaptar nivelamento, chaves, duelos, pódio e relatórios aos alunos da turma.
5. XP e nota complementar: consolidar atividades, simulados e duelos em um extrato auditável.
6. Migração e publicação: importar dados existentes, revisar segurança e validar em dispositivos reais.
