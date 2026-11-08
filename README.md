# Interface — Laboratório digital (versão 3)

Curso universal de Informática Básica: dez aulas de 180 minutos, 80 estações de estudo, 40 missões, acesso de alunos, XP e controle do professor. Os exemplos atendem a estudos, vida cotidiana e diferentes áreas profissionais. Visual em verde escuro inspirado na apresentação original.

## Testar no computador

1. Tenha Node.js 22 ou superior instalado.
2. Abra INICIAR.cmd ou execute `npm run dev` na pasta do projeto.
3. Abra http://127.0.0.1:3000 no navegador. Mantenha o servidor aberto durante o uso.
4. No primeiro uso, clique em **Configurar o professor neste computador** e escolha uma senha com pelo menos 10 caracteres.
5. Crie uma turma e compartilhe seu código. Libere a aula desejada.
6. Para testar um aluno sem sair do professor, use uma janela privada ou outro navegador.

Não há senha padrão. No modo local, os registros ficam em `.local/classroom.json`, no computador que executa o servidor. Não apague essa pasta se quiser preservar a turma. Esse endereço local serve para experimentar no próprio computador. Para acesso pela internet e vários dispositivos, publique com o banco configurado.

## Publicar na Vercel

A aplicação tem uma parte de servidor. Abrir index.html diretamente ou publicar só dist não registra os alunos. Envie o projeto completo, incluindo api e lib.

1. Crie um projeto Supabase em uma conta sua.
2. No SQL Editor, execute o arquivo **database/schema.sql**. Ele cria as tabelas, índices, proteção de acesso direto e limite de tentativas.
3. Em Settings / API Keys, obtenha a URL do projeto e a chave **secreta**, usada somente no servidor. Pode ser uma chave moderna `sb_secret_...` ou a chave legada `service_role`. Nunca use uma chave `anon`/publishable nesse campo.
4. Envie os arquivos do projeto a um repositório GitHub e importe na Vercel. Escolha **Other** como framework. O vercel.json configura o build e as funções.
5. Em Settings / Environment Variables da Vercel, cadastre:

| Variável | Valor |
| --- | --- |
| SUPABASE_URL | URL HTTPS do seu projeto Supabase |
| SUPABASE_SECRET_KEY | Chave secreta do banco; somente no ambiente do servidor |
| ADMIN_PASSWORD | Senha escolhida para o professor, de pelo menos 10 caracteres |
| SESSION_SECRET | Segredo aleatório de pelo menos 32 caracteres |

