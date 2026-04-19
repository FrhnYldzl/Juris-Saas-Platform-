import Link from "next/link";
import { Plus, Calendar, ExternalLink, FileEdit } from "lucide-react";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { SectionHead } from "@/components/ui/section-head";
import { Kpi } from "@/components/ui/kpi";
import { formatDateTR } from "@/lib/utils";
import type { ContentStatus, ContentChannel } from "@prisma/client";

export const metadata = { title: "Pazarlama" };

const CHANNEL_LABEL: Record<ContentChannel, string> = {
  BLOG: "Blog",
  LINKEDIN: "LinkedIn",
  INSTAGRAM: "Instagram",
  X: "X (Twitter)",
  NEWSLETTER: "Bülten",
  PODCAST: "Podcast",
  VIDEO: "Video",
  OTHER: "Diğer",
};

const STATUS_TONE: Record<ContentStatus, "green" | "blue" | "amber" | "red" | ""> = {
  IDEA: "",
  DRAFT: "",
  REVIEW: "amber",
  SCHEDULED: "blue",
  PUBLISHED: "green",
  ARCHIVED: "",
};

const STATUS_LABEL: Record<ContentStatus, string> = {
  IDEA: "Fikir",
  DRAFT: "Taslak",
  REVIEW: "Onay Bekliyor",
  SCHEDULED: "Zamanlandı",
  PUBLISHED: "Yayında",
  ARCHIVED: "Arşiv",
};

export default async function MarketingPage() {
  const { firmId } = await requireTenant();

  const [items, publishedCount, scheduledCount, draftCount] = await Promise.all([
    prisma.contentItem.findMany({
      where: { firmId },
      orderBy: [{ publishAt: "desc" }, { createdAt: "desc" }],
      take: 80,
    }),
    prisma.contentItem.count({ where: { firmId, status: "PUBLISHED" } }),
    prisma.contentItem.count({ where: { firmId, status: "SCHEDULED" } }),
    prisma.contentItem.count({ where: { firmId, status: { in: ["IDEA", "DRAFT", "REVIEW"] } } }),
  ]);

  return (
    <div className="px-6 py-8 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Kpi label="Yayında" value={publishedCount} emphasized />
        <Kpi label="Zamanlandı" value={scheduledCount} sub="yaklaşan" />
        <Kpi label="Hazırlanıyor" value={draftCount} sub="fikir + taslak + onay" />
        <Kpi label="Trafik (30g)" value="—" sub="GA4 bağlanınca" />
      </div>

      <SectionHead
        title="İçerik Takvimi"
        subtitle="Blog, LinkedIn, bülten, podcast — içerik fikirlerinden yayına"
        actions={
          <Link href="/marketing/new" className="btn btn-primary">
            <Plus size={14} /> Yeni İçerik
          </Link>
        }
      />

      {items.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <Calendar size={28} className="text-juris-ink-3 mb-3" />
          <h3 className="display text-xl text-juris-navy mb-1.5">İçerik takvimi boş</h3>
          <p className="text-sm text-juris-ink-3 max-w-md mb-5">
            Blog yazısı, LinkedIn gönderisi, bülten — ilk fikrini ekleyerek başla.
            Fikirden yayına tüm aşamaları tek yerden yönet.
          </p>
          <Link href="/marketing/new" className="btn btn-primary">
            <Plus size={14} /> İlk İçeriği Ekle
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-juris-paper-2 text-juris-ink-3 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Başlık</th>
                <th className="text-left px-4 py-3 font-semibold w-[130px]">Kanal</th>
                <th className="text-left px-4 py-3 font-semibold w-[130px]">Durum</th>
                <th className="text-left px-4 py-3 font-semibold w-[130px]">Yayın</th>
                <th className="text-left px-4 py-3 font-semibold w-[130px]">Yazar</th>
                <th className="w-[60px]" />
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t border-juris-line-2 hover:bg-juris-paper-2">
                  <td className="px-4 py-3">
                    <div className="font-medium text-juris-navy">{c.title}</div>
                    {c.summary && (
                      <div className="text-[11px] text-juris-ink-3 mt-0.5 line-clamp-1">
                        {c.summary}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-juris-ink-2">
                    {CHANNEL_LABEL[c.channel]}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`chip chip-${STATUS_TONE[c.status]}`}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-juris-ink-3">
                    {c.publishedAt
                      ? formatDateTR(c.publishedAt)
                      : c.publishAt
                        ? formatDateTR(c.publishAt)
                        : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-juris-ink-2">{c.author ?? "—"}</td>
                  <td className="px-4 py-3">
                    {c.url ? (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-juris-ink-3 hover:text-juris-red"
                        aria-label="Yayını aç"
                      >
                        <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className="text-juris-ink-4">
                        <FileEdit size={14} />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
