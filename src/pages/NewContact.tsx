import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const NewContact = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleBack = () => {
    navigate("/new-message");
  };

  const handleCreateContact = () => {
    if (!firstName.trim()) {
      toast({
        title: "Error",
        description: "First name is required",
        variant: "destructive",
      });
      return;
    }

    if (!phoneNumber.trim()) {
      toast({
        title: "Error", 
        description: "Phone number is required",
        variant: "destructive",
      });
      return;
    }

    // Here you would typically save the contact
    toast({
      title: "Contact Created",
      description: `${firstName} ${lastName} has been added to your contacts`,
    });
    
    navigate("/new-message");
  };

  const isFormValid = firstName.trim() && phoneNumber.trim();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4 z-10">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">New Contact</h1>
        </div>
      </div>

      {/* Form */}
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium text-primary">
              First name (required)
            </Label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="h-12 rounded-lg border-2 border-primary/20 focus:border-primary"
              placeholder="Enter first name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium text-muted-foreground">
              Last name (optional)
            </Label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="h-12 rounded-lg"
              placeholder="Enter last name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-sm font-medium text-muted-foreground">
              Phone number
            </Label>
            <div className="flex">
              <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-lg">
                <img 
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 3 2'%3E%3Crect width='3' height='2' fill='%23009639'/%3E%3Crect y='1' width='3' height='1' fill='%23FFDE00'/%3E%3Crect y='1.5' width='3' height='0.5' fill='%23DA020E'/%3E%3C/svg%3E" 
                  alt="Ethiopia" 
                  className="w-5 h-3 mr-2"
                />
                <span className="text-sm font-medium">+251</span>
              </div>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-12 rounded-l-none"
                placeholder="00 000 0000"
              />
            </div>
          </div>
        </div>

        <Button
          onClick={handleCreateContact}
          disabled={!isFormValid}
          className={`w-full h-12 rounded-lg font-semibold transition-smooth ${
            isFormValid 
              ? "bg-gradient-primary hover:opacity-90" 
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          Create Contact
        </Button>
      </div>
    </div>
  );
};

export default NewContact;