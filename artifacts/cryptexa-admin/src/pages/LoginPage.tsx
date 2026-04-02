import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useAdminLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Shield, Send } from "lucide-react";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          user?: { id?: number };
        };
        ready: () => void;
        expand: () => void;
      };
    };
  }
}

const ADMIN_TELEGRAM_ID = 5394437781;

export default function LoginPage() {
  const [error, setError] = useState("");
  const [initData, setInitData] = useState("");
  const [telegramUserId, setTelegramUserId] = useState<number | null>(null);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const loginMutation = useAdminLogin();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      if (tg.initData) {
        setInitData(tg.initData);
      }
      const userId = tg.initDataUnsafe?.user?.id ?? null;
      setTelegramUserId(userId);
    }
  }, []);

  const handleLogin = async () => {
    setError("");

    if (!initData) {
      setError("Откройте приложение через Telegram");
      return;
    }

    // Клиентская предпроверка — быстрый отказ без запроса к серверу
    if (telegramUserId !== null && telegramUserId !== ADMIN_TELEGRAM_ID) {
      setError("Доступ запрещён");
      return;
    }

    try {
      const result = await loginMutation.mutateAsync({
        data: { initData, password: "" },
      });
      if (result.ok && result.token) {
        login(result.token);
        setLocation("/");
      } else {
        setError("Ошибка входа");
      }
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const data = (err as { data?: { error?: string } })?.data;
      if (status === 403) {
        setError("Доступ запрещён");
      } else if (status === 401) {
        setError("Неверные данные Telegram");
      } else if (status === 500 && data?.error) {
        setError(`Ошибка сервера: ${data.error}`);
      } else {
        setError("Ошибка подключения к серверу");
      }
    }
  };

  const isInsideTelegram = !!window.Telegram?.WebApp?.initData;
  const isWrongUser =
    telegramUserId !== null && telegramUserId !== ADMIN_TELEGRAM_ID;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="glass-card p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-btn flex items-center justify-center mb-4">
              <Shield size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">CRYPTEXA</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Панель Администратора
            </p>
          </div>

          <div className="space-y-4">
            {!isInsideTelegram && (
              <p className="text-sm text-muted-foreground text-center">
                Откройте это приложение через Telegram
              </p>
            )}

            {isWrongUser && (
              <p className="text-sm text-destructive text-center font-medium">
                У вас нет прав доступа к этой панели
              </p>
            )}

            {error && !isWrongUser && (
              <p
                className="text-sm text-destructive text-center"
                data-testid="text-login-error"
              >
                {error}
              </p>
            )}

            <Button
              onClick={handleLogin}
              className="w-full gradient-btn text-white font-semibold flex items-center gap-2"
              disabled={loginMutation.isPending || !isInsideTelegram || isWrongUser}
              data-testid="button-login"
            >
              <Send size={16} />
              {loginMutation.isPending ? "Вход..." : "Войти через Telegram"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Защищённый доступ — CRYPTEXA Admin
          </p>
        </div>
      </div>
    </div>
  );
}
