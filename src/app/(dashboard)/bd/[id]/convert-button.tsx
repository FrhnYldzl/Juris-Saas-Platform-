"use client";

import { useActionState, useState } from "react";
import { Trophy, X } from "lucide-react";
import { Field, Input, Select, FormRow, FormError } from "@/components/ui/form";
import { convertLeadToMatter, type ConvertState } from "../actions";

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

const BILLING = [
  { value: "HOURLY", label: "Saatlik" },
  { value: "FLAT_FEE", label: "Sabit Ücret" },
  { value: "CONTINGENCY", label: "Başarı Ücreti" },
  { value: "RETAINER", label: "Retainer" },
];

export function ConvertButton({
  leadId, defaultTitle, contactName,
}: {
  leadId: string;
  defaultTitle: string;
  contactName: string;
}) {
  const [open, setOpen] = useState(false);
  const action = convertLeadToMatter.bind(null, leadId);
  const [state, formAction, pending] = useActionState<ConvertState, FormData>(
    action as (prev: ConvertState, fd: FormData) => Promise<ConvertState>,
    { ok: false },
  );
  const err = (f: string) => state.fieldErrors?.[f]?.[0];
  const [billingType, setBillingType] = useState<"HOURLY" | "FLAT_FEE" | "CONTINGENCY" | "RETAINER">("HOURLY");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-accent"
      >
        <Trophy size={14} /> Müvekkile Dönüştür
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(10,34,64,0.45)", backdropFilter: "blur(2px)" }}
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-juris-pop max-w-lg w-full animate-modalIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-6 border-b border-juris-line-2">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-juris-red font-semibold mb-1">
                  Fırsat → Dosya
                </div>
                <h3 className="display text-xl text-juris-navy">Müvekkile Dönüştür</h3>
                <div className="text-xs text-juris-ink-3 mt-1">
                  <span className="font-medium text-juris-ink-2">{contactName}</span> için yeni dosya
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="text-juris-ink-4 hover:text-juris-navy p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form action={formAction} className="p-6 flex flex-col gap-4">
              <Field label="Dosya Başlığı" error={err("matterTitle")} required>
                <Input
                  name="matterTitle"
                  defaultValue={defaultTitle}
                  required
                />
              </Field>

              <FormRow>
                <Field label="Dosya Türü">
                  <Select name="matterType" defaultValue="CONSULTING">
                    {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </Select>
                </Field>
                <Field label="Ücretlendirme">
                  <Select
                    name="billingType"
                    value={billingType}
                    onChange={(e) => setBillingType(e.target.value as typeof billingType)}
                  >
                    {BILLING.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </Select>
                </Field>
              </FormRow>

              {billingType === "HOURLY" && (
                <Field label="Saatlik Ücret (₺)">
                  <Input type="number" step="0.01" name="hourlyRate" className="mono" />
                </Field>
              )}
              {(billingType === "FLAT_FEE" || billingType === "RETAINER") && (
                <Field label="Sabit Ücret (₺)">
                  <Input type="number" step="0.01" name="flatFee" className="mono" />
                </Field>
              )}

              <label className="flex items-center gap-2.5 text-sm text-juris-ink-2 py-1">
                <input
                  type="checkbox"
                  name="ensureClient"
                  defaultChecked
                  className="w-4 h-4 accent-juris-red"
                />
                Kişiyi “Müvekkil” olarak işaretle (henüz değilse)
              </label>

              {state.error && <FormError>{state.error}</FormError>}

              <div className="flex gap-2 justify-end pt-2 border-t border-juris-line-2 mt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="btn btn-ghost"
                >
                  Vazgeç
                </button>
                <button type="submit" disabled={pending} className="btn btn-accent">
                  {pending ? "Dönüştürülüyor…" : "Dosyayı Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
