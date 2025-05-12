import axios from 'axios';

// Use OpenAI compatible SDK for DeepSeek
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';

/**
 * Gets teaching activity suggestions from DeepSeek AI
 * @param prompt - The prompt for DeepSeek
 * @returns The suggestions text
 */
export async function getAiSuggestions(prompt: string): Promise<string> {
  // Check if DeepSeek API key is configured
  if (!DEEPSEEK_API_KEY) {
    console.warn('DeepSeek API key not configured, returning sample suggestions');
    return generateSampleSuggestions(prompt);
  }

  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-v3',
        messages: [
          {
            role: 'system',
            content: 'You are an expert pre-primary education assistant. You provide teaching activity suggestions for Nepali pre-primary teachers working with children aged 3-5 years. Your suggestions should be practical, engaging, and appropriate for the specified age group and learning goals.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error getting suggestions from DeepSeek:', error);
    // Fallback to sample suggestions
    return generateSampleSuggestions(prompt);
  }
}

/**
 * Generates sample suggestions when the API is not available
 * @param prompt - The original prompt
 * @returns Sample suggestions based on the prompt
 */
function generateSampleSuggestions(prompt: string): string {
  // Extract class type and activity type from prompt
  const classMatch = prompt.match(/nursery|lkg|ukg/i);
  const classType = classMatch ? classMatch[0].toUpperCase() : 'LKG';
  
  const activityMatches = [
    { type: 'storytelling', regex: /story|tell/i, activities: [
      'Use picture books with large, colorful illustrations',
      'Incorporate puppets or stuffed animals as story characters',
      'Create a "story corner" with comfortable seating and props'
    ]},
    { type: 'counting', regex: /count|number|math/i, activities: [
      'Use counting songs with finger actions',
      'Sort and count natural objects like leaves or stones',
      'Create a number hunt game around the classroom'
    ]},
    { type: 'motor skills', regex: /motor|physical|movement/i, activities: [
      'Set up a simple obstacle course',
      'Practice threading large beads on a string',
      'Trace shapes and letters in sand or rice trays'
    ]},
    { type: 'art', regex: /art|craft|draw/i, activities: [
      'Finger painting with washable, non-toxic paints',
      'Collage making with natural materials',
      'Clay or dough modeling of simple shapes'
    ]}
  ];
  
  // Find matching activity type or default to general
  const activityType = activityMatches.find(m => m.regex.test(prompt)) || {
    type: 'general',
    activities: [
      'Morning circle time with songs and greetings',
      'Show and tell sessions with familiar objects',
      'Nature walks with observation activities'
    ]
  };
  
  // Generate tailored response based on class type
  let classSpecificActivities = '';
  if (classType === 'NURSERY') {
    classSpecificActivities = 'Focus on sensory activities and basic social interactions.';
  } else if (classType === 'LKG') {
    classSpecificActivities = 'Include activities that develop pre-literacy and basic number concepts.';
  } else if (classType === 'UKG') {
    classSpecificActivities = 'Incorporate more structured activities that prepare for primary school readiness.';
  }
  
  // Build the response
  return `
Here are some suggested ${activityType.type} activities for ${classType} students:

${activityType.activities.map((a, i) => `${i+1}. ${a}`).join('\n')}

Additional suggestions:
- ${classSpecificActivities}
- Schedule activities for 15-20 minutes to maintain attention.
- Include a mix of individual and group activities.
- Allow for free play and exploration time between structured activities.
  `;
}
