# Juris Platform

> Türk hukuk firmaları için çok kiracılı SaaS platformu
> **Versiyon:** v0.1.0 · Next.js 15 · TypeScript · Prisma · PostgreSQL · NextAuth

---

## ✨ Özellikler (v0.1)

- **Komuta Merkezi** — Günün özeti: KPI'lar, aktif dosyalar, açık fırsatlar, bu ay fatura
- **Dosyalar (Operasyonlar)** — Dava & danışmanlık dosyaları, tam CRUD, sorumlular, zaman kayıtları
- **İş Geliştirme** — Lead/fırsat pipeline, aşamalar, değer takibi
- **Satış** — Müvekkil & aday kayıtları (kurum + birey)
- **Finans** — Fatura kesimi, GİB e-Fatura stub (test modu), KDV hesabı
- **Pazarlama** — GA4, Search Console, LinkedIn, WordPress entegrasyon iskeleleri
- **Ekip** — Üye listesi, roller, yetki matrisi
- **Müvekkil Portalı** — Müvekkil dosyalarını, faturalarını görür
- **AI Katmanı** — Claude + OpenAI + Gemini + Grok + Mistral (pluggable)
- **Entegrasyonlar** — UYAP, GİB, MERNİS, Lexpera, Google Drive, Logo, bankalar (stub)

---

## 🚀 Yerel Kurulum

