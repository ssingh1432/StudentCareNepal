import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface DeepSeekOptions {
  cacheResults?: boolean; // whether to cache results (default: true)
}

interface DeepSeekResult {
  isLoading: boolean;
  error: string | null;
  suggestions: string | null;
  getSuggestions: (prompt: string) => Promise<string | null>;
}

/**
 * Hook for getting AI suggestions from DeepSeek
 */
export function useDeepSeek(options?: DeepSeekOptions): DeepSeekResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string | null>(null);

  const defaultOptions: DeepSeekOptions = {
    cacheResults: true
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // Create a cache for suggestions if enabled
  const suggestionCache: Record<string, string> = {};

  const getSuggestions = async (prompt: string): Promise<string | null> => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return null;
    }

    // Check cache if enabled
    if (mergedOptions.cacheResults && suggestionCache[prompt]) {
      setSuggestions(suggestionCache[prompt]);
      return suggestionCache[prompt];
    }

    try {
      setIsLoading(true);
      setError(null);

      // Make API request to get suggestions
      const response = await apiRequest('POST', '/api/ai-suggestions', { prompt });
      const data = await response.json();

      // Cache the result if enabled
      if (mergedOptions.cacheResults) {
        suggestionCache[prompt] = data.suggestions;
      }

      setSuggestions(data.suggestions);
      return data.suggestions;
    } catch (err) {
      console.error('Error getting AI suggestions:', err);
      setError('Failed to get suggestions. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, suggestions, getSuggestions };
}
