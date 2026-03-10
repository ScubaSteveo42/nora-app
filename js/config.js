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
    'peanuts': ['arachis oil', 'groundnut', 'monkey nuts', 'earth nuts', 'beer nuts', 'peanut flour'],
    'milk': ['casein', 'whey', 'lactose', 'lactalbumin', 'ghee', 'curds', 'cream', 'butter', 'cheese', 'yogurt', 'kefir'],
    'eggs': ['albumin', 'lysozyme', 'meringue', 'mayonnaise', 'lecithin', 'globulin', 'ovalbumin', 'egg wash'],
    'wheat': ['semolina', 'spelt', 'durum', 'farina', 'kamut', 'couscous', 'bulgur', 'seitan', 'einkorn', 'freekeh'],
    'soy': ['edamame', 'miso', 'tempeh', 'tofu', 'soya', 'soy lecithin', 'soy sauce', 'tamari', 'textured vegetable protein'],
    'tree_nuts': ['almonds', 'cashews', 'walnuts', 'pecans', 'pistachios', 'macadamia', 'brazil nuts', 'hazelnuts', 'pine nuts', 'praline', 'marzipan', 'nougat'],
    'shellfish': ['crab', 'lobster', 'shrimp', 'prawns', 'crayfish', 'scallops', 'clams', 'mussels', 'oysters'],
    'sesame': ['tahini', 'halvah', 'hummus', 'sesame oil', 'gomashio', 'benne seeds'],
    'gluten': ['barley', 'rye', 'oats', 'triticale', 'malt', 'brewer\'s yeast', 'seitan', 'modified food starch'],
    'fish': ['anchovies', 'fish sauce', 'fish oil', 'omega-3', 'surimi', 'Worcestershire sauce', 'caesar dressing', 'bouillabaisse'],
    'corn': ['cornstarch', 'corn syrup', 'dextrose', 'maltodextrin', 'high fructose corn syrup', 'corn oil', 'polenta', 'hominy', 'grits'],
    'mustard': ['mustard seed', 'mustard oil', 'mustard flour', 'mustard greens', 'Dijon'],
    'celery': ['celeriac', 'celery salt', 'celery seed', 'celery powder'],
    'lupin': ['lupin flour', 'lupin seeds', 'lupin beans', 'lupini'],
    'sulfites': ['sodium bisulfite', 'sodium metabisulfite', 'sulfur dioxide', 'potassium bisulfite', 'sodium sulfite'],
    'mollusks': ['snails', 'escargot', 'squid', 'calamari', 'octopus', 'abalone'],
    'annatto': ['annatto extract', 'annatto seed', 'bixin', 'norbixin', 'E160b'],
    'latex_fruits': ['banana', 'avocado', 'kiwi', 'chestnut', 'papaya', 'mango', 'passion fruit'],
    'nightshades': ['tomato', 'potato', 'bell pepper', 'eggplant', 'paprika', 'cayenne', 'chili pepper', 'goji berries'],
    'coconut': ['coconut oil', 'coconut milk', 'coconut cream', 'coconut flour', 'copra', 'coconut aminos'],
    'legumes': ['lentils', 'chickpeas', 'black beans', 'kidney beans', 'lima beans', 'peas', 'fava beans', 'carob'],
};

// Enhanced derivatives from database (loaded async, supplements static list)
let ENHANCED_DERIVATIVES = {};
let derivativesLoaded = false;

// Load enhanced derivatives from Supabase DB
async function loadEnhancedDerivatives() {
    try {
        const { data, error } = await supabaseClient
            .from('allergen_derivatives_db')
            .select('allergen_id, derivative_name');

        if (error) throw error;
        if (!data || !data.length) return;

        const enhanced = {};
        data.forEach(row => {
            if (!enhanced[row.allergen_id]) enhanced[row.allergen_id] = [];
            enhanced[row.allergen_id].push(row.derivative_name);
        });
        ENHANCED_DERIVATIVES = enhanced;
        derivativesLoaded = true;
        console.log(`Loaded ${data.length} enhanced derivatives from DB`);
    } catch (err) {
        console.log('Enhanced derivatives not available, using static list');
    }
}

// Get all derivatives for an allergen (static + DB-enhanced, deduplicated)
function getAllDerivatives(allergenId) {
    const staticDerivs = ALLERGEN_DERIVATIVES[allergenId] || [];
    const dbDerivs = ENHANCED_DERIVATIVES[allergenId] || [];

    if (!dbDerivs.length) return staticDerivs;

    // Merge and deduplicate (case-insensitive)
    const seen = new Set(staticDerivs.map(d => d.toLowerCase()));
    const merged = [...staticDerivs];
    for (const d of dbDerivs) {
        if (!seen.has(d.toLowerCase())) {
            seen.add(d.toLowerCase());
            merged.push(d);
        }
    }
    return merged;
}

// Toast utility
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
