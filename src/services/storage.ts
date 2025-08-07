import { Experiment, ExperimentLog, LabNotebookEntry, LabNotebookLog } from '../types';

const STORAGE_KEY = 'prompt-lab-experiments';
const API_KEYS_KEY = 'prompt-lab-api-keys';
const HANDBOOK_KEY = 'prompt-lab-handbook';

export interface ApiKeys {
  gemini?: string;
}

export class StorageService {
  static saveExperiment(experiment: Experiment): void {
    try {
      const existing = this.loadExperiments();
      
      // Check if experiment already exists and update it, otherwise add new
      const existingIndex = existing.experiments.findIndex(exp => exp.id === experiment.id);
      if (existingIndex >= 0) {
        // Update existing experiment
        existing.experiments[existingIndex] = experiment;
      } else {
        // Add new experiment
        existing.experiments.push(experiment);
      }
      
      existing.lastUpdated = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch (error) {
      console.error('Failed to save experiment:', error);
    }
  }

  static loadExperiments(): ExperimentLog {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load experiments:', error);
    }
    
    return {
      experiments: [],
      lastUpdated: Date.now(),
    };
  }

  static deleteExperiment(id: string): void {
    try {
      console.log('StorageService: Deleting experiment with ID:', id);
      const existing = this.loadExperiments();
      console.log('StorageService: Found', existing.experiments.length, 'experiments before delete');
      
      existing.experiments = existing.experiments.filter(exp => exp.id !== id);
      console.log('StorageService: Found', existing.experiments.length, 'experiments after delete');
      
      existing.lastUpdated = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      console.log('StorageService: Successfully saved to localStorage');
    } catch (error) {
      console.error('Failed to delete experiment:', error);
    }
  }

  static clearAllExperiments(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear experiments:', error);
    }
  }

  static exportExperiments(): string {
    const experiments = this.loadExperiments();
    return JSON.stringify(experiments, null, 2);
  }

  static importExperiments(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.experiments && Array.isArray(data.experiments)) {
        localStorage.setItem(STORAGE_KEY, jsonData);
        return true;
      }
    } catch (error) {
      console.error('Failed to import experiments:', error);
    }
    return false;
  }

  // API Key Management - Supports both .env and localStorage
  static loadApiKeys(): ApiKeys {
    const keys: ApiKeys = {};

    // First, try to load from environment variables (more secure)
    if (process.env.REACT_APP_GEMINI_API_KEY) {
      keys.gemini = process.env.REACT_APP_GEMINI_API_KEY;
    }

    // If no env vars, fall back to localStorage
    if (!keys.gemini) {
      try {
        const stored = localStorage.getItem(API_KEYS_KEY);
        if (stored) {
          const storedKeys = JSON.parse(stored);
          // Only use localStorage keys if env vars aren't set
          if (!keys.gemini && storedKeys.gemini) {
            keys.gemini = storedKeys.gemini;
          }
        }
      } catch (error) {
        console.error('Failed to load API keys from localStorage:', error);
      }
    }

    return keys;
  }

  static saveApiKeys(apiKeys: ApiKeys): void {
    try {
      // Only save to localStorage if not using .env
      const keysToSave: ApiKeys = {};

      // Only save keys that aren't in .env
      if (!process.env.REACT_APP_GEMINI_API_KEY && apiKeys.gemini) {
        keysToSave.gemini = apiKeys.gemini;
      }

      if (Object.keys(keysToSave).length > 0) {
        localStorage.setItem(API_KEYS_KEY, JSON.stringify(keysToSave));
      }
    } catch (error) {
      console.error('Failed to save API keys:', error);
    }
  }

  static clearApiKeys(): void {
    try {
      localStorage.removeItem(API_KEYS_KEY);
    } catch (error) {
      console.error('Failed to clear API keys:', error);
    }
  }

  // Check if using .env for API keys
  static isUsingEnvKeys(): boolean {
    return !!process.env.REACT_APP_GEMINI_API_KEY;
  }

  // Get available API providers
  static getAvailableProviders(): string[] {
    const providers: string[] = [];
    if (process.env.REACT_APP_GEMINI_API_KEY || this.loadApiKeys().gemini) {
      providers.push('gemini');
    }
    return providers;
  }

  // Lab Notebook Entry Management
  static saveLabNotebookEntry(entry: LabNotebookEntry): void {
    try {
      const existing = this.loadLabNotebookEntries();
      const existingIndex = existing.entries.findIndex(e => e.id === entry.id);
      
      if (existingIndex >= 0) {
        existing.entries[existingIndex] = entry;
      } else {
        existing.entries.push(entry);
      }
      
      existing.lastUpdated = Date.now();
      localStorage.setItem(HANDBOOK_KEY, JSON.stringify(existing));
    } catch (error) {
      console.error('Failed to save lab notebook entry:', error);
    }
  }

  static loadLabNotebookEntries(): LabNotebookLog {
    try {
      const stored = localStorage.getItem(HANDBOOK_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load lab notebook entries:', error);
    }
    
    return {
      entries: [],
      lastUpdated: Date.now(),
    };
  }

  static deleteLabNotebookEntry(id: string): void {
    try {
      const existing = this.loadLabNotebookEntries();
      existing.entries = existing.entries.filter(entry => entry.id !== id);
      existing.lastUpdated = Date.now();
      localStorage.setItem(HANDBOOK_KEY, JSON.stringify(existing));
    } catch (error) {
      console.error('Failed to delete lab notebook entry:', error);
    }
  }

  static exportLabNotebook(): string {
    const notebook = this.loadLabNotebookEntries();
    return JSON.stringify(notebook, null, 2);
  }

  static importLabNotebook(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.entries && Array.isArray(data.entries)) {
        localStorage.setItem(HANDBOOK_KEY, jsonData);
        return true;
      }
    } catch (error) {
      console.error('Failed to import lab notebook:', error);
    }
    return false;
  }
} 