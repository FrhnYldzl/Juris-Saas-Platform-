import type { IntegrationService } from "../types";

/**
 * Lexpera Mevzuat & İçtihat entegrasyonu (stub).
 *
 * Lexpera'nın resmi API'si kurumsal paket ile gelir.
 * Canlı: LEXPERA_API_KEY ile aktifleşir.
 */
export const lexperaService: IntegrationService = {
  provider: "lexpera",
  async ping() {
    if (!process.env.LEXPERA_API_KEY) {
      return { ok: false, message: "LEXPERA_API_KEY ayarlanmamış." };
    }
    return { ok: true, message: "Lexpera anahtar mevcut (gerçek istek henüz test edilmedi)." };
  },
};

export async function lexperaSearch(_query: string): Promise<{ results: unknown[]; note?: string }> {
  if (!process.env.LEXPERA_API_KEY) {
    return { results: [], note: "API anahtarı yok — örnek veri dönüyor." };
  }
  return { results: [], note: "Lexpera gerçek entegrasyonu v0.2'de." };
}
