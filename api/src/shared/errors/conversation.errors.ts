export class ConversationServiceError extends Error {
  constructor(
    message: string,
    public code: "NOT_PARTICIPANT" | "BLOCKED_USER" | "SELF_CONVERSATION" | "NOT_FRIENDS" | "USER_NOT_FOUND" | "INTERNAL_ERROR"
  ) {
    super(message)
    this.name = "ConversationServiceError"
  }
}
