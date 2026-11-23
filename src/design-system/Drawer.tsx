import { X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef } from "react";

interface DrawerProps {
  open: boolean;
  title: string;
  subtitle?: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Accessible slide-over drawer (WAI-ARIA modal dialog pattern):
 * - moves focus into the dialog on open and restores it to the trigger on close
 * - traps Tab / Shift+Tab inside the panel
 * - closes on Escape or on a backdrop click
 */
export function Drawer({ open, title, subtitle, closeLabel, onClose, children }: DrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        data-testid="drawer-backdrop"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-[#000000]/75 backdrop-blur-xs motion-safe:animate-[fade-in_200ms_ease-out]"
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-full w-full max-w-2xl flex-col border-l border-[#1F2937] bg-[#090D16] shadow-2xl motion-safe:animate-[drawer-in_320ms_cubic-bezier(0.22,1,0.36,1)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#1F2937] bg-[#111827] px-6 py-4">
          <div>
            {subtitle && (
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-[#67E8F9]">
                {subtitle}
              </p>
            )}
            <h2 id={titleId} className="mt-1 text-xl font-bold text-[#F8FAFC]">
              {title}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#374151] bg-[#090D16] text-[#E2E8F0] transition-colors hover:border-[#22D3EE] hover:text-[#67E8F9]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <section tabIndex={0} aria-label={title} className="flex-1 space-y-6 overflow-y-auto p-6">
          {children}
        </section>
      </aside>
    </div>
  );
}
