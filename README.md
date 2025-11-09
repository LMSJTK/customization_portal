# Cofense Customisation Portal

A web-based portal that allows users to customize email templates, educational content, and e-learning materials for security awareness training. Users authenticate via Okta SSO from the central platform.

## Features

- **Okta SSO Authentication**: Secure authentication using Okta Auth JS with PKCE flow
- **User Profile Management**: Leverages Okta claims for user and organization information
- **Content Browser**: Browse and search through various content types:
  - Emails
  - Newsletters
  - Education materials
  - Infographics
  - Videos
  - E-Learning modules
- **Brand Kit Manager**: Configure logos, colors, and fonts (coming in next phase)
- **Content Editor**: Visual editor with element selection and inline text editing (coming in next phase)

## Architecture

### Frontend
- Pure HTML/CSS/JavaScript (no framework dependencies)
- Okta Auth JS SDK 7.7.0 for authentication
- Responsive design matching Figma specifications

### Backend (Next Phase)
- PHP for API endpoints
- PostgreSQL database with `global.content` table
- Content upload and customization handlers

### Authentication Flow
1. User visits portal
2. Redirected to Okta Sign-In Widget
3. After authentication, callback returns ID and access tokens
4. Tokens stored in localStorage
5. User info extracted from Okta claims (no user DB needed)
6. Organization and permissions from Okta custom claims

## Project Structure

```
customization_portal/
├── public/
│   ├── index.html          # Main application HTML
│   ├── app.js              # Application logic and auth flow
│   ├── config.js           # Okta configuration
│   └── styles.css          # Application styles
├── CustomizationPortal.pdf # Figma design reference
├── SPA_Auth_JS_javascript.pdf # Okta Auth JS guide
└── README.md               # This file
```

## Okta Setup Instructions

### 1. Create an Okta Account

If you don't have an Okta account:
- Go to https://developer.okta.com/signup/
- Sign up for a free developer account
- Note your Okta domain (e.g., `https://dev-12345.okta.com`)

### 2. Create a Single-Page Application in Okta

1. Sign in to your Okta Admin Console
2. Navigate to **Applications** > **Applications**
3. Click **Create App Integration**
4. Select:
   - **Sign-in method**: OIDC - OpenID Connect
   - **Application type**: Single-Page Application
5. Click **Next**

### 3. Configure Application Settings

**General Settings:**
- **App integration name**: Cofense Customisation Portal
- **Grant type**: Authorization Code (with PKCE) ✓
- **Sign-in redirect URIs**:
  - `http://localhost:9000` (for development)
  - Add your production URL when deploying
- **Sign-out redirect URIs**:
  - `http://localhost:9000` (for development)
  - Add your production URL when deploying
- **Base URI**: `http://localhost:9000`

**Assignments:**
- **Controlled access**: Allow everyone in your organization to access
- Or assign specific groups as needed

6. Click **Save**
7. **Copy the Client ID** from the application page

### 4. Configure Trusted Origins

1. Go to **Security** > **API** > **Trusted Origins**
2. Click **Add Origin**
3. Configure:
   - **Name**: Customisation Portal - Local Dev
   - **Origin URL**: `http://localhost:9000`
   - **Type**: Check both CORS and Redirect ✓✓
4. Click **Save**

### 5. (Optional) Configure Custom Claims

To pass organization info to the app:

1. Go to **Security** > **API** > **Authorization Servers**
2. Select **default** (or your custom auth server)
3. Click **Claims** tab
4. Click **Add Claim**
5. Add custom claims:
   - **Name**: `organization`
   - **Include in token type**: ID Token, Always
   - **Value type**: Expression
   - **Value**: `user.organization` (or your custom attribute)
   - **Include in**: Any scope

Repeat for other custom claims like `company_id`, etc.

### 6. Configure the Application

Edit `public/config.js` and update:

```javascript
const OKTA_CONFIG = {
    issuer: 'https://YOUR_OKTA_DOMAIN',  // e.g., https://dev-12345.okta.com
    clientId: 'YOUR_CLIENT_ID',           // From step 3
    redirectUri: 'http://localhost:9000',
    scopes: ['openid', 'profile', 'email'],
    pkce: true,
    tokenManager: {
        storage: 'localStorage'
    }
};
```

## Running the Application

### Option 1: Python HTTP Server (Recommended for Development)

```bash
cd public
python3 -m http.server 9000
```

