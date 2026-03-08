import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, context, allergens, dietary } = await req.json();

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      // Fallback: provide helpful responses without AI
      return new Response(
        JSON.stringify({ response: getOfflineResponse(query, allergens, dietary) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are Nora, an AI food safety assistant specializing in allergens and dietary restrictions. You help people with food allergies dine safely.

USER PROFILE:
${context || 'No allergen profile set up yet.'}

GUIDELINES:
- Always prioritize safety. When in doubt, recommend asking restaurant staff.
- Know common allergen derivatives (e.g., casein = dairy, lecithin = soy/eggs).
- Consider cross-contamination risks.
- Be concise but thorough about safety info.
- If asked about specific restaurants, note that allergen info should always be verified with staff.
- For location-based questions, provide general cuisine safety tips for the area/type of food.
- Never guarantee that any food is 100% safe - always recommend verification.
- Be warm, helpful, and reassuring. Many allergy sufferers have anxiety about eating out.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'I couldn\'t process that question. Please try rephrasing.';

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ response: 'Sorry, I encountered an error. Please try again.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});

// Offline fallback responses when no API key is configured
function getOfflineResponse(query: string, allergens: string[], dietary: string[]): string {
  const q = query.toLowerCase();
  const allergenList = allergens?.length ? allergens.join(', ') : 'none specified';

  if (q.includes('safe') && (q.includes('restaurant') || q.includes('eat'))) {
    return `Based on your allergen profile (${allergenList}), here are some general tips for dining out safely:\n\n` +
      `1. Always inform your server about your allergies before ordering\n` +
      `2. Ask about cross-contamination in the kitchen\n` +
      `3. Request ingredient lists for dishes you're interested in\n` +
      `4. Stick to simple dishes with fewer ingredients when unsure\n` +
      `5. Check the restaurant list in Nora - we show safety scores for each restaurant based on your profile!\n\n` +
      `You can search for restaurants on the home page to see which have the highest percentage of safe menu items for you.`;
  }

  if (q.includes('contain') || q.includes('allergen') || q.includes('ingredient')) {
    return `Great question about food ingredients! With your allergens (${allergenList}), always watch for:\n\n` +
      `- Hidden derivatives (e.g., casein = dairy, lecithin = soy/eggs)\n` +
      `- Cross-contamination from shared cooking equipment\n` +
      `- Sauces and dressings which often contain hidden allergens\n` +
      `- Fried foods that may share oil with allergen-containing items\n\n` +
      `Check your Profile page in Nora to see the full list of derivatives we track for your allergens.`;
  }

  if (q.includes('cross') && q.includes('contam')) {
    return `Cross-contamination is a serious concern. Key things to ask restaurants:\n\n` +
      `1. Do you use separate cooking surfaces for allergen-free meals?\n` +
      `2. Are fryers shared between different food types?\n` +
      `3. Do you change gloves between handling different ingredients?\n` +
      `4. Can you prepare my meal in a clean area?\n\n` +
      `In Nora, menu items flagged with yellow "Caution" badges have potential cross-contamination risks based on the restaurant's reported practices.`;
  }

  return `I'm Nora, your food safety AI assistant! I can help with:\n\n` +
    `- Finding safe restaurants based on your allergens (${allergenList})\n` +
    `- Understanding which ingredients to watch for\n` +
    `- Cross-contamination risks and how to avoid them\n` +
    `- General food allergy dining tips\n\n` +
    `Try asking me something like "Is pad thai usually safe for peanut allergies?" or "What should I watch out for at Italian restaurants?"`;
}
