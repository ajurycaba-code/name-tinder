-- ============================================================
-- Name Tinder — schema do banco (Supabase / Postgres)
-- ============================================================
-- Como usar:
--   1. Crie um projeto gratuito em https://supabase.com
--   2. Abra o SQL Editor do projeto
--   3. Cole este arquivo inteiro e clique em "Run"
--
-- Pode rodar mais de uma vez sem problema — tudo é idempotente.
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
-- Row Level Security
-- ============================================================
-- IMPORTANTE: este app não tem autenticação de verdade — o login é só
-- "informe seu telefone", sem senha nem SMS, por escolha do casal (é um
-- app de brincadeira, com link compartilhado só entre conhecidos).
-- Portanto as políticas abaixo liberam leitura e escrita para a chave
-- pública (anon). Em compensação, DELETE em profiles fica bloqueado, para
-- que ninguém consiga apagar as pessoas cadastradas nem os votos ligados
-- a elas por cascata.
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
