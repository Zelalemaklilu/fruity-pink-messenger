import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft, Eye, EyeOff, Shield, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { walletService, type WalletData, type WalletTransaction } from "@/lib/walletService";
import WalletTerms from "@/components/WalletTerms";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const Wallet = () => {
  const [showBalance, setShowBalance] = useState(true);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [stats, setStats] = useState({ monthly_received: 0, monthly_sent: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [needsActivation, setNeedsActivation] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const navigate = useNavigate();

  const loadWalletData = useCallback(async (forceRefresh = false) => {
    try {
      const data = await walletService.getWalletBalance(forceRefresh);
      setWallet(data.wallet);
      setTransactions((data.transactions || []).slice(0, 5));
      setStats(data.stats || { monthly_received: 0, monthly_sent: 0 });
      setNeedsActivation(data.needs_activation || !data.wallet);
    } catch (error) {
      console.error("Failed to load wallet:", error);
      toast.error("Failed to load wallet data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  useEffect(() => {
    const handleFocus = () => {
      loadWalletData(true);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadWalletData]);

  const handleAddMoney = () => {
    if (needsActivation) { setShowTerms(true); return; }
    navigate('/add-money');
  };

  const handleSendMoney = () => {
    if (needsActivation) { setShowTerms(true); return; }
    navigate('/send-money');
  };

  const handleRequestMoney = () => {
    if (needsActivation) { setShowTerms(true); return; }
    navigate('/request-money');
  };

  const handleViewHistory = () => navigate('/transaction-history');

  const handleTermsAccepted = () => {
    setShowTerms(false);
    setNeedsActivation(false);
    loadWalletData(true);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "transfer_in":
      case "deposit":
        return <ArrowDownLeft className="h-5 w-5 text-status-online" />;
      case "transfer_out":
      case "withdrawal":
        return <ArrowUpRight className="h-5 w-5 text-status-offline" />;
      default:
        return <WalletIcon className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-status-online text-white";
      case "pending": return "bg-status-away text-white";
      case "failed":
      case "reversed": return "bg-status-offline text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatTransactionType = (type: string) => {
    switch (type) {
      case "transfer_in": return "Received";
      case "transfer_out": return "Sent";
      case "deposit": return "Added Money";
      case "withdrawal": return "Withdrawal";
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  if (showTerms) {
    return (
      <WalletTerms 
        onAccepted={handleTermsAccepted}
        onCancel={() => setShowTerms(false)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <Loader2 className="h-8 w-8 mx-auto text-primary" />
          </motion.div>
          <p className="mt-3 text-muted-foreground">Loading wallet...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4 z-10"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button variant="ghost" size="icon" onClick={() => navigate("/chats")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </motion.div>
            <div>
              <h1 className="text-lg font-semibold">Wallet</h1>
              {wallet?.status === 'active' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-1"
                >
                  <Shield className="h-3 w-3 text-status-online" />
                  <span className="text-xs text-status-online">Verified</span>
                </motion.div>
              )}
            </div>
          </div>
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button variant="ghost" size="icon" onClick={() => loadWalletData(true)}>
              <RefreshCw className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Activation Banner */}
      <AnimatePresence>
        {needsActivation && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4"
          >
            <motion.div whileTap={{ scale: 0.98 }}>
              <Card 
                className="p-4 bg-primary/10 border-primary/20 cursor-pointer hover:bg-primary/15 transition-colors"
                onClick={() => setShowTerms(true)}
              >
                <div className="flex items-center space-x-3">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"
                  >
                    <Shield className="h-5 w-5 text-primary" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">Activate Your Wallet</h3>
                    <p className="text-sm text-muted-foreground">
                      Accept terms to start using real money features
                    </p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-primary" />
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="p-4"
      >
        <Card className="p-6 bg-gradient-primary text-primary-foreground relative overflow-hidden">
          {/* Background decorations */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"
          />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-primary-foreground/80 text-sm">
                  {needsActivation ? "Available After Activation" : "Total Balance"}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <AnimatePresence mode="wait">
                    {showBalance ? (
                      <motion.h2
                        key="balance"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-3xl font-bold"
                      >
                        {needsActivation ? "0.00" : (wallet?.balance ?? 0).toFixed(2)} ETB
                      </motion.h2>
                    ) : (
                      <motion.h2
                        key="hidden"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-3xl font-bold"
                      >
                        ••••••
                      </motion.h2>
                    )}
                  </AnimatePresence>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary-foreground hover:bg-white/10"
                    onClick={() => setShowBalance(!showBalance)}
                  >
                    {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </div>
                {wallet?.currency && (
                  <p className="text-xs text-primary-foreground/60 mt-1">
                    Currency: {wallet.currency}
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Add", icon: Plus, onClick: handleAddMoney },
                { label: "Send", icon: ArrowUpRight, onClick: handleSendMoney },
                { label: "Request", icon: ArrowDownLeft, onClick: handleRequestMoney },
              ].map((action, i) => (
                <motion.div key={action.label} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outline" 
                    className="bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20 h-12 w-full"
                    onClick={action.onClick}
                  >
                    <action.icon className="h-4 w-4 mr-2" />
                    {action.label}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Quick Stats */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-4">
          {[
            { value: `+${stats.monthly_received.toFixed(2)}`, label: "This Month Received", color: "text-status-online" },
            { value: `-${stats.monthly_sent.toFixed(2)}`, label: "This Month Sent", color: "text-status-offline" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <Card className="p-4 text-center">
                <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-foreground">Recent Transactions</h3>
          <Button 
            variant="ghost" size="sm" onClick={handleViewHistory}
            className="text-primary hover:text-primary/80"
          >
            View All
          </Button>
        </div>
        
        <div className="space-y-2">
          {transactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.08 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/transaction-detail/${transaction.id}`)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {getTransactionIcon(transaction.transaction_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground truncate">
                        {transaction.description || formatTransactionType(transaction.transaction_type)}
                      </h4>
                      <span className={`font-medium ${
                        transaction.transaction_type === 'transfer_in' || transaction.transaction_type === 'deposit'
                          ? 'text-status-online' : 'text-status-offline'
                      }`}>
                        {transaction.transaction_type === 'transfer_in' || transaction.transaction_type === 'deposit' ? '+' : '-'}
                        {transaction.amount.toFixed(2)} ETB
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-muted-foreground">
                        {formatDate(transaction.created_at)}
                      </p>
                      <Badge className={`${getStatusColor(transaction.status)} px-2 py-1 text-xs`}>
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
          
          {transactions.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="p-8 text-center">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                >
                  <WalletIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                </motion.div>
                <h3 className="font-medium text-foreground mb-2">No transactions yet</h3>
                <p className="text-sm text-muted-foreground">
                  {needsActivation 
                    ? "Activate your wallet to start making transactions."
                    : "Start by adding money to your wallet or sending money to someone."}
                </p>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;