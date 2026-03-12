const API_URL = import.meta.env.VITE_PUBLIC_API_URL as string
const WS_BASE_URL = `${API_URL.replace(/^http/, 'ws')}/ws`
const RECONNECT_MAX_ATTEMPTS = 5
const RECONNECT_BASE_DELAY = 1000
const DISCONNECT_DELAY_MS = 100

type WebSocketEventType =
  | "connected"
  | "message:new"
  | "message:deleted"
  | "typing:start"
  | "typing:stop"
  | "user:online"
  | "user:offline"
  | "friend:request-received"
  | "friend:request-accepted"
  | "conversation:created"
  | "error"
  | "disconnected"

type WebSocketEventData = {
  connected: { userId: string }
  "message:new": {
    id: string
    conversationId: string
    senderId: string
    content: string
    type: string
    audioUrl: string | null
    audioDuration: number | null
    imageUrl: string | null
    createdAt: string
    sender: {
      id: string
      name: string | null
      displayUsername: string
      image: string | null
    }
    replyTo?: {
      id: string
      content: string
      senderId: string
      sender: {
        id: string
        name: string | null
        displayUsername: string
        image: string | null
      }
      deletedAt: string | null
      createdAt: string
    }
  }
  "message:deleted": {
    id: string
    conversationId: string
  }
  "typing:start": { conversationId: string; userId: string }
  "typing:stop": { conversationId: string; userId: string }
  "user:online": { userId: string }
  "user:offline": { userId: string }
  "friend:request-received": {
    id: string
    createdAt: string
    sender: {
      id: string
      name: string | null
      username: string
      displayUsername: string
      image: string | null
    }
  }
  "friend:request-accepted": {
    user: {
      id: string
      name: string | null
      username: string
      displayUsername: string
      image: string | null
    }
  }
  "conversation:created": {
    id: string
    createdAt: string
    updatedAt: string
    participants: Array<{
      id: string
      name: string | null
      username: string
      displayUsername: string
      image: string | null
    }>
  }
  error: { message: string; details?: unknown }
  disconnected: { reason?: string }
}

type EventCallback<T extends WebSocketEventType> = (
  data: WebSocketEventData[T]
) => void

type EventListeners = {
  [K in WebSocketEventType]?: Set<EventCallback<K>>
}

class WebSocketClient {
  private socket: WebSocket | null = null
  private listeners: EventListeners = {}
  private reconnectAttempts = 0
  private isManualDisconnect = false
  private subscribedConversations: Set<string> = new Set()

  // Ref counting
  private activeConsumers = 0
  private disconnectTimeout: ReturnType<typeof setTimeout> | null = null

  /**
   * Acquires a connection usage lock.
   * If there are no active consumers, it connects.
   */
  acquire(): void {
    if (this.disconnectTimeout) {
      clearTimeout(this.disconnectTimeout)
      this.disconnectTimeout = null
    }

    this.activeConsumers++

    if (this.socket?.readyState === WebSocket.OPEN) {
      return
    }

    if (!this.socket || this.socket.readyState !== WebSocket.CONNECTING) {
      this.connect()
    }
  }

  /**
   * Releases a connection usage lock.
   * If active consumers drop to 0, it schedules a disconnection.
   */
  release(): void {
    this.activeConsumers--

    if (this.activeConsumers <= 0) {
      this.activeConsumers = 0
      this.scheduleDisconnect()
    }
  }

  private connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return
    }

    this.isManualDisconnect = false
    this.socket = new WebSocket(WS_BASE_URL)

    this.socket.onopen = () => {
      this.reconnectAttempts = 0
      this.resubscribeToConversations()
    }

    this.socket.onmessage = (event) => {
      this.handleMessage(event.data)
    }

    this.socket.onclose = () => {
      this.emit("disconnected", { reason: "Connection closed" })
      if (!this.isManualDisconnect && this.activeConsumers > 0) {
        this.scheduleReconnect()
      }
    }

    this.socket.onerror = () => {
      this.emit("error", { message: "WebSocket error occurred" })
    }
  }

  private disconnect(): void {
    if (this.activeConsumers > 0) return // Safety check

    this.isManualDisconnect = true
    this.subscribedConversations.clear()
    this.socket?.close()
    this.socket = null
  }

  private scheduleDisconnect(): void {
    if (this.disconnectTimeout) {
      clearTimeout(this.disconnectTimeout)
    }

    this.disconnectTimeout = setTimeout(() => {
      this.disconnect()
      this.disconnectTimeout = null
    }, DISCONNECT_DELAY_MS)
  }

  subscribe(conversationId: string): void {
    this.subscribedConversations.add(conversationId)
    this.send({ type: "subscribe", conversationId })
  }

  unsubscribe(conversationId: string): void {
    this.subscribedConversations.delete(conversationId)
  }

  sendTypingStart(conversationId: string): void {
    this.send({ type: "typing:start", conversationId })
  }

  sendTypingStop(conversationId: string): void {
    this.send({ type: "typing:stop", conversationId })
  }


  on<T extends WebSocketEventType>(
    event: T,
    callback: EventCallback<T>
  ): () => void {
    if (!this.listeners[event]) {
      (this.listeners as Record<T, Set<EventCallback<T>>>)[event] = new Set()
    }
    (this.listeners[event] as Set<EventCallback<T>>).add(callback)

    return () => {
      (this.listeners[event] as Set<EventCallback<T>> | undefined)?.delete(callback)
    }
  }

  private emit<T extends WebSocketEventType>(
    event: T,
    data: WebSocketEventData[T]
  ): void {
    const callbacks = this.listeners[event]
    if (callbacks) {
      callbacks.forEach((callback) => {
        (callback as EventCallback<T>)(data)
      })
    }
  }

  private send(data: unknown): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data))
    }
  }

  private handleMessage(rawData: string): void {
    try {
      const parsed = JSON.parse(rawData) as { event: WebSocketEventType; data?: unknown }
      const { event, data } = parsed
      this.emit(event, (data ?? {}) as WebSocketEventData[typeof event])
    } catch {
      this.emit("error", { message: "Failed to parse message" })
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= RECONNECT_MAX_ATTEMPTS) {
      this.emit("error", { message: "Max reconnection attempts reached" })
      return
    }

    const delay = RECONNECT_BASE_DELAY * Math.pow(2, this.reconnectAttempts)
    this.reconnectAttempts++

    setTimeout(() => {
      if (this.activeConsumers > 0) {
        this.connect()
      }
    }, delay)
  }

  private resubscribeToConversations(): void {
    this.subscribedConversations.forEach((conversationId) => {
      this.send({ type: "subscribe", conversationId })
    })
  }
}

export const wsClient = new WebSocketClient()

