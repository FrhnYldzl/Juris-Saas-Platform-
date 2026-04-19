"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  domain_not_allowed:
    "Bu e-posta adresi ile giriş yetkiniz yok. Yönetici ile görüşün.",
  account_disabled: "Hesabınız pasif. Yönetici ile görüşün.",
  firm_not_ready: "Firma kurulumu henüz tamamlanmadı.",
  OAuthAccountNotLinked:
    "Bu e-posta adresi farklı bir giriş yöntemiyle kayıtlı.",
  default: "E-posta veya şifre hatalı.",
};

export function LoginForm({
  nextUrl,
  initialError,
  googleEnabled,
}: {
  nextUrl?: string;
  initialError?: string;
  googleEnabled?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(
    initialError ? ERROR_MESSAGES[initialError] ?? ERROR_MESSAGES.default : null,
  );
  const [pending, startTransition] = useTransition();
  const [googlePending, setGooglePending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("E-posta ve şifre zorunludur.");
      return;
    }

    startTransition(async () => {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError(ERROR_MESSAGES.default);
        return;
      }
      router.replace(nextUrl ?? "/");
      router.refresh();
    });
  }

  async function onGoogle() {
    setError(null);
    setGooglePending(true);
    await signIn("google", { callbackUrl: nextUrl ?? "/" });
  }

  return (
    <div className="flex flex-col gap-4">
      {googleEnabled && (
        <>
          <button
            type="button"
            onClick={onGoogle}
            disabled={googlePending || pending}
            className="h-11 rounded-md border border-[#E5E9F0] bg-white hover:bg-[#F4F7FB]
                       flex items-center justify-center gap-2.5 text-sm font-semibold
                       text-[#0A2240] transition-all disabled:opacity-60"
          >
            <GoogleG size={16} />
            {googlePending ? "Google'a yönleniliyor…" : "Google ile Giriş Yap"}
          </button>

          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-[#8895AB]">
            <div className="flex-1 h-px bg-[#EEF1F6]" />
            <span>veya</span>
            <div className="flex-1 h-px bg-[#EEF1F6]" />
          </div>
        </>
      )}

      <form action={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-[#0A2240] tracking-[0.06em] uppercase">
            E-posta
          </span>
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8895AB] pointer-events-none"
            />
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              className="auth-input pl-10"
              placeholder="ornek@juris.com.tr"
            />
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-[#0A2240] tracking-[0.06em] uppercase">
            Şifre
          </span>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8895AB] pointer-events-none"
            />
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              className="auth-input pl-10"
              placeholder="••••••••"
            />
          </div>
        </label>

        {error && (
          <div
            className="flex items-start gap-2 text-[12px] px-3 py-2.5 rounded-md border border-[#BC2F2C]/20"
            style={{ background: "rgba(188,47,44,0.06)", color: "#8A1F1D" }}
          >
            <AlertCircle size={14} className="mt-px flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={pending || googlePending}
          className="group flex items-center justify-center gap-2 h-11 rounded-md font-semibold text-sm transition-all disabled:opacity-60"
          style={{
            background: "#0A2240",
            color: "white",
            border: "1px solid #0A2240",
            boxShadow: "0 1px 2px rgba(10,34,64,0.1), inset 0 -2px 0 rgba(188,47,44,0.6)",
          }}
        >
          {pending ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Giriş yapılıyor…
            </>
          ) : (
            <>
              E-posta ile Giriş Yap
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>

        <div className="flex items-center justify-between text-[12px] pt-1">
          <label className="flex items-center gap-2 text-[#5A6B82] cursor-pointer">
            <input
              type="checkbox"
              name="remember"
              className="w-3.5 h-3.5 accent-[#BC2F2C]"
              defaultChecked
            />
            Beni hatırla
          </label>
          <a
            href="mailto:destek@juris.com.tr"
            className="text-[#5A6B82] hover:text-[#BC2F2C] transition-colors"
          >
            Şifremi unuttum
          </a>
        </div>
      </form>

      <style>{`
        .auth-input {
          height: 44px;
          padding-right: 14px;
          border: 1px solid #E5E9F0;
          border-radius: 8px;
          background: #FBFAF7;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: all 150ms;
          color: #0A2240;
          width: 100%;
        }
        .auth-input::placeholder { color: #A8B2C2; }
        .auth-input:hover { border-color: #D1DCE9; }
        .auth-input:focus {
          border-color: #BC2F2C;
          background: white;
          box-shadow: 0 0 0 3px rgba(188,47,44,0.1);
        }
      `}</style>
    </div>
  );
}

function GoogleG({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}
