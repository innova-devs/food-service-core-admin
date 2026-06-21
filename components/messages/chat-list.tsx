"use client"

import { Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CONVERSATION_SENTIMENT_FILTER_OPTIONS,
  type ConversationSentimentFilter,
} from "@/lib/constants/conversationSentiment"
import { ChatItem, type ChatItemData } from "./chat-item"

interface ChatListProps {
  chats: ChatItemData[]
  selectedChatId: string | null
  onSelectChat: (chatId: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  sentimentFilter: ConversationSentimentFilter
  onSentimentFilterChange: (filter: ConversationSentimentFilter) => void
  listLoading?: boolean
}

export function ChatList({
  chats,
  selectedChatId,
  onSelectChat,
  searchQuery,
  onSearchChange,
  sentimentFilter,
  onSentimentFilterChange,
  listLoading = false,
}: ChatListProps) {
  const filteredChats = chats.filter((chat) =>
    chat.customerName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const emptyMessage =
    searchQuery.trim().length > 0
      ? "No se encontraron conversaciones"
      : sentimentFilter === "all"
        ? "No hay conversaciones"
        : "No hay conversaciones con este sentimiento"

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-r">
      <div className="space-y-3 border-b p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar conversaciones..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sentiment-filter" className="text-xs text-muted-foreground">
            Sentimiento
          </Label>
          <Select
            value={sentimentFilter}
            onValueChange={(value) =>
              onSentimentFilterChange(value as ConversationSentimentFilter)
            }
          >
            <SelectTrigger id="sentiment-filter" className="w-full">
              <SelectValue placeholder="Filtrar por sentimiento" />
            </SelectTrigger>
            <SelectContent>
              {CONVERSATION_SENTIMENT_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <div className="h-full w-full overflow-y-auto">
          <div className="w-full min-w-0 p-2">
            {listLoading ? (
              <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Actualizando conversaciones...
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredChats.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    {emptyMessage}
                  </p>
                ) : (
                  filteredChats.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isSelected={selectedChatId === chat.id}
                      onClick={() => onSelectChat(chat.id)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
