import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
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
import { updateOnlineStatus } from "@/lib/supabaseService";
import logoImage from "@/assets/zeshopp-logo.jpg";
import { CallProvider } from "@/contexts/CallContext";
import { CallOverlay } from "@/components/call/CallOverlay";
import { DevHealthBanner } from "@/components/dev/DevHealthBanner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { chatStore } from "@/lib/chatStore";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { authState, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const loginToastShownRef = useRef(false);
  const redirectToChatsDoneRef = useRef(false);

  const isAuthenticated = authState === 'authenticated';

  // Initialize chat store from the single, already-restored auth state
  useEffect(() => {
    if (user?.id) {
      chatStore.initialize(user.id).catch((err) => {
        console.error("[ChatStore] initialize failed:", err);
      });
    } else {
      chatStore.cleanup();
    }
  }, [user?.id]);

  // Online status (non-blocking)
  useEffect(() => {
    if (!user?.id) return;
    updateOnlineStatus(user.id, true).catch(console.warn);
    return () => {
      updateOnlineStatus(user.id, false).catch(console.warn);
    };
  }, [user?.id]);

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
        isAuthenticated ? <Chats /> : <Navigate to="/auth" replace />
      } />
      <Route path="/chat" element={
        isAuthenticated ? <Navigate to="/chats" replace /> : <Navigate to="/" replace />
      } />
      <Route path="/chat/:chatId" element={
        isAuthenticated ? <Chat /> : <Navigate to="/auth" replace />
      } />
      <Route path="/profile" element={
        isAuthenticated ? <Profile /> : <Navigate to="/auth" replace />
      } />
      <Route path="/settings" element={
        isAuthenticated ? <Settings /> : <Navigate to="/auth" replace />
      } />
      <Route path="/contacts" element={
        isAuthenticated ? <Contacts /> : <Navigate to="/auth" replace />
      } />
      <Route path="/calls" element={
        isAuthenticated ? <Calls /> : <Navigate to="/auth" replace />
      } />
      <Route path="/saved-messages" element={
        isAuthenticated ? <SavedMessages /> : <Navigate to="/auth" replace />
      } />
      <Route path="/new-group" element={
        isAuthenticated ? <NewGroup /> : <Navigate to="/auth" replace />
      } />
      <Route path="/new-message" element={
        isAuthenticated ? <NewMessage /> : <Navigate to="/auth" replace />
      } />
      <Route path="/new-contact" element={
        isAuthenticated ? <NewContact /> : <Navigate to="/auth" replace />
      } />
      <Route path="/wallet" element={
        isAuthenticated ? <Wallet /> : <Navigate to="/auth" replace />
      } />
      <Route path="/features" element={
        isAuthenticated ? <Features /> : <Navigate to="/auth" replace />
      } />
      <Route path="/add-money" element={
        isAuthenticated ? <AddMoney /> : <Navigate to="/auth" replace />
      } />
      <Route path="/send-money" element={
        isAuthenticated ? <SendMoney /> : <Navigate to="/auth" replace />
      } />
      <Route path="/request-money" element={
        isAuthenticated ? <RequestMoney /> : <Navigate to="/auth" replace />
      } />
      <Route path="/transaction-history" element={
        isAuthenticated ? <TransactionHistory /> : <Navigate to="/auth" replace />
      } />
      <Route path="/transaction-receipt" element={
        isAuthenticated ? <TransactionReceipt /> : <Navigate to="/auth" replace />
      } />
      <Route path="/transaction-detail/:transactionId" element={
        isAuthenticated ? <TransactionDetail /> : <Navigate to="/auth" replace />
      } />
      <Route path="/add-account" element={
        isAuthenticated ? <AddAccount /> : <Navigate to="/auth" replace />
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
            <AuthProvider>
              <CallProvider>
                <AppRoutes />
                <CallOverlay />
                <DevHealthBanner />
              </CallProvider>
            </AuthProvider>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
