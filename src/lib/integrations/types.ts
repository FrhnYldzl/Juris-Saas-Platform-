export interface IntegrationService {
  provider: string;
  /** Test credentials / basic reachability */
  ping(config: Record<string, unknown>): Promise<{ ok: boolean; message?: string }>;
  /** Pull latest data for this firm (idempotent) */
  sync?(firmId: string): Promise<{ ok: boolean; imported?: number; message?: string }>;
}

/** Runs after a credentials upsert to verify & store lastSyncAt */
export interface IntegrationResult {
  ok: boolean;
  message?: string;
  meta?: Record<string, unknown>;
}
