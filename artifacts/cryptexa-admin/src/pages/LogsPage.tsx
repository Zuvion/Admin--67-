import { useState } from "react";
import { useGetAdminLogs, getGetAdminLogsQueryKey } from "@workspace/api-client-react";
import { fmtDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ScrollText } from "lucide-react";

export default function LogsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetAdminLogs(
    { page, limit: 50 },
    { query: { queryKey: getGetAdminLogsQueryKey({ page, limit: 50 }) } }
  );

  const logs = data?.logs ?? [];
  const totalPages = data?.pages ?? 1;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/20">
          <ScrollText size={20} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Логи администратора</h1>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase">
                <th className="text-left px-4 py-3 font-medium w-40">Время</th>
                <th className="text-left px-4 py-3 font-medium w-24">Действие</th>
                <th className="text-left px-4 py-3 font-medium">Было</th>
                <th className="text-left px-4 py-3 font-medium">Стало</th>
                <th className="text-left px-4 py-3 font-medium">Причина</th>
                <th className="text-left px-4 py-3 font-medium w-24">Админ</th>
                <th className="text-left px-4 py-3 font-medium w-24">User ID</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array(15).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array(7).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-2"><Skeleton className="h-4" /></td>
                    ))}
                  </tr>
                ))
                : logs.length === 0
                  ? <tr><td colSpan={7} className="text-center py-8 text-muted-foreground font-sans">Логи не найдены</td></tr>
                  : logs.map((log) => (
                    <tr key={log.id} data-testid={`row-log-${log.id}`} className="border-b border-border/50 hover:bg-white/2 transition-colors font-mono">
                      <td className="px-4 py-2 text-muted-foreground">{fmtDate(log.created_at ?? "")}</td>
                      <td className="px-4 py-2">
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground max-w-[100px] truncate" title={log.before_value ?? ""}>
                        {log.before_value || "—"}
                      </td>
                      <td className="px-4 py-2 text-foreground max-w-[100px] truncate" title={log.after_value ?? ""}>
                        {log.after_value || "—"}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground font-sans max-w-[100px] truncate" title={log.reason ?? ""}>
                        {log.reason || "—"}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{log.admin_id || "—"}</td>
                      <td className="px-4 py-2 text-muted-foreground">{log.user_id || "—"}</td>
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
    </div>
  );
}
