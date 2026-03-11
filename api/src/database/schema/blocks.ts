import { randomUUIDv7 } from "bun"
import { pgTable, text, timestamp, unique, check, index } from "drizzle-orm/pg-core"
import { users } from "./users"
import { sql } from "drizzle-orm"

export const blocks = pgTable("blocks", {
  id: text("id").primaryKey().$defaultFn(() => randomUUIDv7()),
  blockerId: text("blocker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  blockedId: text("blocked_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("unique_block").on(table.blockerId, table.blockedId),
  check("no_self_block", sql`${table.blockerId} <> ${table.blockedId}`),
  index("blocks_blocked_id_idx").on(table.blockedId),
])
