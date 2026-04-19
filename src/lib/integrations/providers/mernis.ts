import type { IntegrationService } from "../types";

/**
 * MERNİS TC Kimlik Doğrulama (stub).
 *
 * NVİ KPS (Kimlik Paylaşım Sistemi) SOAP servisine bağlanır.
 * Production için NVİ ile protokol gerektirir.
 */
export const mernisService: IntegrationService = {
  provider: "mernis",
  async ping() {
    return { ok: false, message: "MERNİS bağlantısı NVİ protokolü gerektirir." };
  },
};

/** TC kimlik formatı kontrolü (algoritmik) — servise gitmeden doğrulanabilir */
export function validateTCKNFormat(tckn: string): boolean {
  if (!/^\d{11}$/.test(tckn)) return false;
  const digits = tckn.split("").map(Number);
  if (digits[0] === 0) return false;
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const tenth = (oddSum * 7 - evenSum) % 10;
  if (tenth !== digits[9]) return false;
  const sumAll = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  return sumAll % 10 === digits[10];
}
