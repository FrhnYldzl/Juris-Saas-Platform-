import type { IntegrationService } from "../types";
import { logger } from "@/lib/logger";

/**
 * GİB e-Fatura entegrasyonu (stub).
 *
 * Production seçenekleri:
 *  - Doğrudan GİB portal (özel entegratör gerektirmez, SOAP)
 *  - Özel entegratör: Foriba, Logo, Uyumsoft, İdeasoft
 *
 * Test modu: GIB_TEST_MODE=true ise sahte UUID döner.
 */
export const gibService: IntegrationService = {
  provider: "gib_efatura",
  async ping(config) {
    const testMode = process.env.GIB_TEST_MODE === "true";
    if (testMode) {
      logger.info({ config }, "GİB ping (test mode)");
      return { ok: true, message: "Test modu aktif." };
    }
    return { ok: false, message: "Canlı GİB entegrasyonu henüz yapılandırılmamış." };
  },
};

/** Sahte/gerçek: e-fatura UUID üretir */
export async function gibIssueInvoice(_firmId: string, _invoiceData: unknown) {
  const testMode = process.env.GIB_TEST_MODE !== "false";
  if (testMode) {
    return {
      ok: true,
      uuid: crypto.randomUUID(),
      mode: "test" as const,
    };
  }
  throw new Error("GİB canlı entegrasyonu henüz kurulmadı.");
}
