import { ArrowLeft, Search, Users, UserPlus, Hash, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface Contact {
  id: string;
  name: string;
  phone: string;
  lastSeen: string;
  avatar?: string;
  status: "online" | "away" | "offline";
}

const mockContacts: Contact[] = [
  {
    id: "1",
    name: "Alex Johnson",
    phone: "+251 911 123 456",
    lastSeen: "today at 13:24",
    status: "online"
  },
  {
    id: "2",
    name: "Sarah Williams", 
    phone: "+251 911 987 654",
    lastSeen: "on Sep 08 at 19:46",
    status: "away"
  },
  {
    id: "3",
    name: "John Smith",
    phone: "+251 911 555 269",
    lastSeen: "on 31.07.24 at 15:30",
    status: "offline"
  }
];

const NewMessage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = mockContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  );

  const handleBack = () => {
    navigate("/chats");
  };

  const handleNewGroup = () => {
    navigate("/new-group");
  };

  const handleNewContact = () => {
    navigate("/new-contact");
  };

  const handleNewChannel = () => {
    // Placeholder for new channel functionality
    console.log("New Channel clicked");
  };

  const handleContactClick = (contactId: string) => {
    navigate(`/chat/${contactId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">New Message</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Action Options */}
      <div className="space-y-1 p-2">
        <Button
          variant="ghost"
          className="w-full justify-start h-14 px-4 hover:bg-muted/50"
          onClick={handleNewGroup}
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="text-base font-medium">New Group</span>
          </div>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start h-14 px-4 hover:bg-muted/50"
          onClick={handleNewContact}
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="text-base font-medium">New Contact</span>
          </div>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start h-14 px-4 hover:bg-muted/50"
          onClick={handleNewChannel}
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Hash className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="text-base font-medium">New Channel</span>
          </div>
        </Button>
      </div>

      {/* Contacts Section */}
      <div className="px-4 py-2">
        <h3 className="text-sm text-muted-foreground font-medium mb-3">Sorted by name</h3>
        
        <div className="space-y-1">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => handleContactClick(contact.id)}
              className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-smooth"
            >
              <ChatAvatar
                name={contact.name}
                src={contact.avatar}
                status={contact.status}
                size="md"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground">
                    {contact.name}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {contact.lastSeen}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {contact.phone}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewMessage;