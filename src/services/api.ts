import { GoogleGenerativeAI } from '@google/generative-ai';
import { ApiConfig } from '../types';

export class ApiService {
  private gemini: GoogleGenerativeAI | null = null;
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
    
    if (config.provider === 'gemini' && config.apiKey) {
      this.gemini = new GoogleGenerativeAI(config.apiKey);
    }
  }

  async runExperiment(
    prompt: string,
    model: string,
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    if (this.config.provider === 'gemini' && this.gemini) {
      return this.runGeminiExperiment(prompt, model, temperature, maxTokens);
    } else {
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

    try {
      const geminiModel = this.gemini.getGenerativeModel({ 
        model: model === 'gemini-pro' ? 'gemini-pro' : 'gemini-1.5-flash',
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        }
      });

      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      return response.text() || 'No response generated';
    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw new Error(`Gemini API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


} 