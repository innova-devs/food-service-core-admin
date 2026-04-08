"use client"

import { useState, useCallback, useEffect } from "react"
import { isAxiosError } from "axios"
import { toast } from "sonner"

import { useAdminSocket } from "@/contexts/admin-socket-context"
import { ChatList } from "@/components/messages/chat-list"
import { ChatWindow } from "@/components/messages/chat-window"
import { EmptyState } from "@/components/messages/empty-state"
import type { ChatItemData } from "@/components/messages/chat-item"
import type { Message } from "@/components/messages/message-bubble"
import {
  fetchAdminWhatsappConversationBotStatus,
  fetchAdminWhatsappMessages,
  patchAdminWhatsappConversationBotStatus,
} from "@/lib/requests/messages"
import type { AdminWhatsappRealtimePayload } from "@/lib/types/admin-realtime"

function toChatTimestamp(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function isOutboundMessage(payload: {
  sender: string
  isAiGenerated: boolean
}): boolean {
  if (payload.isAiGenerated) return true
  const normalized = payload.sender.trim().toLowerCase()
  return normalized.includes("bot") || normalized.includes("ai")
}

function buildRealtimeMessage(payload: AdminWhatsappRealtimePayload): Message {
  return {
    id: payload.messageId,
    content: payload.message,
    timestamp: toChatTimestamp(payload.createdAt),
    isSent: isOutboundMessage(payload),
    isRead: true,
  }
}

export default function MessagesPage() {
  const { subscribeToWhatsappRealtime } = useAdminSocket()
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [chats, setChats] = useState<ChatItemData[]>([])
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [botEnabledByConversation, setBotEnabledByConversation] = useState<
    Record<string, boolean>
  >({})
  const [togglingConversationId, setTogglingConversationId] = useState<
    string | null
  >(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const selectedChat = chats.find((chat) => chat.id === selectedChatId)
  const currentMessages = selectedChatId ? messages[selectedChatId] ?? [] : []
  const loadInitialMessages = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminWhatsappMessages({
        page: 1,
        pageSize: 100,
      })

      const nextChatsMap = new Map<string, ChatItemData>()
      const nextMessages: Record<string, Message[]> = {}
      const nextBotEnabledByConversation: Record<string, boolean> = {}

      for (const item of data.items) {
        const conversationId = item.conversation.id
        if (!conversationId) continue

        const message: Message = {
          id: item.id,
          content: item.message,
          timestamp: toChatTimestamp(item.createdAt),
          isSent: isOutboundMessage(item),
          isRead: true,
        }

        nextMessages[conversationId] = [
          message,
          ...(nextMessages[conversationId] ?? []),
        ]

        if (!nextChatsMap.has(conversationId)) {
          nextChatsMap.set(conversationId, {
            id: conversationId,
            customerName:
              item.conversation.customer.name?.trim() ||
              item.conversation.customer.phoneNumber ||
              "Cliente",
            lastMessage: item.message,
            timestamp: toChatTimestamp(item.createdAt),
            unreadCount: 0,
            isOnline: false,
            botEnabled: item.conversation.botEnabled ?? true,
          })
        }

        nextBotEnabledByConversation[conversationId] =
          item.conversation.botEnabled ?? true
      }

      setChats(Array.from(nextChatsMap.values()))
      setMessages(nextMessages)
      setBotEnabledByConversation(nextBotEnabledByConversation)
      setSelectedChatId((prev) =>
        prev && nextChatsMap.has(prev)
          ? prev
          : Array.from(nextChatsMap.keys())[0] ?? null,
      )
    } catch (e) {
      if (isAxiosError(e)) {
        const msg = (e.response?.data as { message?: string })?.message ?? e.message
        setError(
          typeof msg === "string" && msg
            ? msg
            : "No se pudieron cargar los mensajes de WhatsApp.",
        )
      } else {
        setError("Error inesperado al cargar mensajes.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadInitialMessages()
  }, [loadInitialMessages])

  useEffect(() => {
    return subscribeToWhatsappRealtime((payload) => {
      const nextMessage = buildRealtimeMessage(payload)
      setMessages((prev) => {
        const existing = prev[payload.conversationId] ?? []
        if (existing.some((m) => m.id === payload.messageId)) {
          return prev
        }
        return {
          ...prev,
          [payload.conversationId]: [...existing, nextMessage],
        }
      })

      setChats((prev) => {
        const existing = prev.find((c) => c.id === payload.conversationId)
        if (!existing) {
          return [
            {
              id: payload.conversationId,
              customerName: payload.sender || "Cliente",
              lastMessage: payload.message,
              timestamp: toChatTimestamp(payload.createdAt),
              unreadCount:
                selectedChatId === payload.conversationId || selectedChatId == null
                  ? 0
                  : 1,
              isOnline: false,
              botEnabled: true,
            },
            ...prev,
          ]
        }

        return [
          {
            ...existing,
            lastMessage: payload.message,
            timestamp: toChatTimestamp(payload.createdAt),
            unreadCount:
              selectedChatId === payload.conversationId
                ? 0
                : existing.unreadCount + 1,
          },
          ...prev.filter((c) => c.id !== payload.conversationId),
        ]
      })
    })
  }, [subscribeToWhatsappRealtime, selectedChatId])

  useEffect(() => {
    if (!selectedChatId) return
    if (Object.prototype.hasOwnProperty.call(botEnabledByConversation, selectedChatId)) {
      return
    }
    void (async () => {
      try {
        const enabled = await fetchAdminWhatsappConversationBotStatus(
          selectedChatId,
        )
        setBotEnabledByConversation((prev) => ({
          ...prev,
          [selectedChatId]: enabled,
        }))
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === selectedChatId ? { ...chat, botEnabled: enabled } : chat,
          ),
        )
      } catch {
        /* noop */
      }
    })()
  }, [selectedChatId, botEnabledByConversation])

  const handleSelectChat = useCallback((chatId: string) => {
    setSelectedChatId(chatId)
    // Mark messages as read when selecting a chat
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
      )
    )
  }, [])

  const handleSendMessage = useCallback(
    (content: string) => {
      if (!selectedChatId) return

      const newMessage: Message = {
        id: `${selectedChatId}-${Date.now()}`,
        content,
        timestamp: new Date().toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isSent: true,
        isRead: false,
      }

      setMessages((prev) => ({
        ...prev,
        [selectedChatId]: [...(prev[selectedChatId] ?? []), newMessage],
      }))

      // Update last message in chat list
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === selectedChatId
            ? { ...chat, lastMessage: content, timestamp: newMessage.timestamp }
            : chat
        )
      )
    },
    [selectedChatId]
  )

  const handleToggleBot = useCallback(
    async (enabled: boolean) => {
      if (!selectedChatId) return
      const conversationId = selectedChatId
      const prevValue = botEnabledByConversation[conversationId] ?? true

      setTogglingConversationId(conversationId)
      setBotEnabledByConversation((prev) => ({
        ...prev,
        [conversationId]: enabled,
      }))
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === conversationId ? { ...chat, botEnabled: enabled } : chat,
        ),
      )

      try {
        const persisted = await patchAdminWhatsappConversationBotStatus(
          conversationId,
          enabled,
        )
        setBotEnabledByConversation((prev) => ({
          ...prev,
          [conversationId]: persisted,
        }))
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === conversationId
              ? { ...chat, botEnabled: persisted }
              : chat,
          ),
        )
        toast.success(
          persisted
            ? "Bot activado para esta conversación"
            : "Modo humano activado para esta conversación",
        )
      } catch {
        setBotEnabledByConversation((prev) => ({
          ...prev,
          [conversationId]: prevValue,
        }))
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === conversationId ? { ...chat, botEnabled: prevValue } : chat,
          ),
        )
        toast.error("No se pudo actualizar el modo del chat. Inténtalo de nuevo.")
      } finally {
        setTogglingConversationId((current) =>
          current === conversationId ? null : current,
        )
      }
    },
    [selectedChatId, botEnabledByConversation],
  )

  if (loading) {
    return (
      <div className="flex min-h-[14rem] items-center justify-center rounded-lg border bg-background p-8 text-sm text-muted-foreground">
        Cargando conversaciones...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[14rem] items-center justify-center rounded-lg border bg-background p-8 text-sm text-destructive">
        {error}
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-theme(spacing.14)-theme(spacing.8)-theme(spacing.4))] min-h-0 overflow-hidden rounded-lg border bg-background shadow-sm md:h-[calc(100vh-theme(spacing.14)-theme(spacing.12)-theme(spacing.4))]">
      {/* Chat List - Hidden on mobile when a chat is selected */}
      <div className={`w-full flex-shrink-0 md:w-80 ${selectedChatId ? "hidden md:block" : ""}`}>
        <ChatList
          chats={chats}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Chat Window or Empty State */}
      <div className={`min-h-0 flex-1 ${!selectedChatId ? "hidden md:flex" : "flex"}`}>
        {selectedChat ? (
          <div className="flex h-full min-h-0 w-full flex-col">
            {/* Mobile back button */}
            <div className="flex items-center border-b p-2 md:hidden">
              <button
                onClick={() => setSelectedChatId(null)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Volver
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <ChatWindow
                chat={selectedChat}
                messages={currentMessages}
                onSendMessage={handleSendMessage}
                botEnabled={
                  botEnabledByConversation[selectedChat.id] ??
                  selectedChat.botEnabled ??
                  true
                }
                isTogglingBot={togglingConversationId === selectedChat.id}
                onToggleBot={handleToggleBot}
              />
            </div>
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  )
}
