import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core"
import { users } from "./users"
import { messages } from "./messages"

export const conversations = pgTable("conversations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export const conversationParticipants = pgTable("conversation_participants", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  lastReadMessageId: text("last_read_message_id")
    .references(() => messages.id, { onDelete: "set null" }),
  joinedAt: timestamp("joined_at").defaultNow().notNull()
}, (table) => [
  index("conversation_participants_conversation_id_idx").on(table.conversationId),
  index("conversation_participants_user_id_idx").on(table.userId),
])
