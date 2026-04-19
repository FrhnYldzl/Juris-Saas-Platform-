import { cn } from "@/lib/utils";

/**
 * Juris brand mark: "j" in a red square, matching kurumsal kimlik.
 */
export function BrandMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center text-white select-none",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: "var(--juris-red)",
        borderRadius: Math.max(4, size * 0.1),
        fontFamily: "var(--font-playfair), 'Playfair Display', Georgia, serif",
        fontWeight: 500,
        fontSize: size * 0.6,
        lineHeight: 1,
        letterSpacing: "-0.02em",
        paddingBottom: size * 0.05,
      }}
    >
      j
    </div>
  );
}

/** Full logo: mark + "juris" wordmark */
export function BrandLogo({
  size = 40,
  variant = "light",
  withTagline = false,
}: {
  size?: number;
  variant?: "light" | "dark";
  withTagline?: boolean;
}) {
  const color = variant === "light" ? "#FFFFFF" : "var(--juris-navy)";
  const tagColor = variant === "light" ? "rgba(255,255,255,0.5)" : "var(--ink-3)";

  return (
    <div className="flex items-center gap-3">
      <BrandMark size={size} />
      <div className="flex flex-col leading-none">
        <span
          style={{
            fontFamily: "var(--font-playfair), 'Playfair Display', Georgia, serif",
            fontSize: size * 0.9,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color,
          }}
        >
          juris
        </span>
        {withTagline && (
          <span
            style={{
              fontSize: Math.max(9, size * 0.22),
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: tagColor,
              fontWeight: 600,
              marginTop: size * 0.12,
            }}
          >
            Platform
          </span>
        )}
      </div>
    </div>
  );
}
