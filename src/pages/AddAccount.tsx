import { useState } from "react";
import { ArrowLeft, Plus, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createAccount } from "@/lib/firestoreService";
import { toast } from "sonner";

const AddAccount = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAddAccount = async () => {
    if (!phoneNumber.trim() || !name.trim()) return;

    const userId = localStorage.getItem('firebaseUserId');
    if (!userId) {
      toast.error("Please login first");
      navigate("/auth");
      return;
    }

    setLoading(true);
    
    try {
      const fullPhoneNumber = `+251${phoneNumber.replace(/\s/g, '')}`;
      
      await createAccount({
        userId,
        name: name.trim(),
        phoneNumber: fullPhoneNumber,
        isActive: false
      });
      
      toast.success(`${name} has been added successfully`);
      navigate("/settings");
    } catch (error) {
      console.error('Error adding account:', error);
      toast.error("Failed to add account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Add Account</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Add New Account
          </h2>
          <p className="text-muted-foreground">
            Enter account details for the new account
          </p>
        </div>

        <div className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Account Name
              </label>
              <Input
                type="text"
                placeholder="Enter account name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Country
              </label>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-border bg-input">
                <span className="text-sm">🇪🇹</span>
                <span className="text-sm text-foreground">Ethiopia</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Phone Number
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-lg">
                  +251
                </span>
                <Input
                  type="tel"
                  placeholder="9 XX XXX XXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="p-6">
        <Button 
          onClick={handleAddAccount}
          disabled={!phoneNumber.trim() || !name.trim() || loading}
          className="w-full h-12 rounded-full bg-gradient-primary hover:opacity-90 transition-smooth shadow-primary"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <User className="h-5 w-5 mr-2" />
              Add Account
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AddAccount;
