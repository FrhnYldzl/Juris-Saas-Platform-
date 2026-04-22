"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Save, AlertCircle, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import type { ContentChannel } from "@prisma/client";
import { savePlan, type StageState } from "./actions";

export function StagePlan({ item }: { item: {
  id: string;
  title: string;
  summary: string | null;
  channel: ContentChannel;
  contentType: string | null;
  keywords: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  readMinutes: number | null;
  publishAt: Date | null;
  author: string | null;
  tags: string[];
  status: string;
} }) {
  const [state, formAction, pending] = useActionState<StageState, FormData>(
    (prev, fd) => savePlan(item.id, prev, fd),
    null,
  );
  const errs = state && !state.ok ? (state.errors ?? {}) : {};

  return (
    <form action={formAction} className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
      {/* Left: form */}
      <div className="card p-6 flex flex-col gap-4">
        <div className="mb-1">
          <h3
            className="leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, color: "#0A2240" }}
          >
            İçerik briefi
          </h3>
          <p className="text-[12px] text-juris-ink-3 mt-1">
            Üretime başlamadan önce strateji ve hedefi netleştir — bu plan AI taslak üretimini besleyecek.
          </p>
        </div>

        <Field label="Başlık" name="title" required defaultValue={item.title} error={errs.title} placeholder="Ör. KVKK 2026 Kontrol Listesi" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SelectField
            label="İçerik Türü"
            name="contentType"
            required
            defaultValue={item.contentType ?? ""}
            error={errs.contentType}
            options={[
              { value: "SEO Makale",      label: "SEO Makale (Blog)" },
              { value: "Vaka Notu",       label: "Vaka Notu" },
              { value: "Whitepaper",      label: "Whitepaper" },
              { value: "Newsletter",      label: "Newsletter" },
              { value: "Basın Bülteni",   label: "Basın Bülteni" },
              { value: "LinkedIn Post",   label: "LinkedIn Post" },
              { value: "Instagram Carousel", label: "Instagram Carousel" },
              { value: "Podcast Özeti",   label: "Podcast Özeti" },
            ]}
          />
          <SelectField
            label="Ana Kanal"
            name="channel"
            required
            defaultValue={item.channel}
            error={errs.channel}
            options={[
              { value: "BLOG",       label: "Blog" },
              { value: "LINKEDIN",   label: "LinkedIn" },
              { value: "INSTAGRAM",  label: "Instagram" },
              { value: "X",          label: "X (Twitter)" },
              { value: "NEWSLETTER", label: "Newsletter" },
              { value: "PODCAST",    label: "Podcast" },
              { value: "VIDEO",      label: "Video" },
              { value: "OTHER",      label: "Diğer" },
            ]}
          />
        </div>

        <TextareaField
          label="Brief / Özet"
          name="summary"
          defaultValue={item.summary ?? ""}
          rows={3}
          placeholder="Bu içerik neden, kimler için, neyi değiştirmesini bekliyoruz?"
        />

        <Field
          label="Anahtar Sözcükler (SEO)"
          name="keywords"
          defaultValue={item.keywords.join(", ")}
          placeholder="kvkk, kvkk 2026, uyum süreci, envanter"
          hint="Virgülle ayır — trafik stüdyosunda izlenir"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field
            label="Meta Title (≤ 70)"
            name="metaTitle"
            defaultValue={item.metaTitle ?? ""}
            error={errs.metaTitle}
            placeholder="SEO başlığı · Google arama sonucunda görünür"
          />
          <Field
            label="Meta Description (≤ 180)"
            name="metaDescription"
            defaultValue={item.metaDescription ?? ""}
            error={errs.metaDescription}
            placeholder="Arama sonucu açıklaması"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field
            label="Tahmini Okuma Süresi"
            name="readMinutes"
            type="number"
            defaultValue={item.readMinutes?.toString() ?? ""}
            placeholder="8"
            hint="dakika"
          />
          <Field
            label="Hedef Yayım Tarihi"
            name="publishAt"
            type="datetime-local"
            defaultValue={item.publishAt ? toLocalInput(item.publishAt) : ""}
            hint="tentatif — sonra değişebilir"
          />
          <Field
            label="Yazar"
            name="author"
            defaultValue={item.author ?? ""}
            placeholder="Av. Zeynep Arslan"
          />
        </div>

        <Field
          label="Etiketler"
          name="tags"
          defaultValue={item.tags.join(", ")}
          placeholder="kvkk, kurumsal, teknoloji"
          hint="virgülle ayır"
        />

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

        <div className="flex items-center justify-between gap-2 pt-3" style={{ borderTop: "1px solid #EEF1F5" }}>
          <div className="text-[11px] text-juris-ink-4">
            {state?.ok
              ? <>
                  Plan kaydedildi.{" "}
                  <Link href={`/marketing/${item.id}?stage=uret`} className="text-juris-red font-semibold hover:underline inline-flex items-center gap-1">
                    Üretim aşamasına geç <ArrowRight size={10} />
                  </Link>
                </>
              : "Kaydet → sıradaki adım Üretim"}
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-semibold text-white disabled:opacity-60"
            style={{ background: "#0A2240" }}
          >
            <Save size={12} />
            {pending ? "Kaydediliyor…" : "Planı Kaydet"}
          </button>
        </div>
      </div>

      {/* Right rail: Strategic hints */}
      <aside className="flex flex-col gap-4">
        <div className="card p-5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-juris-red font-semibold mb-2 inline-flex items-center gap-1.5">
            <Sparkles size={11} /> Strateji İpuçları
          </div>
          <ul className="flex flex-col gap-2.5 text-[12.5px] text-juris-ink-2">
            <Hint>
              <strong className="text-juris-navy">Brief</strong> ne kadar netse AI taslak o kadar yerinde olur.
              &ldquo;Kimler için, ne problemi çözüyor, aksiyon çağrısı ne&rdquo; yazmayı unutma.
            </Hint>
            <Hint>
              <strong className="text-juris-navy">Anahtar sözcükler</strong> → Trafik Stüdyosu bu kelimeleri izler ve
              pozisyon değişimlerini raporlar.
            </Hint>
            <Hint>
              <strong className="text-juris-navy">Meta başlık</strong> arama sonuçlarında ilk görünen satırdır —
              70 karakter sınırı aşılmamalı.
            </Hint>
            <Hint>
              <strong className="text-juris-navy">Okuma süresi</strong> ≥ 8 dk makalelerin SEO performansı sistematik
              olarak daha iyi.
            </Hint>
          </ul>
        </div>

        <div
          className="rounded-xl p-5 relative overflow-hidden text-white"
          style={{ background: "linear-gradient(135deg, #0A2240 0%, #1a3558 100%)" }}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{ backgroundImage: "radial-gradient(300px 200px at 100% 0%, rgba(188,47,44,0.30), transparent 60%)" }}
          />
          <div className="relative">
            <div className="text-[9.5px] uppercase tracking-[0.18em] text-white/50 font-semibold mb-1">
              Sıradaki adım
            </div>
            <h4
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18 }}
            >
              Plan kaydedilince <em className="italic" style={{ color: "#F4A4A1" }}>Üretim</em> aşaması açılır.
            </h4>
            <p className="text-[11.5px] text-white/70 mt-2 leading-relaxed">
              Üretim aşamasında <strong>AI destekli taslak üret</strong> butonuyla plan, anahtar sözcük ve briefi
              kullanarak başlangıç taslağı hazırlanır; istediğin gibi düzenleyebilirsin.
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─ shared inputs ─

