import { z } from 'zod';

// Environment variable validation schemas
const OpenAIConfigSchema = z.object({
  apiKey: z.string().min(1, 'OpenAI API key is required'),
  organization: z.string().optional(),
  model: z.enum(['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo']).default('gpt-4-turbo-preview'),
  maxTokens: z.number().min(1).max(8000).default(4000),
  temperature: z.number().min(0).max(2).default(0.7),
});

const SupabaseConfigSchema = z.object({
  url: z.string().min(1, 'Supabase URL is required'),
  anonKey: z.string().min(1, 'Supabase anon key is required'),
  serviceRoleKey: z.string().min(1, 'Supabase service role key is required'),
});

const APIConfigSchema = z.object({
  baseUrl: z.string().min(1, 'API base URL is required'),
  timeout: z.number().min(1000).max(120000).default(30000),
  rateLimit: z.object({
    requests: z.number().min(1).default(100),
    windowMs: z.number().min(1000).default(60000),
  }),
});

const FeatureFlagsSchema = z.object({
  enableAIGeneration: z.boolean().default(true),
  enableRealTimeCollaboration: z.boolean().default(false),
  enableAnalytics: z.boolean().default(true),
});

// Configuration types
export type OpenAIConfig = z.infer<typeof OpenAIConfigSchema>;
export type SupabaseConfig = z.infer<typeof SupabaseConfigSchema>;
export type APIConfig = z.infer<typeof APIConfigSchema>;
export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;

export interface APIConfiguration {
  openai: OpenAIConfig;
  supabase: SupabaseConfig;
  api: APIConfig;
  features: FeatureFlags;
}

// Environment variable getters with validation
const getEnvVar = (key: string, required = true): string => {
  const value = import.meta.env[key];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || '';
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = import.meta.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    console.warn(`Invalid number for ${key}, using default: ${defaultValue}`);
    return defaultValue;
  }
  return parsed;
};

const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = import.meta.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

// Configuration validation and creation
export const createAPIConfig = (): APIConfiguration => {
  // Check which services have real environment variables
  const hasRealOpenAI = import.meta.env.VITE_OPENAI_API_KEY && 
                        import.meta.env.VITE_OPENAI_API_KEY !== 'demo-api-key';
  const hasRealSupabase = import.meta.env.VITE_SUPABASE_URL && 
                          import.meta.env.VITE_SUPABASE_ANON_KEY && 
                          import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  try {
    // Configure OpenAI (real or demo)
    const openaiConfig = hasRealOpenAI ? {
      apiKey: getEnvVar('VITE_OPENAI_API_KEY'),
      organization: getEnvVar('VITE_OPENAI_ORGANIZATION', false),
      model: (getEnvVar('VITE_OPENAI_MODEL', false) || 'gpt-4-turbo-preview') as 'gpt-4-turbo-preview' | 'gpt-4' | 'gpt-3.5-turbo',
      maxTokens: getEnvNumber('VITE_OPENAI_MAX_TOKENS', 4000),
      temperature: getEnvNumber('VITE_OPENAI_TEMPERATURE', 0.7) / 10,
    } : {
      apiKey: 'demo-key',
      organization: undefined,
      model: 'gpt-4-turbo-preview' as const,
      maxTokens: 4000,
      temperature: 0.7,
    };

    // Configure Supabase (real or demo)
    const supabaseConfig = hasRealSupabase ? {
      url: getEnvVar('VITE_SUPABASE_URL'),
      anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
      serviceRoleKey: getEnvVar('VITE_SUPABASE_SERVICE_ROLE_KEY'),
    } : {
      url: 'https://demo.supabase.co',
      anonKey: 'demo-anon-key',
      serviceRoleKey: 'demo-service-key',
    };

    const apiConfig = {
      baseUrl: getEnvVar('VITE_API_BASE_URL', false) || 'http://localhost:3000/api',
      timeout: getEnvNumber('VITE_API_TIMEOUT', 30000),
      rateLimit: {
        requests: getEnvNumber('VITE_API_RATE_LIMIT_REQUESTS', 100),
        windowMs: getEnvNumber('VITE_API_RATE_LIMIT_WINDOW', 60000),
      },
    };

    const featureFlags = {
      enableAIGeneration: hasRealOpenAI,
      enableRealTimeCollaboration: getEnvBoolean('VITE_ENABLE_REAL_TIME_COLLABORATION', false),
      enableAnalytics: getEnvBoolean('VITE_ENABLE_ANALYTICS', true),
    };

    // Log configuration status - Supabase not needed for local processing
    
    if (!hasRealOpenAI) {
      console.log('🎭 Using demo configuration for OpenAI - add VITE_OPENAI_API_KEY for full functionality');
    }

    return {
      openai: openaiConfig,
      supabase: supabaseConfig,
      api: apiConfig,
      features: featureFlags,
    };
  } catch (error) {
    console.warn('Configuration validation failed, using demo mode:', error);
  }

  // Return demo configuration
  console.log('🎭 Using demo configuration - add environment variables for full functionality');
  return {
    openai: {
      apiKey: 'demo-key',
      organization: undefined,
      model: 'gpt-4-turbo-preview',
      maxTokens: 4000,
      temperature: 0.7,
    },
    supabase: {
      url: 'https://demo.supabase.co',
      anonKey: 'demo-anon-key',
      serviceRoleKey: 'demo-service-key',
    },
    api: {
      baseUrl: 'http://localhost:3000/api',
      timeout: 30000,
      rateLimit: {
        requests: 100,
        windowMs: 60000,
      },
    },
    features: {
      enableAIGeneration: true,
      enableRealTimeCollaboration: false,
      enableAnalytics: true,
    },
  };
};

// Rate limiting utilities
export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  getTimeUntilReset(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.windowMs - (Date.now() - oldestRequest));
  }
}

// API client utilities
export const createAPIClient = (config: APIConfiguration) => {
  const rateLimiter = new RateLimiter(
    config.api.rateLimit.requests,
    config.api.rateLimit.windowMs
  );

  const makeRequest = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    if (!rateLimiter.canMakeRequest()) {
      const timeUntilReset = rateLimiter.getTimeUntilReset();
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(timeUntilReset / 1000)} seconds.`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.api.timeout);

    try {
      const response = await fetch(`${config.api.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      rateLimiter.recordRequest();

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown API error occurred');
    }
  };

  return {
    makeRequest,
    rateLimiter,
    config,
  };
};

// Default configuration instance
export const apiConfig = createAPIConfig();
export const apiClient = createAPIClient(apiConfig);

// Export individual configurations for specific use cases
export const openaiConfig = apiConfig.openai;
export const supabaseConfig = apiConfig.supabase;
export const featureFlags = apiConfig.features; 