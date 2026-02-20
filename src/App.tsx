import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppDataProvider } from "@/contexts/AppDataContext";
import MainLayout from "@/components/layout/MainLayout";
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
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AppDataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppDataProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
