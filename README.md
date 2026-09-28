# Pilares

Um espaço para crescer, um dia de cada vez. Aplicativo web em português para cuidar de cinco dimensões da vida. A Fase 1 entrega o primeiro espaço funcional, **Espiritual**, sem conta, custos ou sincronização.

**Experimente:** https://pilares.pages.dev/ · **Código:** https://github.com/iurjoh/pilares (repositório privado)

## O que já funciona

- **Espiritual:** plano "Bíblia em um ano" com 365 leituras, referências em PT-BR e 66 livros/1.189 capítulos na ordem canônica protestante. Cada dia tem 3 ou 4 capítulos. Não reproduz o texto bíblico: leia na tradução de sua preferência.
- Escolha a data de início; o dia correspondente é calculado pelo calendário local, sem perder marcações anteriores. Navegue entre os 365 dias, marque/desmarque leituras e acompanhe dias concluídos e porcentagem do total. Depois do último dia, o plano fica no dia 365 até uma nova data de início.
- Checklist semanal: leitura diária da Bíblia, culto familiar semanal, participação na comunidade e ensino bíblico. A semana começa segunda-feira; as marcações das semanas passadas permanecem guardadas, mas a nova semana aparece em branco. Este é um lembrete semanal, não um registro de sete leituras separadas.
- Resumo espiritual na página inicial: dia atual, referências, leituras concluídas e práticas marcadas na semana.
- PWA instalável e utilizável offline após a primeira visita; cinco rotas e navegação responsiva. Os outros quatro pilares e as trilhas cronológica, Antigo Testamento, Novo Testamento e estudos ainda estão identificados como futuros.

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

## Próximas etapas

Outros pilares, trilhas de leitura alternativas e eventual sincronização exigem implementação própria; os cartões atuais não insinuam progresso inexistente. Antes de abrir o produto a testers, avaliar exportação/backup de progresso, testes automatizados de interação e privacidade, e revisão editorial dos textos.
