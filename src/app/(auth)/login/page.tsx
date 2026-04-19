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
    <div className="w-full max-w-[420px]">
      <div className="mb-8 text-center text-white">
        <div className="display text-[40px] mb-1">juris</div>
        <div className="text-xs tracking-[0.14em] uppercase opacity-60">Platform</div>
      </div>
      <div className="card p-8 bg-white">
        <h1 className="display text-2xl mb-1 text-juris-navy">Hoş geldiniz</h1>
        <p className="text-sm text-juris-ink-3 mb-6">Hesabınıza giriş yapın</p>
        <LoginForm nextUrl={params.next} initialError={params.error} />
      </div>
      <p className="text-xs text-white/50 text-center mt-6">
        © {new Date().getFullYear()} Juris Hukuk Bürosu. Tüm hakları saklıdır.
      </p>
    </div>
  );
}
