import axios from 'axios';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export interface DeepSeekResponse {
  id: string;
  choices: {
    message: {
      content: string;
      role: string;
    };
    index: number;
    finish_reason: string;
  }[];
  created: number;
  model: string;
  object: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Generate activity suggestions using DeepSeek AI
 * @param prompt - The prompt to send to DeepSeek
 * @returns Promise resolving to suggestions
 */
export async function generateSuggestions(prompt: string): Promise<string> {
  try {
    if (!DEEPSEEK_API_KEY) {
      console.warn('DeepSeek API key not provided, using fallback suggestions');
      return getFallbackSuggestions(prompt);
    }

    const response = await axios.post<DeepSeekResponse>(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful teaching assistant for pre-primary education. Provide creative, age-appropriate activities that align with Nepal\'s ECED framework.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
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
    console.error('DeepSeek API error:', error);
    return getFallbackSuggestions(prompt);
  }
}

/**
 * Get fallback suggestions when the API is unavailable
 * @param prompt - The prompt that was sent
 * @returns Fallback suggestions based on the prompt
 */
function getFallbackSuggestions(prompt: string): string {
  const lowercasePrompt = prompt.toLowerCase();
  
  // Check what class level the prompt is for
  const isNursery = lowercasePrompt.includes('nursery');
  const isLKG = lowercasePrompt.includes('lkg');
  const isUKG = lowercasePrompt.includes('ukg');
  
  // Check what type of activities are being requested
  const isStorytelling = lowercasePrompt.includes('storytelling') || lowercasePrompt.includes('story');
  const isCounting = lowercasePrompt.includes('counting') || lowercasePrompt.includes('numbers');
  const isColorRecognition = lowercasePrompt.includes('color') || lowercasePrompt.includes('colours');
  const isMotorSkills = lowercasePrompt.includes('motor skills') || lowercasePrompt.includes('hand');
  
  // Generate appropriate fallback suggestions
  if (isNursery) {
    if (isStorytelling) {
      return "Here are some storytelling activities for Nursery students:\n\n1. Animal Tales: Use colorful picture books with large, simple animal images. Encourage children to make animal sounds as you tell the story.\n\n2. Puppet Play: Use simple sock puppets to act out familiar stories like 'The Three Little Pigs'. Let children touch and interact with the puppets.\n\n3. Story Bags: Fill a bag with objects related to a simple story. Pull out each item as you tell the story, allowing children to hold and examine them.";
    } else if (isCounting) {
      return "Here are some counting activities for Nursery students:\n\n1. Counting Steps: Make a number path with papers on the floor numbered 1-5. Have children jump on each number while counting out loud.\n\n2. Counting Songs: Sing simple counting songs like 'Five Little Monkeys' with finger movements.\n\n3. Nature Counting: During outdoor time, collect leaves, stones, or flowers and count them together in small groups.";
    } else if (isColorRecognition) {
      return "Here are some color recognition activities for Nursery students:\n\n1. Color Scavenger Hunt: Ask children to find objects of a specific color in the classroom.\n\n2. Color Sorting: Provide a variety of colored blocks or toys and have children sort them by color into different containers.\n\n3. Color Day: Designate specific days as 'Red Day' or 'Blue Day' where activities, stories, and snacks focus on that color.";
    } else {
      return "Here are some general activities for Nursery students:\n\n1. Sensory Bins: Create bins filled with rice, beans, or sand with hidden objects for children to discover and describe.\n\n2. Fingerprint Art: Use non-toxic paint for children to make fingerprint pictures, developing fine motor skills.\n\n3. Music and Movement: Play simple songs that incorporate body movements and basic directions like 'Heads, Shoulders, Knees and Toes'.";
    }
  } else if (isLKG) {
    if (isStorytelling) {
      return "Here are some storytelling activities for LKG students:\n\n1. Story Sequencing: After reading a simple story, provide pictures of key events and have children arrange them in order.\n\n2. Role Play Corner: Set up props related to familiar stories and let children act out the stories in small groups.\n\n3. Story Completion: Begin telling a familiar story and stop at a key point, asking children to suggest what might happen next.";
    } else if (isCounting) {
      return "Here are some counting activities for LKG students:\n\n1. Counting with Manipulatives: Use buttons, beads, or blocks for children to count in groups of up to 10.\n\n2. Number Hunt: Hide number cards around the classroom and ask children to find a specific number.\n\n3. Counting Books: Create simple counting books where children draw a corresponding number of objects on each page.";
    } else if (isMotorSkills) {
      return "Here are some motor skills activities for LKG students:\n\n1. Lacing Cards: Provide cardboard shapes with holes punched around the edges and yarn for threading.\n\n2. Playdough Letters: Show children how to roll playdough into snake shapes to form simple letters.\n\n3. Scissor Skills: Practice cutting along straight and curved lines drawn on paper.";
    } else {
      return "Here are some general activities for LKG students:\n\n1. Pattern Making: Create simple patterns with colored blocks or beads for children to continue.\n\n2. Letter Recognition Games: Play games like Letter Bingo or Letter Treasure Hunt.\n\n3. Shape Collages: Cut out basic shapes from colored paper and have children create pictures by combining different shapes.";
    }
  } else if (isUKG) {
    if (isStorytelling) {
      return "Here are some storytelling activities for UKG students:\n\n1. Story Map: After reading a story, help children create a simple map showing the setting and main events.\n\n2. Character Puppets: Have children create simple stick puppets of story characters and use them to retell the story.\n\n3. Story Innovation: Take a familiar story and change elements like the characters or setting, encouraging children to help create the new version.";
    } else if (isCounting) {
      return "Here are some counting activities for UKG students:\n\n1. Number Bonds: Use objects to show how numbers can be broken down (e.g., 5 can be 2+3 or 4+1).\n\n2. Skip Counting: Practice counting by 2s or 5s using visual aids like number lines.\n\n3. Simple Addition Stories: Create word problems with small numbers (up to 10) and use objects to solve them.";
    } else if (isMotorSkills) {
      return "Here are some motor skills activities for UKG students:\n\n1. Tracing Letters and Numbers: Provide worksheets with dotted letters and numbers for children to trace.\n\n2. Paper Weaving: Cut slits in colored paper and show children how to weave strips through.\n\n3. Button Practice: Have children practice buttoning and unbuttoning on special practice boards.";
    } else {
      return "Here are some general activities for UKG students:\n\n1. Word Families: Introduce simple word families like '-at' (cat, bat, rat) with pictures and word cards.\n\n2. Science Experiments: Conduct simple experiments like sink/float or mixing colors.\n\n3. Beginning Phonics Games: Play games where children identify the beginning sound of words.";
    }
  } else {
    // Generic suggestions if the class level is not specified
    return "Here are some activities for pre-primary students:\n\n1. Show and Tell: Encourage children to bring an item from home and talk about it for a minute.\n\n2. Weather Chart: Create a daily routine of updating a classroom weather chart with the appropriate symbols.\n\n3. Friendship Circle: Sit in a circle and pass a 'talking object' that gives each child a turn to share something about themselves.\n\n4. Nature Walk: Take children outside to observe and collect natural objects, then create art or sorting activities with them.\n\n5. Rhythm and Rhyme: Teach simple poems with actions to develop language and coordination.";
  }
}
