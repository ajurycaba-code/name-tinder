# name-tinder 👶💕

Um "Tinder de nomes de bebê": deslize para a direita (❤️) ou esquerda (✕) nos nomes mais
populares do Brasil, e descubra os nomes que **os dois** curtiram — os matches!

Roda 100% no navegador (sem backend, sem cadastro). Feito para o casal jogar cada um no seu
celular e comparar os favoritos.

## Funcionalidades

- **Swipe estilo Tinder**: arraste o card ou use os botões ❤️ / ✕. Cada nome traz origem,
  significado e uma curiosidade/estatística.
- **~670 nomes** (quase 300 populares no Brasil + mais de 300 populares nos EUA e em alta ao
  redor do mundo + 72 nomes compostos biculturais), intercalados no baralho, com filtro por
  Meninas / Meninos / Todos.
- **Nomes compostos biculturais**: pra quem não consegue escolher entre um nome "mais
  brasileiro" e um "mais americano", tem cards com os dois juntos (ex: "Heitor William") — dá
  pra chamar de um jeito no Brasil e de outro nos Estados Unidos, com o mesmo nome no
  registro. Esses cards aparecem com um selinho 🇧🇷 + 🇺🇸 no baralho.
- **Dois perfis** (Fabiana e Aju) — cada um guarda suas próprias decisões no navegador.
- **Matches**: tela que mostra só os nomes que os dois curtiram, com estatísticas de quantos
  cada um já avaliou/curtiu.
- **Copa dos Nomes**: chega de indecisão! Pega todos os matches (separados por Meninas e
  Meninos) e faz um torneio eliminatório — escolham entre dois nomes por vez até sobrar um
  campeão de cada gênero.
- **Adicionar nomes**: não achou o nome dos sonhos na lista? Adicione com significado e
  curiosidade próprios — ele entra no baralho dos dois.
- **Sincronizar entre celulares**: como não há servidor, cada dispositivo guarda seus dados
  localmente (`localStorage`). Na aba "Sincronizar", copie o código gerado e mande pro seu
  par colar no celular dele (ex: por WhatsApp) para combinar as decisões e ver os matches
  reais dos dois.

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
