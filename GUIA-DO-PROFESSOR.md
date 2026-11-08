# Guia do professor — Informática para todos

O conteúdo é universal. Os grupos servem apenas para acesso, liberação e acompanhamento; não definem a área profissional dos exemplos. Cada encontro combina explicação, experimentação, discussão e prática, com 180 minutos sugeridos.

As quatro missões por aula foram preservadas. A exploração das estações e os laboratórios livres ampliam a aprendizagem sem duplicar o XP. Dicas não retiram pontos. As respostas abertas continuam recebendo devolutiva do professor.

Nas duplas, alternem operador e orientador. Quem orienta faz perguntas e não assume o mouse. Quem já conhece o básico deve justificar escolhas, testar variações e fazer o aprofundamento. Quem começa pode repetir os experimentos e praticar seleção, digitação e navegação. O professor ajusta o ritmo conforme a participação.

## Aula 1 — Computadores: história e funcionamento

História da informática e fundamentos de hardware

**Objetivos**

- Relacionar mudanças tecnológicas a novos usos dos computadores.
- Explicar a função de CPU, RAM, armazenamento e periféricos.
- Interpretar unidades de dados sem confundir capacidade e velocidade.
- Montar uma estação e justificar conexões e escolhas.

### 1. Computadores no seu dia a dia — 10 min

Um computador recebe dados, executa instruções, mantém informações e produz resultados. Essa ideia vale para um notebook, um celular, um caixa de supermercado ou um equipamento de pesquisa. O formato muda; a necessidade de representar e processar dados permanece.

**Prática**

1. Liste três equipamentos digitais que você usou ou viu hoje.
2. Escolha um deles e identifique o que entra, o que é processado e o que sai.
3. Compare a resposta com a de alguém que escolheu outro equipamento.

**Aprofundamento:** Encontre um equipamento que tenha computador embarcado, mas não pareça um computador de mesa.

**Pergunta de retomada:** Um computador precisa de internet para executar qualquer tarefa?

**Raciocínio esperado:** Não. É possível editar um texto local, fazer cálculos ou abrir arquivos sem internet, desde que os programas e dados necessários estejam no equipamento. Serviços online podem exigir conexão.

### 2. História: o que mudou em cada salto? — 25 min

A história da computação não começa com um único aparelho. Instrumentos de contagem, calculadoras mecânicas e projetos de máquinas programáveis responderam à necessidade de realizar operações de maneira organizada. No século XIX, Charles Babbage projetou máquinas de cálculo e uma Máquina Analítica de uso mais amplo. Ada Lovelace publicou notas sobre esse projeto em 1843, incluindo a descrição de um algoritmo.

**Prática**

1. Explore cada marco da linha do tempo.
2. Em duplas, escolham dois marcos e escrevam o que mudou na tecnologia e no uso.
3. Explique por que menor tamanho não é o único critério de evolução.

**Aprofundamento:** Explique como uma tecnologia anterior pode continuar útil mesmo depois que outra surge.

**Pergunta de retomada:** Por que o transistor e o circuito integrado são marcos diferentes?

**Raciocínio esperado:** O transistor é um componente eletrônico. O circuito integrado reúne componentes em uma mesma estrutura semicondutora. Integrar muitos componentes permite aumentar a complexidade sem montar cada um separadamente.

**Conexão com XP:** Uma viagem no tempo.

### 3. Hardware, software e o caminho dos dados — 20 min

Hardware é a parte física: placa-mãe, processador, memória, tela e dispositivos de entrada, por exemplo. Software é o conjunto de programas e instruções que permite executar tarefas. Um navegador é software. A memória onde ele trabalha é hardware. Nenhum dos dois, isoladamente, explica toda a experiência de uso.

**Prática**

1. Explore o mapa de componentes sem abrir um equipamento real.
2. Escolha um programa e descreva como hardware e software participam da tarefa.
3. Classifique navegador, teclado, sistema operacional e SSD como hardware ou software.

**Aprofundamento:** Explique por que um dispositivo pode ser reconhecido pelo sistema e ainda precisar de um driver adequado.

**Pergunta de retomada:** Comprar uma tela maior aumenta automaticamente a capacidade da RAM?

**Raciocínio esperado:** Não. A tela apresenta imagens e a RAM mantém programas e dados em uso. São funções diferentes; mudar um componente não altera automaticamente a capacidade do outro.

### 4. Processadores: uma instrução por dentro — 25 min

A CPU executa instruções de programas. Em um modelo didático, ela busca uma instrução, interpreta o que deve fazer, executa a operação e mantém o resultado disponível. Processadores reais usam técnicas que sobrepõem etapas e exploram paralelismo; a sequência simples ajuda a entender as responsabilidades sem reproduzir todos os detalhes internos.

**Prática**

1. Avance os quatro passos da simulação e descreva cada um com suas palavras.
2. Antes da execução, preveja em qual passo o resultado 20 aparecerá.
3. Compare duas CPUs hipotéticas: 4 núcleos a 3 GHz e 8 núcleos a 2,5 GHz. Liste informações que faltam para escolher.

**Aprofundamento:** Dê um exemplo de tarefa com etapas dependentes e outro que possa dividir trabalho em paralelo.

**Pergunta de retomada:** O segundo processador é sempre melhor porque tem mais núcleos?

**Raciocínio esperado:** Não. A escolha depende da arquitetura, da tarefa e de quanto o aplicativo usa paralelismo, além de outros recursos do equipamento. Os dois números não bastam para concluir.

### 5. Pausa para retomar a atenção — 10 min

Salve o que estiver fazendo, afaste-se da tela por alguns minutos e retome no horário combinado. Ao voltar, conte ao colega uma ideia que ficou clara e uma dúvida que ainda precisa de exemplo.

### 6. Memória, salvamento e unidades de dados — 30 min

A RAM mantém programas e dados em uso. Na memória RAM usual, o conteúdo se perde sem energia: ela é volátil. Isso não significa que todo arquivo desaparece ao desligar. Arquivos já salvos permanecem no armazenamento; alterações ainda não gravadas podem ser perdidas. Recursos de recuperação automática ajudam em alguns programas, mas não substituem salvar e conferir.

**Prática**

1. Na simulação, edite e desligue sem salvar; observe o que permaneceu.
2. Repita, agora salvando antes de desligar. Compare os resultados.
3. Use a bancada binária para formar 5, 10 e 255. Depois estime o espaço para 120 arquivos de 25 MB.

**Aprofundamento:** Uma conexão anuncia 80 Mb/s. Estime o tempo ideal para transferir 100 MB e explique por que a medição real pode demorar mais. Resposta ideal: 10 segundos, antes de sobrecargas e variações de rede.

**Pergunta de retomada:** Um computador com 1 TB de SSD tem necessariamente mais RAM que outro com 256 GB de SSD?

**Raciocínio esperado:** Não. A capacidade de armazenamento não informa a capacidade da RAM. Para os arquivos: 120 × 25 MB = 3.000 MB = 3 GB na convenção decimal.

**Conexão com XP:** O projeto desapareceu?.

### 7. Periféricos: sinais que entram e saem — 30 min

Um periférico de entrada envia dados para o sistema: teclado, mouse, microfone, câmera e scanner são exemplos. Um periférico de saída apresenta resultados: monitor, caixa de som e impressora. Há dispositivos que realizam ambas as funções, como uma tela sensível ao toque e uma interface de rede. A classificação precisa considerar a função, e não só a aparência.

**Prática**

1. Classifique cada dispositivo e explique em qual direção a informação circula.
2. No jogo de cabos, conecte os seis itens e confira o resultado.
3. Simule uma chamada: identifique câmera, microfone, tela, áudio e rede. Qual recurso investigaria se a imagem funciona, mas ninguém escuta você?

**Aprofundamento:** Explique a diferença entre formato de conector e recurso suportado, usando USB-C como exemplo.

**Pergunta de retomada:** Uma impressora multifuncional só faz saída?

