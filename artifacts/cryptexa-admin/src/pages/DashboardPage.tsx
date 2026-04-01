import { useGetDashboard, useGetOnlineCount, getGetDashboardQueryKey, getGetOnlineCountQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { fmtNum, isOnline, timeAgo } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Zap, TrendingUp, TrendingDown, ArrowDownCircle, Activity, DollarSign, Gem } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color?: "green" | "purple" | "red" | "gradient" | "default";
  pulse?: boolean;
}

function StatCard({ label, value, icon, color = "default", pulse }: StatCardProps) {
  const colorMap = {
    green: "text-success",
    purple: "text-primary",
    red: "text-destructive",
    gradient: "gradient-text",
    default: "text-foreground",
  };

  return (
    <div className="glass-card p-4" data-testid={`card-stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
        <div className={cn("p-2 rounded-lg bg-white/5", colorMap[color])}>
          {icon}
        </div>
      </div>
      <div className={cn("text-2xl font-bold font-mono", colorMap[color], pulse && "flex items-center gap-2")}>
        {pulse && (
          <span className="w-2 h-2 rounded-full bg-success pulse-green inline-block" />
        )}
        {value}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: dashboard, isLoading: dashLoading } = useGetDashboard({
    query: { queryKey: getGetDashboardQueryKey(), refetchInterval: 30000 }
  });
  const { data: onlineData, isLoading: onlineLoading } = useGetOnlineCount({
    query: { queryKey: getGetOnlineCountQueryKey(), refetchInterval: 30000 }
  });

  const stats = dashboard?.stats;
  const online = onlineData?.data;

  if (dashLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <span className="text-xs text-muted-foreground">Auto-refreshes every 30s</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={fmtNum(stats?.total_users ?? 0, 0)} icon={<Users size={16} />} />
        <StatCard label="Online Now" value={fmtNum(online?.count ?? 0, 0)} icon={<Activity size={16} />} color="green" pulse />
        <StatCard label="Deposits Today" value={`$${fmtNum(stats?.deposits_today ?? 0)}`} icon={<DollarSign size={16} />} color="green" />
        <StatCard label="Deposits Week" value={`$${fmtNum(stats?.deposits_week ?? 0)}`} icon={<TrendingUp size={16} />} />
        <StatCard label="Deposits Month" value={`$${fmtNum(stats?.deposits_month ?? 0)}`} icon={<TrendingUp size={16} />} />
        <StatCard label="Active Trades" value={fmtNum(stats?.active_trades ?? 0, 0)} icon={<Zap size={16} />} color="purple" />
        <StatCard
          label="Pending Withdrawals"
          value={fmtNum(stats?.pending_withdrawals ?? 0, 0)}
          icon={<ArrowDownCircle size={16} />}
          color={(stats?.pending_withdrawals ?? 0) > 0 ? "red" : "default"}
        />
        <StatCard label="Total Balance" value={`$${fmtNum(stats?.total_balance ?? 0)}`} icon={<Gem size={16} />} color="gradient" />
      </div>

      <div className="glass-card p-5">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success pulse-green inline-block" />
          Online Users {online?.count ? `(${online.count})` : ""}
        </h2>

        {onlineLoading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : (online?.users?.length ?? 0) === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">No users online</p>
        ) : (
          <div className="space-y-2">
            {online?.users?.map((user) => (
              <Link key={user.telegram_id} href={`/users/${user.profile_id}`}>
                <div
                  data-testid={`row-online-user-${user.profile_id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-success pulse-green" />
                    <div>
                      <p className="text-sm font-medium">@{user.username || "unknown"}</p>
                      <p className="text-xs text-muted-foreground">ID: {user.profile_id}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{timeAgo(user.last_online_at ?? null)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
