import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Video, X, Circle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MAX_VIDEO_DURATION,
  startVideoRecording,
  formatVideoDuration,
} from "@/lib/videoMessageService";

interface VideoMessageRecorderProps {
  onSend: (blob: Blob) => void;
  onCancel: () => void;
}

export function VideoMessageRecorder({ onSend, onCancel }: VideoMessageRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [streamReady, setStreamReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStreamReady(true);
      } catch (err) {
        console.error("Camera access denied:", err);
      }
    }
    initCamera();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [cleanup]);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = startVideoRecording(streamRef.current);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
      setVideoBlob(blob);
    };

    recorder.start();
    setIsRecording(true);
    setDuration(0);

    timerRef.current = setInterval(() => {
      setDuration((d) => {
        if (d + 1 >= MAX_VIDEO_DURATION) {
          stopRecording();
          return MAX_VIDEO_DURATION;
        }
        return d + 1;
      });
    }, 1000);
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleSend = useCallback(() => {
    if (videoBlob) {
      onSend(videoBlob);
    }
  }, [videoBlob, onSend]);

  const handleCancel = useCallback(() => {
    cleanup();
    onCancel();
  }, [cleanup, onCancel]);

  const progress = duration / MAX_VIDEO_DURATION;
  const circumference = 2 * Math.PI * 126;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <motion.div
      data-testid="video-recorder-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90"
    >
      <Button
        data-testid="button-video-cancel"
        variant="ghost"
        size="icon"
        onClick={handleCancel}
        className="absolute top-4 right-4 text-white hover:bg-white/20"
      >
        <X className="h-6 w-6" />
      </Button>

      <div className="flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center" style={{ width: 260, height: 260 }}>
          <svg
            className="absolute inset-0"
            width={260}
            height={260}
            viewBox="0 0 260 260"
          >
            <circle
              cx={130}
              cy={130}
              r={126}
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={4}
            />
            {isRecording && (
              <circle
                cx={130}
                cy={130}
                r={126}
                fill="none"
                stroke="hsl(0, 75%, 55%)"
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 130 130)"
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            )}
          </svg>

          <div
            className="rounded-full overflow-hidden bg-black"
            style={{ width: 240, height: 240 }}
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isRecording && (
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-3 h-3 rounded-full bg-destructive"
            />
          )}
          <span
            data-testid="text-video-duration"
            className="text-white text-lg font-mono"
          >
            {formatVideoDuration(duration)}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {!isRecording && !videoBlob && (
            <Button
              data-testid="button-video-record"
              size="icon"
              onClick={startRecording}
              disabled={!streamReady}
              className="h-16 w-16 rounded-full bg-destructive hover:bg-destructive/90"
            >
              <Circle className="h-8 w-8 fill-current" />
            </Button>
          )}

          {isRecording && (
            <Button
              data-testid="button-video-record"
              size="icon"
              onClick={stopRecording}
              className="h-16 w-16 rounded-full bg-destructive hover:bg-destructive/90"
            >
              <div className="h-6 w-6 rounded-sm bg-white" />
            </Button>
          )}

          {videoBlob && !isRecording && (
            <Button
              data-testid="button-video-send"
              size="icon"
              onClick={handleSend}
              className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90"
            >
              <Send className="h-7 w-7" />
            </Button>
          )}
        </div>

        {!isRecording && !videoBlob && (
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Video className="h-4 w-4" />
            <span>Tap to record</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
