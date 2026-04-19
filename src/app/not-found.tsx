import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)" }}>
      <div className="card p-8 max-w-md text-center">
        <div className="display text-[80px] text-juris-navy leading-none mb-1">404</div>
        <h1 className="display text-xl text-juris-navy mb-2">Sayfa bulunamadı</h1>
        <p className="text-sm text-juris-ink-3 mb-5">
          Aradığınız sayfa taşınmış veya silinmiş olabilir.
        </p>
        <Link href="/" className="btn btn-primary">Ana Sayfaya Dön</Link>
      </div>
    </div>
  );
}
