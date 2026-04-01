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
      toast({ title: `Trade #${tradeId} overridden to ${result.toUpperCase()}` });
      setDone(true);
      setTradeId("");
    } catch {
      toast({ title: "Failed to override trade", variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/20">
          <TrendingUp size={20} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Trade Override</h1>
      </div>

      <div className="max-w-lg space-y-4">
        {/* Warning */}
        <div className="glass-card p-4 border border-warning/30">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-warning mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-warning">Manual Trade Override</p>
              <p className="text-sm text-muted-foreground mt-1">
                This will force the result of an active trade. The trade must still be open (not yet expired).
                Use with extreme caution — this action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 space-y-5">
          <div>
            <label className="text-sm font-medium mb-2 block">Trade ID</label>
            <Input
              type="number"
              placeholder="Enter trade ID to override"
              value={tradeId}
              onChange={(e) => { setTradeId(e.target.value); setDone(false); }}
              className="bg-muted border-border"
              data-testid="input-trade-id"
            />
            <p className="text-xs text-muted-foreground mt-1">
              You can find trade IDs in the user's trade history on their profile page.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Force Result</label>
            <Select value={result} onValueChange={(v) => setResult(v as "win" | "loss")}>
              <SelectTrigger className="bg-muted border-border" data-testid="select-trade-result">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="win">
                  <span className="text-success font-semibold">WIN</span>
                </SelectItem>
                <SelectItem value="loss">
                  <span className="text-destructive font-semibold">LOSS</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {done && (
            <div className="flex items-center gap-2 text-success">
              <CheckCircle size={16} />
              <span className="text-sm">Override applied successfully</span>
            </div>
          )}

          <Button
            className="w-full gradient-btn text-white font-semibold"
            onClick={handleOverride}
            disabled={!tradeId || overrideMutation.isPending}
            data-testid="button-override-trade"
          >
            {overrideMutation.isPending ? "Overriding..." : `Force ${result.toUpperCase()}`}
          </Button>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground font-medium mb-2">How to use</p>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Find the user on the Users page and open their profile</li>
            <li>Go to the Trades tab and find the active trade you want to override</li>
            <li>Copy the trade ID and paste it above</li>
            <li>Select the desired result and click Override</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
