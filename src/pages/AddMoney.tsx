import { useState } from "react";
import { ArrowLeft, CreditCard, Building, Phone, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

const AddMoney = () => {
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("card");
  const navigate = useNavigate();

  const methods = [
    { id: "card", name: "Credit/Debit Card", icon: CreditCard },
    { id: "bank", name: "Bank Transfer", icon: Building },
    { id: "mobile", name: "Mobile Money", icon: Phone }
  ];

  const quickAmounts = [100, 250, 500, 1000, 2000, 5000];

  const handleAddMoney = () => {
    if (amount && parseFloat(amount) > 0) {
      alert(`Adding ${amount} ETB to your wallet via ${methods.find(m => m.id === selectedMethod)?.name}`);
      navigate('/wallet');
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
            onClick={() => navigate("/wallet")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Add Money</h1>
        </div>
      </div>

      {/* Amount Input */}
      <div className="p-4">
        <Card className="p-6">
          <div className="text-center mb-6">
            <Label className="text-sm text-muted-foreground">Amount to add</Label>
            <div className="flex items-center justify-center mt-2">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-center text-3xl font-bold border-0 focus-visible:ring-0 bg-transparent"
              />
              <span className="text-3xl font-bold text-muted-foreground ml-2">ETB</span>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {quickAmounts.map((quickAmount) => (
              <Button
                key={quickAmount}
                variant="outline"
                onClick={() => setAmount(quickAmount.toString())}
                className="h-12"
              >
                {quickAmount} ETB
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* Payment Methods */}
      <div className="px-4 mb-6">
        <h3 className="font-medium text-foreground mb-3">Payment Method</h3>
        <div className="space-y-2">
          {methods.map((method) => (
            <Card
              key={method.id}
              className={`p-4 cursor-pointer transition-smooth ${
                selectedMethod === method.id 
                  ? "border-primary bg-primary/5" 
                  : "hover:bg-muted/50"
              }`}
              onClick={() => setSelectedMethod(method.id)}
            >
              <div className="flex items-center space-x-3">
                <method.icon className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">{method.name}</span>
                {selectedMethod === method.id && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Money Button */}
      <div className="p-4">
        <Button 
          onClick={handleAddMoney}
          disabled={!amount || parseFloat(amount) <= 0}
          className="w-full h-12 bg-gradient-primary hover:opacity-90"
        >
          Add {amount ? `${amount} ETB` : 'Money'} to Wallet
        </Button>
      </div>
    </div>
  );
};

export default AddMoney;