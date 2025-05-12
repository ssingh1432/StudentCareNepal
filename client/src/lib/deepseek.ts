// This file handles DeepSeek API integration

// The DeepSeek API key will come from the environment variables
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || import.meta.env.VITE_DEEPSEEK_API_KEY;
const API_URL = '/api/ai-suggestions';

// Types for the DeepSeek API
export type DeepSeekRequest = {
  prompt: string;
};

export type DeepSeekResponse = {
  id: number;
  prompt: string;
  response: string;
  createdAt: string;
};

// Function to get suggestions from DeepSeek
export const getSuggestions = async (prompt: string): Promise<DeepSeekResponse> => {
  try {
    // We'll use our backend as a proxy to the DeepSeek API
    // This allows for caching and avoids exposing the API key
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get suggestions: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting DeepSeek suggestions:', error);
    throw error;
  }
};

// Helper function to create prompts for different plan types and classes
export const createSuggestionPrompt = (planType: string, classType: string, focus?: string): string => {
  const timeframe = planType === 'Annual' ? 'year-long' : 
                    planType === 'Monthly' ? 'month-long' : 'week-long';
  
  const ageGroup = classType === 'Nursery' ? '3-year-old' : 
                   classType === 'LKG' ? '4-year-old' : '5-year-old';
  
  const focusArea = focus ? ` focusing on ${focus}` : '';
  
  return `Suggest 5 activities for a ${timeframe} teaching plan for ${ageGroup} children in ${classType} class${focusArea}, following Nepal's ECED framework.`;
};
