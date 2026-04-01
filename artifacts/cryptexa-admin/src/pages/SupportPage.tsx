import { useState, useRef, useEffect } from "react";
import {
  useGetChatUnread, getGetChatUnreadQueryKey,
  useGetChatHistory, getGetChatHistoryQueryKey,
  useSendChatMessage
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { fmtDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function SupportPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: unreadData, isLoading: unreadLoading, refetch: refetchUnread } = useGetChatUnread({
    query: {
      queryKey: getGetChatUnreadQueryKey(),
      refetchInterval: 3000
    }
  });

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

  const handleRefresh = () => {
    refetchUnread();
    if (selectedUserId !== null) refetchHistory();
  };

  const sendMutation = useSendChatMessage();

  const users = unreadData?.data ?? [];
  const messages = historyData?.data?.messages ?? [];
  const selectedUserInfo = historyData?.data?.user;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const selectedUserData = users.find(u => u.user_id === selectedUserId || u.profile_id === selectedUserId);

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
        <div className="flex h-full">
          {/* Список диалогов */}
          <div className="w-48 sm:w-64 flex-shrink-0 border-r border-border flex flex-col">
            <div className="p-3 border-b border-border">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Диалоги</p>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {unreadLoading
                ? <div className="p-3 space-y-2">
                    {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
                  </div>
                : users.length === 0
                  ? <div className="p-4 text-center text-xs text-muted-foreground">Нет диалогов</div>
                  : users.map((u) => {
                    const uid = u.user_id ?? u.profile_id ?? 0;
                    return (
                      <button
                        key={uid}
                        onClick={() => setSelectedUserId(uid)}
                        data-testid={`button-chat-user-${uid}`}
                        className={cn(
                          "w-full p-3 text-left hover:bg-white/5 transition-colors border-b border-border/50",
                          selectedUserId === uid && "bg-primary/10"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">@{u.username || `user_${u.profile_id}`}</span>
                          {(u.unread_count ?? 0) > 0 && (
                            <span className="text-[10px] font-bold bg-destructive text-white rounded-full px-1.5 min-w-[18px] text-center flex-shrink-0 ml-1">
                              {u.unread_count}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
              }
            </div>
          </div>

          {/* Область чата */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedUserId === null ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center px-4">
                  <MessageCircle size={40} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Выберите диалог для начала общения</p>
                </div>
              </div>
            ) : (
              <>
                {/* Шапка чата */}
                <div className="p-3 border-b border-border">
                  <p className="font-medium text-sm">
                    @{selectedUserInfo?.username || selectedUserData?.username || `Пользователь #${selectedUserId}`}
                  </p>
                  {selectedUserInfo?.profile_id && (
                    <p className="text-xs text-muted-foreground">Profile ID: {selectedUserInfo.profile_id}</p>
                  )}
                </div>

                {/* Сообщения */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                  {historyLoading
                    ? <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
                    : messages.length === 0
                      ? <div className="text-center text-muted-foreground text-sm py-8">Сообщений нет. Начните разговор.</div>
                      : messages.map((msg) => {
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
                  }
                  <div ref={messagesEndRef} />
                </div>

                {/* Поле ввода */}
                <div className="p-3 border-t border-border flex gap-2">
                  <Input
                    placeholder="Напишите сообщение... (Enter для отправки)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="bg-muted border-border flex-1"
                    data-testid="input-chat-message"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!message.trim() || sendMutation.isPending}
                    className="gradient-btn text-white"
                    data-testid="button-send-chat"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
