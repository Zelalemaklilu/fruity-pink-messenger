import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const NewContact = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/new-message");
  };

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
          <h1 className="text-lg font-semibold">Add Contact</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-4xl">👋</span>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Find People by Username
            </h2>
            <p className="text-muted-foreground">
              Zeshopp uses usernames instead of phone numbers for privacy. 
              Search for someone's @username to start chatting with them.
            </p>
          </div>
          
          <Button
            onClick={() => navigate("/new-message")}
            className="w-full h-12 bg-gradient-primary hover:opacity-90"
          >
            Search for Users
          </Button>
          
          <p className="text-xs text-muted-foreground">
            Tip: Ask your friends for their Zeshopp username!
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewContact;
