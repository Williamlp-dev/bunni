import { randomUUIDv7 } from "bun"
import { pgTable, text, timestamp, unique, index } from "drizzle-orm/pg-core"
import { users } from "./users"

export const friendRequests = pgTable("friend_requests", {
  id: text("id").primaryKey().$defaultFn(() => randomUUIDv7()),
  senderId: text("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: text("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("unique_friend_request").on(table.senderId, table.receiverId),
  index("friend_requests_receiver_id_idx").on(table.receiverId),
])
