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
- NÃO conecte nenhum backend real ainda (sem Supabase, sem APIs externas).
- Camada de dados isolada (ex: src/lib/data/ ou src/services/): todos os CRUDs passam por funções dessa camada, que por enquanto usam dados mock (localStorage).
- Comentários TODO claros em cada função indicando como será substituída por chamadas ao Supabase depois.
- Arquivo schema.sql com o schema completo do banco (tabelas, enums, FKs, policies RLS, triggers), pronto para executar no Supabase futuramente.

## ESCOPO — O QUE FAZER AGORA (apenas frontend)
1. Telas, navegação e design system completos
2. Camada de dados mockada com os tipos/interfaces exatos do schema futuro
3. Todos os CRUDs funcionais com dados mock
4. Estados de vazio, loading e erro bem tratados
5. Seeds de exemplo: 4-5 bookings, 3 clientes e dados relacionados
6. SEM tela de login: o app abre direto no dashboard (com TODO no código para adicionar Supabase Auth no futuro)

- NÃO conecte Supabase, autenticação, Google Calendar, nota fiscal, ClickSign, Notion, e-mail/WhatsApp ou qualquer API externa real.
- Para integrações futuras, crie apenas: (a) botões/estados de UI, (b) campos de status nas interfaces/types, (c) comentários TODO indicando onde a Edge Function entrará.
- NÃO crie lógica de IA real

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
