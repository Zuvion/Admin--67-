import { useGetCryptexaHealth, getGetCryptexaHealthQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { logout } = useAuth();
  const { data, isLoading, error } = useGetCryptexaHealth({
    query: { queryKey: getGetCryptexaHealthQueryKey() }
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: getGetCryptexaHealthQueryKey() });
    toast({ title: "Обновлено" });
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/20">
          <Settings size={20} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Настройки</h1>
      </div>

      <div className="max-w-lg space-y-4">
        {/* Статус подключения */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Статус бэкенда CRYPTEXA</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-2"
              data-testid="button-refresh-status"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              Обновить
            </Button>
          </div>

          {isLoading ? (
            <Skeleton className="h-24 rounded-xl" />
          ) : error ? (
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
              <XCircle size={18} className="text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Бэкенд недоступен</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Не удаётся подключиться к CRYPTEXA. Проверьте переменные CRYPTEXA_API_URL и ADMIN_API_KEY.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-success/10 border border-success/20 rounded-xl">
                <CheckCircle size={18} className="text-success mt-0.5" />
                <div>
                  <p className="font-medium text-success">Бэкенд подключён</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Успешное соединение с CRYPTEXA.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Приложение</p>
                  <p className="font-medium">{data?.app || "CRYPTEXA"}</p>
                </div>
                <div className="p-3 bg-muted rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Версия</p>
                  <p className="font-mono">{data?.version || "—"}</p>
                </div>
                {data?.admin_id && (
                  <div className="p-3 bg-muted rounded-xl col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Admin ID</p>
                    <p className="font-mono text-xs">{data.admin_id}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Переменные окружения */}
        <div className="glass-card p-5">
          <h2 className="font-semibold mb-4">Переменные окружения</h2>
          <div className="space-y-2">
            {[
              { key: "CRYPTEXA_API_URL", required: true },
              { key: "ADMIN_API_KEY", required: true },
              { key: "ADMIN_PASSWORD", required: true },
              { key: "JWT_SECRET / SESSION_SECRET", required: false },
            ].map((env) => (
              <div key={env.key} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="font-mono text-xs">{env.key}</span>
                <div className="flex items-center gap-2">
                  {env.required && <Badge variant="outline" className="text-[10px]">Обязательно</Badge>}
                  <span className="text-xs text-muted-foreground">••••••</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Задайте эти переменные в разделе Secrets в Replit для подключения к вашему CRYPTEXA бэкенду.
          </p>
        </div>

        {/* Информация об API */}
        <div className="glass-card p-5">
          <h2 className="font-semibold mb-4">API</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Авторизация</span>
              <span>JWT Bearer Token</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Срок токена</span>
              <span>30 дней</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Обновление дашборда</span>
              <span>каждые 30 сек</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Обновление чата</span>
              <span>каждые 10 сек</span>
            </div>
          </div>
        </div>

        {/* Выход */}
        <div className="glass-card p-5">
          <h2 className="font-semibold mb-2">Сессия</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Выход завершает текущую сессию администратора. Для повторного входа потребуется пароль.
          </p>
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={logout}
            data-testid="button-logout"
          >
            Выйти из панели
          </Button>
        </div>
      </div>
    </div>
  );
}
