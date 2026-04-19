"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function LoginForm({ nextUrl, initialError }: { nextUrl?: string; initialError?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(initialError ?? null);
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
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
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
        <span className="text-xs font-semibold text-juris-ink-2 tracking-wide">E-posta</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          className="h-11 px-3 rounded-md border border-juris-line text-sm bg-white
                     focus:border-juris-navy focus:outline-none focus:ring-2 focus:ring-juris-navy/15"
          placeholder="ornek@juris.com.tr"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-juris-ink-2 tracking-wide">Şifre</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          className="h-11 px-3 rounded-md border border-juris-line text-sm bg-white
                     focus:border-juris-navy focus:outline-none focus:ring-2 focus:ring-juris-navy/15"
        />
      </label>
      {error && (
        <div className="text-xs px-3 py-2 rounded-md bg-red-50 text-red-700 border border-red-100">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-md bg-juris-navy text-white font-semibold text-sm
                   hover:bg-[#051834] disabled:opacity-60 transition-all"
      >
        {pending ? "Giriş yapılıyor…" : "Giriş Yap"}
      </button>
      <div className="text-xs text-juris-ink-3 text-center mt-2">
        Şifrenizi mi unuttunuz? Yöneticinizle iletişime geçin.
      </div>
    </form>
  );
}
