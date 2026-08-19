"use client";

import { MAX_FLAME_LEVEL } from "@/lib/flame";

interface Props {
  level: number;
  color: string;
  size?: number;
}

export default function Flame({ level, color, size = 140 }: Props) {
  const l = Math.max(0, Math.min(MAX_FLAME_LEVEL, level));
  const scale = 0.45 + l * 0.13;
  const glow = 0.25 + l * 0.15;

  if (l === 0) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center"
      >
        <div className="text-center opacity-50">
          <div className="text-5xl mb-1 grayscale">🕯️</div>
          <div className="text-xs text-brand-gray-500">불 꺼짐</div>
        </div>
      </div>
    );
  }

  const darker = shade(color, -25);

  return (
    <div
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center"
    >
      <div
        className="absolute inset-0 rounded-full blur-2xl"
        style={{ background: color, opacity: glow }}
      />
      <svg
        viewBox="0 0 64 96"
        width={size * scale}
        height={size * scale * 1.5}
        className="relative drop-shadow-lg"
      >
        <defs>
          <linearGradient id={`flame-g-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="60%" stopColor={color} />
            <stop offset="100%" stopColor={darker} />
          </linearGradient>
          <linearGradient id={`flame-inner-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFDE7" />
            <stop offset="50%" stopColor="#FFF59D" />
            <stop offset="100%" stopColor={color} stopOpacity="0.4" />
          </linearGradient>
        </defs>

        <g className="flame-flicker-outer" style={{ transformOrigin: "32px 80px" }}>
          <path
            d="M32 88 C 12 80, 8 60, 18 44 C 22 50, 24 46, 22 36 C 30 42, 36 32, 32 18 C 44 28, 52 44, 50 60 C 50 78, 44 88, 32 88 Z"
            fill={`url(#flame-g-${color})`}
          />
        </g>
        <g className="flame-flicker-inner" style={{ transformOrigin: "32px 82px" }}>
          <path
            d="M32 86 C 22 80, 20 68, 26 56 C 28 60, 30 58, 30 52 C 36 58, 40 50, 38 42 C 44 50, 46 64, 44 72 C 44 82, 38 86, 32 86 Z"
            fill={`url(#flame-inner-${color})`}
          />
        </g>
        <ellipse
          cx="32"
          cy="76"
          rx="6"
          ry="9"
          fill="#FFFDE7"
          className="flame-flicker-core"
        />

        <g className="flame-face">
          <ellipse cx="26" cy="65" rx="2.2" ry="2.8" fill="#1a1a1a" />
          <ellipse cx="38" cy="65" rx="2.2" ry="2.8" fill="#1a1a1a" />
          <ellipse cx="26.6" cy="64" rx="0.8" ry="1" fill="#fff" />
          <ellipse cx="38.6" cy="64" rx="0.8" ry="1" fill="#fff" />
          <ellipse cx="22" cy="71" rx="2.5" ry="1.8" fill="#FF9EB5" opacity="0.7" />
          <ellipse cx="42" cy="71" rx="2.5" ry="1.8" fill="#FF9EB5" opacity="0.7" />
          <path
            d="M 28 71 Q 32 75 36 71"
            stroke="#1a1a1a"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </svg>

      <style jsx>{`
        @keyframes flicker-outer {
          0%, 100% { transform: scale(1, 1) translateY(0); }
          25% { transform: scale(1.03, 0.97) translateY(-1px); }
          50% { transform: scale(0.97, 1.04) translateY(0); }
          75% { transform: scale(1.02, 0.98) translateY(-1.5px); }
        }
        @keyframes flicker-inner {
          0%, 100% { transform: scale(1, 1); opacity: 1; }
          33% { transform: scale(1.05, 0.95); opacity: 0.85; }
          66% { transform: scale(0.95, 1.06); opacity: 1; }
        }
        @keyframes flicker-core {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1, 0.92); }
        }
        :global(.flame-flicker-outer) {
          animation: flicker-outer 1.4s ease-in-out infinite;
        }
        :global(.flame-flicker-inner) {
          animation: flicker-inner 0.9s ease-in-out infinite;
        }
        :global(.flame-flicker-core) {
          animation: flicker-core 0.7s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function shade(hex: string, percent: number): string {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return hex;
  const [r, g, b] = m.map((h) => parseInt(h, 16));
  const adj = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c + (c * percent) / 100)));
  return `#${[adj(r), adj(g), adj(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
