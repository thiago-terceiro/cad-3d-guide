import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  accent?: "none" | "cyan" | "amber" | "emerald" | "red";
}

const accentBorders: Record<NonNullable<CardProps["accent"]>, string> = {
  none: "border-[#1F2937]",
  cyan: "border-[#06B6D4]/60 shadow-[0_0_24px_-12px_rgba(6,182,212,0.45)]",
  amber: "border-[#F59E0B]/60 shadow-[0_0_24px_-12px_rgba(245,158,11,0.45)]",
  emerald: "border-[#10B981]/60 shadow-[0_0_24px_-12px_rgba(16,185,129,0.45)]",
  red: "border-[#EF4444]/60 shadow-[0_0_24px_-12px_rgba(239,68,68,0.45)]",
};

/**
 * Industrial surface card (#111827) with crisp 1px border.
 */
export function Card({ children, className = "", accent = "none" }: CardProps) {
  return (
    <div className={`rounded-xl border bg-[#111827] ${accentBorders[accent]} ${className}`}>
      {children}
    </div>
  );
}
