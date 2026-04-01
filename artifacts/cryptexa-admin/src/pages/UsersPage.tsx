import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useListUsers, getListUsersQueryKey } from "@workspace/api-client-react";
import { fmtNum, isOnline, timeAgo, fmtWinRate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "", label: "Все" },
  { value: "premium", label: "Премиум" },
  { value: "blocked", label: "Заблокированные" },
  { value: "verified", label: "Верифицированные" },
  { value: "with_balance", label: "С балансом" },
];

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useListUsers(
    { page, limit: 20, search: debouncedSearch, filter: filter as "" },
    { query: { queryKey: getListUsersQueryKey({ page, limit: 20, search: debouncedSearch, filter: filter as "" }) } }
  );

  const users = data?.users ?? [];
  const totalPages = data?.pages ?? 1;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Пользователи</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени, Telegram ID, profile ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 bg-muted border-border"
            data-testid="input-user-search"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              data-testid={`filter-${f.value || "all"}`}
              onClick={() => { setFilter(f.value); setPage(1); }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                filter === f.value
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Таблица (десктоп) */}
      <div className="hidden md:block glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-xs uppercase">
              <th className="text-left px-4 py-3 font-medium">ID</th>
              <th className="text-left px-4 py-3 font-medium">Пользователь</th>
              <th className="text-left px-4 py-3 font-medium">Баланс</th>
              <th className="text-left px-4 py-3 font-medium">Статус</th>
              <th className="text-left px-4 py-3 font-medium">Вин рейт</th>
              <th className="text-left px-4 py-3 font-medium">Онлайн</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array(10).fill(0).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  {Array(6).fill(0).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>
                  ))}
                </tr>
              ))
              : users.map((user) => (
                <Link key={user.id} href={`/users/${user.profile_id}`}>
                  <tr
                    data-testid={`row-user-${user.profile_id}`}
                    className="border-b border-border/50 hover:bg-white/3 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{user.profile_id}</td>
                    <td className="px-4 py-3 font-medium">
                      <div>
                        <p>@{user.username || "—"}</p>
                        <a
                          href={user.telegram_link}
                          className="text-xs text-muted-foreground hover:text-primary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {user.telegram_id}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-foreground">
                      {fmtNum(user.balance_usdt ?? 0)} USDT
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.is_premium && <Badge variant="outline" className="text-[10px] border-yellow-500/50 text-yellow-400">Премиум</Badge>}
                        {user.is_verified && <Badge variant="outline" className="text-[10px] border-success/50 text-success">Верифицирован</Badge>}
                        {user.is_blocked && <Badge variant="outline" className="text-[10px] border-destructive/50 text-destructive">Заблокирован</Badge>}
                        {user.lucky_mode && <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">Lucky</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">{fmtWinRate(user.custom_win_rate ?? null)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          isOnline(user.last_online_at ?? null) ? "bg-success pulse-green" : "bg-muted"
                        )} />
                        <span className="text-xs text-muted-foreground">{timeAgo(user.last_online_at ?? null)}</span>
                      </div>
                    </td>
                  </tr>
                </Link>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Карточки (мобайл) */}
      <div className="md:hidden space-y-3">
        {isLoading
          ? Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          : users.map((user) => (
            <Link key={user.id} href={`/users/${user.profile_id}`}>
              <div data-testid={`card-user-${user.profile_id}`} className="glass-card p-4 cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">@{user.username || "—"}</p>
                    <p className="text-xs text-muted-foreground font-mono">ID: {user.profile_id}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      isOnline(user.last_online_at ?? null) ? "bg-success pulse-green" : "bg-muted"
                    )} />
                  </div>
                </div>
                <p className="font-mono font-bold text-lg">{fmtNum(user.balance_usdt ?? 0)} <span className="text-xs text-muted-foreground">USDT</span></p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {user.is_premium && <Badge variant="outline" className="text-[10px] border-yellow-500/50 text-yellow-400">Премиум</Badge>}
                  {user.is_verified && <Badge variant="outline" className="text-[10px] border-success/50 text-success">Верифицирован</Badge>}
                  {user.is_blocked && <Badge variant="outline" className="text-[10px] border-destructive/50 text-destructive">Заблокирован</Badge>}
                  {user.lucky_mode && <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">Lucky</Badge>}
                </div>
              </div>
            </Link>
          ))
        }
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            data-testid="button-prev-page"
          >
            <ChevronLeft size={14} />
          </Button>
          <span className="text-sm text-muted-foreground">
            Стр. {page} из {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            data-testid="button-next-page"
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}