### 1. Gereksinimler
- Node.js 20+ (önerilen: 22)
- PostgreSQL 14+ (Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16`)
- npm 10+

### 2. Kurulum

```bash
cd juris-platform
cp .env.example .env
# .env dosyasını düzenleyin — en azından DATABASE_URL ve AUTH_SECRET
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

### 3. Giriş

http://localhost:3000 adresinde giriş ekranı açılır.

**Varsayılan hesaplar (seed sonrası):**

| Rol | E-posta | Şifre |
|-----|---------|-------|
| Yönetici | `admin@juris.local` | `juris1234` |
| Avukat | `sarah.juris-hukuk-burosu@juris.local` | `demo1234` |
| Stajyer | `burak.juris-hukuk-burosu@juris.local` | `demo1234` |
| Müvekkil | `demo.muvekkil@juris.local` | `muvekkil1234` |

> İlk girişten sonra şifrenizi değiştirmeniz şiddetle önerilir.

---

## ☁️ Railway'e Deploy

1. Railway projesi oluşturun.
2. **+ New → Database → Postgres** ekleyin (otomatik `DATABASE_URL` set edilir).
3. **+ New → GitHub Repo** bu repoyu bağlayın.
4. Aşağıdaki env'leri ekleyin:

```
AUTH_SECRET              = $(openssl rand -base64 32)
AUTH_URL                 = https://<app>.up.railway.app
NEXT_PUBLIC_APP_URL      = https://<app>.up.railway.app
BOOTSTRAP_FIRM_NAME      = Juris Avukatlık Ortaklığı
BOOTSTRAP_ADMIN_EMAIL    = admin@juris.com.tr
BOOTSTRAP_ADMIN_PASSWORD = güçlü-bir-şifre
ANTHROPIC_API_KEY        = sk-ant-...
OPENAI_API_KEY           = sk-...      # opsiyonel
```

5. Deploy otomatik başlar. Dockerfile ile build edilir.
6. İlk deploy sonrası bir kez seed çalıştırın:
   ```
   railway run npm run db:seed
   ```

Domain: `Settings → Networking → Custom Domain` üzerinden özel alan adı ekleyin.

---

## 📐 Mimari

```
juris-platform/
├── src/
│   ├── app/
│   │   ├── (auth)/          → Login, register
│   │   ├── (dashboard)/     → Ekip sayfaları (sidebar + topbar)
│   │   │   ├── command/     → Komuta merkezi
│   │   │   ├── ops/         → Dosyalar (full CRUD)
│   │   │   ├── bd/          → Lead pipeline
│   │   │   ├── sales/       → Müvekkil/kişi
│   │   │   ├── finance/     → Fatura
│   │   │   ├── marketing/   → GA4/GSC
│   │   │   ├── people/      → Ekip
│   │   │   ├── integrations/→ Entegrasyon kataloğu
│   │   │   └── settings/    → Firma ayarları
│   │   ├── (portal)/        → Müvekkil portalı
│   │   └── api/             → REST + AI endpoints
│   ├── components/
│   │   ├── shell/           → Sidebar, Topbar
│   │   └── ui/              → Kpi, Avatar, SectionHead, vb.
│   ├── lib/
│   │   ├── auth.ts          → NextAuth
│   │   ├── prisma.ts        → DB client
│   │   ├── rbac.ts          → Yetki matrisi
│   │   ├── tenancy.ts       → Çok kiracılı koruma
│   │   ├── audit.ts         → Audit log
│   │   ├── ai/              → Çoklu sağlayıcı (Claude/GPT/Gemini/Grok/Mistral)
│   │   └── integrations/    → UYAP/GİB/MERNİS/Lexpera stub'ları
│   └── middleware.ts        → Auth guard + role routing
├── prisma/
│   ├── schema.prisma        → Multi-tenant şema
│   └── seed.ts              → Demo veri
├── Dockerfile               → Railway production build
├── railway.toml             → Railway config
└── .github/workflows/ci.yml → Lint + typecheck + build + docker
```

### Çok Kiracılılık (Multi-Tenancy)

Her iş modeli `firmId`'ye bağlanır. `requireTenant()` fonksiyonu her server action/route'ta çağrılır; tüm Prisma sorgularına `where: { firmId }` eklenir. Cross-firm veri sızıntısı mimari olarak engellenir.

### Yetki Matrisi (RBAC)

`src/lib/rbac.ts` içinde altı rol tanımlı:
- **OWNER** — Kurucu ortak, tam yetki
- **PARTNER** — Yönetici ortak
- **ASSOCIATE** — Kıdemli avukat
- **PARALEGAL** — Stajyer / paralegal
- **ADMIN_STAFF** — İdari personel
- **CLIENT** — Müvekkil (sadece portal)

Permission kontrolü: `can(role, "matter.create")` veya `requirePermission(role, "matter.delete")`.

### AI Katmanı

`src/lib/ai/` — birleşik interface:
```ts
await aiComplete({ provider: "anthropic", messages: [...] });
```
Sağlayıcılar: Claude (Anthropic), GPT-4o (OpenAI), Gemini 2.0 (Google), Grok-2 (xAI), Mistral Large (EU). Her biri `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_AI_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY` env'leri ile aktifleşir. Default: Claude.

---

## 🔐 Güvenlik & KVKK

- **Session**: JWT, 30 gün, HttpOnly cookie
- **Passwords**: bcrypt (10 round)
- **Headers**: HSTS, X-Frame-Options, CSP (next.config.ts)
- **Audit Log**: `prisma.auditLog` — her değişiklik + AI kullanımı kaydedilir
- **KVKK**: Veri TR/AB bölgesinde (Railway AWS). Müvekkil verisi izole. Hassas alanlar log redact (pino).
- **Çok Kiracılılık**: Her sorgu `firmId` ile kısıtlı.

---

## 🛠️ Komutlar

```bash
npm run dev              # Dev server (localhost:3000)
npm run build            # Production build
npm run start            # Production server
npm run lint             # ESLint
npm run typecheck        # tsc --noEmit
npm run db:migrate:dev   # Yeni migration (dev)
npm run db:migrate       # Prod migration deploy
npm run db:studio        # Prisma Studio GUI
npm run db:seed          # Demo veri oluştur
```

---

## 📋 Yol Haritası

**v0.2 (Q2 2026)**
- [ ] Dosya yükleme (S3 veya Railway volume)
- [ ] Zaman kaydı UI (timer)
- [ ] Fatura PDF'i oluşturma
- [ ] E-posta bildirimleri (Resend)
- [ ] GA4/GSC gerçek entegrasyon

**v0.3 (Q3 2026)**
- [ ] UYAP gerçek entegrasyon (e-imzalı)
- [ ] GİB e-Fatura canlı
- [ ] AI: Dilekçe taslağı, sözleşme analizi
- [ ] Takvim senkronu (Google/Outlook)

**v1.0**
- [ ] Pilot müşteri onboarding
- [ ] KVKK VERBİS kaydı
- [ ] 2FA
- [ ] Özel alan adı + SSL

---

## 🤝 Katkı

Bu repo şu an iç geliştirme amaçlı kapalıdır. İlerde açık kaynak/şeffaf pilot düşünülüyor.

## 📄 Lisans

Proprietary — tüm hakları Juris Avukatlık Ortaklığı'na aittir.
