import { useState } from "react";
import { ArrowLeft, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface Contact {
  id: string;
  name: string;
  phone: string;
  status: "online" | "away" | "offline";
  avatar?: string;
}

const mockContacts: Contact[] = [
  {
    id: "1",
    name: "Alex Johnson",
    phone: "+251 911 123 456",
    status: "online"
  },
  {
    id: "2",
    name: "Sarah Williams", 
    phone: "+251 912 234 567",
    status: "away"
  },
  {
    id: "3",
    name: "John Smith",
    phone: "+251 913 345 678",
    status: "offline"
  }
];

const SendMoney = () => {
  const [amount, setAmount] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [note, setNote] = useState("");
  const navigate = useNavigate();

  const filteredContacts = mockContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  );

  const quickAmounts = [50, 100, 250, 500, 1000, 2000];

  const handleSendMoney = () => {
    if (amount && selectedContact && parseFloat(amount) > 0) {
      const transactionData = {
        type: "send-money" as const,
        amount: amount,
        recipient: selectedContact.name,
        transactionId: `TXN${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        status: "completed" as const
      };
      
      navigate('/transaction-receipt', { state: transactionData });
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
          <h1 className="text-lg font-semibold">Send Money</h1>
        </div>
      </div>

      {/* Amount Input */}
      <div className="p-4">
        <Card className="p-6">
          <div className="text-center mb-6">
            <Label className="text-sm text-muted-foreground">Amount to send</Label>
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
                  status={selectedContact.status}
                  size="md"
                />
                <div>
                  <h3 className="font-medium text-foreground">{selectedContact.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedContact.phone}</p>
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
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Contacts List */}
          <div className="space-y-2">
            {filteredContacts.map((contact) => (
              <Card
                key={contact.id}
                className="p-3 cursor-pointer hover:bg-muted/50 transition-smooth"
                onClick={() => setSelectedContact(contact)}
              >
                <div className="flex items-center space-x-3">
                  <ChatAvatar
                    name={contact.name}
                    status={contact.status}
                    size="sm"
                  />
                  <div>
                    <h4 className="font-medium text-foreground">{contact.name}</h4>
                    <p className="text-sm text-muted-foreground">{contact.phone}</p>
                  </div>
                </div>
              </Card>
            ))}
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
          disabled={!amount || !selectedContact || parseFloat(amount) <= 0}
          className="w-full h-12 bg-gradient-primary hover:opacity-90"
        >
          <Send className="h-4 w-4 mr-2" />
          Send {amount ? `${amount} ETB` : 'Money'}
        </Button>
      </div>
    </div>
  );
};

export default SendMoney;