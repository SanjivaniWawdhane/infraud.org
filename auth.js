// Supabase Configuration
// TODO: Replace these with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'https://ylumpwgsxakzdnyzsrqj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdW1wd2dzeGFremRueXpzcnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNjAzMzQsImV4cCI6MjEwNjkzNjMzNH0.q-PLdnmXylGlsyhTHY0ftfHbRDfz-XSARGkODNdl7Fs';

// Initialize Supabase Client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Utility to show messages/errors using a nice animated popup
function showMessage(msg, isError = false) {
    console[isError ? 'error' : 'log'](msg);
    
    let popup = document.getElementById('auth-popup-message');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'auth-popup-message';
        document.body.appendChild(popup);
        
        const style = document.createElement('style');
        style.innerHTML = `
            #auth-popup-message {
                position: fixed;
                top: 24px;
                right: 24px;
                padding: 16px 24px;
                border-radius: 8px;
                color: #fff;
                font-weight: 500;
                font-size: 0.9375rem;
                z-index: 9999;
                transform: translateX(120%);
                transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                display: flex;
                align-items: center;
                gap: 12px;
                max-width: 400px;
                font-family: 'Inter', sans-serif;
            }
            #auth-popup-message.show { transform: translateX(0); }
            #auth-popup-message.success { background: #10B981; border: 1px solid #059669; }
            #auth-popup-message.error { background: #EF4444; border: 1px solid #DC2626; }
        `;
        document.head.appendChild(style);
    }
    
    popup.className = isError ? 'error' : 'success';
    const icon = isError 
        ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
        : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
        
    popup.innerHTML = icon + '<span>' + msg + '</span>';
    
    setTimeout(() => popup.classList.add('show'), 10);
    setTimeout(() => popup.classList.remove('show'), 3500);
}

// 1. Sign Up with Email and Password
async function signUpWithEmail(fullName, email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName,
                }
            }
        });

        if (error) throw error;
        
        showMessage('Sign up successful! Redirecting to login...');
        
        // Preserve redirect param
        const urlParams = new URLSearchParams(window.location.search);
        const redirectParam = urlParams.get('redirect');
        let nextUrl = 'login.html';
        if (redirectParam) {
            nextUrl += '?redirect=' + encodeURIComponent(redirectParam);
        }
        
        // Wait 2 seconds for animation
        await new Promise(resolve => setTimeout(resolve, 2000));
        window.location.href = nextUrl;
    } catch (error) {
        showMessage(error.message, true);
        throw error;
    }
}

// 2. Log In with Email and Password
async function logInWithEmail(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;

        showMessage('Login successful! Redirecting...');
        
        // Check for redirect param
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect') || 'dashboard.html';
        
        // Wait 1.5 seconds for animation
        await new Promise(resolve => setTimeout(resolve, 1500));
        window.location.href = redirectUrl;
    } catch (error) {
        showMessage(error.message, true);
        throw error;
    }
}

// 3. Social Login (Google / GitHub)
async function signInWithProvider(provider) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: window.location.origin + '/dashboard.html'
            }
        });

        if (error) throw error;
    } catch (error) {
        showMessage(error.message, true);
    }
}

// 4. Check Current User Session (to protect pages)
async function checkUserSession() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    return session;
}

// 5. Logout
async function signOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (!error) {
        window.location.href = 'login.html';
    }
}

// Expose functions to global window object so HTML buttons can use them
window.authApp = {
    signUpWithEmail,
    logInWithEmail,
    signInWithProvider,
    checkUserSession,
    signOut,
    supabase: supabaseClient
};
