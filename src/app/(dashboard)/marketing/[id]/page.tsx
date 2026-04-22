import { notFound } from "next/navigation";
import Link from "next/link";
import { Trash2, FileText, Calendar as CalendarIcon, Hash } from "lucide-react";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { formatDateTR } from "@/lib/utils";
import { WorkflowStepper, type StageKey } from "./workflow-stepper";
import { StagePlan } from "./stage-plan";
import { StageUret } from "./stage-uret";
import { StageBicim } from "./stage-bicim";
import { StageOnay } from "./stage-onay";
import { StageYayim } from "./stage-yayim";
import { StageOlc } from "./stage-olc";

export const metadata = { title: "İçerik Akışı · Pazarlama" };

export default async function ContentWorkflowPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ stage?: StageKey }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { firmId, role } = await requireTenant();

  const item = await prisma.contentItem.findFirst({ where: { id, firmId } });
  if (!item) notFound();

  // Auto-pick sensible default stage based on current status
  const activeStage: StageKey = sp.stage ?? pickDefaultStage(item.status);

  // Look up the managing partner (for the Onay stage reviewer card)
  const managingPartner = await prisma.user.findFirst({
    where: { firmId, role: { in: ["OWNER", "PARTNER"] }, active: true },
    orderBy: { createdAt: "asc" },
    select: { name: true },
  });

  return (
    <div className="px-6 py-8 max-w-[1400px] mx-auto">
      <div className="mb-4">
        <Breadcrumb
          crumbs={[
            { label: "Pazarlama", href: "/marketing" },
            { label: "İçerik Stüdyosu", href: "/marketing?tab=icerik" },
            { label: item.title.length > 50 ? `${item.title.slice(0, 50)}…` : item.title },
          ]}
        />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <StatusBadge status={item.status} />
            {item.contentType && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold"
                style={{ background: "#F1F4F8", color: "#5A6B82" }}
              >
                {item.contentType}
              </span>
            )}
            {item.channel && <ChannelBadge channel={item.channel} />}
            {item.draftVersion && (
              <span className="text-[10.5px] mono text-juris-ink-4">v{item.draftVersion}</span>
            )}
          </div>
          <h1
            className="leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, color: "#0A2240" }}
          >
            {item.title}
          </h1>
          {item.summary && (
            <p className="text-[13px] text-juris-ink-3 mt-1.5 max-w-[720px] leading-relaxed">
              {item.summary}
            </p>
          )}
          <div className="mt-3 flex items-center gap-4 text-[11px] text-juris-ink-3 flex-wrap">
            {item.author && (
              <span className="inline-flex items-center gap-1.5">
                <FileText size={10} /> {item.author}
              </span>
            )}
            {item.publishAt && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon size={10} />
                Planlanan: <span className="font-semibold text-juris-navy">{formatDateTR(item.publishAt)}</span>
              </span>
            )}
            {item.keywords.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Hash size={10} />
                {item.keywords.slice(0, 3).join(", ")}
                {item.keywords.length > 3 && <span className="text-juris-ink-4">+{item.keywords.length - 3}</span>}
              </span>
            )}
          </div>
        </div>

        {/* Right-side actions */}
        <div className="flex gap-2 shrink-0">
          <Link
            href="/marketing?tab=icerik"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[11.5px] font-semibold text-juris-ink-2 hover:bg-juris-paper-2 transition-colors"
            style={{ border: "1px solid #E5E9F0" }}
          >
            İçerik Stüdyosu
          </Link>
          {(role === "OWNER" || role === "PARTNER") && (
            <Link
              href={`/marketing?tab=icerik&delete=${item.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[11.5px] font-semibold text-juris-red hover:bg-juris-paper-2 transition-colors"
              style={{ border: "1px solid #E5E9F0" }}
            >
              <Trash2 size={11} /> Sil
            </Link>
          )}
        </div>
      </div>

      {/* Stepper */}
      <WorkflowStepper contentId={item.id} status={item.status} activeStage={activeStage} />

      {/* Stage body */}
      {activeStage === "plan" && (
        <StagePlan
          item={{
            id: item.id,
            title: item.title,
            summary: item.summary,
            channel: item.channel,
            contentType: item.contentType,
            keywords: item.keywords,
            metaTitle: item.metaTitle,
            metaDescription: item.metaDescription,
            readMinutes: item.readMinutes,
            publishAt: item.publishAt,
            author: item.author,
            tags: item.tags,
            status: item.status,
          }}
        />
      )}
      {activeStage === "uret" && (
        <StageUret
          item={{
            id: item.id,
            title: item.title,
            summary: item.summary,
            body: item.body,
            keywords: item.keywords,
            aiAssisted: item.aiAssisted,
            draftVersion: item.draftVersion,
            readMinutes: item.readMinutes,
            status: item.status,
          }}
        />
      )}
      {activeStage === "bicim" && (
        <StageBicim
          item={{
            id: item.id,
            title: item.title,
            summary: item.summary,
            body: item.body,
            channel: item.channel,
            metaTitle: item.metaTitle,
            metaDescription: item.metaDescription,
            keywords: item.keywords,
            author: item.author,
            readMinutes: item.readMinutes,
          }}
        />
      )}
      {activeStage === "onay" && (
        <StageOnay
          item={{
            id: item.id,
            title: item.title,
            status: item.status,
            body: item.body,
            author: item.author,
            updatedAt: item.updatedAt,
          }}
          realRole={role}
          managingPartnerName={managingPartner?.name ?? null}
        />
      )}
      {activeStage === "yayim" && (
        <StageYayim
          item={{
            id: item.id,
            title: item.title,
            status: item.status,
            channel: item.channel,
            publishAt: item.publishAt,
            publishedAt: item.publishedAt,
            url: item.url,
          }}
          realRole={role}
        />
      )}
      {activeStage === "olc" && (
        <StageOlc
          item={{
            id: item.id,
            title: item.title,
            status: item.status,
            publishedAt: item.publishedAt,
            url: item.url,
            viewCount: item.viewCount,
            leadCount: item.leadCount,
            engagementPct: item.engagementPct,
            seoRank: item.seoRank,
            backlinks: item.backlinks,
            keywords: item.keywords,
          }}
        />
      )}
    </div>
  );
}

function pickDefaultStage(status: string): StageKey {
  switch (status) {
    case "IDEA":      return "plan";
    case "DRAFT":     return "uret";
    case "REVIEW":    return "onay";
    case "SCHEDULED": return "yayim";
    case "PUBLISHED": return "olc";
    case "ARCHIVED":  return "olc";
    default:          return "plan";
  }
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    IDEA:      { bg: "#F1F4F8", color: "#5A6B82", label: "Fikir" },
    DRAFT:     { bg: "rgba(180,112,28,0.1)", color: "#B4701C", label: "Taslak" },
    REVIEW:    { bg: "rgba(31,90,168,0.1)",  color: "#1F5AA8", label: "İncelemede" },
    SCHEDULED: { bg: "rgba(10,34,64,0.08)",  color: "#0A2240", label: "Planlandı" },
    PUBLISHED: { bg: "rgba(31,122,78,0.1)",  color: "#1F7A4E", label: "Yayında" },
    ARCHIVED:  { bg: "#F1F4F8", color: "#8895AB", label: "Arşiv" },
  };
  const c = config[status] ?? config.IDEA;
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold"
      style={{ background: c.bg, color: c.color, letterSpacing: "0.02em" }}
    >
      {c.label}
    </span>
  );
}

function ChannelBadge({ channel }: { channel: string }) {
  const m: Record<string, string> = {
    BLOG: "Blog", LINKEDIN: "LinkedIn", INSTAGRAM: "Instagram",
    X: "X", NEWSLETTER: "Newsletter", PODCAST: "Podcast",
    VIDEO: "Video", OTHER: "Diğer",
  };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold"
      style={{ background: "rgba(10,34,64,0.06)", color: "#0A2240" }}
    >
      {m[channel] ?? channel}
    </span>
  );
}
