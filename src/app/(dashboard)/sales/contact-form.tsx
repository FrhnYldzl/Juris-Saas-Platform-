"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ContactType } from "@prisma/client";
import {
  Field, Input, TextArea, FormCard, FormRow, FormActions, FormError,
} from "@/components/ui/form";
import { createContact, updateContact, type ContactFormState } from "./actions";

type ContactLite = {
  id: string;
  type: ContactType;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxNumber: string | null;
  tcNumber: string | null;
  isClient: boolean;
  notes: string | null;
};

export function ContactForm({ contact }: { contact?: ContactLite }) {
  const isEdit = Boolean(contact);
  const action = isEdit
    ? updateContact.bind(null, contact!.id)
    : createContact;

  const [state, formAction, pending] = useActionState<ContactFormState, FormData>(
    action as (prev: ContactFormState, fd: FormData) => Promise<ContactFormState>,
    { ok: false },
  );

  const err = (f: string) => state.fieldErrors?.[f]?.[0];
  const [type, setType] = useState<ContactType>(contact?.type ?? "INDIVIDUAL");

  return (
    <form action={formAction}>
      <FormCard>
        {/* Type switch */}
        <Field label="Tür">
          <div className="flex gap-2 p-1 bg-juris-paper-2 rounded-md w-fit">
            {(["INDIVIDUAL", "COMPANY"] as ContactType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={[
                  "px-3.5 h-8 text-xs font-semibold rounded transition-all",
                  type === t
                    ? "bg-white text-juris-navy shadow-juris-sm"
                    : "text-juris-ink-3 hover:text-juris-navy",
                ].join(" ")}
              >
                {t === "INDIVIDUAL" ? "Birey" : "Kurum"}
              </button>
            ))}
            <input type="hidden" name="type" value={type} />
          </div>
        </Field>

        <FormRow>
          <Field
            label={type === "COMPANY" ? "Yetkili Adı Soyadı" : "Ad Soyad"}
            error={err("name")}
            required
          >
            <Input
              name="name"
              defaultValue={contact?.name ?? ""}
              placeholder={type === "COMPANY" ? "Av. Ayşe Yıldız" : "Ayşe Yıldız"}
              required
            />
          </Field>
          {type === "COMPANY" && (
            <Field label="Kurum Adı" error={err("companyName")} required>
              <Input
                name="companyName"
                defaultValue={contact?.companyName ?? ""}
                placeholder="X A.Ş."
              />
            </Field>
          )}
        </FormRow>

        <FormRow>
          <Field label="E-posta" error={err("email")}>
            <Input
              type="email"
              name="email"
              defaultValue={contact?.email ?? ""}
              placeholder="ornek@example.com"
            />
          </Field>
          <Field label="Telefon" error={err("phone")}>
            <Input
              name="phone"
              defaultValue={contact?.phone ?? ""}
              placeholder="+90 532 000 00 00"
            />
          </Field>
        </FormRow>

        <FormRow>
          {type === "COMPANY" ? (
            <Field label="Vergi No" error={err("taxNumber")} hint="10 hane">
              <Input
                name="taxNumber"
                defaultValue={contact?.taxNumber ?? ""}
                inputMode="numeric"
                maxLength={10}
                className="mono"
              />
            </Field>
          ) : (
            <Field label="TC Kimlik No" error={err("tcNumber")} hint="11 hane">
              <Input
                name="tcNumber"
                defaultValue={contact?.tcNumber ?? ""}
                inputMode="numeric"
                maxLength={11}
                className="mono"
              />
            </Field>
          )}
          <Field label="Müvekkil mi?">
            <div className="flex items-center gap-2.5 h-10 px-1">
              <input
                type="checkbox"
                name="isClient"
                defaultChecked={contact?.isClient ?? false}
                className="w-4 h-4 accent-juris-red"
              />
              <span className="text-sm text-juris-ink-2">
                Bu kişi müvekkildir (portal erişimi verilebilir)
              </span>
            </div>
          </Field>
        </FormRow>

        <Field label="Adres" error={err("address")}>
          <TextArea
            name="address"
            rows={2}
            defaultValue={contact?.address ?? ""}
            placeholder="Tam adres"
          />
        </Field>

        <Field label="Notlar" error={err("notes")}>
          <TextArea
            name="notes"
            rows={3}
            defaultValue={contact?.notes ?? ""}
            placeholder="Kişiyle ilgili dahili notlar"
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
            href={isEdit ? `/sales/${contact!.id}` : "/sales"}
            className="btn btn-ghost"
          >
            İptal
          </Link>
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? "Kaydediliyor…" : isEdit ? "Güncelle" : "Kişiyi Oluştur"}
          </button>
        </FormActions>
      </FormCard>
    </form>
  );
}
