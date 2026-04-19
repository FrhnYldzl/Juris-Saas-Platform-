# Stripe Abonelik — Kurulum

Juris Platform 4 plan (FREE / STARTER / PROFESSIONAL / ENTERPRISE) ile her firmaya
ayrı abonelik sunar. Ödeme Stripe Checkout, yönetim Stripe Billing Portal üzerinden.

## 1. Stripe ürünlerini oluştur

Stripe Dashboard → **Products** → **+ Add product**:

**Starter**
- Name: `Juris Platform — Ofis`
- Pricing:
  - Recurring, Monthly, 1490 TRY
  - Recurring, Yearly, 14900 TRY
- **Save product**

**Professional**
- Name: `Juris Platform — Profesyonel`
- Pricing:
  - Recurring, Monthly, 3990 TRY
  - Recurring, Yearly, 39900 TRY

Her fiyat için oluşan **Price ID**'leri kopyala (price_xxx).

## 2. Webhook endpoint

**Developers → Webhooks → + Add endpoint**:
- Endpoint URL: `https://juris-saas-platform-production.up.railway.app/api/billing/webhook`
- Events to listen:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `customer.subscription.paused`
  - `customer.subscription.resumed`
- **Add endpoint**

Oluşan **Signing secret**'ı kopyala (`whsec_xxx`).

## 3. Railway Variables

```
STRIPE_SECRET_KEY                       = sk_live_xxx (veya sk_test_xxx test için)
STRIPE_WEBHOOK_SECRET                   = whsec_xxx
STRIPE_PRICE_STARTER_MONTHLY            = price_xxx
STRIPE_PRICE_STARTER_YEARLY             = price_xxx
STRIPE_PRICE_PROFESSIONAL_MONTHLY       = price_xxx
STRIPE_PRICE_PROFESSIONAL_YEARLY        = price_xxx
```

Save → servis yeniden başlar.

## 4. Test

1. Settings → Abonelik & Faturalama
2. **Profesyonel → Planı Seç** → Stripe Checkout
3. Test kartı: `4242 4242 4242 4242`, geçerli herhangi bir tarih, CVV 123
4. Ödeme sonrası webhook tetiklenir → DB'de subscription kaydı oluşur
5. Sayfa yenileyince plan "Profesyonel · ACTIVE" görünür
6. **Stripe'ta Yönet** → Billing Portal (kartı değiştir, iptal, fatura geçmişi)

## 5. Plan değişikliği

Stripe Billing Portal abone'ye doğrudan plan değiştirme imkânı verir.
Webhook `customer.subscription.updated` geldiğinde DB otomatik senkronlanır.

## 6. Vergi (KDV)

- Stripe Türkiye fatura düzenlemez; Juris tarafında kendi e-Fatura entegrasyonun GİB ile
  yapılır (`invoices` modeli + GİB e-Fatura entegrasyonu v0.7 planında)
- Stripe'ın hesapladığı KDV'yi aboneye iletmek için Stripe Tax'i açabilirsin (aylık 0.5%)

## 7. Feature gating (v0.7 planı)

`src/lib/billing/plans.ts` → `limits` alanları:
- AI çağrı sayısı (aylık)
- Kullanıcı sayısı
- Belge depolama (GB)
- Müvekkil portalı erişimi

Bu limitler henüz enforcing değil. v0.7 sprint'te:
- `before` middleware: kullanıcı sayısı aşıldıysa yeni davet engellenir
- AI endpoint: aylık quota kontrolü
- Storage: yükleme öncesi toplam boyut kontrolü
