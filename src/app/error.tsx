"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)" }}>
      <div className="card p-8 max-w-md text-center">
        <h1 className="display text-2xl text-juris-navy mb-2">Bir şeyler ters gitti</h1>
        <p className="text-sm text-juris-ink-3 mb-5">
          Beklenmeyen bir hata oluştu. Sistem yöneticisi bilgilendirildi.
        </p>
        {error.digest && (
          <div className="mono text-xs text-juris-ink-4 mb-5">Hata ID: {error.digest}</div>
        )}
        <button onClick={reset} className="btn btn-primary">Tekrar Dene</button>
      </div>
    </div>
  );
}
