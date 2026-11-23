import { Cpu, Globe } from "lucide-react";
import { useTranslation } from "@/i18n/I18nContext";
import type { Locale } from "@/i18n/translations";

const locales: { id: Locale; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "pt-BR", label: "PT-BR" },
  { id: "es", label: "ES" },
];

interface NavbarProps {
  activePage: "lab" | "examples";
  onNavigatePage: (page: "lab" | "examples") => void;
}

export function Navbar({ activePage, onNavigatePage }: NavbarProps) {
  const { locale, setLocale, t } = useTranslation();

  const navItems = [
    { href: "#architecture", label: t.nav.architecture },
    { href: "#cad-studio", label: t.nav.cadStudio },
    { href: "#physics-fea", label: t.nav.physicsFea },
    { href: "#slicer", label: t.nav.slicer },
    { href: "#tech-guide", label: t.nav.techGuide },
    { href: "#curriculum", label: t.nav.curriculum },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[#1F2937] bg-[#090D16]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigatePage("lab")}
          className="flex min-h-[44px] items-center gap-2.5 rounded-lg px-2 text-[#F8FAFC] hover:text-[#67E8F9]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#06B6D4]/50 bg-[#083344] text-[#67E8F9]">
            <Cpu className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-mono text-sm font-bold tracking-tight">{t.appTitle}</span>
        </button>

        <nav aria-label="Primary sections" className="hidden items-center gap-1 lg:flex">
          {activePage === "lab" ? (
            navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="inline-flex min-h-[44px] items-center rounded-lg px-3 text-xs font-medium text-[#CBD5E1] transition-colors hover:bg-[#111827] hover:text-[#67E8F9]"
              >
                {item.label}
              </a>
            ))
          ) : (
            <button
              type="button"
              onClick={() => onNavigatePage("lab")}
              className="inline-flex min-h-[44px] items-center rounded-lg px-3 text-xs font-medium text-[#CBD5E1] transition-colors hover:bg-[#111827] hover:text-[#67E8F9]"
            >
              {t.nav.mainLabPage}
            </button>
          )}
          <button
            type="button"
            aria-pressed={activePage === "examples"}
            onClick={() => onNavigatePage(activePage === "examples" ? "lab" : "examples")}
            className={`ml-1 inline-flex min-h-[44px] items-center rounded-lg border px-3 font-mono text-xs font-semibold transition-colors ${
              activePage === "examples"
                ? "border-[#22D3EE] bg-[#083344] text-[#67E8F9]"
                : "border-[#374151] bg-[#111827] text-[#FDE68A] hover:border-[#22D3EE]"
            }`}
          >
            {t.nav.examplesPage}
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-pressed={activePage === "examples"}
            onClick={() => onNavigatePage(activePage === "examples" ? "lab" : "examples")}
            className="inline-flex min-h-[44px] items-center rounded-lg border border-[#374151] bg-[#111827] px-3 font-mono text-xs font-semibold text-[#FDE68A] lg:hidden"
          >
            {activePage === "examples" ? t.nav.mainLabPage : t.nav.examplesPage}
          </button>

          <fieldset
            className="flex items-center gap-1.5 border-0 p-0 m-0"
            aria-label={t.nav.languageLabel}
          >
            <Globe className="mr-1 h-4 w-4 text-[#94A3B8]" aria-hidden="true" />
            {locales.map((item) => {
              const active = locale === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setLocale(item.id)}
                  className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border px-2.5 font-mono text-xs font-semibold transition-colors ${
                    active
                      ? "border-[#22D3EE] bg-[#083344] text-[#67E8F9]"
                      : "border-[#1F2937] bg-[#111827] text-[#CBD5E1] hover:border-[#374151]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </fieldset>
        </div>
      </div>
    </header>
  );
}