**Raciocínio esperado:** A parte de impressão faz saída. O scanner realiza entrada. O conjunto oferece funções de entrada e saída. Em uma chamada sem voz, verifique microfone selecionado, permissões, mudo e conexão, em vez de trocar peças sem diagnóstico.

**Conexão com XP:** Missão: ligue a estação.

### 8. Escolha, diagnostique e explique — 30 min

A compreensão aparece quando você consegue justificar uma decisão. Para estudos com documentos e navegação, o perfil de uso é diferente do de edição de vídeo, jogos ou grandes cálculos. Antes de indicar uma troca, descreva a tarefa, os sintomas e quais recursos estão ocupados.

**Prática**

1. Faça as missões com XP que ainda faltam, incluindo a sequência histórica.
2. Em dupla, escolha um dos três cenários de lentidão e proponha duas verificações.
3. Individualmente, registre uma descoberta e uma pergunta no caderno da aula.

**Aprofundamento:** Faça o diagnóstico bônus e compare sua justificativa com uma de outro perfil de usuário.

**Pergunta de retomada:** Uma pessoa tem arquivos demais no SSD. Aumentar apenas a RAM resolve o espaço ocupado por esses arquivos?

**Raciocínio esperado:** Não. RAM e armazenamento têm funções diferentes. Primeiro é preciso analisar o uso do disco, organizar dados e avaliar a necessidade de armazenamento ou de cópias, sem apagar arquivos indiscriminadamente.

**Conexão com XP:** Uma viagem no tempo; O projeto desapareceu?; Diagnóstico de um computador.

**Fechamento e avaliação:** o tempo inclui prática e discussão. A quantidade mínima de caracteres permite o envio, mas não determina qualidade. Nas respostas abertas, verifique atendimento ao pedido, raciocínio e exemplos; peça revisão com uma orientação específica quando necessário.

## Aula 2 — Seu ambiente digital organizado

Sistema operacional Windows

**Objetivos**

- Reconhecer as funções de um sistema operacional.
- Usar área de trabalho, Iniciar, barra de tarefas e janelas.
- Criar e localizar arquivos por nome, tipo e caminho.
- Distinguir copiar, mover, excluir e criar atalhos.

### 1. O que você já faz no computador? — 10 min

Imagine que você precisa abrir um aplicativo, escrever uma nota e voltar a ela depois. Antes de discutir atalhos, identifique as ações: encontrar o programa, usar uma janela, escolher um local e salvar. Reconhecer a finalidade de cada ação ajuda quando a aparência do Windows muda.

**Prática**

1. Mostre ou descreva como abriria uma Calculadora.
2. Conte a um colega onde procuraria um arquivo salvo ontem.

**Pergunta de retomada:** É preciso decorar a posição de todos os botões?

**Raciocínio esperado:** Não. Entender a função de um recurso e saber procurar seu nome ajuda a trabalhar em versões e configurações diferentes.

### 2. O papel do Windows — 25 min

O sistema operacional gerencia processos, memória, arquivos e dispositivos e permite que aplicativos usem esses recursos. Windows é uma família de sistemas operacionais; Linux, macOS, Android e iOS são outros exemplos. Cada um tem interfaces e compatibilidades próprias.

**Prática**

1. Identifique sistema operacional e dois aplicativos disponíveis.
2. Explique a diferença entre sair da conta e desligar.

**Pergunta de retomada:** Um navegador é o sistema operacional?

**Raciocínio esperado:** Não. O navegador é um aplicativo que utiliza serviços do sistema para acessar páginas e outros recursos.

### 3. Área de trabalho, Iniciar e barra de tarefas — 25 min

A área de trabalho apresenta uma superfície para organizar atalhos e itens. Um ícone é uma representação visual, não necessariamente o arquivo inteiro nem um programa instalado. Leia o nome e observe se o item é um atalho.

**Prática**

1. Abra Calculadora e Bloco de Notas pelo nome.
2. Fixe ou identifique um aplicativo já fixado, conforme as permissões do laboratório.
3. Compare o ícone de um arquivo com o de um atalho.

**Aprofundamento:** Localize o mesmo recurso por duas rotas diferentes e compare a quantidade de ações.

**Pergunta de retomada:** Excluir um atalho de um programa sempre desinstala o programa?

**Raciocínio esperado:** Não. O atalho é uma referência. Desinstalar é outra operação, feita pelos recursos apropriados do sistema ou do instalador.

### 4. Janelas, foco e acessórios — 30 min

Uma janela é uma área de interação. A janela em foco recebe a maior parte dos comandos de teclado. Antes de digitar, verifique onde o cursor está. Isso evita enviar texto ao aplicativo errado ou substituir conteúdo sem querer.

**Prática**

1. Abra dois aplicativos e alterne entre eles.
2. Minimize um e recupere pela barra de tarefas.
3. Digite uma frase de teste, salve e feche observando os avisos.

**Aprofundamento:** Organize duas janelas lado a lado e explique como isso reduz alternâncias.

**Pergunta de retomada:** A janela desapareceu ao minimizar. O documento foi apagado?

**Raciocínio esperado:** Não. A janela foi recolhida e o aplicativo pode continuar em execução. Recuperar a janela e salvar são ações distintas.

**Conexão com XP:** Uma janela sumiu.

### 5. Pausa para retomar a atenção — 10 min

Salve o que estiver fazendo, afaste-se da tela por alguns minutos e retome no horário combinado. Ao voltar, conte ao colega uma ideia que ficou clara e uma dúvida que ainda precisa de exemplo.

### 6. Nomes, extensões e caminhos — 35 min

Arquivo é uma unidade de dados armazenada com nome e propriedades. Pasta organiza itens. Uma extensão, como .txt, .pdf ou .xlsx, ajuda a indicar o formato. Mudar apenas a extensão de um nome não converte o conteúdo para outro formato.

**Prática**

1. Crie Estudos e duas subpastas em um local autorizado.
2. Crie uma nota e faça uma cópia para comparar com a operação de mover.
3. No simulador, organize os três arquivos e diga seus destinos.

**Pergunta de retomada:** Renomear uma foto de .jpg para .pdf a transforma em PDF?

**Raciocínio esperado:** Não. Conversão envolve interpretar e gerar outro formato. Alterar o nome sozinho não realiza esse processo.

**Conexão com XP:** Resgate os arquivos da laboratório; Localize o documento.

### 7. Um pequeno projeto organizado — 30 min

Agora reúna as ações em uma tarefa completa. O objetivo não é executar o maior número de cliques, mas terminar com um conjunto fácil de encontrar e explicar. Se estiver em uma conta compartilhada, use o local indicado pelo professor.

**Prática**

1. Crie um arquivo de notas sobre um assunto de seu interesse.
2. Organize um texto, uma imagem de exercício e uma planilha em pastas.
3. Peça ao colega para localizar um item usando apenas a descrição do caminho.

**Aprofundamento:** Proponha um padrão por projeto e versão e explique onde ficaria uma cópia independente.

**Pergunta de retomada:** Qual é uma evidência de que sua organização funciona?

**Raciocínio esperado:** Outra pessoa consegue localizar o arquivo pelo nome e pelo caminho que você descreveu, sem depender de você abrir o item para ela.

**Conexão com XP:** Plano de organização.

### 8. Explique o que você fez — 15 min

Revise o caminho percorrido: abrir aplicativo, alternar janelas, salvar, localizar e organizar. Use verbos claros ao explicar: copiar não é mover; minimizar não é fechar; renomear não é converter.

**Prática**

1. Mostre o caminho de um arquivo a um colega.
2. Explique duas ações que parecem semelhantes, mas têm efeitos diferentes.

**Pergunta de retomada:** Que hábito reduz o risco de salvar no local errado?

**Raciocínio esperado:** Conferir a pasta ou caminho no diálogo de salvamento e confirmar o nome do arquivo antes de concluir.

