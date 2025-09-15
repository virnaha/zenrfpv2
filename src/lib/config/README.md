# API Configuration Setup

This directory contains the type-safe API configuration for the RFP Response Generator, supporting OpenAI and Supabase integration.

## Files

- `api-config.ts` - Main configuration with validation and API client utilities
- `validate-config.ts` - Configuration validation utilities
- `index.ts` - Exports all configuration utilities
- `usage-example.ts` - Examples of how to use the configuration

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

### Required Variables

```bash
# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### Optional Variables (with defaults)

```bash
# OpenAI Configuration
VITE_OPENAI_ORGANIZATION=your_openai_organization_id_here
VITE_OPENAI_MODEL=gpt-4-turbo-preview
VITE_OPENAI_MAX_TOKENS=4000
VITE_OPENAI_TEMPERATURE=7

# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_TIMEOUT=30000
VITE_API_RATE_LIMIT_REQUESTS=100
VITE_API_RATE_LIMIT_WINDOW=60000

# Feature Flags
VITE_ENABLE_AI_GENERATION=true
VITE_ENABLE_REAL_TIME_COLLABORATION=false
VITE_ENABLE_ANALYTICS=true
```

## Usage

### Basic Configuration Access

```typescript
import { openaiConfig, apiConfig, featureFlags } from '@/lib/config';

// Access OpenAI settings
console.log(openaiConfig.model); // 'gpt-4-turbo-preview'
console.log(openaiConfig.maxTokens); // 4000

// Access API settings
console.log(apiConfig.api.baseUrl); // 'http://localhost:3000/api'

// Check feature flags
if (featureFlags.enableAIGeneration) {
  // AI generation is enabled
}
```

### API Client Usage

```typescript
import { apiClient } from '@/lib/config';

// Make API requests with rate limiting
const response = await apiClient.makeRequest('/generate-section', {
  method: 'POST',
  body: JSON.stringify({
    sectionId: 'executive-summary',
    prompt: 'Generate an executive summary...',
  }),
});
```

### Rate Limiting

```typescript
import { apiClient } from '@/lib/config';

// Check rate limit status
const rateLimit = apiClient.rateLimiter;
console.log('Can make request:', rateLimit.canMakeRequest());
console.log('Remaining requests:', rateLimit.getRemainingRequests());
console.log('Time until reset:', rateLimit.getTimeUntilReset());
```

### Configuration Validation

```typescript
import { validateConfiguration, logConfigurationStatus } from '@/lib/config';

// Validate configuration on app startup
const result = validateConfiguration();
if (!result.isValid) {
  console.error('Configuration errors:', result.errors);
}

// Or use the logging utility
logConfigurationStatus();
```

## Features

### Type Safety
- All configuration is fully typed with TypeScript
- Zod validation ensures runtime type safety
- Environment variables are validated on startup

### Rate Limiting
- Built-in rate limiting with configurable limits
- Automatic request tracking and throttling
- Helpful error messages with reset times

### Error Handling
- Comprehensive error handling for API requests
- Timeout support with AbortController
- Graceful fallbacks for missing configuration

### Feature Flags
- Easy feature toggling via environment variables
- Runtime feature checking
- Default values for all flags

## Integration with ResponseGenerator

The configuration is designed to integrate seamlessly with the ResponseGenerator component:

```typescript
import { canUseAIGeneration, generateResponseSection } from '@/lib/config/usage-example';

// In your ResponseGenerator component
const handleGenerateSection = async (sectionId: string) => {
  if (!canUseAIGeneration()) {
    // Show disabled state or fallback
    return;
  }

  try {
    const content = await generateResponseSection(sectionId, 'Your prompt here');
    // Update UI with generated content
  } catch (error) {
    // Handle error appropriately
  }
};
```

## Troubleshooting

### Common Issues

1. **Missing API Keys**: Ensure all required environment variables are set
2. **Invalid URLs**: Check that Supabase URL and API base URL are valid
3. **Rate Limiting**: Monitor rate limit status and adjust limits if needed
4. **TypeScript Errors**: Ensure `vite-env.d.ts` is properly configured

### Validation

Use the validation utilities to check your configuration:

```typescript
import { validateConfiguration } from '@/lib/config';

const result = validateConfiguration();
console.log('Valid:', result.isValid);
console.log('Errors:', result.errors);
console.log('Warnings:', result.warnings);
``` 