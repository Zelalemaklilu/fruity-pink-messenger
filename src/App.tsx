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
import Contacts from "./pages/Contacts";
import Calls from "./pages/Calls";
import SavedMessages from "./pages/SavedMessages";
import NewGroup from "./pages/NewGroup";
import Wallet from "./pages/Wallet";
import Features from "./pages/Features";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      const authToken = localStorage.getItem('authToken');
      console.log('Checking auth token:', authToken);
      setIsAuthenticated(!!authToken);
      setIsLoading(false);
    };

    checkAuth();

    // Listen for storage changes
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  console.log('App state - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-8">
        <div className="text-center space-y-6 animate-in fade-in-0 duration-1000">
          <div className="relative mx-auto w-32 h-32 rounded-3xl overflow-hidden shadow-primary">
            <img 
              src="/src/assets/zeshopp-logo.jpg" 
              alt="Zeshopp Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">
              Zeshopp Chat
            </h1>
            <p className="text-lg text-muted-foreground">
              Fast. Simple. Secure.
            </p>
          </div>

          <div className="mt-8">
            <div className="w-16 h-1 bg-gradient-primary rounded-full mx-auto animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
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
      <Route path="/contacts" element={
        isAuthenticated ? <Contacts /> : <Navigate to="/" replace />
      } />
      <Route path="/calls" element={
        isAuthenticated ? <Calls /> : <Navigate to="/" replace />
      } />
      <Route path="/saved-messages" element={
        isAuthenticated ? <SavedMessages /> : <Navigate to="/" replace />
      } />
      <Route path="/new-group" element={
        isAuthenticated ? <NewGroup /> : <Navigate to="/" replace />
      } />
      <Route path="/wallet" element={
        isAuthenticated ? <Wallet /> : <Navigate to="/" replace />
      } />
      <Route path="/features" element={
        isAuthenticated ? <Features /> : <Navigate to="/" replace />
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
