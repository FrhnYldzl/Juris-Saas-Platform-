"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import {
  Field, Input, TextArea, Select, FormCard, FormRow, FormActions, FormError,
} from "@/components/ui/form";
import { createInvoice, type InvoiceFormState } from "./actions";
import { formatTRY } from "@/lib/utils";

type ContactOpt = { id: string; label: string; hasMatters: boolean };
type MatterOpt = { id: string; matterNumber: string; title: string; clientId: string | null };

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

const newItem = (): LineItem => ({
  id: Math.random().toString(36).slice(2),
  description: "",
  quantity: 1,
  unitPrice: 0,
});

export function InvoiceForm({
  clients, matters,
}: {
  clients: ContactOpt[];
  matters: MatterOpt[];
}) {
  const [state, formAction, pending] = useActionState<InvoiceFormState, FormData>(
    createInvoice,
    { ok: false },
  );
  const err = (f: string) => state.fieldErrors?.[f]?.[0];

  const [clientId, setClientId] = useState<string>("");
  const [items, setItems] = useState<LineItem[]>([newItem()]);
  const [taxRate, setTaxRate] = useState<number>(20);

  const today = new Date().toISOString().slice(0, 10);
  const defaultDue = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

  // Matters filtered by selected client
  const matterOpts = useMemo(
    () => matters.filter((m) => !clientId || m.clientId === clientId),
    [matters, clientId],
  );

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
      0,
    );
    const tax = subtotal * (taxRate / 100);
    return { subtotal, tax, total: subtotal + tax };
  }, [items, taxRate]);

  const updateItem = (id: string, patch: Partial<LineItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const removeItem = (id: string) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));
  const addItem = () => setItems((prev) => [...prev, newItem()]);

  return (
    <form action={formAction}>
      <FormCard>
        <FormRow>
          <Field label="Müvekkil" error={err("clientId")} required>
            <Select
              name="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            >
              <option value="">— Seçiniz —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Dosya (opsiyonel)" error={err("matterId")}>
            <Select name="matterId" defaultValue="" disabled={!clientId}>
              <option value="">— Seçilmedi —</option>
              {matterOpts.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.matterNumber} · {m.title}
                </option>
              ))}
            </Select>
          </Field>
        </FormRow>

        <FormRow cols={3}>
          <Field label="Düzenleme Tarihi">
            <Input type="date" name="issuedAt" defaultValue={today} />
          </Field>
          <Field label="Vade Tarihi">
            <Input type="date" name="dueAt" defaultValue={defaultDue} />
          </Field>
          <Field label="Durum">
            <Select name="status" defaultValue="DRAFT">
              <option value="DRAFT">Taslak</option>
              <option value="SENT">Gönderildi</option>
            </Select>
          </Field>
        </FormRow>

        {/* Line items table */}
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-juris-ink tracking-[0.06em] uppercase">
              Satır Kalemleri
            </span>
            {err("items") && (
              <span className="text-[11px] text-juris-red">{err("items")}</span>
            )}
          </div>

          <div className="rounded-md border border-juris-line overflow-hidden">
            <table className="w-full">
              <thead className="bg-juris-paper-2 text-[10px] uppercase tracking-wider text-juris-ink-3">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Açıklama</th>
                  <th className="text-right px-3 py-2 font-semibold w-[100px]">Miktar</th>
                  <th className="text-right px-3 py-2 font-semibold w-[140px]">Birim Fiyat</th>
                  <th className="text-right px-3 py-2 font-semibold w-[140px]">Tutar</th>
                  <th className="w-[44px]"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const rowTotal = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
                  return (
                    <tr key={it.id} className="border-t border-juris-line-2">
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={it.description}
                          onChange={(e) => updateItem(it.id, { description: e.target.value })}
                          placeholder="Örn: Mart 2026 - 24 saat hukuki hizmet"
                          className="w-full h-9 px-2.5 rounded border border-transparent hover:border-juris-line bg-white text-sm focus:border-juris-red focus:ring-[3px] focus:ring-juris-red/10 outline-none"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={it.quantity}
                          onChange={(e) => updateItem(it.id, { quantity: +e.target.value })}
                          className="w-full h-9 px-2.5 rounded border border-transparent hover:border-juris-line bg-white text-sm text-right mono focus:border-juris-red focus:ring-[3px] focus:ring-juris-red/10 outline-none"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={it.unitPrice}
                          onChange={(e) => updateItem(it.id, { unitPrice: +e.target.value })}
                          className="w-full h-9 px-2.5 rounded border border-transparent hover:border-juris-line bg-white text-sm text-right mono focus:border-juris-red focus:ring-[3px] focus:ring-juris-red/10 outline-none"
                        />
                      </td>
                      <td className="p-1.5 text-right mono text-sm font-semibold text-juris-navy">
                        {formatTRY(rowTotal)}
                      </td>
                      <td className="p-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(it.id)}
                          disabled={items.length === 1}
                          className="p-1.5 text-juris-ink-4 hover:text-juris-red disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Satırı sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addItem}
            className="btn btn-sm btn-ghost w-fit mt-1"
          >
            <Plus size={12} /> Satır Ekle
          </button>
        </div>

        {/* Totals panel */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-5 mt-3">
          <Field label="Notlar">
            <TextArea
              name="notes"
              rows={3}
              placeholder="Örn: Ödemeyi 14 gün içinde yapınız. Banka hesap bilgileri: …"
            />
          </Field>

          <div className="rounded-lg border border-juris-line bg-juris-paper-2 p-5 flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-juris-ink-3">Ara Toplam</span>
              <span className="mono font-medium">{formatTRY(totals.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-juris-ink-3">KDV</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(+e.target.value)}
                  className="w-14 h-7 px-1.5 rounded border border-juris-line bg-white text-xs text-right mono"
                />
                <span className="text-juris-ink-3">%</span>
                <input type="hidden" name="taxRate" value={taxRate} />
              </div>
              <span className="mono">{formatTRY(totals.tax)}</span>
            </div>
            <div className="sep my-1" />
            <div className="flex justify-between items-baseline">
              <span className="text-juris-ink font-semibold">Genel Toplam</span>
              <span className="mono text-lg font-semibold text-juris-navy">
                {formatTRY(totals.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Hidden JSON payload of items */}
        <input
          type="hidden"
          name="items"
          value={JSON.stringify(
            items.map((it) => ({
              description: it.description,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
            })),
          )}
        />

        {state.error && <FormError>{state.error}</FormError>}

        <FormActions>
          <Link href="/finance" className="btn btn-ghost">İptal</Link>
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? "Oluşturuluyor…" : "Fatura Oluştur"}
          </button>
        </FormActions>
      </FormCard>
    </form>
  );
}
