"use client";

import { useActionState } from "react";
import Link from "next/link";
import { LeadStage } from "@prisma/client";
import {
  Field, Input, TextArea, Select, FormCard, FormRow, FormActions, FormError,
} from "@/components/ui/form";
import { createLead, updateLead, type LeadFormState } from "./actions";

type ContactOpt = { id: string; label: string };
type UserOpt = { id: string; name: string };

type LeadLite = {
  id: string;
  title: string;
  contactId: string | null;
  ownerId: string | null;
  source: string | null;
  stage: LeadStage;
  value: string | null;
  probability: number;
  expectedCloseAt: Date | null;
  description: string | null;
};

const STAGES: { value: LeadStage; label: string }[] = [
  { value: "NEW", label: "Yeni" },
  { value: "QUALIFIED", label: "Nitelikli" },
  { value: "MEETING", label: "Toplantı" },
  { value: "PROPOSAL", label: "Teklif" },
  { value: "NEGOTIATION", label: "Müzakere" },
  { value: "WON", label: "Kazanıldı" },
  { value: "LOST", label: "Kaybedildi" },
];

const SOURCES = ["LinkedIn", "Referans", "Web Sitesi", "Etkinlik", "Soğuk Arama", "Diğer"];

export function LeadForm({
  lead, contacts, users,
}: {
  lead?: LeadLite;
  contacts: ContactOpt[];
  users: UserOpt[];
}) {
  const isEdit = Boolean(lead);
  const action = isEdit ? updateLead.bind(null, lead!.id) : createLead;
  const [state, formAction, pending] = useActionState<LeadFormState, FormData>(
    action as (prev: LeadFormState, fd: FormData) => Promise<LeadFormState>,
    { ok: false },
  );
  const err = (f: string) => state.fieldErrors?.[f]?.[0];

  const dateInput = lead?.expectedCloseAt
    ? new Date(lead.expectedCloseAt).toISOString().slice(0, 10)
    : "";

  return (
    <form action={formAction}>
      <FormCard>
        <Field label="Başlık" error={err("title")} required>
          <Input
            name="title"
            defaultValue={lead?.title ?? ""}
            placeholder="Örn: X A.Ş. — şirket kuruluşu"
            required
          />
        </Field>

        <FormRow>
          <Field label="Müvekkil Adayı" error={err("contactId")}>
            <Select name="contactId" defaultValue={lead?.contactId ?? ""}>
              <option value="">— Seçilmedi —</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Sahip">
            <Select name="ownerId" defaultValue={lead?.ownerId ?? ""}>
              <option value="">— Kendim —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </Select>
          </Field>
        </FormRow>

        <FormRow cols={3}>
          <Field label="Aşama">
            <Select name="stage" defaultValue={lead?.stage ?? "NEW"}>
              {STAGES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Kaynak">
            <Select name="source" defaultValue={lead?.source ?? ""}>
              <option value="">— Seçilmedi —</option>
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Olasılık (%)" hint="0-100">
            <Input
              type="number"
              name="probability"
              min={0}
              max={100}
              defaultValue={lead?.probability ?? 20}
              className="mono"
            />
          </Field>
        </FormRow>

        <FormRow>
          <Field label="Beklenen Değer (₺)" error={err("value")} hint="Kapanırsa fatura büyüklüğü">
            <Input
              type="number"
              step="0.01"
              name="value"
              defaultValue={lead?.value?.toString() ?? ""}
              className="mono"
              placeholder="50000"
            />
          </Field>
          <Field label="Beklenen Kapanış" error={err("expectedCloseAt")}>
            <Input
              type="date"
              name="expectedCloseAt"
              defaultValue={dateInput}
            />
          </Field>
        </FormRow>

        <Field label="Açıklama" error={err("description")}>
          <TextArea
            name="description"
            rows={4}
            defaultValue={lead?.description ?? ""}
            placeholder="İhtiyaç, beklenti, önceki konuşmalar…"
          />
        </Field>

        {state.error && <FormError>{state.error}</FormError>}
        {isEdit && state.ok && (
          <div className="text-xs px-3 py-2.5 rounded-md border border-juris-success/20 bg-juris-success/5 text-juris-success">
            Kaydedildi.
          </div>
        )}

        <FormActions>
          <Link
            href={isEdit ? `/bd/${lead!.id}` : "/bd"}
            className="btn btn-ghost"
          >
            İptal
          </Link>
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? "Kaydediliyor…" : isEdit ? "Güncelle" : "Fırsatı Oluştur"}
          </button>
        </FormActions>
      </FormCard>
    </form>
  );
}
