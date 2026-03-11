import { drizzle } from "drizzle-orm/node-postgres"
import { reset } from "drizzle-seed"
import { schema } from "./schema"
import { env } from "../env"

async function main(): Promise<void> {
  console.log("🗑️  Resetando banco de dados...")

  const db = drizzle(env.DATABASE_URL)
  await reset(db, schema)

  console.log("✅ Banco de dados resetado com sucesso!")
  process.exit(0)
}

main().catch((error) => {
  console.error("❌ Erro ao resetar banco:", error)
  process.exit(1)
})
