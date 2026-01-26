import { useState, useEffect } from "react";
import { ArrowLeft, Search, ArrowDownLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  username: string;
  avatar_url?: string;
  is_online?: boolean;
}

const RequestMoney = () => {
  const [amount, setAmount] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [reason, setReason] = useState("");
  const navigate = useNavigate();

  // Search users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setContacts([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase.rpc('search_users_public', {
          search_term: searchQuery
        });

        if (error) throw error;

        const mappedContacts: Contact[] = (data || []).map((user: any) => ({
          id: user.id,
          name: user.name || user.username,
          username: user.username,
          avatar_url: user.avatar_url,
          is_online: user.is_online
        }));

        setContacts(mappedContacts);
      } catch (error) {
        console.error("Search error:", error);
        toast.error("Failed to search users");
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const quickAmounts = [50, 100, 250, 500, 1000, 2000];

  const handleRequestMoney = () => {
    if (!amount || !selectedContact || parseFloat(amount) <= 0) return;

    // For now, show a toast since money requests need backend support
    // In a full implementation, this would send a notification to the recipient
    toast.success(`Request for ${amount} ETB sent to @${selectedContact.username}`);
    
    // Navigate back to wallet
    navigate('/wallet');
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
          <h1 className="text-lg font-semibold">Request Money</h1>
        </div>
      </div>

      {/* Amount Input */}
      <div className="p-4">
        <Card className="p-6">
          <div className="text-center mb-6">
            <Label className="text-sm text-muted-foreground">Amount to request</Label>
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
          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map((quickAmount) => (
              <Button
                key={quickAmount}
                variant="outline"
                onClick={() => setAmount(quickAmount.toString())}
                className="h-10"
              >
                {quickAmount}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* Selected Contact */}
      {selectedContact && (
        <div className="px-4 mb-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ChatAvatar
                  name={selectedContact.name}
                  status={selectedContact.is_online ? "online" : "offline"}
                  size="md"
                  src={selectedContact.avatar_url}
                />
                <div>
                  <h3 className="font-medium text-foreground">{selectedContact.name}</h3>
                  <p className="text-sm text-muted-foreground">@{selectedContact.username}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedContact(null)}
              >
                Change
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Contact Selection */}
      {!selectedContact && (
        <div className="px-4 mb-4">
          <h3 className="font-medium text-foreground mb-3">Request from</h3>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          <div className="space-y-2">
            {isSearching ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : searchQuery.length < 2 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Type at least 2 characters to search
              </p>
            ) : contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No users found
              </p>
            ) : (
              contacts.map((contact) => (
                <Card
                  key={contact.id}
                  className="p-3 cursor-pointer hover:bg-muted/50 transition-smooth"
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="flex items-center space-x-3">
                    <ChatAvatar
                      name={contact.name}
                      status={contact.is_online ? "online" : "offline"}
                      size="sm"
                      src={contact.avatar_url}
                    />
                    <div>
                      <h4 className="font-medium text-foreground">{contact.name}</h4>
                      <p className="text-sm text-muted-foreground">@{contact.username}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Reason */}
      {selectedContact && (
        <div className="px-4 mb-4">
          <Label className="text-sm font-medium text-foreground">Reason for request (optional)</Label>
          <Input
            placeholder="What's this for?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-2"
          />
        </div>
      )}

      {/* Request Button */}
      <div className="p-4">
        <Button 
          onClick={handleRequestMoney}
          disabled={!amount || !selectedContact || parseFloat(amount) <= 0}
          className="w-full h-12 bg-gradient-primary hover:opacity-90"
        >
          <ArrowDownLeft className="h-4 w-4 mr-2" />
          Request {amount ? `${amount} ETB` : 'Money'}
        </Button>
      </div>
    </div>
  );
};

export default RequestMoney;
