import type { ReactNode } from "react";

export type BadgeTone = "cyan" | "amber" | "emerald" | "red" | "neutral";

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  cyan: "border-[#06B6D4]/50 bg-[#083344]/80 text-[#67E8F9]",
  amber: "border-[#F59E0B]/50 bg-[#451A03]/80 text-[#FDE68A]",
  emerald: "border-[#10B981]/50 bg-[#064E3B]/80 text-[#6EE7B7]",
  red: "border-[#EF4444]/50 bg-[#450A0A]/80 text-[#FCA5A5]",
  neutral: "border-[#374151] bg-[#1F2937]/80 text-[#E2E8F0]",
};

export function Badge({ tone = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-xs font-medium tracking-wide ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
