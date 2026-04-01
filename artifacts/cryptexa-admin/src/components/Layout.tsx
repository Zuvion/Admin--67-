import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Users, Clover, TrendingUp, ArrowDownCircle,
  Megaphone, Gift, MessageCircle, ScrollText, Settings,
  LogOut, ChevronLeft, ChevronRight, MoreHorizontal
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useGetChatUnread, useListWithdrawals, getGetChatUnreadQueryKey, getListWithdrawalsQueryKey } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: ReactNode;
  label: string;
  path: string;
  badge?: number;
}

function useBadges() {
  const { data: chatData } = useGetChatUnread({ query: { queryKey: getGetChatUnreadQueryKey(), refetchInterval: 30000 } });
  const { data: wdData } = useListWithdrawals(
    { status: "pending", limit: 1 },
    { query: { queryKey: getListWithdrawalsQueryKey({ status: "pending", limit: 1 }), refetchInterval: 60000 } }
  );
  const chatUnread = (chatData?.data ?? []).reduce((sum, u) => sum + (u.unread_count ?? 0), 0);
  const pendingWithdrawals = wdData?.total ?? 0;
  return { chatUnread, pendingWithdrawals };
}

function buildNavItems(chatUnread: number, pendingWithdrawals: number): NavItem[] {
  return [
    { icon: <LayoutDashboard size={18} />, label: "Дашборд", path: "/" },
    { icon: <Users size={18} />, label: "Пользователи", path: "/users" },
    { icon: <Clover size={18} />, label: "Lucky Mode", path: "/lucky" },
    { icon: <TrendingUp size={18} />, label: "Сделки", path: "/trades" },
    { icon: <ArrowDownCircle size={18} />, label: "Выводы", path: "/withdrawals", badge: pendingWithdrawals },
    { icon: <Megaphone size={18} />, label: "Рассылка", path: "/broadcast" },
    { icon: <Gift size={18} />, label: "Чеки", path: "/checks" },
    { icon: <MessageCircle size={18} />, label: "Поддержка", path: "/support", badge: chatUnread },
    { icon: <ScrollText size={18} />, label: "Логи", path: "/logs" },
    { icon: <Settings size={18} />, label: "Настройки", path: "/settings" },
  ];
}

const mobileMainPaths = ["/", "/users", "/withdrawals", "/support"];

function NavLink({ item, collapsed }: { item: NavItem; collapsed?: boolean }) {
  const [location] = useLocation();
  const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));

  return (
    <Link href={item.path}>
      <div
        data-testid={`nav-${item.path.replace("/", "") || "dashboard"}`}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative cursor-pointer",
          isActive
            ? "bg-primary/20 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
        )}
      >
        <span className="flex-shrink-0 relative">
          {item.icon}
          {collapsed && item.badge != null && item.badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center">
              {item.badge > 9 ? "9+" : item.badge}
            </span>
          )}
        </span>
        {!collapsed && <span className="text-sm font-medium flex-1">{item.label}</span>}
        {!collapsed && item.badge != null && item.badge > 0 && (
          <span className="text-xs font-bold bg-destructive text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        )}
      </div>
    </Link>
  );
}

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { logout } = useAuth();
  const { chatUnread, pendingWithdrawals } = useBadges();
  const items = buildNavItems(chatUnread, pendingWithdrawals);

  return (
    <div className={cn(
      "hidden md:flex flex-col fixed left-0 top-0 h-full bg-card border-r border-border transition-all duration-300 z-40",
      collapsed ? "w-16" : "w-56"
    )}>
      <div className="flex items-center justify-between p-4 border-b border-border min-h-[60px]">
        {!collapsed && (
          <div>
            <span className="text-sm font-bold gradient-text">CRYPTEXA</span>
            <span className="text-xs text-muted-foreground block">Панель Администратора</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-white/5 ml-auto"
          data-testid="sidebar-toggle"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
        {items.map((item) => (
          <NavLink key={item.path} item={item} collapsed={collapsed} />
        ))}
      </nav>

      <div className="p-2 border-t border-border">
        <button
          onClick={logout}
          data-testid="sidebar-logout"
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200",
          )}
        >
          <LogOut size={18} />
          {!collapsed && <span className="text-sm font-medium">Выйти</span>}
        </button>
      </div>
    </div>
  );
}

function MobileNav() {
  const [location] = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { chatUnread, pendingWithdrawals } = useBadges();
  const { logout } = useAuth();
  const allItems = buildNavItems(chatUnread, pendingWithdrawals);
  const mainItems = allItems.filter(i => mobileMainPaths.includes(i.path));
  const moreItems = allItems.filter(i => !mobileMainPaths.includes(i.path));

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border">
      <div className="flex items-center justify-around h-16 px-2">
        {mainItems.map((item) => {
          const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
          return (
            <Link key={item.path} href={item.path}>
              <div
                data-testid={`mobile-nav-${item.path.replace("/", "") || "dashboard"}`}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl relative cursor-pointer",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.icon}
                <span className="text-[10px] mt-0.5">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute -top-0.5 right-1 text-[9px] font-bold bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              data-testid="mobile-nav-more"
              className="flex flex-col items-center gap-0.5 px-3 py-2 text-muted-foreground rounded-xl"
            >
              <MoreHorizontal size={18} />
              <span className="text-[10px] mt-0.5">Ещё</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-card border-t border-border rounded-t-2xl">
            <div className="pt-2 pb-6">
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
              <div className="grid grid-cols-3 gap-3 px-2">
                {moreItems.map((item) => {
                  const isActive = location === item.path;
                  return (
                    <Link key={item.path} href={item.path}>
                      <div
                        onClick={() => setSheetOpen(false)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-xl relative cursor-pointer",
                          isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {item.icon}
                        <span className="text-xs font-medium">{item.label}</span>
                        {item.badge != null && item.badge > 0 && (
                          <span className="absolute top-1 right-1 text-[9px] font-bold bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center">
                            {item.badge > 9 ? "9+" : item.badge}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
                <button
                  onClick={() => { setSheetOpen(false); logout(); }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted text-destructive"
                >
                  <LogOut size={18} />
                  <span className="text-xs font-medium">Выйти</span>
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(v => !v)} />
      <MobileNav />
      <main className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "md:ml-16" : "md:ml-56",
        "pb-20 md:pb-0"
      )}>
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
