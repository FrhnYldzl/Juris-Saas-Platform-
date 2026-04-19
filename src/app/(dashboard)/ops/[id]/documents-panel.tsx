"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Upload, FileText, Trash2, File as FileIcon, FileSpreadsheet, Image as ImageIcon, FileType } from "lucide-react";
import { FormError } from "@/components/ui/form";
import {
  uploadDocument, deleteDocument, type DocUploadState,
} from "./document-actions";
import { formatDateTimeTR } from "@/lib/utils";

interface DocumentLite {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  category: string | null;
  uploaderName: string | null;
  createdAt: Date;
}

function iconFor(category: string | null) {
  if (category === "pdf") return FileType;
  if (category === "word") return FileText;
  if (category === "spreadsheet") return FileSpreadsheet;
  if (category === "image") return ImageIcon;
  return FileIcon;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentsPanel({
  matterId, documents, canUpload, canDelete,
}: {
  matterId: string;
  documents: DocumentLite[];
  canUpload: boolean;
  canDelete: boolean;
}) {
  const [state, formAction, pending] = useActionState<DocUploadState, FormData>(
    uploadDocument,
    { ok: false },
  );
  const [deleting, startDelete] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFileChosen = () => {
    if (inputRef.current?.files?.length) {
      formRef.current?.requestSubmit();
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (!canUpload) return;
    const file = e.dataTransfer.files[0];
    if (file && inputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      inputRef.current.files = dt.files;
      formRef.current?.requestSubmit();
    }
  };

  const onDelete = (id: string) => {
    if (!confirm("Belgeyi silmek istediğinize emin misiniz?")) return;
    startDelete(async () => {
      try { await deleteDocument(id, matterId); }
      catch (e) { alert(e instanceof Error ? e.message : "Silme başarısız"); }
    });
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="display text-lg text-juris-navy">Belgeler</h3>
          <div className="text-xs text-juris-ink-3 mt-0.5">
            {documents.length} belge
          </div>
        </div>
      </div>

      {canUpload && (
        <form ref={formRef} action={formAction} className="mb-4">
          <input type="hidden" name="matterId" value={matterId} />
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-md p-5 text-center cursor-pointer transition-all
              ${dragOver
                ? "border-juris-red bg-juris-red/5"
                : "border-juris-line hover:border-juris-navy-200 bg-juris-paper-2"}
              ${pending ? "opacity-60 pointer-events-none" : ""}
            `}
          >
            <Upload size={22} className="text-juris-ink-3 mx-auto mb-2" />
            <div className="text-sm font-medium text-juris-navy">
              {pending ? "Yükleniyor…" : "Dosya seç veya buraya sürükle"}
            </div>
            <div className="text-[11px] text-juris-ink-3 mt-1">
              PDF, Word, Excel, PowerPoint, resim · en fazla 25 MB
            </div>
            <input
              ref={inputRef}
              type="file"
              name="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.txt"
              onChange={onFileChosen}
            />
          </div>
          {state.error && <FormError>{state.error}</FormError>}
        </form>
      )}

      {documents.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-center">
          <FileIcon size={22} className="text-juris-ink-4 mb-2" />
          <div className="text-sm text-juris-ink-3">Henüz belge yok.</div>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-juris-line-2">
          {documents.map((d) => {
            const Icon = iconFor(d.category);
            return (
              <li key={d.id} className="py-3 flex items-center gap-3">
                <Icon size={18} className="text-juris-ink-3 flex-shrink-0" />
                <a
                  href={`/api/documents/${d.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 min-w-0 group"
                >
                  <div className="text-sm font-medium text-juris-navy truncate group-hover:text-juris-red">
                    {d.name}
                  </div>
                  <div className="text-[11px] text-juris-ink-4 mt-0.5">
                    {formatSize(d.size)}
                    {d.uploaderName && ` · ${d.uploaderName}`}
                    {" · "}
                    {formatDateTimeTR(d.createdAt)}
                  </div>
                </a>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(d.id)}
                    disabled={deleting}
                    className="text-juris-ink-4 hover:text-juris-red p-1"
                    aria-label="Belgeyi sil"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
