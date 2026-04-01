import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetUserDetail, getGetUserDetailQueryKey,
  useUpdateUserBalance, useSetUserWinRate, useSetUserStatus, useSendUserMessage
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { fmtNum, fmtDate, timeAgo, isOnline, fmtWinRate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ExternalLink, DollarSign, Target, Shield, Star, Ban, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function UserDetailPage() {
  const { profileId } = useParams<{ profileId: string }>();
  const id = Number(profileId);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useGetUserDetail(id, {
    query: { queryKey: getGetUserDetailQueryKey(id), enabled: !!id }
  });

  const balanceMutation = useUpdateUserBalance();
  const winrateMutation = useSetUserWinRate();
  const statusMutation = useSetUserStatus();
  const messageMutation = useSendUserMessage();

  // Balance modal state
  const [balanceAction, setBalanceAction] = useState<"add" | "subtract" | "set">("add");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceOpen, setBalanceOpen] = useState(false);

  // Win rate modal state
  const [winRate, setWinRate] = useState<number>(73);
  const [winRateOpen, setWinRateOpen] = useState(false);

  // Message modal state
  const [messageText, setMessageText] = useState("");
  const [messageOpen, setMessageOpen] = useState(false);

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-48" /><Skeleton className="h-32" /></div>;
  }

  if (!data?.user) {
    return <div className="text-center py-12 text-muted-foreground">User not found</div>;
  }

  const user = data.user;

  const refreshUser = () => queryClient.invalidateQueries({ queryKey: getGetUserDetailQueryKey(id) });

  const handleBalance = async () => {
    try {
      await balanceMutation.mutateAsync({
        profileId: id,
        data: { action: balanceAction, amount: Number(balanceAmount) }
      });
      toast({ title: "Balance updated" });
      setBalanceOpen(false);
      setBalanceAmount("");
      refreshUser();
    } catch {
      toast({ title: "Failed to update balance", variant: "destructive" });
    }
  };

  const handleWinRate = async (reset = false) => {
    try {
      await winrateMutation.mutateAsync({
        profileId: id,
        data: { custom_win_rate: reset ? null : winRate / 100 }
      });
      toast({ title: reset ? "Win rate reset to default" : "Win rate updated" });
      setWinRateOpen(false);
      refreshUser();
    } catch {
      toast({ title: "Failed to update win rate", variant: "destructive" });
    }
  };

  const handleStatus = async (action: "verify" | "premium" | "block" | "unblock", reason?: string) => {
    try {
      await statusMutation.mutateAsync({
        profileId: id,
        data: { action, reason: reason ?? null }
      });
      toast({ title: "Status updated" });
      refreshUser();
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const handleMessage = async () => {
    try {
      await messageMutation.mutateAsync({ profileId: id, data: { text: messageText } });
      toast({ title: "Message sent" });
      setMessageOpen(false);
      setMessageText("");
    } catch {
      toast({ title: "Failed to send message", variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setLocation("/users")} className="text-muted-foreground hover:text-foreground" data-testid="button-back">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">User #{user.profile_id}</h1>
      </div>

      {/* Profile Card */}
      <div className="glass-card p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={cn("w-2 h-2 rounded-full", isOnline(user.last_online_at ?? null) ? "bg-success pulse-green" : "bg-muted")} />
              <h2 className="text-lg font-bold">@{user.username || "unknown"}</h2>
              <a href={user.telegram_link} className="text-muted-foreground hover:text-primary" data-testid="link-telegram">
                <ExternalLink size={14} />
              </a>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
              <div><span className="text-muted-foreground">Profile ID:</span> <span className="font-mono">{user.profile_id}</span></div>
              <div><span className="text-muted-foreground">Telegram ID:</span> <span className="font-mono">{user.telegram_id}</span></div>
              <div><span className="text-muted-foreground">Language:</span> {user.language}</div>
              <div><span className="text-muted-foreground">Referral Code:</span> <span className="font-mono">{user.referral_code || "—"}</span></div>
              <div><span className="text-muted-foreground">Referred by:</span> {user.referred_by || "—"}</div>
              <div><span className="text-muted-foreground">Referral Count:</span> {user.referral_count}</div>
              <div><span className="text-muted-foreground">Referral Earnings:</span> {fmtNum(user.referral_earnings ?? 0)} USDT</div>
              <div><span className="text-muted-foreground">Registered:</span> {fmtDate(user.created_at)}</div>
              <div><span className="text-muted-foreground">Last Online:</span> {timeAgo(user.last_online_at ?? null)}</div>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <p className="text-xs text-muted-foreground mb-1">Balance</p>
            <p className="text-3xl font-bold font-mono gradient-text" data-testid="text-balance">{fmtNum(user.balance_usdt ?? 0)}</p>
            <p className="text-sm text-muted-foreground">USDT</p>

            {user.wallets && Object.keys(user.wallets).length > 0 && (
              <div className="mt-3 space-y-1">
                {Object.entries(user.wallets).map(([cur, amount]) => (
                  <p key={cur} className="text-xs font-mono text-muted-foreground">
                    {cur}: {amount}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          {user.is_premium && <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Premium</Badge>}
          {user.is_verified && <Badge className="bg-success/20 text-success border-success/30">Verified</Badge>}
          {user.is_blocked && <Badge className="bg-destructive/20 text-destructive border-destructive/30">Blocked{user.block_reason ? `: ${user.block_reason}` : ""}</Badge>}
          {user.lucky_mode && <Badge className="bg-primary/20 text-primary border-primary/30">
            Lucky Mode{user.lucky_until ? ` until ${fmtDate(user.lucky_until)}` : " (forever)"}
          </Badge>}
        </div>

        {/* Win Rate & Lucky info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className="font-mono font-bold" data-testid="text-win-rate">{fmtWinRate(user.custom_win_rate ?? null)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Lucky Mode</p>
            <p className="font-medium">{user.lucky_mode ? "On" : "Off"}</p>
          </div>
          {user.lucky_mode && (
            <>
              <div>
                <p className="text-xs text-muted-foreground">Lucky Wins</p>
                <p className="font-mono">{user.lucky_wins_used} / {user.lucky_max_wins ?? "∞"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lucky Until</p>
                <p className="text-sm">{user.lucky_until ? fmtDate(user.lucky_until) : "Forever"}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-5">
        {/* Balance */}
        <Dialog open={balanceOpen} onOpenChange={setBalanceOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2" data-testid="button-change-balance">
              <DollarSign size={14} /> Balance
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Change Balance</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Select value={balanceAction} onValueChange={(v) => setBalanceAction(v as "add" | "subtract" | "set")}>
                <SelectTrigger className="bg-muted border-border" data-testid="select-balance-action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="add">Add</SelectItem>
                  <SelectItem value="subtract">Subtract</SelectItem>
                  <SelectItem value="set">Set</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Amount USDT"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                className="bg-muted border-border"
                data-testid="input-balance-amount"
              />
              <Button
                className="w-full gradient-btn text-white"
                onClick={handleBalance}
                disabled={balanceMutation.isPending}
                data-testid="button-apply-balance"
              >
                Apply
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Win Rate */}
        <Dialog open={winRateOpen} onOpenChange={setWinRateOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2" data-testid="button-set-winrate">
              <Target size={14} /> Win Rate
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Set Win Rate</DialogTitle></DialogHeader>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Win Rate</span>
                  <span className="font-mono font-bold text-primary" data-testid="text-winrate-preview">{winRate}%</span>
                </div>
                <Slider
                  value={[winRate]}
                  onValueChange={(v) => setWinRate(v[0])}
                  min={0} max={100} step={1}
                  className="my-2"
                  data-testid="slider-winrate"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleWinRate(true)}
                  disabled={winrateMutation.isPending}
                  data-testid="button-reset-winrate"
                >
                  Reset to Default
                </Button>
                <Button
                  className="flex-1 gradient-btn text-white"
                  onClick={() => handleWinRate(false)}
                  disabled={winrateMutation.isPending}
                  data-testid="button-apply-winrate"
                >
                  Apply
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          variant="outline"
          size="sm"
          className={cn("flex items-center gap-2", user.is_verified ? "text-success border-success/30" : "")}
          onClick={() => handleStatus("verify")}
          disabled={statusMutation.isPending}
          data-testid="button-toggle-verify"
        >
          <Shield size={14} /> {user.is_verified ? "Unverify" : "Verify"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className={cn("flex items-center gap-2", user.is_premium ? "text-yellow-400 border-yellow-500/30" : "")}
          onClick={() => handleStatus("premium")}
          disabled={statusMutation.isPending}
          data-testid="button-toggle-premium"
        >
          <Star size={14} /> {user.is_premium ? "Unpremium" : "Premium"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className={cn("flex items-center gap-2", user.is_blocked ? "text-success border-success/30" : "text-destructive border-destructive/30")}
          onClick={() => handleStatus(user.is_blocked ? "unblock" : "block")}
          disabled={statusMutation.isPending}
          data-testid="button-toggle-block"
        >
          <Ban size={14} /> {user.is_blocked ? "Unblock" : "Block"}
        </Button>

        {/* Message */}
        <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2" data-testid="button-send-message">
              <MessageSquare size={14} /> Message
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Send Message</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Message text..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="bg-muted border-border min-h-[100px]"
                data-testid="textarea-message"
              />
              <Button
                className="w-full gradient-btn text-white"
                onClick={handleMessage}
                disabled={messageMutation.isPending || !messageText.trim()}
                data-testid="button-send-message-submit"
              >
                Send
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* History Tabs */}
      <div className="glass-card p-4">
        <Tabs defaultValue="transactions">
          <TabsList className="bg-muted border-border mb-4">
            <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions ({data.transactions?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="trades" data-testid="tab-trades">Trades ({data.trades?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="withdrawals" data-testid="tab-withdrawals">Withdrawals ({data.withdrawals?.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            {!data.transactions?.length
              ? <p className="text-muted-foreground text-sm text-center py-6">No transactions</p>
              : <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 px-2">ID</th>
                      <th className="text-left py-2 px-2">Type</th>
                      <th className="text-left py-2 px-2">Amount</th>
                      <th className="text-left py-2 px-2">Currency</th>
                      <th className="text-left py-2 px-2">Status</th>
                      <th className="text-left py-2 px-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.transactions.map((t) => (
                      <tr key={t.id} className="border-b border-border/50">
                        <td className="py-2 px-2 font-mono">{t.id}</td>
                        <td className="py-2 px-2">{t.type}</td>
                        <td className="py-2 px-2 font-mono">{fmtNum(t.amount ?? 0)}</td>
                        <td className="py-2 px-2">{t.currency}</td>
                        <td className="py-2 px-2"><Badge variant="outline" className="text-[10px]">{t.status}</Badge></td>
                        <td className="py-2 px-2 text-muted-foreground">{fmtDate(t.created_at ?? "")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }
          </TabsContent>

          <TabsContent value="trades">
            {!data.trades?.length
              ? <p className="text-muted-foreground text-sm text-center py-6">No trades</p>
              : <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 px-2">ID</th>
                      <th className="text-left py-2 px-2">Pair</th>
                      <th className="text-left py-2 px-2">Side</th>
                      <th className="text-left py-2 px-2">Amount</th>
                      <th className="text-left py-2 px-2">Result</th>
                      <th className="text-left py-2 px-2">Payout</th>
                      <th className="text-left py-2 px-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.trades.map((t) => (
                      <tr key={t.id} className="border-b border-border/50">
                        <td className="py-2 px-2 font-mono">{t.id}</td>
                        <td className="py-2 px-2 font-mono">{t.pair}</td>
                        <td className="py-2 px-2">{t.side}</td>
                        <td className="py-2 px-2 font-mono">{fmtNum(t.amount_usdt ?? 0)}</td>
                        <td className="py-2 px-2">
                          <span className={cn("font-medium", t.result === "win" ? "text-success" : t.result === "loss" ? "text-destructive" : "text-muted-foreground")}>
                            {t.result || t.status}
                          </span>
                        </td>
                        <td className="py-2 px-2 font-mono">{t.payout != null ? fmtNum(t.payout) : "—"}</td>
                        <td className="py-2 px-2 text-muted-foreground">{fmtDate(t.opened_at ?? "")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }
          </TabsContent>

          <TabsContent value="withdrawals">
            {!data.withdrawals?.length
              ? <p className="text-muted-foreground text-sm text-center py-6">No withdrawals</p>
              : <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 px-2">ID</th>
                      <th className="text-left py-2 px-2">Amount</th>
                      <th className="text-left py-2 px-2">Address</th>
                      <th className="text-left py-2 px-2">Network</th>
                      <th className="text-left py-2 px-2">Status</th>
                      <th className="text-left py-2 px-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.withdrawals.map((w) => (
                      <tr key={w.id} className="border-b border-border/50">
                        <td className="py-2 px-2 font-mono">{w.id}</td>
                        <td className="py-2 px-2 font-mono">{fmtNum(w.amount_rub ?? 0)} USDT</td>
                        <td className="py-2 px-2 font-mono text-muted-foreground truncate max-w-[100px]">{w.card_number}</td>
                        <td className="py-2 px-2">{w.full_name}</td>
                        <td className="py-2 px-2">
                          <Badge variant="outline" className={cn("text-[10px]",
                            w.status === "pending" ? "border-warning/50 text-warning" :
                            w.status === "completed" ? "border-success/50 text-success" :
                            "border-destructive/50 text-destructive"
                          )}>{w.status}</Badge>
                        </td>
                        <td className="py-2 px-2 text-muted-foreground">{fmtDate(w.created_at ?? "")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
