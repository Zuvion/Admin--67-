import { useState } from "react";
import { useListWithdrawals, getListWithdrawalsQueryKey, useWithdrawalAction } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { fmtNum, fmtDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const STATUS_FILTERS = [
  { value: "pending", label: "Ожидают" },
  { value: "completed", label: "Выполненные" },
  { value: "cancelled", label: "Отменённые" },
  { value: "all", label: "Все" },
] as const;

export default function WithdrawalsPage() {
  const [status, setStatus] = useState<"pending" | "completed" | "cancelled" | "all">("pending");
  const [page, setPage] = useState(1);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useListWithdrawals(
    { status, page, limit: 20 },
    { query: { queryKey: getListWithdrawalsQueryKey({ status, page, limit: 20 }) } }
  );

  const actionMutation = useWithdrawalAction();

  const withdrawals = data?.withdrawals ?? [];
  const totalPages = data?.pages ?? 1;

  const refreshData = () => queryClient.invalidateQueries({ queryKey: getListWithdrawalsQueryKey({ status, page, limit: 20 }) });

  const handleApprove = async (id: number) => {
    try {
      await actionMutation.mutateAsync({ wdId: id, data: { action: "approve", reason: null } });
      toast({ title: "Вывод одобрен" });
      refreshData();
    } catch {
      toast({ title: "Ошибка при одобрении", variant: "destructive" });
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    try {
      await actionMutation.mutateAsync({ wdId: rejectId, data: { action: "reject", reason: rejectReason } });
      toast({ title: "Вывод отклонён" });
      setRejectOpen(false);
      setRejectReason("");
      refreshData();
    } catch {
      toast({ title: "Ошибка при отклонении", variant: "destructive" });
    }
  };

  const statusLabel = (s: string) => {
    if (s === "pending") return "Ожидает";
    if (s === "completed") return "Выполнен";
    if (s === "cancelled") return "Отменён";
    return s;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Выводы</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.value}
            data-testid={`filter-status-${s.value}`}
            onClick={() => { setStatus(s.value); setPage(1); }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              status === s.value ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase">
                <th className="text-left px-4 py-3 font-medium">ID</th>
                <th className="text-left px-4 py-3 font-medium">Пользователь</th>
                <th className="text-left px-4 py-3 font-medium">Сумма</th>
                <th className="text-left px-4 py-3 font-medium">Адрес</th>
                <th className="text-left px-4 py-3 font-medium">Сеть</th>
                <th className="text-left px-4 py-3 font-medium">Статус</th>
                <th className="text-left px-4 py-3 font-medium">Дата</th>
                {status === "pending" && <th className="text-left px-4 py-3 font-medium">Действия</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array(8).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array(status === "pending" ? 8 : 7).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-5" /></td>
                    ))}
                  </tr>
                ))
                : withdrawals.length === 0
                  ? <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Нет выводов</td></tr>
                  : withdrawals.map((w) => (
                    <tr key={w.id} data-testid={`row-withdrawal-${w.id}`} className="border-b border-border/50">
                      <td className="px-4 py-3 font-mono text-xs">{w.id}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">@{w.username || "—"}</p>
                          <p className="text-xs text-muted-foreground">ID: {w.profile_id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold">{fmtNum(w.amount_rub ?? 0)} USDT</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[120px] truncate" title={w.card_number ?? ""}>
                        {w.card_number}
                      </td>
                      <td className="px-4 py-3">{w.full_name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn("text-xs",
                          w.status === "pending" ? "border-warning/50 text-warning" :
                          w.status === "completed" ? "border-success/50 text-success" :
                          "border-destructive/50 text-destructive"
                        )}>
                          {statusLabel(w.status ?? "")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(w.created_at ?? "")}</td>
                      {status === "pending" && (
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-success border-success/30 hover:bg-success/10 h-7"
                              onClick={() => handleApprove(w.id ?? 0)}
                              disabled={actionMutation.isPending}
                              data-testid={`button-approve-${w.id}`}
                            >
                              <CheckCircle size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/30 hover:bg-destructive/10 h-7"
                              onClick={() => { setRejectId(w.id ?? 0); setRejectOpen(true); }}
                              data-testid={`button-reject-${w.id}`}
                            >
                              <XCircle size={14} />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} data-testid="button-prev-page">
            <ChevronLeft size={14} />
          </Button>
          <span className="text-sm text-muted-foreground">Стр. {page} из {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} data-testid="button-next-page">
            <ChevronRight size={14} />
          </Button>
        </div>
      )}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Отклонить вывод #{rejectId}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Средства автоматически вернутся на баланс пользователя.</p>
            <Input
              placeholder="Причина отклонения..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="bg-muted border-border"
              data-testid="input-reject-reason"
            />
            <Button
              className="w-full bg-destructive hover:bg-destructive/90 text-white"
              onClick={handleReject}
              disabled={actionMutation.isPending}
              data-testid="button-confirm-reject"
            >
              Отклонить вывод
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
