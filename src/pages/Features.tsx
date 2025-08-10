import { ArrowLeft, Star, MessageCircle, Shield, Zap, Users, Camera, Phone, FileText, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface Feature {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  status: "available" | "coming-soon" | "beta";
  color: string;
}

const features: Feature[] = [
  {
    icon: MessageCircle,
    title: "Instant Messaging",
    description: "Send text messages, emojis, and stickers instantly",
    status: "available",
    color: "text-blue-500"
  },
  {
    icon: Shield,
    title: "End-to-End Encryption",
    description: "Your messages are secured with military-grade encryption",
    status: "available",
    color: "text-green-500"
  },
  {
    icon: Users,
    title: "Group Chats",
    description: "Create groups with up to 200 members",
    status: "available",
    color: "text-purple-500"
  },
  {
    icon: Phone,
    title: "Voice & Video Calls",
    description: "High-quality voice and video calls worldwide",
    status: "available",
    color: "text-orange-500"
  },
  {
    icon: Camera,
    title: "Photo & Video Sharing",
    description: "Share photos and videos with compression options",
    status: "available",
    color: "text-pink-500"
  },
  {
    icon: FileText,
    title: "File Sharing",
    description: "Share documents, PDFs, and files up to 2GB",
    status: "available",
    color: "text-indigo-500"
  },
  {
    icon: Zap,
    title: "Smart Replies",
    description: "AI-powered quick reply suggestions",
    status: "beta",
    color: "text-yellow-500"
  },
  {
    icon: Globe,
    title: "Translation",
    description: "Real-time message translation in 100+ languages",
    status: "coming-soon",
    color: "text-cyan-500"
  }
];

const Features = () => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "available":
        return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">Available</Badge>;
      case "beta":
        return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">Beta</Badge>;
      case "coming-soon":
        return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400">Coming Soon</Badge>;
      default:
        return null;
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
            onClick={() => navigate("/settings")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Zeshopp Features</h1>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="p-4">
        <Card className="p-6 bg-gradient-primary text-primary-foreground">
          <div className="text-center">
            <Star className="h-12 w-12 mx-auto mb-4 text-primary-foreground/80" />
            <h2 className="text-2xl font-bold mb-2">Zeshopp Chat</h2>
            <p className="text-primary-foreground/80 text-sm">
              Experience the future of messaging with our advanced features
            </p>
          </div>
        </Card>
      </div>

      {/* Features Grid */}
      <div className="px-4 pb-6">
        <h3 className="font-medium text-foreground mb-4">All Features</h3>
        <div className="grid gap-3">
          {features.map((feature, index) => (
            <Card key={index} className="p-4 hover:bg-muted/50 transition-smooth">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg bg-muted ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">
                      {feature.title}
                    </h4>
                    {getStatusBadge(feature.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            More exciting features coming soon!
          </p>
          <Button variant="outline" className="w-full">
            Request a Feature
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Features;