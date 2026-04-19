export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex relative overflow-hidden"
      style={{ background: "#0A2240" }}
    >
      {/* Decorative: subtle grain + radial gradients */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(1200px 600px at 15% 10%, rgba(188,47,44,0.18), transparent 60%), " +
            "radial-gradient(900px 500px at 85% 90%, rgba(188,47,44,0.10), transparent 60%), " +
            "radial-gradient(600px 400px at 50% 50%, rgba(255,255,255,0.04), transparent 70%)",
        }}
      />
      {/* Fine grid overlay */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* Left: brand panel (desktop only) */}
      <aside className="hidden lg:flex flex-col justify-between w-[480px] xl:w-[560px] p-12 relative z-10 border-r border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 44,
                height: 44,
                background: "#BC2F2C",
                borderRadius: 5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 28,
                fontWeight: 500,
                color: "white",
                letterSpacing: "-0.02em",
                lineHeight: 1,
                paddingBottom: 2,
              }}
            >
              j
            </div>
            <div className="leading-none">
              <div
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 40,
                  fontWeight: 500,
                  color: "white",
                  letterSpacing: "-0.02em",
                }}
              >
                juris
              </div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-white/45 font-semibold mt-1">
                Platform
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="h-px w-14 bg-[#BC2F2C]" />
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 36,
              fontWeight: 500,
              color: "white",
              letterSpacing: "-0.015em",
              lineHeight: 1.2,
            }}
          >
            Bir hukuk bürosu,
            <br />
            <span style={{ color: "#E07F7C" }}>tek bir platform.</span>
          </h2>
          <p className="text-white/65 text-[15px] leading-relaxed max-w-sm">
            Dosyalarınız, müvekkilleriniz, teklifleriniz ve faturalarınız — hepsi bir arada,
            KVKK uyumlu, Türk hukukuna göre tasarlanmış.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span className="w-1.5 h-1.5 rounded-full bg-[#BC2F2C]" />
            UYAP Uyumlu
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span className="w-1.5 h-1.5 rounded-full bg-[#BC2F2C]" />
            GİB e-Fatura
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span className="w-1.5 h-1.5 rounded-full bg-[#BC2F2C]" />
            KVKK
          </div>
        </div>
      </aside>

      {/* Right: form */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        {children}
      </main>
    </div>
  );
}
