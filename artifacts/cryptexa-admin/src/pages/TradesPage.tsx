import { useState } from "react";
import { useOverrideTradeResult } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TradesPage() {
  const { toast } = useToast();
  const [tradeId, setTradeId] = useState("");
  const [result, setResult] = useState<"win" | "loss">("win");
  const [done, setDone] = useState(false);
  const overrideMutation = useOverrideTradeResult();

  const handleOverride = async () => {
    if (!tradeId) return;
    try {
      await overrideMutation.mutateAsync({
        tradeId: Number(tradeId),
        data: { result }
      });
      toast({ title: `Сделка #${tradeId} переопределена на ${result === "win" ? "ПОБЕДУ" : "ПОРАЖЕНИЕ"}` });
      setDone(true);
      setTradeId("");
    } catch {
      toast({ title: "Ошибка при переопределении сделки", variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/20">
          <TrendingUp size={20} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Переопределение сделок</h1>
      </div>

      <div className="max-w-lg space-y-4">
        <div className="glass-card p-4 border border-warning/30">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-warning mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-warning">Ручное переопределение сделки</p>
              <p className="text-sm text-muted-foreground mt-1">
                Это принудительно изменит результат активной сделки. Сделка должна ещё быть открыта (не истекла).
                Используйте с крайней осторожностью — действие нельзя отменить.
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 space-y-5">
          <div>
            <label className="text-sm font-medium mb-2 block">ID сделки</label>
            <Input
              type="number"
              placeholder="Введите ID сделки"
              value={tradeId}
              onChange={(e) => { setTradeId(e.target.value); setDone(false); }}
              className="bg-muted border-border"
              data-testid="input-trade-id"
            />
            <p className="text-xs text-muted-foreground mt-1">
              ID сделки можно найти в истории сделок на странице пользователя.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Принудительный результат</label>
            <Select value={result} onValueChange={(v) => setResult(v as "win" | "loss")}>
              <SelectTrigger className="bg-muted border-border" data-testid="select-trade-result">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="win">
                  <span className="text-success font-semibold">ПОБЕДА</span>
                </SelectItem>
                <SelectItem value="loss">
                  <span className="text-destructive font-semibold">ПОРАЖЕНИЕ</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {done && (
            <div className="flex items-center gap-2 text-success">
              <CheckCircle size={16} />
              <span className="text-sm">Переопределение применено успешно</span>
            </div>
          )}

          <Button
            className="w-full gradient-btn text-white font-semibold"
            onClick={handleOverride}
            disabled={!tradeId || overrideMutation.isPending}
            data-testid="button-override-trade"
          >
            {overrideMutation.isPending ? "Применение..." : `Принудить ${result === "win" ? "ПОБЕДУ" : "ПОРАЖЕНИЕ"}`}
          </Button>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground font-medium mb-2">Как использовать</p>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Найдите пользователя на странице Пользователи и откройте его профиль</li>
            <li>Перейдите на вкладку Сделки и найдите активную сделку</li>
            <li>Скопируйте ID сделки и вставьте выше</li>
            <li>Выберите нужный результат и нажмите кнопку</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
