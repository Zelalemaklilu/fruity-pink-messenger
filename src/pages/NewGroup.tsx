import { useState } from "react";
import { ArrowLeft, Users, Camera, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { Checkbox } from "@/components/ui/checkbox";
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

const NewGroup = () => {
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const navigate = useNavigate();

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleCreateGroup = () => {
    if (groupName.trim() && selectedContacts.length > 0) {
      // Create group logic here
      alert(`Group "${groupName}" created with ${selectedContacts.length} members!`);
      navigate('/chats');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/settings")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">New Group</h1>
          </div>
          <Button 
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedContacts.length === 0}
            className="bg-gradient-primary hover:opacity-90"
          >
            Create
          </Button>
        </div>
      </div>

      {/* Group Info Section */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Camera className="h-6 w-6 text-muted-foreground" />
            </div>
            <Button 
              size="icon"
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-gradient-primary"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 space-y-3">
            <Input
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="font-medium"
            />
            <Textarea
              placeholder="Group description (optional)"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              className="min-h-[60px] resize-none"
            />
          </div>
        </div>
      </div>

      {/* Selected Members Count */}
      {selectedContacts.length > 0 && (
        <div className="p-4 bg-muted/30">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{selectedContacts.length} member{selectedContacts.length > 1 ? 's' : ''} selected</span>
          </div>
        </div>
      )}

      {/* Contacts List */}
      <div className="p-4">
        <h3 className="font-medium text-foreground mb-3">Add members</h3>
        <div className="space-y-2">
          {mockContacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-smooth"
              onClick={() => handleContactToggle(contact.id)}
            >
              <ChatAvatar
                name={contact.name}
                src={contact.avatar}
                status={contact.status}
                size="md"
              />
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">
                  {contact.name}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {contact.phone}
                </p>
              </div>

              <Checkbox
                checked={selectedContacts.includes(contact.id)}
                onCheckedChange={() => handleContactToggle(contact.id)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewGroup;