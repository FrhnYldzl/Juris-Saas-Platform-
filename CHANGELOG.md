# Changelog

Tüm kayda değer değişiklikler bu dosyaya kaydedilir.
Format: [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) · Versiyonlama: [SemVer](https://semver.org/lang/tr/).

## [0.1.0] — 2026-04-19

### Eklenenler (İlk canlı sürüm iskeleti)

- **Proje altyapısı**
  - Next.js 15 (App Router) + TypeScript + Tailwind 3
  - ESLint + Prettier + tsc typecheck
  - Docker multi-stage build
  - GitHub Actions CI (lint + typecheck + build + docker)
  - Railway deploy config (`railway.toml`)

- **Veri katmanı**
  - Prisma 6 + PostgreSQL
  - Multi-tenant şema: Firm, User, Contact, Matter, Lead, Invoice, Document, Task, CalendarEvent, Note, Integration, AuditLog
  - Seed: örnek firma + 4 hesap + dosyalar + fatura

- **Auth & RBAC**
  - NextAuth v5 (Credentials provider, JWT strateji)
  - 6 rol: OWNER, PARTNER, ASSOCIATE, PARALEGAL, ADMIN_STAFF, CLIENT
  - Granüler permission sistemi (`src/lib/rbac.ts`)
  - Auth middleware + tenant koruması

- **UI / Kabuk**
  - Sidebar + Topbar (kurumsal kimlik: Playfair + Inter + navy/red paleti)
  - Login ekranı
  - Role-based nav filtresi
  - Toast + error boundary + 404

- **Modüller (v0.1)**
  - **Komuta Merkezi** — gerçek KPI'lar (Prisma aggregate)
  - **Operasyonlar / Dosyalar** — tam CRUD, yeni/düzenle/detay, zaman kaydı, belgeler
  - **İş Geliştirme** — lead pipeline tablosu
  - **Satış** — contact/müvekkil listesi
  - **Finans** — fatura listesi + KPI'lar
  - **Pazarlama** — entegrasyon bekleniyor placeholder'ı
  - **Ekip** — üye tablosu
  - **Entegrasyonlar** — 25+ sağlayıcılı katalog
  - **Ayarlar** — firma info + KVKK bilgi
  - **Müvekkil Portalı** — sadece kendi dosya/fatura

- **AI katmanı**
  - Pluggable provider abstraction: Anthropic, OpenAI, Gemini, xAI Grok, Mistral (EU)
  - `/api/ai/chat` endpoint + audit log
  - Türkçe hukuk sistem prompt

- **Entegrasyon stub'ları**
  - UYAP, GİB e-Fatura (test modu), MERNİS (TCKN format doğrulayıcı), Lexpera
  - `src/lib/integrations/catalog.ts` — 25 sağlayıcı tanımı

- **Güvenlik**
  - bcrypt password hashing
  - Security headers (HSTS, X-Frame, X-CT-O, Referrer-Policy, Permissions-Policy)
  - Pino log redaction
  - Audit log (kullanıcı eylemleri + AI istekleri)

- **Observability**
  - `/api/health` — DB ping, uptime, version
  - Structured logging (pino)
  - Sentry env var hazır

### Bilinen eksikler (v0.2'ye ertelendi)

- Dosya yükleme (şu an sadece şema var, UI/storage driver yok)
- Fatura PDF'i oluşturma
- Zaman kaydı UI (timer)
- E-posta bildirimleri
- GA4 / GSC / UYAP gerçek istekleri
- 2FA

### Migration notu

İlk deploy sonrası bir kez:
```
npx prisma migrate deploy
npm run db:seed
```
