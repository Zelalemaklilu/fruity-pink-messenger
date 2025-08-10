import { useState } from "react";
import { ArrowLeft, Search, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatAvatar } from "@/components/ui/chat-avatar";
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
  },
  {
    id: "4",
    name: "Emma Davis",
    phone: "+251 914 456 789",
    status: "online"
  }
];

const Contacts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const filteredContacts = mockContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  );

  const handleContactClick = (contactId: string) => {
    navigate(`/chat/${contactId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/settings")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Contacts</h1>
        </div>
        
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted border-0 rounded-full"
          />
        </div>
      </div>

      {/* Add Contact Button */}
      <div className="p-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-primary hover:text-primary/80"
          onClick={() => navigate('/add-contact')}
        >
          <UserPlus className="h-5 w-5 mr-3" />
          Add Contact
        </Button>
      </div>

      {/* Contacts List */}
      <div className="divide-y divide-border">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            onClick={() => handleContactClick(contact.id)}
            className="flex items-center space-x-3 p-4 hover:bg-muted/50 cursor-pointer transition-smooth"
          >
            <ChatAvatar
              name={contact.name}
              src={contact.avatar}
              status={contact.status}
              size="md"
            />
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {contact.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {contact.phone}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          size="icon"
          onClick={() => navigate('/add-contact')}
          className="h-14 w-14 rounded-full bg-gradient-primary hover:opacity-90 transition-smooth shadow-primary"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default Contacts;