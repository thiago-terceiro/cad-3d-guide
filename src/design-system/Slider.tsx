import { useId } from "react";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  accentColor?: "cyan" | "amber" | "emerald";
  onChange: (value: number) => void;
}

const accentStyles = {
  cyan: "accent-[#22D3EE]",
  amber: "accent-[#FBBF24]",
  emerald: "accent-[#34D399]",
};

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  accentColor = "cyan",
  onChange,
}: SliderProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-[#E2E8F0]">
          {label}
        </label>
        <span className="font-mono text-sm font-semibold text-[#67E8F9] tabular-nums">
          {Number.isInteger(step) ? value : value.toFixed(2)}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <div className="flex min-h-[44px] items-center">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#1F2937] ${accentStyles[accentColor]}`}
        />
      </div>
    </div>
  );
}
