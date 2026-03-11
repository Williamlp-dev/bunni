export class FriendServiceError extends Error {
  constructor(
    message: string,
    public code: "SELF_REQUEST" | "ALREADY_FRIENDS" | "ALREADY_REQUESTED" | "BLOCKED" | "NOT_FOUND" | "UNAUTHORIZED"
  ) {
    super(message)
    this.name = "FriendServiceError"
  }
}
