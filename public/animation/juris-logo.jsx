// juris-logo.jsx
// Juris konuşma baloncuğu sembolü — SVG olarak yeniden çizildi.
// Renkler: #BC2F2C (kırmızı) ve #0A2240 (lacivert)
// Ana şekil: tepeye doğru açılan, tabanında bir kuyruğu olan konuşma baloncuğu.

function JurisBubble({ size = 120, red = '#BC2F2C', navy = '#0A2240', style = {} }) {
  // Baloncuk: yuvarlak köşeli dörtgen + sol alt kuyruk
  // Kırmızı alt tabaka hafif sağa-aşağı kaydırılmış → derinlik hissi
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      style={{ overflow: 'visible', ...style }}
    >
      <defs>
        <clipPath id="bubbleClip">
          <path d="M 40 30
                   Q 40 18, 52 18
                   L 168 18
                   Q 180 18, 180 30
                   L 180 130
                   Q 180 142, 168 142
                   L 90 142
                   L 62 172
                   L 72 142
                   L 52 142
                   Q 40 142, 40 130
                   Z" />
        </clipPath>
      </defs>

      {/* Kırmızı alt baloncuk (hafif ofsetli) */}
      <g transform="translate(8,8)">
        <path
          d="M 40 30
             Q 40 18, 52 18
             L 168 18
             Q 180 18, 180 30
             L 180 130
             Q 180 142, 168 142
             L 90 142
             L 62 172
             L 72 142
             L 52 142
             Q 40 142, 40 130
             Z"
          fill={red}
        />
      </g>

      {/* Lacivert üst baloncuk */}
      <path
        d="M 40 30
           Q 40 18, 52 18
           L 168 18
           Q 180 18, 180 30
           L 180 130
           Q 180 142, 168 142
           L 90 142
           L 62 172
           L 72 142
           L 52 142
           Q 40 142, 40 130
           Z"
        fill={navy}
      />
    </svg>
  );
}

// Juris logotype = sembol + Playfair "Juris" yazısı
function JurisLogotype({ height = 56, red = '#BC2F2C', navy = '#0A2240', showTagline = true }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: height * 0.22,
      color: navy,
    }}>
      <JurisBubble size={height} red={red} navy={navy} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <div style={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontWeight: 700,
          fontSize: height * 0.95,
          letterSpacing: '-0.01em',
          color: navy,
        }}>
          Juris
        </div>
        {showTagline && (
          <div style={{
            fontFamily: '"Gilroy", "Inter", sans-serif',
            fontWeight: 700,
            fontSize: height * 0.18,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: navy,
            marginTop: height * 0.08,
          }}>
            Avukatlık Ortaklığı
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { JurisBubble, JurisLogotype });
