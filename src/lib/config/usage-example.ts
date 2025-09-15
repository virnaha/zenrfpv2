// Example usage of the API configuration in components
import { apiConfig, apiClient, openaiConfig, featureFlags, logConfigurationStatus } from './index';

// Example 1: Basic configuration access
export const getOpenAIConfig = () => {
  return {
    model: openaiConfig.model,
    maxTokens: openaiConfig.maxTokens,
    temperature: openaiConfig.temperature,
  };
};

// Example 2: Feature flag checking
export const canUseAIGeneration = () => {
  return featureFlags.enableAIGeneration;
};

// Example 3: API client usage
export const generateResponseSection = async (sectionId: string, prompt: string) => {
  if (!canUseAIGeneration()) {
    throw new Error('AI generation is disabled');
  }

  try {
    const response = await apiClient.makeRequest('/generate-section', {
      method: 'POST',
      body: JSON.stringify({
        sectionId,
        prompt,
        model: openaiConfig.model,
        maxTokens: openaiConfig.maxTokens,
        temperature: openaiConfig.temperature,
      }),
    });

    return response;
  } catch (error) {
    console.error('Failed to generate section:', error);
    throw error;
  }
};

// Example 4: Rate limiting check
export const checkRateLimit = () => {
  const remaining = apiClient.rateLimiter.getRemainingRequests();
  const timeUntilReset = apiClient.rateLimiter.getTimeUntilReset();
  
  return {
    canMakeRequest: apiClient.rateLimiter.canMakeRequest(),
    remainingRequests: remaining,
    timeUntilReset: Math.ceil(timeUntilReset / 1000),
  };
};

// Example 5: Configuration validation on app startup
export const initializeApp = () => {
  // Log configuration status for debugging
  logConfigurationStatus();
  
  // Check if configuration is valid
  if (!canUseAIGeneration()) {
    console.warn('AI generation is disabled. Some features may not work.');
  }
  
  // Initialize other app components...
  console.log('App initialized with configuration:', {
    openaiModel: openaiConfig.model,
    apiBaseUrl: apiConfig.api.baseUrl,
    rateLimit: apiConfig.api.rateLimit,
  });
}; 