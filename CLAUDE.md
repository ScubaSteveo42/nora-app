# Nora - Safe Dining App

## Project Overview
Nora is an allergen-focused dining app that helps people with food allergies find safe restaurants and menu items. It's a vanilla JavaScript PWA (no framework) backed by Supabase.

## Live Site
- **URL**: https://norarocks.meetjuvra.info
- **Hosted on**: Hostinger VPS at 72.60.166.223 (Nginx + static files)
- **Files on VPS**: `/var/www/norarocks/`

## Tech Stack
- **Frontend**: Vanilla HTML/CSS/JS (no build step)
- **Backend**: Supabase (auth, PostgreSQL database, edge functions)
- **Hosting**: Nginx on Ubuntu 24.04 VPS
- **SSL**: Let's Encrypt via certbot

## Supabase Project
- **Project**: Nora App (org: Nora)
- **URL**: https://ukvvpfntkfiogtuzwgbi.supabase.co
- **Anon Key**: in `js/config.js`

## Database Tables
- `profiles` - user allergen profiles (allergens[], dietary_preferences[], religious_restrictions[])
- `restaurants` - restaurant listings (name, cuisine, address, logo_emoji, verified)
- `menu_items` - menu items with allergen data (allergens[], cross_contamination[], ask_staff, compound_ingredient_ids[])
- `compound_ingredients` - ingredients that contain sub-ingredients (name, sub_ingredients, sub_allergens[], label_image_url, source, verified) - scoped per restaurant

## File Structure
```
index.html          - Landing page (currently redirects to app.html for testing)
app.html            - Main dashboard (search, restaurant detail, AI, profile)
onboarding.html     - 4-step allergen profile setup wizard
css/styles.css      - All styles (dark theme, mobile-first)
js/config.js        - Supabase config, allergen database, derivatives mapping
js/auth.js          - Authentication functions
js/app.js           - Main app logic (restaurants, menus, AI, profile)
sw.js               - Service worker (network-first, cache fallback)
manifest.json       - PWA manifest
```

## Current State
- Auth is bypassed for testing (index.html redirects straight to app.html)
- 3 sample Pittsburgh restaurants with menu items in database
- AI assistant calls a Supabase edge function (not yet deployed)
- Public read RLS policies on restaurants and menu_items tables

## Deployment
Files must be manually transferred to the VPS at `/var/www/norarocks/`. There is no CI/CD pipeline yet. The VPS is managed via Hostinger's web terminal (no SSH key access).

## Key Design Decisions
- Dark theme (#0f172a background, #22c55e green accent)
- Mobile-first responsive design
- Allergen safety scoring: green (safe), yellow (cross-contamination risk), red (contains allergen)
- Material Icons Round for iconography
- Inter font family
