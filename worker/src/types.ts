export interface TranslateRequestBody {
  text: string;
  source_lang: string; // 'auto' or lang code
  target_lang: string;
  domain: 'general' | 'legal' | 'medical' | 'tech';
  terms: { source: string; target: string }[];
}

export interface Env {
  GEMINI_API_KEY: string;
  CLAUDE_API_KEY?: string; // optional, kept for future use
  ENVIRONMENT: string;
  RATE_LIMIT: KVNamespace;
  AI: Ai; // Cloudflare Workers AI binding
}

export type AppVariables = {
  deviceId: string;
};

export type AppEnv = {
  Bindings: Env;
  Variables: AppVariables;
};
