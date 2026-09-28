# Pilares

Um espaço para crescer, um dia de cada vez. Aplicativo web em português para cuidar de cinco dimensões da vida. As cinco fases entregam os espaços **Espiritual**, **Mental e Emocional**, **Físico**, **Intelectual** e **Financeiro**, sem conta, custos ou sincronização.

**Experimente:** https://pilares.pages.dev/ · **Código:** https://github.com/iurjoh/pilares (repositório privado)

## O que já funciona

- **Espiritual:** plano "Bíblia em um ano" com 365 leituras, referências em PT-BR e 66 livros/1.189 capítulos na ordem canônica protestante. Cada dia tem 3 ou 4 capítulos. Não reproduz o texto bíblico: leia na tradução de sua preferência.
- Escolha a data de início; o dia correspondente é calculado pelo calendário local, sem perder marcações anteriores. Navegue entre os 365 dias, marque/desmarque leituras e acompanhe dias concluídos e porcentagem do total. Depois do último dia, o plano fica no dia 365 até uma nova data de início.
- Checklist semanal: leitura diária da Bíblia, culto familiar semanal, participação na comunidade e ensino bíblico. A semana começa segunda-feira; as marcações das semanas passadas permanecem guardadas, mas a nova semana aparece em branco. Este é um lembrete semanal, não um registro de sete leituras separadas.
- Resumo espiritual na página inicial: dia atual, referências, leituras concluídas e práticas marcadas na semana.
- PWA instalável e utilizável offline após a primeira visita; cinco rotas e navegação responsiva. As trilhas cronológica, Antigo Testamento, Novo Testamento e estudos ainda estão identificadas como futuras.

## Fase 2 - Mental e Emocional

- **Suas Meditações:** check-in de humor em cinco níveis com nota livre opcional. O convite à reflexão diária remete a Marco Aurélio; não é citação da obra. Calendário mensal permite rever e editar dias passados e identificar padrões. O resumo na home mostra o humor de hoje, 0 a 3 práticas nesta semana e a sequência de check-ins até hoje.
- **Relações:** checklist semanal de diálogo e escuta ativa, tempo individual e tempo familiar. A semana começa segunda-feira, com histórico local por semana.
- **Telas e criatividade:** limite diário de horas configurável, registro de horas por dia e avaliação de dentro/fora do limite. Ideias de atividades sem tela e banco de ideias próprias, armazenados localmente.
- **Acompanhamento psicológico:** desligado por padrão. Ao ativar, mostra registro de sessões passadas com data, profissional opcional e anotações privadas. Desativar oculta, sem apagar. Cada sessão pode ser excluída.
- **Lembrete diário:** desligado por padrão. Quando ativado, pode aparecer **somente enquanto o app está aberto**, após o horário escolhido, se faltar o check-in. Não há push, agendamento em segundo plano nem garantia de alerta com o app fechado. Lembrete de sessões não está implementado; não apresentar como disponível.
- A rota `/mental-emocional` (também `/mental`) continua carregada sob demanda, em arquivo separado do Espiritual. Estado versionado em `src/mental-state.ts`, chave `mental-emocional-v1` separada no mesmo IndexedDB. Datas locais `AAAA-MM-DD`, sem deslocamento UTC. Nenhum dado pessoal entra no código ou sai para servidor. Não há exportação/backup: limpar dados do site ou trocar aparelho perde o histórico, inclusive notas íntimas. Não substitui terapia ou aconselhamento profissional.

## Fase 3 - Físico

- **Água do dia:** meta diária ajustável (2 litros por padrão). Barra deslizante de zero até a meta e campo em litros mostram o mesmo registro - o usuário escolhe como preencher. O resumo indica quanto falta ou celebra a meta batida.
- **Sono:** registro das horas dormidas contra a meta (8 horas por padrão), com avaliação de abaixo/na/acima da meta. "Personalizar sono" é desligado por padrão; ao ativar, aparecem meta em horas, hora de dormir e de acordar, e alarme de despertar. O alarme aparece **somente enquanto o app está aberto**, no horário escolhido, até a noite ser registrada. Não há push, agendamento em segundo plano nem garantia de alerta com o app fechado.
- **Exercício:** pergunta diária - fez seus 30 minutos de movimento? Sim ou não.
- **Alimentação:** pergunta diária - hoje foi um dia de alimentação saudável? Sim ou não.
- **Resumo na home:** cuidados concluídos no dia e sequência de dias com os 4 cuidados completos (água e sono na meta, exercício e alimentação marcados).
- A rota `/fisico` continua carregada sob demanda, em arquivo separado dos demais módulos. Estado versionado em `src/physical-state.ts`, chave `fisico-v1` separada no mesmo IndexedDB. Datas locais `AAAA-MM-DD`. Nenhum dado pessoal entra no código ou sai para servidor. Limpar dados do site ou trocar aparelho perde o histórico. O módulo não substitui orientação médica ou nutricional.

