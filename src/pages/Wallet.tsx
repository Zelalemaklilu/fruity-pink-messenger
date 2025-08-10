import { useState } from "react";
import { ArrowLeft, Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface Transaction {
  id: string;
  type: "sent" | "received" | "topup";
  amount: number;
  description: string;
  timestamp: string;
  status: "completed" | "pending" | "failed";
}

const mockTransactions: Transaction[] = [
  {
    id: "1",
    type: "received",
    amount: 250.00,
    description: "From Alex Johnson",
    timestamp: "Today, 2:30 PM",
    status: "completed"
  },
  {
    id: "2",
    type: "sent",
    amount: 150.00,
    description: "To Sarah Williams",
    timestamp: "Today, 1:15 PM", 
    status: "completed"
  },
  {
    id: "3",
    type: "topup",
    amount: 500.00,
    description: "Bank Transfer",
    timestamp: "Yesterday, 6:20 PM",
    status: "completed"
  },
  {
    id: "4",
    type: "sent",
    amount: 75.50,
    description: "To John Smith",
    timestamp: "Yesterday, 3:10 PM",
    status: "pending"
  }
];

const Wallet = () => {
  const [showBalance, setShowBalance] = useState(true);
  const navigate = useNavigate();
  const balance = 1250.75;

  const getTransactionIcon = (type: string) => {
    switch(type) {
      case "sent":
        return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      case "received":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case "topup":
        return <Plus className="h-4 w-4 text-primary" />;
      default:
        return <WalletIcon className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "completed":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "failed":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/settings")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <WalletIcon className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Wallet</h1>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="p-4">
        <Card className="p-6 bg-gradient-primary text-primary-foreground">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-primary-foreground/80 text-sm">Available Balance</p>
              <div className="flex items-center space-x-2">
                <h2 className="text-3xl font-bold">
                  {showBalance ? `${balance.toFixed(2)} ETB` : "•••••••"}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={() => setShowBalance(!showBalance)}
                >
                  {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <WalletIcon className="h-8 w-8 text-primary-foreground/60" />
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="secondary" 
              className="flex-1 bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              Top Up
            </Button>
            <Button 
              variant="secondary"
              className="flex-1 bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20"
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-4 gap-3">
          <Button variant="ghost" className="flex-col h-auto py-4">
            <Plus className="h-6 w-6 mb-2" />
            <span className="text-xs">Add Money</span>
          </Button>
          <Button variant="ghost" className="flex-col h-auto py-4">
            <ArrowUpRight className="h-6 w-6 mb-2" />
            <span className="text-xs">Send</span>
          </Button>
          <Button variant="ghost" className="flex-col h-auto py-4">
            <ArrowDownLeft className="h-6 w-6 mb-2" />
            <span className="text-xs">Request</span>
          </Button>
          <Button variant="ghost" className="flex-col h-auto py-4">
            <WalletIcon className="h-6 w-6 mb-2" />
            <span className="text-xs">History</span>
          </Button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-4">
        <h3 className="font-medium text-foreground mb-3">Recent Transactions</h3>
        <div className="space-y-2">
          {mockTransactions.map((transaction) => (
            <Card key={transaction.id} className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-muted">
                  {getTransactionIcon(transaction.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground truncate">
                      {transaction.description}
                    </h4>
                    <div className="text-right">
                      <p className={`font-medium ${
                        transaction.type === "received" || transaction.type === "topup" 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-foreground"
                      }`}>
                        {transaction.type === "received" || transaction.type === "topup" ? "+" : "-"}
                        {transaction.amount.toFixed(2)} ETB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-muted-foreground">
                      {transaction.timestamp}
                    </p>
                    <Badge className={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wallet;