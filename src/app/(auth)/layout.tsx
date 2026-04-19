export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6"
         style={{ background: "linear-gradient(135deg, #0A2240 0%, #1a3558 100%)" }}>
      {children}
    </div>
  );
}
