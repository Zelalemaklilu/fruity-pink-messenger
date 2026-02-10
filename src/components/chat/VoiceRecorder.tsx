import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, Square, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  onSend: (blob: Blob) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onSend, onCancel, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob);
      setAudioBlob(null);
      setDuration(0);
    }
  };

  const handleCancel = () => {
    if (isRecording) stopRecording();
    setAudioBlob(null);
    setDuration(0);
    onCancel();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center space-x-2 w-full"
    >
      <Button variant="ghost" size="icon" onClick={handleCancel}>
        <X className="h-5 w-5 text-destructive" />
      </Button>

      <div className="flex-1 flex items-center space-x-2 bg-muted rounded-full px-4 py-2">
        {isRecording && (
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-3 h-3 rounded-full bg-destructive"
          />
        )}

        {/* Waveform visualization */}
        <div className="flex-1 flex items-center justify-center space-x-0.5 h-8">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                "w-1 rounded-full",
                isRecording ? "bg-primary" : audioBlob ? "bg-primary/60" : "bg-muted-foreground/30"
              )}
              animate={
                isRecording
                  ? { height: [4, Math.random() * 24 + 4, 4] }
                  : { height: audioBlob ? Math.random() * 16 + 4 : 4 }
              }
              transition={
                isRecording
                  ? { repeat: Infinity, duration: 0.3 + Math.random() * 0.4, delay: i * 0.02 }
                  : { duration: 0 }
              }
            />
          ))}
        </div>

        <span className="text-sm font-mono text-muted-foreground min-w-[40px]">
          {formatDuration(duration)}
        </span>
      </div>

      {!isRecording && !audioBlob && (
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            size="icon"
            onClick={startRecording}
            disabled={disabled}
            className="rounded-full bg-primary hover:bg-primary/90"
          >
            <Mic className="h-5 w-5" />
          </Button>
        </motion.div>
      )}

      {isRecording && (
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            size="icon"
            onClick={stopRecording}
            className="rounded-full bg-destructive hover:bg-destructive/90"
          >
            <Square className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {audioBlob && !isRecording && (
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={disabled}
            className="rounded-full bg-gradient-primary hover:opacity-90"
          >
            <Send className="h-5 w-5" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
