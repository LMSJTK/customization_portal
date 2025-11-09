# Quick Setup Guide

## Prerequisites
- Okta developer account (free at https://developer.okta.com/signup/)
- Python 3 (or Node.js, or PHP) for local server
- Modern web browser

## Setup Steps

### 1. Create Okta Application (5 minutes)

1. Go to Okta Admin Console → **Applications** → **Create App Integration**
2. Choose:
   - Sign-in method: **OIDC - OpenID Connect**
   - Application type: **Single-Page Application**
3. Configure:
   - Name: `Cofense Customisation Portal`
   - Sign-in redirect URI: `http://localhost:9000`
   - Sign-out redirect URI: `http://localhost:9000`
   - Base URI: `http://localhost:9000`
4. Save and copy the **Client ID**

### 2. Configure Trusted Origin

1. Go to **Security** → **API** → **Trusted Origins**
2. Add Origin:
   - Name: `Local Dev`
   - Origin URL: `http://localhost:9000`
   - Type: ✓ CORS ✓ Redirect
3. Save

### 3. Update Configuration

Edit `public/config.js`:

```javascript
const OKTA_CONFIG = {
    issuer: 'https://dev-12345.okta.com',  // ← Your Okta domain
    clientId: '0oa5abc123xyz',             // ← Your Client ID
    redirectUri: 'http://localhost:9000',
    // ... rest stays the same
};
```

### 4. Run the Application

```bash
# Using Python (recommended)
cd public
python3 -m http.server 9000

# OR using npm
npm run serve

# OR using PHP
php -S localhost:9000 -t public
```

### 5. Test

1. Open http://localhost:9000 in a **private/incognito browser**
2. You'll be redirected to Okta
3. Sign in with your Okta credentials
4. You should see the portal with your name in the top-right

## Troubleshooting

### "Configuration Required"
→ Update `config.js` with your Okta domain and Client ID

### Authentication loops
→ Check redirect URIs match exactly (including port)
→ Verify Trusted Origin is configured

### CORS errors
→ Ensure Trusted Origin has both CORS and Redirect checked

### Already signed in elsewhere?
→ Use private/incognito window
→ Or clear localStorage: `localStorage.clear()`

## Next Steps

See [README.md](README.md) for:
- Detailed configuration options
- Custom claims setup (for organization info)
- Database schema
- Next development phases

## Quick Reference

**Okta Admin Console**: Your-Domain/admin/dashboard
**Application Type**: Single-Page Application (SPA)
**Auth Flow**: Authorization Code with PKCE
**Redirect URI**: http://localhost:9000
**Trusted Origin**: http://localhost:9000 (CORS + Redirect)
