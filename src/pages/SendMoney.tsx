import { useState, useEffect } from "react";
import { ArrowLeft, Search, Send, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { walletService } from "@/lib/walletService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  username: string;
  avatar_url?: string;
  is_online?: boolean;
}

const SendMoney = () => {
  const [amount, setAmount] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [note, setNote] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const navigate = useNavigate();

  // Load wallet balance on mount
  useEffect(() => {
    const loadBalance = async () => {
      try {
        const data = await walletService.getWalletBalance();
        if (data.wallet) {
          setWalletBalance(data.wallet.balance);
        }
      } catch (error) {
        console.error("Failed to load balance:", error);
      } finally {
        setIsLoadingBalance(false);
      }
    };
    loadBalance();
  }, []);

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

  const handleSendMoney = async () => {
    if (!amount || !selectedContact || parseFloat(amount) <= 0) return;

    const sendAmount = parseFloat(amount);

    // Client-side balance check (server will verify too)
    if (sendAmount > walletBalance) {
      toast.error("Insufficient balance");
      return;
    }

    setIsSending(true);

    try {
      const result = await walletService.transfer(
        selectedContact.id,
        sendAmount,
        note || undefined
      );

      if (!result.success) {
        if (result.duplicate) {
          toast.warning("This transaction was already processed");
        } else {
          toast.error(result.error || "Transfer failed");
        }
        return;
      }

      // Navigate to receipt with real transaction data
      navigate('/transaction-receipt', { 
        state: { 
          transaction: {
            type: 'send_money',
            amount: sendAmount,
            recipient: selectedContact.name,
            transactionId: result.transaction?.reference_id,
            timestamp: result.transaction?.created_at,
            status: result.transaction?.status || 'completed',
            note: note,
            balance_after: result.transaction?.balance_after
          }
        } 
      });
    } catch (error) {
      console.error("Transfer error:", error);
      toast.error("Failed to send money. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const insufficientBalance = parseFloat(amount || "0") > walletBalance;

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
          <h1 className="text-lg font-semibold">Send Money</h1>
        </div>
      </div>

      {/* Balance Display */}
      <div className="px-4 pt-4">
        <div className="text-sm text-muted-foreground mb-2">
          Available Balance: {isLoadingBalance ? (
            <span className="animate-pulse">Loading...</span>
          ) : (
            <span className="font-semibold text-foreground">{walletBalance.toFixed(2)} ETB</span>
          )}
        </div>
      </div>

      {/* Amount Input */}
      <div className="p-4 pt-2">
        <Card className="p-6">
          <div className="text-center mb-6">
            <Label className="text-sm text-muted-foreground">Amount to send</Label>
            <div className="flex items-center justify-center mt-2">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`text-center text-3xl font-bold border-0 focus-visible:ring-0 bg-transparent ${
                  insufficientBalance ? 'text-destructive' : ''
                }`}
              />
              <span className="text-3xl font-bold text-muted-foreground ml-2">ETB</span>
            </div>
            {insufficientBalance && (
              <div className="flex items-center justify-center gap-1 mt-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Insufficient balance</span>
              </div>
            )}
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map((quickAmount) => (
              <Button
                key={quickAmount}
                variant="outline"
                onClick={() => setAmount(quickAmount.toString())}
                className="h-10"
                disabled={quickAmount > walletBalance}
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
          <h3 className="font-medium text-foreground mb-3">Send to</h3>
          
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

      {/* Note */}
      {selectedContact && (
        <div className="px-4 mb-4">
          <Label className="text-sm font-medium text-foreground">Add a note (optional)</Label>
          <Input
            placeholder="What's this for?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-2"
          />
        </div>
      )}

      {/* Send Button */}
      <div className="p-4">
        <Button 
          onClick={handleSendMoney}
          disabled={!amount || !selectedContact || parseFloat(amount) <= 0 || insufficientBalance || isSending}
          className="w-full h-12 bg-gradient-primary hover:opacity-90"
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send {amount ? `${amount} ETB` : 'Money'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SendMoney;
