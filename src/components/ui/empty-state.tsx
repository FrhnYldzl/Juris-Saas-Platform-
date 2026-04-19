import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

export function EmptyState({
  icon: Icon = Construction,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-juris-navy-100 flex items-center justify-center text-juris-ink-3 mb-4">
        <Icon size={26} />
      </div>
      <h3 className="display text-xl text-juris-navy mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-juris-ink-3 max-w-md leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
