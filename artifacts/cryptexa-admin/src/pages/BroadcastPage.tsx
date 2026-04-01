import { useState } from "react";
import { useSendBroadcast } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BroadcastPage() {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [filter, setFilter] = useState("");
  const [sent, setSent] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const broadcastMutation = useSendBroadcast();

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      const result = await broadcastMutation.mutateAsync({
        data: {
          text,
          filter: filter || null,
        }
      });
      setSentCount(result.sent ?? 0);
      setFailedCount(result.failed ?? 0);
      setSent(true);
      toast({ title: `Рассылка отправлена ${result.sent ?? 0} пользователям` });
    } catch {
      toast({ title: "Ошибка при отправке рассылки", variant: "destructive" });
    }
  };

  const handleReset = () => {
    setText("");
    setSent(false);
    setSentCount(0);
    setFailedCount(0);
    setFilter("");
  };

  const audienceLabel = () => {
    if (filter === "premium") return "премиум";
    if (filter === "active") return "активным";
    if (filter === "with_balance") return "с балансом";
    return "ВСЕМ";
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/20">
          <Megaphone size={20} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Рассылка</h1>
      </div>

      {sent ? (
        <div className="glass-card p-12 text-center max-w-lg">
          <CheckCircle size={48} className="text-success mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Рассылка отправлена!</h2>
          <div className="flex justify-center gap-8 my-4">
            <div>
              <p className="text-3xl font-bold text-success">{sentCount}</p>
              <p className="text-xs text-muted-foreground">Доставлено</p>
            </div>
            {failedCount > 0 && (
              <div>
                <p className="text-3xl font-bold text-destructive">{failedCount}</p>
                <p className="text-xs text-muted-foreground">Ошибок</p>
              </div>
            )}
          </div>
          <Button className="mt-4 gradient-btn text-white" onClick={handleReset} data-testid="button-new-broadcast">
            Новая рассылка
          </Button>
        </div>
      ) : (
        <div className="max-w-lg">
          <div className="glass-card p-6 space-y-5">
            <div>
              <label className="text-sm font-medium mb-2 block">Аудитория</label>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="bg-muted border-border" data-testid="select-filter">
                  <SelectValue placeholder="Все пользователи" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="">Все пользователи</SelectItem>
                  <SelectItem value="premium">Премиум пользователи</SelectItem>
                  <SelectItem value="active">Активные (последние 7 дней)</SelectItem>
                  <SelectItem value="with_balance">С балансом</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Текст сообщения</label>
              <Textarea
                placeholder={"Введите текст рассылки...\n\nПоддерживается HTML: <b>жирный</b>, <i>курсив</i>, <a href='...'>ссылка</a>"}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="bg-muted border-border min-h-[140px] resize-none"
                data-testid="textarea-broadcast"
              />
              <p className="text-xs text-muted-foreground mt-1">{text.length} символов</p>
            </div>

            {/* Превью */}
            {text && (
              <div className="p-4 bg-muted/50 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase">Превью</p>
                <div className="bg-card rounded-xl p-4">
                  <p className="text-sm whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: text
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '<')
                        .replace(/>/g, '>')
                        .replace(/\n/g, '<br/>')
                    }}
                  />
                </div>
              </div>
            )}

            <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl">
              <p className="text-sm text-warning font-medium">⚠️ Подтвердите перед отправкой</p>
              <p className="text-xs text-muted-foreground mt-1">
                Сообщение будет отправлено {audienceLabel()} пользователям. Это действие нельзя отменить.
              </p>
            </div>

            <Button
              className="w-full gradient-btn text-white font-semibold flex items-center gap-2"
              onClick={handleSend}
              disabled={!text.trim() || broadcastMutation.isPending}
              data-testid="button-send-broadcast"
            >
              <Send size={16} />
              {broadcastMutation.isPending ? "Отправка..." : "Отправить рассылку"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
