-- ============================================
-- Nora App - Seed Compound Ingredients
-- Run this in Supabase SQL Editor AFTER 002_compound_ingredients.sql
-- Inserts sample compound ingredients for existing restaurants
-- ============================================

-- Insert compound ingredients for all restaurants
-- These are common ingredients that may contain hidden allergens
-- Using a CTE to get restaurant IDs dynamically

-- For each restaurant, add common compound ingredients
-- (In reality, each restaurant would have their own specific versions)
INSERT INTO compound_ingredients (restaurant_id, name, sub_ingredients, sub_allergens, source, verified)
SELECT r.id, ci.name, ci.sub_ingredients, ci.sub_allergens::text[], ci.source, ci.verified
FROM restaurants r
CROSS JOIN (VALUES
    ('Bread', 'enriched flour (wheat), water, yeast, sugar, salt, soybean oil', ARRAY['wheat', 'soy'], 'manual', true),
    ('Tortilla', 'wheat flour, water, vegetable shortening (soybean oil), salt, baking powder', ARRAY['wheat', 'soy'], 'manual', true),
    ('Soy Sauce', 'water, soybeans, wheat, salt', ARRAY['soy', 'wheat'], 'manual', true),
    ('House Pickles', 'cucumbers, water, distilled vinegar, mustard seed, dill, garlic, salt', ARRAY['mustard'], 'manual', true),
    ('Mayonnaise', 'soybean oil, eggs, vinegar, water, salt, sugar, lemon juice', ARRAY['eggs', 'soy'], 'manual', true),
    ('Pasta', 'durum wheat semolina, water, eggs', ARRAY['wheat', 'eggs'], 'manual', true),
    ('Teriyaki Sauce', 'soy sauce (water, soybeans, wheat, salt), sugar, rice wine, garlic, ginger', ARRAY['soy', 'wheat'], 'manual', true),
    ('Tempura Batter', 'wheat flour, cornstarch, baking powder, water, egg', ARRAY['wheat', 'eggs'], 'manual', true)
) AS ci(name, sub_ingredients, sub_allergens, source, verified)
ON CONFLICT (restaurant_id, lower(name)) DO NOTHING;

-- Also add some without sub-ingredients (to demonstrate "ask staff" state)
INSERT INTO compound_ingredients (restaurant_id, name, source)
SELECT r.id, ci.name, 'unknown'
FROM restaurants r
CROSS JOIN (VALUES
    ('House Salad Dressing'),
    ('Special Sauce')
) AS ci(name)
ON CONFLICT (restaurant_id, lower(name)) DO NOTHING;
