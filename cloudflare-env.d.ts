// Cloudflare Pages Function bindings
interface CloudflareEnv {
  DB: D1Database;
  ASSETS: Fetcher;
}

// Extend ProcessEnv with Cloudflare bindings
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DB?: D1Database;
      ASSETS?: Fetcher;
    }
  }
}