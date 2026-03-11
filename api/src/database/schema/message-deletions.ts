import { pgTable, text, timestamp, index, unique } from "drizzle-orm/pg-core"
import { messages } from "./messages"
import { users } from "./users"

export const messageDeletions = pgTable("message_deletions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  messageId: text("message_id")
    .notNull()
    .references(() => messages.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  deletedAt: timestamp("deleted_at").defaultNow().notNull(),
}, (table) => ({
  userMessageIdx: index("message_deletions_user_message_idx").on(table.userId, table.messageId),
  uniqueUserMessage: unique("message_deletions_unique").on(table.messageId, table.userId),
}))
