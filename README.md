# name-tinder 👶💕

Um "Tinder de nomes de bebê": deslize para a direita (❤️) ou esquerda (✕) nos nomes mais
populares do Brasil, e descubra os nomes que **os dois** curtiram — os matches!

Feito para o casal jogar cada um no seu celular e comparar os favoritos — e para amigos e
familiares sugerirem nomes também. Os dados ficam salvos na nuvem (Supabase), então cada
aparelho vê tudo em tempo quase real, sem precisar sincronizar nada à mão.

## Funcionalidades

- **Swipe estilo Tinder**: arraste o card ou use os botões ❤️ / ✕. Cada nome traz origem,
  significado e uma curiosidade/estatística.
- **~700 nomes** (quase 300 populares no Brasil + mais de 300 populares nos EUA e em alta ao
  redor do mundo + 72 nomes compostos biculturais + 30 nomes criativos exclusivos),
  intercalados no baralho, com filtro por Meninas / Meninos / Todos.
- **Nomes compostos biculturais**: pra quem não consegue escolher entre um nome "mais
  brasileiro" e um "mais americano", tem cards com os dois juntos (ex: "Heitor William") — dá
  pra chamar de um jeito no Brasil e de outro nos Estados Unidos, com o mesmo nome no
  registro. Esses cards aparecem com um selinho 🇧🇷 + 🇺🇸 no baralho.
- **Nomes criativos exclusivos**: uma lista à parte inspirada nos nomes dos próprios pais —
  variações, combinações e homenagens aos nomes e sobrenomes da família, além de nomes de
  origem tupi-guarani. Esses cards aparecem com o selinho ✨ nome exclusivo da família.
- **Login por telefone**: entra com o número, sem senha. Se for a primeira vez, escolhe se é
  um dos pais ou alguém da torcida. Da segunda vez em diante, só o telefone já entra.
- **Matches**: tela que mostra só os nomes que os dois curtiram, com estatísticas de quantos
  cada um já avaliou/curtiu.
- **Copa dos Nomes**: chega de indecisão! Pega todos os matches (separados por Meninas e
  Meninos) e faz um torneio eliminatório — escolham entre dois nomes por vez até sobrar um
  campeão de cada gênero.
- **Nome completo**: monta o nome do bebê juntando o primeiro nome (dos matches ou do
  campeão da copa) com os sobrenomes das duas famílias, com controle de ordem, da partícula
  "de" e atalhos prontos. Mostra iniciais e tamanho do nome, e guarda os favoritos.
- **Torcida (amigos e família)**: qualquer pessoa com o link entra com o telefone e sugere
  nomes, com um recado explicando o porquê. As sugestões caem direto no baralho do casal,
  com o selinho 💌 dizendo quem sugeriu, e todo mundo pode curtir as sugestões dos outros.
  Quem é da torcida vê só essa tela — o swipe, os matches e a copa são do casal.
- **Aviso de nomes novos**: quando chega sugestão, o casal vê um aviso no topo ("🎉 3 novos
  nomes para avaliação!", com os nomes de quem sugeriu) e um contador na aba Swipe. Os nomes
  sugeridos furam a fila do baralho, então aparecem logo de cara. O aviso some sozinho
  conforme os nomes vão sendo avaliados.
- **Tudo salvo na nuvem**: os votos, as sugestões e os perfis ficam num banco Postgres no
  Supabase (plano gratuito). Trocar de celular ou limpar o navegador não perde nada.

## Configurando o banco de dados (Supabase)

O app funciona sem banco nenhum — nesse caso ele cai no **modo local**, que guarda tudo só
no navegador (como era antes) e não tem torcida nem login por telefone. Para ligar a nuvem:

1. Crie uma conta e um projeto gratuito em [supabase.com](https://supabase.com).
2. No projeto, abra **SQL Editor**, cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql)
   e clique em **Run**. Isso cria as tabelas, as permissões e os dois perfis do casal.
3. Vá em **Project Settings → API** e copie dois valores: a **Project URL** e a chave
   **anon public**.
4. Para rodar na sua máquina: copie `.env.example` para `.env` e preencha os dois valores.
5. Para o site publicado no GitHub Pages: no repositório, vá em **Settings → Secrets and
   variables → Actions → New repository secret** e crie dois segredos com exatamente estes
   nomes:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   Depois é só rodar o workflow "Deploy to GitHub Pages" de novo (ou fazer qualquer push na
   `main`) que o site passa a usar a nuvem.

No primeiro login de cada um dos pais, os swipes que já estavam salvos naquele navegador são
enviados para a nuvem automaticamente, uma única vez.

### Sobre a segurança

Não existe autenticação de verdade: o login é só o telefone, sem senha e sem SMS — foi uma
escolha consciente, já que é um app de brincadeira com link compartilhado entre conhecidos.
Na prática, quem souber o telefone de alguém consegue entrar como aquela pessoa, e a chave
`anon` que vai no site permite ler e escrever nas tabelas. Por isso o schema bloqueia apagar
perfis, e nada sensível deve ser guardado aqui.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra o endereço mostrado no terminal (geralmente `http://localhost:5173`) no navegador do
celular ou computador.

## Build de produção

```bash
npm run build
npm run preview
```

Gera arquivos estáticos em `dist/`, prontos para publicar em qualquer hospedagem estática
(Vercel, Netlify, GitHub Pages, etc).

## Sobre os dados dos nomes

A lista de nomes (`src/data/names.ts`) combina duas fontes:

- Nomes historicamente populares no Brasil (Censo IBGE e registros civis recentes);
- Nomes populares nos Estados Unidos (ranking anual da Social Security Administration) e
  nomes em alta ao redor do mundo nos últimos anos.

Nomes repetidos entre as duas listas (mesmo nome e gênero) aparecem só uma vez, e a ordem
exibida é aproximada/ilustrativa, não uma classificação oficial exata.
