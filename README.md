# name-tinder 👶💕

Um "Tinder de nomes de bebê": deslize para a direita (❤️) ou esquerda (✕) nos nomes mais
populares do Brasil, e descubra os nomes que **os dois** curtiram — os matches!

Roda 100% no navegador (sem backend, sem cadastro). Feito para o casal jogar cada um no seu
celular e comparar os favoritos.

## Funcionalidades

- **Swipe estilo Tinder**: arraste o card ou use os botões ❤️ / ✕. Cada nome traz origem,
  significado e uma curiosidade/estatística.
- **~300 nomes populares no Brasil** (150 femininos + 144 masculinos), com filtro por
  Meninas / Meninos / Todos.
- **Dois perfis** (Fabiana e Aju) — cada um guarda suas próprias decisões no navegador.
- **Matches**: tela que mostra só os nomes que os dois curtiram, com estatísticas de quantos
  cada um já avaliou/curtiu.
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

A lista de nomes (`src/data/names.ts`) foi montada com base em nomes historicamente
populares no Brasil (Censo IBGE e registros civis recentes) e tendências de nascimentos dos
últimos anos. A ordem exibida é aproximada/ilustrativa, não uma classificação oficial exata.
