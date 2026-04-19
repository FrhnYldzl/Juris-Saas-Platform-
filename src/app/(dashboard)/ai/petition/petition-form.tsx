"use client";

import { useState } from "react";
import { Sparkles, Loader2, Copy, Check, FileDown, RotateCw, AlertCircle } from "lucide-react";
import {
  Field, Input, TextArea, Select, FormCard, FormRow, FormActions,
} from "@/components/ui/form";

const PETITION_OPTIONS = [
  { value: "dava_dilekcesi", label: "Dava Dilekçesi" },
  { value: "cevap_dilekcesi", label: "Cevap Dilekçesi" },
  { value: "itiraz_dilekcesi", label: "İtiraz Dilekçesi" },
  { value: "icra_takip_talebi", label: "İcra Takip Talebi" },
  { value: "tazminat_talebi", label: "Tazminat Talebi" },
  { value: "fesih_bildirimi", label: "Fesih Bildirimi" },
  { value: "ihtarname", label: "İhtarname" },
  { value: "dilekce_genel", label: "Genel Dilekçe" },
];

type MatterOpt = { id: string; matterNumber: string; title: string };

interface Result {
  draft: string;
  typeLabel: string;
  model: string;
  provider: string;
}

export function PetitionDraftForm({ matters }: { matters: MatterOpt[] }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const onSubmit = async (formData: FormData) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const body = {
        matterId: formData.get("matterId") || null,
        type: formData.get("type"),
        subject: formData.get("subject"),
        facts: formData.get("facts"),
        requests: formData.get("requests") || null,
        extraContext: formData.get("extraContext") || null,
      };
      const res = await fetch("/api/ai/petition-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Taslak üretilemedi");
      } else {
        setResult(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ağ hatası");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTxt = () => {
    if (!result) return;
    const blob = new Blob([result.draft], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `dilekce-${result.typeLabel.toLowerCase().replace(/\s+/g, "-")}-${date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <form action={onSubmit}>
        <FormCard>
          <FormRow>
            <Field label="Dilekçe Türü" required>
              <Select name="type" defaultValue="dava_dilekcesi" required>
                {PETITION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="İlgili Dosya (opsiyonel)" hint="Varsa dosya bilgisi AI'a bağlam olarak gider">
              <Select name="matterId" defaultValue="">
                <option value="">— Seçilmedi —</option>
                {matters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.matterNumber} · {m.title}
                  </option>
                ))}
              </Select>
            </Field>
          </FormRow>

          <Field label="Konu" required hint="Örn: Sözleşme ihlali nedeniyle tazminat">
            <Input name="subject" required />
          </Field>

          <Field label="Olaylar" required hint="Kronolojik, net, objektif">
            <TextArea
              name="facts"
              rows={6}
              required
              placeholder="Örn: 15.01.2026 tarihinde taraflar arasında X A.Ş. ile hizmet sözleşmesi imzalanmıştır. Müvekkilimiz yükümlülüklerini yerine getirmiş ancak karşı taraf 3 aylık ödemeyi aksatmıştır. …"
            />
          </Field>

          <Field label="Talepler" hint="Boş bırakılırsa AI olaylardan çıkarır">
            <TextArea
              name="requests"
              rows={3}
              placeholder="Örn: 1) Sözleşmenin feshi, 2) 150.000 TL alacak + faiz, 3) Yargılama giderleri"
            />
          </Field>

          <Field label="Ek Bağlam" hint="Atıflar, tanık bilgileri, özel koşullar…">
            <TextArea
              name="extraContext"
              rows={3}
              placeholder="Özel mevzuat atıfları veya AI'ın bilmesi gereken ek bilgi"
            />
          </Field>

          <FormActions>
            <button type="submit" disabled={loading} className="btn btn-accent">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {loading ? "Taslak hazırlanıyor…" : "Taslak Oluştur"}
            </button>
          </FormActions>
        </FormCard>
      </form>

      {(loading || error || result) && (
        <div className="mt-6">
          {loading && (
            <div className="card p-10 flex flex-col items-center gap-3">
              <Loader2 size={28} className="animate-spin text-juris-red" />
              <div className="text-sm text-juris-ink-3">AI dilekçe yazıyor… 10-20 saniye</div>
            </div>
          )}

          {error && (
            <div className="card p-5 flex items-start gap-3 border-juris-red/30" style={{ background: "rgba(188,47,44,0.04)" }}>
              <AlertCircle size={18} className="text-juris-red flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#8A1F1D] mb-1">Taslak üretilemedi</div>
                <p className="text-sm text-juris-ink-2">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-juris-line-2 flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-juris-red font-semibold mb-0.5">
                    AI Taslak
                  </div>
                  <h3 className="display text-lg text-juris-navy">{result.typeLabel}</h3>
                  <div className="text-[10px] text-juris-ink-4 mt-1 mono">
                    {result.provider} · {result.model}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={copy} className="btn btn-sm btn-ghost">
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? "Kopyalandı" : "Kopyala"}
                  </button>
                  <button type="button" onClick={downloadTxt} className="btn btn-sm btn-ghost">
                    <FileDown size={12} /> .txt İndir
                  </button>
                  <button
                    type="button"
                    onClick={() => { setResult(null); window.scrollTo(0, 0); }}
                    className="btn btn-sm btn-ghost"
                  >
                    <RotateCw size={12} /> Yeniden
                  </button>
                </div>
              </div>
              <div className="px-8 py-6 bg-juris-paper-2">
                <pre className="whitespace-pre-wrap font-serif text-[14px] leading-[1.7] text-juris-navy">
                  {result.draft}
                </pre>
              </div>
              <div className="px-6 py-3 bg-juris-warn/5 border-t border-juris-warn/20 text-[11px] text-[#7a4f15]">
                ⚠ Bu bir AI taslaktır. Mahkemeye sunmadan önce avukat kontrolünden geçirin.
                Mevzuat atıflarını doğrulayın, placeholder&apos;ları doldurun.
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