**Fechamento e avaliação:** o tempo inclui prática e discussão. A quantidade mínima de caracteres permite o envio, mas não determina qualidade. Nas respostas abertas, verifique atendimento ao pedido, raciocínio e exemplos; peça revisão com uma orientação específica quando necessário.

## Aula 3 — Textos que trabalham

Editor de texto

**Objetivos**

- Planejar um documento para um público e objetivo.
- Editar texto e usar formatação com propósito.
- Revisar conteúdo e distinguir arquivo editável de exportação.
- Produzir um comunicado legível e acessível.

### 1. O que seu texto precisa comunicar? — 10 min

Um documento nasce de uma necessidade: orientar uma atividade, comunicar uma mudança, registrar uma reunião ou apresentar um pedido. Antes de escolher fonte ou cor, defina quem vai ler e o que essa pessoa precisa compreender ou fazer.

**Prática**

1. Escolha uma atividade real ou fictícia.
2. Escreva em uma frase para quem o comunicado será enviado.

**Pergunta de retomada:** Um texto bonito, mas sem data ou instrução clara, cumpre seu objetivo?

**Raciocínio esperado:** Não necessariamente. A apresentação precisa apoiar informações completas e compreensíveis.

### 2. Digitar, selecionar, corrigir e desfazer — 25 min

O cursor indica o ponto de inserção. Selecionar permite aplicar uma ação a um trecho. Backspace e Delete apagam em posições diferentes em relação ao cursor. Copiar mantém o trecho original; recortar prepara sua transferência; colar insere o conteúdo no destino.

**Prática**

1. Digite duas frases e selecione somente uma palavra.
2. Copie a palavra, cole em outro ponto e desfaça a alteração.
3. Revise plural, acentos e pontuação no texto de exercício.

**Pergunta de retomada:** Por que é importante conferir a seleção antes de digitar?

**Raciocínio esperado:** Porque o texto digitado pode substituir todo o trecho selecionado, não apenas acrescentar uma letra.

**Conexão com XP:** Conserte a frase; Uma edição reversível.

### 3. Hierarquia e formatação — 25 min

Fonte, tamanho, negrito e cor mudam a apresentação. O título deve ser reconhecível e o corpo precisa ser confortável de ler. Excesso de tipos e cores compete com o conteúdo. Escolha poucos padrões consistentes.

**Prática**

1. Diferencie título e corpo.
2. Transforme uma sequência de três instruções em lista.
3. Escolha somente uma orientação para destacar.

**Aprofundamento:** No editor completo, aplique um estilo de título e compare com alterar apenas o tamanho da fonte.

**Pergunta de retomada:** Usar negrito em todo o texto ajuda a encontrar o que é importante?

**Raciocínio esperado:** Não. Se tudo recebe o mesmo destaque, a hierarquia visual perde efeito.

### 4. Seu comunicado em construção — 30 min

Escreva primeiro uma versão curta e completa. Use os campos Público, Objetivo e Orientação para evitar informações soltas. Depois revise se alguém que não participou da conversa entenderia o pedido.

**Prática**

1. Crie um título específico, evitando apenas Aviso.
2. Preencha público, objetivo e orientações em pelo menos três parágrafos.
3. Ative lista e destaque e confira a prévia.

**Pergunta de retomada:** Qual é uma boa forma de revisar clareza?

**Raciocínio esperado:** Pedir a alguém para dizer, com suas palavras, o que deve fazer após ler o documento. Se a interpretação divergir, revise o trecho.

**Conexão com XP:** Um comunicado que orienta.

### 5. Pausa para retomar a atenção — 10 min

Salve o que estiver fazendo, afaste-se da tela por alguns minutos e retome no horário combinado. Ao voltar, conte ao colega uma ideia que ficou clara e uma dúvida que ainda precisa de exemplo.

### 6. Salvar, exportar e compartilhar — 35 min

Salvar registra o documento em um formato e local. Salvar como permite escolher outra cópia, nome ou formato, conforme o aplicativo. Antes de concluir, confira nome, pasta e extensão.

**Prática**

1. Salve a versão editável no local de exercícios.
2. Se o aplicativo permitir, exporte para PDF e compare a aparência.
3. Abra o arquivo exportado e confira título, quebras e texto.

**Aprofundamento:** Explique qual arquivo guardaria para editar no futuro e qual enviaria para leitura final.

**Pergunta de retomada:** Enviar uma cópia por mensagem permite que o destinatário veja automaticamente todas as suas futuras alterações?

**Raciocínio esperado:** Não. Uma cópia é independente. Um link de documento online pode apontar para o mesmo arquivo, conforme as permissões e o serviço.

### 7. Revisão em dupla — 30 min

A revisão considera conteúdo e apresentação. Verifique se as informações estão completas, se a ordem é compreensível e se cada destaque tem uma finalidade. Um corretor ortográfico pode sugerir mudanças, mas não entende sozinho toda a intenção do texto.

**Prática**

1. Troquem comunicados sem editar o texto do colega.
2. Cada leitor registra uma informação clara e uma pergunta.
3. O autor revisa e explica uma alteração de conteúdo e outra de formatação.

**Aprofundamento:** Inclua uma sugestão de acessibilidade, como título mais claro, contraste ou descrição de imagem.

**Pergunta de retomada:** Qual diferença há entre revisar e apenas decorar um documento?

**Raciocínio esperado:** Revisar melhora o sentido, a completude e a adequação ao público. Recursos visuais devem apoiar essa melhoria, e não substituí-la.

**Conexão com XP:** Revisão em dupla.

### 8. Um documento pronto para ser compreendido — 15 min

Apresente seu comunicado a outra pessoa e observe se ela identifica objetivo e orientação principal. A aprovação do laboratório verifica a estrutura solicitada; a qualidade do conteúdo também merece leitura e conversa.

**Prática**

1. Localize o arquivo sem depender de itens recentes.
2. Explique a diferença entre salvar um original editável e exportar uma cópia.

**Pergunta de retomada:** Qual é a melhor evidência de um texto útil?

**Raciocínio esperado:** O público consegue compreender a informação e realizar a ação esperada com os detalhes necessários.

**Fechamento e avaliação:** o tempo inclui prática e discussão. A quantidade mínima de caracteres permite o envio, mas não determina qualidade. Nas respostas abertas, verifique atendimento ao pedido, raciocínio e exemplos; peça revisão com uma orientação específica quando necessário.

## Aula 4 — Organize e calcule com planilhas

Planilha eletrônica: fundamentos

**Objetivos**

- Criar uma tabela com linhas, colunas e unidades claras.
- Editar dados e interpretar referências de células.
- Usar as quatro operações em fórmulas.
- Calcular totais e médias e conferir resultados.

### 1. Qual pergunta sua planilha vai responder? — 10 min

Uma planilha organiza dados em células e permite calcular resultados a partir deles. Pode ajudar a acompanhar gastos, horas de estudo, presença ou materiais de um projeto. Antes de digitar, defina a pergunta que quer responder.

**Prática**

1. Escolha uma pergunta que envolve números.
2. Liste as informações necessárias para respondê-la.

**Pergunta de retomada:** Uma planilha com muitos números, mas sem cabeçalhos e unidades, é fácil de interpretar?

**Raciocínio esperado:** Não. Cabeçalhos e unidades dão contexto aos valores e ajudam a detectar erros.

### 2. Células, intervalos e tipos de dado — 25 min

Colunas costumam ser identificadas por letras e linhas por números. B2 é uma referência à célula da coluna B na linha 2. B2:B4 é um intervalo que inclui B2, B3 e B4.

**Prática**

1. Crie a tabela no aplicativo disponível.
2. Altere uma atividade e um valor para praticar edição.
3. Indique quais células formam o intervalo das horas.

**Pergunta de retomada:** B2:B4 contém duas ou três células?

**Raciocínio esperado:** Três. O intervalo inclui o primeiro e o último endereço.

### 3. As quatro operações e a ordem do cálculo — 25 min

