// Configuration for Discord OAuth2 Setup
const DISCORD_CONFIG = {
    // Masukkan Client ID dari Discord Developer Portal di sini
    CLIENT_ID: '1547117034125402122', 
    
    // Auto detect Redirect URI berdasarkan domain GitHub Pages atau Localhost kamu
    REDIRECT_URI: window.location.origin + window.location.pathname,
    
    // Scope OAuth2 yang dibutuhkan untuk membaca identitas user
    SCOPES: ['identify', 'email'],
    
    // Discord OAuth2 Endpoint
    AUTH_ENDPOINT: 'https://discord.com/api/oauth2/authorize'
};