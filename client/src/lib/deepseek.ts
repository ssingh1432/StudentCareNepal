import { apiRequest } from "@/lib/queryClient";

interface AIResponse {
  suggestions: string;
}

// Function to get AI suggestions for teaching activities
export async function getAISuggestions(prompt: string): Promise<string> {
  try {
    // Call our backend endpoint which handles the API communication
    const response = await apiRequest("POST", "/api/ai-suggestions", { prompt });
    const data: AIResponse = await response.json();
    return data.suggestions;
  } catch (error) {
    console.error("Error getting AI suggestions:", error);
    throw error;
  }
}

// Helper function to generate prompts based on class and activity type
export function generatePrompt(className: string, activityType: string): string {
  const ageMap = {
    'Nursery': '3 years old',
    'LKG': '4 years old',
    'UKG': '5 years old'
  };
  
  const age = ageMap[className as keyof typeof ageMap] || '';
  
  return `Suggest 5 ${activityType} activities for ${className} students (${age}) according to Nepal's ECED framework. Include detailed steps and learning objectives for each activity.`;
}

// Function to format AI suggestions for display
export function formatSuggestions(suggestions: string): string {
  if (!suggestions) return '';
  
  // Try to clean up and format the suggestions
  return suggestions
    .replace(/^\s*\d+\.\s*/gm, '\n• ') // Replace numbered lists with bullet points
    .replace(/^(.*:)/gm, '**$1**')     // Bold any headings/titles
    .trim();
}