Fórmulas começam com =. Os operadores +, -, * e / representam adição, subtração, multiplicação e divisão. Uma fórmula pode usar números diretamente ou referências a células. Referências ajudam o cálculo a acompanhar mudanças dos dados.

**Prática**

1. Calcule os quatro resultados do orçamento no laboratório.
2. No aplicativo, coloque quantidade e preço em células e multiplique as referências.
3. Compare duas fórmulas com e sem parênteses.

**Aprofundamento:** Crie um exemplo em que subtrair um desconto antes ou depois de multiplicar muda o resultado.

**Pergunta de retomada:** Se B2 guarda 4 e C2 guarda 75, qual fórmula calcula o custo?

**Raciocínio esperado:** =B2*C2 retorna 300. Se a quantidade em B2 mudar, a fórmula passa a usar o novo valor.

**Conexão com XP:** O orçamento em quatro operações.

### 4. SOMA e referências que acompanham os dados — 30 min

=SOMA(B2:B4) calcula o total dos valores numéricos do intervalo. A função expressa a intenção de somar um conjunto e facilita ampliar a fórmula para mais linhas.

**Prática**

1. Preveja o total de 2, 4 e 6 antes de escrever a fórmula.
2. Use SOMA no campo do laboratório.
3. No aplicativo real, altere 2 para 5 e confira a atualização do total.

**Pergunta de retomada:** Por que =SOMA(12) não demonstra que a fórmula está ligada à tabela?

**Raciocínio esperado:** Porque 12 é uma constante. O resultado não acompanha uma mudança nas células de origem. Referenciar o intervalo torna o cálculo dependente dos dados.

**Conexão com XP:** Some as horas.

### 5. Pausa para retomar a atenção — 10 min

Salve o que estiver fazendo, afaste-se da tela por alguns minutos e retome no horário combinado. Ao voltar, conte ao colega uma ideia que ficou clara e uma dúvida que ainda precisa de exemplo.

### 6. MÉDIA, significado e conferência — 35 min

A média aritmética de um conjunto é a soma dos valores dividida pela quantidade de valores considerados. Para 2, 4 e 6, temos 12 dividido por 3, resultando em 4.

**Prática**

1. Calcule a média de 2, 4 e 6 no laboratório.
2. No aplicativo, compare o efeito de um zero numérico com uma célula vazia.
3. Explique em uma frase a diferença entre total de horas e média de horas.

**Aprofundamento:** Crie um conjunto com média 5 e explique por que decidiu usar três ou quatro valores.

**Pergunta de retomada:** Os conjuntos 4, 4, 4 e 0, 4, 8 têm a mesma média?

**Raciocínio esperado:** Sim. Ambos somam 12 e têm três valores, portanto a média é 4. As distribuições são diferentes, mostrando por que os dados individuais também importam.

**Conexão com XP:** Encontre a média.

### 7. Crie e teste uma planilha pequena — 30 min

Reúna cabeçalhos, dados de entrada e fórmulas em um pequeno orçamento. Use quantidade, valor unitário e total por item. Ao final, some os totais. O tema pode ser material de estudo, uma atividade ou um evento fictício.

**Prática**

1. No laboratório livre, edite quantidade e preço e veja o cálculo.
2. Reproduza três linhas no aplicativo e use referências.
3. Peça ao colega para alterar um dado e verificar o resultado sem reconstruir as fórmulas.

**Aprofundamento:** Explique uma fórmula de custo e o efeito de copiar para outra linha.

**Pergunta de retomada:** Como verificar se uma planilha depende corretamente das entradas?

**Raciocínio esperado:** Altere um dado de forma controlada, faça a previsão e compare o resultado. Volte ao valor original depois do teste, se necessário.

**Conexão com XP:** Uma célula que muda tudo.

### 8. Leia uma fórmula como uma frase — 15 min

Escolha uma fórmula e descreva sua intenção: “some as horas destas três atividades” ou “multiplique a quantidade pelo preço unitário”. Quando você entende o que cada referência representa, fica mais fácil revisar um erro.

**Prática**

1. Explique uma fórmula a alguém sem ler apenas os símbolos.
2. Registre uma diferença entre editar o dado e editar a fórmula.

**Pergunta de retomada:** Uma fórmula sem erro de sintaxe está necessariamente correta?

**Raciocínio esperado:** Não. Ela pode usar um intervalo inadequado, uma unidade errada ou responder uma pergunta diferente da desejada.

**Fechamento e avaliação:** o tempo inclui prática e discussão. A quantidade mínima de caracteres permite o envio, mas não determina qualidade. Nas respostas abertas, verifique atendimento ao pedido, raciocínio e exemplos; peça revisão com uma orientação específica quando necessário.

## Aula 5 — Decisões automáticas

Planilha eletrônica: funções

**Objetivos**

- Transformar uma regra em teste lógico.
- Somar somente registros que atendem a um critério.
- Buscar um valor por código com correspondência exata.
- Conferir a fórmula com entradas diferentes e dados ausentes.

### 1. Uma regra para cada pergunta — 10 min

Funções ajudam a traduzir perguntas em operações. SE responde a uma condição com dois caminhos. SOMASE calcula um total condicionado a um critério. PROCV procura um identificador na primeira coluna de uma tabela e devolve um campo da mesma linha.

**Prática**

1. Associe uma função a cada pergunta: situação por nota, horas por categoria e preço por código.
2. Explique quais colunas seriam necessárias.

**Pergunta de retomada:** Escolher primeiro a função e só depois pensar na pergunta é sempre uma boa estratégia?

**Raciocínio esperado:** Não. Definir o problema e os dados ajuda a escolher a ferramenta apropriada.

### 2. SE: teste, verdadeiro e falso — 25 min

A estrutura é =SE(teste_lógico;valor_se_verdadeiro;valor_se_falso). No teste, operadores como >, <, >=, <=, = e <> comparam valores. Um limite precisa ser definido sem ambiguidade: maior que 7 é diferente de maior ou igual a 7.

**Prática**

1. Preveja o resultado para 6, 7 e 8.
2. Altere a nota no simulador e compare com a previsão.
3. Escreva a fórmula da missão usando a célula B2.

**Aprofundamento:** Escreva duas formas equivalentes da regra, invertendo o teste e os rótulos.

**Pergunta de retomada:** Qual resultado deve aparecer para 7 se a regra é B2>=7?

**Raciocínio esperado:** O resultado do ramo verdadeiro, porque o operador inclui a igualdade.

**Conexão com XP:** Uma regra de acompanhamento.

### 3. SOMASE: selecionar e somar — 25 min

SOMASE utiliza um intervalo para verificar o critério e outro para somar os valores correspondentes. Em =SOMASE(A2:A4;"Estudo";B2:B4), o programa verifica a categoria de cada linha e acumula as horas das linhas que correspondem ao texto Estudo.

**Prática**

1. Marque mentalmente quais linhas atendem ao critério.
2. Some manualmente as linhas selecionadas.
3. No laboratório, escreva SOMASE e confira também o intervalo de soma.

**Aprofundamento:** Explique o que acontece quando nenhuma categoria corresponde ao critério.

**Pergunta de retomada:** SOMASE é o mesmo que contar quantas linhas têm uma categoria?

**Raciocínio esperado:** Não. SOMASE soma valores correspondentes. Contar ocorrências é outra pergunta e utiliza outra operação.

**Conexão com XP:** Horas de estudo.

### 4. PROCV: encontrar um item pelo código — 30 min

PROCV procura o valor na primeira coluna de um intervalo e retorna um campo de uma coluna indicada pelo seu número dentro desse intervalo. Se o intervalo começa em A e contém três colunas, a terceira coluna é o índice 3. O índice não é o número da linha.

**Prática**

1. Localize manualmente o código P02 antes de digitar.
2. Identifique a coluna do preço dentro do intervalo.
3. Escreva PROCV com FALSO e teste a diferença entre um código presente e outro ausente no aplicativo real.

