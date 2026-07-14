import { useState, useRef, useEffect } from "react";
import {
  useGetChatUnread, getGetChatUnreadQueryKey,
  useGetChatHistory, getGetChatHistoryQueryKey,
  useSendChatMessage,
  useListUsers, getListUsersQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { fmtDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, RefreshCw, Search, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

type Conversation = {
  id: number;
  username: string;
  unread: number;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function Avatar({ name }: { name: string }) {
  const letter = (name?.trim()?.[0] || "#").toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-semibold text-white bg-gradient-to-br from-primary to-purple-600">
      {letter}
    </div>
  );
}

export default function SupportPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [selected, setSelected] = useState<Conversation | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedUserId = selected?.id ?? null;
  const searchActive = debouncedSearch.trim().length > 0;

  const { data: unreadData, isLoading: unreadLoading, refetch: refetchUnread } = useGetChatUnread({
    query: {
      queryKey: getGetChatUnreadQueryKey(),
      refetchInterval: 3000
    }
  });

  const { data: usersData, isLoading: usersLoading } = useListUsers(
    { page: 1, limit: 30, search: debouncedSearch, filter: "" as "" },
    {
      query: {
        queryKey: getListUsersQueryKey({ page: 1, limit: 30, search: debouncedSearch, filter: "" as "" }),
        enabled: searchActive
      }
    }
  );

  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useGetChatHistory(
    selectedUserId!,
    {
      query: {
        queryKey: getGetChatHistoryQueryKey(selectedUserId!),
        enabled: selectedUserId !== null,
        refetchInterval: 3000
      }
    }
  );

  const sendMutation = useSendChatMessage();

  const dialogs: Conversation[] = (unreadData?.data ?? []).map((u) => ({
    id: (u.profile_id ?? u.user_id) as number,
    username: u.username || `user_${u.profile_id}`,
    unread: u.unread_count ?? 0,
  }));

  const searchResults: Conversation[] = (usersData?.users ?? []).map((u) => ({
    id: u.profile_id as number,
    username: u.username || `user_${u.profile_id}`,
    unread: 0,
  }));

  const list = searchActive ? searchResults : dialogs;
  const listLoading = searchActive ? usersLoading : unreadLoading;

  const messages = historyData?.data?.messages ?? [];
  const selectedUserInfo = historyData?.data?.user;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleRefresh = () => {
    refetchUnread();
    if (selectedUserId !== null) refetchHistory();
  };

  const handleSelect = (conv: Conversation) => {
    setSelected(conv);
  };

  const handleSend = async () => {
    if (!message.trim() || selectedUserId === null) return;
    const text = message;
    setMessage("");
    try {
      await sendMutation.mutateAsync({
        userId: selectedUserId,
        data: { message: text }
      });
      queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey(selectedUserId) });
      queryClient.invalidateQueries({ queryKey: getGetChatUnreadQueryKey() });
    } catch {
      setMessage(text);
      toast({ title: "Ошибка при отправке сообщения", variant: "destructive" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const chatTitle = selectedUserInfo?.username || selected?.username || `Пользователь #${selectedUserId}`;

  /* ---- Список диалогов / поиск пользователей ---- */
  const listPanel = (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border space-y-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Чаты</p>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Найти пользователя..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted border-border h-9 text-sm"
            data-testid="input-support-search"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {listLoading ? (
          <div className="p-3 space-y-2">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
          </div>
        ) : list.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            {searchActive ? "Пользователи не найдены" : "Нет активных диалогов. Найдите пользователя через поиск, чтобы начать чат."}
          </div>
        ) : (
          list.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelect(conv)}
              data-testid={`button-chat-user-${conv.id}`}
              className={cn(
                "w-full p-3 flex items-center gap-3 text-left hover:bg-white/5 transition-colors border-b border-border/40",
                selectedUserId === conv.id && "bg-primary/10"
              )}
            >
              <Avatar name={conv.username} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">@{conv.username}</span>
                  {conv.unread > 0 && (
                    <span className="text-[10px] font-bold bg-destructive text-white rounded-full px-1.5 min-w-[18px] text-center flex-shrink-0">
                      {conv.unread}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">ID: {conv.id}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  /* ---- Окно чата ---- */
  const chatPanel = selectedUserId === null ? (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center px-4">
        <MessageCircle size={40} className="text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Выберите диалог для начала общения</p>
      </div>
    </div>
  ) : (
    <div className="flex flex-col h-full min-w-0">
      {/* Шапка чата */}
      <div className="p-3 border-b border-border flex items-center gap-3">
        {isMobile && (
          <button
            onClick={() => setSelected(null)}
            className="p-1 -ml-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
            data-testid="button-back-to-list"
            aria-label="Назад"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <Avatar name={chatTitle} />
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">@{chatTitle}</p>
          {selectedUserInfo?.profile_id != null && (
            <p className="text-xs text-muted-foreground">Profile ID: {selectedUserInfo.profile_id}</p>
          )}
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {historyLoading ? (
          <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">Сообщений нет. Начните разговор.</div>
        ) : (
          messages.map((msg) => {
            const isAdmin = msg.is_from_admin;
            return (
              <div key={msg.id} className={cn("flex", isAdmin ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm",
                  isAdmin
                    ? "bg-primary text-white rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                )} data-testid={`msg-${msg.id}`}>
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  <p className={cn("text-[10px] mt-1", isAdmin ? "text-white/60" : "text-muted-foreground")}>
                    {msg.created_at ? fmtDate(msg.created_at) : ""}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <div className="p-3 border-t border-border flex gap-2">
        <Input
          placeholder="Напишите сообщение..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-muted border-border flex-1"
          data-testid="input-chat-message"
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || sendMutation.isPending}
          className="gradient-btn text-white flex-shrink-0"
          data-testid="button-send-chat"
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Поддержка</h1>
        <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2 text-xs">
          <RefreshCw size={13} />
          Обновить
        </Button>
      </div>

      <div className="glass-card overflow-hidden" style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
        {isMobile ? (
          // Мобильный режим: показываем либо список, либо чат на весь экран (как в мессенджере)
          <div className="h-full">
            {selectedUserId === null ? listPanel : chatPanel}
          </div>
        ) : (
          // Десктоп: две колонки
          <div className="flex h-full">
            <div className="w-72 flex-shrink-0 border-r border-border">
              {listPanel}
            </div>
            <div className="flex-1 flex flex-col min-w-0">
              {chatPanel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
