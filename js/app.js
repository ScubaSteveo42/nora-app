// ============================================
// Nora App - Main Application Logic
// ============================================

let userProfile = null;
let currentUser = null;
let restaurants = [];
let currentMenuItems = []; // Store categorized menu items for detail view

// ---- Navigation ----
function showSection(sectionId) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${sectionId}`).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll(`.nav-item[data-section="${sectionId}"]`).forEach(btn => btn.classList.add('active'));

    if (sectionId === 'profile') renderProfile();
    if (sectionId === 'search') document.getElementById('restaurant-search')?.focus();
}

// ---- Initialize ----
document.addEventListener('DOMContentLoaded', async () => {
    // Try to get session but don't require it for testing
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            currentUser = session.user;
        }
    } catch (e) {
        console.log('Auth skipped for testing');
    }

    // Always try to load profile (DB or localStorage)
    await loadProfile();

    // Load restaurants regardless of auth
    await loadRestaurants();
});

// ---- Profile ----
async function loadProfile() {
    // Try DB first if logged in
    if (currentUser) {
        try {
            const { data, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('user_id', currentUser.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            if (data) { userProfile = data; return; }
        } catch (err) {
            console.error('Error loading profile from DB:', err);
        }
    }

    // Fall back to localStorage
    const local = localStorage.getItem('nora_profile');
    if (local) {
        try {
            userProfile = JSON.parse(local);
        } catch(e) {}
    }
}

function renderProfile() {
    const container = document.getElementById('profile-content');
    if (!userProfile) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="material-icons-round">person_off</span>
                <h3>No profile yet</h3>
                <p>Set up your allergen profile to get started.</p>
                <button class="btn btn-primary" style="margin-top:16px" onclick="window.location.href='/onboarding.html'">
                    Set Up Profile
                </button>
            </div>
        `;
        return;
    }

    const allergenLabels = getAllergenLabels(userProfile.allergens || []);
    const dietaryLabels = getDietaryLabels(userProfile.dietary_preferences || []);
    const religiousLabels = getReligiousLabels(userProfile.religious_restrictions || []);

    const userName = currentUser?.user_metadata?.full_name || 'Guest User';
    const userEmail = currentUser?.email || 'Profile saved locally';

    container.innerHTML = `
        <div class="card">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
                <div style="width:48px;height:48px;background:var(--accent-soft);border-radius:50%;display:flex;align-items:center;justify-content:center">
                    <span class="material-icons-round" style="color:var(--accent)">person</span>
                </div>
                <div>
                    <div style="font-weight:600">${userName}</div>
                    <div style="font-size:13px;color:var(--text-secondary)">${userEmail}</div>
                </div>
            </div>
        </div>

        ${allergenLabels.length ? `
        <div class="profile-section">
            <div class="profile-section-title">My Allergens</div>
            <div class="profile-allergen-tags">
                ${allergenLabels.map(a => `
                    <div class="profile-tag">
                        <span class="chip-icon">${a.icon}</span>
                        ${a.label}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${dietaryLabels.length ? `
        <div class="profile-section">
            <div class="profile-section-title">Dietary Preferences</div>
            <div class="profile-allergen-tags">
                ${dietaryLabels.map(a => `
                    <div class="profile-tag">
                        <span class="chip-icon">${a.icon}</span>
                        ${a.label}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${religiousLabels.length ? `
        <div class="profile-section">
            <div class="profile-section-title">Religious Restrictions</div>
            <div class="profile-allergen-tags">
                ${religiousLabels.map(a => `
                    <div class="profile-tag">
                        <span class="chip-icon">${a.icon}</span>
                        ${a.label}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <div class="profile-section">
            <div class="profile-section-title">Allergen Derivatives</div>
            <div class="card" style="font-size:13px;color:var(--text-secondary)">
                <p style="margin-bottom:8px">Based on your allergens, Nora also watches for:</p>
                ${getDerivativesHTML(userProfile.allergens || [])}
            </div>
        </div>
    `;
}

function getAllergenLabels(ids) {
    const all = [...ALLERGENS.common, ...ALLERGENS.additional];
    return ids.map(id => all.find(a => a.id === id)).filter(Boolean);
}

function getDietaryLabels(ids) {
    return ids.map(id => ALLERGENS.dietary.find(a => a.id === id)).filter(Boolean);
}

function getReligiousLabels(ids) {
    return ids.map(id => ALLERGENS.religious.find(a => a.id === id)).filter(Boolean);
}

function getDerivativesHTML(allergenIds) {
    const derivatives = [];
    allergenIds.forEach(id => {
        if (ALLERGEN_DERIVATIVES[id]) {
            derivatives.push(`<strong>${id.replace('_', ' ')}:</strong> ${ALLERGEN_DERIVATIVES[id].join(', ')}`);
        }
    });
    if (!derivatives.length) return '<p>No known derivatives for your allergens.</p>';
    return derivatives.map(d => `<p style="margin-bottom:4px">• ${d}</p>`).join('');
}

// ---- Restaurants ----
async function loadRestaurants() {
    const container = document.getElementById('restaurant-list');

    try {
        const { data, error } = await supabaseClient
            .from('restaurants')
            .select('*, menu_items(*)')
            .order('name');

        if (error) throw error;

        restaurants = data || [];
        renderRestaurants(restaurants);
    } catch (err) {
        console.error('Error loading restaurants:', err);
        container.innerHTML = `
            <div class="empty-state">
                <span class="material-icons-round">restaurant</span>
                <h3>No restaurants yet</h3>
                <p>Restaurants will appear here as they join Nora. Try asking the AI assistant for recommendations!</p>
            </div>
        `;
    }
}

function renderRestaurants(list) {
    const container = document.getElementById('restaurant-list');

    if (!list.length) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="material-icons-round">search_off</span>
                <h3>No results</h3>
                <p>Try a different search or ask the AI for help.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = list.map(r => {
        const safePercent = calculateSafetyScore(r);
        return `
            <div class="card card-clickable" onclick="viewRestaurant('${r.id}')">
                <div class="restaurant-card">
                    <div class="restaurant-logo">${r.logo_emoji || '🍽️'}</div>
                    <div class="restaurant-info">
                        <div class="restaurant-name">${escapeHTML(r.name)}</div>
                        <div class="restaurant-cuisine">${escapeHTML(r.cuisine || '')}${r.price_range ? ' · ' + escapeHTML(r.price_range) : ''}${r.rating ? ' · ⭐ ' + r.rating : ''}</div>
                        <div class="restaurant-meta">
                            <span class="meta-tag tag-safe">
                                <span class="material-icons-round">verified</span>
                                ${safePercent}% safe
                            </span>
                            ${r.verified ? '<span class="meta-tag tag-safe"><span class="material-icons-round">check_circle</span>Verified</span>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function searchRestaurants(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
        renderRestaurants(restaurants);
        return;
    }
    const filtered = restaurants.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.cuisine || '').toLowerCase().includes(q)
    );
    renderRestaurants(filtered);
}

function calculateSafetyScore(restaurant) {
    if (!userProfile || !restaurant.menu_items) return 0;
    const userAllergens = new Set(userProfile.allergens || []);
    const items = restaurant.menu_items || [];
    if (!items.length) return 0;

    let safeCount = 0;
    items.forEach(item => {
        const itemAllergens = new Set(item.allergens || []);
        const hasConflict = [...userAllergens].some(a => itemAllergens.has(a));
        if (!hasConflict) safeCount++;
    });

    return Math.round((safeCount / items.length) * 100);
}

// ---- Restaurant Detail ----
async function viewRestaurant(id) {
    showSection('restaurant');
    const container = document.getElementById('restaurant-detail');
    container.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';

    try {
        const { data: restaurant, error } = await supabaseClient
            .from('restaurants')
            .select('*, menu_items(*)')
            .eq('id', id)
            .single();

        if (error) throw error;

        const safePercent = calculateSafetyScore(restaurant);
        const menuItems = restaurant.menu_items || [];
        const userAllergens = new Set(userProfile?.allergens || []);

        // Categorize menu items with severity awareness
        const allergenSeverity = userProfile?.allergen_severity || {};
        const categorized = menuItems.map(item => {
            const itemAllergens = new Set(item.allergens || []);
            const conflicts = [...userAllergens].filter(a => itemAllergens.has(a));
            const possibleCross = item.cross_contamination || [];
            const crossConflicts = possibleCross.filter(a => userAllergens.has(a));

            let status = 'safe';
            let statusLabel = 'Safe';
            let statusIcon = 'check_circle';
            if (conflicts.length > 0) {
                // Check max severity among conflicting allergens
                const maxSev = conflicts.reduce((max, a) => {
                    const s = allergenSeverity[a] || 'moderate';
                    if (s === 'severe') return 'severe';
                    if (s === 'moderate' && max !== 'severe') return 'moderate';
                    return max;
                }, 'mild');

                status = 'unsafe';
                if (maxSev === 'severe') {
                    statusLabel = 'SEVERE';
                    statusIcon = 'emergency';
                } else if (maxSev === 'mild') {
                    statusLabel = 'Mild allergen';
                    statusIcon = 'info';
                } else {
                    statusLabel = 'Contains allergen';
                    statusIcon = 'dangerous';
                }
            } else if (crossConflicts.length > 0) {
                status = 'caution';
                statusLabel = 'Cross-contamination';
                statusIcon = 'warning';
            } else if (item.ask_staff) {
                status = 'ask';
                statusLabel = 'Ask staff';
                statusIcon = 'help';
            }

            return { ...item, status, statusLabel, statusIcon, conflicts, crossConflicts };
        });

        // Store for detail modal
        currentMenuItems = categorized;

        // Build hours display
        const hoursHTML = restaurant.hours ? buildHoursHTML(restaurant.hours) : '';

        // Group menu items by category
        const categories = {};
        categorized.forEach(item => {
            const cat = item.category || 'Other';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(item);
        });
        const categoryOrder = ['Appetizers', 'Sandwiches', 'Sushi', 'Entrees', 'Sides', 'Desserts', 'Other'];
        const sortedCategories = Object.keys(categories).sort((a, b) => {
            const ai = categoryOrder.indexOf(a);
            const bi = categoryOrder.indexOf(b);
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });

        container.innerHTML = `
            <div class="restaurant-detail-header">
                <div style="font-size:48px;margin-bottom:8px">${restaurant.logo_emoji || '🍽️'}</div>
                <h2>${escapeHTML(restaurant.name)}</h2>
                <p class="cuisine">${escapeHTML(restaurant.cuisine || '')}${restaurant.price_range ? ' · ' + escapeHTML(restaurant.price_range) : ''}${restaurant.rating ? ' · ⭐ ' + restaurant.rating : ''}</p>
                <div class="safety-score">
                    <span class="material-icons-round">shield</span>
                    ${safePercent}% of menu is safe for you
                </div>
            </div>

            ${(restaurant.address || restaurant.phone || restaurant.website || hoursHTML) ? `
            <div class="card restaurant-info-card">
                ${restaurant.address ? `
                <div class="info-row">
                    <span class="material-icons-round">location_on</span>
                    <span>${escapeHTML(restaurant.address)}</span>
                </div>` : ''}
                ${restaurant.phone ? `
                <div class="info-row">
                    <span class="material-icons-round">phone</span>
                    <a href="tel:${restaurant.phone}" style="color:var(--accent)">${escapeHTML(restaurant.phone)}</a>
                </div>` : ''}
                ${restaurant.website ? `
                <div class="info-row">
                    <span class="material-icons-round">language</span>
                    <a href="${restaurant.website}" target="_blank" rel="noopener" style="color:var(--accent)">Visit website</a>
                </div>` : ''}
                ${hoursHTML ? `
                <div class="info-row info-row-hours">
                    <span class="material-icons-round">schedule</span>
                    <div class="hours-grid">${hoursHTML}</div>
                </div>` : ''}
            </div>
            ` : ''}

            <div class="menu-filters">
                <button class="filter-chip active" onclick="filterMenu('all', this)">All</button>
                <button class="filter-chip" onclick="filterMenu('safe', this)">Safe</button>
                <button class="filter-chip" onclick="filterMenu('caution', this)">Caution</button>
                <button class="filter-chip" onclick="filterMenu('unsafe', this)">Contains Allergen</button>
            </div>

            <div id="menu-items-list">
                ${categorized.length ? sortedCategories.map(cat => `
                    <div class="menu-category-header">${escapeHTML(cat)}</div>
                    <div class="card menu-category-card">
                        ${categories[cat].map(item => `
                            <div class="menu-item-wrapper" data-status="${item.status}">
                                <div class="menu-item menu-item-clickable" onclick="toggleItemDropdown('${item.id}')">
                                    <div class="menu-item-info">
                                        <div class="menu-item-name">${escapeHTML(item.name)}</div>
                                        <div class="menu-item-desc">${escapeHTML(item.description || '')}</div>
                                        ${item.price ? `<div class="menu-item-price">$${item.price}</div>` : ''}
                                    </div>
                                    <div class="menu-item-status">
                                        <div class="status-badge badge-${item.status}">
                                            <span class="material-icons-round">${item.statusIcon}</span>
                                            ${item.statusLabel}
                                        </div>
                                        <span class="material-icons-round dropdown-chevron" id="chevron-${item.id}">expand_more</span>
                                    </div>
                                </div>
                                <div class="menu-item-dropdown" id="dropdown-${item.id}">
                                    ${buildDropdownContent(item)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `).join('') : '<div class="empty-state"><p>No menu items available yet.</p></div>'}
            </div>

            <div class="card" style="margin-top:12px;font-size:13px;color:var(--text-secondary)">
                <p><span class="material-icons-round" style="font-size:14px;vertical-align:middle">info</span>
                All allergen information is provided by restaurant owners or their published allergen menus.
                We encourage you to double-check with restaurant staff before ordering.</p>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="material-icons-round">error</span>
                <h3>Couldn't load restaurant</h3>
                <p>${err.message}</p>
            </div>
        `;
    }
}

function filterMenu(status, btn) {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('#menu-items-list .menu-item-wrapper').forEach(item => {
        if (status === 'all' || item.dataset.status === status) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

// ---- AI Assistant ----
async function askNora() {
    const input = document.getElementById('ai-quick-input');
    const query = input.value.trim();
    if (!query) return;

    showSection('ai');
    document.getElementById('ai-full-input').value = query;
    input.value = '';
    await processAIQuery(query);
}

async function askNoraFull() {
    const input = document.getElementById('ai-full-input');
    const query = input.value.trim();
    if (!query) return;
    input.value = '';
    await processAIQuery(query);
}

async function processAIQuery(query) {
    const container = document.getElementById('ai-responses');

    // Add user message
    container.insertAdjacentHTML('afterbegin', `
        <div class="card" style="margin-bottom:12px">
            <div style="display:flex;align-items:flex-start;gap:12px">
                <span class="material-icons-round" style="color:var(--text-muted)">person</span>
                <div>${escapeHTML(query)}</div>
            </div>
        </div>
    `);

    // Add loading response
    const loadingId = 'ai-loading-' + Date.now();
    container.insertAdjacentHTML('afterbegin', `
        <div class="card" id="${loadingId}" style="margin-bottom:12px">
            <div style="display:flex;align-items:flex-start;gap:12px">
                <span class="material-icons-round" style="color:var(--accent)">auto_awesome</span>
                <div><div class="spinner"></div></div>
            </div>
        </div>
    `);

    try {
        // Build context with user's allergen profile
        const allergenContext = userProfile?.allergens?.length
            ? `User allergens: ${userProfile.allergens.join(', ')}. `
            : '';
        const dietaryContext = userProfile?.dietary_preferences?.length
            ? `Dietary preferences: ${userProfile.dietary_preferences.join(', ')}. `
            : '';

        const { data, error } = await supabaseClient.functions.invoke('ai-assistant', {
            body: {
                query,
                context: allergenContext + dietaryContext,
                allergens: userProfile?.allergens || [],
                dietary: userProfile?.dietary_preferences || []
            }
        });

        if (error) throw error;

        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) {
            loadingEl.querySelector('div > div').innerHTML = data.response || 'I couldn\'t process that. Try rephrasing your question.';
        }
    } catch (err) {
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) {
            loadingEl.querySelector('div > div').innerHTML = `
                <span style="color:var(--text-secondary)">AI features require setup. You can still search restaurants and view menus!</span>
            `;
        }
    }
}

// ---- Inline Dropdown Explanations ----
function toggleItemDropdown(itemId) {
    const dropdown = document.getElementById('dropdown-' + itemId);
    const chevron = document.getElementById('chevron-' + itemId);
    if (!dropdown) return;

    const isOpen = dropdown.classList.contains('open');

    // Close all other open dropdowns
    document.querySelectorAll('.menu-item-dropdown.open').forEach(d => {
        d.classList.remove('open');
        d.style.maxHeight = null;
    });
    document.querySelectorAll('.dropdown-chevron.rotated').forEach(c => {
        c.classList.remove('rotated');
    });

    if (!isOpen) {
        dropdown.classList.add('open');
        dropdown.style.maxHeight = dropdown.scrollHeight + 'px';
        if (chevron) chevron.classList.add('rotated');
    }
}

function buildDropdownContent(item) {
    const allAllergenDefs = [...ALLERGENS.common, ...ALLERGENS.additional];
    const severity = userProfile?.allergen_severity || {};
    let html = '';

    if (item.status === 'safe') {
        const userAllergenNames = (userProfile?.allergens || []).map(id => {
            const def = allAllergenDefs.find(d => d.id === id);
            return def ? def.label : id;
        });
        html += `<div class="dropdown-safe">
            <span class="material-icons-round">verified_user</span>
            <div>
                <strong>Safe for you</strong>
                <p>${userAllergenNames.length ? 'This dish does not contain ' + userAllergenNames.join(', ') + '.' : 'No allergen conflicts detected.'}</p>
            </div>
        </div>`;
    } else if (item.status === 'unsafe') {
        html += `<div class="dropdown-section-label"><span class="material-icons-round">warning</span> Allergen Warnings</div>`;
        html += item.conflicts.map(a => {
            const sev = severity[a] || 'moderate';
            const def = allAllergenDefs.find(d => d.id === a);
            const icon = def ? def.icon : '';
            const label = def ? def.label : a;
            const sevLabel = sev === 'severe' ? 'Severe / Life-threatening'
                : sev === 'moderate' ? 'Moderate reaction'
                : 'Mild / Intolerance';
            return `<div class="dropdown-allergen dropdown-allergen-${sev}">
                <span class="dropdown-allergen-icon">${icon}</span>
                <div class="dropdown-allergen-info">
                    <strong>Contains ${label}</strong>
                    <span>${sevLabel}</span>
                </div>
            </div>`;
        }).join('');
    } else if (item.status === 'caution') {
        const crossNames = item.crossConflicts.map(a => {
            const def = allAllergenDefs.find(d => d.id === a);
            return def ? def.label : a;
        });
        html += `<div class="dropdown-caution">
            <span class="material-icons-round">sync_problem</span>
            <div>
                <strong>Cross-contamination risk</strong>
                <p>May contain traces of ${crossNames.join(', ')} due to shared kitchen equipment or preparation area.</p>
            </div>
        </div>`;
    } else if (item.status === 'ask') {
        html += `<div class="dropdown-ask">
            <span class="material-icons-round">record_voice_over</span>
            <div>
                <strong>Ask your server:</strong>
                <p class="dropdown-question">${generateStaffQuestion(item)}</p>
            </div>
        </div>`;
    }

    // Cross-contamination note for unsafe items that ALSO have cross-contamination
    if (item.status === 'unsafe' && item.crossConflicts.length) {
        const crossNames = item.crossConflicts.map(a => {
            const def = allAllergenDefs.find(d => d.id === a);
            return def ? def.label : a;
        });
        html += `<div class="dropdown-caution" style="margin-top:8px">
            <span class="material-icons-round">sync_problem</span>
            <div>
                <strong>Also: Cross-contamination risk</strong>
                <p>Possible traces of ${crossNames.join(', ')}.</p>
            </div>
        </div>`;
    }

    // Ask staff note for items that have ask_staff alongside other statuses
    if (item.ask_staff && item.status !== 'ask') {
        html += `<div class="dropdown-ask" style="margin-top:8px">
            <span class="material-icons-round">record_voice_over</span>
            <div>
                <strong>Also ask your server:</strong>
                <p class="dropdown-question">${generateStaffQuestion(item)}</p>
            </div>
        </div>`;
    }

    // Ingredients with highlighting
    if (item.ingredients) {
        let ingredientText = escapeHTML(item.ingredients);
        if (userProfile?.allergens?.length) {
            userProfile.allergens.forEach(allergenId => {
                const derivs = ALLERGEN_DERIVATIVES[allergenId] || [];
                const allergenDef = allAllergenDefs.find(d => d.id === allergenId);
                const allergenName = allergenDef ? allergenDef.label.toLowerCase() : allergenId;

                const nameRegex = new RegExp(`\\b(${allergenName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
                ingredientText = ingredientText.replace(nameRegex, '<mark class="ingredient-danger">$1</mark>');

                derivs.forEach(d => {
                    const dRegex = new RegExp(`\\b(${d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
                    ingredientText = ingredientText.replace(dRegex, '<mark class="ingredient-warning">$1</mark>');
                });
            });
        }
        html += `<div class="dropdown-ingredients">
            <div class="dropdown-ingredients-label">
                <span class="material-icons-round">receipt_long</span> Ingredients
            </div>
            <p>${ingredientText}</p>
        </div>`;
    } else {
        html += `<div class="dropdown-no-ingredients">
            <span class="material-icons-round">info</span>
            Full ingredient list not yet available. Ask your server for details.
        </div>`;
    }

    // View full details button
    html += `<button class="dropdown-full-details" onclick="event.stopPropagation(); viewMenuItem('${item.id}')">
        <span class="material-icons-round">open_in_full</span> View full details
    </button>`;

    return html;
}

function generateStaffQuestion(item) {
    const allergens = userProfile?.allergens || [];
    if (!allergens.length) return '"Does this dish contain any common allergens? I have food allergies and need to be careful."';

    const allAllergenDefs = [...ALLERGENS.common, ...ALLERGENS.additional];
    const names = allergens.map(id => {
        const def = allAllergenDefs.find(d => d.id === id);
        return def ? def.label.toLowerCase() : id;
    });

    // Build natural allergen list
    let allergenList;
    if (names.length === 1) {
        allergenList = names[0];
    } else if (names.length === 2) {
        allergenList = `${names[0]} or ${names[1]}`;
    } else {
        allergenList = names.slice(0, -1).join(', ') + ', or ' + names[names.length - 1];
    }

    // Pick a few relevant derivatives to mention
    const relevantDerivs = [];
    allergens.forEach(id => {
        const derivs = ALLERGEN_DERIVATIVES[id] || [];
        relevantDerivs.push(...derivs.slice(0, 2));
    });

    let question = `"I have a ${allergens.length > 1 ? 'food allergy' : names[0] + ' allergy'}. Does the ${escapeHTML(item.name)} contain ${allergenList}?`;
    if (relevantDerivs.length > 0 && relevantDerivs.length <= 4) {
        question += ` I also need to avoid ${relevantDerivs.join(', ')}.`;
    }
    question += ` Can you check with the kitchen?"`;

    return question;
}

// ---- Menu Item Detail Modal ----
function viewMenuItem(itemId) {
    const item = currentMenuItems.find(i => i.id === itemId);
    if (!item) return;

    const severity = userProfile?.allergen_severity || {};
    const allAllergenDefs = [...ALLERGENS.common, ...ALLERGENS.additional];

    // Build allergen warnings with severity
    let warningsHTML = '';
    if (item.conflicts.length) {
        warningsHTML = `<div class="detail-section">
            <div class="detail-section-title">
                <span class="material-icons-round">warning</span> Allergen Warnings
            </div>
            ${item.conflicts.map(a => {
                const sev = severity[a] || 'moderate';
                const def = allAllergenDefs.find(d => d.id === a);
                const icon = def ? def.icon : '';
                const label = def ? def.label : a;
                const sevLabel = sev === 'severe' ? 'Severe / Life-threatening'
                    : sev === 'moderate' ? 'Moderate reaction'
                    : 'Mild / Intolerance';
                return `<div class="detail-warning detail-warning-${sev}">
                    <span class="detail-warning-icon">${icon}</span>
                    <div class="detail-warning-info">
                        <div class="detail-warning-name">${label}</div>
                        <div class="detail-warning-level">${sevLabel}</div>
                    </div>
                    <span class="detail-sev-dot sev-dot-${sev}"></span>
                </div>`;
            }).join('')}
        </div>`;
    }

    // Cross-contamination warnings
    let crossHTML = '';
    if (item.crossConflicts.length) {
        crossHTML = `<div class="detail-section">
            <div class="detail-section-title">
                <span class="material-icons-round">sync_problem</span> Cross-Contamination Risk
            </div>
            ${item.crossConflicts.map(a => {
                const def = allAllergenDefs.find(d => d.id === a);
                const icon = def ? def.icon : '';
                const label = def ? def.label : a;
                return `<div class="detail-cross">
                    <span>${icon}</span>
                    <span>${label} - may be present due to shared preparation</span>
                </div>`;
            }).join('')}
        </div>`;
    }

    // Ingredients
    let ingredientsHTML = '';
    if (item.ingredients) {
        // Highlight allergen-related ingredients
        let ingredientText = escapeHTML(item.ingredients);
        if (userProfile?.allergens?.length) {
            userProfile.allergens.forEach(allergenId => {
                const derivs = ALLERGEN_DERIVATIVES[allergenId] || [];
                const allergenDef = allAllergenDefs.find(d => d.id === allergenId);
                const allergenName = allergenDef ? allergenDef.label.toLowerCase() : allergenId;

                // Highlight the allergen name itself
                const nameRegex = new RegExp(`\\b(${allergenName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
                ingredientText = ingredientText.replace(nameRegex, '<mark class="ingredient-danger">$1</mark>');

                // Highlight derivatives
                derivs.forEach(d => {
                    const dRegex = new RegExp(`\\b(${d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
                    ingredientText = ingredientText.replace(dRegex, '<mark class="ingredient-warning">$1</mark>');
                });
            });
        }
        ingredientsHTML = `<div class="detail-section">
            <div class="detail-section-title">
                <span class="material-icons-round">receipt_long</span> Ingredients
            </div>
            <p class="detail-ingredients">${ingredientText}</p>
        </div>`;
    }

    // Derivative detection in ingredients
    let derivativesFound = [];
    if (item.ingredients && userProfile?.allergens?.length) {
        const ingredientsLower = item.ingredients.toLowerCase();
        userProfile.allergens.forEach(allergenId => {
            const derivs = ALLERGEN_DERIVATIVES[allergenId] || [];
            derivs.forEach(d => {
                if (ingredientsLower.includes(d.toLowerCase())) {
                    derivativesFound.push({ allergen: allergenId, derivative: d });
                }
            });
        });
    }

    const derivativesHTML = derivativesFound.length
        ? `<div class="detail-section">
            <div class="detail-section-title">
                <span class="material-icons-round">visibility</span> Hidden Allergen Derivatives Found
            </div>
            ${derivativesFound.map(d => {
                const def = allAllergenDefs.find(a => a.id === d.allergen);
                return `<div class="detail-derivative">
                    <span class="material-icons-round">report</span>
                    <span>"<strong>${escapeHTML(d.derivative)}</strong>" is a form of <strong>${def ? def.label : d.allergen}</strong></span>
                </div>`;
            }).join('')}
        </div>`
        : '';

    // Ask staff
    const askStaffHTML = item.ask_staff
        ? `<div class="detail-ask-staff">
            <span class="material-icons-round">support_agent</span>
            <div>
                <strong>Ask staff before ordering</strong>
                <p>This dish may contain allergens not listed. Please confirm with your server.</p>
            </div>
        </div>`
        : '';

    // Build modal content
    const modal = document.getElementById('item-detail-modal');
    const modalBody = document.getElementById('item-detail-body');

    modalBody.innerHTML = `
        <div class="detail-header">
            <div class="detail-status badge-${item.status}">
                <span class="material-icons-round">${item.statusIcon}</span>
                ${item.statusLabel}
            </div>
            <h3 class="detail-name">${escapeHTML(item.name)}</h3>
            ${item.description ? `<p class="detail-desc">${escapeHTML(item.description)}</p>` : ''}
            ${item.price ? `<div class="detail-price">$${item.price}</div>` : ''}
        </div>
        ${warningsHTML}
        ${crossHTML}
        ${ingredientsHTML}
        ${derivativesHTML}
        ${askStaffHTML}
        ${!item.ingredients ? `<div class="detail-no-ingredients">
            <span class="material-icons-round">info</span>
            <span>Full ingredient list not yet available. Ask your server for details.</span>
        </div>` : ''}
    `;

    modal.classList.add('active');
}

function closeItemDetail() {
    document.getElementById('item-detail-modal').classList.remove('active');
}

// ---- Utilities ----
function buildHoursHTML(hours) {
    if (!hours || typeof hours !== 'object') return '';
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    return days.map(day => {
        const time = hours[day] || 'Closed';
        const isToday = day === today;
        return `<div class="hours-row${isToday ? ' hours-today' : ''}"><span class="hours-day">${day}</span><span class="hours-time">${escapeHTML(time)}</span></div>`;
    }).join('');
}

function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