**Aprofundamento:** Explique por que uma chave única torna a busca menos ambígua.

**Pergunta de retomada:** Na fórmula, o argumento 3 significa procurar na terceira linha?

**Raciocínio esperado:** Não. É o índice da coluna a retornar dentro da tabela informada. A linha é encontrada pelo código na primeira coluna.

**Conexão com XP:** Encontre a item P02.

### 5. Pausa para retomar a atenção — 10 min

Salve o que estiver fazendo, afaste-se da tela por alguns minutos e retome no horário combinado. Ao voltar, conte ao colega uma ideia que ficou clara e uma dúvida que ainda precisa de exemplo.

### 6. Uma fórmula precisa passar por testes — 35 min

Um resultado isolado não prova que a lógica está correta. Uma fórmula constante pode coincidir com o primeiro exemplo e falhar quando os dados mudam. Faça testes que atinjam partes diferentes da regra.

**Prática**

1. Crie uma pequena lista de casos de teste.
2. Compare a previsão com o resultado.
3. Explique uma diferença encontrada sem apenas tentar trocar símbolos ao acaso.

**Pergunta de retomada:** Por que testar só o caso que dá certo pode esconder um erro?

**Raciocínio esperado:** Porque outra parte da regra pode nunca ter sido executada ou a fórmula pode estar usando uma constante que coincide com aquele caso.

### 7. Um catálogo e um controle de atividades — 30 min

No aplicativo disponível, crie um catálogo de três produtos ou materiais com código, nome e preço. Em outra área, use um código para recuperar o preço. O mesmo raciocínio serve para cadastros em várias áreas.

**Prática**

1. Crie as duas tabelas e identifique entradas e resultados.
2. Peça a alguém para mudar um código e uma categoria.
3. Revise a busca e registre o que acontece em casos sem correspondência.

**Aprofundamento:** Escreva a auditoria bônus de uma busca aproximada usada por engano.

**Pergunta de retomada:** Uma busca deve sempre devolver algum preço, mesmo para um código inexistente?

**Raciocínio esperado:** Não. É mais confiável identificar a ausência do que apresentar um valor de outro item como se fosse correto.

**Conexão com XP:** Auditoria de uma busca.

### 8. Explique os argumentos — 15 min

Escolha uma função e leia sua estrutura como uma decisão: “se a nota atingir o limite, devolva este texto”; “some as horas somente desta categoria”; “encontre o preço deste código”.

**Prática**

1. Explique o papel de cada argumento em uma fórmula.
2. Guarde uma versão do arquivo com seus casos de teste.

**Pergunta de retomada:** O que fazer primeiro quando um total parece errado?

**Raciocínio esperado:** Conferir os dados, as unidades, as referências e o critério da fórmula com um exemplo pequeno que possa ser calculado manualmente.

**Fechamento e avaliação:** o tempo inclui prática e discussão. A quantidade mínima de caracteres permite o envio, mas não determina qualidade. Nas respostas abertas, verifique atendimento ao pedido, raciocínio e exemplos; peça revisão com uma orientação específica quando necessário.

## Aula 6 — Pequenas automações

Planilha eletrônica: macros

**Objetivos**

- Reconhecer tarefas repetitivas adequadas à automação.
- Planejar uma macro com início, ações, resultado e teste.
- Distinguir simulação, gravador e código VBA.
- Testar em cópias e avaliar as mudanças produzidas.

### 1. Que tarefa você repete? — 10 min

Automatizar é organizar uma sequência de ações para que seja executada com menos intervenção repetida. Formatar relatórios semelhantes ou preparar uma tabela recorrente são exemplos possíveis.

**Prática**

1. Liste uma tarefa repetitiva de estudo ou trabalho.
2. Separe o que é sempre igual do que muda.

**Pergunta de retomada:** Gravar muitos cliques sem entender o processo garante uma automação útil?

**Raciocínio esperado:** Não. A sequência pode depender de posições, seleções ou condições que não se repetem.

### 2. Macro, gravador e VBA — 25 min

Uma macro reúne ações que podem ser executadas como uma sequência. Em versões compatíveis do Excel para desktop, o gravador registra operações e pode gerar código VBA. É possível inspecionar e editar esse código, mas gravar não dispensa planejar.

**Prática**

1. Dê um nome claro para a macro planejada.
2. Liste os dados que precisam existir antes de executar.

**Pergunta de retomada:** O Excel para a Web executa VBA da mesma forma que o Excel desktop?

**Raciocínio esperado:** Não. O Excel para a Web não executa macros VBA. Os recursos de automação disponíveis dependem do aplicativo e da versão.

### 3. Entrada, ações e saída — 25 min

Um roteiro de automação começa com uma entrada conhecida, aplica ações e produz uma saída verificável. Para preparar um relatório, você pode abrir uma cópia, formatar o cabeçalho, calcular um total e salvar o resultado com identificação clara.

**Prática**

1. Escreva os passos sem usar nomes vagos como fazer tudo.
2. Marque quais passos dependem dos anteriores.
3. Ordene os blocos do desafio e veja o relatório simulado.

**Pergunta de retomada:** Qual é a diferença entre terminar uma execução e obter o resultado correto?

**Raciocínio esperado:** Uma execução pode chegar ao fim e ainda aplicar a regra errada. É preciso conferir os dados e as alterações esperadas.

**Conexão com XP:** Programe o fechamento do relatório.

### 4. Uma gravação curta e controlada — 30 min

No aplicativo compatível e autorizado, prepare um arquivo de exercício. Defina uma sequência curta, como formatar cabeçalhos. Inicie a gravação, realize somente as ações planejadas e pare a gravação antes de explorar outras funções.

**Prática**

1. Prepare um arquivo de teste com três linhas fictícias.
2. Grave ou descreva uma sequência de até quatro ações.
3. Execute em uma cópia e compare antes e depois.

**Aprofundamento:** Investigue como referências relativas e absolutas afetam o procedimento.

**Pergunta de retomada:** Por que uma gravação curta é útil para quem está começando?

**Raciocínio esperado:** Ela reduz a quantidade de mudanças a conferir e facilita perceber qual ação causou um resultado inesperado.

### 5. Pausa para retomar a atenção — 10 min

Salve o que estiver fazendo, afaste-se da tela por alguns minutos e retome no horário combinado. Ao voltar, conte ao colega uma ideia que ficou clara e uma dúvida que ainda precisa de exemplo.

### 6. Formato, origem e recuperação — 35 min

No Excel, .xlsm é um formato de pasta de trabalho que pode preservar VBA. .xlsx não preserva esse código. A extensão informa uma possibilidade do formato, mas não prova que o conteúdo é confiável.

**Prática**

1. Compare o papel do arquivo original, da cópia de trabalho e da saída.
2. Identifique o formato necessário para preservar VBA em aplicativo compatível.
3. Responda aos desafios sobre formato e teste.

**Pergunta de retomada:** Um arquivo .xlsm recebido de origem desconhecida deve ser executado só porque tem o formato correto?

**Raciocínio esperado:** Não. Formato e confiança são questões diferentes. A origem, a finalidade e o código precisam ser avaliados conforme as regras do ambiente.

**Conexão com XP:** Um formato que preserva VBA; Automação confiável.

### 7. Planeje uma automação útil — 30 min

Escolha uma rotina pequena: preparar um relatório de atividades, padronizar um cabeçalho ou organizar uma tabela de acompanhamento. Especifique entrada, ações e saída em linguagem direta.

**Prática**

1. Descreva quatro ações e um critério de conferência.
2. Inclua uma condição inicial e uma forma de recuperar o original.
3. Explique qual parte varia quando o relatório muda.

**Aprofundamento:** Proponha um teste com uma linha adicional e outro com uma informação ausente.

**Pergunta de retomada:** Por que documentar a condição inicial da macro?

**Raciocínio esperado:** Porque a sequência pode depender de uma planilha, coluna, seleção ou estrutura específica. Sem a condição, quem executa pode esperar um comportamento que não foi previsto.

**Conexão com XP:** Seu plano de macro.

### 8. O que foi automatizado? — 15 min

Explique quais ações deixaram de ser repetidas manualmente e quais decisões continuam exigindo análise humana. Uma automação útil não elimina a necessidade de conferência.

**Prática**

1. Compare a execução planejada com a saída obtida ou simulada.
2. Conte como preservou o original.

**Pergunta de retomada:** Quem é responsável por conferir uma saída automatizada?

**Raciocínio esperado:** A pessoa que usa e valida o processo precisa conferir se o resultado atende à necessidade, mesmo quando as etapas são executadas automaticamente.

**Fechamento e avaliação:** o tempo inclui prática e discussão. A quantidade mínima de caracteres permite o envio, mas não determina qualidade. Nas respostas abertas, verifique atendimento ao pedido, raciocínio e exemplos; peça revisão com uma orientação específica quando necessário.

## Aula 7 — Ideias que aparecem

Apresentações em slides

**Objetivos**

- Planejar uma narrativa para um público definido.
- Criar slides com texto legível e hierarquia clara.
- Inserir imagem e vídeo com propósito e descrição.
- Testar a apresentação e preparar uma alternativa para falhas.

### 1. O que você quer que o público leve? — 10 min

Uma apresentação organiza uma fala. Antes de escolher um tema visual, defina uma mensagem central e quem precisa compreendê-la. Um público iniciante precisa de exemplos diferentes de quem já conhece o assunto.

**Prática**

1. Escreva sua mensagem principal em uma frase.
2. Diga o que o público já sabe e o que precisa aprender.

**Pergunta de retomada:** O slide precisa conter tudo o que você vai falar?

**Raciocínio esperado:** Não. Ele deve apoiar a explicação com uma estrutura legível, enquanto detalhes podem ser desenvolvidos na fala e em materiais de apoio.

### 2. Uma sequência que orienta — 25 min

A abertura situa o assunto e o objetivo. O desenvolvimento apresenta ideias, exemplos ou etapas. A conclusão retoma a mensagem e indica uma ação, aprendizado ou pergunta final.

**Prática**

1. Escreva os títulos dos três slides antes dos textos.
2. Relacione uma ideia principal a cada título.
3. Organize a narrativa no desafio de sequência.

**Pergunta de retomada:** Uma boa conclusão deve apenas apresentar outro assunto novo?

**Raciocínio esperado:** Não. Ela deve ajudar a fechar o percurso e consolidar a mensagem principal, sem abrir uma longa explicação que não será desenvolvida.

**Conexão com XP:** Organize a narrativa.

### 3. Texto, contraste e espaço — 25 min

O que funciona no monitor perto do rosto pode ficar pequeno em uma projeção. Use tamanho confortável, contraste e espaço. Confira a leitura em uma escala próxima da apresentação.

**Prática**

1. Crie um slide com uma ideia e poucos elementos.
2. Peça ao colega para dizer o título e a mensagem sem aproximar o rosto da tela.
3. Revise um trecho que ficou extenso.

**Aprofundamento:** Explique uma decisão de hierarquia e outra de contraste.

**Pergunta de retomada:** Texto pequeno é uma boa solução para colocar mais conteúdo no slide?

**Raciocínio esperado:** Não. É melhor reorganizar a informação ou usar material de apoio do que comprometer a leitura.

### 4. Imagens e vídeos que explicam — 30 min

Uma imagem pode mostrar um objeto, uma comparação ou uma etapa. Escolha-a pela informação que acrescenta. Uma imagem meramente decorativa não substitui uma explicação. Descreva o que o público precisa observar.

**Prática**

1. Escolha uma ilustração e escreva sua descrição.
2. Defina o que o vídeo precisa ensinar e uma pergunta para o público.
3. Teste o link e descreva um plano alternativo.

**Pergunta de retomada:** Um vídeo mais longo sempre acrescenta mais aprendizagem?

**Raciocínio esperado:** Não. Ele precisa ter relação com o objetivo e tempo para observação e discussão. A duração deve ser adequada ao propósito.

**Conexão com XP:** Mídia que ensina.

### 5. Pausa para retomar a atenção — 10 min

Salve o que estiver fazendo, afaste-se da tela por alguns minutos e retome no horário combinado. Ao voltar, conte ao colega uma ideia que ficou clara e uma dúvida que ainda precisa de exemplo.

### 6. Monte seus três slides — 35 min

No construtor, preencha título e texto das três partes. O mínimo de caracteres serve para evitar campos vazios, não para medir a qualidade. Leia cada texto e verifique se ele ajuda a compreender a ideia do slide.

**Prática**

1. Preencha abertura, desenvolvimento e conclusão.
2. Revise o título e a legibilidade.
3. Abra a prévia e explique um slide sem ler todo o texto.

**Pergunta de retomada:** Por que preencher os campos mínimos não garante uma apresentação boa?

**Raciocínio esperado:** Porque qualidade envolve clareza, correção, adequação ao público e relação entre os elementos, não apenas quantidade de texto.

**Conexão com XP:** Três slides, uma mensagem.

### 7. Teste no ambiente de apresentação — 30 min

O ensaio inclui conteúdo e condições técnicas. Verifique como avançar, voltar, abrir mídia e retornar à apresentação. Tenha os arquivos e links necessários no local combinado.

**Prática**

1. Apresente os três slides a uma pessoa.
2. Teste o vídeo e o retorno para o slide.
3. Registre uma melhoria e a alternativa sem vídeo.

**Aprofundamento:** Escreva um roteiro de vídeo com pergunta de observação e alternativa.

**Pergunta de retomada:** Qual é um teste útil além de verificar se o arquivo abre?

**Raciocínio esperado:** Verificar se títulos são legíveis, links funcionam e a sequência pode ser conduzida sem perder a explicação.

**Conexão com XP:** Roteiro de vídeo.

### 8. Mensagem compreendida — 15 min

O público deve sair com uma ideia organizada. Pergunte a alguém o que aprendeu e compare com o objetivo inicial. Uma divergência é uma oportunidade de ajustar a narrativa.

**Prática**

1. Retome sua mensagem principal em uma frase.
2. Guarde as fontes de imagens e dados utilizados.

**Pergunta de retomada:** Uma apresentação pode melhorar ao remover um elemento?

**Raciocínio esperado:** Sim. Remover informação ou efeito que não serve ao objetivo pode melhorar foco e compreensão.

**Fechamento e avaliação:** o tempo inclui prática e discussão. A quantidade mínima de caracteres permite o envio, mas não determina qualidade. Nas respostas abertas, verifique atendimento ao pedido, raciocínio e exemplos; peça revisão com uma orientação específica quando necessário.

## Aula 8 — Sua ideia em cena

Projeto de apresentação: tema livre

**Objetivos**

- Definir tema, público e objetivo de uma apresentação.
- Pesquisar e registrar fontes sem confundir opinião com fato.
- Produzir, ensaiar e revisar uma apresentação própria.
- Oferecer e utilizar feedback específico.

### 1. Tema livre com um recorte possível — 10 min

Tema livre não significa ausência de planejamento. Escolha algo que você conheça ou queira pesquisar: uma habilidade, um problema do cotidiano, um projeto ou uma ideia. Faça um recorte que possa ser explicado no tempo combinado.

**Prática**

1. Proponha dois temas e escolha um.
2. Escreva uma pergunta central para a apresentação.

**Pergunta de retomada:** Por que recortar um tema amplo?

**Raciocínio esperado:** Para tornar o objetivo viável, escolher informações relevantes e desenvolver exemplos com profundidade suficiente.

### 2. Público e objetivo em linguagem clara — 25 min

Defina quem vai assistir e o que essa pessoa deverá entender ao final. Um objetivo observável ajuda a decidir quais slides precisam existir. “Explicar três etapas para organizar um projeto” é mais específico que “falar de organização”.

**Prática**

