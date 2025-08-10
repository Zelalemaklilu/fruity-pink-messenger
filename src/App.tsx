import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Splash from "./pages/Splash";
import Auth from "./pages/Auth";
import OTP from "./pages/OTP";
import Chats from "./pages/Chats";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      const authToken = localStorage.getItem('authToken');
      setIsAuthenticated(!!authToken);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return <Splash />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={
                isAuthenticated ? <Navigate to="/chats" replace /> : <Splash />
              } />
              <Route path="/auth" element={
                isAuthenticated ? <Navigate to="/chats" replace /> : <Auth />
              } />
              <Route path="/otp" element={
                isAuthenticated ? <Navigate to="/chats" replace /> : <OTP />
              } />
              <Route path="/chats" element={
                isAuthenticated ? <Chats /> : <Navigate to="/" replace />
              } />
              <Route path="/chat/:chatId" element={
                isAuthenticated ? <Chat /> : <Navigate to="/" replace />
              } />
              <Route path="/profile" element={
                isAuthenticated ? <Profile /> : <Navigate to="/" replace />
              } />
              <Route path="/settings" element={
                isAuthenticated ? <Settings /> : <Navigate to="/" replace />
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
