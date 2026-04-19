"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";

export function LoginForm({ nextUrl, initialError }: { nextUrl?: string; initialError?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(
    initialError ? "E-posta veya şifre hatalı." : null,
  );
  const [pending, startTransition] = useTransition();

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
        setError("E-posta veya şifre hatalı.");
        return;
      }
      router.replace(nextUrl ?? "/");
      router.refresh();
    });
  }

  return (
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
            autoFocus
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
        <div className="flex items-start gap-2 text-[12px] px-3 py-2.5 rounded-md border border-[#BC2F2C]/20" style={{ background: "rgba(188,47,44,0.06)", color: "#8A1F1D" }}>
          <AlertCircle size={14} className="mt-px flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="group flex items-center justify-center gap-2 h-12 rounded-md font-semibold text-sm transition-all"
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
            Giriş Yap
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>

      <div className="flex items-center justify-between text-[12px] pt-1">
        <label className="flex items-center gap-2 text-[#5A6B82] cursor-pointer">
          <input type="checkbox" name="remember" className="w-3.5 h-3.5 accent-[#BC2F2C]" defaultChecked />
          Beni hatırla
        </label>
        <a href="mailto:destek@juris.com.tr" className="text-[#5A6B82] hover:text-[#BC2F2C] transition-colors">
          Şifremi unuttum
        </a>
      </div>

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
    </form>
  );
}