Você pode gerar SESSION_SECRET no seu computador com `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Cadastre a saída diretamente na Vercel; não coloque o segredo no repositório nem envie aos alunos.

6. Publique ou faça um novo deploy depois de configurar as variáveis. Acesse **Sou professor**, crie a turma e confira primeiro com um aluno de teste.
7. Teste: aula fechada, liberação, entrega, aprovação, saída e retorno em outro dispositivo.

Para uma instalação nova, o banco precisa ser criado e configurado na sua conta. Se a versão anterior já está funcionando, preserve o mesmo projeto Supabase e as quatro variáveis da Vercel; esta atualização não exige executar SQL novamente. A nova versão foi verificada localmente, sem alterar sua publicação. Sem configuração, a produção recusa o acesso aos registros em vez de usar um armazenamento temporário. Os dados locais não migram automaticamente ao banco remoto.

## Como funciona para o aluno

- Primeiro acesso: nome, código da turma e PIN de 6 a 12 números.
- O sistema gera um **código pessoal**, diferente do código da turma. O aluno baixa um cartão e guarda seu PIN.
- Próximos acessos, inclusive em outro dispositivo: código pessoal + PIN.
- Só é possível abrir e enviar atividades das aulas liberadas. As liberações são conferidas a cada 30 segundos e em toda abertura/entrega.
- Missões aprovadas dão XP uma única vez. Não há desconto por tentativa errada.
- Respostas abertas e projetos ficam em avaliação. O professor aprova ou pede revisão com devolutiva.
- Uma aula com as três missões essenciais aprovadas gera uma insígnia. A quarta missão é bônus opcional.
- O passaporte mostra XP, entregas, devolutivas e a nota oficial separadamente.
- Rascunhos ficam no navegador por aluno/missão. Entregas enviadas ficam no servidor. Um rascunho não enviado não acompanha o aluno em outro dispositivo.
- Ao usar um computador compartilhado, o aluno deve sair da conta. O PIN é armazenado com hash; o professor pode redefinir, sem consultar o PIN antigo.

## Como funciona para o professor

- Crie quantas turmas forem necessárias. Cada uma tem seu código e suas aulas abertas.
- Abra e feche inscrições para evitar cadastros fora do período desejado.
- Use **Liberar aula** no dia do encontro. Pode manter aulas anteriores abertas para revisão.
- Fechar uma aula impede novas aberturas e entregas. Preserva o progresso. Não apaga conteúdo que um aluno já leu ou anotou.
- Use **Explorar** para demonstrar qualquer aula sem registrar XP de aluno.
- Leia as respostas em **Entregas e projetos**. Aprovação concede o XP previsto; pedir revisão mantém a entrega sem XP até ser aprovada.
- A lista de alunos mostra código pessoal, pontos, quantidade de missões e nota oficial. O relatório CSV permite acompanhar a turma.
- **Redefinir PIN** revoga sessões antigas do aluno e preserva entregas.
- **Registrar nota** guarda o resultado da avaliação oficial de 0 a 10, sem transformar XP em nota.

A liberação é manual pelo professor; não há agenda automática por data. A aplicação usa um acesso docente por instalação. Não há chat, envio de e-mail, upload de arquivos ou ranking público.

## O que há em cada aula

| Aula | Conteúdo | Laboratório principal |
| --- | --- | --- |
| 1 | Evolução, hardware/software, CPU, memória, dados e periféricos | Linha do tempo, componentes, CPU, salvamento, bits, periféricos e jogo de cabos |
| 2 | Windows, janelas, pastas e arquivos | Explorador simulado para organizar documentos da oficina |
| 3 | Editor de texto | Comunicado de atividade com lista, destaque e prévia |
| 4 | Planilha, quatro operações, SOMA e MÉDIA | Orçamento e fórmulas com referências de células |
| 5 | SE, SOMASE e PROCV | Acompanhamento por condição, horas por categoria e catálogo de produtos |
| 6 | Conceitos e criação de macros | Sequência de blocos com simulação do relatório |
| 7 | Slides, texto, imagens e vídeo | Construtor de três slides com prévia e exportação HTML |
| 8 | Apresentação de tema livre | Projeto, registro de ensaio e feedback para avaliação docente |
| 9 | Banco de dados | Construtor de tabela e consulta de catálogo fictício |
| 10 | Revisão e avaliação | Desafios integrados e registro separado da nota oficial |

Os laboratórios são simuladores didáticos. Não substituem Word, Excel, PowerPoint, Windows ou um gerenciador de banco completo. As atividades para os aplicativos reais, os tempos e as adaptações estão em **GUIA-DO-PROFESSOR.md**. As fórmulas do laboratório usam português e `;`; PROCV usa correspondência exata. Não há execução de VBA ou de SQL enviado por alunos. O vídeo é um link HTTPS aberto em nova aba. Textos e slides podem ser baixados em HTML, não em DOCX/PPTX.

A Prova Padrão Grau Técnico não foi fornecida. A aula 10 oferece uma revisão autoral, sem alegar reproduzir ou substituir a prova oficial.

## Verificação

- `npm run check`: sintaxe dos arquivos da aplicação.
- `npm test`: conteúdo, fórmulas, todas as 40 missões, bloqueios, contas, XP idempotente, devolutivas, isolamento entre alunos, reinício e recuperação de PIN.
- `npm run build`: gera dist com somente index.html, course.css, course-app.js, study.js e study.css. Conteúdo das aulas e correção ficam em lib, usados pela API.
- Com o servidor aberto, `node tests/http-smoke.cjs`: verifica HTTP, origem, sessão e bloqueio de arquivos privados, sem criar conta.

A verificação inclui testes de conteúdo, correção, contas, bloqueios e preservação de progresso. A versão 3 também foi inspecionada no navegador em tela normal e em 390 × 844, com testes de CPU, salvamento e bits. O servidor visual de teste usa dados fictícios isolados. Sua publicação e seus registros de produção não foram alterados.

## Arquivos principais

- index.html, course.css, course-app.js: interface principal.
- study.js e study.css: leitor de aulas e laboratórios livres.
- lib/learning.cjs: oitenta estações, explicações, exemplos, práticas e roteiro.
- lib/universal.cjs: adaptação do conteúdo, preservando IDs de missão e XP.
- lib/course.cjs: currículo, textos, tempos e missões.
- lib/grader.cjs e lib/formula.cjs: correção e interpretador limitado.
- lib/service.cjs, lib/store.cjs, api/index.js: contas, autorização, persistência e API.
- database/schema.sql: estrutura do banco de produção.
- server.cjs: servidor local; só serve os três arquivos públicos e a API.
- vercel.json: publicação; .env.example: nomes das variáveis, sem credenciais reais.

Os arquivos app.js, content.js, style.css e verify.cjs da versão inicial foram preservados no diretório como referência. Não fazem parte do build da versão 2.

## Fontes

- Material original fornecido: TÉCNICO EM MECÂNICA - INFORMÁTICA BÁSICA.pptx.
- Computer History Museum: https://www.computerhistory.org/timeline/computers/
- IBM, processamento e cache: https://www.ibm.com/think/topics/cpu-use-cases
- Microsoft, PROCV: https://support.microsoft.com/pt-br/excel/functions/vlookup-function
- Microsoft, macros e segurança: https://support.microsoft.com/pt-br/excel/change-macro-security-settings-in-excel
- Supabase, proteção do banco: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase, chaves de API: https://supabase.com/docs/guides/getting-started/api-keys
- Vercel, execução das funções: https://vercel.com/docs/functions/runtimes

## Atualização da versão 3

Leia ATUALIZAR.md antes de substituir a publicação. O curso é comum a todos os grupos de acesso. A estrutura do banco, os códigos pessoais, os IDs das quarenta missões e seus valores de XP permanecem os mesmos (4.400 XP possíveis). As oitenta estações ampliam o estudo sem criar recompensas duplicadas.

Cada aula oferece oito blocos com tempos que somam 180 minutos, incluindo pausa, leitura comentada, demonstração e prática. A Aula 1 tem cerca de duas mil palavras de material e seis laboratórios livres, além do jogo de cabos e demais missões. Os tempos são sugestões de condução: somente ler o material não ocupa três horas.

O caderno e o marcador de estações exploradas ficam no navegador. O XP e as entregas continuam no servidor. Use Começar a aula, percorra as estações e depois faça as missões com XP. O modo guiado oferece apoio e o modo autônomo propõe aprofundamento.
