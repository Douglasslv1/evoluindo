# Publicação segura do Evoluindo

## 1. Banco de dados

1. Crie um projeto Supabase ou faça backup da instância atual.
2. No SQL Editor, execute `database/schema.sql` inteiro.
3. O arquivo é reaplicável: cria estruturas ausentes, adiciona colunas novas e preserva turmas, alunos e entregas existentes.
4. Execute `database/verify-after-schema.sql`. A primeira consulta deve retornar zero linhas e todas as tabelas listadas devem mostrar `rowsecurity = true`.

Dados do antigo `desenhomecduel` não são importados automaticamente. Preserve o projeto antigo até existir uma importação validada dos bancos de perguntas e campeonatos.

## 2. Vercel

Importe o diretóio `evoluindo` como projeto e cadastre:

- `SUPABASE_URL`: URL HTTPS do projeto Supabase.
- `SUPABASE_SECRET_KEY`: chave secreta `sb_secret_...` ou `service_role`, somente na Vercel.
- `ADMIN_PASSWORD`: senha forte do professor, com pelo menos 10 caracteres.
- `SESSION_SECRET`: segredo aleatório com pelo menos 32 caracteres.

Nunca cadastre a chave secreta no frontend, em variáveis com prefixo público ou no repositório.

## 3. Verificação automatizada

Depois do deploy, execute localmente:

```powershell
$env:EVOLUINDO_URL='https://seu-projeto.vercel.app'
npm run verify:deployment
```

## 4. Teste funcional antes de usar com uma turma real

1. Entre como professor e crie uma turma de teste.
2. Cadastre uma disciplina e associe-a à turma.
3. Em dois navegadores ou perfis diferentes, cadastre dois alunos.
4. Confirme que um aluno não enxerga dados do outro.
5. Crie um banco, um simulado e um campeonato curto.
6. Conclua o mesmo duelo quase simultaneamente nos dois navegadores.
7. Confira chave, XP, relatório, pódio e ausência de XP duplicado.
8. Exporte os relatórios CSV e valide os valores.

Somente depois desse roteiro use a publicação com alunos reais.
