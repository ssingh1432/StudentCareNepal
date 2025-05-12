import axios from 'axios';

/**
 * Gets AI-generated suggestions from DeepSeek API
 * @param prompt Text prompt for the AI
 * @returns AI-generated suggestions as text
 */
export async function getAISuggestions(prompt: string): Promise<string> {
  try {
    // Check if DeepSeek API key is available
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('DeepSeek API key not set, using fallback suggestions');
      return getFallbackSuggestions(prompt);
    }

    // Prepare prompt specific to educational context
    const educationalPrompt = `You are an experienced pre-primary education specialist in Nepal, helping teachers create lesson plans for children aged 3-5 years in Nursery, LKG, and UKG classes. Please generate helpful suggestions for the following request: ${prompt}`;

    // Make API request to DeepSeek
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are an educational assistant specialized in early childhood education in Nepal.' },
          { role: 'user', content: educationalPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    // Extract and return the AI response
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error getting AI suggestions:', error);
    
    // If API call fails, use fallback suggestions
    return getFallbackSuggestions(prompt);
  }
}

/**
 * Provides fallback suggestions when the API is unavailable
 * @param prompt Text prompt for suggestions
 * @returns Fallback suggestions as text
 */
function getFallbackSuggestions(prompt: string): string {
  // Extract class from prompt
  const classLevel = prompt.toLowerCase().includes('nursery') ? 'Nursery' :
                    prompt.toLowerCase().includes('lkg') ? 'LKG' :
                    prompt.toLowerCase().includes('ukg') ? 'UKG' : 'pre-primary';
  
  // Categorize by activity type
  if (prompt.toLowerCase().includes('story') || prompt.toLowerCase().includes('reading')) {
    return getCachedStorytellingSuggestions(classLevel);
  } else if (prompt.toLowerCase().includes('math') || prompt.toLowerCase().includes('number') || prompt.toLowerCase().includes('count')) {
    return getCachedMathSuggestions(classLevel);
  } else if (prompt.toLowerCase().includes('motor') || prompt.toLowerCase().includes('physical')) {
    return getCachedMotorSkillsSuggestions(classLevel);
  } else {
    return getCachedGeneralSuggestions(classLevel);
  }
}

/**
 * Cached storytelling suggestions by class level
 */
function getCachedStorytellingSuggestions(classLevel: string): string {
  const suggestions = {
    'Nursery': `Here are 5 storytelling activities for Nursery students:

1. **Picture Book Exploration**: Use colorful picture books with simple stories. Point to pictures and encourage children to name objects and characters they see.

2. **Puppet Story Time**: Use simple hand puppets to act out a familiar story such as "The Three Little Pigs" with exaggerated voices.

3. **Story Sequence Cards**: Create or use picture cards showing key events from a simple story, help children arrange them in order.

4. **Sound Story**: Tell a story that incorporates different sounds (animal noises, weather sounds) and have children make the sounds at appropriate moments.

5. **Circle Time Stories**: Gather children in a circle and tell a simple story using props, encouraging them to pass around and interact with the props.`,

    'LKG': `Here are 5 storytelling activities for LKG students:

1. **Story Retelling**: After reading a simple story, provide props or flannel board pieces for children to retell the story in their own words.

2. **Story Baskets**: Create baskets with items related to familiar stories (like three bears of different sizes for Goldilocks) and let children use them to reconstruct stories.

3. **Picture Sequencing**: Show pictures from a story out of order and help children arrange them in correct sequence, discussing what happens first, next, and last.

4. **Story Songs**: Teach songs that tell stories with actions, like "Five Little Monkeys" or "The Wheels on the Bus."

5. **Character Masks**: Make simple masks of story characters and let children act out stories as you narrate.`,

    'UKG': `Here are 5 storytelling activities for UKG students:

1. **Story Creation**: Start a story with "Once upon a time..." and have each child add one sentence to create a collaborative story.

2. **Story Maps**: Create simple story maps with beginning, middle, and end sections, helping children visualize story structure.

3. **Character Perspectives**: After reading a story, discuss how different characters might feel and why they acted certain ways.

4. **Story Drama**: Act out familiar stories with simple costumes, encouraging children to use dialogue.

5. **Picture Story Writing**: Have children draw a series of pictures to tell a story, then help them write or dictate simple sentences for each picture.`
  };

  return suggestions[classLevel] || suggestions['Nursery'];
}

/**
 * Cached math suggestions by class level
 */
