import { ArrowLeft, Download, Share, Check, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

interface TransactionData {
  type: "add-money" | "send-money" | "request-money";
  amount: string;
  recipient?: string;
  method?: string;
  transactionId: string;
  timestamp: string;
  status: "completed" | "pending";
}

const TransactionReceipt = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const transactionData = location.state as TransactionData;

  if (!transactionData) {
    navigate('/wallet');
    return null;
  }

  const getTransactionTitle = () => {
    switch(transactionData.type) {
      case "add-money":
        return "Money Added Successfully";
      case "send-money":
        return "Money Sent Successfully";
      case "request-money":
        return "Money Request Sent";
      default:
        return "Transaction Completed";
    }
  };

  const getTransactionDescription = () => {
    switch(transactionData.type) {
      case "add-money":
        return `${transactionData.amount} ETB added to your wallet via ${transactionData.method}`;
      case "send-money":
        return `${transactionData.amount} ETB sent to ${transactionData.recipient}`;
      case "request-money":
        return `Request for ${transactionData.amount} ETB sent to ${transactionData.recipient}`;
      default:
        return "Transaction completed successfully";
    }
  };

  const qrData = JSON.stringify({
    transactionId: transactionData.transactionId,
    type: transactionData.type,
    amount: transactionData.amount,
    timestamp: transactionData.timestamp,
    app: "Zeshopp Chat"
  });

  const handleShare = () => {
    navigator.share?.({
      title: "Zeshopp Transaction Receipt",
      text: getTransactionDescription(),
      url: window.location.href
    }) || alert("Receipt details copied to clipboard!");
  };

  const handleDownload = () => {
    alert("Receipt downloaded to your device!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/wallet")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Transaction Receipt</h1>
        </div>
      </div>

      {/* Success Message */}
      <div className="p-4">
        <Card className="p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            {getTransactionTitle()}
          </h2>
          <p className="text-muted-foreground mb-4">
            {getTransactionDescription()}
          </p>
          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
            {transactionData.status === "completed" ? "Completed" : "Pending"}
          </Badge>
        </Card>
      </div>

      {/* Transaction Details */}
      <div className="px-4 mb-6">
        <Card className="p-6">
          <h3 className="font-medium text-foreground mb-4">Transaction Details</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="font-mono text-sm">{transactionData.transactionId}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-bold text-lg">{transactionData.amount} ETB</span>
            </div>
            
            {transactionData.recipient && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {transactionData.type === "request-money" ? "Requested from" : "Sent to"}
                </span>
                <span className="font-medium">{transactionData.recipient}</span>
              </div>
            )}
            
            {transactionData.method && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium">{transactionData.method}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date & Time</span>
              <span className="font-medium">{transactionData.timestamp}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge className={
                transactionData.status === "completed" 
                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                  : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
              }>
                {transactionData.status === "completed" ? "Completed" : "Pending"}
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
              <QrCode className="h-5 w-5 text-primary" />
              <h3 className="font-medium text-foreground">Transaction QR Code</h3>
            </div>
            
            <div className="bg-white p-4 rounded-lg inline-block">
              <QRCodeSVG 
                value={qrData}
                size={200}
                level="M"
                includeMargin={true}
              />
            </div>
            
            <p className="text-sm text-muted-foreground mt-4">
              Scan this QR code to verify transaction details
            </p>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            onClick={handleShare}
            className="flex items-center justify-center"
          >
            <Share className="h-4 w-4 mr-2" />
            Share Receipt
          </Button>
          <Button 
            variant="outline"
            onClick={handleDownload}
            className="flex items-center justify-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
        
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

export default TransactionReceipt;