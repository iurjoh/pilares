# Pilares

Um espaço para crescer, um dia de cada vez. Fase 0: casca do aplicativo, cinco módulos de entrada e PWA instalável.

## Rodar localmente

Requer Node.js 20.19+ ou 22.12+.

```sh
npm ci
npm run dev
npm run build
```

## Arquitetura

- React + TypeScript + Vite + Tailwind CSS 4.
- Cinco rotas carregadas sob demanda com `React.lazy`, `import()` e `Suspense`. Veja os cinco chunks de módulo em `dist/assets` após o build.
- `src/lib/store.ts` é um limite assíncrono `KeyValueStore` sobre IndexedDB. O plano anual é o padrão; os outros modos são apenas opções futuras e não oferecem planos funcionais ainda. Nenhuma conta, analytics ou rede de sincronização nesta fase.
- PWA com manifesto e service worker gerados pelo vite-plugin-pwa. Os assets da aplicação são guardados para leitura offline após a primeira visita. Fontes externas têm fallback local; não são necessárias para o aplicativo funcionar offline.
- Publicar `dist/` em Cloudflare Pages. `_redirects` cobre carregamento direto das rotas online.

## Escopo e privacidade

Fase 0 é uma demonstração navegável. O resumo diário é ilustrativo. Não contém dados pessoais, endpoints privados, chaves de API, autenticação, nem monitoramento. A sincronização entre dispositivos fica para depois. Nenhuma funcionalidade paga é ativada.
