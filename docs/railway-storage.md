# Belge Depolama — Railway Volume Kurulumu

Juris Platform belgelerini (PDF, Word, Excel, görsel) Railway Volume'a kaydeder.
Prod'da container yeniden başladığında belgeler kalıcı kalır. S3 sürücüsü v0.3+
planında.

## 1. Volume oluştur

Railway → **Juris-Saas-Platform-** servisi → **Volumes** sekmesi → **New Volume**:

- **Mount path:** `/data/storage`
- **Size:** başlangıç 1 GB (gerekirse büyütülebilir, maks. 500 GB)
- **Create**

## 2. Env değişkenleri ekle

Variables sekmesine:

```
STORAGE_DRIVER      = local
STORAGE_LOCAL_PATH  = /data/storage
```

Save → servis yeniden başlar.

## 3. Belge yapısı

```
/data/storage/
  <firmId>/
    <documentId>.pdf
    <documentId>.docx
    …
```

DB'deki `Document.storageKey` alanında `<firmId>/<documentId>.<ext>` saklanır.
Boyut, MIME type, kategori ve yükleyen kullanıcı ayrıca DB'de tutulur.

## 4. Limitler

- **Dosya boyutu:** 25 MB (Juris kodunda `MAX_DOC_BYTES`)
- **İzinli türler:** PDF, DOC/DOCX, XLS/XLSX, CSV, PPT/PPTX, JPG/PNG/WEBP/HEIC, TXT
- **Yedekleme:** Railway otomatik günlük snapshot — retention planı Railway Pro ile 30 gün

## 5. S3 geçişi (v0.3)

Daha büyük ölçek için Cloudflare R2 / AWS S3 / Supabase Storage:

```
STORAGE_DRIVER    = s3
S3_ENDPOINT       = https://<account>.r2.cloudflarestorage.com
S3_REGION         = auto
S3_BUCKET         = juris-docs
S3_ACCESS_KEY     = <key>
S3_SECRET_KEY     = <secret>
```

`src/lib/storage.ts` içine S3 sürücüsü eklenir; veri taşımak için tek seferlik
migration script çalıştırılır.

## 6. Güvenlik notları

- Tüm indirme istekleri `/api/documents/[id]` üzerinden gider
- Her istek session + tenant + `document.view` izinlerinden geçer
- Müvekkil rolü sadece kendi dosyalarına bağlı belgeleri indirebilir
  (email eşleşmesi)
- Belge URL'leri tahmin edilemez (cuid) + asla public değil
