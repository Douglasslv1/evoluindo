# Aula 1 — Computadores: história e funcionamento

- Relacionar mudanças tecnológicas a novos usos dos computadores.
- Explicar a função de CPU, RAM, armazenamento e periféricos.
- Interpretar unidades de dados sem confundir capacidade e velocidade.
- Montar uma estação e justificar conexões e escolhas.

## 1. Computadores no seu dia a dia (10 min)

Um computador recebe dados, executa instruções, mantém informações e produz resultados. Essa ideia vale para um notebook, um celular, um caixa de supermercado ou um equipamento de pesquisa. O formato muda; a necessidade de representar e processar dados permanece.

Dados são registros, como números, textos, imagens ou sinais. Informação é o significado que atribuímos a esses registros em um contexto. Os números 18, 22 e 30, sozinhos, não dizem muito. Quando sabemos que representam temperaturas em graus Celsius, conseguimos comparar situações e tomar decisões.

Usar um aplicativo não exige conhecer cada circuito. Entender os fundamentos, porém, ajuda a resolver problemas, explicar o que aconteceu com um arquivo e escolher recursos para estudar, comunicar-se ou trabalhar. Não é preciso ter experiência anterior: observe, faça uma previsão, teste e explique o resultado.

**Exemplo:** Ao pesquisar um endereço, você fornece texto pelo teclado ou pela voz. O aplicativo processa a solicitação e pode trocar dados pela rede. A tela mostra um mapa e uma rota. A conexão é parte do processo, mas teclado, processamento e tela também continuam existindo sem internet.

1. Liste três equipamentos digitais que você usou ou viu hoje.
2. Escolha um deles e identifique o que entra, o que é processado e o que sai.
3. Compare a resposta com a de alguém que escolheu outro equipamento.

**Conferência:** Um computador precisa de internet para executar qualquer tarefa?

Não. É possível editar um texto local, fazer cálculos ou abrir arquivos sem internet, desde que os programas e dados necessários estejam no equipamento. Serviços online podem exigir conexão.

**Para ir além:** Encontre um equipamento que tenha computador embarcado, mas não pareça um computador de mesa.


## 2. História: o que mudou em cada salto? (25 min)

A história da computação não começa com um único aparelho. Instrumentos de contagem, calculadoras mecânicas e projetos de máquinas programáveis responderam à necessidade de realizar operações de maneira organizada. No século XIX, Charles Babbage projetou máquinas de cálculo e uma Máquina Analítica de uso mais amplo. Ada Lovelace publicou notas sobre esse projeto em 1843, incluindo a descrição de um algoritmo.

Nos primeiros computadores eletrônicos, válvulas ajudavam a controlar sinais elétricos. O ENIAC, apresentado em 1946, é um marco dessa fase. Eram equipamentos grandes e especializados. Programar e manter essas máquinas exigia procedimentos muito diferentes dos que usamos em um aplicativo hoje.

O transistor, inventado em 1947, abriu caminho para componentes menores e com menor consumo em comparação às válvulas. Nos circuitos integrados, vários componentes passaram a compartilhar uma pequena peça semicondutora. O microprocessador comercial Intel 4004, de 1971, marcou a integração de funções de CPU em um chip.

A difusão dos computadores pessoais ampliou o acesso fora de grandes instituições. Redes, interfaces gráficas e dispositivos móveis mudaram as formas de produzir e compartilhar informações. As chamadas gerações são uma organização didática: tecnologias se sobrepõem, e uma geração não desaparece em uma data única. Inteligência artificial é uma área de aplicação da computação, não uma fronteira histórica com data universal de início.

**Exemplo:** Uma máquina grande usada por uma instituição e um celular de uso pessoal podem executar tarefas muito diferentes. A comparação relevante inclui tamanho, consumo, forma de programar, acesso e aplicações. A redução de componentes permitiu levar processamento a novos lugares.

1. Explore cada marco da linha do tempo.
2. Em duplas, escolham dois marcos e escrevam o que mudou na tecnologia e no uso.
3. Explique por que menor tamanho não é o único critério de evolução.

**Conferência:** Por que o transistor e o circuito integrado são marcos diferentes?

O transistor é um componente eletrônico. O circuito integrado reúne componentes em uma mesma estrutura semicondutora. Integrar muitos componentes permite aumentar a complexidade sem montar cada um separadamente.

**Para ir além:** Explique como uma tecnologia anterior pode continuar útil mesmo depois que outra surge.


## 3. Hardware, software e o caminho dos dados (20 min)

Hardware é a parte física: placa-mãe, processador, memória, tela e dispositivos de entrada, por exemplo. Software é o conjunto de programas e instruções que permite executar tarefas. Um navegador é software. A memória onde ele trabalha é hardware. Nenhum dos dois, isoladamente, explica toda a experiência de uso.

O sistema operacional coordena recursos e oferece serviços aos programas. Um aplicativo solicita operações ao sistema, que utiliza componentes e drivers para se comunicar com dispositivos. Firmware é software associado ao funcionamento de um equipamento. O fato de estar ligado ao hardware não faz dele uma peça física.