Then open http://localhost:9000 in your browser.

### Option 2: Node.js HTTP Server

```bash
npx http-server public -p 9000
```

### Option 3: PHP Built-in Server

```bash
php -S localhost:9000 -t public
```

## Testing the Authentication Flow

1. Start the local server (see above)
2. Open http://localhost:9000 in a **private/incognito** browser window
3. You should be redirected to Okta Sign-In Widget
4. Sign in with a user from your Okta organization
5. After successful authentication, you'll be redirected back to the portal
6. You should see your name and organization in the top-right corner

### Troubleshooting

**"Configuration Required" error:**
- Make sure you've updated `config.js` with your Okta domain and Client ID
- Verify the values don't contain `YOUR_OKTA_DOMAIN` or `YOUR_CLIENT_ID`

**Authentication fails or loops:**
- Check that redirect URIs match exactly (including port number)
- Verify Trusted Origin is configured for CORS
- Check browser console for specific error messages
- Ensure you're using the correct Okta domain (no `/oauth2/default` at the end)

**"Sign in" keeps redirecting:**
- Clear your browser localStorage: `localStorage.clear()`
- Try a private/incognito window
- Check that your Okta user is assigned to the application

**Browser shows errors about CORS:**
- Verify Trusted Origin is configured correctly
- Make sure both CORS and Redirect are checked
- Ensure the origin URL matches exactly (no trailing slash)

## Database Schema

The application will connect to a PostgreSQL database with the following schema:

```sql
CREATE TABLE IF NOT EXISTS global.content
(
    id text,
    company_id text,
    title text,
    description text,
    content_type text,  -- 'email', 'newsletter', 'education', etc.
    content_preview text,
    content_url text,   -- Path to content directory (for HTML educations)
    email_from_address text,
    email_subject text,
    email_body_html text,
    email_attachment_filename text,
    email_attachment_content bytea,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);
```

### Notes:
- User and organization data comes from Okta claims, not stored in DB
- `content_url` points to the directory containing HTML education content
- `email_body_html` contains the customizable HTML for email templates
- Customized content creates new entries associated to `company_id` from Okta

## Okta Claims Used

The application extracts the following information from Okta ID tokens:

| Claim | Description | Used For |
|-------|-------------|----------|
| `name` | User's full name | Display name in header |
| `email` | User's email | Contact info, user identification |
| `sub` | Okta user ID | Unique user identifier |
| `org` or `organization` | Organization name | Display in header, content filtering |
| `company_id` | Company identifier | Associate customizations to organization |
| `groups` | User's group memberships | Permissions and access control |

To configure custom claims, see step 5 in Okta Setup Instructions above.

## Next Development Phases

### Phase 2: Content Management
- [ ] PHP API endpoints for content CRUD
- [ ] PostgreSQL database connection
- [ ] Content listing and search functionality
- [ ] Filter implementation

### Phase 3: Brand Kit Manager
- [ ] Logo upload functionality
- [ ] Color picker and preset management
- [ ] Font selection and custom font upload
- [ ] Apply brand kit to content templates

### Phase 4: Content Editor
- [ ] Visual HTML editor
- [ ] Element selection and property editing
- [ ] Inline text editing
- [ ] Preview functionality
- [ ] Save customizations

### Phase 5: Publishing
- [ ] PHP uploader integration
- [ ] Create customized content copies
- [ ] Associate content to user's organization
- [ ] Version management

## Security Considerations

- ✅ PKCE flow for SPA security
- ✅ Tokens stored in localStorage (can be upgraded to secure cookies)
- ✅ Automatic token refresh
- ✅ No passwords stored (Okta handles authentication)
- ✅ Organization isolation via Okta claims
- 🔄 HTTPS required for production (configure in Okta)
- 🔄 Content Security Policy headers (add in production)
- 🔄 CSRF protection for API endpoints (Phase 2)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (responsive design)

## License

Copyright © 2025 Cofense. All rights reserved.

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review browser console for error messages
3. Verify Okta configuration matches this guide
4. Check Okta Auth JS documentation: https://github.com/okta/okta-auth-js

## References

- [Okta Auth JS SDK Documentation](https://github.com/okta/okta-auth-js)
- [Okta Developer Portal](https://developer.okta.com/)
- [Sign in to SPA with Auth JS Guide](https://developer.okta.com/docs/guides/auth-js-redirect/)
