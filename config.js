// Shared configuration for DawaTrack
const SUPABASE_URL = 'https://illirjtiwudwybtxvvbf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsbGlyanRpd3Vkd3lidHh2dmJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyNzIxNTQsImV4cCI6MjA1NDg0ODE1NH0.WH-ZdjR9yvv1iii8pgGIi1IiCxT2hUyF1dyRrHXNG10';

// Export the configuration
window.SUPABASE_CONFIG = {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY
}; 