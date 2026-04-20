// juris-scenes.jsx — art-directed, SaaS-caliber strategy animation
// Dark tech canvas, cinematic motion, 1920×1080, 50s total.

// ─────────────────────────────────────────────────────────────────────────
// SHARED: 4 discipline config
// ─────────────────────────────────────────────────────────────────────────
const DISCIPLINES = [
  { id: 'trade',  label: 'Dış Ticaret',    en: 'International Trade',  angle: -135, color: JURIS.accents.trade },
  { id: 'it',     label: 'Teknoloji',      en: 'Technology & Data',    angle: -45,  color: JURIS.accents.it },
  { id: 'sector', label: 'Sektörler',      en: 'Industry Practice',    angle: 45,   color: JURIS.accents.sector },
  { id: 'fin',    label: 'Finans',         en: 'Capital Markets',      angle: 135,  color: JURIS.accents.fin },
];

const SUB_BRANCHES = {
  trade:  ['Uluslararası Ticaret', 'Uluslararası Yatırım', 'E-İhracat', 'Gümrük & Yaptırımlar'],
  it:     ['KVKK & GDPR', 'Siber Güvenlik', 'Fikri Mülkiyet', 'Marka & Domain'],
  sector: ['Compliance', 'Enerji & Altyapı', 'İnşaat & Lojistik', 'Oyun & Sigorta'],
  fin:    ['Startup Hukuku', 'Sermaye Piyasaları', 'Fintech', 'Girişim Sermayesi'],
};

// Shared geometry
const CX = 960, CY = 540;

