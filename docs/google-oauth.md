# Google ile Giriş — Kurulum

Juris Platform, ekibin hızlıca giriş yapması için Google OAuth'u destekler.
Bu rehber Google Cloud Console'da OAuth client oluşturmayı ve Railway'e
eklemeyi anlatır. Toplam süre: ~5 dakika.

## 1. Google Cloud Console

1. https://console.cloud.google.com → sağ üstten proje seç / yeni proje aç
   (örn: `juris-platform-prod`).
2. Sol menü → **APIs & Services** → **OAuth consent screen**.
   - User Type: **External** (dışarıdan gelen müvekkiller için)
   - App name: **Juris Platform**
   - User support email: `iletisim@jurishukuk.com`
   - App logo (opsiyonel): `public/brand/juris-logo-color.png`
   - Developer contact: kendi e-postan
   - Authorized domains: `jurishukuk.com`, `juris.com.tr`,
     `railway.app` (Railway alt alan adı için)
   - Scopes: `email`, `profile`, `openid` (default)
   - Test users: henüz "publish"lemediysen, izin verdiğin Gmail adreslerini ekle
3. **Credentials** → **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `Juris Platform — Production`
   - Authorized JavaScript origins:
     ```
     https://juris-saas-platform-production.up.railway.app
     ```
   - Authorized redirect URIs:
     ```
     https://juris-saas-platform-production.up.railway.app/api/auth/callback/google
     ```
   - **Create** → Çıkan ekranda **Client ID** ve **Client Secret**'i kopyala.

> Custom domain aldığında (`app.juris.com.tr`), aynı OAuth client'a
> authorized origin + redirect URI olarak yeni domain'i ekle. İkisi de
> aynı anda çalışır.

## 2. Railway — Variables

Railway → **Juris-Saas-Platform-** servisi → **Variables** sekmesi → ekle:

```
GOOGLE_CLIENT_ID        = <Google Console'dan kopyaladığın Client ID>
GOOGLE_CLIENT_SECRET    = <Client Secret>
# Opsiyonel: ekibin başka bir @ domain varsa ekle
GOOGLE_ALLOWED_DOMAINS  = jurishukuk.com,juris.com.tr
```

Kaydettiğinde Railway servisi yeniden başlatır (~30 sn).

## 3. Test

1. `https://juris-saas-platform-production.up.railway.app/login`
2. **Google ile Giriş Yap** butonu görünmeli
3. Tıkla → Google hesap seçici → izin → otomatik dashboard'a yönlenir

İlk girişte:
- E-posta `BOOTSTRAP_ADMIN_EMAIL` ile aynıysa → **OWNER** rolü
- `@jurishukuk.com` veya `@juris.com.tr` → yeni kullanıcı **ASSOCIATE**
  rolüyle oluşturulur (admin daha sonra rolü yükseltebilir)
- Başka domain → reddedilir, `/login?error=domain_not_allowed` sayfasına
  düşer

## Yaygın hatalar

**`redirect_uri_mismatch`** → Google Console'daki Authorized redirect URI
Railway domain'iyle bire bir uyuşmalı. `http` vs `https`, sondaki `/`,
alt alan değişikliği — hepsi önemli. Hata ekranındaki URI'yi Console'a
yapıştır.

**`access_denied`** → OAuth consent screen'i "Testing" modunda ve
e-posta test users listesinde değil. Çözüm: kullanıcıyı listeye ekle
**veya** consent screen'i "Publish" yap.

**Domain not allowed** → E-posta izin verilen domain'lerde değil.
`GOOGLE_ALLOWED_DOMAINS` env'ini düzenle, Railway restart.
