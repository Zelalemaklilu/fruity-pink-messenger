import { ArrowLeft, Phone, MessageSquare, UserX, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChatAvatar } from "@/components/ui/chat-avatar";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/chats")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Profile</h1>
        </div>
      </div>

      {/* Profile Header */}
      <div className="relative">
        <div className="h-32 bg-gradient-primary"></div>
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
          <ChatAvatar
            name="Alex Johnson"
            size="lg"
            status="online"
            className="ring-4 ring-background"
          />
        </div>
      </div>

      <div className="pt-16 pb-6 text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Alex Johnson</h2>
        <p className="text-muted-foreground">@alexjohnson</p>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto px-4">
          Software Developer | Coffee enthusiast ☕ | Always learning something new 🚀
        </p>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-6">
        <div className="grid grid-cols-2 gap-3">
          <Button className="h-12 bg-gradient-primary hover:opacity-90 transition-smooth rounded-xl">
            <MessageSquare className="h-5 w-5 mr-2" />
            Start Chat
          </Button>
          <Button variant="outline" className="h-12 rounded-xl">
            <Phone className="h-5 w-5 mr-2" />
            Call
          </Button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 space-y-4">
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-foreground">Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="text-foreground">+251 9XX XXX XXX</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Username</span>
              <span className="text-foreground">@alexjohnson</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last seen</span>
              <span className="text-foreground">Online</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-foreground">Shared Media</h3>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg"></div>
            ))}
          </div>
          <Button variant="ghost" className="w-full text-primary">
            View all media
          </Button>
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-foreground">Actions</h3>
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive">
              <UserX className="h-4 w-4 mr-3" />
              Block User
            </Button>
            <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive">
              <Flag className="h-4 w-4 mr-3" />
              Report User
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;