A placa-mãe conecta componentes compatíveis e oferece caminhos para os sinais. A fonte fornece energia adequada ao sistema. Refrigeração ajuda a manter a operação dentro dos limites previstos. A GPU se especializa em muitas operações paralelas e pode participar da produção de imagens, mas o vídeo exibido depende também do aplicativo e da tela.

Entrada, processamento, armazenamento e saída são funções, não uma lista rígida de peças. Uma tela sensível ao toque realiza entrada e saída. Um adaptador de rede envia e recebe dados. Ao analisar um equipamento, pergunte que função ele desempenha no fluxo específico que você está estudando.

1. Explore o mapa de componentes sem abrir um equipamento real.
2. Escolha um programa e descreva como hardware e software participam da tarefa.
3. Classifique navegador, teclado, sistema operacional e SSD como hardware ou software.

**Conferência:** Comprar uma tela maior aumenta automaticamente a capacidade da RAM?

Não. A tela apresenta imagens e a RAM mantém programas e dados em uso. São funções diferentes; mudar um componente não altera automaticamente a capacidade do outro.

**Para ir além:** Explique por que um dispositivo pode ser reconhecido pelo sistema e ainda precisar de um driver adequado.


## 4. Processadores: uma instrução por dentro (25 min)

A CPU executa instruções de programas. Em um modelo didático, ela busca uma instrução, interpreta o que deve fazer, executa a operação e mantém o resultado disponível. Processadores reais usam técnicas que sobrepõem etapas e exploram paralelismo; a sequência simples ajuda a entender as responsabilidades sem reproduzir todos os detalhes internos.

A unidade de controle coordena a execução. A unidade lógica e aritmética realiza cálculos e comparações. Registradores mantêm valores muito próximos da execução. Memórias cache conservam cópias de dados e instruções para reduzir o tempo de acesso em situações frequentes. CPU não é sinônimo de gabinete: o gabinete abriga vários componentes.

Um núcleo é uma unidade de processamento capaz de executar instruções. Vários núcleos podem ajudar quando o trabalho é distribuído em tarefas paralelas. Isso não significa que todo aplicativo fica duas vezes mais rápido ao dobrar os núcleos. Dependências entre etapas, implementação do programa e comunicação entre recursos influenciam o resultado.

Frequência em GHz representa bilhões de ciclos por segundo, não uma quantidade fixa de tarefas concluídas. Arquitetura, cache, quantidade de núcleos, limites de energia e refrigeração também importam. Para comparar equipamentos, primeiro defina a tarefa e observe o desempenho no cenário real.

**Exemplo:** O programa pede uma soma. A CPU busca a instrução e os valores, identifica a operação, calcula 20 e disponibiliza o resultado. Se o aplicativo mostrar 20 na tela, outras etapas de software e vídeo também participam. Se salvar em um arquivo, será necessária uma operação de armazenamento.

1. Avance os quatro passos da simulação e descreva cada um com suas palavras.
2. Antes da execução, preveja em qual passo o resultado 20 aparecerá.
3. Compare duas CPUs hipotéticas: 4 núcleos a 3 GHz e 8 núcleos a 2,5 GHz. Liste informações que faltam para escolher.

**Conferência:** O segundo processador é sempre melhor porque tem mais núcleos?

Não. A escolha depende da arquitetura, da tarefa e de quanto o aplicativo usa paralelismo, além de outros recursos do equipamento. Os dois números não bastam para concluir.

**Para ir além:** Dê um exemplo de tarefa com etapas dependentes e outro que possa dividir trabalho em paralelo.


## 5. Pausa para retomar a atenção (10 min)

Salve o que estiver fazendo, afaste-se da tela por alguns minutos e retome no horário combinado. Ao voltar, conte ao colega uma ideia que ficou clara e uma dúvida que ainda precisa de exemplo.


## 6. Memória, salvamento e unidades de dados (30 min)

A RAM mantém programas e dados em uso. Na memória RAM usual, o conteúdo se perde sem energia: ela é volátil. Isso não significa que todo arquivo desaparece ao desligar. Arquivos já salvos permanecem no armazenamento; alterações ainda não gravadas podem ser perdidas. Recursos de recuperação automática ajudam em alguns programas, mas não substituem salvar e conferir.

SSD e HD são formas de armazenamento persistente. SSD utiliza memória flash e HD utiliza discos magnéticos com partes móveis. Capacidade indica quanto cabe. Velocidade e latência dizem respeito ao tempo de transferência e acesso. Um SSD com maior capacidade não é necessariamente mais rápido em qualquer situação, e armazenamento livre não substitui RAM automaticamente.

Um bit representa um valor binário, 0 ou 1. Um byte reúne oito bits. Com oito posições binárias existem 256 combinações, que podem representar números de 0 a 255 em uma interpretação sem sinal. Textos, imagens, áudio e programas usam representações em bits; um caractere pode ocupar mais de um byte, conforme a codificação.

Observe as unidades. Em múltiplos decimais, 1 kB = 1.000 B, 1 MB = 1.000.000 B e 1 GB = 1.000.000.000 B. Em múltiplos binários, 1 KiB = 1.024 B, 1 MiB = 1.048.576 B e 1 GiB = 1.073.741.824 B. Os símbolos distinguem convenções. Além disso, b costuma indicar bit e B indica byte: 80 Mb/s correspondem a 10 MB/s antes de considerar perdas e sobrecargas.

**Exemplo:** Se cada apresentação ocupar 25 MB, quarenta apresentações ocupam 1.000 MB, ou 1 GB na convenção decimal. O espaço total necessário também inclui programas, outras versões e cópias. Para salvar duas versões independentes desses mesmos arquivos, estime 2 GB antes de considerar diferenças de tamanho.

1. Na simulação, edite e desligue sem salvar; observe o que permaneceu.
2. Repita, agora salvando antes de desligar. Compare os resultados.
3. Use a bancada binária para formar 5, 10 e 255. Depois estime o espaço para 120 arquivos de 25 MB.

**Conferência:** Um computador com 1 TB de SSD tem necessariamente mais RAM que outro com 256 GB de SSD?

Não. A capacidade de armazenamento não informa a capacidade da RAM. Para os arquivos: 120 × 25 MB = 3.000 MB = 3 GB na convenção decimal.

**Para ir além:** Uma conexão anuncia 80 Mb/s. Estime o tempo ideal para transferir 100 MB e explique por que a medição real pode demorar mais. Resposta ideal: 10 segundos, antes de sobrecargas e variações de rede.


## 7. Periféricos: sinais que entram e saem (30 min)

Um periférico de entrada envia dados para o sistema: teclado, mouse, microfone, câmera e scanner são exemplos. Um periférico de saída apresenta resultados: monitor, caixa de som e impressora. Há dispositivos que realizam ambas as funções, como uma tela sensível ao toque e uma interface de rede. A classificação precisa considerar a função, e não só a aparência.

A conexão depende de compatibilidade física, elétrica e de protocolo. USB-A e USB-C são formatos de conectores. O formato sozinho não garante velocidade, carregamento ou suporte a vídeo. HDMI pode transportar áudio e vídeo digitais. Ethernet oferece comunicação de rede cabeada; estar na rede local não garante acesso à internet.

No modelo traseiro do laboratório, verde indica saída de áudio e rosa indica entrada de microfone. Equipamentos podem ter conectores combinados ou outra identificação: consulte os símbolos e a documentação. Algumas saídas de vídeo ficam na placa-mãe, outras em uma placa dedicada. Não force um conector porque ele parece quase caber.

Um problema simples pode estar no cabo, na entrada selecionada na tela, na alimentação ou no dispositivo escolhido pelo aplicativo. Investigue uma condição por vez. O laboratório é virtual: nenhuma atividade exige abrir a fonte ou manipular circuitos ligados.

1. Classifique cada dispositivo e explique em qual direção a informação circula.
2. No jogo de cabos, conecte os seis itens e confira o resultado.
3. Simule uma chamada: identifique câmera, microfone, tela, áudio e rede. Qual recurso investigaria se a imagem funciona, mas ninguém escuta você?

**Conferência:** Uma impressora multifuncional só faz saída?

A parte de impressão faz saída. O scanner realiza entrada. O conjunto oferece funções de entrada e saída. Em uma chamada sem voz, verifique microfone selecionado, permissões, mudo e conexão, em vez de trocar peças sem diagnóstico.

**Para ir além:** Explique a diferença entre formato de conector e recurso suportado, usando USB-C como exemplo.


## 8. Escolha, diagnostique e explique (30 min)

A compreensão aparece quando você consegue justificar uma decisão. Para estudos com documentos e navegação, o perfil de uso é diferente do de edição de vídeo, jogos ou grandes cálculos. Antes de indicar uma troca, descreva a tarefa, os sintomas e quais recursos estão ocupados.

Considere três situações: o armazenamento está quase cheio; muitas abas deixam pouca RAM disponível; ou uma tarefa de cálculo utiliza intensamente a CPU. As três podem parecer apenas lentidão para quem usa o computador, mas as medições e as soluções possíveis são diferentes. Uma hipótese deve poder ser verificada.

Finalize as missões da aula e depois explique um erro que corrigiu. Não é necessário fazer tudo sem ajuda. A meta é conseguir relacionar entrada, processamento, memória, armazenamento e saída em uma situação nova, em vez de apenas memorizar siglas.

1. Faça as missões com XP que ainda faltam, incluindo a sequência histórica.
2. Em dupla, escolha um dos três cenários de lentidão e proponha duas verificações.
3. Individualmente, registre uma descoberta e uma pergunta no caderno da aula.

**Conferência:** Uma pessoa tem arquivos demais no SSD. Aumentar apenas a RAM resolve o espaço ocupado por esses arquivos?

Não. RAM e armazenamento têm funções diferentes. Primeiro é preciso analisar o uso do disco, organizar dados e avaliar a necessidade de armazenamento ou de cópias, sem apagar arquivos indiscriminadamente.

**Para ir além:** Faça o diagnóstico bônus e compare sua justificativa com uma de outro perfil de usuário.

