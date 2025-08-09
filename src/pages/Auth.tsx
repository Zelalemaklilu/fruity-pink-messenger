import { useState } from "react";
import { ArrowLeft, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [syncContacts, setSyncContacts] = useState(true);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (phoneNumber.trim()) {
      navigate("/otp");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Your phone number
          </h1>
          <p className="text-muted-foreground">
            Please confirm your country code and enter your phone number.
          </p>
        </div>

        <div className="space-y-4">
          <Card className="p-4 space-y-4">
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

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="sync" 
              checked={syncContacts}
              onCheckedChange={(checked) => setSyncContacts(checked === true)}
            />
            <label htmlFor="sync" className="text-sm text-muted-foreground">
              Sync Contacts
            </label>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Button 
          onClick={handleContinue}
          disabled={!phoneNumber.trim()}
          className="w-full h-12 rounded-full bg-gradient-primary hover:opacity-90 transition-smooth shadow-primary"
        >
          <Phone className="h-5 w-5 mr-2" />
          Continue
        </Button>
      </div>
    </div>
  );
};

export default Auth;