function getCachedMathSuggestions(classLevel: string): string {
  const suggestions = {
    'Nursery': `Here are 5 number and math activities for Nursery students:

1. **Counting Songs**: Sing number songs like "Five Little Ducks" or "Ten in the Bed" with corresponding finger movements.

2. **Sorting Games**: Provide different colored blocks or beads for sorting by color and size.

3. **Number Hunt**: Hide number cards around the classroom and have children find them, then help them identify each number.

4. **Counting Objects**: Use natural materials like stones, leaves, or sticks for counting practice up to 5.

5. **Shape Exploration**: Introduce basic shapes (circle, square, triangle) through tactile activities like tracing shapes in sand or rice.`,

    'LKG': `Here are 5 number and math activities for LKG students:

1. **Counting with Movement**: Have children hop, clap, or stomp a specific number of times.

2. **Pattern Making**: Create simple patterns with blocks, beads, or colored counters (red-blue-red-blue).

3. **Number Matching**: Match number cards with corresponding quantities of objects.

4. **Measurement Activities**: Compare objects by size (bigger/smaller, taller/shorter) using direct comparison.

5. **Simple Addition**: Use manipulatives to introduce the concept of adding one more to a group.`,

    'UKG': `Here are 5 number and math activities for UKG students:

1. **Number Line Activities**: Use a floor number line for counting forward and backward, and for simple addition/subtraction.

2. **Shop Play**: Set up a pretend shop where children use play money for simple transactions.

3. **Shape Combinations**: Create pictures using different shapes, discussing how shapes can be combined.

4. **Number Stories**: Tell simple story problems (e.g., "5 birds were sitting on a tree, 2 flew away, how many are left?").

5. **Measurement Projects**: Measure classroom objects using non-standard units like paper clips or hand spans.`
  };

  return suggestions[classLevel] || suggestions['Nursery'];
}

/**
 * Cached motor skills suggestions by class level
 */
function getCachedMotorSkillsSuggestions(classLevel: string): string {
  const suggestions = {
    'Nursery': `Here are 5 motor skills activities for Nursery students:

1. **Finger Painting**: Provide finger paints and paper for sensory exploration and finger muscle development.

2. **Bead String**: Offer large beads and thick string for basic stringing practice.

3. **Playdough Manipulation**: Provide playdough for squeezing, rolling, and making simple shapes.

4. **Bubble Wrap Popping**: Let children pop bubble wrap using their finger muscles.

5. **Ball Rolling**: Sit in a circle and practice rolling a ball back and forth to develop coordination.`,

    'LKG': `Here are 5 motor skills activities for LKG students:

1. **Tracing Activities**: Provide large shapes and letters for finger tracing in sand or salt trays.

2. **Button and Snap Practice**: Set up dressing frames with large buttons and snaps for fastening practice.

3. **Scissors Practice**: Offer child-safe scissors and paper strips for straight-line cutting.

4. **Balance Beam Walking**: Create a simple floor balance beam using tape for children to walk on.

5. **Threading Cards**: Make simple cardboard shapes with holes for lacing with shoelaces.`,

    'UKG': `Here are 5 motor skills activities for UKG students:

1. **Pattern Cutting**: Provide dotted line patterns for children to cut with scissors.

2. **Letter Formation**: Practice forming letters in sand, rice, or with playdough.

3. **Obstacle Courses**: Create simple obstacle courses that involve crawling, jumping, and balancing.

4. **Drawing Details**: Encourage drawing with increasing detail and control using various tools.

5. **Lacing Cards**: Use more complex lacing cards with smaller holes and thinner laces.`
  };

  return suggestions[classLevel] || suggestions['Nursery'];
}

/**
 * Cached general suggestions by class level
 */
function getCachedGeneralSuggestions(classLevel: string): string {
  const suggestions = {
    'Nursery': `Here are 5 general activities for Nursery students:

1. **Sensory Bins**: Create themed sensory bins with rice, water beads, or sand along with relevant toys for exploration.

2. **Color Mixing**: Demonstrate simple color mixing with finger paints, letting children explore primary colors.

3. **Nature Walk**: Take short walks to observe nature, collecting leaves or stones to count and sort.

4. **Music and Movement**: Play simple songs with actions like "Head, Shoulders, Knees and Toes."

5. **Daily Routines Practice**: Use pictures to create a visual schedule of daily activities to build understanding of sequence.`,

    'LKG': `Here are 5 general activities for LKG students:

1. **Role Play Corners**: Set up simple dramatic play areas like a kitchen or doctor's office to encourage social interaction.

2. **Weather Chart**: Create a daily weather chart where children can place symbols for sunny, rainy, or cloudy days.

3. **Plant Growing**: Plant seeds in transparent containers to observe growth over time.

4. **Emotion Cards**: Use picture cards showing different emotions to help children identify and name feelings.

5. **Sound Games**: Play games identifying environmental sounds or beginning sounds of words.`,

    'UKG': `Here are 5 general activities for UKG students:

1. **Project-Based Learning**: Conduct simple projects on topics like "My Family" or "Animals" over several days.

2. **Community Helpers**: Explore different community roles through books, dress-up, and visits from community members.

3. **Simple Science Experiments**: Conduct basic experiments like sink or float, or making a volcano with baking soda and vinegar.

4. **Group Problem Solving**: Present simple problems for children to solve together, like building a bridge with blocks.

5. **Calendar Activities**: Use a classroom calendar to discuss days of the week, upcoming events, and passage of time.`
  };

  return suggestions[classLevel] || suggestions['Nursery'];
}
