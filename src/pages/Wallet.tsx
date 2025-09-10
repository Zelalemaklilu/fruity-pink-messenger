import { useState, useEffect } from "react";
import { ArrowLeft, Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { transactionStore, type Transaction } from "@/lib/transactionStore";

const Wallet = () => {
  const [showBalance, setShowBalance] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load recent transactions
    const recentTransactions = transactionStore.getRecentTransactions(5);
    setTransactions(recentTransactions);
  }, []);

  // Refresh transactions when component comes back into focus
  useEffect(() => {
    const handleFocus = () => {
      const recentTransactions = transactionStore.getRecentTransactions(5);
      setTransactions(recentTransactions);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const balance = 2750.50;

  const handleAddMoney = () => {
    navigate('/add-money');
  };

  const handleSendMoney = () => {
    navigate('/send-money');
  };

  const handleRequestMoney = () => {
    navigate('/request-money');
  };

  const handleViewHistory = () => {
    navigate('/transaction-history');
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "received":
        return <ArrowDownLeft className="h-5 w-5 text-status-online" />;
      case "sent":
        return <ArrowUpRight className="h-5 w-5 text-status-offline" />;
      case "add_money":
        return <Plus className="h-5 w-5 text-primary" />;
      case "request":
        return <WalletIcon className="h-5 w-5 text-status-away" />;
      default:
        return <WalletIcon className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-status-online text-white";
      case "pending":
        return "bg-status-away text-white";
      case "failed":
        return "bg-status-offline text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/chats")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Wallet</h1>
          </div>
          <Button variant="ghost" size="icon">
            <WalletIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="p-4">
        <Card className="p-6 bg-gradient-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-primary-foreground/80 text-sm">Total Balance</p>
                <div className="flex items-center space-x-2 mt-1">
                  {showBalance ? (
                    <h2 className="text-3xl font-bold">{balance.toFixed(2)} ETB</h2>
                  ) : (
                    <h2 className="text-3xl font-bold">••••••</h2>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary-foreground hover:bg-white/10"
                    onClick={() => setShowBalance(!showBalance)}
                  >
                    {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20 h-12"
                onClick={handleAddMoney}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20 h-12"
                onClick={handleSendMoney}
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Send
              </Button>
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20 h-12"
                onClick={handleRequestMoney}
              >
                <ArrowDownLeft className="h-4 w-4 mr-2" />
                Request
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-status-online mb-1">
              +{transactions.filter(t => t.type === 'received').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">This Month Received</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-status-offline mb-1">
              -{transactions.filter(t => t.type === 'sent').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">This Month Sent</div>
          </Card>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-foreground">Recent Transactions</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleViewHistory}
            className="text-primary hover:text-primary/80"
          >
            View All
          </Button>
        </div>
        
        <div className="space-y-2">
          {transactions.map((transaction) => (
            <Card 
              key={transaction.id} 
              className="p-4 cursor-pointer hover:bg-muted/50 transition-smooth"
              onClick={() => navigate(`/transaction-detail/${transaction.id}`)}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  {getTransactionIcon(transaction.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground truncate">
                      {transaction.description}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${
                        transaction.type === 'received' || transaction.type === 'add_money' 
                          ? 'text-status-online' 
                          : 'text-status-offline'
                      }`}>
                        {transaction.type === 'received' || transaction.type === 'add_money' ? '+' : '-'}
                        {transaction.amount.toFixed(2)} ETB
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-muted-foreground">
                      {transaction.timestamp}
                    </p>
                    <Badge className={`${getStatusColor(transaction.status)} px-2 py-1 text-xs`}>
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          {transactions.length === 0 && (
            <Card className="p-8 text-center">
              <WalletIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium text-foreground mb-2">No transactions yet</h3>
              <p className="text-sm text-muted-foreground">
                Start by adding money to your wallet or sending money to someone.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;