## Fase 4 - Intelectual

- **Leitura de hoje:** meta diária em minutos ajustável (30 por padrão), no estilo do controle de telas do Mental. Barra deslizante até a meta e campo em minutos mostram o mesmo registro; o resumo indica quanto falta ou celebra a meta batida.
- **Aprendizado:** pergunta diária "O que você aprendeu hoje?", com caderno dos últimos registros e sequência de dias aprendendo.
- **Habilidades:** lista própria (idiomas, instrumentos, técnicas...) com checklist semanal, no estilo do Espiritual. A semana começa segunda-feira; as semanas anteriores ficam guardadas neste navegador.
- **Interesses:** caderno de livros, filmes, temas e ideias novas, armazenado localmente.
- **Sophia:** banner de convite para o Sophia (https://sophia-philosophy.pages.dev), companheiro de filosofia que segue como aplicativo separado, sem migração.
- **Biblioteca pessoal:** a lista de livros e os links privados do Drive não são publicados no app. Leitura, habilidades e interesses continuam funcionando offline.
- **Pedir um livro:** botão que abre um e-mail pré-preenchido para sugerir um livro.
- **Resumo na home:** minutos de leitura do dia contra a meta e habilidades praticadas na semana.
- A rota `/intelectual` continua carregada sob demanda, em arquivo separado dos demais módulos. Estado versionado em `src/intellectual-state.ts`, chave `intelectual-v1` separada no mesmo IndexedDB. Datas locais `AAAA-MM-DD`. Os registros do usuário ficam no navegador. A lista privada do Drive não é distribuída no JavaScript público.

### Biblioteca privada

A listagem de 179 títulos e IDs do Drive foi retirada da interface e do bundle público na onda 1 (28/09/2026). O arquivo-fonte `src/intellectual/library.ts` permanece apenas no repositório privado, sem importação no app; não voltar a importá-lo nem colocá-lo em `public/`. A solução privada aprovada chegou na Fase 6.1: cada usuário conecta a própria pasta do Google Drive (ver abaixo).

## Fase 5 - Financeiro

- **Dízimo:** desligado por padrão (opt-in). Ao ativar, aparecem o controle mensal simples ("o dízimo deste mês foi separado?", com anotação opcional) e a etapa dízimo no checklist da ordem do dinheiro. Pensado para qualquer usuário: quem não dizima nunca vê a opção marcada.
- **Ordem do dinheiro:** checklist mensal das etapas (dízimo → contas → custo de vida → investe o resto; dízimo só quando ativado). O checklist recomeça no dia 1º; os meses anteriores ficam guardados neste navegador.
- **Planejamento do mês:** uma nota curta com o objetivo financeiro da família no mês e revisão simples (consegui/não consegui, com espaço para o porquê).
- **Investimentos:** genérico de propósito - cada pessoa define a própria meta em uma frase (valor, hábito ou prazo) e marca manualmente quando atingir. Metas atingidas podem ser arquivadas, com histórico local.
- **Investor OS:** banner de convite para o Investor OS (https://investor-os-app.pages.dev), app separado. Com o opt-in "Uso o Investor OS", o bloco de investimentos acopla o atalho para o app externo. É só um link - não há sincronização de dados entre os apps.
- **Privacidade reforçada:** nenhum valor monetário do Iuri entra no código, no app, nos textos ou no README - nem como exemplo, nem como padrão. Toda quantia é digitada pelo usuário e fica só no aparelho. O módulo não se conecta a bancos, Avanza ou qualquer instituição: é um caderno de controle, não uma integração financeira.
- **Resumo na home:** etapas da ordem concluídas no mês e situação da meta de investimento. Com o quinto pilar, o texto de fechamento da home celebra os cinco caminhos completos.
- A rota `/financeiro` continua carregada sob demanda, em arquivo separado dos demais módulos. Estado versionado em `src/financial-state.ts`, chave `financeiro-v1` separada no mesmo IndexedDB. Meses calculados no fuso do aparelho. Nenhum dado pessoal entra no código ou sai para servidor.


## Fase 6.1 - Biblioteca pessoal na nuvem e app multilíngue

- **Biblioteca pessoal (Intelectual, seção 05):** quem visita sem login vê a página como antes. Quem entra com a própria conta Google escolhe uma pasta do Drive (sugestão padrão: `Pilares/Biblioteca`) ou arquivos PDF soltos, e a grade da biblioteca aparece só para essa pessoa. Cada livro abre em um leitor dentro do app (visualizador do Drive em iframe).
- **Arquitetura sem servidor:** OAuth 2.0 no navegador (Google Identity Services + Google Picker), escopo `drive.file` somente leitura. O token vive na `sessionStorage` da aba, a seleção na `localStorage`, e o navegador fala direto com as APIs do Google. Nada passa por servidor próprio - o Pilares continua sem backend. Credenciais públicas (`src/config.ts`): client ID e API key restritos por origem; não são segredo, o escopo limitado é a proteção.
- **Preparação da pasta (3 passos guiados no app):** instalar o Google Drive no computador, sincronizar a pasta da biblioteca como "disponível offline" e recarregar a página antes de escolher os arquivos - assim a pré-visualização e o Picker funcionam direito.
- **Multilíngue de nascimento:** toda a interface passa por `t()` (`src/i18n/`), com português (padrão) e inglês completos. O idioma é escolhido em **Configurações** (`/configuracoes`, engrenagem no cabeçalho) e fica gravado no navegador; datas acompanham o idioma. Novos idiomas = um arquivo de dicionário novo. Textos de conteúdo (referências bíblicas, rótulos de dados) são traduzidos na renderização.
- **Privacidade:** página pública `/privacidade` (e `/privacy` em inglês) com a política completa: dados no navegador, OAuth somente leitura, terceiros (Google Fonts, Google APIs, Cloudflare) e direitos GDPR/LGPD. Configurações também permite desconectar a conta Google e revogar o acesso.
- **Provedores de nuvem:** Google Drive é o primeiro. OneDrive, Dropbox e outras nuvens populares ficam documentadas como adições futuras, atrás da mesma abstração de biblioteca.
- **A antiga listagem pública nunca volta:** os 179 links do dono continuam fora do bundle; a biblioteca que aparece é sempre a do visitante que fez login.

## Rodar localmente

Requer Node.js 20.19+ ou 22.12+.

```sh
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

Não há lockfile versionado ainda, então use `npm install` (não `npm ci`). Não inclua dados pessoais ou credenciais no repositório.

## Decisões técnicas

- React, TypeScript, Vite e Tailwind CSS 4. Rotas carregadas sob demanda com `React.lazy` e `Suspense`.
- `src/spiritual/plan.ts`: catálogo de 66 livros e tamanho em capítulos; a distribuição usa limites `floor(dia * 1189 / 365)`, garantindo exatamente 1.189 capítulos uma vez só em 365 dias. Contagem conferida com [VerseNotes](https://versenotes.org/a-list-of-books-in-the-bible-by-number-of-chapters/) e [Living Greek NT](https://www.livinggreeknt.org/resources/chapter-count.php). É um plano autoral de distribuição uniforme, não uma cópia de um plano editorial.
- `src/spiritual/state.ts`: estado versionado em uma chave do `KeyValueStore` assíncrono (`src/lib/store.ts`) sobre IndexedDB. Data `AAAA-MM-DD` e início da semana por segunda-feira evitam deriva em fuso horário e horário de verão. Não há login, backend, analytics ou sincronização. Limpar os dados do site ou trocar de dispositivo perde o progresso.
- O service worker e o manifesto são gerados pelo `vite-plugin-pwa`; assets são pré-armazenados. Fontes externas têm fallback local. `_redirects` serve as rotas diretamente quando online.
- Cloudflare Pages ligado ao branch `main` do repositório privado, com deploy automático: comando `npm install && npm run build`, diretório `dist`. Não usa plano pago, cartão ou billing.
- `src/i18n/`: provedor de idioma com as strings em português como chave (msgid); `en.ts` é o dicionário inglês. Datas formatadas com `Intl.DateTimeFormat` no idioma escolhido.
- `src/drive/`: carregadores dos scripts do Google (GIS e Picker), sessão OAuth em `sessionStorage`, seleção da biblioteca em `localStorage`. CSP em `public/_headers` autoriza só as origens do Google necessárias (login, Picker, APIs, iframe de leitura).

## Próximas etapas

Trilhas de leitura alternativas e eventual sincronização exigem implementação própria; os cartões atuais não insinuam progresso inexistente. Antes de abrir o produto a testers, avaliar exportação/backup de progresso, testes automatizados de interação e privacidade, e revisão editorial dos textos.



## Auditoria de qualidade (28/09/2026)

Antes de abrir o app para testers externos, o Pilares passou por uma auditoria com 5 personas independentes e em paralelo: **Atacante** (pentest), **Arquiteto** (qualidade de codigo), **Performance**, **Privacidade** (incluindo matriz GDPR artigo a artigo, com contraste LGPD) e **Acessibilidade** (WCAG 2.2 AA). Nenhum dado real de usuario foi usado, nada foi modificado no app durante os testes e nao houve custo.

**Resultado: 8 achados ALTA, 16 MEDIA e 12 BAIXA.**

### Metodo (resumo)

- **Atacante:** leitura do repositorio, visita as paginas publicas, leitura de headers HTTP e testes de XSS somente em espelho local dos assets, sem tocar o site ao vivo.
- **Arquiteto:** leitura do codigo (branch main) e inspecao visual da home; nenhum estado real modificado.
- **Performance:** espelho local dos artefatos publicados, Chrome headless, CPU 4x mais lenta, rede emulada 400 kb/s e 400 ms RTT, 1 ano de dados sinteticos no IndexedDB. Teste de laboratorio, nao medicao de usuarios reais.
- **Privacidade:** inspecao do codigo e do bundle publico, requisicoes de rede observadas no navegador, amostra de permissoes do Drive e checklist GDPR/LGPD (engenharia, nao parecer juridico).
- **Acessibilidade:** axe-core 4.10.2 ao vivo nas 6 paginas, navegacao real por teclado, contraste medido dos estilos computados, mobile 390px e zoom 200%.

### Principais achados

**ALTA**

1. A biblioteca pessoal (179 links/IDs do Google Drive) esta embutida no JavaScript publico da pagina Intelectual.
2. A gravacao e confirmada antes do commit real no IndexedDB (`src/lib/store.ts`).
3. A tela marca dados como salvos antes de gravar; em caso de falha, o dado some no reload.
4. Base legal GDPR (arts. 6 e 9) para dados sensiveis (saude, crenca) precisa ser definida antes de testers externos.
5. Transparencia: o texto "sem conta, servidor ou analytics" e absoluto demais (Google Fonts + Cloudflare); falta aviso de privacidade.
6. Abertura fria em 3G lento: LCP ~7,5s (meta: 2,5s); bundle base de 285 KB brutos.
7. Contraste de texto reprova no criterio AA em todas as 6 paginas (55+ elementos).
8. Textos de 9-10px em legendas, abaixo do minimo legivel (12px).

**MEDIA (resumo):** faltam headers de seguranca (CSP, X-Frame-Options, HSTS); Google Fonts carrega de terceiro; IndexedDB sem criptografia nem aviso de perfil compartilhado; faltam "baixar meus dados" e "apagar tudo" (direitos GDPR); fornecedores/transferencias internacionais nao verificados; sem testes automatizados; TypeScript sem strict; service worker precacheia todos os chunks; foco visivel fraco; calendario de humor pesado para teclado; alvos de toque pequenos no desktop; sem tema escuro.

**O que esta bom e foi mantido:** arquitetura local-first real (nada sai do aparelho nos testes), lazy loading por pilar, funcionamento offline, nenhum XSS reproduzido, base semantica de acessibilidade excelente, calendario civil correto para DST/anos bissextos, IndexedDB rapido com 1 ano de dados, CLS excelente.

### Plano de correcao

As correcoes estao agrupadas em 4 ondas: (1) correcoes rapidas de alto impacto - privacidade, contraste e textos; (2) integridade da gravacao e direitos do usuario; (3) performance e hardening; (4) preparacao para testers externos (GDPR completo). Relatorio consolidado completo com evidencias (arquivos, linhas, valores medidos) e fontes: ver documento "Auditoria Pilares - Relatorio Consolidado (28/09/2026)" no Drive.

> O dono aprovou a onda 1 em 28/09/2026. A remoção da listagem pública, os ajustes de contraste/textos e os headers de segurança integram esta onda. As demais ondas continuam pendentes de aprovação.
