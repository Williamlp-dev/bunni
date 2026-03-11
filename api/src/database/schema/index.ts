import { accounts } from "./accounts";
import { blocks } from "./blocks";
import { conversations, conversationParticipants } from "./conversations";
import { friendRequests } from "./friend-requests";
import { friendships } from "./friendships";
import { messageDeletions } from "./message-deletions";
import { messages, messagesRelations } from "./messages";
import { sessions } from "./sessions";
import { users } from "./users";
import { verifications } from "./verification-tokens";

export const schema = {
  users,
  verifications,
  accounts,
  sessions,
  friendRequests,
  friendships,
  blocks,
  conversations,
  conversationParticipants,
  messages,
  messagesRelations,
  messageDeletions,
}