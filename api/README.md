# Buni API - Documentation & Architecture

## 📖 Overview
**Buni** é uma API de chat em tempo real construída para alta performance e escalabilidade.
Este documento serve como guia para Desenvolvedores e Agentes de IA entenderem a estrutura do projeto, o stack tecnológico e os padrões de navegação, focando em conceitos arquiteturais em vez de arquivos específicos.

## 🛠 Technology Stack
- **Runtime**: [Bun](https://bun.sh) (Fast JavaScript/TypeScript runtime)
- **Framework**: [ElysiaJS](https://elysiajs.com) (High-performance web framework)
- **Database**: PostgreSQL (via `pg` driver)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team) (Type-safe SQL schema and queries)
- **Validation**: [TypeBox](https://github.com/sinclairzx81/typebox) (Validação de schema nativa do Elysia).
- **Authentication**: [Better Auth](https://www.better-auth.com)
- **Documentation**: OpenAPI / Swagger (via `@elysiajs/openapi`)

## 📂 Arquitetura Modular (Feature-Based)
O projeto segue uma **Arquitetura Baseada em Features**. Em vez de agrupar por camadas técnicas (controllers, services), agrupamos por **funcionalidade de negócio**.

```
api/
├── src/
│   ├── database/           # Camada de Persistência (Client, Schemas, Migrations)
│   │
│   ├── modules/            # 📦 FEATURE MODULES (Dominio do Negócio)
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
- **`model.ts` (DTOs/Validation)**: Schemas Typebox para requisições e respostas.
  - *Procure aqui para ver os tipos de dados (Extraídos via `Static<typeof Schema>`).*

### 2. **Database (`src/database/*`)**
Gerencia tudo relacionado a dados.
- **Schema**: Definições de tabelas e relações.
- **Client**: Instância de conexão.

### 3. **Shared (`src/shared/*`)**
Evite dependências circulares colocando lógicas comuns aqui.
- Erros customizados (`ServiceError`).
- Tipos genéricos.

## ⚡ Scripts & Comandos
Os scripts principais definidos no `package.json` seguem o padrão `bun run [script]`:

| Categoria | Exemplo de Comando | Descrição |
| :--- | :--- | :--- |
| **Dev** | `dev` | Inicia a API em modo de desenvolvimento (watch mode) |
| **DB** | `db:generate` | Gera arquivos de migração SQL |
| **DB** | `db:migrate` | Aplica migrações pendentes |
| **DB** | `db:studio` | Abre GUI para gerenciar dados |

## 🚀 Padrões Arquiteturais

### Service Pattern
Controllers devem ser magros ("Thin Controllers"). Eles apenas validam parâmetros e chamam métodos nos Services.
- **Controller**: Lida com HTTP (Status, Headers, Parse).
- **Service**: Lida com Lógica (DB, Regras, Cálculos).

### Type-Safe Responses
Todos os services devem retornar objetos tipados. Evite retornar "raw rows" do banco de dados diretamente para o controller se houver necessidade de formatação. O frontend espera contratos consistentes.

---
*Este documento foca na estrutura lógica. Nomes de arquivos específicos podem variar conforme a evolução do projeto.*
