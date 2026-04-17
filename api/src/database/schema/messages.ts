import { relations } from "drizzle-orm"
import { pgTable, text, timestamp, index, integer, type AnyPgColumn } from "drizzle-orm/pg-core"
import { conversations } from "./conversations"
import { users } from "./users"

export const messages = pgTable("messages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  senderId: text("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content"),
  type: text("type").$type<"text" | "audio" | "image">().default("text").notNull(),
  audioUrl: text("audio_url"),
  audioDuration: integer("audio_duration"),
  imageUrl: text("image_url"),
  replyToId: text("reply_to_id").references((): AnyPgColumn => messages.id, { onDelete: "set null" }),
  replySnapshotContent: text("reply_snapshot_content"),
  replySnapshotSenderName: text("reply_snapshot_sender_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
  status: text("status").$type<"sent" | "delivered" | "read">().default("sent").notNull(),
}, (table) => ({
  conversationIdx: index("messages_conversation_id_idx").on(table.conversationId),
  senderIdx: index("messages_sender_id_idx").on(table.senderId),
  replyToIdx: index("messages_reply_to_idx").on(table.replyToId),
  createdAtIndex: index("messages_created_at_idx").on(table.createdAt),
  listingIdx: index("messages_listing_idx").on(table.conversationId, table.createdAt),
}))

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  replyTo: one(messages, {
    fields: [messages.replyToId],
    references: [messages.id],
    relationName: "replyTo",
  }),
}))
