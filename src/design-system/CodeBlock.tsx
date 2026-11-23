import { Check, Copy } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "@/i18n/I18nContext";

interface CodeBlockProps {
  code: string;
  language?: "python" | "json" | "bash";
  title?: string;
  maxHeightClass?: string;
}

function highlightPythonLine(line: string): ReactNode[] {
  const tokens: ReactNode[] = [];
  const commentIndex = line.indexOf("#");
  const codePart = commentIndex >= 0 ? line.slice(0, commentIndex) : line;
  const commentPart = commentIndex >= 0 ? line.slice(commentIndex) : "";

  const regex =
    /(\b(?:from|import|with|as|def|return|assert|if|else|for|in|True|False|None|class)\b|\b(?:BuildPart|BuildSketch|RegularPolygon|Circle|Rectangle|extrude|fillet|chamfer|Mode|Align|Location|export_step|export_stl)\b|"[^"]*"|'[^']*'|\b\d+(?:\.\d+)?\b)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null = regex.exec(codePart);
  let keyIdx = 0;

  while (match !== null) {
    if (match.index > lastIndex) {
      tokens.push(codePart.slice(lastIndex, match.index));
    }
    const word = match[0];
    let cls = "text-[#F1F5F9]";
    if (
      /^(from|import|with|as|def|return|assert|if|else|for|in|True|False|None|class)$/.test(word)
    ) {
      cls = "text-[#C084FC]";
    } else if (
      /^(BuildPart|BuildSketch|RegularPolygon|Circle|Rectangle|extrude|fillet|chamfer|Mode|Align|Location|export_step|export_stl)$/.test(
        word,
      )
    ) {
      cls = "text-[#67E8F9]";
    } else if (word.startsWith('"') || word.startsWith("'")) {
      cls = "text-[#6EE7B7]";
    } else if (/^\d/.test(word)) {
      cls = "text-[#FDE68A]";
    }
    tokens.push(
      <span key={keyIdx++} className={cls}>
        {word}
      </span>,
    );
    lastIndex = match.index + word.length;
    match = regex.exec(codePart);
  }

  if (lastIndex < codePart.length) {
    tokens.push(codePart.slice(lastIndex));
  }

  if (commentPart) {
    tokens.push(
      <span key="comment" className="text-[#94A3B8] italic">
        {commentPart}
      </span>,
    );
  }

  return tokens;
}

export function CodeBlock({
  code,
  language = "python",
  title,
  maxHeightClass = "max-h-[420px]",
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback for restricted clipboard contexts
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  const lines = code.split("\n");

  return (
    <div className="overflow-hidden rounded-xl border border-[#1F2937] bg-[#090D16]">
      <div className="flex items-center justify-between border-b border-[#1F2937] bg-[#111827] px-4 py-2">
        <span className="font-mono text-xs font-medium text-[#CBD5E1]">
          {title ?? language.toUpperCase()}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`${copied ? t.common.copied : t.common.copy} ${title ?? language}`}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-md border border-[#374151] bg-[#090D16] px-3 py-1.5 font-mono text-xs text-[#E2E8F0] transition-colors hover:border-[#22D3EE] hover:text-[#67E8F9]"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-[#6EE7B7]" aria-hidden="true" />
              <span className="text-[#6EE7B7]">{t.common.copied}</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.common.copy}</span>
            </>
          )}
        </button>
      </div>
      <section
        tabIndex={0}
        aria-label={title ?? `${language} code snippet`}
        className={`overflow-auto p-4 font-mono text-xs leading-relaxed text-[#F1F5F9] ${maxHeightClass}`}
      >
        <pre className="m-0">
          <code>
            {lines.map((line, idx) => (
              <div key={idx} className="table-row">
                <span className="table-cell select-none pr-4 text-right text-[#94A3B8]">
                  {idx + 1}
                </span>
                <span className="table-cell whitespace-pre">
                  {language === "python" ? highlightPythonLine(line) : line}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </section>
    </div>
  );
}
