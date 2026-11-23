import { X } from "lucide-react";
import { type ReactNode, useEffect } from "react";

interface DrawerProps {
  open: boolean;
  title: string;
  subtitle?: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}

export function Drawer({ open, title, subtitle, closeLabel, onClose, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#000000]/75 backdrop-blur-xs"
      onClick={onClose}
      role="presentation"
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-2xl flex-col border-l border-[#1F2937] bg-[#090D16] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#1F2937] bg-[#111827] px-6 py-4">
          <div>
            {subtitle && (
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-[#67E8F9]">
                {subtitle}
              </p>
            )}
            <h2 id="drawer-title" className="mt-1 text-xl font-bold text-[#F8FAFC]">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#374151] bg-[#090D16] text-[#E2E8F0] transition-colors hover:border-[#22D3EE] hover:text-[#67E8F9]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div
          tabIndex={0}
          role="region"
          aria-label={title}
          className="flex-1 space-y-6 overflow-y-auto p-6"
        >
          {children}
        </div>
      </aside>
    </div>
  );
}
