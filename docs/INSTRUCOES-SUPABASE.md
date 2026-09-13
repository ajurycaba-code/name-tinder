# Instruções: configurar o Supabase do Name Tinder

Este arquivo é **autocontido**: tudo que você precisa está aqui dentro, incluindo o SQL.
Não é necessário ler o resto do repositório.

---

## 1. Contexto

O **Name Tinder** (`https://github.com/ajurycaba-code/name-tinder`, publicado em
`https://ajurycaba-code.github.io/name-tinder/`) é um app web estático em React + Vite,
hospedado no GitHub Pages, onde um casal desliza nomes de bebê estilo Tinder e amigos e
familiares sugerem nomes.

O app já está escrito e pronto para usar um banco Supabase. Ele lê duas variáveis de
ambiente em tempo de build:

| Variável | O que é |
| --- | --- |
| `VITE_SUPABASE_URL` | A Project URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | A chave pública (`anon` / `publishable`) do projeto |

**Comportamento importante:** se essas variáveis estiverem ausentes ou vazias, o app **não
quebra** — ele cai em um "modo local" que guarda os dados só no navegador. Ou seja, o site
já está no ar e funcionando hoje; sua tarefa é ligar a nuvem.

O app fala com o Supabase pela **API REST (PostgREST)** direto do navegador, usando a chave
pública. Não existe backend próprio, não existe Supabase Auth, não existem Edge Functions.
Só as tabelas e as políticas de RLS importam.

### Sobre segurança (leia antes de estranhar o SQL)

O dono do projeto decidiu conscientemente **não ter autenticação de verdade**: o login é
apenas "informe seu telefone", sem senha e sem SMS. É um app de brincadeira, com link
compartilhado só entre pessoas conhecidas.

Por isso as políticas de RLS abaixo liberam leitura e escrita para a chave pública `anon`.
**Isso é intencional, não é um erro — não "melhore" o schema adicionando `auth.uid()` ou
exigindo autenticação, porque isso quebraria o app inteiro.** A única restrição deliberada é
que `DELETE` em `profiles` fica bloqueado, para ninguém conseguir apagar as pessoas
cadastradas (e, por cascata, os votos delas).

---

## 2. O que você precisa entregar no final

Ao terminar, informe:

1. ✅ A **Project URL** (formato `https://xxxxxxxxxxxxxxxx.supabase.co`)
2. ✅ A **chave pública anon** (começa com `eyJ...` ou com `sb_publishable_...`)
3. ✅ Confirmação de que as 4 tabelas e as políticas de RLS foram criadas
4. ✅ Confirmação de que o teste de fumaça do passo 5 retornou os dois perfis
5. ✅ Se você tiver acesso ao repositório: confirmação de que os dois secrets do GitHub
   foram criados e que o deploy rodou

⚠️ **Nunca** entregue nem use a chave `service_role` / `secret`. Ela dá acesso total ao
banco e ignora RLS. O app precisa **exclusivamente** da chave pública, que é feita para ser
exposta no navegador.

---

## 3. Passo 1 — Criar o projeto Supabase

1. Acesse `https://supabase.com` e entre (ou crie uma conta gratuita).
2. Crie um **New project**:
   - **Name:** `name-tinder` (qualquer nome serve)
   - **Database Password:** gere uma senha forte e **guarde**. O app não usa essa senha,
     mas ela é necessária para acesso direto ao Postgres depois. Não a coloque em lugar
     nenhum do repositório.
   - **Region:** `South America (São Paulo)` — os usuários estão no Brasil, isso reduz a
     latência. Qualquer outra região funciona, só fica mais lento.
   - **Plan:** Free
3. Espere o projeto terminar de provisionar (leva 1–2 minutos).

> **Nota sobre o plano gratuito:** projetos free são pausados automaticamente após cerca de
> uma semana sem nenhuma requisição. Se isso acontecer, o app vai dar erro de conexão e
> basta despausar o projeto pelo painel do Supabase. Vale avisar o dono sobre isso.

---

## 4. Passo 2 — Criar as tabelas e as políticas

No painel do projeto, abra **SQL Editor** → **New query**, cole **todo** o bloco abaixo e
clique em **Run**.

O script é **idempotente**: pode rodar mais de uma vez sem duplicar nada nem dar erro.

