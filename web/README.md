# Buni Web - Documentação & Arquitetura

## 📖 Overview
**Buni Web** é o cliente frontend de chat em tempo real da plataforma Buni. Construído com React 19 e uma stack moderna focada em performance, type-safety de ponta a ponta e experiência de desenvolvedor.

## 🛠 Technology Stack

| Categoria | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Runtime/Build** | [Vite](https://vitejs.dev) + [Bun](https://bun.sh) | Bundler ultra-rápido e runtime JS |
| **UI** | [React 19](https://react.dev) | Biblioteca de UI com React Compiler ativo |
| **Estilização** | [Tailwind CSS v4](https://tailwindcss.com) | Utility-first CSS com Design System customizado |
| **Componentes** | [Base UI](https://base-ui.com) + [shadcn/ui](https://ui.shadcn.com) | Primitivos headless + componentes pré-estilizados |
| **Roteamento** | [TanStack Router](https://tanstack.com/router) | Roteamento type-safe baseado em arquivos |
| **Server State** | [TanStack Query](https://tanstack.com/query) | Cache, sincronização e fetching de dados |
| **Client State** | [Zustand](https://zustand-demo.pmnd.rs) | Estado global leve para UI e WebSocket |
| **Formulários** | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) | Formulários performáticos com validação de schema |
| **Autenticação** | [Better Auth](https://www.better-auth.com) | Client de autenticação integrado à API |
| **API Client** | [Eden (ElysiaJS)](https://elysiajs.com/eden/overview) | Client type-safe gerado automaticamente da API |
| **Notificações** | [Sonner](https://sonner.emilkowal.ski) | Toasts elegantes e acessíveis |

## 📂 Estrutura de Diretórios

```
web/
├── src/
│   ├── routes/                 # 📄 Páginas e Layouts (TanStack Router - file-based)
│   │   ├── __root.tsx          # Layout raiz (Providers globais)
│   │   ├── _layout.tsx         # Layout autenticado (sidebar, nav)
│   │   └── _layout/            # Rotas protegidas
│   │       └── [feature]/      # Ex: chat, friends, settings...
│   │
│   ├── components/             # Componentes de UI reutilizáveis
│   │   ├── ui/                 # Primitivos do Design System (shadcn/ui)
│   │   └── [feature]/          # Componentes específicos por feature
│   │
│   ├── lib/                    # Utilitários e configurações de bibliotecas
│   │   ├── api.ts              # Instância do Eden Client (type-safe)
│   │   ├── auth-client.ts      # Instância do Better Auth Client
│   │   └── utils.ts            # Helpers compartilhados (cn, etc.)
│   │
│   ├── hooks/                  # React Hooks customizados
│   ├── stores/                 # Stores Zustand (estado global de UI/WS)
│   │
│   ├── main.tsx                # Entry Point (monta Providers)
│   └── index.css               # Design System (tokens CSS globais)
│
├── .env.example                # Variáveis de ambiente necessárias
└── package.json                # Scripts & Dependências
```

## 🧠 Guia de Navegação para IA

### 1. **Rotas (`src/routes/*`)**
O TanStack Router usa **roteamento baseado em arquivos**. A estrutura de pastas define as URLs.
- **`__root.tsx`**: Provedores globais (QueryClient, ToasterProvider, AuthProvider).
- **`_layout.tsx`**: Layout de rotas autenticadas. Sidebar e navegação ficam aqui.
- **`_layout/[feature]/`**: Cada pasta é uma feature (ex: `chat/`, `friends/`). O `index.lazy.tsx` é a página principal da feature.

### 2. **Componentes (`src/components/*`)**
- **`ui/`**: Primitivos do Design System. Não altere sem motivo (são gerados pelo shadcn).
- **`[feature]/`**: Componentes específicos de uma feature. Colocalize com a feature.

### 3. **API Client (`src/lib/api.ts`)**
O cliente Eden é gerado automaticamente a partir dos tipos da API.
- *Procure aqui para ver como chamadas à API são feitas.*
- Toda chamada já tem tipagem de request e response inferida da API.

### 4. **Estado Global (`src/stores/*`)**
Stores Zustand gerenciam estado de UI efêmero e estado de WebSocket (ex: lista de usuários online, mensagens recebidas via WS).

## ⚡ Scripts & Comandos

| Comando | Descrição |
| :--- | :--- |
| `bun dev` | Inicia o servidor de desenvolvimento com HMR |
| `bun run build` | Type-check + build de produção |
| `bun run type-check` | Valida tipos TypeScript sem compilar |
| `bun run lint` | Executa ESLint |
| `bun run preview` | Visualiza o build de produção localmente |

## 🔧 Variáveis de Ambiente

Copie `.env.example` para `.env.local` e preencha os valores:

```bash
cp .env.example .env.local
```

| Variável | Descrição |
| :--- | :--- |
| `VITE_PUBLIC_API_URL` | URL base da API Buni (ex: `http://localhost:3333`) |
| `VITE_BETTER_AUTH_URL` | URL base do frontend para redirects de autenticação |

## 🚀 Padrões Arquiteturais

### Server State vs. Client State
- **TanStack Query** gerencia todo estado que vem do servidor (fetching, cache, mutations).
- **Zustand** gerencia apenas estado de UI puro e dados recebidos via WebSocket em tempo real.
- Evite duplicar dados do servidor em stores Zustand.

### Type-Safety de Ponta a Ponta
O Eden Client infere os tipos diretamente da instância do ElysiaJS na API. Qualquer mudança no contrato da API reflete automaticamente em erros de tipo no frontend, eliminando a necessidade de manter schemas duplicados.

---
*Este documento foca na estrutura lógica. Nomes de arquivos específicos podem variar conforme a evolução do projeto.*
