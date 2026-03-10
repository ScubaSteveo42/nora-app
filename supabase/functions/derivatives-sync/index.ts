import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { normalizeAllergen, corsHeaders } from "../_shared/allergen-map.ts";

// ============================================
// Derivatives Sync Edge Function
// Fetches allergen derivatives from Open Food Facts
// and merges with static Nora derivatives into DB
// ============================================

// Static derivatives from Nora (same as config.js, canonical source)
const STATIC_DERIVATIVES: Record<string, string[]> = {
  'turmeric': ['curcumin', 'annatto', 'curcuminoids'],
  'peanuts': ['arachis oil', 'groundnut', 'monkey nuts', 'earth nuts', 'beer nuts', 'peanut flour', 'peanut butter', 'peanut protein', 'arachis hypogaea'],
  'milk': ['casein', 'whey', 'lactose', 'lactalbumin', 'ghee', 'curds', 'cream', 'butter', 'cheese', 'yogurt', 'kefir', 'buttermilk', 'half and half', 'milk powder', 'milk solids', 'milk protein', 'sodium caseinate', 'calcium caseinate', 'rennet casein'],
  'eggs': ['albumin', 'lysozyme', 'meringue', 'mayonnaise', 'lecithin', 'globulin', 'ovalbumin', 'egg wash', 'egg powder', 'dried egg', 'egg white', 'egg yolk', 'ovomucin', 'ovomucoid', 'ovovitellin'],
  'wheat': ['semolina', 'spelt', 'durum', 'farina', 'kamut', 'couscous', 'bulgur', 'seitan', 'einkorn', 'freekeh', 'wheat starch', 'wheat germ', 'wheat bran', 'wheat flour', 'bread flour', 'all-purpose flour', 'graham flour', 'triticale'],
  'soy': ['edamame', 'miso', 'tempeh', 'tofu', 'soya', 'soy lecithin', 'soy sauce', 'tamari', 'textured vegetable protein', 'soy protein', 'soy flour', 'soy milk', 'soybean oil', 'hydrolyzed soy protein', 'soy isolate'],
  'tree_nuts': ['almonds', 'cashews', 'walnuts', 'pecans', 'pistachios', 'macadamia', 'brazil nuts', 'hazelnuts', 'pine nuts', 'praline', 'marzipan', 'nougat', 'almond flour', 'almond milk', 'cashew butter', 'walnut oil', 'hazelnut spread', 'nut butter', 'nut milk', 'nut flour'],
  'shellfish': ['crab', 'lobster', 'shrimp', 'prawns', 'crayfish', 'scallops', 'clams', 'mussels', 'oysters', 'langoustine', 'crawfish', 'shrimp paste', 'crab paste'],
  'sesame': ['tahini', 'halvah', 'hummus', 'sesame oil', 'gomashio', 'benne seeds', 'sesame flour', 'sesame paste', 'sesame salt'],
  'gluten': ['barley', 'rye', 'oats', 'triticale', 'malt', "brewer's yeast", 'seitan', 'modified food starch', 'malt extract', 'malt vinegar', 'malt syrup', 'barley malt', 'wheat gluten', 'vital wheat gluten'],
  'fish': ['anchovies', 'fish sauce', 'fish oil', 'omega-3', 'surimi', 'worcestershire sauce', 'caesar dressing', 'bouillabaisse', 'fish paste', 'fish stock', 'bonito', 'dashi', 'fumet', 'isinglass'],
  'corn': ['cornstarch', 'corn syrup', 'dextrose', 'maltodextrin', 'high fructose corn syrup', 'corn oil', 'polenta', 'hominy', 'grits', 'corn flour', 'corn meal', 'corn gluten', 'modified corn starch', 'corn protein'],
  'mustard': ['mustard seed', 'mustard oil', 'mustard flour', 'mustard greens', 'dijon', 'mustard powder', 'yellow mustard', 'brown mustard'],
  'celery': ['celeriac', 'celery salt', 'celery seed', 'celery powder', 'celery root', 'celery juice'],
  'lupin': ['lupin flour', 'lupin seeds', 'lupin beans', 'lupini', 'lupin protein'],
  'sulfites': ['sodium bisulfite', 'sodium metabisulfite', 'sulfur dioxide', 'potassium bisulfite', 'sodium sulfite', 'potassium metabisulfite', 'calcium sulfite'],
  'mollusks': ['snails', 'escargot', 'squid', 'calamari', 'octopus', 'abalone', 'whelk', 'periwinkle', 'conch'],
  'annatto': ['annatto extract', 'annatto seed', 'bixin', 'norbixin', 'e160b'],
  'latex_fruits': ['banana', 'avocado', 'kiwi', 'chestnut', 'papaya', 'mango', 'passion fruit', 'fig', 'pineapple'],
  'nightshades': ['tomato', 'potato', 'bell pepper', 'eggplant', 'paprika', 'cayenne', 'chili pepper', 'goji berries', 'tomatillo', 'pimento', 'hot sauce'],
  'coconut': ['coconut oil', 'coconut milk', 'coconut cream', 'coconut flour', 'copra', 'coconut aminos', 'coconut sugar', 'coconut water', 'desiccated coconut'],
  'legumes': ['lentils', 'chickpeas', 'black beans', 'kidney beans', 'lima beans', 'peas', 'fava beans', 'carob', 'navy beans', 'pinto beans', 'split peas', 'green beans', 'snap peas', 'bean sprouts'],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let totalInserted = 0;
    let totalSkipped = 0;

    // Step 1: Insert all static derivatives
    for (const [allergenId, derivatives] of Object.entries(STATIC_DERIVATIVES)) {
      for (const derivative of derivatives) {
        const { error } = await supabase
          .from('allergen_derivatives_db')
          .upsert({
            allergen_id: allergenId,
            derivative_name: derivative.toLowerCase(),
            source: 'static',
            confidence: 1.0,
          }, { onConflict: 'allergen_id,derivative_name' });

        if (error) {
          totalSkipped++;
        } else {
          totalInserted++;
        }
      }
    }

    // Step 2: Fetch Open Food Facts allergen taxonomy
    let offCount = 0;
    try {
      const offRes = await fetch('https://world.openfoodfacts.org/allergens.json');
      if (offRes.ok) {
        const offData = await offRes.json();
        const tags = offData.tags || [];

        // OFF returns allergen tags with product counts
        // We extract the tag names and map sub-ingredients
        for (const tag of tags) {
          const tagName = (tag.name || '').toLowerCase();
          const tagId = (tag.id || '').replace('en:', '');
          const noraId = normalizeAllergen(tagId) || normalizeAllergen(tagName);

          if (noraId && tagName && tagName !== noraId) {
            const { error } = await supabase
              .from('allergen_derivatives_db')
              .upsert({
                allergen_id: noraId,
                derivative_name: tagName,
                source: 'open_food_facts',
                confidence: 0.9,
              }, { onConflict: 'allergen_id,derivative_name' });

            if (!error) offCount++;
          }
        }
      }
    } catch (e) {
      console.error('Open Food Facts fetch failed:', e);
    }

    // Step 3: Fetch OFF products with known allergens to discover derivative ingredient names
    let offProductCount = 0;
    const allergenQueries = ['peanuts', 'milk', 'eggs', 'soy', 'wheat', 'fish', 'shellfish', 'sesame', 'tree-nuts'];

    for (const allergenQuery of allergenQueries) {
      try {
        const url = `https://world.openfoodfacts.org/allergen/en:${allergenQuery}.json?page_size=20&fields=allergens_tags,ingredients_text`;
        const res = await fetch(url);
        if (!res.ok) continue;

        const data = await res.json();
        const products = data.products || [];

        for (const product of products) {
          const ingredientText = (product.ingredients_text || '').toLowerCase();
          if (!ingredientText) continue;

          // Extract individual ingredient words that could be derivatives
          const noraId = normalizeAllergen(allergenQuery);
          if (!noraId) continue;

          // Check if any known derivatives from this product's ingredients
          // are not already in our static list
          const staticDerivs = new Set((STATIC_DERIVATIVES[noraId] || []).map(d => d.toLowerCase()));
          const allergenTags = product.allergens_tags || [];

          for (const tag of allergenTags) {
            const cleaned = tag.replace(/^en:/, '').replace(/-/g, ' ').toLowerCase();
            if (cleaned && !staticDerivs.has(cleaned) && cleaned !== noraId) {
              const mapped = normalizeAllergen(cleaned);
              if (mapped === noraId) {
                const { error } = await supabase
                  .from('allergen_derivatives_db')
                  .upsert({
                    allergen_id: noraId,
                    derivative_name: cleaned,
                    source: 'open_food_facts_products',
                    confidence: 0.8,
                  }, { onConflict: 'allergen_id,derivative_name' });
                if (!error) offProductCount++;
              }
            }
          }
        }
      } catch (e) {
        console.error(`OFF product fetch for ${allergenQuery} failed:`, e);
      }
    }

    // Get final count
    const { count } = await supabase
      .from('allergen_derivatives_db')
      .select('*', { count: 'exact', head: true });

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          static_inserted: totalInserted,
          static_skipped: totalSkipped,
          off_taxonomy: offCount,
          off_products: offProductCount,
          total_in_db: count,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
