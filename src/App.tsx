import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Splash from "./pages/Splash";
import Auth from "./pages/Auth";
import OTP from "./pages/OTP";
import EmailVerification from "./pages/EmailVerification";
import ForgotPassword from "./pages/ForgotPassword";
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
import NotFound from "./pages/NotFound";
import { subscribeToAuthState } from "./lib/firebaseAuth";
import { getAccountsByoderId, createAccount } from "./lib/firestoreService";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const [isReady, setIsReady] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsReady(true);
    
    // GLOBAL SELF-HEALING: Listen for auth state and auto-create missing profiles
    const unsubscribe = subscribeToAuthState((user) => {
      if (user && user.emailVerified) {
        // Defer Firestore call to prevent deadlock
        setTimeout(async () => {
          try {
            const existingAccounts = await getAccountsByoderId(user.uid);
            
            if (existingAccounts.length === 0) {
              console.log("App.tsx Self-healing: Creating missing profile for:", user.uid);
              
              const emailPrefix = user.email?.split('@')[0] || 'user';
              const baseUsername = emailPrefix.toLowerCase().replace(/[^a-z0-9]/g, '');
              const randomSuffix = Math.floor(1000 + Math.random() * 9000);
              const uniqueUsername = `${baseUsername}${randomSuffix}`;
              
              await createAccount({
                oderId: user.uid,
                username: uniqueUsername,
                email: user.email || '',
                name: `User ${emailPrefix}`,
                phoneNumber: user.email || '',
                isActive: true
              });
              
              console.log("App.tsx Self-healing: Profile created with username:", uniqueUsername);
            }
          } catch (error) {
            console.error("App.tsx Self-healing failed (non-blocking):", error);
          }
        }, 0);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const isAuthenticated =
    typeof window !== "undefined" && !!localStorage.getItem("authToken");

  if (!isReady) {
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
    <Routes location={location}>
      <Route path="/" element={
        isAuthenticated ? <Navigate to="/chats" replace /> : <Splash />
      } />
      <Route path="/auth" element={
        isAuthenticated ? <Navigate to="/chats" replace /> : <Auth />
      } />
      <Route path="/otp" element={
        isAuthenticated ? <Navigate to="/chats" replace /> : <OTP />
      } />
      <Route path="/email-verification" element={
        isAuthenticated ? <Navigate to="/chats" replace /> : <EmailVerification />
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
            <AppRoutes />
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
