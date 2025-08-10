import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Plus, Share, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

interface Transaction {
  id: string;
  type: "sent" | "received" | "topup";
  amount: number;
  description: string;
  timestamp: string;
  status: "completed" | "pending" | "failed";
  recipient?: string;
  method?: string;
  note?: string;
  transactionId: string;
}

const mockTransactions: { [key: string]: Transaction } = {
  "1": {
    id: "1",
    type: "received",
    amount: 250.00,
    description: "From Alex Johnson",
    timestamp: "Today, 2:30 PM",
    status: "completed",
    recipient: "Alex Johnson",
    note: "Payment for lunch",
    transactionId: "TXN1705842600001"
  },
  "2": {
    id: "2",
    type: "sent",
    amount: 150.00,
    description: "To Sarah Williams",
    timestamp: "Today, 1:15 PM", 
    status: "completed",
    recipient: "Sarah Williams",
    note: "Movie tickets",
    transactionId: "TXN1705842600002"
  },
  "3": {
    id: "3",
    type: "topup",
    amount: 500.00,
    description: "Bank Transfer",
    timestamp: "Yesterday, 6:20 PM",
    status: "completed",
    method: "Commercial Bank of Ethiopia",
    transactionId: "TXN1705842600003"
  },
  "4": {
    id: "4",
    type: "sent",
    amount: 75.50,
    description: "To John Smith",
    timestamp: "Yesterday, 3:10 PM",
    status: "pending",
    recipient: "John Smith",
    note: "Coffee payment",
    transactionId: "TXN1705842600004"
  }
};

const TransactionDetail = () => {
  const navigate = useNavigate();
  const { transactionId } = useParams();
  
  const transaction = transactionId ? mockTransactions[transactionId] : null;

  if (!transaction) {
    navigate('/wallet');
    return null;
  }

  const getTransactionIcon = (type: string) => {
    switch(type) {
      case "sent":
        return <ArrowUpRight className="h-6 w-6 text-destructive" />;
      case "received":
        return <ArrowDownLeft className="h-6 w-6 text-green-500" />;
      case "topup":
        return <Plus className="h-6 w-6 text-primary" />;
      default:
        return null;
    }
  };

  const getTransactionTitle = () => {
    switch(transaction.type) {
      case "sent":
        return "Money Sent";
      case "received":
        return "Money Received";
      case "topup":
        return "Money Added";
      default:
        return "Transaction";
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

  const qrData = JSON.stringify({
    transactionId: transaction.transactionId,
    type: transaction.type,
    amount: transaction.amount,
    timestamp: transaction.timestamp,
    app: "Zeshopp Chat"
  });

  const handleShare = () => {
    const shareText = `Transaction: ${transaction.description}\nAmount: ${transaction.amount.toFixed(2)} ETB\nDate: ${transaction.timestamp}\nStatus: ${transaction.status}`;
    navigator.share?.({
      title: "Zeshopp Transaction Details",
      text: shareText
    }) || alert("Transaction details copied to clipboard!");
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
            <h1 className="text-lg font-semibold">Transaction Details</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Transaction Summary */}
      <div className="p-4">
        <Card className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              {getTransactionIcon(transaction.type)}
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              {getTransactionTitle()}
            </h2>
            <p className="text-3xl font-bold mb-2">
              <span className={
                transaction.type === "received" || transaction.type === "topup" 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-foreground"
              }>
                {transaction.type === "received" || transaction.type === "topup" ? "+" : "-"}
                {transaction.amount.toFixed(2)} ETB
              </span>
            </p>
            <Badge className={getStatusColor(transaction.status)}>
              {transaction.status === "completed" ? "Completed" : 
               transaction.status === "pending" ? "Pending" : "Failed"}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Transaction Details */}
      <div className="px-4 mb-6">
        <Card className="p-6">
          <h3 className="font-medium text-foreground mb-4">Details</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="font-mono text-sm text-right">{transaction.transactionId}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Description</span>
              <span className="font-medium text-right">{transaction.description}</span>
            </div>
            
            {transaction.recipient && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {transaction.type === "sent" ? "Sent to" : "Received from"}
                </span>
                <span className="font-medium text-right">{transaction.recipient}</span>
              </div>
            )}
            
            {transaction.method && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium text-right">{transaction.method}</span>
              </div>
            )}
            
            {transaction.note && (
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Note</span>
                <span className="font-medium text-right max-w-[200px]">{transaction.note}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date & Time</span>
              <span className="font-medium text-right">{transaction.timestamp}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge className={getStatusColor(transaction.status)}>
                {transaction.status === "completed" ? "Completed" : 
                 transaction.status === "pending" ? "Pending" : "Failed"}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* QR Code */}
      <div className="px-4 mb-6">
        <Card className="p-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Receipt className="h-5 w-5 text-primary" />
              <h3 className="font-medium text-foreground">Transaction Receipt</h3>
            </div>
            
            <div className="bg-white p-4 rounded-lg inline-block">
              <QRCodeSVG 
                value={qrData}
                size={160}
                level="M"
                includeMargin={true}
              />
            </div>
            
            <p className="text-sm text-muted-foreground mt-4">
              Scan this QR code to verify transaction
            </p>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-6">
        <Button 
          onClick={() => navigate('/wallet')}
          className="w-full bg-gradient-primary hover:opacity-90"
        >
          Back to Wallet
        </Button>
      </div>
    </div>
  );
};

export default TransactionDetail;