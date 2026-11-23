interface SectionSkeletonProps {
  /** Anchor id of the section being loaded, so in-page nav links still resolve while it streams in. */
  id: string;
}

/**
 * Fixed-height placeholder shown while a code-split section loads.
 * Reserving the space up front keeps Cumulative Layout Shift at zero.
 */
export function SectionSkeleton({ id }: SectionSkeletonProps) {
  return (
    <section
      id={id}
      aria-busy="true"
      data-testid={`skeleton-${id}`}
      className="min-h-[720px] border-b border-[#1F2937] bg-[#090D16] py-12 sm:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="h-8 w-64 rounded-md bg-[#111827] motion-safe:animate-pulse" />
        <div className="mt-8 h-[520px] rounded-xl border border-[#1F2937] bg-[#111827] motion-safe:animate-pulse" />
      </div>
    </section>
  );
}
