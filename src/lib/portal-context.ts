import { cache } from "react";
import { prisma } from "./prisma";

/**
 * Loads all user-scoped data the Müvekkil Portal needs:
 *  - the Contact record for the logged-in client
 *  - the primary responsible advisor (lead assignee of most recent active matter)
 *  - the managing partner (OWNER/PARTNER — fallback contact)
 *  - unread message count (for topbar / right panel badge)
 *
 * Wrapped in React.cache so repeated calls inside a single request
 * (layout + page + child components) hit the DB only once.
 */
export const loadPortalContext = cache(async (firmId: string, email: string) => {
  if (!email) return null;

  const contact = await prisma.contact.findFirst({
    where: {
      firmId,
      email: { equals: email, mode: "insensitive" },
      isClient: true,
    },
    include: {
      matters: {
        where: { status: { in: ["ACTIVE", "ON_HOLD"] } },
        orderBy: { updatedAt: "desc" },
        include: {
          assignees: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  title: true,
                  role: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!contact) return null;

  // Primary advisor = "lead" assignee of most-recent matter; else first assignee.
  let advisor: {
    id: string;
    name: string;
    title: string | null;
    role: string;
    email: string;
    phone: string | null;
  } | null = null;

  for (const m of contact.matters) {
    const lead = m.assignees.find((a) => a.role === "lead")?.user;
    if (lead) { advisor = lead; break; }
    const first = m.assignees[0]?.user;
    if (first && !advisor) advisor = first;
  }

  // Managing Partner = oldest OWNER/PARTNER in the firm
  const managingPartner = await prisma.user.findFirst({
    where: {
      firmId,
      role: { in: ["OWNER", "PARTNER"] },
      active: true,
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, title: true, role: true, email: true, phone: true },
  });

  // Unread messages for this client's matters
  const matterIds = contact.matters.map((m) => m.id);
  const unreadMessages = matterIds.length > 0
    ? await prisma.matterMessage.count({
        where: {
          firmId,
          matterId: { in: matterIds },
          readAt: null,
          // Messages from staff to client (not sent by client themselves)
          sender: { role: { not: "CLIENT" } },
        },
      })
    : 0;

  return {
    contact,
    advisor,
    managingPartner,
    unreadMessages,
  };
});

export function initialsOf(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  // skip common titles
  const withoutTitle = parts.filter((p) => !/^(Av\.?|Stj\.?|Dr\.?|Prof\.?|Mrs?\.?)$/i.test(p));
  const useParts = withoutTitle.length > 0 ? withoutTitle : parts;
  if (useParts.length === 1) return useParts[0].slice(0, 2).toUpperCase();
  return (useParts[0][0] + useParts[useParts.length - 1][0]).toUpperCase();
}

export function firstNameOf(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const withoutTitle = parts.filter((p) => !/^(Av\.?|Stj\.?|Dr\.?|Prof\.?|Mrs?\.?)$/i.test(p));
  return (withoutTitle[0] ?? parts[0] ?? "").trim();
}
