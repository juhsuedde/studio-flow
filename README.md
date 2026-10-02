# Studio Flow

Você vai construir um sistema de back-office para uma profissional autônoma gerenciar seus ensaios e clientes. Siga estas regras para TODO o projeto:

## CONCEITO CENTRAL — DOIS MODOS DE CADASTRO NA MESMA PAGINA
O cadastro de um ensaio é a funcionalidade principal e tem DOIS modos que gravam exatamente os mesmos dados:

MODO 1 — FORMULÁRIO GUIADO (wizard em etapas com indicador de progresso):
  Etapa 1 - Cliente: nome*, telefone, e-mail, CPF (opcional)
  Etapa 2 - Ensaio: pacote* (pacotes pré-salvos e a opçao de adicionar, remover, editar enquanto preenche), data*, horário*, local*
  Etapa 3 - Financeiro: valor total* (campo monetário com máscara), forma de pagamento* (Pix, Cartão, Dinheiro, Parcelado), valor de entrada (opcional)
  Etapa 4 - Confirmação: resumo visual de tudo + botão Salvar

MODO 2 — TEXTO LIVRE - IA (aba alternativa no mesmo cadastro):
  Um campo grande de texto onde a usuária cola uma mensagem com todas as informações de uma vez (ex: "Ensaio da Maria, pacote Ouro, sábado 10/10 às 15h, Parque Ibirapuera, R$ 1.200, metade no Pix").
  Botão "Extrair informações" que converte o texto nos campos do formulário.
  POR ENQUANTO é um MOCK: simule a extração preenchendo os campos com dados plausíveis derivados do texto, e exiba o aviso discreto "Extração automática em breve — revise os campos". Os campos ficam editáveis após a extração.
  O fluxo depois da extração é idêntico ao modo formulário: revisão + salvar.

Os dois modos devem ser claramente alternáveis (abas ou toggle) e visualmente equivalentes em peso — nenhum dos dois é "secundário".

## DESIGN
- Visual de sistema profissional de back-office (estilo admin panel): limpo, neutro, funcional, organizado. Priorize legibilidade — nada de landing page, efeitos chamativos ou animações desnecessárias.
- Escolha você mesmo a paleta de cores e a tipografia: algo moderno e profissional, com contraste adequado e cores semânticas discretas para estados (sucesso, pendente, cancelado, agendado). Consistente em todas as telas.
- 100% responsivo: mobile-first. Desktop: menu lateral fixo à esquerda. Mobile: barra de navegação inferior com os mesmos itens.
- Use componentes shadcn/ui sempre que possível.

## ARQUITETURA DE DADOS (IMPORTANTE)
- O backend roda no servidor (TanStack Start): as telas chamam `src/lib/data/*`, que fazem fetch para as rotas `src/routes/api.*` — e as rotas usam repositórios em `src/server/repositories`.
- A persistência atual é um adapter em memória (`src/server/db/memory.ts`), trocável pelo Supabase sem tocar em rotas nem UI. `DATA_DRIVER=memory` (padrão) ou `DATA_DRIVER=file` (salva em `.data/studio-flow.json` entre restarts).
- `owner_id` vem sempre da sessão (`src/server/session.ts`), nunca do body — equivalente ao RLS do `schema.sql`.
- Erros seguem um envelope único `{ error: { code, message, fields? } }`; ZodError vira 422, FKs/CHECKs violados viram 409/422.
- `schema.sql` é o schema final do banco; `src/server/validation.ts` e os repositórios espelham as mesmas regras.
- Comentários `TODO(supabase)`, `TODO(auth)` e `TODO(edge-function)` marcam exatamente o que trocar quando cada integração entrar.

## ESCOPO — O QUE FOI FEITO
1. Telas, navegação e design system completos
2. Camada de dados isolada em `src/lib/data` com os tipos/interfaces exatos do schema
3. Backend completo dos CRUDs (clientes, pacotes, ensaios) com validação e erros padronizados
4. Estados de vazio, loading e erro bem tratados
5. Seeds de exemplo: 5 bookings, 3 clientes e 3 pacotes
6. SEM tela de login: o app abre direto no dashboard. A sessão é mock (`src/server/session.ts`) e o Supabase Auth entra por lá sem mudar as rotas

- NÃO conectados ainda (deixados preparados): Supabase, Supabase Auth, Google Calendar, nota fiscal, ClickSign, Notion, e-mail/WhatsApp.
- Extração por texto é um MOCK heurístico no servidor (`src/server/services/extraction.ts`); a Edge Function de IA substitui só essa função.
- O dashboard de demonstração pode ser restaurado com `POST /api/dev/reset`.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/04a2926c-2aa0-4255-9ccc-947b01521800).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

### Backend e scripts úteis

```sh
bun run dev                          # servidor de desenvolvimento (memória, dados de seed)
DATA_DRIVER=file bun run dev         # mantém os cadastros em .data/studio-flow.json
bun run build                        # build do client + SSR (regenera src/routeTree.gen.ts)
bun run test                         # suíte (validação, repositórios, serviços, rotas)
bun run lint                         # eslint + prettier
bunx tsc --noEmit                    # typecheck
```

Endpoints principais: `GET|POST /api/clients`, `GET|POST /api/bookings`,
`PUT /api/bookings/from-draft` (pipeline único dos dois modos de cadastro),
`POST /api/extract` (extração heurística), `POST /api/dev/reset`, `GET /api/health`.
