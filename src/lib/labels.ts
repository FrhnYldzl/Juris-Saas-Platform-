import type {
  MatterType, MatterStatus, LeadStage, InvoiceStatus, TaskStatus, TaskPriority, EventType, UserRole,
} from "@prisma/client";

export function matterTypeLabel(t: MatterType): string {
  const map: Record<MatterType, string> = {
    LITIGATION: "Dava",
    CONSULTING: "Danışmanlık",
    CONTRACT: "Sözleşme",
    COMPLIANCE: "Uyum",
    IP: "Fikri Mülkiyet",
    CORPORATE: "Şirketler",
    FAMILY: "Aile",
    CRIMINAL: "Ceza",
    LABOR: "İş Hukuku",
    ADMINISTRATIVE: "İdare",
    OTHER: "Diğer",
  };
  return map[t];
}

export function matterStatusChip(s: MatterStatus): { label: string; tone: "green" | "amber" | "red" | "blue" | "" } {
  const map: Record<MatterStatus, { label: string; tone: "green" | "amber" | "red" | "blue" | "" }> = {
    ACTIVE: { label: "Aktif", tone: "green" },
    ON_HOLD: { label: "Beklemede", tone: "amber" },
    CLOSED_WON: { label: "Kazanıldı", tone: "blue" },
    CLOSED_LOST: { label: "Kaybedildi", tone: "red" },
    ARCHIVED: { label: "Arşiv", tone: "" },
  };
  return map[s];
}

export function leadStageLabel(s: LeadStage): string {
  const map: Record<LeadStage, string> = {
    NEW: "Lead",
    QUALIFIED: "İlk Görüşme",
    MEETING: "Scope",
    PROPOSAL: "Teklif",
    NEGOTIATION: "Müzakere",
    CONTRACT: "Sözleşme",
    SIGNING: "İmza",
    WON: "Kazanıldı",
    LOST: "Kaybedildi",
  };
  return map[s];
}

export function invoiceStatusChip(s: InvoiceStatus): { label: string; tone: "green" | "amber" | "red" | "blue" | "" } {
  const map: Record<InvoiceStatus, { label: string; tone: "green" | "amber" | "red" | "blue" | "" }> = {
    DRAFT: { label: "Taslak", tone: "" },
    SENT: { label: "Gönderildi", tone: "blue" },
    PAID: { label: "Ödendi", tone: "green" },
    OVERDUE: { label: "Gecikti", tone: "red" },
    CANCELLED: { label: "İptal", tone: "" },
  };
  return map[s];
}

export function taskStatusLabel(s: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    TODO: "Yapılacak",
    IN_PROGRESS: "Devam Ediyor",
    DONE: "Tamamlandı",
    CANCELLED: "İptal",
  };
  return map[s];
}

export function taskPriorityLabel(p: TaskPriority): string {
  const map: Record<TaskPriority, string> = {
    LOW: "Düşük", NORMAL: "Normal", HIGH: "Yüksek", URGENT: "Acil",
  };
  return map[p];
}

export function eventTypeLabel(e: EventType): string {
  const map: Record<EventType, string> = {
    HEARING: "Duruşma", MEETING: "Toplantı", DEADLINE: "Süre Sonu",
    REMINDER: "Hatırlatma", OTHER: "Diğer",
  };
  return map[e];
}

export function roleLabelTR(r: UserRole): string {
  const map: Record<UserRole, string> = {
    OWNER: "Kurucu Ortak",
    PARTNER: "Yönetici Ortak",
    ASSOCIATE: "Avukat",
    PARALEGAL: "Paralegal",
    ADMIN_STAFF: "İdari Personel",
    CLIENT: "Müvekkil",
  };
  return map[r];
}
