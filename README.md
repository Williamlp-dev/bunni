# 🐰 Bunni

Bem-vindo ao repositório do **Bunni**, um aplicativo web e API focados em bate-papo em tempo real!

## 📖 Sobre o Projeto

Este é um projeto pessoal criado primeiramente com o pensamento e objetivo de explorar a fundo o recente surgimento do **Bun**. Após ver inúmeros debates em redes sociais afirmando que o Bun seria o "Node killer" e o substituiria de vez, minha curiosidade falou mais alto. Decidi testar na prática, e para validar uma tecnologia, quase nada é melhor do que construir um projeto do zero.

A ideia do **Bunni** se tornou o cenário perfeito, pois uniu a minha vontade de adquirir mais experiência com fluxos em tempo real ao entendimento exato de como funcionam ecossistemas de **WebSockets**, trocas de mensagens e escalabilidade.

## 🚀 Tecnologias Utilizadas

No desenvolvimento deste projeto, saí da minha zona de conforto e utilizei diversas tecnologias e bibliotecas recém-lançadas ou em crescimento que eu desejava fortemente colocar em uso real, aprofundando meus conhecimentos:

- **[Bun](https://bun.sh/)**: Runtime Javascript/Typescript veloz e poderoso que substitui Node.js e gerenciadores de pacote.
- **[ElysiaJS](https://elysiajs.com/)**: O framework para criação ágil e tipada da API usando o Bun.
- **[Base UI](https://base-ui.com/)**: Biblioteca flexível de componentes não-estilizados de acessibilidade para construir uma UI sob medida baseada em Tailwind.
- **[Better Auth](https://www.better-auth.com/)**: Foi aprofundado o estudo de toda estrutura para obter a autenticação e autorização das sessões neste projeto.
- **[Zod](https://zod.dev/)**: Para confiabilidade de tipagem em validações e garantias de contrato de dados.
- **[Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/)**: Adotei como minha solução em nuvem de storage (s3 compatível) acessível.
- E diversas outras engrenagens essenciais.

## ⚠️ Limitações Atuais (Ambiente Produção Gratuito)

Como se trata de um projeto experimental e de demonstração pública sem geração de receita, todo o ambiente de produção (_deploy_) roda em cima de planos gratuitos e compartilha dos limites deles. É importante estar ciente de algumas limitações ao testar as plataformas:

1. **Modo "Sleep" na Render (Cold Start):** O serviço do _backend_ está hospedado num servidor gratuito do [Render](https://render.com/). Após alguns minutos sem requisições, ele inativa automaticamente para aguardar acesso. Como resultado, **pode demorar alguns segundos extras** para o servidor "acordar" no seu primeiro log in do dia.
2. **Recuperação de Senha (Reset):** O link e a lógica de verificação existem, porém, até o presente momento o `Reset Password` pode não funcionar em sua plenitude pois o projeto não possui aquisição de um domínio global validado pelo provedor de e-mails para envio transparente.
3. **Plano Positivo no Frontend:** Diferente da API, nosso cliente da aplicação está na ótima infraestrutura da **[Vercel](https://vercel.com/)** que continua perfeitamente imune à inativação temporária, rodando veloz desde o primeiro load.

Mesmo com as inevitáveis margens dessas limitações externas de *hosting* free, pode ter certeza que **o projeto está extremamente otimizado a nível de código base!**

---
*Feito como fonte de conhecimento, castelo de ideias.*
