import type { IntegrationService } from "../types";
import { logger } from "@/lib/logger";

/**
 * UYAP Avukat Portalı entegrasyonu (stub).
 *
 * Production: e-imzalı avukat kartı + UYAP resmi portal API çağrısı gerektirir.
 * Şu anki durumda: stub — gerçek entegrasyon 3. faz (production sonrası).
 *
 * Referans: https://www.uyap.gov.tr/
 */
export const uyapService: IntegrationService = {
  provider: "uyap",
  async ping() {
    logger.info("UYAP ping (stub)");
    return {
      ok: false,
      message:
        "UYAP entegrasyonu için e-imzalı avukat kartı gerekir. Bu özellik prod sonrası aktif edilecek.",
    };
  },
  async sync() {
    return { ok: false, message: "UYAP senkronu henüz stub aşamasında." };
  },
};
