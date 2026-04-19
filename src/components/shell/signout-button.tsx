"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await signOut({ redirect: false });
        router.push("/login");
      }}
      className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white px-2 py-1.5 rounded hover:bg-white/10 transition-colors"
    >
      <LogOut size={14} /> Çıkış
    </button>
  );
}
