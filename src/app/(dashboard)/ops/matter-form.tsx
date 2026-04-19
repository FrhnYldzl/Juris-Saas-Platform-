"use client";

import { useActionState } from "react";
import { createMatter, type MatterFormState } from "./actions";
import Link from "next/link";

type ClientOption = { id: string; name: string; companyName?: string | null; type: "INDIVIDUAL" | "COMPANY" };

const TYPES = [
  { value: "LITIGATION", label: "Dava" },
  { value: "CONSULTING", label: "Danışmanlık" },
  { value: "CONTRACT", label: "Sözleşme" },
  { value: "COMPLIANCE", label: "Uyum" },
  { value: "IP", label: "Fikri Mülkiyet" },
  { value: "CORPORATE", label: "Şirketler" },
  { value: "FAMILY", label: "Aile" },
  { value: "CRIMINAL", label: "Ceza" },
  { value: "LABOR", label: "İş Hukuku" },
  { value: "ADMINISTRATIVE", label: "İdare" },
  { value: "OTHER", label: "Diğer" },
];

const STATUSES = [
  { value: "ACTIVE", label: "Aktif" },
  { value: "ON_HOLD", label: "Beklemede" },
  { value: "CLOSED_WON", label: "Kazanıldı" },
  { value: "CLOSED_LOST", label: "Kaybedildi" },
  { value: "ARCHIVED", label: "Arşiv" },
];

const BILLING = [
  { value: "HOURLY", label: "Saatlik" },
  { value: "FLAT_FEE", label: "Sabit Ücret" },
  { value: "CONTINGENCY", label: "Başarı Ücreti" },
  { value: "RETAINER", label: "Retainer" },
];

export function MatterForm({ clients }: { clients: ClientOption[] }) {
  const [state, formAction, pending] = useActionState<MatterFormState, FormData>(
    createMatter,
    { ok: false },
  );

  const err = (field: string) => state.fieldErrors?.[field]?.[0];

  return (
    <form action={formAction} className="card p-6 flex flex-col gap-5">
      <Field label="Başlık" error={err("title")}>
        <input
          name="title"
          required
          placeholder="Örn: X A.Ş. sözleşme danışmanlığı"
          className="input"
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Müvekkil" error={err("clientId")}>
          <select name="clientId" className="input" defaultValue="">
            <option value="">— Seçilmedi —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.type === "COMPANY" ? c.companyName ?? c.name : c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tür" error={err("type")}>
          <select name="type" className="input" defaultValue="OTHER">
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Durum">
          <select name="status" className="input" defaultValue="ACTIVE">
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Ücretlendirme">
          <select name="billingType" className="input" defaultValue="HOURLY">
            {BILLING.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Saatlik Ücret (₺)" error={err("hourlyRate")}>
          <input name="hourlyRate" type="number" step="0.01" className="input mono" />
        </Field>
        <Field label="Sabit Ücret (₺)" error={err("flatFee")}>
          <input name="flatFee" type="number" step="0.01" className="input mono" />
        </Field>
      </div>

      <Field label="Karşı Taraf" error={err("opposingParty")}>
        <input name="opposingParty" className="input" />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Mahkeme / Kurum" error={err("courtName")}>
          <input name="courtName" className="input" placeholder="İst. 3. Ticaret Mahkemesi" />
        </Field>
        <Field label="Esas No" error={err("courtFileNo")}>
          <input name="courtFileNo" className="input mono" placeholder="2026/1234" />
        </Field>
      </div>

      <Field label="Açıklama" error={err("description")}>
        <textarea name="description" rows={4} className="input" />
      </Field>

      {state.error && (
        <div className="text-xs px-3 py-2 rounded-md bg-red-50 text-red-700 border border-red-100">
          {state.error}
        </div>
      )}

      <div className="flex gap-3 justify-end border-t border-juris-line-2 pt-4">
        <Link href="/ops" className="btn btn-ghost">İptal</Link>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Oluşturuluyor…" : "Dosya Oluştur"}
        </button>
      </div>

      <style>{`
        .input {
          height: 38px; padding: 0 12px;
          border: 1px solid var(--border); border-radius: 6px;
          background: white; font-size: 13px;
          font-family: inherit;
          outline: none; transition: border-color .15s;
        }
        .input:focus { border-color: var(--juris-navy); box-shadow: 0 0 0 2px rgba(10,34,64,0.1); }
        textarea.input { height: auto; padding: 10px 12px; line-height: 1.5; }
      `}</style>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-juris-ink-2 tracking-wide">{label}</span>
      {children}
      {error && <span className="text-[11px] text-juris-red">{error}</span>}
    </label>
  );
}
