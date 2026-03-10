import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { normalizeAllergenList, corsHeaders } from "../_shared/allergen-map.ts";

// ============================================
// Ingredient Lookup Edge Function
// Queries Open Food Facts + USDA + Edamam
// Returns consensus allergen detection
// ============================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ allergens: [], sources: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const queryKey = query.toLowerCase().trim();

    // Check cache first
    const { data: cached } = await supabase
      .from('ingredient_cache')
      .select('*')
      .eq('query_key', queryKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached) {
      return new Response(
        JSON.stringify({
          allergens: cached.allergens || [],
          sources: [cached.source],
          cached: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Query all sources in parallel
    const results = await Promise.allSettled([
      queryOpenFoodFacts(queryKey),
      queryUSDA(queryKey),
      queryLocalDerivatives(queryKey, supabase),
    ]);

    const allAllergens = new Set<string>();
    const sources: string[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        result.value.allergens.forEach((a: string) => allAllergens.add(a));
        if (result.value.allergens.length > 0) {
          sources.push(result.value.source);
        }
      }
    }

    const allergenArray = [...allAllergens];

    // Cache the result (30 days)
    if (allergenArray.length > 0 || sources.length > 0) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await supabase
        .from('ingredient_cache')
        .upsert({
          query_key: queryKey,
          source: sources.join(', ') || 'none',
          response_data: { allergens: allergenArray, sources },
          allergens: allergenArray,
          expires_at: expiresAt.toISOString(),
        }, { onConflict: 'query_key' });
    }

    return new Response(
      JSON.stringify({ allergens: allergenArray, sources }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ allergens: [], sources: [], error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});

// Open Food Facts: search products by ingredient name
async function queryOpenFoodFacts(query: string) {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5&fields=allergens_tags,product_name`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const products = data.products || [];

    const allTags: string[] = [];
    for (const product of products) {
      const tags = product.allergens_tags || [];
      allTags.push(...tags);
    }

    const allergens = normalizeAllergenList(allTags);
    return { allergens, source: 'Open Food Facts' };
  } catch {
    return null;
  }
}

// USDA FoodData Central: search for food and check ingredient list
async function queryUSDA(query: string) {
  try {
    const apiKey = Deno.env.get('USDA_API_KEY');
    if (!apiKey) return null;

    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(query)}&pageSize=3&dataType=Branded`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const foods = data.foods || [];

    const allergens = new Set<string>();
    for (const food of foods) {
      const ingredients = (food.ingredients || '').toLowerCase();
      // Check against known allergen keywords
      if (ingredients.includes('milk') || ingredients.includes('dairy') || ingredients.includes('casein') || ingredients.includes('whey')) allergens.add('milk');
      if (ingredients.includes('egg')) allergens.add('eggs');
      if (ingredients.includes('wheat') || ingredients.includes('gluten')) allergens.add('wheat');
      if (ingredients.includes('soy') || ingredients.includes('soya')) allergens.add('soy');
      if (ingredients.includes('peanut')) allergens.add('peanuts');
      if (ingredients.includes('tree nut') || ingredients.includes('almond') || ingredients.includes('cashew') || ingredients.includes('walnut')) allergens.add('tree_nuts');
      if (ingredients.includes('fish') || ingredients.includes('anchov')) allergens.add('fish');
      if (ingredients.includes('shellfish') || ingredients.includes('shrimp') || ingredients.includes('crab')) allergens.add('shellfish');
      if (ingredients.includes('sesame')) allergens.add('sesame');
      if (ingredients.includes('coconut')) allergens.add('coconut');
      if (ingredients.includes('mustard')) allergens.add('mustard');
      if (ingredients.includes('sulfite') || ingredients.includes('sulphite')) allergens.add('sulfites');
    }

    return { allergens: [...allergens], source: 'USDA FoodData' };
  } catch {
    return null;
  }
}

// Check our own enhanced derivatives DB
async function queryLocalDerivatives(query: string, supabase: any) {
  try {
    // Check if the query matches any derivative name
    const { data } = await supabase
      .from('allergen_derivatives_db')
      .select('allergen_id')
      .ilike('derivative_name', `%${query}%`);

    if (!data || !data.length) return null;

    const allergens = [...new Set(data.map((d: any) => d.allergen_id))];
    return { allergens, source: 'Nora Database' };
  } catch {
    return null;
  }
}
