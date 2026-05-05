import type { ContentChannel, ContentStatus } from "@prisma/client";

// Shared serializer for ContentItem in the Paperclip API surface.
// Lives outside route.ts so Next.js 15 doesn't reject the export.

export function serializePost(p: {
  id: string; title: string; summary: string | null; channel: ContentChannel;
  status: ContentStatus; author: string | null; contentType: string | null;
  publishAt: Date | null; publishedAt: Date | null; url: string | null;
  tags: string[]; keywords: string[]; metaTitle: string | null;
  metaDescription: string | null; readMinutes: number | null;
  viewCount: number; leadCount: number; engagementPct: number | null;
  seoRank: number | null; backlinks: number; aiAssisted: boolean;
  draftVersion: number | null; createdAt: Date; updatedAt: Date;
}) {
  return {
    id:              p.id,
    title:           p.title,
    summary:         p.summary,
    channel:         p.channel,
    status:          p.status,
    author:          p.author,
    contentType:     p.contentType,
    publishAt:       p.publishAt?.toISOString() ?? null,
    publishedAt:     p.publishedAt?.toISOString() ?? null,
    url:             p.url,
    tags:            p.tags,
    keywords:        p.keywords,
    metaTitle:       p.metaTitle,
    metaDescription: p.metaDescription,
    readMinutes:     p.readMinutes,
    metrics:         {
      views:      p.viewCount,
      leads:      p.leadCount,
      engagement: p.engagementPct,
      seoRank:    p.seoRank,
      backlinks:  p.backlinks,
    },
    aiAssisted:      p.aiAssisted,
    draftVersion:    p.draftVersion,
    createdAt:       p.createdAt.toISOString(),
    updatedAt:       p.updatedAt.toISOString(),
  };
}
