import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/allergen-map.ts";

// ============================================
// Food Recall Alerts Edge Function
// Queries openFDA for food recalls with undeclared allergens
// Filters by user's allergen profile
// ============================================

const FDA_API_BASE = 'https://api.fda.gov/food/enforcement.json';

// Map FDA reason text patterns to Nora allergen IDs
const FDA_ALLERGEN_PATTERNS: Record<string, string[]> = {
  'peanuts': ['peanut', 'peanuts', 'arachis'],
  'tree_nuts': ['tree nut', 'almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut', 'macadamia', 'brazil nut', 'pine nut'],
  'milk': ['milk', 'dairy', 'casein', 'whey', 'lactose', 'butter', 'cream', 'cheese'],
  'eggs': ['egg', 'eggs', 'albumin'],
  'wheat': ['wheat', 'gluten'],
  'soy': ['soy', 'soybean', 'soya'],
  'fish': ['fish', 'anchovy', 'anchovies', 'cod', 'salmon', 'tuna'],
  'shellfish': ['shellfish', 'shrimp', 'crab', 'lobster', 'prawn'],
  'sesame': ['sesame'],
  'gluten': ['gluten', 'wheat', 'barley', 'rye'],
  'sulfites': ['sulfite', 'sulphite', 'sulfur dioxide'],
  'mustard': ['mustard'],
};

function detectAllergens(reasonText: string): string[] {
  const lower = reasonText.toLowerCase();
  const found = new Set<string>();

  for (const [allergenId, patterns] of Object.entries(FDA_ALLERGEN_PATTERNS)) {
    for (const pattern of patterns) {
      if (lower.includes(pattern)) {
        found.add(allergenId);
        break;
      }
    }
  }

  return [...found];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userAllergens } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache first — only refresh if expired
    const { data: cached } = await supabase
      .from('recall_alerts')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .limit(1);

    let alerts;

    if (cached && cached.length > 0) {
      // Use cached data
      const { data } = await supabase
        .from('recall_alerts')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('recall_date', { ascending: false });
      alerts = data || [];
    } else {
      // Fetch fresh from FDA
      alerts = await fetchAndCacheAlerts(supabase);
    }

    // Filter to user's allergens if provided
    if (userAllergens && userAllergens.length > 0) {
      const userSet = new Set(userAllergens);
      alerts = alerts.filter((a: any) =>
        a.allergens.some((allergen: string) => userSet.has(allergen))
      );
    }

    return new Response(
      JSON.stringify({ alerts: alerts.slice(0, 10) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ alerts: [], error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});

async function fetchAndCacheAlerts(supabase: any) {
  const searchQuery = 'reason_for_recall:"undeclared"+AND+status:"Ongoing"';
  const url = `${FDA_API_BASE}?search=${searchQuery}&limit=50&sort=recall_initiation_date:desc`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  const results = data.results || [];

  // Clear old cached alerts
  await supabase
    .from('recall_alerts')
    .delete()
    .lt('expires_at', new Date().toISOString());

  const alerts = [];
  for (const result of results) {
    const reason = result.reason_for_recall || '';
    const allergens = detectAllergens(reason);
    if (!allergens.length) continue;

    const alert = {
      fda_id: result.recall_number || `fda-${Date.now()}-${Math.random()}`,
      product_description: (result.product_description || '').slice(0, 500),
      reason: reason.slice(0, 500),
      allergens,
      company: (result.recalling_firm || '').slice(0, 200),
      status: result.status || 'Ongoing',
      recall_date: result.recall_initiation_date || null,
    };

    // Upsert into cache
    await supabase
      .from('recall_alerts')
      .upsert(alert, { onConflict: 'fda_id' });

    alerts.push(alert);
  }

  return alerts;
}
