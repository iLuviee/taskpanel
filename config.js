// Configuration for Discord OAuth2 and Supabase cloud storage.
const DISCORD_CONFIG = {
    CLIENT_ID: '1547117034125402122',
    REDIRECT_URI: window.location.origin + window.location.pathname,
    SCOPES: ['identify', 'email'],
    AUTH_ENDPOINT: 'https://discord.com/api/oauth2/authorize'
};

const SUPABASE_CONFIG = {
    // Isi dari Supabase Project Settings > API.
    URL: 'https://jwshukzxictokthuwnyj.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3c2h1a3p4aWN0b2t0aHV3bnlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1Njc1OTksImV4cCI6MjEwNjE0MzU5OX0.8FbuRFPUpcorf4qPL21l9PUFkCpsCSIZym5nC2fMWCA',
    ENABLED: true
};

