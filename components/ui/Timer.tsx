"use client";

import { useEffect, useState } from "react";

interface Props {
  seconds: number;
  onExpire?: () => void;
  autoStart?: boolean;
  label?: string;
}

export default function Timer({ seconds, onExpire, autoStart = true, label }: Props) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(autoStart);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) {
      onExpire?.();
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining, running, onExpire]);

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const percent = (remaining / seconds) * 100;
  const urgent = percent < 20;

  return (
    <div className="flex flex-col items-end">
      {label && <span className="text-xs text-brand-gray-500 mb-0.5">{label}</span>}
      <span
        className={`text-2xl font-bold tabular-nums ${urgent ? "text-brand-red animate-pulse" : "text-brand-navy"}`}
      >
        {mm}:{ss.toString().padStart(2, "0")}
      </span>
    </div>
  );
}
