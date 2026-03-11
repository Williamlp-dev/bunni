export class UserServiceError extends Error {
  constructor(
    message: string,
    public code: "SELF_BLOCK" | "ALREADY_BLOCKED" | "NOT_BLOCKED" | "NOT_FOUND"
  ) {
    super(message)
    this.name = "UserServiceError"
  }
}
