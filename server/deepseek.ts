import axios from 'axios';

interface DeepSeekResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
  }[];
}

// Base model for DeepSeek V3
const MODEL = 'deepseek-ai/deepseek-v3-chat';

// Get DeepSeek API key from environment variables
const getApiKey = (): string => {
  return process.env.DEEPSEEK_API_KEY || '';
};

// Function to generate AI suggestions for teaching plans
export async function generateSuggestions(
  prompt: string,
  className: string,
  activityType: string
): Promise<string | null> {
  try {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      console.error('DeepSeek API key not found');
      return null;
    }

    // Construct a detailed prompt based on the user's request and class type
    const systemPrompt = `You are an experienced early childhood education expert specializing in Nepal's Complete Pre-Primary System (ECED). 
      Provide age-appropriate teaching activities for ${className} students (${
        className === 'Nursery' ? '~3 years' : 
        className === 'LKG' ? '~4 years' : '~5 years'
      }). 
      Focus on activities that: 
      1. Match the developmental level of ${className} students
      2. Can be implemented with minimal resources
      3. Align with ${activityType} goals
      4. Engage students with different learning speeds and abilities
      
      Format your response as a numbered list of 3-5 specific, practical activities. Each activity should include:
      - A clear, descriptive title
      - Brief implementation instructions
      - The specific skill it develops
      - Expected outcomes`;

    // Make request to OpenAI compatible DeepSeek API
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    const data = response.data as DeepSeekResponse;
    
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    }

    return null;
  } catch (error) {
    console.error('Error generating suggestions from DeepSeek:', error);
    return null;
  }
}

// Cache for storing generated suggestions to support offline use
const suggestionsCache = new Map<string, { suggestions: string, timestamp: number }>();

// Function to get suggestions with caching support
export async function getSuggestionsWithCaching(
  prompt: string, 
  className: string,
  activityType: string
): Promise<string | null> {
  const cacheKey = `${className}-${activityType}-${prompt}`;
  
  // Check if we have a cached response
  const cachedResult = suggestionsCache.get(cacheKey);
  
  // Return cached result if it exists and is less than 24 hours old
  if (cachedResult && Date.now() - cachedResult.timestamp < 24 * 60 * 60 * 1000) {
    return cachedResult.suggestions;
  }
  
  // Generate new suggestions
  const suggestions = await generateSuggestions(prompt, className, activityType);
  
  // Cache the result if successful
  if (suggestions) {
    suggestionsCache.set(cacheKey, {
      suggestions,
      timestamp: Date.now()
    });
  }
  
  return suggestions;
}
