import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MessageSquarePlus, Users, UserPlus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface SpeedDialAction {
  icon: React.ComponentType<any>;
  label: string;
  path: string;
  color: string;
}

const actions: SpeedDialAction[] = [
  { icon: MessageSquarePlus, label: "New Chat", path: "/new-message", color: "bg-primary" },
  { icon: Users, label: "New Group", path: "/new-group", color: "bg-emerald-500" },
  { icon: UserPlus, label: "Add Contact", path: "/new-contact", color: "bg-blue-500" },
];

export function SpeedDialFAB() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleAction = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-[88px] right-6 z-50 flex flex-col-reverse items-end gap-3">
        <AnimatePresence>
          {open && actions.map((action, index) => (
            <motion.div
              key={action.path}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ delay: index * 0.05, type: "spring", stiffness: 400, damping: 25 }}
              className="flex items-center gap-3"
            >
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: index * 0.05 + 0.1 }}
                className="text-sm font-medium text-foreground bg-card px-3 py-1.5 rounded-md shadow-md border border-border whitespace-nowrap"
              >
                {action.label}
              </motion.span>
              <button
                data-testid={`fab-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => handleAction(action.path)}
                className={`h-12 w-12 rounded-full ${action.color} text-white flex items-center justify-center shadow-lg`}
              >
                <action.icon className="h-5 w-5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            size="icon"
            data-testid="fab-main"
            onClick={() => setOpen(!open)}
            className="h-14 w-14 rounded-full bg-gradient-primary hover:opacity-90 shadow-primary"
          >
            <motion.div
              animate={{ rotate: open ? 45 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
            </motion.div>
          </Button>
        </motion.div>
      </div>
    </>
  );
}
