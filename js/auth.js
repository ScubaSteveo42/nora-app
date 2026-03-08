// ============================================
// Nora App - Authentication
// ============================================

function showForm(formId) {
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.getElementById(formId).classList.add('active');
}

async function handleSignIn() {
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;
    const btn = document.getElementById('signin-btn');

    if (!email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Signing in...';

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = '/app.html';
    } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<span class="material-icons-round">login</span> Sign In';
    }
}

async function handleSignUp() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const btn = document.getElementById('signup-btn');

    if (!name || !email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Creating account...';

    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } }
        });
        if (error) throw error;

        // Redirect to onboarding
        window.location.href = '/onboarding.html';
    } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<span class="material-icons-round">person_add</span> Create Account';
    }
}

async function handleResetPassword() {
    const email = document.getElementById('reset-email').value.trim();
    if (!email) {
        showToast('Please enter your email', 'error');
        return;
    }

    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
        if (error) throw error;
        showToast('Reset link sent! Check your email.', 'success');
        showForm('signin-form');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function handleSignOut() {
    try { await supabaseClient.auth.signOut(); } catch(e) {}
    localStorage.removeItem('nora_profile');
    // Reload to reset app state (works whether auth is bypassed or not)
    window.location.reload();
}

// Enter key support
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const activeForm = document.querySelector('.auth-form.active');
        if (activeForm?.id === 'signin-form') handleSignIn();
        else if (activeForm?.id === 'signup-form') handleSignUp();
        else if (activeForm?.id === 'reset-form') handleResetPassword();
    }
});
