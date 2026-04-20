import { cn } from "@/lib/utils";

/**
 * Subtle shimmer skeleton — matches Platform.html's SkeletonRow/Card/Kpi
 * while loading dashboards.
 */
export function Skeleton({
  w = "100%", h = 12, r = 3, className,
}: {
  w?: string | number;
  h?: string | number;
  r?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("animate-[juris-shimmer_1.6s_linear_infinite]", className)}
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background:
          "linear-gradient(90deg, #EEF1F6 0%, #F5F7FB 50%, #EEF1F6 100%)",
        backgroundSize: "200% 100%",
      }}
    />
  );
}

export function SkeletonKpi() {
  return (
    <div className="card p-5">
      <Skeleton w="40%" h={10} className="mb-2.5" />
      <Skeleton w="55%" h={28} r={4} />
      <Skeleton w="35%" h={10} className="mt-2" />
    </div>
  );
}

export function SkeletonRow({ cols = 5, last = true }: { cols?: number; last?: boolean }) {
  return (
    <div
      className="grid px-5 py-3.5 gap-4"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        borderBottom: last ? "1px solid #EEF1F6" : undefined,
      }}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} w={`${60 - i * 5}%`} h={12} />
      ))}
    </div>
  );
}

export function SkeletonCard({ lines = 3, h }: { lines?: number; h?: number }) {
  return (
    <div className="card p-6" style={h ? { minHeight: h } : undefined}>
      <Skeleton w="35%" h={14} className="mb-4" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} w={`${80 - i * 10}%`} h={10} className="mb-2.5" />
      ))}
    </div>
  );
}

/** Full-page loading placeholder for dashboard routes */
export function DashboardSkeleton() {
  return (
    <div className="px-6 py-8 max-w-[1440px] mx-auto">
      <Skeleton w="40%" h={14} className="mb-2.5" />
      <Skeleton w="62%" h={34} r={4} className="mb-3" />
      <Skeleton w="48%" h={12} className="mb-7" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <SkeletonKpi />
        <SkeletonKpi />
        <SkeletonKpi />
        <SkeletonKpi />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <SkeletonCard lines={4} h={240} />
        </div>
        <SkeletonCard lines={3} h={240} />
      </div>

      <div className="card overflow-hidden">
        <SkeletonRow cols={5} />
        <SkeletonRow cols={5} />
        <SkeletonRow cols={5} />
        <SkeletonRow cols={5} last={false} />
      </div>
    </div>
  );
}
