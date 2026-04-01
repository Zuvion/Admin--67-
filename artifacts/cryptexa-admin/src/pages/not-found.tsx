import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="glass-card p-8 max-w-sm w-full mx-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">404</h1>
        <p className="text-muted-foreground">Страница не найдена</p>
      </div>
    </div>
  );
}
