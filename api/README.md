# Buni API - Documentação & Arquitetura

## 📖 Overview
**Buni** é uma API de chat em tempo real construída para alta performance e escalabilidade. Este documento serve como guia para desenvolvedores e agentes de IA entenderem a estrutura do projeto, o stack tecnológico e os padrões arquiteturais — focando em conceitos em vez de arquivos específicos.

## 🛠 Technology Stack

| Categoria | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Runtime** | [Bun](https://bun.sh) | Runtime JavaScript/TypeScript ultra-rápido |
| **Framework** | [ElysiaJS](https://elysiajs.com) | Framework web de alta performance |
| **Banco de Dados** | PostgreSQL | Banco relacional robusto |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team) | SQL type-safe com zero overhead |
| **Validação** | [TypeBox](https://github.com/sinclairzx81/typebox) | Schema nativo do Elysia (JSON Schema + Tipos) |
| **Autenticação** | [Better Auth](https://www.better-auth.com) | Framework completo de autenticação TypeScript |
| **E-mail** | [Resend](https://resend.com) | Envio transacional de e-mails |
| **Storage** | [Cloudflare R2](https://developers.cloudflare.com/r2) | Armazenamento de objetos compatível com S3 |
| **Documentação** | OpenAPI / Swagger | Via `@elysiajs/swagger` |

## 📂 Arquitetura Modular (Feature-Based)
O projeto segue uma **Arquitetura Baseada em Features**. Em vez de agrupar por camadas técnicas (controllers, services), agrupamos por **funcionalidade de negócio**.

```
api/
├── src/
│   ├── database/           # Camada de Persistência (Client, Schemas, Migrations)
│   │
│   ├── modules/            # 📦 FEATURE MODULES (Domínio do Negócio)
│   │   └── [feature_name]/ # Ex: users, chat, notifications...
│   │       ├── index.ts    # Controller & Rotas
│   │       ├── service.ts  # Regra de Negócio & DB Calls
│   │       └── model.ts    # Schemas de Validação (DTOs)
│   │
│   ├── plugins/            # Plugins Globais do Framework (Auth, CORS, Swagger)
│   ├── shared/             # Utilitários compartilhados (Erros, Helpers, Tipos Globais)
│   │
│   ├── index.ts            # Entry Point (App Assembly)
│   └── env.ts              # Validação de Variáveis de Ambiente
│
└── package.json            # Scripts & Dependências
```

## 🧠 Guia de Navegação para IA
Ao trabalhar em uma funcionalidade, siga este padrão para localizar o código:

### 1. **Modules (`src/modules/*`)**
Cada pasta dentro de modules é autocontida.
- **`index.ts` (Controller)**: Define rotas da API (`GET`, `POST`) e inputs.
  - *Procure aqui para ver endpoints e contratos de entrada.*
- **`service.ts` (Business Logic)**: Contém chamadas ao banco e lógica complexa.
  - *Procure aqui para entender o processamento de dados.*
- **`model.ts` (DTOs/Validation)**: Schemas TypeBox para requisições e respostas.
  - *Procure aqui para ver os tipos de dados (extraídos via `Static<typeof Schema>`).*

### 2. **Database (`src/database/*`)**
Gerencia tudo relacionado a dados.
- **Schema**: Definições de tabelas e relações (Drizzle).
- **Client**: Instância de conexão com o PostgreSQL.
- **Migrations**: Histórico de alterações no banco.

### 3. **Shared (`src/shared/*`)**
Evite dependências circulares colocando lógicas comuns aqui.
- Erros customizados (`ServiceError`).
- Tipos e helpers genéricos.

## ⚡ Scripts & Comandos

| Categoria | Comando | Descrição |
| :--- | :--- | :--- |
| **Dev** | `bun dev` | Inicia a API em modo de desenvolvimento (watch mode) |
| **DB** | `bun run db:generate` | Gera arquivos de migração SQL a partir do schema |
| **DB** | `bun run db:migrate` | Aplica migrações pendentes no banco |
| **DB** | `bun run db:studio` | Abre GUI para inspecionar e gerenciar dados |

## 🔧 Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha os valores:

```bash
cp .env.example .env
```

| Variável | Descrição |
| :--- | :--- |
| `DATABASE_URL` | String de conexão PostgreSQL |
| `BETTER_AUTH_SECRET` | Segredo para assinar tokens (gere um aleatório) |
| `BETTER_AUTH_URL` | URL base da API |
| `ENCRYPTION_KEY` | Chave de 32 bytes para criptografia de dados sensíveis |
| `RESEND` | API Key do Resend para envio de e-mails |
| `R2_ACCOUNT_ID` | ID da conta Cloudflare |
| `R2_ACCESS_KEY_ID` | Access Key do bucket R2 |
| `R2_SECRET_ACCESS_KEY` | Secret Key do bucket R2 |
| `R2_BUCKET_NAME` | Nome do bucket R2 |
| `R2_PUBLIC_DOMAIN` | Domínio público do CDN (opcional, recomendado em produção) |

## 🚀 Padrões Arquiteturais

### Service Pattern
Controllers devem ser magros ("Thin Controllers"). Eles apenas validam parâmetros e delegam aos Services.
- **Controller**: Lida com HTTP (status, headers, parse de input, roteamento).
- **Service**: Lida com lógica (DB, regras de negócio, cálculos, efeitos colaterais).

### Type-Safe Responses
Todos os services devem retornar objetos tipados. Evite retornar "raw rows" do banco diretamente ao controller se houver necessidade de formatação. O frontend espera contratos consistentes e inferidos via Eden Client.

### Error Handling
Erros de negócio são lançados via `ServiceError` (em `src/shared/`) e capturados por um handler global no plugin de erros, garantindo respostas padronizadas para o cliente.

---
*Este documento foca na estrutura lógica. Nomes de arquivos específicos podem variar conforme a evolução do projeto.*
