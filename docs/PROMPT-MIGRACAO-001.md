# Tarefa: rodar a migração 001 no banco Supabase do Name Tinder

Este arquivo é **autocontido**. Tudo o que você precisa está aqui, incluindo o SQL.
Não é necessário ler o repositório nem conhecer o projeto.

---

## 1. O que é isso

O **Name Tinder** (`https://ajurycaba-code.github.io/name-tinder/`) é um app onde um casal
desliza nomes de bebê estilo Tinder. Os dados ficam num projeto **Supabase** que já existe e
já está funcionando.

O app ganhou uma **terceira resposta** para cada nome, além de "sim" e "não": **"tanto faz"**,
que não veta o nome nem o escolhe. No banco, essa resposta é gravada na tabela `votes` com
`decision = 'neutral'`.

O problema: a tabela foi criada quando só existiam duas respostas, então tem uma restrição
(`CHECK`) que aceita **apenas** `'like'` e `'dislike'`. Enquanto essa restrição não for
atualizada, apertar "tanto faz" no app falha com erro **400** e o voto não é salvo.

**Sua tarefa é rodar o SQL da seção 3 e confirmar que funcionou.**

> Nota: o restante do app (sim, não, sugestões, login) funciona normalmente. Só o "tanto
> faz" está quebrado. Não há pressa nem risco de perder dados.

---

## 2. Antes de começar: confirme que precisa

Entre no projeto Supabase, abra **SQL Editor** → **New query**, e rode:

```sql
select pg_get_constraintdef(con.oid) as restricao_atual
from pg_constraint con
join pg_class rel on rel.oid = con.conrelid
join pg_namespace nsp on nsp.oid = rel.relnamespace
where nsp.nspname = 'public'
  and rel.relname = 'votes'
  and con.contype = 'c'
  and pg_get_constraintdef(con.oid) ilike '%decision%';
```

- Se o resultado **não** mencionar `'neutral'` → precisa rodar a migração. Siga para a seção 3.
- Se já mencionar `'neutral'` → **já está feito**, não precisa fazer nada. Pule para a seção 5
  e só confirme.

---

## 3. A migração

No mesmo **SQL Editor**, cole **todo** o bloco abaixo e clique em **Run**.

É seguro: não apaga nem altera nenhum voto existente, só amplia o conjunto de valores
aceitos na coluna. Também é idempotente — rodar duas vezes não causa problema.

```sql
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
```

Resultado esperado: **Success. No rows returned.**

---

## 4. Conferir que a restrição mudou

Rode de novo a query da seção 2. Agora ela **tem** que mostrar os três valores, algo como:

```
CHECK ((decision = ANY (ARRAY['like'::text, 'dislike'::text, 'neutral'::text])))
```

Se ainda aparecerem só dois valores, a migração não pegou — rode a seção 3 novamente e
verifique se não houve erro.

---

## 5. Teste de verdade (o mais importante)

A query acima diz o que está escrito no banco; este teste diz se o **app** vai conseguir
gravar. Faça este, é o que realmente conta.

Você vai precisar de dois valores, em **Project Settings → API**:

- a **Project URL** (`https://xxxxxxxx.supabase.co`)
- a chave pública, marcada como **`anon`** / **`public`** / **publishable** (começa com
  `eyJ` ou com `sb_publishable_`)

> ⚠️ Use a chave **pública**. Não use a `service_role` / `secret` — ela ignora as regras de
> permissão e o teste deixaria de valer (além de não dever circular por aí).

### 5.1 Pegue um id de perfil válido

A tabela `votes` exige um perfil existente, então primeiro pegue um id:

```bash
curl -s "<PROJECT_URL>/rest/v1/profiles?select=id,name&limit=1" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>"
```

Guarde o `id` que voltar.

### 5.2 Tente gravar um voto neutro

```bash
curl -s -X POST "<PROJECT_URL>/rest/v1/votes" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"profile_id":"<ID_DO_PASSO_5.1>","name_id":"__teste_migracao__","decision":"neutral"}'
```

- ✅ **Deu certo** se voltar o registro criado (um JSON com `"decision":"neutral"`).
- ❌ **Falhou** se voltar erro **400** com `"code":"23514"` e a mensagem
  `violates check constraint "votes_decision_check"` — nesse caso a migração não foi
  aplicada; volte para a seção 3.

### 5.3 Apague a linha de teste

**Não esqueça deste passo** — senão fica um voto falso no banco:

```bash
curl -s -X DELETE "<PROJECT_URL>/rest/v1/votes?name_id=eq.__teste_migracao__" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>"
```

Confirme que sumiu (deve voltar uma lista vazia `[]`):

```bash
curl -s "<PROJECT_URL>/rest/v1/votes?select=name_id&name_id=eq.__teste_migracao__" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>"
```

---

## 6. Não precisa mexer em mais nada

- **Não** é preciso alterar as políticas de RLS.
- **Não** é preciso criar nem apagar tabelas.
- **Não** é preciso fazer deploy nem mexer no GitHub — o app já está publicado com o botão
  "tanto faz"; ele só precisa que o banco aceite o valor.
- **Não** altere nenhum voto existente.

---

## 7. O que reportar de volta

```
[ ] Restrição anterior encontrada: ______________________________
[ ] SQL da migração executado com sucesso
[ ] Restrição agora aceita 'like', 'dislike' e 'neutral'
[ ] Teste via API: gravar decision='neutral' retornou sucesso (não deu 400/23514)
[ ] Linha de teste apagada e confirmada como ausente
```

Se algo der errado, mande a mensagem de erro exata que o Postgres retornou — ela costuma
dizer direto qual é o problema.
