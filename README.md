# name-tinder 👶💕

Um "Tinder de nomes de bebê": deslize para a direita (❤️) ou esquerda (✕) nos nomes mais
populares do Brasil, e descubra os nomes que **os dois** curtiram — os matches!

Feito para o casal jogar cada um no seu celular e comparar os favoritos — e para amigos e
familiares sugerirem nomes também. Os dados ficam salvos na nuvem (Supabase), então cada
aparelho vê tudo em tempo quase real, sem precisar sincronizar nada à mão.

## Funcionalidades

- **Swipe estilo Tinder**: arraste o card para os lados (❤️ / ✕) ou para cima, se tanto
  faz — ou use os botões. O card acompanha o arremesso e sai voando na direção do gesto;
  um peteleco curto e rápido já conta. Cada nome traz origem, significado e uma
  curiosidade/estatística.
- **Card com contexto**: cada nome mostra pessoas conhecidas que o carregam (quando temos),
  um link para buscar famosos no Google Imagens (link em vez de fotos, para não pesar) e
  botões para **ouvir a pronúncia em português e em inglês**, usando a síntese de voz do
  próprio navegador.
- **Nomes que funcionam nos dois idiomas**: nomes escritos igual e naturais tanto em
  português quanto em inglês (Maria, Gabriel, Emma, Rafael...) ganham um card especial, com
  uma faixa nas cores das duas bandeiras.
- **Três respostas por nome**: sim, não, e **tanto faz** — que não veta o nome nem o tira da
  disputa, só não conta como uma curtida.
- **Placar dos nomes**: em vez de uma lista de "deu match ou não deu", a tela mostra todo
  nome que alguém curtiu e ninguém do casal vetou, ordenado por número de curtidas. Dá pra
  votar por ali mesmo: o coração na linha curte na hora, e tocar no nome abre o card inteiro
  (com significado, famosos e pronúncia) e os três botões de voto. Os dois
  curtiram, são duas curtidas; só um curtiu, é uma. As curtidas da torcida também entram na
  conta, separadas das do casal.
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
- **Login por telefone**: entra com o número, sem senha. Quem é novo se cadastra com o nome
  e entra como torcida; os perfis do casal já têm telefone cadastrado e entram direto, sem
  que ninguém consiga assumir o lugar deles pela tela de cadastro.
- **Matches**: tela que mostra só os nomes que os dois curtiram, com estatísticas de quantos
  cada um já avaliou/curtiu.
- **Copa dos Nomes**: chega de indecisão! Pega todos os nomes do placar (separados por
  Meninas e Meninos) e faz um torneio eliminatório — escolham entre dois nomes por vez até
  sobrar um campeão de cada gênero. No fim sai a **classificação completa**, não só o
  primeiro lugar: quem chegou mais longe fica na frente, e quem caiu na mesma fase divide a
  posição (1º, 2º, 3º, 3º, 5º, 5º...). Se o placar crescer depois que a copa começou, a tela
  avisa e dá pra recomeçar incluindo os novos.
- **Nome completo**: monta o nome do bebê juntando o primeiro nome (dos matches ou do
  campeão da copa) com os sobrenomes das duas famílias, com controle de ordem, da partícula
  "de" e atalhos prontos. Mostra iniciais e tamanho do nome, e guarda os favoritos.
- **Torcida (amigos e família)**: qualquer pessoa com o link entra com o telefone e sugere
  nomes, com um recado explicando o porquê. As sugestões caem direto no baralho do casal,
  com o selinho 💌 dizendo quem sugeriu, e todo mundo pode curtir as sugestões dos outros.
  Quem é da torcida vê só essa tela — o swipe, os matches e a copa são do casal.
- **Confete no match**: quando o seu "sim" fecha um match, a tela comemora com confete e o
  nome em destaque. (Respeita `prefers-reduced-motion`.)
- **Baralho embaralhado com prioridade**: a ordem dos nomes é sorteada, mas de forma estável
  — a mesma pessoa vê sempre a mesma sequência, e cada um tem a sua. Nomes que a outra
  pessoa já curtiu (ou seja, candidatos a virar match) têm chance bem maior de aparecer logo
  no começo, e as sugestões da torcida continuam furando a fila.
- **Aviso de nomes novos**: quando chega sugestão, o casal vê um aviso no topo ("🎉 3 novos
  nomes para avaliação!", com os nomes de quem sugeriu) e um contador na aba Swipe. Os nomes
  sugeridos furam a fila do baralho, então aparecem logo de cara. O aviso some sozinho
  conforme os nomes vão sendo avaliados.
- **Tudo salvo na nuvem**: os votos, as sugestões e os perfis ficam num banco Postgres no
  Supabase (plano gratuito). Trocar de celular ou limpar o navegador não perde nada.

## Configurando o banco de dados (Supabase)

> Existe um guia detalhado, passo a passo e autocontido (com o SQL inline, queries de
> verificação, teste de fumaça e tabela de problemas comuns) em
> [`docs/INSTRUCOES-SUPABASE.md`](docs/INSTRUCOES-SUPABASE.md) — feito para entregar a
> outra pessoa (ou a outro agente) que vá fazer a configuração.

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
