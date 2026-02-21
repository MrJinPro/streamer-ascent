import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppDataProvider } from "@/contexts/AppDataContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Progress from "@/pages/Progress";
import Achievements from "@/pages/Achievements";
import Tasks from "@/pages/Tasks";
import Learning from "@/pages/Learning";
import Articles from "@/pages/Articles";
import Chat from "@/pages/Chat";
import AICoach from "@/pages/AICoach";
import Admin from "@/pages/Admin";
import Ranking from "@/pages/Ranking";
import Profile from "@/pages/Profile";
import Auth from "@/pages/Auth";

const queryClient = new QueryClient();

const ProtectedArea = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Проверка сессии...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppDataProvider>
      <Outlet />
    </AppDataProvider>
  );
};

const PublicAuth = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Проверка сессии...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Auth />;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<PublicAuth />} />

        <Route element={<ProtectedArea />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/learning" element={<Learning />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/ai-coach" element={<AICoach />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<Profile />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