function Field({
  label, name, defaultValue, type = "text", required, error, placeholder, hint,
}: {
  label: string; name: string; defaultValue?: string; type?: string;
  required?: boolean; error?: string; placeholder?: string; hint?: string;
}) {
  return (
    <div>
      <label className="text-[11px] text-juris-ink-3 font-semibold uppercase tracking-wider mb-1.5 block">
        {label}{required && <span className="text-juris-red ml-1">*</span>}
      </label>
      <input
        name={name} type={type} defaultValue={defaultValue} required={required} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-md text-[13px] text-juris-navy bg-white outline-none"
        style={{ border: `1px solid ${error ? "#BC2F2C" : "#E5E9F0"}` }}
      />
      {hint && !error && <div className="text-[10px] text-juris-ink-4 mt-1">{hint}</div>}
      {error && (
        <div className="text-[11px] text-juris-red mt-1 flex items-center gap-1">
          <AlertCircle size={10} /> {error}
        </div>
      )}
    </div>
  );
}

function TextareaField({
  label, name, defaultValue, rows = 3, placeholder,
}: {
  label: string; name: string; defaultValue?: string; rows?: number; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[11px] text-juris-ink-3 font-semibold uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <textarea
        name={name} rows={rows} defaultValue={defaultValue} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-md text-[13px] text-juris-navy bg-white outline-none resize-none"
        style={{ border: "1px solid #E5E9F0" }}
      />
    </div>
  );
}

function SelectField({
  label, name, defaultValue, required, error, options,
}: {
  label: string; name: string; defaultValue?: string; required?: boolean; error?: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="text-[11px] text-juris-ink-3 font-semibold uppercase tracking-wider mb-1.5 block">
        {label}{required && <span className="text-juris-red ml-1">*</span>}
      </label>
      <select
        name={name} defaultValue={defaultValue} required={required}
        className="w-full px-3 py-2 rounded-md text-[13px] text-juris-navy bg-white outline-none"
        style={{ border: `1px solid ${error ? "#BC2F2C" : "#E5E9F0"}` }}
      >
        <option value="" disabled>— seçin —</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && (
        <div className="text-[11px] text-juris-red mt-1 flex items-center gap-1">
          <AlertCircle size={10} /> {error}
        </div>
      )}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 leading-relaxed">
      <span className="w-1 h-1 rounded-full bg-juris-red mt-1.5 shrink-0" />
      <span>{children}</span>
    </li>
  );
}
