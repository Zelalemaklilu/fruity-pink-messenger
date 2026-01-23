import { useState, useEffect } from "react";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Plus, Share, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useParams } from "react-router-dom";
import { walletService, type WalletTransaction } from "@/lib/walletService";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";

const TransactionDetail = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<WalletTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTransaction = async () => {
      if (!transactionId) {
        navigate('/wallet');
        return;
      }

      try {
        // First check cached transactions
        const cached = walletService.getCachedTransactions();
        let tx = cached.find(t => t.id === transactionId);

        if (!tx) {
          // Fetch fresh data if not in cache
          const data = await walletService.getWalletBalance(true);
          tx = data.transactions.find(t => t.id === transactionId);
        }

        if (tx) {
          setTransaction(tx);
        } else {
          navigate('/wallet');
        }
      } catch (error) {
        console.error("Failed to load transaction:", error);
        navigate('/wallet');
      } finally {
        setIsLoading(false);
      }
    };

    loadTransaction();
  }, [transactionId, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!transaction) {
    return null;
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "transfer_out":
        return <ArrowUpRight className="h-5 w-5" />;
      case "transfer_in":
        return <ArrowDownLeft className="h-5 w-5" />;
      case "deposit":
        return <Plus className="h-5 w-5" />;
      case "withdrawal":
        return <ArrowUpRight className="h-5 w-5" />;
      default:
        return <ArrowUpRight className="h-5 w-5" />;
    }
  };

  const getTransactionTitle = () => {
    switch (transaction.transaction_type) {
      case "transfer_out":
        return "Money Sent";
      case "transfer_in":
        return "Money Received";
      case "deposit":
        return "Money Deposited";
      case "withdrawal":
        return "Money Withdrawn";
      case "adjustment":
        return "Balance Adjustment";
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
      case "reversed":
        return "bg-orange-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Transaction ${transaction.reference_id || transaction.id}`,
      text: `${getTransactionTitle()}: ${transaction.amount.toFixed(2)} ETB`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(
        `${getTransactionTitle()}: ${transaction.amount.toFixed(2)} ETB\nRef: ${transaction.reference_id || transaction.id}`
      );
    }
  };

  const qrData = JSON.stringify({
    transactionId: transaction.id,
    referenceId: transaction.reference_id,
    amount: transaction.amount,
    type: transaction.transaction_type,
    timestamp: transaction.created_at,
    status: transaction.status
  });

  // Parse metadata for additional info
  const metadata = transaction.metadata as Record<string, unknown> || {};

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
            {getTransactionIcon(transaction.transaction_type)}
          </div>
          
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {transaction.transaction_type === "transfer_in" || transaction.transaction_type === "deposit" ? "+" : "-"}
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
            {transaction.reference_id && (
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Reference ID</span>
                <span className="text-foreground font-medium text-sm">{transaction.reference_id}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="text-foreground font-medium text-xs truncate max-w-[200px]">{transaction.id}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Amount</span>
              <span className="text-foreground font-medium">{transaction.amount.toFixed(2)} ETB</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Date & Time</span>
              <span className="text-foreground font-medium">
                {format(new Date(transaction.created_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Status</span>
              <Badge className={`${getStatusColor(transaction.status)} px-2 py-1 text-xs`}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Balance Before</span>
              <span className="text-foreground font-medium">{transaction.balance_before.toFixed(2)} ETB</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Balance After</span>
              <span className="text-foreground font-medium">{transaction.balance_after.toFixed(2)} ETB</span>
            </div>
            {transaction.description && (
              <div className="flex justify-between items-start py-2">
                <span className="text-muted-foreground">Description</span>
                <span className="text-foreground font-medium text-right flex-1 ml-4">{transaction.description}</span>
              </div>
            )}
            {metadata.note && (
              <div className="flex justify-between items-start py-2">
                <span className="text-muted-foreground">Note</span>
                <span className="text-foreground font-medium text-right flex-1 ml-4">{String(metadata.note)}</span>
              </div>
            )}
            {metadata.method && (
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Method</span>
                <span className="text-foreground font-medium">{String(metadata.method)}</span>
              </div>
            )}
            {metadata.recipient_name && (
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Recipient</span>
                <span className="text-foreground font-medium">{String(metadata.recipient_name)}</span>
              </div>
            )}
            {metadata.sender_name && (
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">From</span>
                <span className="text-foreground font-medium">{String(metadata.sender_name)}</span>
              </div>
            )}
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
