import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import Splash from "./pages/Splash";
import Auth from "./pages/Auth";
import Chats from "./pages/Chats";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Contacts from "./pages/Contacts";
import Calls from "./pages/Calls";
import SavedMessages from "./pages/SavedMessages";
import NewGroup from "./pages/NewGroup";
import NewMessage from "./pages/NewMessage";
import NewContact from "./pages/NewContact";
import Wallet from "./pages/Wallet";
import Features from "./pages/Features";
import AddMoney from "./pages/AddMoney";
import SendMoney from "./pages/SendMoney";
import RequestMoney from "./pages/RequestMoney";
import TransactionHistory from "./pages/TransactionHistory";
import TransactionReceipt from "./pages/TransactionReceipt";
import TransactionDetail from "./pages/TransactionDetail";
import AddAccount from "./pages/AddAccount";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import { supabase } from "@/integrations/supabase/client";
import { updateOnlineStatus } from "@/lib/supabaseService";
import logoImage from "@/assets/zeshopp-logo.jpg";
import type { User } from "@supabase/supabase-js";
import { CallProvider } from "@/contexts/CallContext";
import { CallOverlay } from "@/components/call/CallOverlay";
import { DevHealthBanner } from "@/components/dev/DevHealthBanner";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  const loginToastShownRef = useRef(false);
  const redirectToChatsDoneRef = useRef(false);

  const isAuthenticated = authState === 'authenticated';

  // Auth state subscription
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[Auth] State change:", event, session?.user?.id);
        
        if (session?.user) {
          setUser(session.user);
          setAuthState('authenticated');
          
          // Update online status (non-blocking)
          updateOnlineStatus(session.user.id, true).catch(console.warn);
        } else {
          setUser(null);
          setAuthState('unauthenticated');
          loginToastShownRef.current = false;
          redirectToChatsDoneRef.current = false;
        }
      }
    );

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setAuthState('authenticated');
        updateOnlineStatus(session.user.id, true).catch(console.warn);
      } else {
        setAuthState('unauthenticated');
      }
    });

    // Cleanup: set offline on unmount
    return () => {
      subscription.unsubscribe();
      if (user?.id) {
        updateOnlineStatus(user.id, false).catch(console.warn);
      }
    };
  }, []);

  // Post-login toast & redirect
  useEffect(() => {
    if (!isAuthenticated) return;

    if (!loginToastShownRef.current) {
      toast.success("Login successful");
      loginToastShownRef.current = true;
    }

    if (redirectToChatsDoneRef.current) return;
    if (location.pathname === "/chats") {
      redirectToChatsDoneRef.current = true;
      return;
    }

    const publicPaths = new Set(["/", "/auth", "/forgot-password"]);
    if (publicPaths.has(location.pathname)) {
      redirectToChatsDoneRef.current = true;
      navigate("/chats", { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  // Loading screen
  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-8">
        <div className="text-center space-y-6 animate-in fade-in-0 duration-1000">
          <div className="relative mx-auto w-32 h-32 rounded-3xl overflow-hidden shadow-primary">
            <img 
              src={logoImage} 
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
    <Routes location={location}>
      <Route path="/" element={
        isAuthenticated ? <Navigate to="/chats" replace /> : <Splash />
      } />
      <Route path="/auth" element={
        isAuthenticated ? <Navigate to="/chats" replace /> : <Auth />
      } />
      <Route path="/forgot-password" element={
        isAuthenticated ? <Navigate to="/chats" replace /> : <ForgotPassword />
      } />
      <Route path="/chats" element={
        isAuthenticated ? <Chats /> : <Navigate to="/" replace />
      } />
      <Route path="/chat" element={
        isAuthenticated ? <Navigate to="/chats" replace /> : <Navigate to="/" replace />
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
      <Route path="/new-message" element={
        isAuthenticated ? <NewMessage /> : <Navigate to="/" replace />
      } />
      <Route path="/new-contact" element={
        isAuthenticated ? <NewContact /> : <Navigate to="/" replace />
      } />
      <Route path="/wallet" element={
        isAuthenticated ? <Wallet /> : <Navigate to="/" replace />
      } />
      <Route path="/features" element={
        isAuthenticated ? <Features /> : <Navigate to="/" replace />
      } />
      <Route path="/add-money" element={
        isAuthenticated ? <AddMoney /> : <Navigate to="/" replace />
      } />
      <Route path="/send-money" element={
        isAuthenticated ? <SendMoney /> : <Navigate to="/" replace />
      } />
      <Route path="/request-money" element={
        isAuthenticated ? <RequestMoney /> : <Navigate to="/" replace />
      } />
      <Route path="/transaction-history" element={
        isAuthenticated ? <TransactionHistory /> : <Navigate to="/" replace />
      } />
      <Route path="/transaction-receipt" element={
        isAuthenticated ? <TransactionReceipt /> : <Navigate to="/" replace />
      } />
      <Route path="/transaction-detail/:transactionId" element={
        isAuthenticated ? <TransactionDetail /> : <Navigate to="/" replace />
      } />
      <Route path="/add-account" element={
        isAuthenticated ? <AddAccount /> : <Navigate to="/" replace />
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
            <CallProvider>
              <AppRoutes />
              <CallOverlay />
              <DevHealthBanner />
            </CallProvider>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
