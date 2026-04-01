import { useState } from "react";
import { useCreateCheck } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, CheckCircle, Copy } from "lucide-react";
import { fmtNum, fmtDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface CreatedCheck {
  code: string;
  link?: string;
  amount: number;
  expires_at?: string;
}

export default function ChecksPage() {
  const { toast } = useToast();
  const createMutation = useCreateCheck();

  const [amount, setAmount] = useState("");
  const [expiresHours, setExpiresHours] = useState("24");
  const [created, setCreated] = useState<CreatedCheck | null>(null);

  const handleCreate = async () => {
    if (!amount || Number(amount) <= 0) return;
    try {
      const result = await createMutation.mutateAsync({
        data: {
          amount_usdt: Number(amount),
          expires_in_hours: Number(expiresHours) || 24,
        }
      });
      setCreated({
        code: result.check_code ?? "",
        link: result.check_link ?? "",
        amount: Number(amount),
        expires_at: result.expires_at,
      });
      toast({ title: "Gift check created!" });
    } catch {
      toast({ title: "Failed to create check", variant: "destructive" });
    }
  };

  const handleCopyCode = () => {
    if (created?.code) {
      navigator.clipboard.writeText(created.code);
      toast({ title: "Code copied" });
    }
  };

  const handleCopyLink = () => {
    if (created?.link) {
      navigator.clipboard.writeText(created.link);
      toast({ title: "Link copied" });
    }
  };

  const handleReset = () => {
    setCreated(null);
    setAmount("");
    setExpiresHours("24");
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/20">
          <Gift size={20} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Gift Checks</h1>
      </div>

      <div className="max-w-lg">
        {created ? (
          <div className="glass-card p-8 text-center">
            <CheckCircle size={48} className="text-success mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Check Created!</h2>
            <p className="text-muted-foreground mb-6">
              Amount: <span className="font-bold text-foreground">{fmtNum(created.amount)} USDT</span>
              {created.expires_at && (
                <span className="block text-xs mt-1">Expires: {fmtDate(created.expires_at)}</span>
              )}
            </p>

            <div className="bg-muted rounded-xl p-4 mb-3">
              <p className="text-xs text-muted-foreground mb-1">Gift Code</p>
              <div className="flex items-center justify-center gap-2">
                <p className="font-mono font-bold text-2xl text-primary tracking-wider" data-testid="text-check-code">
                  {created.code}
                </p>
                <button onClick={handleCopyCode} className="text-muted-foreground hover:text-foreground" data-testid="button-copy-code">
                  <Copy size={16} />
                </button>
              </div>
            </div>

            {created.link && (
              <div className="bg-muted rounded-xl p-3 mb-6">
                <p className="text-xs text-muted-foreground mb-1">Gift Link</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="font-mono text-xs text-muted-foreground truncate max-w-[200px]" data-testid="text-check-link">
                    {created.link}
                  </p>
                  <button onClick={handleCopyLink} className="text-muted-foreground hover:text-foreground flex-shrink-0" data-testid="button-copy-link">
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            )}

            <Button className="w-full gradient-btn text-white" onClick={handleReset} data-testid="button-new-check">
              Create Another Check
            </Button>
          </div>
        ) : (
          <div className="glass-card p-6 space-y-5">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <p className="text-sm text-muted-foreground">
                Create a gift check that users can redeem to add USDT to their balance.
                Each check has a unique code and a configurable expiry time.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Amount (USDT) *</label>
              <Input
                type="number"
                placeholder="e.g. 100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-muted border-border"
                data-testid="input-check-amount"
                min="0.01"
                step="0.01"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Expires In (hours)</label>
              <Input
                type="number"
                placeholder="24"
                value={expiresHours}
                onChange={(e) => setExpiresHours(e.target.value)}
                className="bg-muted border-border"
                data-testid="input-check-expires"
                min="1"
              />
              <p className="text-xs text-muted-foreground mt-1">How long this check is valid for</p>
            </div>

            {/* Preview */}
            {amount && Number(amount) > 0 && (
              <div className="p-4 bg-muted/50 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase">Preview</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Gift Check</p>
                    <p className="text-xs text-muted-foreground">
                      Expires in {expiresHours || 24}h
                    </p>
                  </div>
                  <p className="font-mono font-bold text-xl text-success">{fmtNum(Number(amount))} USDT</p>
                </div>
              </div>
            )}

            <Button
              className="w-full gradient-btn text-white font-semibold flex items-center gap-2"
              onClick={handleCreate}
              disabled={!amount || Number(amount) <= 0 || createMutation.isPending}
              data-testid="button-create-check"
            >
              <Gift size={16} />
              {createMutation.isPending ? "Creating..." : "Create Gift Check"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
