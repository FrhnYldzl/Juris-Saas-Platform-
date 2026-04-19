import type { ModuleId } from "@/lib/rbac";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, TrendingUp, Megaphone, DollarSign,
  Wallet, Users, Settings, Plug, FolderKanban, Sparkles,
} from "lucide-react";

export interface NavItem {
  id: ModuleId;
  label: string;
  href: string;
  icon: LucideIcon;
  tag?: string;
}

export interface NavSection {
  group: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    group: "Günün",
    items: [
      { id: "command", label: "Komuta Merkezi", href: "/command", icon: LayoutDashboard },
    ],
  },
  {
    group: "Modüller",
    items: [
      { id: "bd", label: "İş Geliştirme", href: "/bd", icon: TrendingUp },
      { id: "ops", label: "Operasyonlar", href: "/ops", icon: FolderKanban },
      { id: "marketing", label: "Pazarlama", href: "/marketing", icon: Megaphone },
      { id: "sales", label: "Satış", href: "/sales", icon: DollarSign },
      { id: "finance", label: "Finans", href: "/finance", icon: Wallet },
    ],
  },
  {
    group: "Araçlar",
    items: [
      { id: "ai", label: "AI Araçları", href: "/ai/petition", icon: Sparkles },
    ],
  },
  {
    group: "Firma",
    items: [
      { id: "people", label: "Ekip", href: "/people", icon: Users },
      { id: "integrations", label: "Entegrasyonlar", href: "/integrations", icon: Plug },
      { id: "settings", label: "Ayarlar", href: "/settings", icon: Settings },
    ],
  },
];

export const PAGE_TITLES: Record<string, { title: string; breadcrumb?: string[] }> = {
  "/command": { title: "Komuta Merkezi", breadcrumb: ["Günün"] },
  "/bd": { title: "İş Geliştirme", breadcrumb: ["Modüller"] },
  "/ops": { title: "Operasyonlar", breadcrumb: ["Modüller"] },
  "/marketing": { title: "Pazarlama", breadcrumb: ["Modüller"] },
  "/sales": { title: "Satış", breadcrumb: ["Modüller"] },
  "/finance": { title: "Finans", breadcrumb: ["Modüller"] },
  "/ai/petition": { title: "Dilekçe Taslağı", breadcrumb: ["Araçlar", "AI"] },
  "/people": { title: "Ekip", breadcrumb: ["Firma"] },
  "/integrations": { title: "Entegrasyonlar", breadcrumb: ["Firma"] },
  "/settings": { title: "Ayarlar", breadcrumb: ["Firma"] },
  "/settings/audit": { title: "Audit Log", breadcrumb: ["Ayarlar"] },
  "/portal": { title: "Müvekkil Portalı" },
};
