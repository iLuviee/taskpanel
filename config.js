// Configuration for Discord OAuth2 and Supabase cloud storage.
const DISCORD_CONFIG = {
    CLIENT_ID: '1547117034125402122',
    REDIRECT_URI: window.location.origin + window.location.pathname,
    SCOPES: ['identify', 'email'],
    AUTH_ENDPOINT: 'https://discord.com/api/oauth2/authorize'
};

const SUPABASE_CONFIG = {
    // Isi dari Supabase Project Settings > API.
    URL: '',
    ANON_KEY: '',
    ENABLED: false
};