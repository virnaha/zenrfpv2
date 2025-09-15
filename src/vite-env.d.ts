/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_OPENAI_ORGANIZATION?: string
  readonly VITE_OPENAI_MODEL: string
  readonly VITE_OPENAI_MAX_TOKENS: string
  readonly VITE_OPENAI_TEMPERATURE: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_API_RATE_LIMIT_REQUESTS: string
  readonly VITE_API_RATE_LIMIT_WINDOW: string
  readonly VITE_ENABLE_AI_GENERATION: string
  readonly VITE_ENABLE_REAL_TIME_COLLABORATION: string
  readonly VITE_ENABLE_ANALYTICS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
