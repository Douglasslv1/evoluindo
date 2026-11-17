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

## 5. Operação do dia a dia

### Verificação automática no GitHub

A cada push na `main` e em cada pull request, o GitHub Actions (`.github/workflows/verificacao.yml`) confere formatação, sintaxe, testes e build. O resultado aparece na aba **Actions** do repositório e ao lado de cada commit (✓ ou ✗). Essa verificação não impede o deploy da Vercel, que é independente: se aparecer ✗, corrija antes de usar a versão com alunos.

Quando um envio altera `database/schema.sql`, a verificação mostra o aviso **"Atualização do banco necessária"**. Execute o arquivo no SQL Editor do Supabase (veja ATUALIZAR.md).

### Backup

No painel do professor, use **Baixar backup ↓** (ao lado de "+ Criar turma"). O arquivo `backup-evoluindo-AAAA-MM-DD.json` traz todas as tabelas: turmas, alunos, entregas, notas, perguntas, simulados, campeonatos e XP.

- Ele contém dados pessoais e os PINs dos alunos protegidos por hash. Guarde em local seguro (por exemplo, uma pasta privada na nuvem) e não compartilhe.
- Não contém a senha do professor nem o segredo das sessões, que ficam só na Vercel.
- Sugestão: baixe um backup por semana e sempre antes de atualizar o banco ou encerrar um semestre.
- O plano gratuito do Supabase não oferece backups para baixar; este arquivo é a cópia sob seu controle. A restauração ainda não é automática: em caso de perda, o arquivo permite reconstruir os registros com apoio técnico.

### Registro de erros

Erros inesperados aparecem em **Vercel → projeto → Logs** como uma linha JSON com `level: "error"`, a ação, a mensagem e, quando o banco recusou a operação, o motivo informado pelo Supabase (por exemplo, uma coluna ausente). O registro não inclui o conteúdo enviado, cookies nem dados dos alunos.

O usuário vê a mensagem de erro com um código, como `(ref. abc12-...)`. Peça esse código e procure por ele nos Logs da Vercel para achar o registro correspondente.
