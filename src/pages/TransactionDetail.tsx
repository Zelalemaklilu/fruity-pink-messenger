import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Plus, Share, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useParams } from "react-router-dom";
import { transactionStore, type Transaction } from "@/lib/transactionStore";
import { QRCodeSVG } from "qrcode.react";

const TransactionDetail = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  
  // Get transaction from store
  const transaction = transactionId ? transactionStore.getTransaction(transactionId) : undefined;

  if (!transaction) {
    navigate('/wallet');
    return null;
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "sent":
        return <ArrowUpRight className="h-5 w-5" />;
      case "received":
        return <ArrowDownLeft className="h-5 w-5" />;
      case "add_money":
        return <Plus className="h-5 w-5" />;
      case "request":
        return <Receipt className="h-5 w-5" />;
      default:
        return <ArrowUpRight className="h-5 w-5" />;
    }
  };

  const getTransactionTitle = () => {
    switch (transaction.type) {
      case "sent":
        return "Money Sent";
      case "received":
        return "Money Received";
      case "add_money":
        return "Money Added";
      case "request":
        return "Money Requested";
      default:
        return "Transaction";
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

  const handleShare = async () => {
    const shareData = {
      title: `Transaction ${transaction.transactionId}`,
      text: `${getTransactionTitle()}: ${transaction.amount} ETB`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
        alert('Transaction details copied to share!');
      }
    } else {
      alert('Transaction details copied to share!');
    }
  };

  const qrData = JSON.stringify({
    transactionId: transaction.transactionId,
    amount: transaction.amount,
    type: transaction.type,
    timestamp: transaction.timestamp
  });

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
            <h1 className="text-lg font-semibold">Transaction Details</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Transaction Summary */}
      <div className="p-4">
        <Card className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground">
            {getTransactionIcon(transaction.type)}
          </div>
          
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {transaction.amount.toFixed(2)} ETB
          </h2>
          
          <p className="text-muted-foreground mb-4">
            {getTransactionTitle()}
          </p>
          
          <Badge className={`${getStatusColor(transaction.status)} px-3 py-1`}>
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </Badge>
        </Card>
      </div>

      {/* Transaction Details */}
      <div className="px-4 space-y-4">
        <Card className="p-5">
          <h3 className="font-semibold text-foreground mb-4">Transaction Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="text-foreground font-medium">{transaction.transactionId}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Amount</span>
              <span className="text-foreground font-medium">{transaction.amount.toFixed(2)} ETB</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Date & Time</span>
              <span className="text-foreground font-medium">{transaction.timestamp}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Status</span>
              <Badge className={`${getStatusColor(transaction.status)} px-2 py-1 text-xs`}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </Badge>
            </div>
            {transaction.recipient && (
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">
                  {transaction.type === "sent" ? "Sent to" : transaction.type === "request" ? "Requested from" : "From"}
                </span>
                <span className="text-foreground font-medium">{transaction.recipient}</span>
              </div>
            )}
            {transaction.method && (
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Method</span>
                <span className="text-foreground font-medium">{transaction.method}</span>
              </div>
            )}
            {transaction.note && (
              <div className="flex justify-between items-start py-2">
                <span className="text-muted-foreground">Note</span>
                <span className="text-foreground font-medium text-right flex-1 ml-4">{transaction.note}</span>
              </div>
            )}
            <div className="flex justify-between items-start py-2">
              <span className="text-muted-foreground">Description</span>
              <span className="text-foreground font-medium text-right flex-1 ml-4">{transaction.description}</span>
            </div>
          </div>
        </Card>

        {/* QR Code */}
        <Card className="p-5 text-center">
          <h3 className="font-semibold text-foreground mb-4">Transaction QR Code</h3>
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white rounded-lg">
              <QRCodeSVG 
                value={qrData}
                size={150}
                level="M"
                includeMargin={true}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Scan this QR code to verify the transaction
          </p>
        </Card>
      </div>

      {/* Actions */}
      <div className="p-4 pb-8">
        <Button 
          onClick={() => navigate("/wallet")}
          className="w-full h-12 bg-gradient-primary hover:opacity-90"
        >
          Back to Wallet
        </Button>
      </div>
    </div>
  );
};

export default TransactionDetail;