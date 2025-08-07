import { GoogleGenerativeAI } from '@google/generative-ai';
import { ApiConfig } from '../types';

export class ApiService {
  private gemini: GoogleGenerativeAI | null = null;
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
    console.log('ApiService constructor called with config:', { 
      provider: config.provider, 
      hasApiKey: !!config.apiKey,
      apiKeyLength: config.apiKey?.length || 0
    });
    
    if (config.provider === 'gemini' && config.apiKey) {
      this.gemini = new GoogleGenerativeAI(config.apiKey);
      console.log('Gemini client initialized successfully');
    } else {
      console.error('Failed to initialize Gemini client:', { 
        provider: config.provider, 
        hasApiKey: !!config.apiKey 
      });
    }
  }

  async runExperiment(
    prompt: string,
    model: string,
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    console.log('runExperiment called with:', { 
      promptLength: prompt.length, 
      model, 
      temperature, 
      maxTokens,
      hasGemini: !!this.gemini,
      provider: this.config.provider,
      hasApiKey: !!this.config.apiKey
    });
    
    if (this.config.provider === 'gemini' && this.gemini) {
      console.log('Calling runGeminiExperiment...');
      return this.runGeminiExperiment(prompt, model, temperature, maxTokens);
    } else {
      console.error('No API client initialized. Config:', this.config);
      throw new Error('No API client initialized. Please check your API key and provider.');
    }
  }

  private async runGeminiExperiment(
    prompt: string,
    model: string,
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    if (!this.gemini) {
      throw new Error('Gemini client not initialized');
    }

    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    
    // Define available models with their correct API names
    const availableModels = {
      'gemini-1.5-flash': 'gemini-1.5-flash',
      'gemini-pro': 'gemini-1.5-pro', // Use the correct API name
    };
    
    // Fallback models in order of preference
    const fallbackModels = ['gemini-1.5-flash', 'gemini-1.5-pro'];

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // Try the requested model first, then fallback models
      const modelsToTry = attempt === 1 ? [model] : fallbackModels.filter(m => m !== model);
      
      for (const currentModel of modelsToTry) {
        try {
          console.log(`Making Gemini API call with model: ${currentModel} (attempt ${attempt}/${maxRetries})`);
          console.log('API Key length:', this.config.apiKey?.length || 0);
          
          // Map the model name to the correct API model name
          const apiModelName = availableModels[currentModel as keyof typeof availableModels] || 'gemini-1.5-flash';
          
          const geminiModel = this.gemini.getGenerativeModel({ 
            model: apiModelName,
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
            }
          });

          console.log('About to call generateContent...');
          const result = await geminiModel.generateContent(prompt);
          console.log('generateContent completed, getting response...');
          const response = await result.response;
          console.log('Response received, getting text...');
          const text = response.text() || 'No response generated';
          console.log('Gemini API call successful, response length:', text.length);
          return text;
        } catch (error) {
          console.error(`Gemini API call failed with model ${currentModel} (attempt ${attempt}/${maxRetries}):`, error);
          
          // Check if it's a retryable error
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const isRetryable = errorMessage.includes('503') || 
                             errorMessage.includes('overloaded') || 
                             errorMessage.includes('rate limit') ||
                             errorMessage.includes('429');
          
          // Check if it's a model not found error
          const isModelNotFound = errorMessage.includes('404') || 
                                 errorMessage.includes('not found') ||
                                 errorMessage.includes('not supported');
          
          if (!isRetryable && !isModelNotFound) {
            throw new Error(`Gemini API call failed: ${errorMessage}`);
          }
          
          // If this is the last model to try in this attempt, continue to next attempt
          if (currentModel === modelsToTry[modelsToTry.length - 1]) {
            if (attempt === maxRetries) {
              throw new Error(`All models failed after ${maxRetries} attempts. Last error: ${errorMessage}`);
            }
            
            // Wait before retrying with exponential backoff
            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
    }
    
    throw new Error('Unexpected error in retry logic');
  }
} 