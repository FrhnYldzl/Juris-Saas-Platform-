# Paperclip — Sales & Marketing Public API

> **Project ID:** `b277b84c-ccd0-4699-b202-c39272d76aee`
> **Relationship:** `sm-only`
> **Scope:** `read + sm-write`
> **Base URL:** `https://<your-host>/api/paperclip`

A scope-restricted public API surface for external Sales & Marketing
automation tools. Read across the firm's data, write only to S&M domains.

---

## Allowed domains

| Domain     | Read | Write | Notes                                     |
|------------|------|-------|-------------------------------------------|
| `lead`     | ✓    | ✓     | CRM lead create/update/list               |
| `content`  | ✓    | DRAFT | Publish requires board approval (in-app)  |
| `analytics`| ✓    | —     | Read-only metrics                         |
| `campaign` | ✓    | ✓     | UTM campaign register / list              |

## Forbidden domains

`product`, `deploy`, `support`, `contracts`, `auth`

These domains are not exposed under `/api/paperclip/*`. Any attempt to
write product specs, infra config, customer tickets, legal documents, or
user/billing data will return 404.

---

## Authentication

All requests require an `X-API-Key` header:

```
X-API-Key: $JURIS_SM_KEY
```

The key is a single shared secret stored as the `JURIS_SM_KEY` env var
on the server. Tenant scope is fixed: the firm associated with the key
(env `JURIS_SM_FIRM_ID`, falling back to the oldest firm in the DB).

A constant-time comparison is used to mitigate timing-based key leaks.

### Sanity check

```bash
curl -sS -H "X-API-Key: $JURIS_SM_KEY" \
  https://juris.com.tr/api/paperclip/health
```

Returns the resolved firm ID, granted scopes, and endpoint catalog.

---

## Endpoints

### `GET /api/paperclip/leads` — list leads

Query params:

- `stage=NEW,QUALIFIED` — comma list of `LeadStage`
  (`NEW | QUALIFIED | MEETING | PROPOSAL | NEGOTIATION | CONTRACT | SIGNING | WON | LOST`)
- `source=LinkedIn` — exact match on `Lead.source`
- `campaign=q1-linkedin-2026` — same as `source=`, semantic helper
- `limit=50&offset=0` — pagination (max 200)

```bash
curl -sS -H "X-API-Key: $JURIS_SM_KEY" \
  "https://juris.com.tr/api/paperclip/leads?stage=NEW,QUALIFIED&limit=10"
```

Response:

```json
{
  "data": [
    {
      "id": "clx…",
      "title": "Garanti BBVA — Kurumsal hukuk danışmanlığı",
      "clientName": "Garanti BBVA",
      "topic": "Kurumsal hukuk danışmanlığı",
      "source": "Referans",
      "stage": "NEGOTIATION",
      "value": 1200000,
      "currency": "TRY",
      "probability": 75,
      …
    }
  ],
  "pagination": { "total": 47, "limit": 10, "offset": 0, "hasMore": true }
}
```

### `POST /api/paperclip/leads` — create lead from S&M campaign

```bash
curl -sS -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $JURIS_SM_KEY" \
  -d '{
    "title": "Trendyol — KVKK Uyum",
    "clientName": "Trendyol",
    "topic": "KVKK 2026 uyum projesi",
    "source": "q1-linkedin-2026",
    "stage": "QUALIFIED",
    "value": 488000,
    "probability": 50
  }' \
  https://juris.com.tr/api/paperclip/leads
```

→ `201 Created`, returns the persisted lead with its `id`.

### `GET /api/paperclip/content/posts` — list content drafts

Query params:

- `status=DRAFT,REVIEW` — comma list of `ContentStatus`
- `channel=BLOG` — single `ContentChannel`
- `limit=50&offset=0`

### `POST /api/paperclip/content/posts` — draft a post

**Important:** Paperclip can only create posts in `IDEA` or `DRAFT` state.
Any other status is rejected. Publishing a post (`SCHEDULED`, `PUBLISHED`)
goes through the in-app board approval workflow at `/marketing/<id>`.

```bash
curl -sS -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $JURIS_SM_KEY" \
  -d '{
    "title": "KVKK 2026 Kontrol Listesi",
    "summary": "12-madde uygulanabilir rehber",
    "channel": "BLOG",
    "contentType": "SEO Makale",
    "keywords": ["KVKK", "2026", "uyum"],
    "metaTitle": "KVKK 2026 Uyum Rehberi · Juris",
    "metaDescription": "12-madde firma uyum kontrol listesi",
    "status": "DRAFT"
  }' \
  https://juris.com.tr/api/paperclip/content/posts
```

### `PATCH /api/paperclip/content/posts/{id}` — edit draft

