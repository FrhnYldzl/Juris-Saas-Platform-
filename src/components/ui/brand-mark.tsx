import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Juris Avukatlık Ortaklığı — Resmi Marka Varlıkları
 *
 * Kurumsal kimlik rehberine göre:
 *  - Tam logo (wordmark + "Attorney Partnership" altyazısı)
 *  - "J" sembolü (kompakt yerler için — sidebar collapsed, favicon)
 *  - Koyu zemin üstünde: white varyant · Açık zemin üstünde: color varyant
 */

interface LogoProps {
  variant?: "color" | "white";
  className?: string;
  priority?: boolean;
}

/** Tam logo (wordmark + altyazı). Login ekranı, landing, e-posta şablonu. */
export function JurisLogo({
  height = 48,
  variant = "color",
  className,
  priority = false,
}: LogoProps & { height?: number }) {
  // Logo oranı: ~400:255 (w:h), altyazıyla birlikte
  const width = Math.round(height * (400 / 255));
  const src = variant === "white" ? "/brand/juris-logo-white.png" : "/brand/juris-logo-color.png";
  return (
    <Image
      src={src}
      alt="Juris Avukatlık Ortaklığı"
      width={width}
      height={height}
      className={cn("select-none", className)}
      priority={priority}
    />
  );
}

/** "J" sembolü — kompakt. Sidebar (collapsed), favicon, avatar placeholder. */
export function JurisMark({
  size = 32,
  variant = "color",
  className,
  priority = false,
}: LogoProps & { size?: number }) {
  const src = variant === "white" ? "/brand/j-symbol-white.png" : "/brand/j-symbol-color.png";
  // "J" sembolü ~0.55 oranlı (w:h)
  const width = Math.round(size * 0.55);
  return (
    <Image
      src={src}
      alt="Juris"
      width={width}
      height={size}
      className={cn("select-none", className)}
      priority={priority}
      style={{ width: "auto", height: size }}
    />
  );
}
