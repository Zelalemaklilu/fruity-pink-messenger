import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wallet, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { walletService } from "@/lib/walletService";
import { toast } from "sonner";

interface WalletTermsProps {
  onAccepted: () => void;
  onCancel: () => void;
}

const TERMS_VERSION = "1.0.0";

const WALLET_TERMS = [
  {
    title: "1. Wallet Nature",
    content: "This wallet represents real monetary value. All balances and transactions are final once confirmed.",
    icon: Wallet,
  },
  {
    title: "2. Transaction Finality",
    content: "All completed transactions are irreversible. Sent funds cannot be recalled.",
    icon: AlertTriangle,
  },
  {
    title: "3. Balance Accuracy",
    content: "Wallet balances are calculated from verified transaction records. The displayed balance reflects actual available funds.",
    icon: CheckCircle,
  },
  {
    title: "4. User Responsibility",
    content: "The user is fully responsible for verifying recipient details before sending funds.",
    icon: Shield,
  },
  {
    title: "5. No Unauthorized Access",
    content: "Users may only access and operate their own wallet. Any attempt to bypass security will result in suspension.",
    icon: Shield,
  },
  {
    title: "6. Insufficient Balance",
    content: "Transactions will fail automatically if the wallet balance is insufficient.",
    icon: AlertTriangle,
  },
  {
    title: "7. Security & Monitoring",
    content: "All wallet activity is logged and monitored to prevent fraud, abuse, or manipulation.",
    icon: Shield,
  },
  {
    title: "8. Service Availability",
    content: "Temporary interruptions may occur due to maintenance or security updates.",
    icon: AlertTriangle,
  },
  {
    title: "9. Compliance & Suspension",
    content: "Wallet access may be restricted if suspicious or illegal activity is detected.",
    icon: Shield,
  },
  {
    title: "10. Acceptance",
    content: "By activating the wallet, the user confirms they have read, understood, and agreed to all wallet rules and responsibilities.",
    icon: CheckCircle,
  },
];

export const WalletTerms = ({ onAccepted, onCancel }: WalletTermsProps) => {
  const [accepted, setAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleActivateWallet = async () => {
    if (!accepted) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    setIsLoading(true);
    try {
      const result = await walletService.activateWallet();
      
      if (result.success) {
        toast.success("Wallet activated successfully!");
        onAccepted();
      } else {
        toast.error(result.error || "Failed to activate wallet");
      }
    } catch (error) {
      console.error("Wallet activation error:", error);
      toast.error("Failed to activate wallet. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Wallet Activation</h1>
            <p className="text-sm text-muted-foreground">Terms & Conditions v{TERMS_VERSION}</p>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="p-4">
        <Card className="p-4 bg-amber-500/10 border-amber-500/20">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-600 dark:text-amber-400">Important Notice</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This is a <strong>REAL MONEY</strong> wallet. Please read all terms carefully before activating. 
                All transactions are final and cannot be reversed.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Terms List */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-3 pb-4">
          {WALLET_TERMS.map((term, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <term.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{term.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{term.content}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Accept Section */}
      <div className="sticky bottom-0 bg-background border-t border-border p-4 space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="terms"
            checked={accepted}
            onCheckedChange={(checked) => setAccepted(checked === true)}
            className="mt-1"
          />
          <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
            I have read, understood, and agree to all wallet terms and conditions. 
            I understand that this wallet handles <strong>real money</strong> and all transactions are <strong>final</strong>.
          </label>
        </div>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleActivateWallet}
            disabled={!accepted || isLoading}
            className="flex-1 bg-gradient-primary"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Activating...</span>
              </div>
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-2" />
                Activate Wallet
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WalletTerms;