1. Preencha tema e público.
2. Escreva um objetivo que possa ser conferido.
3. Liste duas dúvidas prováveis de quem vai assistir.

**Pergunta de retomada:** Como saber se o objetivo foi alcançado?

**Raciocínio esperado:** Defina uma evidência, como o público conseguir explicar uma etapa, comparar opções ou responder uma pergunta ligada à mensagem.

### 3. Pesquise e selecione evidências — 25 min

Separe fatos, interpretações e experiências pessoais. Quando uma afirmação depende de pesquisa, registre a fonte e confira se ela realmente sustenta o que você escreveu.

**Prática**

1. Registre ao menos uma fonte verificável.
2. Escolha uma informação e explique como a fonte a sustenta.
3. Identifique o que é opinião ou experiência no seu roteiro.

**Aprofundamento:** Compare duas fontes sobre um ponto e explique uma diferença de contexto.

**Pergunta de retomada:** Uma fonte citada no final sustenta automaticamente toda afirmação da apresentação?

**Raciocínio esperado:** Não. É preciso que exista uma relação clara entre a afirmação e o conteúdo da fonte.

### 4. Estrutura e construção — 30 min

Organize uma abertura que apresenta a pergunta, um desenvolvimento com exemplos e uma conclusão que responde à pergunta central. Uma sugestão para este exercício é usar de quatro a seis slides, ajustados ao tempo da sala.

**Prática**

1. Escreva o roteiro com pelo menos uma ideia por parte.
2. Crie uma primeira versão dos slides.
3. Envie o planejamento para avaliação e continue desenvolvendo o trabalho.

**Pergunta de retomada:** Qual é o papel do roteiro antes do acabamento visual?

**Raciocínio esperado:** Verificar se a apresentação tem uma sequência compreensível e se as informações contribuem para o objetivo.

**Conexão com XP:** Planeje antes de apresentar.

### 5. Pausa para retomar a atenção — 10 min

Salve o que estiver fazendo, afaste-se da tela por alguns minutos e retome no horário combinado. Ao voltar, conte ao colega uma ideia que ficou clara e uma dúvida que ainda precisa de exemplo.

### 6. Ensaiar, medir e revisar — 35 min

Faça um ensaio com duração combinada pelo professor. Observe onde faltam exemplos, onde a fala fica presa à leitura e onde sobra informação. Medir tempo não serve para premiar quem fala mais rápido, mas para ajustar o percurso.

**Prática**

1. Registre o tempo do ensaio e uma dificuldade.
2. Escolha duas alterações justificadas.
3. Envie o registro e revise a apresentação.

**Pergunta de retomada:** Qual devolutiva ajuda mais: “ficou ruim” ou “no slide 2, explique o termo antes do exemplo”?

**Raciocínio esperado:** A segunda, porque identifica um ponto e sugere uma mudança concreta que o autor pode avaliar.

**Conexão com XP:** Ensaio com evidências; Feedback que ajuda.

### 7. Apresentação e perguntas — 30 min

Apresente para uma pessoa ou grupo conforme a organização da sala. Quem escuta deve observar a mensagem central e anotar uma pergunta relacionada ao objetivo.

**Prática**

1. Apresente sem ler integralmente cada slide.
2. Responda a uma pergunta ou registre o que precisa pesquisar.
3. Prepare duas perguntas prováveis com respostas apoiadas em exemplos ou fontes.

**Aprofundamento:** Escreva perguntas de comparação e aplicação, com respostas justificadas.

**Pergunta de retomada:** Como responder quando a pergunta ultrapassa o que você pesquisou?

**Raciocínio esperado:** Explique o limite do que sabe, sem inventar, e indique qual verificação seria necessária para responder.

**Conexão com XP:** Perguntas do público.

### 8. O que mudou entre a primeira e a última versão? — 15 min

Compare o planejamento inicial com o resultado. Identifique uma decisão que permaneceu e outra que mudou após o ensaio. O processo de revisão faz parte da aprendizagem.

**Prática**

1. Mostre uma alteração concreta feita após feedback.
2. Explique se a mensagem final corresponde ao objetivo.

**Pergunta de retomada:** Revisar depois do ensaio significa que o planejamento falhou?

**Raciocínio esperado:** Não. O ensaio produz evidências que ajudam a melhorar o planejamento e a apresentação.

**Fechamento e avaliação:** o tempo inclui prática e discussão. A quantidade mínima de caracteres permite o envio, mas não determina qualidade. Nas respostas abertas, verifique atendimento ao pedido, raciocínio e exemplos; peça revisão com uma orientação específica quando necessário.

## Aula 9 — Dados com endereço

Fundamentos de bancos de dados

**Objetivos**

- Distinguir tabela, campo e registro.
- Definir tipos e uma chave primária.
- Relacionar cadastros por identificadores.
- Construir uma estrutura e consultar dados fictícios.

### 1. Por que organizar dados? — 10 min

Uma lista pequena pode ser lida linha por linha. À medida que os registros crescem, surgem perguntas: qual item está acabando, quem fez uma inscrição ou quais empréstimos estão em aberto? Um banco de dados organiza informações para consulta e atualização.

**Prática**

1. Pense em um cadastro usado no cotidiano.
2. Liste duas perguntas que gostaria de responder com ele.

**Pergunta de retomada:** Guardar muitos dados sem estrutura garante que seja fácil consultá-los?

**Raciocínio esperado:** Não. É necessário definir atributos, identificar registros e manter consistência.

### 2. Tabelas, campos e registros — 25 min

Em uma tabela relacional, colunas representam atributos e linhas representam registros. Em um catálogo, cada registro pode descrever um item e os campos podem ser id, nome e estoque.

**Prática**

1. Identifique campo e registro na tabela.
2. Explique por que nome e estoque precisam de tipos diferentes.

**Pergunta de retomada:** Uma linha e uma coluna representam a mesma coisa?

**Raciocínio esperado:** Não. A linha reúne atributos de um registro; a coluna reúne o mesmo atributo entre diferentes registros.

### 3. Identificadores e relações — 25 min

Uma chave primária identifica cada registro de forma única e não nula. Nomes podem se repetir e mudar; um identificador ajuda a manter a referência. A escolha da chave precisa fazer sentido para o modelo.

**Prática**

1. Escolha um identificador para leitores.
2. Desenhe leitores e empréstimos e marque a relação.
3. Explique por que dois leitores podem ter o mesmo nome sem serem a mesma pessoa.

**Pergunta de retomada:** A cor de um item é uma boa chave primária quando muitas linhas têm a mesma cor?

**Raciocínio esperado:** Não. Uma chave primária precisa distinguir os registros sem repetição.

**Conexão com XP:** Um código que identifica.

### 4. Crie a tabela no construtor — 30 min

O construtor do laboratório permite definir um nome de tabela e três campos. Use itens como nome, id como INTEGER e chave primária, nome como TEXT e estoque como INTEGER.

**Prática**

1. Preencha o nome da tabela e os campos na ordem pedida.
2. Marque somente id como chave primária.
3. Explique a estrutura antes de enviar para conferência.

**Pergunta de retomada:** Por que o laboratório não executa comandos na base que guarda os alunos?

**Raciocínio esperado:** Porque o exercício usa um ambiente didático isolado. Aprender a modelar ou consultar não exige modificar os registros reais de acesso e progresso.

**Conexão com XP:** Construa um catálogo.

### 5. Pausa para retomar a atenção — 10 min

Salve o que estiver fazendo, afaste-se da tela por alguns minutos e retome no horário combinado. Ao voltar, conte ao colega uma ideia que ficou clara e uma dúvida que ainda precisa de exemplo.

### 6. SELECT e WHERE: ler e filtrar — 35 min

SELECT indica os campos que serão lidos. FROM indica a tabela. WHERE define uma condição para filtrar registros. No exemplo SELECT * FROM itens WHERE estoque < 5, o asterisco solicita todos os campos e a condição seleciona linhas com estoque menor que 5.

