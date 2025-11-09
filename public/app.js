/**
 * Cofense Customisation Portal - Main Application
 *
 * This application handles Okta authentication using the redirect flow
 * and provides a portal for customizing security awareness content.
 */

// Global state
let authClient = null;
let currentUser = null;

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing Cofense Customisation Portal...');

    // Check if Okta is configured
    if (!isConfigured()) {
        showConfigurationError();
        return;
    }

    try {
        // Initialize Okta Auth client
        authClient = new OktaAuth({
            issuer: OKTA_CONFIG.issuer,
            clientId: OKTA_CONFIG.clientId,
            redirectUri: OKTA_CONFIG.redirectUri,
            scopes: OKTA_CONFIG.scopes,
            pkce: OKTA_CONFIG.pkce,
            tokenManager: OKTA_CONFIG.tokenManager
        });

        console.log('Okta Auth client initialized');

        // Check if this is a redirect callback
        if (authClient.isLoginRedirect()) {
            console.log('Processing authentication callback...');
            await handleAuthCallback();
        } else {
            // Check if user is already authenticated
            const isAuthenticated = await checkAuthentication();

            if (isAuthenticated) {
                console.log('User is already authenticated');
                await loadUserProfile();
                showApp();
            } else {
                console.log('User not authenticated, redirecting to Okta...');
                await signIn();
            }
        }
    } catch (error) {
        console.error('Application initialization error:', error);
        showError('Failed to initialize application: ' + error.message);
    }
});

/**
 * Handle authentication callback from Okta
 */
async function handleAuthCallback() {
    try {
        // Parse tokens from the redirect URL
        const tokenResponse = await authClient.token.parseFromUrl();
        console.log('Tokens parsed successfully');

        // Store tokens in the token manager
        authClient.tokenManager.setTokens(tokenResponse.tokens);

        // Load user profile
        await loadUserProfile();

        // Remove OAuth parameters from URL and show app
        window.history.replaceState({}, document.title, window.location.pathname);
        showApp();
    } catch (error) {
        console.error('Error handling authentication callback:', error);
        showError('Authentication failed: ' + error.message);

        // Clear any partial auth state and try again
        setTimeout(() => {
            authClient.tokenManager.clear();
            signIn();
        }, 3000);
    }
}

/**
 * Check if user is authenticated
 */
async function checkAuthentication() {
    try {
        const accessToken = await authClient.tokenManager.get('accessToken');
        const idToken = await authClient.tokenManager.get('idToken');

        return !!(accessToken && idToken && !authClient.tokenManager.hasExpired(accessToken));
    } catch (error) {
        console.error('Error checking authentication:', error);
        return false;
    }
}

/**
 * Initiate sign in with Okta
 */
async function signIn() {
    try {
        await authClient.token.getWithRedirect({
            responseType: ['token', 'id_token'],
            scopes: OKTA_CONFIG.scopes
        });
    } catch (error) {
        console.error('Sign in error:', error);
        showError('Failed to initiate sign in: ' + error.message);
    }
}

/**
 * Load user profile from ID token
 */
async function loadUserProfile() {
    try {
        const idToken = await authClient.tokenManager.get('idToken');

        if (idToken && idToken.claims) {
            currentUser = {
                name: idToken.claims.name || idToken.claims.email,
                email: idToken.claims.email,
                sub: idToken.claims.sub,
                // Organization info from custom claims (if configured in Okta)
                organization: idToken.claims.org || idToken.claims.organization || 'Cofense',
                // Additional custom claims
                companyId: idToken.claims.company_id || null,
                groups: idToken.claims.groups || []
            };

            console.log('User profile loaded:', currentUser);
            displayUserInfo();
        } else {
            throw new Error('No ID token found');
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        showError('Failed to load user profile: ' + error.message);
    }
}

/**
 * Display user information in the UI
 */
function displayUserInfo() {
    const userNameEl = document.getElementById('user-name');
    const userOrgEl = document.getElementById('user-org');
    const userInitialsEl = document.getElementById('user-initials');

    if (currentUser) {
        userNameEl.textContent = currentUser.name;
        userOrgEl.textContent = currentUser.organization;

        // Generate initials from name
        const initials = currentUser.name
            .split(' ')
            .map(part => part[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
        userInitialsEl.textContent = initials;
    }
}

/**
 * Sign out user
 */
async function signOut() {
    try {
        console.log('Signing out user...');

        // Clear tokens
        authClient.tokenManager.clear();

        // Sign out from Okta (this will redirect)
        await authClient.signOut({
            postLogoutRedirectUri: OKTA_CONFIG.redirectUri
        });
    } catch (error) {
        console.error('Sign out error:', error);
        // Force reload to clear state
        window.location.href = OKTA_CONFIG.redirectUri;
    }
}

/**
 * Show the main application
 */
function showApp() {
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';

    // Set up event listeners
    setupEventListeners();
}

/**
 * Set up UI event listeners
 */
function setupEventListeners() {
    // User menu toggle
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');

    userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = userDropdown.style.display === 'block';
        userDropdown.style.display = isVisible ? 'none' : 'block';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        userDropdown.style.display = 'none';
    });

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', signOut);

    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const contentType = tab.dataset.type;
            console.log('Switched to content type:', contentType);
            // TODO: Load content based on type
        });
    });

    // Search functionality
    const searchBtn = document.querySelector('.search-btn');
    const searchInput = document.getElementById('search-input');

    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            console.log('Searching for:', query);
            // TODO: Implement search
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

    // Filter toggles
    const bookmarkedToggle = document.getElementById('bookmarked-toggle');
    const myContentToggle = document.getElementById('my-content-toggle');

    bookmarkedToggle.addEventListener('change', (e) => {
        console.log('Bookmarked filter:', e.target.checked);
        // TODO: Apply filter
    });

    myContentToggle.addEventListener('change', (e) => {
        console.log('My Content filter:', e.target.checked);
        // TODO: Apply filter
    });
}

/**
 * Show configuration error
 */
function showConfigurationError() {
    document.getElementById('loading-screen').innerHTML = `
        <div class="error-message">
            <h3>Configuration Required</h3>
            <p>Please configure your Okta credentials in <code>config.js</code></p>
            <p style="margin-top: 12px; font-size: 13px;">
                1. Create a Single-Page Application in Okta<br>
                2. Update OKTA_CONFIG.issuer and OKTA_CONFIG.clientId<br>
                3. Set redirect URIs to: ${window.location.origin}<br>
                4. Add ${window.location.origin} as a Trusted Origin
            </p>
        </div>
    `;
}

/**
 * Show error message
 */
function showError(message) {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.innerHTML = `
        <div class="error-message">
            <h3>Error</h3>
            <p>${message}</p>
            <p style="margin-top: 12px;">
                <button onclick="location.reload()" style="padding: 8px 16px; background-color: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Reload Page
                </button>
            </p>
        </div>
    `;
}

/**
 * Refresh tokens automatically
 * This runs periodically to ensure tokens don't expire
 */
authClient && authClient.tokenManager.on('renewed', function (key, newToken, oldToken) {
    console.log('Token renewed:', key);
});

authClient && authClient.tokenManager.on('error', function (error) {
    console.error('TokenManager error:', error);
    // If token refresh fails, redirect to sign in
    if (error.errorCode === 'login_required') {
        signIn();
    }
});

// Export for debugging in console
window.app = {
    authClient,
    currentUser,
    signOut,
    signIn,
    checkAuthentication
};

console.log('Application script loaded. Debug tools available via window.app');
