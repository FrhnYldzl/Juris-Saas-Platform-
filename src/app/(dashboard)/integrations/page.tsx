import { SectionHead } from "@/components/ui/section-head";
import { requireTenant } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { INTEGRATION_CATALOG } from "@/lib/integrations/catalog";
import { Check, Plug } from "lucide-react";

export const metadata = { title: "Entegrasyonlar" };

export default async function IntegrationsPage() {
  const { firmId } = await requireTenant();
  const connected = await prisma.integration.findMany({ where: { firmId } });
  const connectedMap = new Map(connected.map((i) => [i.provider, i]));

  const groups = ["legal", "finance", "marketing", "productivity", "crm"] as const;
  const byGroup = Object.fromEntries(
    groups.map((g) => [g, INTEGRATION_CATALOG.filter((it) => it.group === g)]),
  );

  const groupLabels: Record<string, string> = {
    legal: "Hukuk",
    finance: "Finans & Bankacılık",
    marketing: "Pazarlama & Analitik",
    productivity: "Verimlilik",
    crm: "Satış & CRM",
  };

  return (
    <div className="px-6 py-8 max-w-[1400px] mx-auto">
      <SectionHead
        title="Entegrasyonlar"
        subtitle="Firmanıza veri akışı — resmi sistemler, bulut araçlar ve bankalar"
      />

      {groups.map((g) => (
        <section key={g} className="mb-9">
          <h4 className="label mb-3">{groupLabels[g]}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {byGroup[g].map((it) => {
              const state = connectedMap.get(it.provider);
              const isConnected = state?.status === "CONNECTED";
              return (
                <div
                  key={it.provider}
                  className="card p-4 flex items-start gap-3 hover:shadow-juris-md transition-shadow"
                >
                  <div className="w-10 h-10 rounded-md bg-juris-navy-100 flex items-center justify-center text-juris-navy text-lg flex-shrink-0">
                    {it.emoji ?? <Plug size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-juris-navy text-sm">{it.name}</div>
                      {isConnected && (
                        <span className="chip chip-green">
                          <Check size={10} /> Bağlı
                        </span>
                      )}
                      {state?.status === "PENDING" && <span className="chip chip-amber">Bekliyor</span>}
                      {state?.status === "ERROR" && <span className="chip chip-red">Hata</span>}
                      {!state && <span className="chip">Bağlanmadı</span>}
                    </div>
                    <div className="text-xs text-juris-ink-3 mt-1 leading-relaxed">
                      {it.description}
                    </div>
                    <button className="btn btn-sm btn-ghost mt-3">
                      {isConnected ? "Yönet" : "Bağla"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
