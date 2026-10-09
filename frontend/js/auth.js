// Supabase Configuration
// TODO: Replace these with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'https://ylumpwgsxakzdnyzsrqj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdW1wd2dzeGFremRueXpzcnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNjAzMzQsImV4cCI6MjEwNjkzNjMzNH0.q-PLdnmXylGlsyhTHY0ftfHbRDfz-XSARGkODNdl7Fs';

// Initialize Supabase Client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Utility to show messages/errors (You can replace this with proper UI notifications)
function showMessage(msg, isError = false) {
    alert(msg);
    console[isError ? 'error' : 'log'](msg);
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
        
        showMessage('Sign up successful! Please check your email to verify your account (if email confirmation is enabled in Supabase).');
        // Redirect to login or dashboard
        window.location.href = 'login.html';
    } catch (error) {
        showMessage(error.message, true);
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

        showMessage('Login successful!');
        window.location.href = '/admin/dashboard.html';
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
