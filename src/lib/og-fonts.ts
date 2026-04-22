/**
 * Font loader for next/og ImageResponse.
 *
 * We fetch Playfair Display + Inter from Google Fonts once per cold boot.
 * The ArrayBuffer is cached module-level so repeat calls within the same
 * serverless instance are free.
 */

let cached:
  | {
      playfair: ArrayBuffer;
      inter: ArrayBuffer;
      interBold: ArrayBuffer;
    }
  | null = null;

// Direct font binaries — these URLs are stable Google Fonts CDN endpoints
const PLAYFAIR_URL   = "https://github.com/google/fonts/raw/main/ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf";
const INTER_URL      = "https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf";
const INTER_BOLD_URL = "https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf";

export async function loadOgFonts() {
  if (cached) return cached;
  try {
    const [playfair, inter, interBold] = await Promise.all([
      fetch(PLAYFAIR_URL).then((r) => {
        if (!r.ok) throw new Error("playfair fetch failed");
        return r.arrayBuffer();
      }),
      fetch(INTER_URL).then((r) => {
        if (!r.ok) throw new Error("inter fetch failed");
        return r.arrayBuffer();
      }),
      fetch(INTER_BOLD_URL).then((r) => {
        if (!r.ok) throw new Error("inter bold fetch failed");
        return r.arrayBuffer();
      }),
    ]);
    cached = { playfair, inter, interBold };
    return cached;
  } catch {
    // Font fetch failed — ImageResponse will fall back to Satori's built-in
    // DejaVu which supports Turkish. We just return null so the caller omits
    // fonts from the response.
    return null;
  }
}

export const BRAND = {
  navy:      "#0A2240",
  navyDeep:  "#051834",
  navyLight: "#1a3558",
  red:       "#BC2F2C",
  redDark:   "#8A1F1D",
  green:     "#1F7A4E",
  amber:     "#B4701C",
  paper:     "#FBFAF7",
  paperCool: "#F4F6FA",
  ink:       "#1F2933",
  ink2:      "#415063",
  ink3:      "#5A6B82",
  ink4:      "#8895AB",
  line:      "#E5E9F0",
};