// Breathing ring — ambient orbits (dekoratif)
function AmbientRings({ time, rings = [180, 260, 360, 480] }) {
  return (
    <svg viewBox="0 0 1920 1080" width="1920" height="1080"
         style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {rings.map((r, i) => {
        const breathe = Math.sin(time * 0.6 + i * 1.2) * 3;
        return (
          <circle key={i} cx={CX} cy={CY} r={r + breathe}
                  fill="none" stroke={JURIS.ink}
                  strokeOpacity={0.08 - i * 0.012}
                  strokeWidth="1"
                  strokeDasharray={i % 2 === 0 ? '0' : '2 6'} />
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SCENE 1 — OPENING (0 – 7s)
// "Hukuk merkezde" — baloncuk belirir, ışıkla beraber
// ─────────────────────────────────────────────────────────────────────────
function SceneOpening({ start, end }) {
  return (
    <Sprite start={start} end={end}>
      {({ localTime }) => {
        const dur = end - start;
        const exitT = Math.max(0, (localTime - (dur - 0.8)) / 0.8);
        const exitOp = 1 - exitT;

        // Baloncuk scale + rise
        const bubbleT = Math.min(1, localTime / 1.4);
        const bubbleScale = interpolate([0, 1], [0.7, 1], Easing.easeOutCubic)(bubbleT);
        const bubbleOp = interpolate([0, 0.4, 1], [0, 1, 1])(bubbleT);

        // Glow pulse
        const glowPulse = 0.5 + Math.sin(localTime * 1.8) * 0.25;

        // Kicker
        const kickerT = Math.max(0, Math.min(1, (localTime - 1.2) / 0.6));
        // Title appearance — staggered words
        const words = ['Hukuk.', 'Merkezde.'];
        const t2 = Math.max(0, Math.min(1, (localTime - 1.8) / 0.6));
        const t3 = Math.max(0, Math.min(1, (localTime - 2.4) / 0.6));
        // Sub
        const subT = Math.max(0, Math.min(1, (localTime - 3.2) / 0.8));

        return (
          <div style={{ position: 'absolute', inset: 0, opacity: exitOp }}>
            {/* Radial glow behind bubble */}
            <div style={{
              position: 'absolute', left: '50%', top: '50%',
              width: 900, height: 900,
              transform: `translate(-50%, -50%) scale(${bubbleScale})`,
              background: `radial-gradient(circle, ${JURIS.red}35 0%, ${JURIS.red}10 30%, transparent 60%)`,
              opacity: bubbleOp * glowPulse,
              filter: 'blur(8px)',
            }} />

            {/* Authentic Juris bubble */}
            <div style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: `translate(-50%, -50%) scale(${bubbleScale})`,
              opacity: bubbleOp,
              filter: `drop-shadow(0 0 40px ${JURIS.red}60) drop-shadow(0 20px 60px ${JURIS.navyDeep})`,
            }}>
              <JurisMark size={380} red={JURIS.red} />
            </div>

            {/* Kicker */}
            <div style={{
              position: 'absolute', left: '50%', top: 'calc(50% + 260px)',
              transform: `translate(-50%, ${(1 - kickerT) * 8}px)`,
              opacity: kickerT,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 24, height: 1, background: JURIS.red }} />
              <span style={{
                fontFamily: MONO, fontSize: 11, fontWeight: 500,
                color: JURIS.red, letterSpacing: '0.3em', textTransform: 'uppercase',
              }}>
                2026 · Juris Strategy Platform
              </span>
              <div style={{ width: 24, height: 1, background: JURIS.red }} />
            </div>

            {/* Main title */}
            <div style={{
              position: 'absolute', left: '50%', top: 'calc(50% + 310px)',
              transform: 'translate(-50%, 0)',
              display: 'flex', gap: 24,
              fontFamily: SERIF, fontSize: 96, fontWeight: 700,
              color: JURIS.ink, letterSpacing: '-0.03em',
              lineHeight: 1,
            }}>
              <span style={{
                opacity: t2,
                transform: `translateY(${(1 - t2) * 18}px)`,
                transition: 'none',
              }}>
                {words[0]}
              </span>
              <span style={{
                opacity: t3,
                transform: `translateY(${(1 - t3) * 18}px)`,
                fontStyle: 'italic',
                color: JURIS.red,
              }}>
                {words[1]}
              </span>
            </div>

            {/* Sub */}
            <div style={{
              position: 'absolute', left: '50%', top: 'calc(50% + 430px)',
              transform: `translate(-50%, ${(1 - subT) * 8}px)`,
              opacity: subT,
              fontFamily: SANS, fontSize: 17, fontWeight: 400,
              color: JURIS.inkMute, letterSpacing: '0.02em',
              maxWidth: 680, textAlign: 'center',
            }}>
              Hukukun dört kesişim noktasında, Türkiye'den dünyaya.
            </div>
          </div>
        );
      }}
    </Sprite>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SCENE 2 — ORBIT + BRANCHES (7 – 35s)
// Merkezi tutup, 4 disiplin etrafa yerleşir; sonra her birinin alt dalları sıralı filizlenir.
// Tek sahne — daha kompakt, orbit sürekli görünür, metin aynı.
// ─────────────────────────────────────────────────────────────────────────
function SceneDisciplines({ start, end }) {
  return (
    <Sprite start={start} end={end}>
      {({ localTime }) => {
        const dur = end - start;
        const exitT = Math.max(0, (localTime - (dur - 0.8)) / 0.8);
        const exitOp = 1 - exitT;

        // ── Zamanlama (28s toplam, 7–35s) ─────────────────────────────
        // 0–2:   orbit + nodlar belirir
        // 2–4:   disiplin etiketleri tamamlanır
        // 4–26:  4 disiplin × 5.5s slot, her birinde alt dallar filizlenir
        // 26–28: sakin durum, geçişe hazırlık

        // Daha vurucu rotasyon + aktif disipline yumuşak yönelim
        const activeSlot = Math.max(0, Math.min(3, Math.floor((localTime - 4) / 5.5)));
        const isIntro = localTime < 4;
        const isFinale = localTime > 26;

        // Rotasyon: intro'da 14°/sn, odak modunda yavaşlayıp hedef açıya oturur
        let orbitRotation;
        if (isIntro) {
          orbitRotation = localTime * 14;
        } else if (!isFinale) {
          // Her slotta, aktif disiplini sağ tarafa (0°) getir
          const slotT = ((localTime - 4) - activeSlot * 5.5) / 5.5;
          const targetAngle = -DISCIPLINES[activeSlot].angle;
          // Smooth yerleşim
          const introAngle = 4 * 14;
          if (localTime < 4 + 0.8) {
            const t = (localTime - 4) / 0.8;
            orbitRotation = introAngle + (targetAngle - introAngle) * Easing.easeInOutCubic(t);
          } else {
            // Slot içinde hafif dalgalan (±2°)
            orbitRotation = targetAngle + Math.sin(localTime * 0.6) * 2;
            // Slot sonunda bir sonraki hedefe geçiş
            const nextSlot = activeSlot + 1;
            if (slotT > 0.85 && nextSlot < 4) {
              const t = (slotT - 0.85) / 0.15;
              const nextTarget = -DISCIPLINES[nextSlot].angle;
              orbitRotation = targetAngle + (nextTarget - targetAngle) * Easing.easeInOutCubic(t);
            }
          }
        } else {
          // Finale — yavaşça dönmeye devam
          orbitRotation = -DISCIPLINES[3].angle + (localTime - 26) * 6;
        }

        // Ring reveal
        const ringT = Math.max(0, Math.min(1, (localTime - 0.6) / 1.0));
        const orbitR = 300;

        return (
          <div style={{ position: 'absolute', inset: 0, opacity: exitOp }}>
            <AmbientRings time={localTime} />

            {/* Ana yörünge */}
            <svg viewBox="0 0 1920 1080" width="1920" height="1080"
                 style={{ position: 'absolute', inset: 0 }}>
              <defs>
                <linearGradient id="orbitGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={JURIS.red} stopOpacity="0.55" />
                  <stop offset="50%" stopColor={JURIS.ink} stopOpacity="0.18" />
                  <stop offset="100%" stopColor={JURIS.accents.it} stopOpacity="0.55" />
                </linearGradient>
              </defs>
              <circle cx={CX} cy={CY} r={orbitR}
                      fill="none" stroke="url(#orbitGrad)" strokeWidth="1.2"
                      pathLength="100" strokeDasharray="100"
                      strokeDashoffset={(1 - ringT) * 100}
                      transform={`rotate(-90 ${CX} ${CY})`} />
              <circle cx={CX} cy={CY} r={orbitR - 35} fill="none"
                      stroke={JURIS.rule} strokeWidth="1" strokeDasharray="1 6"
                      opacity={ringT * 0.9} />
              <circle cx={CX} cy={CY} r={orbitR + 55} fill="none"
                      stroke={JURIS.rule} strokeWidth="1" strokeDasharray="1 8"
                      opacity={ringT * 0.6} />
            </svg>

            {/* Merkez baloncuk */}
            <div style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: `translate(-50%, -50%) scale(${interpolate([0, 1.2], [1, 0.55], Easing.easeInOutCubic)(Math.min(1, localTime / 1.2))})`,
              filter: `drop-shadow(0 0 32px ${JURIS.red}50) drop-shadow(0 16px 40px ${JURIS.navyDeep})`,
            }}>
              <JurisMark size={260} red={JURIS.red} />
            </div>

            {/* Merkez etiket */}
            <div style={{
              position: 'absolute', left: '50%', top: 'calc(50% + 160px)',
              transform: 'translate(-50%, 0)',
              opacity: Math.max(0, Math.min(1, (localTime - 0.6) / 0.6)),
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: MONO, fontSize: 10, fontWeight: 500,
                color: JURIS.red, letterSpacing: '0.36em', textTransform: 'uppercase',
              }}>
                · CORE ·
              </div>
              <div style={{
                fontFamily: SERIF, fontSize: 34, fontWeight: 700,
                color: JURIS.ink, letterSpacing: '-0.01em',
                fontStyle: 'italic',
                marginTop: 6,
              }}>
                Hukuk
              </div>
            </div>

            {/* 4 node + alt dallar + etiketler */}
            {DISCIPLINES.map((d, i) => {
              const angle = d.angle + orbitRotation;
              const rad = (angle * Math.PI) / 180;
              const nx = CX + Math.cos(rad) * orbitR;
              const ny = CY + Math.sin(rad) * orbitR;
              // iç bağlantı noktası
              const innerR = 95;
              const lx = CX + Math.cos(rad) * innerR;
              const ly = CY + Math.sin(rad) * innerR;

              // Nod ortaya çıkışı
              const nodeStart = 1.8 + i * 0.3;
              const nodeT = Math.max(0, Math.min(1, (localTime - nodeStart) / 0.5));
              const nodeEased = Easing.easeOutBack(nodeT);

              // Aktif mi?
              const slotStart = 4 + i * 5.5;
              const slotEnd = slotStart + 5.5;
              const isActive = localTime >= slotStart + 0.8 && localTime < slotEnd;
              const focusT = isActive
                ? Math.max(0, Math.min(1, (localTime - slotStart - 0.8) / 0.6))
                : (localTime >= slotEnd ? Math.max(0, 1 - (localTime - slotEnd) / 0.4) : 0);

              // Node label: ilk belirir, aktifken büyür + renk dolu
              const labelR = orbitR + 58;
              const labelX = CX + Math.cos(rad) * labelR;
              const labelY = CY + Math.sin(rad) * labelR;
              const isLeft = Math.cos(rad) < -0.1;
              const isTop  = Math.sin(rad) < -0.1;
              const TW = 220;
              const tx = isLeft ? -(TW + 6) : 6;
              const ty = isTop ? -52 : 6;

              // Alt dallar — aktif slotta, sıralı filizlenir
              const subs = SUB_BRANCHES[d.id];

              return (
                <React.Fragment key={d.id}>
                  {/* Node SVG — line + rings */}
                  <svg viewBox="0 0 1920 1080" width="1920" height="1080"
                       style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    <line x1={lx} y1={ly} x2={nx} y2={ny}
                          stroke={d.color} strokeWidth="1"
                          strokeOpacity={0.5 * nodeT}
                          strokeDasharray="2 3" />
                    <circle cx={nx} cy={ny} r={(22 + focusT * 16) * nodeEased}
                            fill={d.color} opacity={0.16 + focusT * 0.14} />
                    <circle cx={nx} cy={ny} r={(13 + focusT * 5) * nodeEased}
                            fill={isActive ? d.color : 'none'}
                            stroke={d.color} strokeWidth="1.5"
                            opacity={nodeT} />
                    <circle cx={nx} cy={ny} r={(5 + focusT * 3) * nodeEased}
                            fill={isActive ? JURIS.bg : d.color}
                            opacity={nodeT} />
                  </svg>

                  {/* Node label */}
                  <div style={{
                    position: 'absolute',
                    left: `${(labelX / 1920) * 100}%`,
                    top: `${(labelY / 1080) * 100}%`,
                    transform: `translate(${tx}px, ${ty}px)`,
                    width: TW,
                    textAlign: isLeft ? 'right' : 'left',
                    opacity: nodeT,
                    pointerEvents: 'none',
                  }}>
                    <div style={{
                      fontFamily: MONO, fontSize: 10, fontWeight: 500,
                      color: d.color, letterSpacing: '0.28em', textTransform: 'uppercase',
                      marginBottom: 4,
                    }}>
                      {String(i + 1).padStart(2, '0')} · {d.en}
                    </div>
                    <div style={{
                      fontFamily: SERIF,
                      fontSize: 26 + focusT * 6,
                      fontWeight: 700,
                      color: isActive ? JURIS.ink : (focusT > 0 ? JURIS.ink : JURIS.inkMute),
                      letterSpacing: '-0.015em', lineHeight: 1,
                      transition: 'none',
                    }}>
                      {d.label}
                    </div>
                  </div>

                  {/* Alt dallar — sadece aktif disiplin için, tepenin dışına doğru */}
                  {focusT > 0 && subs.map((subLabel, j) => {
                    // Alt dal açısı: ana açının ±22° etrafına yayılır
                    const spread = 26;
                    const subAngle = angle + (j - (subs.length - 1) / 2) * (spread / (subs.length - 1));
                    const subRad = (subAngle * Math.PI) / 180;
                    const subDist = orbitR + 180;
                    const sx = CX + Math.cos(subRad) * subDist;
                    const sy = CY + Math.sin(subRad) * subDist;
                    // Start point on node
                    const sxStart = CX + Math.cos(subRad) * (orbitR + 15);
                    const syStart = CY + Math.sin(subRad) * (orbitR + 15);

                    const subStart = slotStart + 1.2 + j * 0.5;
                    const subT = Math.max(0, Math.min(1, (localTime - subStart) / 0.55));
                    if (subT <= 0) return null;
                    const subEased = Easing.easeOutCubic(subT);
                    // Exit fade
                    const subExitT = localTime > slotEnd
                      ? Math.max(0, 1 - (localTime - slotEnd) / 0.4)
                      : 1;
                    const alpha = subEased * subExitT;

                    // Çizgi animasyonu
                    const lineEx = sxStart + (sx - sxStart) * subEased;
                    const lineEy = syStart + (sy - syStart) * subEased;

                    const leftSide = Math.cos(subRad) < 0;
                    const labelOffX = leftSide ? -14 : 14;

                    return (
                      <React.Fragment key={`${d.id}-${j}`}>
                        <svg viewBox="0 0 1920 1080" width="1920" height="1080"
                             style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                          <line x1={sxStart} y1={syStart} x2={lineEx} y2={lineEy}
                                stroke={d.color} strokeWidth="1" strokeOpacity={alpha * 0.7} />
                          {subT > 0.7 && (
                            <circle cx={sx} cy={sy} r="4" fill={d.color} opacity={alpha} />
                          )}
                        </svg>
                        <div style={{
                          position: 'absolute',
                          left: `${(sx / 1920) * 100}%`,
                          top: `${(sy / 1080) * 100}%`,
                          transform: `translate(${leftSide ? -100 : 0}%, -50%) translateX(${labelOffX}px)`,
                          opacity: alpha,
                          fontFamily: SANS,
                          fontSize: 17, fontWeight: 500,
                          color: JURIS.ink,
                          letterSpacing: '-0.01em',
                          whiteSpace: 'nowrap',
                          textAlign: leftSide ? 'right' : 'left',
                          pointerEvents: 'none',
                        }}>
                          <span style={{
                            fontFamily: MONO, fontSize: 10, fontWeight: 500,
                            color: d.color, letterSpacing: '0.14em',
                            marginRight: leftSide ? 0 : 10,
                            marginLeft: leftSide ? 10 : 0,
                            opacity: 0.8,
                          }}>
                            {String(j + 1).padStart(2, '0')}
                          </span>
                          {subLabel}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}

            {/* Aktif disiplin için alt-başlık (sol-alt) */}
            {localTime >= 4 && localTime < 26 && (() => {
              const activeIdx = Math.max(0, Math.min(3, Math.floor((localTime - 4) / 5.5)));
              const d = DISCIPLINES[activeIdx];
              const slotStart = 4 + activeIdx * 5.5;
              const t = Math.max(0, Math.min(1, (localTime - slotStart - 0.6) / 0.6));
              const slotEnd = slotStart + 5.5;
              const exitT = localTime > slotEnd - 0.4
                ? Math.max(0, 1 - (localTime - (slotEnd - 0.4)) / 0.4)
                : 1;
              const alpha = t * exitT;
              const desc = {
                trade: "Sınır ötesi ticaret, yatırım ve e-ihracatta uçtan uca danışmanlık.",
                it: "Veri, platform ve fikri mülkiyette yeni nesil hukuk.",
                sector: "Enerji, altyapı ve düzenlenmiş sektörlerde uyum.",
                fin: "Sermaye piyasaları, fintech ve girişim sermayesinde strateji.",
              }[d.id];

              return (
                <div style={{
                  position: 'absolute', left: 90, bottom: 130,
                  opacity: alpha,
                  transform: `translateY(${(1 - t) * 10}px)`,
                  maxWidth: 440,
                }}>
                  <div style={{
                    fontFamily: MONO, fontSize: 11, fontWeight: 500,
                    color: d.color, letterSpacing: '0.3em', textTransform: 'uppercase',
                    marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{ width: 18, height: 1, background: d.color }} />
                    0{activeIdx + 1} / 04 · {d.en}
                  </div>
                  <div style={{
                    fontFamily: SANS, fontSize: 15, color: JURIS.inkMute,
                    letterSpacing: '0.01em', lineHeight: 1.5,
                  }}>
                    {desc}
                  </div>
                </div>
              );
            })()}

            {/* Progress dots — sağ alt */}
            {localTime >= 3.5 && (
              <div style={{
                position: 'absolute', right: 90, bottom: 130,
                display: 'flex', gap: 10, alignItems: 'center',
                opacity: Math.max(0, Math.min(1, (localTime - 3.5) / 0.6)),
              }}>
                {DISCIPLINES.map((x, ix) => {
                  const active = localTime >= 4 + ix * 5.5 && localTime < 4 + (ix + 1) * 5.5;
                  return (
                    <div key={x.id} style={{
                      width: active ? 32 : 8, height: 2,
                      background: active ? x.color : JURIS.rule,
                      transition: 'all 300ms',
                    }} />
                  );
                })}
              </div>
            )}
          </div>
        );
      }}
    </Sprite>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SCENE 4 — GLOBAL REACH (32 – 43s)
// Dot-matrix world map, Türkiye merkezli ışık hatları.
// ─────────────────────────────────────────────────────────────────────────
const WORLD_DOTS = (() => {
  // Elle yerleştirilmiş seyrek noktalar, 1000×500 viewBox
  const NA = [[110,115],[135,110],[160,115],[185,120],[210,130],[105,135],[130,135],[155,135],[185,140],[215,150],[100,155],[130,155],[160,160],[195,165],[225,175],[115,175],[145,180],[175,185],[210,195],[130,200],[165,210],[200,220],[150,230],[185,240],[170,255],[195,260]];
  const SA = [[255,300],[275,305],[290,315],[265,320],[285,330],[300,340],[275,350],[295,360],[285,380],[270,395],[280,410],[265,425]];
  const EU = [[460,135],[480,130],[500,135],[470,150],[490,150],[510,145],[475,165],[495,165],[515,160],[455,175],[480,175]];
  const AF = [[495,210],[515,215],[535,220],[490,235],[510,235],[530,240],[550,245],[495,260],[520,265],[545,270],[505,285],[530,290],[555,295],[515,315],[540,320],[525,345],[545,345],[500,365]];
  const AS = [[555,115],[585,110],[615,108],[645,105],[680,105],[715,108],[750,112],[785,118],[815,125],[570,135],[605,130],[640,128],[680,128],[720,130],[760,135],[795,140],[580,155],[620,155],[660,155],[700,160],[740,165],[775,170],[810,175],[600,180],[640,185],[685,190],[725,200],[765,210],[720,225],[750,235],[775,245]];
  const SEA = [[760,255],[785,260],[810,270],[740,270],[770,275],[800,285]];
  const AU = [[810,345],[835,340],[865,345],[895,355],[820,365],[850,365],[880,370],[830,385],[860,385]];
  return [...NA, ...SA, ...EU, ...AF, ...AS, ...SEA, ...AU];
})();

function SceneWorld({ start, end }) {
  // TR koordinatı (dot-matrix 1000×500 viewBox'ında)
  const TR = { x: 545, y: 152 };
  const DESTINATIONS = [
    { x: 150, y: 165, name: 'NYC',    delay: 2.0 },
    { x: 475, y: 140, name: 'LDN',    delay: 2.3 },
    { x: 780, y: 175, name: 'TOK',    delay: 2.6 },
    { x: 520, y: 290, name: 'NBO',    delay: 2.9 },
    { x: 710, y: 235, name: 'SNG',    delay: 3.2 },
    { x: 845, y: 365, name: 'SYD',    delay: 3.5 },
    { x: 290, y: 370, name: 'SAO',    delay: 3.8 },
  ];

  return (
    <Sprite start={start} end={end}>
      {({ localTime }) => {
        const dur = end - start;
        const exitT = Math.max(0, (localTime - (dur - 0.8)) / 0.8);
        const exitOp = 1 - exitT;

        // Map fade-in
        const mapT = Math.min(1, Math.max(0, (localTime - 0.2) / 1.2));

        // TR pulse
        const pulsePhase = (localTime * 1.0) % 1;

        // Heading reveal
        const hT = Math.min(1, Math.max(0, (localTime - 0.8) / 0.8));

        // Map placement: centered, lower half to leave room for title
        const mapW = 1400, mapH = 700;

        return (
          <div style={{ position: 'absolute', inset: 0, opacity: exitOp }}>
            {/* Title at top */}
            <div style={{
              position: 'absolute', left: 120, top: 160,
              opacity: hT,
              transform: `translateY(${(1 - hT) * 12}px)`,
              maxWidth: 720,
            }}>
              <div style={{
                fontFamily: MONO, fontSize: 11, fontWeight: 500,
                color: JURIS.red, letterSpacing: '0.3em', textTransform: 'uppercase',
                marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ width: 24, height: 1, background: JURIS.red }} />
                Global Reach · 04 / 05
              </div>
              <div style={{
                fontFamily: SERIF, fontSize: 82, fontWeight: 700,
                color: JURIS.ink, letterSpacing: '-0.03em', lineHeight: 1,
              }}>
                Türkiye'den
                <br />
                <span style={{ fontStyle: 'italic', color: JURIS.red }}>dünyaya.</span>
              </div>
              <div style={{
                marginTop: 24,
                fontFamily: SANS, fontSize: 17, color: JURIS.inkMute,
                letterSpacing: '0.02em', lineHeight: 1.5, maxWidth: 540,
              }}>
                Ankara merkezli, 40'tan fazla yargı bölgesinde çalışan
                ortak ağıyla sınır ötesi hukuk stratejisi.
              </div>
            </div>

            {/* Stats — sağ üst */}
            <div style={{
              position: 'absolute', right: 120, top: 160,
              opacity: hT,
              display: 'flex', gap: 48,
            }}>
              {[
                { val: '40+', label: 'Yargı Bölgesi' },
                { val: '04', label: 'Ana Disiplin' },
                { val: '16+', label: 'Alt Uzmanlık' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: MONO, fontSize: 48, fontWeight: 300,
                    color: JURIS.ink, letterSpacing: '-0.02em', lineHeight: 1,
                  }}>
                    {s.val}
                  </div>
                  <div style={{
                    fontFamily: MONO, fontSize: 10, color: JURIS.inkFaint,
                    letterSpacing: '0.24em', textTransform: 'uppercase',
                    marginTop: 8,
                  }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* World dot-map */}
            <div style={{
              position: 'absolute', left: '50%', bottom: 100,
              transform: 'translateX(-50%)',
              width: mapW, height: mapH,
              opacity: mapT,
            }}>
              <svg viewBox="0 0 1000 500" width="100%" height="100%">
                {/* Grid reference */}
                <g stroke={JURIS.ink} strokeOpacity="0.06" fill="none" strokeDasharray="2 6">
                  <line x1="0" y1="250" x2="1000" y2="250" />
                  <line x1="500" y1="0" x2="500" y2="500" />
                </g>

                {/* World dots — appear in waves */}
                {WORLD_DOTS.map(([x, y], i) => {
                  const waveDelay = (x / 1000) * 0.8;
                  const dotT = Math.max(0, Math.min(1, (localTime - 0.3 - waveDelay) / 0.6));
                  // TR near dot highlight
                  const distToTR = Math.hypot(x - TR.x, y - TR.y);
                  const nearTR = distToTR < 20;
                  return (
                    <circle key={i} cx={x} cy={y}
                            r={nearTR ? 1.8 : 1.4}
                            fill={nearTR ? JURIS.red : JURIS.ink}
                            fillOpacity={nearTR ? 0.9 * dotT : 0.35 * dotT} />
                  );
                })}

                {/* Flight arcs — TR merkezli */}
                {DESTINATIONS.map((dest, i) => {
                  const routeT = Math.max(0, Math.min(1, (localTime - dest.delay) / 1.0));
                  if (routeT <= 0) return null;

                  const sx = TR.x, sy = TR.y;
                  const ex = dest.x, ey = dest.y;
                  const mx = (sx + ex) / 2;
                  const my = Math.min(sy, ey) - 40 - Math.abs(ex - sx) * 0.1;
                  const pathStr = `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`;

                  return (
                    <g key={i}>
                      {/* arc */}
                      <path d={pathStr} fill="none"
                            stroke={JURIS.red} strokeWidth="0.6"
                            strokeOpacity="0.8"
                            pathLength="100"
                            strokeDasharray="100"
                            strokeDashoffset={100 - routeT * 100} />
                      {/* destination dot */}
                      {routeT > 0.85 && (
                        <>
                          <circle cx={ex} cy={ey} r="3"
                                  fill="none" stroke={JURIS.red} strokeWidth="0.6"
                                  opacity={(routeT - 0.85) / 0.15} />
                          <circle cx={ex} cy={ey} r="1.5" fill={JURIS.red}
                                  opacity={(routeT - 0.85) / 0.15} />
                        </>
                      )}
                    </g>
                  );
                })}

                {/* TR marker — pulse rings */}
                {mapT > 0.5 && (
                  <g>
                    <circle cx={TR.x} cy={TR.y}
                            r={4 + pulsePhase * 14}
                            fill="none" stroke={JURIS.red}
                            strokeWidth="0.6"
                            strokeOpacity={(1 - pulsePhase) * 0.8} />
                    <circle cx={TR.x} cy={TR.y} r="8"
                            fill="none" stroke={JURIS.red} strokeWidth="0.6" />
                    <circle cx={TR.x} cy={TR.y} r="3" fill={JURIS.red} />
                    {/* TR callout */}
                    <g>
                      <line x1={TR.x + 6} y1={TR.y - 2} x2={TR.x + 48} y2={TR.y - 34}
                            stroke={JURIS.red} strokeWidth="0.5" />
                      <circle cx={TR.x + 48} cy={TR.y - 34} r="1" fill={JURIS.red} />
                      <text x={TR.x + 54} y={TR.y - 36}
                            fontFamily={MONO} fontSize="8"
                            fill={JURIS.red} letterSpacing="1.5">
                        TR · ANKARA
                      </text>
                      <text x={TR.x + 54} y={TR.y - 26}
                            fontFamily={MONO} fontSize="6"
                            fill={JURIS.inkFaint} letterSpacing="1">
                        39.93°N 32.85°E
                      </text>
                    </g>
                  </g>
                )}
              </svg>
            </div>
          </div>
        );
      }}
    </Sprite>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SCENE 5 — CLOSING (43 – 50s)
// Logo resolve + slogan, clean CTA
// ─────────────────────────────────────────────────────────────────────────
function SceneClosing({ start, end, slogan }) {
  return (
    <Sprite start={start} end={end}>
      {({ localTime }) => {
        const dur = end - start;
        const entryT = Math.min(1, localTime / 1.4);
        const logoScale = interpolate([0, 0.7, 1], [0.9, 1.02, 1], Easing.easeOutBack)(entryT);
        const logoOp = entryT;
        const sloganOp = Math.min(1, Math.max(0, (localTime - 1.4) / 0.8));
        const ruleOp  = Math.min(1, Math.max(0, (localTime - 2.2) / 0.5));
        const ctaOp   = Math.min(1, Math.max(0, (localTime - 2.8) / 0.6));
        const glowPulse = 0.5 + Math.sin(localTime * 1.4) * 0.3;

        return (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 32,
          }}>
            {/* Radial glow */}
            <div style={{
              position: 'absolute', left: '50%', top: '50%',
              width: 1200, height: 1200,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, ${JURIS.red}22 0%, transparent 45%)`,
              opacity: logoOp * glowPulse,
              filter: 'blur(20px)',
            }} />

            {/* Mark + text — baloncuk hafif yüzer */}
            <div style={{
              opacity: logoOp, transform: `scale(${logoScale})`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28,
            }}>
              <div style={{
                filter: `drop-shadow(0 0 28px ${JURIS.red}60) drop-shadow(0 14px 36px ${JURIS.navyDeep})`,
                transform: `translateY(${Math.sin(localTime * 1.2) * 4}px)`,
              }}>
                <JurisMark size={180} red={JURIS.red} />
              </div>
              <div style={{
                fontFamily: SERIF, fontSize: 128, fontWeight: 700,
                color: JURIS.ink, letterSpacing: '-0.035em', lineHeight: 0.9,
                marginTop: 4,
              }}>
                Juris
              </div>
              <div style={{
                fontFamily: SANS, fontSize: 14, fontWeight: 600,
                color: JURIS.inkMute, letterSpacing: '0.42em', textTransform: 'uppercase',
                marginTop: -12,
              }}>
                Avukatlık Ortaklığı
              </div>
            </div>

            {/* Divider */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 18,
              opacity: ruleOp,
            }}>
              <div style={{ width: 80, height: 1, background: JURIS.ruleStrong }} />
              <div style={{ width: 4, height: 4, background: JURIS.red, borderRadius: 2 }} />
              <div style={{ width: 80, height: 1, background: JURIS.ruleStrong }} />
            </div>

            {/* Slogan */}
            <div style={{
              opacity: sloganOp, textAlign: 'center', maxWidth: 1100,
              transform: `translateY(${(1 - sloganOp) * 10}px)`,
            }}>
              <div style={{
                fontFamily: SERIF, fontSize: 44, fontWeight: 500,
                color: JURIS.ink, letterSpacing: '-0.02em', lineHeight: 1.25,
                fontStyle: 'italic',
                whiteSpace: 'nowrap',
              }}>
                {slogan.main}
              </div>
              {slogan.sub && (
                <div style={{
                  marginTop: 22,
                  fontFamily: SANS, fontSize: 13, fontWeight: 500,
                  color: JURIS.inkMute,
                  letterSpacing: '0.32em', textTransform: 'uppercase',
                }}>
                  {slogan.sub}
                </div>
              )}
            </div>

            {/* CTA line */}
            <div style={{
              opacity: ctaOp, marginTop: 24,
              display: 'flex', alignItems: 'center', gap: 32,
              fontFamily: MONO, fontSize: 12, fontWeight: 500,
              color: JURIS.inkMute, letterSpacing: '0.28em', textTransform: 'uppercase',
            }}>
              <span style={{ color: JURIS.ink }}>juris.com.tr</span>
              <div style={{ width: 4, height: 4, borderRadius: 2, background: JURIS.red }} />
              <span>iletisim@jurishukuk.com</span>
              <div style={{ width: 4, height: 4, borderRadius: 2, background: JURIS.red }} />
              <span>+90 312 502 2389</span>
            </div>
          </div>
        );
      }}
    </Sprite>
  );
}

Object.assign(window, {
  DISCIPLINES, SUB_BRANCHES,
  AmbientRings,
  SceneOpening, SceneDisciplines, SceneWorld, SceneClosing,
});
