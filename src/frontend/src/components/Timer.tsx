import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface TimerProps {
  startTime: number;
  timeLimitMinutes: number;
  onExpire?: () => void;
  className?: string;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function Timer({
  startTime,
  timeLimitMinutes,
  onExpire,
  className = "",
}: TimerProps) {
  const totalSeconds = timeLimitMinutes * 60;
  const [remaining, setRemaining] = useState(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    return Math.max(0, totalSeconds - elapsed);
  });

  const isWarning = remaining <= 600; // last 10 minutes
  const isCritical = remaining <= 120; // last 2 minutes

  useEffect(() => {
    if (remaining <= 0) {
      onExpire?.();
      return;
    }
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const next = Math.max(0, totalSeconds - elapsed);
      setRemaining(next);
      if (next <= 0) onExpire?.();
    }, 1000);
    return () => clearInterval(id);
  }, [startTime, totalSeconds, onExpire, remaining]);

  return (
    <div
      className={`flex items-center gap-2 font-mono text-sm tabular-nums ${
        isCritical
          ? "text-destructive"
          : isWarning
            ? "text-yellow-400"
            : "text-foreground"
      } ${className}`}
      data-ocid="exam.timer"
      aria-label={`Time remaining: ${formatTime(remaining)}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <Clock className={`w-4 h-4 ${isCritical ? "animate-pulse" : ""}`} />
      <span className="font-semibold tracking-wide">
        {formatTime(remaining)}
      </span>
    </div>
  );
}
