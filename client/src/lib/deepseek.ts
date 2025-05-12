import { apiRequest } from './queryClient';

// Define the response type for DeepSeek API suggestions
interface DeepSeekResponse {
  suggestions: string;
}

// Function to get activity suggestions from DeepSeek AI
export const getActivitySuggestions = async (prompt: string): Promise<DeepSeekResponse> => {
  try {
    const response = await apiRequest('POST', '/api/ai/suggestions', { prompt });
    return await response.json();
  } catch (error) {
    console.error('Error getting AI suggestions:', error);
    throw error;
  }
};

// Helper function to generate prompts for different grade levels and activities
export const generatePrompt = (className: string, activity: string, count: number = 3): string => {
  return `Suggest ${count} ${activity} activities for ${className} students in Nepal Central High School following the ECED framework. These should be age-appropriate for ${className === 'Nursery' ? '3' : className === 'LKG' ? '4' : '5'}-year-old children.`;
};

// Predefined activity types for suggestions
export const ACTIVITY_TYPES = [
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'counting', label: 'Counting & Math' },
  { value: 'writing', label: 'Writing' },
  { value: 'reading', label: 'Reading' },
  { value: 'art', label: 'Art & Craft' },
  { value: 'physical', label: 'Physical Activity' },
  { value: 'social', label: 'Social Skills' },
  { value: 'motor-skills', label: 'Motor Skills' },
];

// Function to parse suggestion text into structured format
export const parseSuggestions = (text: string): string[] => {
  // Try to extract numbered/bulleted list items
  const listItemRegex = /(?:\d+[\.\)]\s*|\*\s*|-\s*)([^\n]+)/g;
  const matches = [...text.matchAll(listItemRegex)];
  
  if (matches.length > 0) {
    return matches.map(match => match[1].trim());
  }
  
  // If no list items found, split by newlines and filter empty lines
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
};

// Component prop type for the AI suggestions component
export interface AISuggestionsProps {
  className: string;
  onAddToActivities: (activities: string) => void;
  disabled?: boolean;
}

export default {
  getActivitySuggestions,
  generatePrompt,
  ACTIVITY_TYPES,
  parseSuggestions
};
