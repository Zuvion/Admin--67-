import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import UsersPage from "@/pages/UsersPage";
import UserDetailPage from "@/pages/UserDetailPage";
import LuckyModePage from "@/pages/LuckyModePage";
import TradesPage from "@/pages/TradesPage";
import WithdrawalsPage from "@/pages/WithdrawalsPage";
import BroadcastPage from "@/pages/BroadcastPage";
import ChecksPage from "@/pages/ChecksPage";
import SupportPage from "@/pages/SupportPage";
import LogsPage from "@/pages/LogsPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!token) return <Redirect to="/login" />;
  return <Layout>{children}</Layout>;
}

function Router() {
  const { token, loading } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        {loading
          ? <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
          : token ? <Redirect to="/" /> : <LoginPage />}
      </Route>
      <Route path="/">
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      </Route>
      <Route path="/users">
        <ProtectedRoute><UsersPage /></ProtectedRoute>
      </Route>
      <Route path="/users/:profileId">
        <ProtectedRoute><UserDetailPage /></ProtectedRoute>
      </Route>
      <Route path="/lucky">
        <ProtectedRoute><LuckyModePage /></ProtectedRoute>
      </Route>
      <Route path="/trades">
        <ProtectedRoute><TradesPage /></ProtectedRoute>
      </Route>
      <Route path="/withdrawals">
        <ProtectedRoute><WithdrawalsPage /></ProtectedRoute>
      </Route>
      <Route path="/broadcast">
        <ProtectedRoute><BroadcastPage /></ProtectedRoute>
      </Route>
      <Route path="/checks">
        <ProtectedRoute><ChecksPage /></ProtectedRoute>
      </Route>
      <Route path="/support">
        <ProtectedRoute><SupportPage /></ProtectedRoute>
      </Route>
      <Route path="/logs">
        <ProtectedRoute><LogsPage /></ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute><SettingsPage /></ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
