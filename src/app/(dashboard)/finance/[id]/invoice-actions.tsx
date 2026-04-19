"use client";

import { useTransition } from "react";
import { InvoiceStatus } from "@prisma/client";
import { Send, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { markInvoiceStatus, deleteInvoice } from "../actions";

export function InvoiceActions({
  invoiceId, status,
}: {
  invoiceId: string;
  status: InvoiceStatus;
}) {
  const [pending, start] = useTransition();

  const changeStatus = (next: InvoiceStatus) => {
    start(async () => {
      try {
        await markInvoiceStatus(invoiceId, next);
      } catch (err) {
        alert(err instanceof Error ? err.message : "İşlem başarısız");
      }
    });
  };

  const remove = () => {
    if (!confirm("Bu faturayı silmek istediğinize emin misiniz?")) return;
    start(async () => {
      try {
        await deleteInvoice(invoiceId);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Silme başarısız");
      }
    });
  };

  return (
    <div className="flex gap-2">
      {status === "DRAFT" && (
        <button
          type="button"
          onClick={() => changeStatus("SENT")}
          disabled={pending}
          className="btn btn-primary"
        >
          <Send size={14} /> Gönderildi İşaretle
        </button>
      )}
      {(status === "SENT" || status === "OVERDUE") && (
        <button
          type="button"
          onClick={() => changeStatus("PAID")}
          disabled={pending}
          className="btn btn-accent"
        >
          <CheckCircle2 size={14} /> Ödendi
        </button>
      )}
      {status !== "PAID" && status !== "CANCELLED" && (
        <button
          type="button"
          onClick={() => changeStatus("CANCELLED")}
          disabled={pending}
          className="btn btn-ghost"
        >
          <XCircle size={14} /> İptal
        </button>
      )}
      {status !== "PAID" && (
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="btn btn-ghost text-juris-red hover:bg-juris-red/5"
          aria-label="Sil"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
