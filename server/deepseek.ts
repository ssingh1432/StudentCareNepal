import axios from 'axios';

/**
 * Get AI suggestions using DeepSeek API
 * @param prompt The prompt to send to DeepSeek
 * @returns Generated suggestions text
 */
export async function getAISuggestions(prompt: string): Promise<string> {
  try {
    // Check if DeepSeek API key is configured
    const apiKey = process.env.DEEPSEEK_API_KEY || '';
    
    if (!apiKey) {
      console.warn('DeepSeek API key not configured. Returning mock response.');
      return mockAiResponse(prompt);
    }
    
    // DeepSeek API endpoint - using OpenAI compatible interface
    const endpoint = 'https://api.deepseek.com/v1/chat/completions';
    
    // Make request to DeepSeek API
    const response = await axios.post(
      endpoint,
      {
        model: 'deepseek-chat', // Using DeepSeek-V3
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant for pre-primary teachers in Nepal. You provide educational activities and suggestions for Nursery (~3 years), LKG (~4 years), and UKG (~5 years) students based on Nepal\'s ECED framework. Focus on creative activities that develop social skills, pre-literacy, pre-numeracy, motor skills, and emotional development.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );
    
    // Return the generated text
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    
    // If API fails, fall back to mock response
    return mockAiResponse(prompt);
  }
}

/**
 * Generate a mock AI response based on the prompt
 * This is a fallback in case the DeepSeek API is not available
 * @param prompt The prompt to generate a response for
 * @returns Generated mock response
 */
function mockAiResponse(prompt: string): string {
  // Extract class and activity type from prompt
  const promptLower = prompt.toLowerCase();
  let classLevel = 'pre-primary';
  let activityType = 'activities';
  
  if (promptLower.includes('nursery')) {
    classLevel = 'Nursery (3 years)';
  } else if (promptLower.includes('lkg')) {
    classLevel = 'LKG (4 years)';
  } else if (promptLower.includes('ukg')) {
    classLevel = 'UKG (5 years)';
  }
  
  if (promptLower.includes('literacy') || promptLower.includes('reading') || promptLower.includes('writing')) {
    activityType = 'pre-literacy activities';
  } else if (promptLower.includes('math') || promptLower.includes('number') || promptLower.includes('counting')) {
    activityType = 'pre-numeracy activities';
  } else if (promptLower.includes('motor') || promptLower.includes('physical')) {
    activityType = 'motor skill activities';
  } else if (promptLower.includes('social') || promptLower.includes('emotional')) {
    activityType = 'social-emotional activities';
  }
  
  // Generate response based on class level and activity type
  if (classLevel === 'Nursery (3 years)') {
    if (activityType === 'pre-literacy activities') {
      return `Here are some pre-literacy activities for Nursery students (age 3):

1. Picture Book Exploration: Provide colorful picture books and encourage children to identify objects, colors, and simple actions in the pictures. Ask open-ended questions about what they see.

2. Rhyme Time Circle: Teach simple rhymes with actions like "Twinkle Twinkle Little Star" or "Rain Rain Go Away" with Nepali translations. Create a daily rhyme time where children join in.

3. Letter of the Week: Introduce one letter per week with multiple sensory activities. For example, for letter 'A': trace it in sand, make it with play dough, find objects that start with 'A'.

4. Storytelling with Puppets: Use hand puppets to tell simple stories, allowing children to interact with the characters and repeat key phrases.

5. Name Recognition: Create name cards for each child with their photo. Help them recognize their written name during arrival activities and classroom transitions.`;
    } else if (activityType === 'pre-numeracy activities') {
      return `Here are some pre-numeracy activities for Nursery students (age 3):

1. Counting Songs: Teach simple counting songs like "One, Two, Buckle My Shoe" or "Five Little Monkeys," using fingers to represent numbers.

2. Sorting Games: Provide collections of objects (blocks, buttons, leaves) for children to sort by color, size, or shape.

3. Number Hunt: Hide number cards (1-5) around the classroom and have children find them and say the numbers.

4. Counting Steps: Count steps when walking to different areas of the classroom or playground.

5. Daily Calendar Routine: Create a simple calendar routine where children count the day of the month and identify patterns in the calendar.`;
    } else {
      return `Here are some general activities for Nursery students (age 3):

1. Sensory Bins: Create bins with different materials like rice, beans, or water with tools for scooping, pouring, and transferring to develop fine motor skills.

2. Nature Walk Collage: Take children on a short nature walk to collect leaves, flowers, and small sticks. Create a collage with the collected items.

3. Movement Games: Play simple games like "Simon Says" or "Follow the Leader" to develop gross motor skills and listening abilities.

4. Color Scavenger Hunt: Give children a specific color each day and have them find objects of that color in the classroom.

5. Friendship Circle: Start each day with a friendship circle where children greet each other by name and share a simple thought or feeling.`;
    }
  } else if (classLevel === 'LKG (4 years)') {
    if (activityType === 'pre-literacy activities') {
      return `Here are some pre-literacy activities for LKG students (age 4):

1. Letter Sound Games: Introduce letter sounds through games. For example, "I spy something that starts with the sound /b/".

2. Story Sequencing: After reading a familiar story, provide simple picture cards representing beginning, middle, and end events for children to arrange in order.

3. Rhyming Word Pairs: Play games matching rhyming word pairs using picture cards (cat-hat, dog-log).

4. Name Writing: Practice writing their names using different materials - pencils, markers, chalk, or forming letters with clay.

5. Word Family Houses: Create house-shaped cards with word families like "-at" (cat, bat, rat) or "-an" (man, fan, pan) and help children create new words by changing the first letter.`;
    } else if (activityType === 'pre-numeracy activities') {
      return `Here are some pre-numeracy activities for LKG students (age 4):

1. Number Formation: Practice forming numbers 1-10 in various materials like sand, shaving cream, or with paintbrushes and water.

2. Counting with Movement: Count while doing physical actions like jumping, clapping, or hopping to connect numbers with quantities.

3. Simple Addition: Use concrete objects to introduce the concept of adding one more to a small group, recording the results with pictures.

4. Shape Hunt: Go on a "shape hunt" around the school to find and document examples of circles, squares, triangles, and rectangles.

5. Measuring Activities: Use non-standard units (cubes, paper clips) to measure and compare lengths of different objects.`;
    } else {
      return `Here are some general activities for LKG students (age 4):

1. Role Play Centers: Set up simple role play areas (shop, home, hospital) with props to encourage language development and social interaction.

2. Pattern Activities: Create and extend simple patterns using beads, blocks, or stamps (red-blue-red-blue or circle-square-circle-square).

3. Friendship Skills: Use puppets to model and practice sharing, taking turns, and using kind words.

4. Scientific Explorations: Set up simple experiments with magnets, sinking/floating objects, or growing plants to develop curiosity and observation skills.

5. Cultural Celebrations: Introduce festivals and cultural practices from Nepal through music, food, clothing, and stories.`;
    }
  } else if (classLevel === 'UKG (5 years)') {
    if (activityType === 'pre-literacy activities') {
      return `Here are some pre-literacy activities for UKG students (age 5):

1. Sound Blending: Practice blending sounds to make simple three-letter words (c-a-t, d-o-g, s-u-n).

2. Story Creation: Use picture prompts to help children create their own simple stories, which you can transcribe for them.

3. Word Building: Provide letter cards to build simple words, focusing on those with regular spelling patterns.

4. Reading Response: After reading stories, encourage children to draw pictures showing their favorite part and dictate or attempt to write a sentence about it.

5. Environmental Print: Create a word wall with common signs and labels from the children's environment (STOP, EXIT, familiar product names) to build early reading skills.`;
    } else if (activityType === 'pre-numeracy activities') {
      return `Here are some pre-numeracy activities for UKG students (age 5):

1. Number Bonds: Use manipulatives to explore number bonds to 10 (different ways to make 10, like 7+3, 6+4).

2. Simple Graphing: Create picture graphs of children's preferences (favorite fruits, colors, animals) and discuss which has more/less/equal.

3. Money Concepts: Set up a classroom shop with price tags (1-10 rupees) where children can practice simple transactions using play money.

4. Number Writing: Practice writing numbers 1-20 with proper formation, starting and stopping points.

5. Pattern Extension: Create growing patterns (1 block, 2 blocks, 3 blocks) and ask children to predict what comes next.`;
    } else {
      return `Here are some general activities for UKG students (age 5):

1. Community Helpers Project: Learn about different community helpers in Nepal through field trips, guest speakers, and role play activities.

2. Problem-Solving Scenarios: Present simple problems (how to share limited resources, how to include everyone in a game) and brainstorm solutions as a group.

3. Collaborative Art: Create murals or group art projects where each child contributes a part to develop teamwork and planning skills.

4. Memory Games: Play increasingly complex memory games with cards or objects to develop concentration and visual memory.

5. Pre-Writing Exercises: Practice tracing and writing simple sentences related to their experiences and stories read in class.`;
    }
  } else {
    return `Here are some general teaching activities for pre-primary students:

1. Weather Chart: Create a daily routine where children observe and record the weather using simple symbols, building science observation skills and vocabulary.

2. Show and Tell: Schedule weekly opportunities for each child to bring a special item from home and describe it to their classmates.

3. Music and Movement: Incorporate daily music sessions with traditional Nepali songs and movements to develop rhythm, coordination, and cultural awareness.

4. Drama and Role Play: Act out familiar stories or everyday situations to build language, social understanding, and confidence.

5. Fine Motor Centers: Set up stations with activities like threading beads, using tweezers to sort small objects, cutting with scissors, and tracing lines to develop hand muscles needed for writing.`;
  }
}
