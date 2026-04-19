"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy } from "lucide-react";
import {
  Field, Input, Select, FormCard, FormRow, FormActions, FormError,
} from "@/components/ui/form";
import { inviteMember, type InviteState } from "../actions";

const ROLES: { value: string; label: string; hint?: string }[] = [
  { value: "OWNER", label: "Kurucu Ortak", hint: "Tam yetki" },
  { value: "PARTNER", label: "Yönetici Ortak", hint: "Neredeyse tam yetki" },
  { value: "ASSOCIATE", label: "Avukat", hint: "Dosya + fatura oluşturma" },
  { value: "PARALEGAL", label: "Paralegal / Stajyer", hint: "Okuma + belge yükleme" },
  { value: "ADMIN_STAFF", label: "İdari Personel", hint: "Finans + ekip" },
];

export function InviteForm({ canAssignOwner }: { canAssignOwner: boolean }) {
  const [state, formAction, pending] = useActionState<InviteState, FormData>(
    inviteMember,
    { ok: false },
  );
  const err = (f: string) => state.fieldErrors?.[f]?.[0];
  const [copied, setCopied] = useState(false);

  const visibleRoles = canAssignOwner ? ROLES : ROLES.filter((r) => r.value !== "OWNER");

  const copyTempPassword = async () => {
    if (!state.invited?.tempPassword) return;
    await navigator.clipboard.writeText(state.invited.tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (state.ok && state.invited) {
    return (
      <div className="card p-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={22} className="text-juris-success flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="display text-lg text-juris-navy mb-1">Üye oluşturuldu</h3>
            <p className="text-sm text-juris-ink-2">
              <span className="mono font-semibold">{state.invited.email}</span> ekibinize eklendi.
              İlk giriş için geçici şifre aşağıda.
            </p>
          </div>
        </div>

        <div className="rounded-md border border-juris-line bg-juris-paper-2 p-4">
          <div className="label mb-2">Geçici Şifre</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 mono text-sm text-juris-navy bg-white px-3 py-2 rounded border border-juris-line-2 select-all">
              {state.invited.tempPassword}
            </code>
            <button
              type="button"
              onClick={copyTempPassword}
              className="btn btn-sm btn-ghost"
            >
              <Copy size={12} /> {copied ? "Kopyalandı" : "Kopyala"}
            </button>
          </div>
          <p className="text-[11px] text-juris-ink-3 mt-2">
            Bu şifreyi üyeye güvenli bir kanaldan iletin. İlk girişte değiştirmesini önerin.
            E-posta bildirimi v0.3&apos;te otomatik gidecek.
          </p>
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-juris-line-2">
          <Link href="/people" className="btn btn-ghost">Listeye Dön</Link>
          <Link href="/people/invite" className="btn btn-primary">Başka Üye Davet Et</Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <FormCard>
        <FormRow>
          <Field label="Ad Soyad" error={err("name")} required>
            <Input name="name" placeholder="Av. Ayşe Yıldız" required />
          </Field>
          <Field label="Unvan" error={err("title")} hint="Av., Stj. Av., …">
            <Input name="title" placeholder="Av." />
          </Field>
        </FormRow>

        <Field label="E-posta" error={err("email")} required hint="Google ile girişte bu e-posta kullanılacak">
          <Input type="email" name="email" placeholder="ornek@jurishukuk.com" required />
        </Field>

        <Field label="Rol" error={err("role")} required>
          <Select name="role" defaultValue="ASSOCIATE">
            {visibleRoles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}{r.hint ? ` — ${r.hint}` : ""}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Geçici Şifre (opsiyonel)" hint="Boş bırak: otomatik güçlü şifre üretilir">
          <Input type="text" name="tempPassword" minLength={8} placeholder="Boş bırakılabilir" />
        </Field>

        {state.error && <FormError>{state.error}</FormError>}

        <FormActions>
          <Link href="/people" className="btn btn-ghost">İptal</Link>
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? "Oluşturuluyor…" : "Üyeyi Oluştur"}
          </button>
        </FormActions>
      </FormCard>
    </form>
  );
}