**Prática**

1. Marque as linhas que espera receber.
2. Escreva a consulta no simulador.
3. Compare registros esperados e encontrados.

**Aprofundamento:** Explique a diferença entre selecionar campos e filtrar registros.

**Pergunta de retomada:** WHERE estoque < 5 inclui um registro com estoque igual a 5?

**Raciocínio esperado:** Não. Para incluir o limite, a condição precisaria usar <= 5.

**Conexão com XP:** Quais itens estão acabando?.

### 7. Modele um pequeno sistema — 30 min

Escolha um contexto geral: leitores e empréstimos, participantes e inscrições ou clientes e pedidos. Identifique o que cada tabela representa, quais campos precisa guardar e como elas se relacionam.

**Prática**

1. Desenhe duas tabelas e identifique suas chaves primárias.
2. Marque a chave estrangeira na tabela que aponta para a outra.
3. Explique uma atualização que ficaria mais simples com a separação.

**Aprofundamento:** Explique como diferenciar o endereço atual do cadastro de um endereço histórico de entrega.

**Pergunta de retomada:** Por que não repetir o endereço inteiro do cliente em todo pedido sem pensar na finalidade?

**Raciocínio esperado:** Isso pode criar cópias divergentes e dificultar atualizações. O modelo deve decidir conscientemente o que é referência ao cadastro e o que é um registro histórico do pedido.

**Conexão com XP:** Relacione cadastros.

### 8. Dê nome a cada parte — 15 min

Mostre uma tabela e diga quais são os campos, qual é um registro e qual atributo identifica a linha. Depois explique uma consulta como uma pergunta em linguagem comum.

**Prática**

1. Explique a consulta de estoque a alguém sem ler somente o SQL.
2. Revise a função de chave primária e estrangeira.

**Pergunta de retomada:** A consulta correta resolve uma tabela mal organizada?

**Raciocínio esperado:** Nem sempre. A qualidade da estrutura e dos dados influencia o que pode ser consultado com confiança.

**Fechamento e avaliação:** o tempo inclui prática e discussão. A quantidade mínima de caracteres permite o envio, mas não determina qualidade. Nas respostas abertas, verifique atendimento ao pedido, raciocínio e exemplos; peça revisão com uma orientação específica quando necessário.

## Aula 10 — A missão de encerramento

Revisão e avaliação final

**Objetivos**

- Relacionar conhecimentos das nove aulas anteriores.
- Identificar erros e justificar procedimentos de conferência.
- Revisar dúvidas com atividades de aplicação.
- Distinguir XP da jornada e nota da avaliação oficial.

### 1. O que você já explica com segurança? — 10 min

Retome seu passaporte e escolha uma habilidade que consegue explicar a outra pessoa. Depois identifique uma dúvida que ainda aparece quando a situação muda.

**Prática**

1. Liste uma habilidade e uma dúvida.
2. Escolha uma aula anterior para consultar uma explicação.

**Pergunta de retomada:** Ter muito XP significa automaticamente uma nota específica na prova?

**Raciocínio esperado:** Não. XP acompanha as missões e participação. A nota oficial é registrada separadamente pelo professor.

### 2. Do equipamento ao arquivo — 25 min

Use uma situação integrada: uma pessoa prepara um relatório e participa de uma reunião online. Identifique entrada, processamento, memória, armazenamento, saída e rede.

**Prática**

1. Desenhe o fluxo de uma chamada com câmera e microfone.
2. Explique onde fica um documento em edição e onde fica sua versão salva.

**Pergunta de retomada:** Trocar um cabo de vídeo resolve qualquer lentidão em um aplicativo?

**Raciocínio esperado:** Não. É necessário investigar o sintoma e o recurso envolvido, sem assumir que um componente explica todos os problemas.

### 3. Organização e comunicação — 25 min

Um projeto digital precisa de arquivos localizáveis e conteúdo compreensível. Defina um padrão simples de pastas, nomes e versões. No texto ou nos slides, confira objetivo, público, hierarquia e fonte das informações.

**Prática**

1. Explique como organizaria um projeto com texto, planilha e apresentação.
2. Identifique um erro de comunicação e uma alteração que o resolveria.

**Pergunta de retomada:** Uma apresentação com fontes registradas dispensa verificar se elas sustentam as afirmações?

**Raciocínio esperado:** Não. As referências precisam ter relação com as informações apresentadas e com o contexto em que serão usadas.

### 4. Fórmulas, automação e cadastros — 30 min

Revise soma, média, condições e buscas. Em cada fórmula, identifique as entradas e o resultado esperado. Use casos de teste para confirmar a lógica, especialmente perto de limites e em códigos ausentes.

**Prática**

1. Calcule manualmente a soma e a média de 2, 4 e 6.
2. Explique um teste útil para SE e outro para PROCV.
3. Descreva um identificador único e sua função.

**Pergunta de retomada:** Por que um número correto em um único exemplo não comprova que a fórmula é confiável?

**Raciocínio esperado:** Porque a fórmula pode usar uma constante ou referências inadequadas que só coincidem com aquele caso. Testar mudanças revela se a relação foi construída corretamente.

**Conexão com XP:** Revisão de fórmulas.

### 5. Pausa para retomar a atenção — 10 min

Salve o que estiver fazendo, afaste-se da tela por alguns minutos e retome no horário combinado. Ao voltar, conte ao colega uma ideia que ficou clara e uma dúvida que ainda precisa de exemplo.

### 6. Prática individual e avaliação — 35 min

Resolva os desafios integrados e justifique suas decisões. O professor pode destinar este bloco à avaliação oficial e ajustar a duração dos demais blocos para cumprir as regras da instituição.

**Prática**

1. Organize a sequência de tratamento de dados.
2. Escreva como coordenaria arquivos, documento, planilha e cadastro em um projeto.
3. Quando solicitado, participe da avaliação oficial conduzida pelo professor.

**Pergunta de retomada:** Os desafios desta aplicação substituem a prova oficial?

**Raciocínio esperado:** Não. São atividades autorais de revisão. A aplicação oferece um campo separado para o professor registrar o resultado oficial.

**Conexão com XP:** Do sensor ao relatório; Explique seu projeto digital.

### 7. Leia sua devolutiva e escolha o próximo passo — 30 min

Revisite uma atividade que exigiu nova tentativa e identifique o que mudou no seu raciocínio. Aprender inclui reconhecer um erro, buscar uma pista e conferir uma hipótese.

**Prática**

1. Leia as devolutivas disponíveis no passaporte.
2. Registre uma mudança que fará em uma atividade.
3. Escreva dicas acolhedoras para quem está começando.

**Aprofundamento:** Compare duas maneiras de resolver uma tarefa e justifique em que contexto cada uma ajuda.

**Pergunta de retomada:** O que torna uma dica acolhedora e útil?

**Raciocínio esperado:** Ser concreta, respeitar o ritmo de quem aprende e explicar uma ação possível, em vez de presumir que a pessoa já deveria saber.

**Conexão com XP:** Carta para o próximo aluno.

### 8. Sua aprendizagem continua — 15 min

Você estudou equipamentos, sistema operacional, documentos, planilhas, automação, apresentações e dados. A conexão entre esses assuntos permite trabalhar com mais autonomia em situações de estudo, vida cotidiana e diferentes áreas profissionais.

**Prática**

1. Registre uma conquista e uma prática para continuar.
2. Baixe seu resumo e guarde os arquivos que produziu.

**Pergunta de retomada:** Qual é um exemplo de meta verificável para continuar aprendendo?

**Raciocínio esperado:** Criar uma planilha de acompanhamento por uma semana, testar suas fórmulas com dois casos e explicar o resultado a alguém.

**Fechamento e avaliação:** o tempo inclui prática e discussão. A quantidade mínima de caracteres permite o envio, mas não determina qualidade. Nas respostas abertas, verifique atendimento ao pedido, raciocínio e exemplos; peça revisão com uma orientação específica quando necessário.

