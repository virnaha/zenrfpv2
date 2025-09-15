import { createAPIConfig, APIConfiguration } from './api-config';

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config?: APIConfiguration;
}

export const validateConfiguration = (): ConfigValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required environment variables - but don't fail if they're missing
  const requiredVars = [
    'VITE_OPENAI_API_KEY',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_SUPABASE_SERVICE_ROLE_KEY',
  ];

  for (const envVar of requiredVars) {
    if (!import.meta.env[envVar]) {
      warnings.push(`Missing environment variable: ${envVar} (using demo mode)`);
    }
  }

  // Check optional but recommended variables
  const optionalVars = [
    'VITE_OPENAI_ORGANIZATION',
    'VITE_API_BASE_URL',
  ];

  for (const envVar of optionalVars) {
    if (!import.meta.env[envVar]) {
      warnings.push(`Optional environment variable not set: ${envVar} (using default value)`);
    }
  }

  // Validate numeric values
  const numericVars = [
    { key: 'VITE_OPENAI_MAX_TOKENS', min: 1, max: 8000, default: 4000 },
    { key: 'VITE_OPENAI_TEMPERATURE', min: 0, max: 20, default: 7 },
    { key: 'VITE_API_TIMEOUT', min: 1000, max: 120000, default: 30000 },
    { key: 'VITE_API_RATE_LIMIT_REQUESTS', min: 1, max: 1000, default: 100 },
    { key: 'VITE_API_RATE_LIMIT_WINDOW', min: 1000, max: 3600000, default: 60000 },
  ];

  for (const { key, min, max, default: defaultValue } of numericVars) {
    const value = import.meta.env[key];
    if (value) {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue)) {
        errors.push(`Invalid numeric value for ${key}: ${value}`);
      } else if (numValue < min || numValue > max) {
        errors.push(`Value for ${key} must be between ${min} and ${max}, got: ${numValue}`);
      }
    } else {
      warnings.push(`Using default value for ${key}: ${defaultValue}`);
    }
  }

  // Validate URLs - but don't fail if they're missing
  const urlVars = [
    { key: 'VITE_SUPABASE_URL', name: 'Supabase URL' },
    { key: 'VITE_API_BASE_URL', name: 'API Base URL', optional: true },
  ];

  for (const { key, name, optional = false } of urlVars) {
    const value = import.meta.env[key];
    if (value) {
      try {
        new URL(value);
      } catch {
        errors.push(`Invalid URL for ${name}: ${value}`);
      }
    } else if (!optional) {
      warnings.push(`Missing URL: ${name} (using demo mode)`);
    }
  }

  // Validate boolean values
  const booleanVars = [
    'VITE_ENABLE_AI_GENERATION',
    'VITE_ENABLE_REAL_TIME_COLLABORATION',
    'VITE_ENABLE_ANALYTICS',
  ];

  for (const key of booleanVars) {
    const value = import.meta.env[key];
    if (value && !['true', 'false'].includes(value.toLowerCase())) {
      warnings.push(`Invalid boolean value for ${key}: ${value} (should be 'true' or 'false')`);
    }
  }

  // Try to create configuration if no critical errors
  let config: APIConfiguration | undefined;
  if (errors.length === 0) {
    try {
      config = createAPIConfig();
    } catch (error) {
      warnings.push(`Configuration creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config,
  };
};

export const logConfigurationStatus = (): void => {
  const result = validateConfiguration();
  
  console.group('🔧 API Configuration Status');
  
  if (result.isValid) {
    console.log('✅ Configuration is valid');
    if (result.config) {
      console.log('📋 Configuration loaded successfully');
      console.log('🤖 OpenAI Model:', result.config.openai.model);
      console.log('🔗 API Base URL:', result.config.api.baseUrl);
      console.log('⚡ Rate Limit:', `${result.config.api.rateLimit.requests} requests per ${result.config.api.rateLimit.windowMs / 1000}s`);
    }
  } else {
    console.error('❌ Configuration validation failed');
    result.errors.forEach(error => console.error('  -', error));
  }
  
  if (result.warnings.length > 0) {
    console.warn('⚠️  Configuration warnings:');
    result.warnings.forEach(warning => console.warn('  -', warning));
    
    // Check if we're in demo mode
    const isDemoMode = result.warnings.some(w => w.includes('demo mode'));
    if (isDemoMode) {
      console.log('🎭 Running in demo mode - some features may be limited');
      console.log('💡 To enable full functionality, add environment variables in Vercel dashboard');
    }
  }
  
  console.groupEnd();
};

// Export a simple check function for runtime validation
export const isConfigurationValid = (): boolean => {
  return validateConfiguration().isValid;
}; 