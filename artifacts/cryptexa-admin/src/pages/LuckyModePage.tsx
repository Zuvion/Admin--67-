import { useState } from "react";
import { useGetLuckyUsers, getGetLuckyUsersQueryKey, useSetLuckyMode } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { fmtDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "wouter";
import { Clover, Plus, Trash2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const FILTERS = [
  { value: "", label: "All" },
  { value: "on", label: "Active" },
  { value: "off", label: "Inactive" },
];

export default function LuckyModePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"" | "on" | "off">("");
  const [open, setOpen] = useState(false);

  // Form: uses telegram_id (string) as required by SetLuckyModeBody
  const [telegramId, setTelegramId] = useState("");
  const [maxWins, setMaxWins] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [reason, setReason] = useState("Lucky mode enabled by admin");

  const { data, isLoading } = useGetLuckyUsers(
    { search, filter },
    { query: { queryKey: getGetLuckyUsersQueryKey({ search, filter }) } }
  );
  const setLuckyMutation = useSetLuckyMode();

  const users = data?.users ?? [];

  const refresh = () => queryClient.invalidateQueries({ queryKey: getGetLuckyUsersQueryKey({ search, filter }) });

  const handleSet = async () => {
    if (!telegramId) return;
    const until = durationDays
      ? new Date(Date.now() + Number(durationDays) * 86400000).toISOString()
      : null;
    try {
      await setLuckyMutation.mutateAsync({
        data: {
          target_telegram_id: telegramId,
          enabled: true,
          reason: reason || "Enabled by admin",
          until,
          max_wins: maxWins ? Number(maxWins) : null,
        }
      });
      toast({ title: "Lucky mode enabled" });
      setOpen(false);
      setTelegramId("");
      setMaxWins("");
      setDurationDays("");
      refresh();
    } catch {
      toast({ title: "Failed to enable lucky mode", variant: "destructive" });
    }
  };

  const handleRemove = async (telegram_id: string, username?: string | null) => {
    try {
      await setLuckyMutation.mutateAsync({
        data: {
          target_telegram_id: telegram_id,
          enabled: false,
          reason: "Lucky mode disabled by admin",
          until: null,
          max_wins: null,
        }
      });
      toast({ title: `Lucky mode disabled for @${username || telegram_id}` });
      refresh();
    } catch {
      toast({ title: "Failed to disable lucky mode", variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20">
            <Clover size={20} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Lucky Mode</h1>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-btn text-white flex items-center gap-2" data-testid="button-add-lucky">
              <Plus size={16} /> Enable for User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Enable Lucky Mode</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Telegram ID *</label>
                <Input
                  placeholder="e.g. 123456789"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  className="bg-muted border-border"
                  data-testid="input-lucky-telegram-id"
                />
                <p className="text-xs text-muted-foreground mt-1">User's Telegram numeric ID</p>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Max Wins (leave empty = unlimited)</label>
                <Input
                  type="number"
                  placeholder="e.g. 10"
                  value={maxWins}
                  onChange={(e) => setMaxWins(e.target.value)}
                  className="bg-muted border-border"
                  data-testid="input-lucky-max-wins"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Duration (days, leave empty = forever)</label>
                <Input
                  type="number"
                  placeholder="e.g. 7"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="bg-muted border-border"
                  data-testid="input-lucky-duration"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Reason</label>
                <Input
                  placeholder="Reason for enabling"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="bg-muted border-border"
                  data-testid="input-lucky-reason"
                />
              </div>

              <Button
                className="w-full gradient-btn text-white"
                onClick={handleSet}
                disabled={setLuckyMutation.isPending || !telegramId}
                data-testid="button-apply-lucky"
              >
                Enable Lucky Mode
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted border-border"
            data-testid="input-lucky-search"
          />
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              data-testid={`filter-lucky-${f.value || "all"}`}
              onClick={() => setFilter(f.value as "" | "on" | "off")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                filter === f.value ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading
        ? <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        : users.length === 0
          ? (
            <div className="glass-card p-12 text-center">
              <Clover size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          )
          : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.profile_id} data-testid={`card-lucky-${user.profile_id}`} className="glass-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-xl", user.lucky_mode ? "bg-primary/10" : "bg-muted")}>
                      <Clover size={18} className={user.lucky_mode ? "text-primary" : "text-muted-foreground"} />
                    </div>
                    <div>
                      <Link href={`/users/${user.profile_id}`}>
                        <p className="font-semibold hover:text-primary cursor-pointer">
                          @{user.username || `user_${user.profile_id}`}
                          {user.lucky_mode && (
                            <Badge className="ml-2 bg-primary/20 text-primary border-primary/30 text-[10px]">Lucky ON</Badge>
                          )}
                        </p>
                      </Link>
                      <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-muted-foreground">
                        <span>ID: {user.profile_id}</span>
                        <span className="font-mono">TG: {user.telegram_id}</span>
                        {user.lucky_wins_used != null && (
                          <span>{user.lucky_wins_used}/{user.lucky_max_wins ?? "∞"} wins used</span>
                        )}
                        {user.lucky_until && (
                          <span className="text-warning">Until: {fmtDate(user.lucky_until)}</span>
                        )}
                        {user.lucky_mode && !user.lucky_until && (
                          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Forever</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {user.lucky_mode && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => handleRemove(user.telegram_id ?? "", user.username)}
                      disabled={setLuckyMutation.isPending}
                      data-testid={`button-remove-lucky-${user.profile_id}`}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )
      }
    </div>
  );
}
