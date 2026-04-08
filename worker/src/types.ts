export interface TranslateRequestBody {
  text: string;
  source_lang: string; // 'auto' or lang code
  target_lang: string;
  domain: 'general' | 'legal' | 'medical' | 'tech';
  terms: { source: string; target: string }[];
}

export interface Env {
  CLAUDE_API_KEY: string;
  ENVIRONMENT: string;
  RATE_LIMIT: KVNamespace;
}

export type AppVariables = {
  deviceId: string;
};

export type AppEnv = {
  Bindings: Env;
  Variables: AppVariables;
};
