import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Bot as BotIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getBot,
  getBotMessages,
  sendBotMessage,
  processBotCommand,
  type BotMessage,
} from "@/lib/botService";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

const BotChat = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { userId } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const bot = id ? getBot(id) : undefined;

  useEffect(() => {
    if (bot && userId) {
      setMessages(getBotMessages(bot.id, userId));
    }
  }, [bot?.id, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isBotTyping]);

  const handleSend = useCallback(() => {
    if (!input.trim() || !bot || !userId) return;

    const text = input.trim();
    setInput("");

    const userMsg = sendBotMessage(bot.id, userId, text);
    setMessages((prev) => [...prev, userMsg]);

    setIsBotTyping(true);
    setTimeout(() => {
      const botResponse = processBotCommand(bot, text, userId);
      setMessages((prev) => [...prev, botResponse]);
      setIsBotTyping(false);
    }, 300);
  }, [input, bot, userId]);

  const handleCommandClick = useCallback(
    (command: string) => {
      if (!bot || !userId) return;

      const userMsg = sendBotMessage(bot.id, userId, command);
      setMessages((prev) => [...prev, userMsg]);

      setIsBotTyping(true);
      setTimeout(() => {
        const botResponse = processBotCommand(bot, command, userId);
        setMessages((prev) => [...prev, botResponse]);
        setIsBotTyping(false);
      }, 300);
    },
    [bot, userId]
  );

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!bot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground space-y-4">
          <BotIcon className="h-16 w-16 mx-auto opacity-30" />
          <p>Bot not found</p>
          <Button variant="outline" onClick={() => navigate("/bots")} data-testid="button-back-bots">
            Back to Bots
          </Button>
        </div>
      </div>
    );
  }

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="h-screen bg-background flex flex-col" data-testid="page-bot-chat">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-3 z-50"
      >
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate("/bots")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: bot.avatarColor }}
          >
            <BotIcon className="h-4.5 w-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-foreground truncate">
                {bot.name}
              </h1>
              <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            </div>
            <p className="text-xs text-muted-foreground">@{bot.username}</p>
          </div>
        </div>
      </motion.div>

      <div className="border-b border-border">
        <div className="flex gap-2 p-2 overflow-x-auto no-scrollbar">
          {bot.commands.map((cmd) => (
            <Badge
              key={cmd.command}
              variant="outline"
              className="cursor-pointer whitespace-nowrap shrink-0"
              onClick={() => handleCommandClick(cmd.command)}
              data-testid={`chip-command-${cmd.command.slice(1)}`}
            >
              {cmd.command}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <BotIcon className="h-12 w-12 opacity-20" />
            <p className="text-sm">Send a command to start chatting</p>
            <Badge
              variant="outline"
              className="cursor-pointer"
              onClick={() => handleCommandClick("/start")}
              data-testid="chip-start-empty"
            >
              /start
            </Badge>
          </div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "flex",
              msg.isFromBot ? "justify-start" : "justify-end"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-3.5 py-2.5",
                msg.isFromBot
                  ? "bg-muted/70 text-foreground"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {msg.type === "card" && msg.cardData ? (
                <Card className="border-0 shadow-none bg-transparent p-0">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: bot.avatarColor }}
                      >
                        <BotIcon className="h-4 w-4" />
                      </div>
                      <h3 className="text-sm font-semibold">{msg.cardData.title}</h3>
                    </div>
                    <p className="text-xs opacity-90">{msg.cardData.description}</p>
                    {msg.cardData.buttonText && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-1"
                        onClick={() => handleCommandClick("/help")}
                        data-testid="button-card-action"
                      >
                        {msg.cardData.buttonText}
                      </Button>
                    )}
                  </div>
                </Card>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              )}
              <p
                className={cn(
                  "text-[10px] mt-1",
                  msg.isFromBot ? "text-muted-foreground" : "text-primary-foreground/70"
                )}
              >
                {formatTime(msg.createdAt)}
              </p>
            </div>
          </motion.div>
        ))}

        {isBotTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-muted/70 rounded-2xl px-4 py-3 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-3 bg-background">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            placeholder="Type a command or message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1"
            data-testid="input-bot-message"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim()}
            data-testid="button-send-bot-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BotChat;
