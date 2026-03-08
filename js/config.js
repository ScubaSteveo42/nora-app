// ============================================
// Nora App - Configuration
// ============================================

const SUPABASE_URL = 'https://ukvvpfntkfiogtuzwgbi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrdnZwZm50a2Zpb2d0dXp3Z2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTgyMzcsImV4cCI6MjA4ODU3NDIzN30.ldwSvZreaFXSPZscdzjpdzYr82oREJ1Xp9ce5XgFNB4';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Allergen Database
const ALLERGENS = {
    common: [
        { id: 'peanuts', label: 'Peanuts', icon: '🥜' },
        { id: 'tree_nuts', label: 'Tree Nuts', icon: '🌰' },
        { id: 'milk', label: 'Milk / Dairy', icon: '🥛' },
        { id: 'eggs', label: 'Eggs', icon: '🥚' },
        { id: 'wheat', label: 'Wheat', icon: '🌾' },
        { id: 'soy', label: 'Soy', icon: '🫘' },
        { id: 'fish', label: 'Fish', icon: '🐟' },
        { id: 'shellfish', label: 'Shellfish', icon: '🦐' },
        { id: 'sesame', label: 'Sesame', icon: '🫓' },
        { id: 'gluten', label: 'Gluten', icon: '🍞' },
    ],
    additional: [
        { id: 'corn', label: 'Corn', icon: '🌽' },
        { id: 'mustard', label: 'Mustard', icon: '🟡' },
        { id: 'celery', label: 'Celery', icon: '🥬' },
        { id: 'lupin', label: 'Lupin', icon: '🌸' },
        { id: 'sulfites', label: 'Sulfites', icon: '🍷' },
        { id: 'mollusks', label: 'Mollusks', icon: '🐚' },
        { id: 'turmeric', label: 'Turmeric', icon: '🟠' },
        { id: 'annatto', label: 'Annatto', icon: '🔶' },
        { id: 'latex_fruits', label: 'Latex Fruits', icon: '🍌' },
        { id: 'nightshades', label: 'Nightshades', icon: '🍅' },
        { id: 'coconut', label: 'Coconut', icon: '🥥' },
        { id: 'legumes', label: 'Legumes', icon: '🫛' },
    ],
    dietary: [
        { id: 'vegan', label: 'Vegan', icon: '🌱' },
        { id: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
        { id: 'keto', label: 'Keto', icon: '🥑' },
        { id: 'paleo', label: 'Paleo', icon: '🍖' },
        { id: 'low_fodmap', label: 'Low FODMAP', icon: '🫁' },
        { id: 'diabetic', label: 'Diabetic', icon: '💉' },
    ],
    religious: [
        { id: 'kosher', label: 'Kosher', icon: '✡️' },
        { id: 'halal', label: 'Halal', icon: '☪️' },
        { id: 'no_meat_friday', label: 'No Meat Fridays', icon: '🐟' },
        { id: 'no_pork', label: 'No Pork', icon: '🚫' },
    ]
};

// Allergen derivatives mapping (AI-enhanced)
const ALLERGEN_DERIVATIVES = {
    'turmeric': ['curcumin', 'annatto', 'curcuminoids'],
    'peanuts': ['arachis oil', 'groundnut', 'monkey nuts', 'earth nuts'],
    'milk': ['casein', 'whey', 'lactose', 'lactalbumin', 'ghee'],
    'eggs': ['albumin', 'lysozyme', 'meringue', 'mayonnaise', 'lecithin'],
    'wheat': ['semolina', 'spelt', 'durum', 'farina', 'kamut', 'couscous'],
    'soy': ['edamame', 'miso', 'tempeh', 'tofu', 'soya'],
    'tree_nuts': ['almonds', 'cashews', 'walnuts', 'pecans', 'pistachios', 'macadamia', 'brazil nuts', 'hazelnuts'],
    'shellfish': ['crab', 'lobster', 'shrimp', 'prawns', 'crayfish', 'scallops'],
    'sesame': ['tahini', 'halvah', 'hummus'],
    'gluten': ['barley', 'rye', 'oats', 'triticale', 'malt'],
};

// Toast utility
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
