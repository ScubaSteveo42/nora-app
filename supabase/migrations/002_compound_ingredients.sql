-- ============================================
-- Nora App - Compound Ingredients Table
-- Run this in Supabase SQL Editor
-- ============================================

-- Compound ingredients: ingredients that contain sub-ingredients
-- (e.g. "Bread" contains flour, yeast, salt, sugar, soybean oil)
-- Scoped per restaurant since recipes differ between restaurants
CREATE TABLE IF NOT EXISTS compound_ingredients (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name text NOT NULL,                         -- e.g. "Bread", "House Pickles", "Soy Sauce"
    sub_ingredients text,                       -- free-text sub-ingredient list
    sub_allergens text[] DEFAULT '{}',          -- pre-computed allergens found in sub_ingredients
    label_image_url text,                       -- future: URL to uploaded package label photo
    label_ocr_text text,                        -- future: OCR-extracted text from label photo
    source text NOT NULL DEFAULT 'unknown'
        CHECK (source IN ('manual', 'label_photo', 'unknown')),
    verified boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (restaurant_id, lower(name))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compound_ingredients_restaurant
    ON compound_ingredients(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_compound_ingredients_name
    ON compound_ingredients(lower(name));

-- RLS: public read (matches existing pattern)
ALTER TABLE compound_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read compound_ingredients" ON compound_ingredients
    FOR SELECT USING (true);

-- Optional explicit linkage column on menu_items
-- Falls back to name-matching when empty
ALTER TABLE menu_items
    ADD COLUMN IF NOT EXISTS compound_ingredient_ids uuid[] DEFAULT '{}';
