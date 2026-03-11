import { randomUUIDv7 } from "bun"
import { pgTable, text, timestamp, unique, check, index } from "drizzle-orm/pg-core"
import { users } from "./users"
import { sql } from "drizzle-orm"

export const friendships = pgTable("friendships", {
  id: text("id").primaryKey().$defaultFn(() => randomUUIDv7()),
  userOneId: text("user_one_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  userTwoId: text("user_two_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("unique_friendship").on(table.userOneId, table.userTwoId),
  check("no_self_friendship", sql`${table.userOneId} <> ${table.userTwoId}`),
  index("friendships_user_two_id_idx").on(table.userTwoId),
])