```sql
-- ============================================================
-- Name Tinder — schema do banco (Supabase / Postgres)
-- ============================================================

-- ------------------------------------------------------------
-- Perfis: o casal (role = 'parent') e a torcida (role = 'guest')
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  -- Só dígitos (ex: 5511999998888). Fica nulo nos perfis do casal
  -- até cada um "reivindicar" o seu no primeiro login.
  phone      text unique,
  role       text not null default 'guest' check (role in ('parent', 'guest')),
  created_at timestamptz not null default now()
);

-- Cria os dois perfis do casal, se ainda não existirem.
insert into public.profiles (name, role)
select 'Fabiana', 'parent'
where not exists (select 1 from public.profiles where name = 'Fabiana' and role = 'parent');

insert into public.profiles (name, role)
select 'Aju', 'parent'
where not exists (select 1 from public.profiles where name = 'Aju' and role = 'parent');

-- ------------------------------------------------------------
-- Votos do swipe (like / dislike), de qualquer pessoa
-- ------------------------------------------------------------
create table if not exists public.votes (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  -- id do nome: da lista base ("f-alice") ou o uuid de uma sugestão
  name_id    text not null,
  decision   text not null check (decision in ('like', 'dislike')),
  updated_at timestamptz not null default now(),
  primary key (profile_id, name_id)
);

create index if not exists votes_name_id_idx on public.votes (name_id);

-- ------------------------------------------------------------
-- Nomes sugeridos por amigos e familiares (e pelo próprio casal)
-- ------------------------------------------------------------
create table if not exists public.suggestions (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  name       text not null,
  gender     text not null check (gender in ('F', 'M')),
  origin     text not null default '',
  meaning    text not null default '',
  fact       text not null default '',
  -- recado opcional de quem sugeriu ("era o nome da minha avó")
  note       text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists suggestions_created_at_idx on public.suggestions (created_at desc);

-- ------------------------------------------------------------
-- Nomes completos montados no módulo "Nome completo"
-- ------------------------------------------------------------
create table if not exists public.full_names (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  full_name  text not null,
  gender     text check (gender in ('F', 'M')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security — liberado de propósito (ver seção 1)
-- ============================================================

alter table public.profiles    enable row level security;
alter table public.votes       enable row level security;
alter table public.suggestions enable row level security;
alter table public.full_names  enable row level security;

-- profiles: ler, criar e atualizar liberados; apagar bloqueado
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (true);

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert with check (true);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (true) with check (true);

-- votes / suggestions / full_names: liberados (inclusive apagar, que o app
-- usa para desfazer um swipe e para remover a própria sugestão)
drop policy if exists votes_all on public.votes;
create policy votes_all on public.votes for all using (true) with check (true);

drop policy if exists suggestions_all on public.suggestions;
create policy suggestions_all on public.suggestions for all using (true) with check (true);

drop policy if exists full_names_all on public.full_names;
create policy full_names_all on public.full_names for all using (true) with check (true);
```

Resultado esperado: **Success. No rows returned.**

---

## 5. Passo 3 — Conferir que o schema ficou certo

Rode as três queries abaixo no SQL Editor e compare com o esperado.

### 5.1 As 4 tabelas existem

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Esperado, exatamente estas 4 linhas:

```
full_names
profiles
suggestions
votes
```

### 5.2 Os dois perfis do casal foram criados

```sql
select name, role, phone from public.profiles order by name;
```

Esperado, exatamente 2 linhas (o `phone` **tem** que estar nulo — é assim que cada um
reivindica o próprio perfil no primeiro login):

```
Aju      | parent | null
Fabiana  | parent | null
```

⚠️ Se aparecerem 4 linhas (dois "Fabiana" e dois "Aju"), alguém rodou um `insert` duplicado.
Apague as sobras mantendo só uma de cada:

```sql
delete from public.profiles a
using public.profiles b
where a.name = b.name and a.role = b.role and a.ctid > b.ctid;
```

### 5.3 O RLS está ligado com as políticas certas

```sql
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Esperado, exatamente 6 linhas:

```
full_names  | full_names_all   | ALL
profiles    | profiles_insert  | INSERT
profiles    | profiles_select  | SELECT
profiles    | profiles_update  | UPDATE
suggestions | suggestions_all  | ALL
votes       | votes_all        | ALL
```

Confirme também que o RLS está habilitado nas 4 tabelas:

```sql
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('profiles', 'votes', 'suggestions', 'full_names')
order by relname;
```

Todas as 4 devem ter `relrowsecurity = true`.

---

## 6. Passo 4 — Pegar as credenciais

No painel do projeto, vá em **Project Settings** (engrenagem) → **API**.

1. **Project URL** — algo como `https://abcdefghijklmnop.supabase.co`. Copie sem barra no
   final.
2. **Chave pública** — procure a chave marcada como **`anon`** / **`public`** (nos projetos
   mais novos ela aparece como **publishable key**, em *API Keys*).
   - A chave legada começa com `eyJ` (é um JWT longo).
   - A chave nova começa com `sb_publishable_`.
   - **Qualquer uma das duas funciona** com a API REST. Se as duas existirem, prefira a
     nova (`sb_publishable_...`).

🚫 **Não use** a chave `service_role` / `secret` / `sb_secret_...`. Ela ignora o RLS e daria
acesso administrativo a qualquer visitante do site.

---

## 7. Passo 5 — Teste de fumaça (importante)

Antes de mexer no GitHub, confirme que a chave pública realmente consegue ler os dados —
esse é **exatamente** o que o app faz ao abrir.

Substitua `<PROJECT_URL>` e `<ANON_KEY>` e rode:

```bash
curl -s "<PROJECT_URL>/rest/v1/profiles?select=*" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>"
```

**Esperado** — um JSON com os dois perfis:

```json
[{"id":"...","name":"Fabiana","phone":null,"role":"parent","created_at":"..."},
 {"id":"...","name":"Aju","phone":null,"role":"parent","created_at":"..."}]
```

