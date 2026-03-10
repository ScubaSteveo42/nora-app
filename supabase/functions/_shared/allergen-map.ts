// ============================================
// Shared: Normalize external allergen IDs → Nora IDs
// ============================================

// Maps external database allergen names/tags to our internal IDs
const EXTERNAL_TO_NORA: Record<string, string> = {
  // Open Food Facts tags (en:allergen-name format, we strip the prefix)
  'gluten': 'gluten',
  'wheat': 'wheat',
  'milk': 'milk',
  'dairy': 'milk',
  'lactose': 'milk',
  'eggs': 'eggs',
  'egg': 'eggs',
  'peanuts': 'peanuts',
  'peanut': 'peanuts',
  'soybeans': 'soy',
  'soy': 'soy',
  'soya': 'soy',
  'nuts': 'tree_nuts',
  'tree nuts': 'tree_nuts',
  'tree-nuts': 'tree_nuts',
  'almonds': 'tree_nuts',
  'cashews': 'tree_nuts',
  'walnuts': 'tree_nuts',
  'hazelnuts': 'tree_nuts',
  'pecans': 'tree_nuts',
  'pistachios': 'tree_nuts',
  'macadamia': 'tree_nuts',
  'brazil nuts': 'tree_nuts',
  'pine nuts': 'tree_nuts',
  'fish': 'fish',
  'shellfish': 'shellfish',
  'crustaceans': 'shellfish',
  'molluscs': 'mollusks',
  'mollusks': 'mollusks',
  'sesame': 'sesame',
  'sesame seeds': 'sesame',
  'celery': 'celery',
  'mustard': 'mustard',
  'lupin': 'lupin',
  'lupine': 'lupin',
  'sulphur dioxide': 'sulfites',
  'sulphites': 'sulfites',
  'sulfites': 'sulfites',
  'sulphur-dioxide': 'sulfites',
  'corn': 'corn',
  'maize': 'corn',
  'coconut': 'coconut',
};

// Normalize an external allergen string to a Nora allergen ID
export function normalizeAllergen(external: string): string | null {
  const cleaned = external
    .toLowerCase()
    .replace(/^en:/, '')
    .replace(/^fr:/, '')
    .replace(/-/g, ' ')
    .trim();

  return EXTERNAL_TO_NORA[cleaned] || null;
}

// Extract Nora allergen IDs from an array of external tags
export function normalizeAllergenList(externals: string[]): string[] {
  const result = new Set<string>();
  for (const ext of externals) {
    const normed = normalizeAllergen(ext);
    if (normed) result.add(normed);
  }
  return [...result];
}

// CORS headers shared across all edge functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
