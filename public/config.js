/**
 * Okta Configuration
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a Single-Page Application in your Okta Admin Console
 * 2. Set the Sign-in redirect URI to: http://localhost:9000 (or your deployed URL)
 * 3. Set the Sign-out redirect URI to: http://localhost:9000 (or your deployed URL)
 * 4. Add http://localhost:9000 as a Trusted Origin (CORS)
 * 5. Update the values below with your Okta domain and Client ID
 */

const OKTA_CONFIG = {
    // Your Okta domain (e.g., "https://dev-12345.okta.com" or "https://yourdomain.okta.com")
    // DO NOT include "/oauth2/default" - just the base domain
    issuer: 'https://YOUR_OKTA_DOMAIN',

    // Your Okta application Client ID (found in the application settings)
    clientId: 'YOUR_CLIENT_ID',

    // Redirect URI after login (must match the URI configured in Okta)
    redirectUri: window.location.origin,

    // Scopes to request
    scopes: ['openid', 'profile', 'email'],

    // PKCE (Proof Key for Code Exchange) - recommended for SPAs
    pkce: true,

    // Token storage
    tokenManager: {
        storage: 'localStorage'
    }
};

// Check if configuration is set up
const isConfigured = () => {
    return OKTA_CONFIG.issuer !== 'https://YOUR_OKTA_DOMAIN' &&
           OKTA_CONFIG.clientId !== 'YOUR_CLIENT_ID';
};
