import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/allergen-map.ts";

// ============================================
// Restaurant Menu Analyze Edge Function
// Queries Spoonacular for chain restaurant
// allergen data (800+ US chains)
// ============================================

const SPOONACULAR_BASE = 'https://api.spoonacular.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { restaurantName, userAllergens } = await req.json();
    if (!restaurantName) {
      return new Response(
        JSON.stringify({ error: 'restaurantName required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const apiKey = Deno.env.get('SPOONACULAR_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Spoonacular API key not configured', menuItems: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const cacheKey = restaurantName.toLowerCase().trim();

    // Check cache (7-day TTL)
    const { data: cached } = await supabase
      .from('chain_restaurant_cache')
      .select('*')
      .eq('chain_name', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached) {
      return new Response(
        JSON.stringify({ menuItems: cached.menu_data, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search Spoonacular for restaurant
    const searchUrl = `${SPOONACULAR_BASE}/food/menuItems/search?apiKey=${apiKey}&query=${encodeURIComponent(restaurantName)}&number=20`;
    const searchRes = await fetch(searchUrl);

    if (!searchRes.ok) {
      return new Response(
        JSON.stringify({ menuItems: [], error: 'Spoonacular API error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const searchData = await searchRes.json();
    const menuItems = searchData.menuItems || [];

    // Map allergen intolerances for Spoonacular
    const intoleranceMap: Record<string, string> = {
      'gluten': 'gluten',
      'wheat': 'wheat',
      'milk': 'dairy',
      'eggs': 'egg',
      'peanuts': 'peanut',
      'tree_nuts': 'tree nut',
      'soy': 'soy',
      'shellfish': 'shellfish',
      'sesame': 'sesame',
      'sulfites': 'sulfite',
    };

    // Enrich with allergen info if user has allergens
    const enriched = menuItems.map((item: any) => ({
      id: item.id,
      title: item.title,
      restaurantChain: item.restaurantChain,
      image: item.image,
    }));

    // Cache the results
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await supabase
      .from('chain_restaurant_cache')
      .upsert({
        chain_name: cacheKey,
        menu_data: enriched,
        expires_at: expiresAt.toISOString(),
      }, { onConflict: 'chain_name' });

    return new Response(
      JSON.stringify({ menuItems: enriched }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ menuItems: [], error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
