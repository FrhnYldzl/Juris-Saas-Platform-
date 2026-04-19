import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Giriş" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (session?.user) redirect(params.next ?? "/");

  return (
    <div className="w-full max-w-[440px]">
      {/* Mobile logo */}
      <div className="lg:hidden mb-8 flex items-center gap-3 justify-center">
        <div
          style={{
            width: 40, height: 40, background: "#BC2F2C", borderRadius: 5,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 26, color: "white", fontWeight: 500, lineHeight: 1, paddingBottom: 2,
            letterSpacing: "-0.02em",
          }}
        >j</div>
        <div className="leading-none">
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 500, color: "white", letterSpacing: "-0.02em" }}>
            juris
          </div>
          <div className="text-[9px] tracking-[0.2em] uppercase text-white/50 font-semibold mt-0.5">Platform</div>
        </div>
      </div>

      {/* Card */}
      <div
        className="bg-white rounded-[14px] overflow-hidden"
        style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)" }}
      >
        {/* Top red accent bar */}
        <div className="h-1 bg-[#BC2F2C]" />

        <div className="p-10">
          <div className="mb-7">
            <div
              className="inline-block text-[10px] tracking-[0.18em] uppercase font-semibold mb-3 px-2.5 py-1 rounded"
              style={{ background: "rgba(188,47,44,0.1)", color: "#BC2F2C" }}
            >
              Ekip Girişi
            </div>
            <h1
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 32,
                fontWeight: 500,
                color: "#0A2240",
                letterSpacing: "-0.015em",
                lineHeight: 1.1,
              }}
            >
              Hoş geldiniz
            </h1>
            <p className="text-sm text-[#5A6B82] mt-2">
              Juris hesabınızla giriş yapın
            </p>
          </div>

          <LoginForm nextUrl={params.next} initialError={params.error} />

          <div className="sep mt-7 mb-5" />

          <div className="flex items-center justify-between text-[11px] text-[#8895AB]">
            <span>© {new Date().getFullYear()} Juris Hukuk Bürosu</span>
            <a href="/kvkk" className="hover:text-[#BC2F2C] transition-colors">
              KVKK Aydınlatma
            </a>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-white/45 text-center mt-5">
        Sorun mu yaşıyorsunuz? <a href="mailto:destek@juris.com.tr" className="text-white/70 hover:text-white underline underline-offset-2">destek@juris.com.tr</a>
      </p>
    </div>
  );
}
