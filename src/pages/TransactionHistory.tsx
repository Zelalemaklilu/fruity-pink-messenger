import { useState } from "react";
import { ArrowLeft, Calendar, Filter, ArrowUpRight, ArrowDownLeft, Plus, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
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
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [statusFilter, setStatusFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("all");
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
    let filtered = mockTransactions;
    
    // Filter by type
    if (type !== "all") {
      filtered = filtered.filter(transaction => transaction.type === type);
    }
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(transaction => transaction.status === statusFilter);
    }
    
    // Filter by amount range
    if (amountFilter !== "all") {
      switch(amountFilter) {
        case "low":
          filtered = filtered.filter(transaction => transaction.amount < 100);
          break;
        case "medium":
          filtered = filtered.filter(transaction => transaction.amount >= 100 && transaction.amount < 500);
          break;
        case "high":
          filtered = filtered.filter(transaction => transaction.amount >= 500);
          break;
      }
    }
    
    // Filter by date range
    if (dateFrom || dateTo) {
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        let matchesDateRange = true;
        
        if (dateFrom) {
          matchesDateRange = matchesDateRange && transactionDate >= dateFrom;
        }
        
        if (dateTo) {
          matchesDateRange = matchesDateRange && transactionDate <= dateTo;
        }
        
        return matchesDateRange;
      });
    }
    
    return filtered;
  };

  const getFilteredTransactions = () => {
    return filterTransactions(activeFilter);
  };

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setStatusFilter("all");
    setAmountFilter("all");
    setActiveFilter("all");
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
            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Calendar className="h-5 w-5" />
                  {(dateFrom || dateTo) && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">From Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFrom ? format(dateFrom, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">To Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateTo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateTo ? format(dateTo, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {setDateFrom(undefined); setDateTo(undefined);}}
                    className="w-full"
                  >
                    Clear Date Filter
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Advanced Filters */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Filter className="h-5 w-5" />
                  {(statusFilter !== "all" || amountFilter !== "all") && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Transactions</SheetTitle>
                  <SheetDescription>
                    Filter your transactions by status and amount
                  </SheetDescription>
                </SheetHeader>
                
                <div className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Amount Range</Label>
                    <Select value={amountFilter} onValueChange={setAmountFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select amount range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Amounts</SelectItem>
                        <SelectItem value="low">Under 100 ETB</SelectItem>
                        <SelectItem value="medium">100 - 500 ETB</SelectItem>
                        <SelectItem value="high">Over 500 ETB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <Button onClick={clearFilters} variant="outline" className="w-full">
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
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