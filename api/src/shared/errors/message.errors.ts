export class MessageServiceError extends Error {
  constructor(
    message: string,
    public code: "NOT_PARTICIPANT" | "NOT_FOUND" | "UNAUTHORIZED_DELETE" | "INTERNAL_ERROR" | "INVALID_REPLY" | "BATCH_LIMIT_EXCEEDED"
  ) {
    super(message)
    this.name = "MessageServiceError"
  }
}
