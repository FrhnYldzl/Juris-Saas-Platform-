import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";

export type Crumb = {
  label: string;
  href?: string;
};

/**
 * Consistent breadcrumb trail for detail pages.
 *
 * Usage:
 * <Breadcrumb crumbs={[
 *   { label: "Operasyonlar", href: "/ops" },
 *   { label: matter.matterNumber },
 * ]} />
 */
export function Breadcrumb({
  crumbs, back,
}: {
  crumbs: Crumb[];
  /** Optional explicit back target; defaults to first crumb if it has href */
  back?: string;
}) {
  const backHref = back ?? crumbs[0]?.href;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-3 flex-wrap">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-juris-ink-3 hover:text-juris-red transition-colors group"
        >
          <ChevronLeft size={12} className="transition-transform group-hover:-translate-x-0.5" />
          Geri
        </Link>
      )}
      {backHref && <span className="w-px h-3 bg-juris-line" />}
      <ol className="flex items-center gap-1 text-[11.5px] text-juris-ink-4">
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1">
              {c.href && !isLast ? (
                <Link href={c.href} className="text-juris-ink-3 hover:text-juris-navy font-medium">
                  {c.label}
                </Link>
              ) : (
                <span className={isLast ? "text-juris-navy font-semibold" : "text-juris-ink-3"}>
                  {c.label}
                </span>
              )}
              {!isLast && <ChevronRight size={10} className="opacity-70" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
