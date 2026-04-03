import { useNavigate } from "react-router-dom";
import {
  User, Wallet, Users, Phone, Bookmark, Settings,
  UserPlus, Sparkles, ShoppingBag, Radio, Bot, MapPin,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NavigationDrawerProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: User, label: "የእኔ መገለጫ", path: "/profile" },
  { icon: Wallet, label: "Wallet", path: "/wallet" },
  { icon: ShoppingBag, label: "Shop", path: "/shop" },
  { icon: Users, label: "New Group", path: "/new-group" },
  { icon: Phone, label: "Calls", path: "/calls" },
  { icon: Radio, label: "Channels", path: "/channels" },
  { icon: Bot, label: "Bots", path: "/bots" },
  { icon: MapPin, label: "Nearby People", path: "/nearby" },
  { icon: Bookmark, label: "Saved Messages", path: "/saved-messages" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: Sparkles, label: "Features", path: "/features" },
];

export default function NavigationDrawer({ open, onClose }: NavigationDrawerProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<{
    name: string | null;
    avatar_url: string | null;
    username: string;
    email: string | null;
  } | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("profiles")
      .select("name, avatar_url, username, email")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  }, [user?.id]);

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  const displayName = profile?.name || profile?.username || "User";

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0 bg-card border-border">
        {/* Profile Header */}
        <div className="p-6 bg-gradient-to-br from-primary/20 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <Avatar className="w-16 h-16 border-2 border-primary/30">
              <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
          <h2 className="font-semibold text-foreground text-lg">{displayName}</h2>
          <p className="text-muted-foreground text-sm">
            @{profile?.username || "user"}
          </p>

          <Button
            variant="ghost"
            size="sm"
            className="mt-3 text-primary hover:bg-primary/10 -ml-2"
            onClick={() => handleNavigate("/add-account")}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            መለያ አክል
          </Button>
        </div>

        <Separator className="bg-border" />

        {/* Menu Items */}
        <div className="py-2 overflow-y-auto max-h-[calc(100vh-200px)]">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-3 hover:bg-muted transition-colors"
              )}
            >
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-left text-foreground">{item.label}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
