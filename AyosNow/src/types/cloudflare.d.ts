/// <reference types="@cloudflare/workers-types" />

declare global {
  interface CloudflareEnv {
    PUNTAGO_DB?: D1Database;
    PUNTAGO_UPLOADS_R2_BUCKET?: R2Bucket;
  }
}

export {};
