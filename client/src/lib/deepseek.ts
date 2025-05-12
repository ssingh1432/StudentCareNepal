import { apiRequest } from "./queryClient";

export interface AISuggestionResponse {
  suggestions: string;
}

/**
 * Get teaching activity suggestions from DeepSeek AI
 * @param prompt The prompt to send to the AI
 * @returns The AI's suggestions
 */
export async function getAISuggestions(prompt: string): Promise<AISuggestionResponse> {
  try {
    // First check if we have a cached response in localStorage
    const cachedResponse = localStorage.getItem(`ai-suggestion:${prompt}`);
    if (cachedResponse) {
      return JSON.parse(cachedResponse);
    }
    
    // If no cached response, make the API call
    const response = await apiRequest("POST", "/api/protected/ai-suggestions", { prompt });
    const data = await response.json();
    
    // Cache the response in localStorage for offline use
    localStorage.setItem(`ai-suggestion:${prompt}`, JSON.stringify(data));
    
    return data;
  } catch (error) {
    // If offline and no cached response, throw an error
    if (!navigator.onLine) {
      throw new Error("You are offline and no cached suggestions are available. Please connect to the internet and try again.");
    }
    
    throw error;
  }
}

/**
 * Generate a prompt for teaching activities based on class and type
 * @param classLevel The class level (Nursery, LKG, UKG)
 * @param activityType The type of activities to suggest
 * @param count The number of activities to suggest
 * @returns The generated prompt
 */
export function generateActivityPrompt(
  classLevel: "Nursery" | "LKG" | "UKG",
  activityType: string,
  count: number = 5
): string {
  return `Suggest ${count} ${activityType} activities for ${classLevel} students (age ${
    classLevel === "Nursery" ? "3" : classLevel === "LKG" ? "4" : "5"
  } years) in Nepal's ECED framework. Include materials needed, step-by-step instructions, and learning objectives.`;
}

/**
 * Parse the AI suggestions into an array of activities
 * @param suggestions The raw suggestions from the AI
 * @returns An array of parsed activities
 */
export function parseActivities(suggestions: string): string[] {
  // Split by numbered list items (1., 2., etc.)
  const activities = suggestions
    .split(/\d+\.\s+/)
    .filter(item => item.trim().length > 0)
    .map(item => item.trim());
  
  return activities;
}
