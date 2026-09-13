-- ============================================================
-- Migração 001 — permitir o voto neutro ("tanto faz")
-- ============================================================
-- Rode este arquivo no SQL Editor do Supabase SE o banco já tiver sido criado
-- antes desta mudança. Em bancos novos não precisa: o supabase/schema.sql já
-- vem com os três valores.
--
-- Sem rodar isso, votar "tanto faz" no app falha com erro 400 do Postgres,
-- porque a restrição antiga só aceita 'like' e 'dislike'.
--
-- Pode rodar mais de uma vez sem problema.
-- ============================================================

-- Remove qualquer CHECK existente na coluna decision, seja qual for o nome que
-- o Postgres tenha dado a ele.
do $$
declare
  restricao record;
begin
  for restricao in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'votes'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%decision%'
  loop
    execute format('alter table public.votes drop constraint %I', restricao.conname);
  end loop;
end $$;

alter table public.votes
  add constraint votes_decision_check
  check (decision in ('like', 'dislike', 'neutral'));

-- Conferência: deve mostrar os três valores permitidos.
select pg_get_constraintdef(con.oid) as restricao_atual
from pg_constraint con
join pg_class rel on rel.oid = con.conrelid
join pg_namespace nsp on nsp.oid = rel.relnamespace
where nsp.nspname = 'public'
  and rel.relname = 'votes'
  and con.contype = 'c'
  and pg_get_constraintdef(con.oid) ilike '%decision%';
