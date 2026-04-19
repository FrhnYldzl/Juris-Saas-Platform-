import { initials } from "@/lib/utils";

export function Avatar({
  name,
  size = 32,
  color = "#BC2F2C",
  src,
}: {
  name: string;
  size?: number;
  color?: string;
  src?: string | null;
}) {
  if (src) {
    /* eslint-disable-next-line @next/next/no-img-element */
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center font-semibold text-white rounded-full"
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: size * 0.38,
        letterSpacing: "0.02em",
      }}
    >
      {initials(name)}
    </div>
  );
}
