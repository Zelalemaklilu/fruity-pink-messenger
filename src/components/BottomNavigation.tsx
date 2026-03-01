import { useNavigate, useLocation } from "react-router-dom";
import { MessageCircle, Phone, Megaphone, BookUser, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useChatList } from "@/hooks/useChatStore";
import { useMissedCalls } from "@/hooks/useMissedCalls";

interface NavItem {
  path: string;
  icon: React.ComponentType<any>;
  label: string;
  matchPaths?: string[];
}

const navItems: NavItem[] = [
  { path: "/chats", icon: MessageCircle, label: "Chats", matchPaths: ["/chats", "/chat"] },
  { path: "/calls", icon: Phone, label: "Calls" },
  { path: "/channels", icon: Megaphone, label: "Channels" },
  { path: "/contacts", icon: BookUser, label: "Contacts" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalUnread } = useChatList();
  const { missedCount, markCallsAsSeen } = useMissedCalls();

  const isActive = (item: NavItem) => {
    const paths = item.matchPaths || [item.path];
    return paths.some(p => location.pathname.startsWith(p));
  };

  const handleNavClick = (item: NavItem) => {
    if (item.path === "/calls") {
      markCallsAsSeen();
    }
    navigate(item.path);
  };

  const getBadgeCount = (item: NavItem): number => {
    if (item.path === "/chats") return totalUnread;
    if (item.path === "/calls") return missedCount;
    return 0;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border">
      <nav className="flex items-center justify-around gap-2 h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          const badgeCount = getBadgeCount(item);

          return (
            <button
              key={item.path}
              data-testid={`nav-${item.label.toLowerCase()}`}
              onClick={() => handleNavClick(item)}
              className="relative flex flex-col items-center justify-center w-16 h-full gap-0.5 transition-colors"
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-0.5 w-8 h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative">
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                {badgeCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                    className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground flex items-center justify-center px-1"
                  >
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </motion.span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
