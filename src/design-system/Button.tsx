import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "emerald" | "amber" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[#22D3EE] text-[#090D16] hover:bg-[#67E8F9] font-semibold border border-[#22D3EE]",
  secondary: "bg-[#111827] text-[#F1F5F9] hover:bg-[#1F2937] border border-[#374151] font-medium",
  emerald: "bg-[#34D399] text-[#090D16] hover:bg-[#6EE7B7] font-semibold border border-[#34D399]",
  amber: "bg-[#FBBF24] text-[#090D16] hover:bg-[#FCD34D] font-semibold border border-[#FBBF24]",
  ghost: "bg-transparent text-[#E2E8F0] hover:bg-[#1F2937] border border-transparent font-medium",
};

/**
 * Accessible design-system Button with guaranteed 44x44px minimum touch target.
 */
export function Button({
  variant = "secondary",
  children,
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
