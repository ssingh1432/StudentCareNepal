/**
 * Helper functions for interacting with the DeepSeek API
 */

import { apiRequest } from "./queryClient";

// Function to get activity suggestions from the DeepSeek API
export const getActivitySuggestions = async (
  promptDetails: {
    type: "Annual" | "Monthly" | "Weekly";
    class: "Nursery" | "LKG" | "UKG";
    topic?: string;
    count?: number;
  }
): Promise<string> => {
  const { type, class: classLevel, topic, count = 3 } = promptDetails;
  
  // Create a formatted prompt for the DeepSeek API
  let prompt = `Suggest ${count} educational activities for ${classLevel} students`;
  
  if (type) {
    prompt += ` for a ${type.toLowerCase()} teaching plan`;
  }
  
  if (topic) {
    prompt += ` focused on ${topic}`;
  }
  
  prompt += `. The activities should be age-appropriate for ${classLevel} students (${
    classLevel === "Nursery" 
      ? "3 years old" 
      : classLevel === "LKG" 
        ? "4 years old" 
        : "5 years old"
  }) and align with Nepal's Complete Pre-Primary System (ECED). Include materials needed and expected outcomes.`;
  
  try {
    const response = await apiRequest("POST", "/api/ai-suggestions", { prompt });
    const data = await response.json();
    return data.suggestion;
  } catch (error) {
    console.error("Error getting AI suggestions:", error);
    throw new Error("Failed to get AI suggestions. Please try again later.");
  }
};

// Function to get learning goal suggestions
export const getLearningGoalSuggestions = async (
  promptDetails: {
    type: "Annual" | "Monthly" | "Weekly";
    class: "Nursery" | "LKG" | "UKG";
    topic?: string;
    count?: number;
  }
): Promise<string> => {
  const { type, class: classLevel, topic, count = 3 } = promptDetails;
  
  let prompt = `Suggest ${count} learning goals for ${classLevel} students`;
  
  if (type) {
    prompt += ` for a ${type.toLowerCase()} teaching plan`;
  }
  
  if (topic) {
    prompt += ` focused on ${topic}`;
  }
  
  prompt += `. The goals should be age-appropriate for ${classLevel} students (${
    classLevel === "Nursery" 
      ? "3 years old" 
      : classLevel === "LKG" 
        ? "4 years old" 
        : "5 years old"
  }) and align with Nepal's Complete Pre-Primary System (ECED). Include specific measurable outcomes.`;
  
  try {
    const response = await apiRequest("POST", "/api/ai-suggestions", { prompt });
    const data = await response.json();
    return data.suggestion;
  } catch (error) {
    console.error("Error getting AI suggestions:", error);
    throw new Error("Failed to get AI suggestions. Please try again later.");
  }
};

// Function to check if the DeepSeek API is available
export const checkDeepSeekApiAvailability = async (): Promise<boolean> => {
  try {
    const testPrompt = "Test prompt for DeepSeek API availability check";
    const response = await apiRequest("POST", "/api/ai-suggestions", { prompt: testPrompt });
    const data = await response.json();
    
    return !!data.suggestion;
  } catch (error) {
    console.error("DeepSeek API not available:", error);
    return false;
  }
};