Teste também que a escrita funciona (o app precisa inserir perfis e votos):

```bash
curl -s -X POST "<PROJECT_URL>/rest/v1/suggestions" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name":"Teste","gender":"F","note":"linha de teste, pode apagar"}'
```

Esperado: a linha criada, com um `id` uuid. Depois apague:

```bash
curl -s -X DELETE "<PROJECT_URL>/rest/v1/suggestions?name=eq.Teste" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>"
```

Se o `select` voltar `[]` (lista vazia) mas as queries do passo 3 mostrarem os perfis, o
problema é a política de `SELECT` em `profiles` — rode o SQL do passo 2 de novo.

---

## 8. Passo 6 — Configurar os secrets no GitHub

O site é buildado pelo GitHub Actions, então as duas variáveis precisam existir como
**secrets do repositório**. O workflow (`.github/workflows/deploy-pages.yml`) já está
preparado para lê-las — não é preciso editar nenhum arquivo.

No repositório `ajurycaba-code/name-tinder`, vá em:

**Settings** → **Secrets and variables** → **Actions** → aba **Secrets** →
**New repository secret**

Crie **dois** secrets, com os nomes exatamente assim (maiúsculas e underscores):

| Name | Secret |
| --- | --- |
| `VITE_SUPABASE_URL` | a Project URL do passo 4 |
| `VITE_SUPABASE_ANON_KEY` | a chave pública do passo 4 |

> Se você tiver o `gh` CLI autenticado com permissão no repositório, dá para fazer assim:
>
> ```bash
> gh secret set VITE_SUPABASE_URL --repo ajurycaba-code/name-tinder --body "<PROJECT_URL>"
> gh secret set VITE_SUPABASE_ANON_KEY --repo ajurycaba-code/name-tinder --body "<ANON_KEY>"
> ```

⚠️ Precisa ser **secret de repositório** na aba *Actions*. Secret de *Dependabot* ou de
*Codespaces* não funciona — o build não enxerga.

---

## 9. Passo 7 — Publicar e verificar

Os secrets só entram no site no próximo build. Dispare um:

- **Actions** → workflow **Deploy to GitHub Pages** → **Run workflow** → branch `main`
- (ou simplesmente faça qualquer push na `main`)

Espere o workflow ficar verde e abra `https://ajurycaba-code.github.io/name-tinder/`.

### Como saber se a nuvem ligou

A tela de entrada muda, e essa é a checagem definitiva:

| Modo | O que aparece na tela inicial |
| --- | --- |
| ❌ **Local** (sem as variáveis) | Dois botões: **Fabiana** e **Aju** |
| ✅ **Nuvem** (funcionando) | Um **campo de telefone** com o botão **Continuar** |

Se apareceu o campo de telefone, deu certo. Para confirmar de ponta a ponta:

1. Digite um telefone qualquer com DDD (ex: `11999998888`) e clique em **Continuar**
2. Deve aparecer a tela "Primeira vez por aqui!"
3. Clique em **Sou Fabiana**
4. Confirme no Supabase (**Table Editor** → `profiles`) que a linha da Fabiana agora tem
   esse telefone preenchido

Se ainda aparecerem os dois botões, o build não recebeu as variáveis. Veja a seção 10.

---

## 10. Problemas comuns

| Sintoma | Causa provável | O que fazer |
| --- | --- | --- |
| A tela inicial ainda mostra "Fabiana / Aju" | Os secrets não chegaram no build | Confira o nome exato dos secrets (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`), que estão em *Actions* e não em Dependabot, e rode o deploy de novo |
| App abre com "Deu ruim na conexão" | URL errada, chave errada, ou projeto pausado | Refaça o teste de fumaça do passo 5; se falhar, despause o projeto no painel |
| `401` / `Invalid API key` no teste de fumaça | Chave copiada incompleta ou chave errada | Copie de novo pelo botão de copiar do painel; confirme que é a `anon`/`publishable`, não a `service_role` |
| `select` volta `[]` mas o SQL Editor mostra as linhas | Política de `SELECT` faltando | Rode o SQL do passo 2 de novo (é idempotente) |
| `new row violates row-level security policy` ao inserir | Políticas de `INSERT` faltando | Idem acima |
| Aparecem 4 perfis em vez de 2 | O `insert` rodou duplicado | Rode o `delete` da seção 5.2 |
| Tudo funciona e depois de dias para de funcionar | Projeto free pausado por inatividade | Despause pelo painel do Supabase |

---

## 11. Resumo do que reportar de volta

```
Project URL: https://________________.supabase.co
Chave anon:  ________________________________________

[ ] 4 tabelas criadas (profiles, votes, suggestions, full_names)
[ ] 6 políticas de RLS criadas, RLS ligado nas 4 tabelas
[ ] 2 perfis (Fabiana, Aju) com role=parent e phone=null
[ ] Teste de fumaça: leitura OK, escrita OK
[ ] Secrets criados no GitHub (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
[ ] Deploy rodado e site mostrando o campo de telefone na entrada
```
