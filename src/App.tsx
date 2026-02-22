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
import AgencyOffer from "@/pages/AgencyOffer";
import TermsOfUse from "@/pages/TermsOfUse";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
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
import Onboarding from "@/pages/Onboarding";

const queryClient = new QueryClient();

const ProtectedArea = () => {
  const { user, loading, onboardingCompleted } = useAuth();

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

  if (!onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <AppDataProvider>
      <Outlet />
    </AppDataProvider>
  );
};

const PublicAuth = () => {
  const { user, loading, onboardingCompleted } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Проверка сессии...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to={onboardingCompleted ? "/dashboard" : "/onboarding"} replace />;
  }

  return <Auth />;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/documents/agency-offer" element={<AgencyOffer />} />
        <Route path="/documents/terms" element={<TermsOfUse />} />
        <Route path="/documents/privacy" element={<PrivacyPolicy />} />
        <Route path="/auth" element={<PublicAuth />} />
        <Route path="/onboarding" element={<Onboarding />} />

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
