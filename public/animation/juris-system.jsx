// juris-system.jsx — design tokens + primitives
const JURIS = {
  // Core brand
  red: '#E63946',       // daha canlı, teknoloji hissi için
  redDeep: '#BC2F2C',   // orijinal pantone
  redGlow: '#FF5C6C',
  navy: '#0A2240',      // orijinal pantone
  navyDeep: '#05152A',
  navyMid: '#0F2A52',
  // Canvas
  bg: '#030711',
  bgMid: '#060D1F',
  surface: '#0B1629',
  // Light
  ink: '#E8ECF4',
  inkMute: 'rgba(232,236,244,0.58)',
  inkFaint: 'rgba(232,236,244,0.28)',
  // Grid/rule
  rule: 'rgba(232,236,244,0.08)',
  ruleStrong: 'rgba(232,236,244,0.18)',
  // Accent tints — Juris paletinden türetilmiş yakın tonlar
  // (navy #0A2240 + red #BC2F2C etrafında)
  accents: {
    trade:  '#E63946',  // Juris kırmızısının canlı versiyonu
    it:     '#5B8DEF',  // navy'den çıkarılmış parlak mavi
    fin:    '#D9A441',  // brick-red / navy ile uyumlu sıcak altın
    sector: '#C24D5F',  // navy + red arası mercan-mor
  },
};

// Typography helpers
const SERIF = '"Playfair Display", "Source Serif Pro", Georgia, serif';
const SANS = '"Inter", "Gilroy", system-ui, sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace';

// Authentic Juris bubble — gerçek logo PNG'si, marka rengi
function JurisMark({ size = 120, red, bright = true }) {
  // bright=true → canlı kırmızı (koyu tuval için), false → marka brick kırmızısı
  const src = bright ? 'juris-bubble-bright.png' : 'juris-bubble.png';
  // PNG oranı 90x112 → aspect 0.803
  const h = size * (112 / 90);
  return (
    <img
      src={src}
      width={size} height={h}
      alt=""
      style={{ display: 'block', userSelect: 'none', pointerEvents: 'none' }}
      draggable={false}
    />
  );
}

// Outline kullanımı şu an yok ama API uyumluluğu için tutalım
function JurisMarkOutline({ size = 120, color }) {
  return <JurisMark size={size} />;
}

// Yazı logotype
function JurisLogotype({ height = 40, color = JURIS.ink, subColor = JURIS.inkMute }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: height * 0.3,
    }}>
      <JurisMark size={height * 1.2} red={JURIS.red} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <div style={{
          fontFamily: SERIF, fontWeight: 700,
          fontSize: height, color,
          letterSpacing: '-0.015em',
        }}>
          Juris
        </div>
        <div style={{
          fontFamily: SANS, fontWeight: 500,
          fontSize: height * 0.2, color: subColor,
          letterSpacing: '0.36em', textTransform: 'uppercase',
          marginTop: height * 0.12,
        }}>
          Avukatlık Ortaklığı
        </div>
      </div>
    </div>
  );
}

// Grid background — teknolojik zemin
function GridBackground({ opacity = 0.6 }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      backgroundColor: JURIS.bg,
      backgroundImage: `
        radial-gradient(ellipse 90% 60% at 50% 40%, ${JURIS.navyMid}55 0%, transparent 60%),
        linear-gradient(rgba(232,236,244,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(232,236,244,0.04) 1px, transparent 1px)
      `,
      backgroundSize: '100% 100%, 80px 80px, 80px 80px',
      opacity,
    }}>
      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at center, transparent 40%, ${JURIS.bg} 100%)`,
      }} />
      {/* Noise */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.06,
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='3'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>")`,
        mixBlendMode: 'overlay',
      }} />
    </div>
  );
}

// HUD chrome — SaaS interface hissi, tarih + timestamp + koordinat
function HudChrome({ sceneLabel, sceneNum, total, time }) {
  const timeStr = `T+${time.toFixed(2).padStart(5, '0')}s`;
  return (
    <>
      {/* Top-left: system label + scene */}
      <div style={{
        position: 'absolute', top: 40, left: 60,
        display: 'flex', alignItems: 'center', gap: 16,
        fontFamily: MONO, fontSize: 11,
        color: JURIS.inkMute, letterSpacing: '0.1em',
      }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: JURIS.red,
                      boxShadow: `0 0 12px ${JURIS.red}` }} />
        <span style={{ color: JURIS.ink, fontWeight: 600 }}>JURIS / STRATEJI.SYS</span>
        <span style={{ color: JURIS.inkFaint }}>•</span>
        <span>{sceneLabel}</span>
      </div>
      {/* Top-right: counter */}
      <div style={{
        position: 'absolute', top: 40, right: 60,
        display: 'flex', alignItems: 'center', gap: 16,
        fontFamily: MONO, fontSize: 11,
        color: JURIS.inkMute, letterSpacing: '0.1em',
      }}>
        <span>{timeStr}</span>
        <span style={{ color: JURIS.inkFaint }}>•</span>
        <span style={{ color: JURIS.ink, fontWeight: 600 }}>
          {String(sceneNum).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </div>
      {/* Bottom-left: coordinates */}
      <div style={{
        position: 'absolute', bottom: 40, left: 60,
        fontFamily: MONO, fontSize: 10,
        color: JURIS.inkFaint, letterSpacing: '0.15em',
      }}>
        LAT 39.9334° N · LON 32.8597° E · ANKARA
      </div>
      {/* Bottom-right: tagline */}
      <div style={{
        position: 'absolute', bottom: 40, right: 60,
        fontFamily: SANS, fontSize: 11, fontWeight: 500,
        color: JURIS.inkMute, letterSpacing: '0.28em', textTransform: 'uppercase',
      }}>
        Hukuk · Merkezde
      </div>
    </>
  );
}

Object.assign(window, { JURIS, SERIF, SANS, MONO, JurisMark, JurisMarkOutline, JurisLogotype, GridBackground, HudChrome });
