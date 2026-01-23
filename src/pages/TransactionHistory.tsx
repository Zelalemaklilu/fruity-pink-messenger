import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Filter, ArrowUpRight, ArrowDownLeft, Plus, CalendarIcon, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { walletService, type WalletTransaction } from "@/lib/walletService";
import { toast } from "sonner";

const TransactionHistory = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [statusFilter, setStatusFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("all");
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const loadTransactions = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setIsRefreshing(true);
      }
      const data = await walletService.getWalletBalance(forceRefresh);
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error("Failed to load transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const getTransactionIcon = (type: string) => {
    switch(type) {
      case "transfer_out":
        return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      case "transfer_in":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case "deposit":
        return <Plus className="h-4 w-4 text-primary" />;
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-orange-500" />;
      default:
        return <ArrowUpRight className="h-4 w-4" />;
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
      case "reversed":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const mapTypeToFilter = (type: string): string => {
    switch(type) {
      case "transfer_out":
        return "sent";
      case "transfer_in":
        return "received";
      case "deposit":
        return "topup";
      default:
        return "other";
    }
  };

  const getTransactionDescription = (tx: WalletTransaction): string => {
    if (tx.description) return tx.description;
    
    switch(tx.transaction_type) {
      case "transfer_out":
        return "Money Sent";
      case "transfer_in":
        return "Money Received";
      case "deposit":
        return "Deposit";
      case "withdrawal":
        return "Withdrawal";
      default:
        return "Transaction";
    }
  };

  const formatTimestamp = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // If less than 24 hours, show relative time
    if (diff < 24 * 60 * 60 * 1000) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    
    // Otherwise show formatted date
    return format(date, "MMM d, h:mm a");
  };

  const filterTransactions = () => {
    let filtered = [...transactions];
    
    // Filter by type
    if (activeFilter !== "all") {
      filtered = filtered.filter(tx => {
        const mappedType = mapTypeToFilter(tx.transaction_type);
        return mappedType === activeFilter;
      });
    }
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }
    
    // Filter by amount range
    if (amountFilter !== "all") {
      switch(amountFilter) {
        case "low":
          filtered = filtered.filter(tx => tx.amount < 100);
          break;
        case "medium":
          filtered = filtered.filter(tx => tx.amount >= 100 && tx.amount < 500);
          break;
        case "high":
          filtered = filtered.filter(tx => tx.amount >= 500);
          break;
      }
    }
    
    // Filter by date range
    if (dateFrom || dateTo) {
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.created_at);
        let matchesDateRange = true;
        
        if (dateFrom) {
          matchesDateRange = matchesDateRange && txDate >= dateFrom;
        }
        
        if (dateTo) {
          const endOfDay = new Date(dateTo);
          endOfDay.setHours(23, 59, 59, 999);
          matchesDateRange = matchesDateRange && txDate <= endOfDay;
        }
        
        return matchesDateRange;
      });
    }
    
    return filtered;
  };

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setStatusFilter("all");
    setAmountFilter("all");
    setActiveFilter("all");
  };

  const filteredTransactions = filterTransactions();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4 z-10">
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
            {/* Refresh Button */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => loadTransactions(true)}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>

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
                        <SelectItem value="reversed">Reversed</SelectItem>
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
            <TabsTrigger value="topup">Deposit</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Transactions List */}
      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <Card 
              key={tx.id} 
              className="p-4 hover:bg-muted/50 transition-smooth cursor-pointer"
              onClick={() => navigate(`/transaction-detail/${tx.id}`)}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-muted">
                  {getTransactionIcon(tx.transaction_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground truncate">
                      {getTransactionDescription(tx)}
                    </h4>
                    <div className="text-right">
                      <p className={`font-medium ${
                        tx.transaction_type === "transfer_in" || tx.transaction_type === "deposit" 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-foreground"
                      }`}>
                        {tx.transaction_type === "transfer_in" || tx.transaction_type === "deposit" ? "+" : "-"}
                        {tx.amount.toFixed(2)} ETB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-muted-foreground">
                      {formatTimestamp(tx.created_at)}
                    </p>
                    <Badge className={getStatusColor(tx.status)}>
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
