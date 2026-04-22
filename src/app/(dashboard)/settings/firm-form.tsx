"use client";

import { useActionState } from "react";
import { Save, CheckCircle2, AlertCircle } from "lucide-react";
import { updateFirmInfo, type FirmFormState } from "./actions";

type FirmDefaults = {
  name: string;
  taxNumber: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  slug: string;
};

export function FirmForm({ firm, canEdit }: { firm: FirmDefaults; canEdit: boolean }) {
  const [state, formAction, pending] = useActionState<FirmFormState, FormData>(
    updateFirmInfo,
    null,
  );

  const errors = state && !state.ok ? state.errors : {};

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field
          label="Firma Adı"
          name="name"
          required
          defaultValue={firm.name}
          error={errors.name}
          disabled={!canEdit}
        />
        <Field
          label="Kısa Ad (slug)"
          name="slug"
          defaultValue={firm.slug}
          hint="URL dostu kısa ad — değiştirilemez"
          disabled
          mono
        />
        <Field
          label="Vergi No"
          name="taxNumber"
          defaultValue={firm.taxNumber ?? ""}
          error={errors.taxNumber}
          placeholder="Örn: 1234567890"
          disabled={!canEdit}
          mono
        />
        <Field
          label="E-posta"
          name="email"
          type="email"
          defaultValue={firm.email ?? ""}
          error={errors.email}
          placeholder="info@firma.com"
          disabled={!canEdit}
        />
        <Field
          label="Telefon"
          name="phone"
          defaultValue={firm.phone ?? ""}
          error={errors.phone}
          placeholder="+90 xxx xxx xx xx"
          disabled={!canEdit}
          mono
        />
        <Field
          label="Web Sitesi"
          name="website"
          type="url"
          defaultValue={firm.website ?? ""}
          error={errors.website}
          placeholder="https://…"
          disabled={!canEdit}
        />
      </div>

      <div>
        <label className="text-[11px] text-juris-ink-3 font-semibold uppercase tracking-wider mb-1.5 block">
          Adres
        </label>
        <textarea
          name="address"
          rows={3}
          defaultValue={firm.address ?? ""}
          disabled={!canEdit}
          placeholder="Kurumsal adres…"
          className="w-full px-3 py-2 rounded-md text-[13px] text-juris-navy bg-white outline-none resize-none disabled:bg-juris-paper-2 disabled:opacity-75"
          style={{ border: "1px solid #E5E9F0" }}
        />
        {errors.address && (
          <div className="text-[11px] text-juris-red mt-1 flex items-center gap-1">
            <AlertCircle size={10} /> {errors.address}
          </div>
        )}
      </div>

      {state?.message && (
        <div
          className="rounded-md p-3 text-[12px] flex items-start gap-2"
          style={{
            background: state.ok ? "rgba(31,122,78,0.08)" : "rgba(188,47,44,0.08)",
            color: state.ok ? "#1F7A4E" : "#BC2F2C",
            border: `1px solid ${state.ok ? "#1F7A4E33" : "#BC2F2C33"}`,
          }}
        >
          {state.ok
            ? <CheckCircle2 size={13} className="shrink-0 mt-0.5" />
            : <AlertCircle size={13} className="shrink-0 mt-0.5" />}
          <span className="font-medium">{state.message}</span>
        </div>
      )}

      {canEdit && (
        <div className="flex items-center justify-end gap-2 pt-3" style={{ borderTop: "1px solid #EEF1F5" }}>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-semibold text-white transition-all disabled:opacity-60"
            style={{ background: "#0A2240" }}
          >
            <Save size={12} />
            {pending ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
          </button>
        </div>
      )}

      {!canEdit && (
        <div className="text-[11px] text-juris-ink-4 italic">
          Firma bilgilerini düzenlemek için <span className="font-semibold">OWNER</span> veya <span className="font-semibold">PARTNER</span> yetkisi gerekir.
        </div>
      )}
    </form>
  );
}

function Field({
  label, name, defaultValue, type = "text", required, error, placeholder, disabled, hint, mono,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="text-[11px] text-juris-ink-3 font-semibold uppercase tracking-wider mb-1.5 block">
        {label}
        {required && <span className="text-juris-red ml-1">*</span>}
      </label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-md text-[13px] text-juris-navy bg-white outline-none disabled:bg-juris-paper-2 disabled:opacity-75 ${mono ? "mono" : ""}`}
        style={{ border: `1px solid ${error ? "#BC2F2C" : "#E5E9F0"}` }}
      />
      {hint && !error && (
        <div className="text-[10px] text-juris-ink-4 mt-1">{hint}</div>
      )}
      {error && (
        <div className="text-[11px] text-juris-red mt-1 flex items-center gap-1">
          <AlertCircle size={10} /> {error}
        </div>
      )}
    </div>
  );
}
