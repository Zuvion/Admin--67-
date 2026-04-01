import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useAdminLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Shield } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const loginMutation = useAdminLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const result = await loginMutation.mutateAsync({ data: { password, initData: "" } });
      if (result.ok && result.token) {
        login(result.token);
        setLocation("/");
      } else {
        setError("Неверный пароль");
      }
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const data = (err as { data?: { error?: string } })?.data;
      if (status === 401) {
        setError("Неверный пароль");
      } else if (status === 500 && data?.error) {
        setError(`Ошибка сервера: ${data.error}`);
      } else {
        setError("Ошибка подключения к серверу");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="glass-card p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-btn flex items-center justify-center mb-4">
              <Shield size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">CRYPTEXA</h1>
            <p className="text-sm text-muted-foreground mt-1">Панель Администратора</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Введите пароль администратора"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-muted border-border text-foreground"
                data-testid="input-password"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center" data-testid="text-login-error">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full gradient-btn text-white font-semibold"
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending ? "Вход..." : "Войти"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Защищённый доступ — CRYPTEXA Admin
          </p>
        </div>
      </div>
    </div>
  );
}
