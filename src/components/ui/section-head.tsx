import { cn } from "@/lib/utils";

export function SectionHead({
  title,
  subtitle,
  actions,
  small,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  small?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-end justify-between",
        small ? "mb-3.5" : "mb-5",
        className,
      )}
    >
      <div>
        <h3
          className={cn(
            "display text-juris-navy m-0",
            small ? "text-lg" : "text-[22px]",
          )}
        >
          {title}
        </h3>
        {subtitle && <div className="text-xs text-juris-ink-3 mt-1">{subtitle}</div>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
