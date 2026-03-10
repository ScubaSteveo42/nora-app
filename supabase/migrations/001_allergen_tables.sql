-- ============================================
-- Nora App - Allergen Database Tables
-- Run this in Supabase SQL Editor
-- ============================================

-- Enhanced allergen derivatives from external databases
CREATE TABLE IF NOT EXISTS allergen_derivatives_db (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    allergen_id text NOT NULL,
    derivative_name text NOT NULL,
    source text NOT NULL DEFAULT 'static',
    confidence real NOT NULL DEFAULT 1.0,
    created_at timestamptz DEFAULT now(),
    UNIQUE(allergen_id, derivative_name)
);

-- Index for fast lookups by allergen
CREATE INDEX IF NOT EXISTS idx_derivatives_allergen ON allergen_derivatives_db(allergen_id);

-- Enable RLS but allow public read (matches existing pattern)
ALTER TABLE allergen_derivatives_db ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read allergen_derivatives_db" ON allergen_derivatives_db
    FOR SELECT USING (true);

-- Ingredient lookup cache (for Phase 3 APIs)
CREATE TABLE IF NOT EXISTS ingredient_cache (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    query_key text UNIQUE NOT NULL,
    source text NOT NULL,
    response_data jsonb,
    allergens text[] DEFAULT '{}',
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ingredient_cache_key ON ingredient_cache(query_key);
CREATE INDEX IF NOT EXISTS idx_ingredient_cache_expires ON ingredient_cache(expires_at);

ALTER TABLE ingredient_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ingredient_cache" ON ingredient_cache
    FOR SELECT USING (true);

-- Recall alerts table (for Phase 2)
CREATE TABLE IF NOT EXISTS recall_alerts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    fda_id text UNIQUE,
    product_description text,
    reason text,
    allergens text[] DEFAULT '{}',
    company text,
    status text,
    recall_date date,
    cached_at timestamptz DEFAULT now(),
    expires_at timestamptz DEFAULT (now() + interval '6 hours')
);

ALTER TABLE recall_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read recall_alerts" ON recall_alerts
    FOR SELECT USING (true);

-- Chain restaurant cache (Spoonacular data)
CREATE TABLE IF NOT EXISTS chain_restaurant_cache (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    chain_name text UNIQUE NOT NULL,
    menu_data jsonb DEFAULT '[]',
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chain_cache_name ON chain_restaurant_cache(chain_name);

ALTER TABLE chain_restaurant_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read chain_restaurant_cache" ON chain_restaurant_cache
    FOR SELECT USING (true);
