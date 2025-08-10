import { useState } from "react";
import { ArrowLeft, Calendar, Filter, ArrowUpRight, ArrowDownLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

interface Transaction {
  id: string;
  type: "sent" | "received" | "topup";
  amount: number;
  description: string;
  timestamp: string;
  status: "completed" | "pending" | "failed";
  date: string;
}

const mockTransactions: Transaction[] = [
  {
    id: "1",
    type: "received",
    amount: 250.00,
    description: "From Alex Johnson",
    timestamp: "Today, 2:30 PM",
    status: "completed",
    date: "2024-01-15"
  },
  {
    id: "2",
    type: "sent",
    amount: 150.00,
    description: "To Sarah Williams",
    timestamp: "Today, 1:15 PM", 
    status: "completed",
    date: "2024-01-15"
  },
  {
    id: "3",
    type: "topup",
    amount: 500.00,
    description: "Bank Transfer",
    timestamp: "Yesterday, 6:20 PM",
    status: "completed",
    date: "2024-01-14"
  },
  {
    id: "4",
    type: "sent",
    amount: 75.50,
    description: "To John Smith",
    timestamp: "Yesterday, 3:10 PM",
    status: "pending",
    date: "2024-01-14"
  },
  {
    id: "5",
    type: "received",
    amount: 300.00,
    description: "From Emma Davis",
    timestamp: "2 days ago, 5:45 PM",
    status: "completed",
    date: "2024-01-13"
  },
  {
    id: "6",
    type: "sent",
    amount: 200.00,
    description: "To Michael Brown",
    timestamp: "3 days ago, 11:20 AM",
    status: "failed",
    date: "2024-01-12"
  }
];

const TransactionHistory = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const navigate = useNavigate();

  const getTransactionIcon = (type: string) => {
    switch(type) {
      case "sent":
        return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      case "received":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case "topup":
        return <Plus className="h-4 w-4 text-primary" />;
      default:
        return null;
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

  const filterTransactions = (type: string) => {
    if (type === "all") return mockTransactions;
    return mockTransactions.filter(transaction => transaction.type === type);
  };

  const getFilteredTransactions = () => {
    return filterTransactions(activeFilter);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/wallet")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Transaction History</h1>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon">
              <Calendar className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Filter className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 pt-4">
        <Tabs value={activeFilter} onValueChange={setActiveFilter}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="received">Received</TabsTrigger>
            <TabsTrigger value="topup">Top Up</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Transactions List */}
      <div className="p-4 space-y-3">
        {getFilteredTransactions().map((transaction) => (
          <Card 
            key={transaction.id} 
            className="p-4 hover:bg-muted/50 transition-smooth cursor-pointer"
            onClick={() => navigate(`/transaction-detail/${transaction.id}`)}
          >
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

        {getFilteredTransactions().length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;