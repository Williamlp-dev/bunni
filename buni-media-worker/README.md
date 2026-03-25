# Buni Media Worker - Documentação & Arquitetura

## 📖 Overview
O **Buni Media Worker** é um Cloudflare Worker desenvolvido em TypeScript responsável por servir arquivos de mídia estáticos (imagens, áudios e vídeos) do bucket Cloudflare R2 (`bunni-media`) diretamente para o cliente frontend. O principal objetivo deste worker é garantir **alta performance através de cache na edge** e **segurança validando os tipos de conteúdo**, reduzindo custos de leitura direta no R2.

## 🛠 Technology Stack

| Categoria | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Plataforma** | [Cloudflare Workers](https://workers.cloudflare.com/) | Execução serverless na edge global da Cloudflare |
| **Linguagem** | [TypeScript](https://www.typescriptlang.org/) | Tipagem estática para maior segurança e DX |
| **Storage** | [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) | Recuperação de objetos de armazenamento |
| **Deploy & CLI** | [Wrangler](https://developers.cloudflare.com/workers/wrangler/) | Ferramenta oficial para desenvolvimento e deploy de Workers |
| **Testes** | [Vitest](https://vitest.dev/) | Testes unitários rodando no pool oficial da Cloudflare |

## 📂 Estrutura de Diretórios

```
buni-media-worker/
├── src/
│   └── index.ts                # Entry Point (Lógica principal do Worker)
│
├── test/                       # Testes (Vitest)
│
├── wrangler.jsonc              # Configuração principal do Cloudflare Worker (Bindings R2)
├── worker-configuration.d.ts   # Declarações de ambiente do Worker (gerado automaticamente)
├── vitest.config.mts           # Configuração de testes unitários
├── tsconfig.json               # Configurações TypeScript
└── package.json                # Dependências e Scripts
```

## 🧠 Guia de Navegação para IA

### 1. **Lógica Principal (`src/index.ts`)**
O arquivo principal exporta um handler `fetch` default.
- **Cache**: Implementa verificação de `caches.default`. Se houver "HIT", retorna a resposta em cache, economizando a chamada ao R2.
- **Headers de Resposta**: Configura `Cache-Control` imutável, `ETag`, `Last-Modified` e políticas de CORS.
- **Validação de Conteúdo**: Mantém um `Set` de `ALLOWED_CONTENT_TYPES`. O Worker bloqueia ativamente o download/acesso a tipos de arquivos não autorizados (ex: impedindo acesso acidental a arquivos restritos ou blobs corrompidos).

### 2. **Configuração (`wrangler.jsonc`)**
- Aqui é onde o binding com o bucket R2 é definido. O worker enxerga o bucket através da variável `env.BUCKET`.
- Assegure-se de manter a `compatibility_date` atualizada na refatoração e usar `nodejs_compat` nas flags globais, se necessário.

## ⚡ Scripts & Comandos

| Comando | Descrição |
| :--- | :--- |
| `bun run dev` (ou `start`) | Inicia o servidor local do Wrangler para desenvolvimento rápido |
| `bun run deploy` | Faz o deploy da versão atual para a rede global da Cloudflare |
| `bun run test` | Executa o Vitest para validação local |
| `bun run cf-typegen` | Gera os tipos TypeScript (`worker-configuration.d.ts`) baseados no `wrangler.jsonc` |

## 🔧 Configurações e Bindings

As restrições de ambiente e referências externas ficam todas mapeadas no `wrangler.jsonc`.
Para o Worker funcionar em produção, ele exige os seguintes bindings integrados no Cloudflare:

| Binding / Variável | Tipo | Descrição |
| :--- | :--- | :--- |
| `BUCKET` | R2 Bucket | O acesso direto ao bucket `bunni-media` cadastrado no ecossistema R2. |

## 🚀 Padrões Arquiteturais

### Proxy Pattern / Edge Caching
O worker age como um proxy inteligente (CDN) à frente do R2 (storage). 
A ideia principal é que os usuários (ex: app web) nunca devem acessar o `R2_PUBLIC_DOMAIN` genérico, mas sim atravessar o Worker.
- O Cloudflare armazena em cache assets acessados com requência (`X-Cache: HIT`).
- Protege o budget e limitações da conta R2 reduzindo solicitações Classe B ao bucket original.

### Fail-Fast e Segurança
O serviço bloqueia requisições rapidamente `405 Method Not Allowed`, `404 Not Found` (quando não há url/key) e `403 Forbidden` assim que valida as extensões e tipos MIME — sem desperdiçar recursos de computação do Edge tentando processar uma resposta impossível ou não permitida.

---
*Este documento segue o padrão da stack Buni. Configurações pontuais do Wrangler devem ser manipuladas com extrema atenção para não quebrar a distribuição global (CDN).*
