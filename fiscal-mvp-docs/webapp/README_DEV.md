# Próximos Passos: Configuração Manual

Conforme o `DEVELOPMENT_EXECUTION_ORDER.md`, precisamos concluir a configuração da infraestrutura.

## 1. Banco de Dados (Supabase)
O script SQL foi gerado em `supabase_schema.sql`.
1. Acesse o [Painel do Supabase](https://supabase.com).
2. Vá em **SQL Editor** -> **New Query**.
3. Copie o conteúdo de `supabase_schema.sql` e execute.
4. **Importante:** Anote a `SUPABASE_URL` e a `SUPABASE_SERVICE_KEY` (em Project Settings -> API).

## 2. Autenticação (Clerk)
1. Crie um projeto no [Clerk](https://clerk.com).
2. Anote a `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` e a `CLERK_SECRET_KEY`.

## 3. Variáveis de Ambiente
Criei um arquivo `.env.example` na pasta `webapp`. Você deve renomeá-lo para `.env.local` e preencher com as chaves obtidas nos passos acima.

---

Vou proceder agora com a configuração do layout base e o sistema de design no Next.js.