Only DRAFT/IDEA posts are editable. Posts in REVIEW/SCHEDULED/PUBLISHED
return `409 post_locked`.

```bash
curl -sS -X PATCH \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $JURIS_SM_KEY" \
  -d '{ "summary": "Yeni özet metni" }' \
  https://juris.com.tr/api/paperclip/content/posts/clx…
```

### `GET /api/paperclip/analytics/leads` — MQL stats

Query params:

- `from=ISO`, `to=ISO` — date window (defaults to last 30 days)

```bash
curl -sS -H "X-API-Key: $JURIS_SM_KEY" \
  "https://juris.com.tr/api/paperclip/analytics/leads?from=2026-04-01&to=2026-04-30"
```

Response:

```json
{
  "window": { "from": "...", "to": "..." },
  "totals": {
    "all": 47,
    "qualified": 32,
    "lost": 4,
    "lostRate": 8,
    "avgValue": 845000,
    "avgProbability": 58,
    "mqlThisMonth": 19
  },
  "byStage":  [{ "stage": "NEW", "count": 12, "valueSum": … }, …],
  "bySource": [{ "source": "LinkedIn", "count": 8, "valueSum": …, "winRate": 24 }],
  "trend":    [{ "date": "2026-04-01", "count": 2 }, …]
}
```

### `POST /api/paperclip/campaigns` — register UTM campaign

```bash
curl -sS -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $JURIS_SM_KEY" \
  -d '{
    "name": "Q1 LinkedIn",
    "utmCampaign": "q1-linkedin-2026",
    "utmSource":   "linkedin",
    "utmMedium":   "social",
    "channel":     "LINKEDIN",
    "startsAt":    "2026-04-01T00:00:00Z",
    "endsAt":      "2026-06-30T23:59:59Z",
    "budget":      45000
  }' \
  https://juris.com.tr/api/paperclip/campaigns
```

→ `201 Created`, returns the campaign + a pre-built `trackingUrl` you
can reuse:

```json
{
  "data": { "id": "clx…", "name": "Q1 LinkedIn", … },
  "trackingUrl": "https://juris.com.tr/?utm_source=linkedin&utm_medium=social&utm_campaign=q1-linkedin-2026"
}
```

`409 campaign_exists` if the same `utmCampaign` is already registered.

### `GET /api/paperclip/campaigns`

List campaigns. Query: `?active=true` to filter by active flag.

---

## Error format

All errors return JSON with the shape:

```json
{ "error": { "code": "validation_error", "message": "..." } }
```

| Status | Code                   | Meaning                                          |
|--------|------------------------|--------------------------------------------------|
| 400    | `invalid_json`          | Body was not valid JSON                          |
| 400    | `validation_error`      | Zod validation failed (see `message`)            |
| 401    | `missing_api_key`       | `X-API-Key` header not present                   |
| 401    | `invalid_api_key`       | Header did not match `JURIS_SM_KEY`              |
| 403    | `scope_denied`          | Endpoint requires a scope you don't hold         |
| 404    | `not_found`             | Resource not found in this firm                  |
| 409    | `post_locked`           | Post is past DRAFT — go through in-app workflow  |
| 409    | `campaign_exists`       | utmCampaign already registered                   |
| 500    | `server_misconfigured`  | `JURIS_SM_KEY` env not set                       |
| 500    | `no_tenant`             | No firm could be resolved for the key            |
| 500    | `internal_error`        | Unhandled exception                              |

The HTTP response also carries `x-paperclip-error: <code>` for log scraping.

---

## Audit trail

Every authenticated call writes an `AuditLog` row with:

- `action: paperclip.<scope>` (e.g. `paperclip.lead:write`)
- `entityType: "paperclip"`
- `diff: { method, status, key }`

So all S&M API activity is traceable in the in-app `/settings/audit` view.

---

## Server configuration

Set on Railway / your environment:

```
JURIS_SM_KEY=<random 32-char secret — rotate quarterly>
JURIS_SM_FIRM_ID=<optional — pin to a specific firm; falls back to oldest>
JURIS_SM_KEY_NAME=paperclip-sm   (optional label shown in audit logs)
```

Rotation: change `JURIS_SM_KEY` and redeploy. Old key invalidated immediately.

---

## What this API will NOT do

- It will **not** publish content. Publishing is a board-approval action
  reserved for OWNER/PARTNER inside the app.
- It will **not** update existing leads' stages. Stage transitions require
  proper sales workflow + audit context — use the in-app pipeline.
- It will **not** access matters, invoices, contracts, billing, audit log,
  or user records. Those domains are explicitly forbidden.
- It will **not** delete records. There's no DELETE on any endpoint.
