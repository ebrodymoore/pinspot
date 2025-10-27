# Google OAuth Setup Guide

To enable Google sign-up and sign-in in Pinspot, you need to configure Google OAuth in both Google Cloud Console and Supabase.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top and select "NEW PROJECT"
3. Enter a project name (e.g., "Pinspot")
4. Click "CREATE"
5. Wait for the project to be created

## Step 2: Enable Google OAuth APIs

1. In Google Cloud Console, search for "Google+ API" in the search bar
2. Click on "Google+ API" and click "ENABLE"
3. Search for "Google Photos Library API"
4. Click on it and click "ENABLE"

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials** in the left sidebar
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Choose **"OAuth client ID"**
4. If prompted to create a consent screen first:
   - Choose **User Type: External**
   - Click **CREATE**
   - Fill in:
     - **App name:** Pinspot
     - **User support email:** your-email@example.com
     - **Developer contact information:** your-email@example.com
   - Click **SAVE AND CONTINUE**
   - On the "Scopes" page, click **ADD OR REMOVE SCOPES**
   - Search for and add:
     - `https://www.googleapis.com/auth/photoslibrary.readonly`
     - `openid`
     - `email`
     - `profile`
   - Click **UPDATE**
   - Click **SAVE AND CONTINUE** through the remaining pages

5. Back at the credentials page, click **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**
6. Choose **Application type: Web application**
7. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000` (for local development)
   - `https://[your-domain].vercel.app` (replace with your actual Vercel domain)
   - `https://[your-project-ref].supabase.co` (your Supabase project URL)

8. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000/auth/callback` (for local development)
   - `https://[your-domain].vercel.app/auth/callback` (replace with your actual Vercel domain)
   - `https://[your-project-ref].supabase.co/auth/v1/callback?provider=google` (Supabase OAuth callback)

9. Click **CREATE**
10. Copy the **Client ID** and **Client Secret** (you'll need these next)

## Step 4: Configure Google OAuth in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Authentication** > **Providers** in the left sidebar
4. Find **Google** and click on it
5. Toggle **"Enable Sign in with Google"** to ON
6. Paste your **Client ID** from Google Cloud
7. Paste your **Client Secret** from Google Cloud
8. Add the callback URL for local testing: `http://localhost:3000/auth/callback`
9. Click **Save**

## Step 5: Update Environment Variables

Add these to your `.env.local` (local development) and Vercel environment variables:

```
GOOGLE_CLIENT_ID=your-client-id-from-step-3
GOOGLE_CLIENT_SECRET=your-client-secret-from-step-3
GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/auth/callback
```

## Step 6: Test Locally

1. Run `npm run dev`
2. Go to http://localhost:3000
3. Click "Sign up with Google"
4. You should be redirected to Google's login page

## Troubleshooting

### "Unsupported provider: provider is not enabled"
- Make sure you've enabled Google in Supabase > Authentication > Providers
- Verify your Client ID and Client Secret are correct in Supabase
- Clear your browser cache and try again

### "Redirect URI mismatch"
- Make sure your callback URL in Google Cloud matches your application's callback URL
- After deploying to Vercel, update the authorized redirect URIs in Google Cloud to include your Vercel domain

### "Invalid Client ID"
- Double-check that you copied the correct Client ID from Google Cloud
- Make sure you're using the OAuth 2.0 credentials, not API keys

## Additional Resources

- [Supabase Google OAuth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud OAuth Setup](https://developers.google.com/identity/protocols/oauth2/web-server-flow)
- [Google Photos Library API Documentation](https://developers.google.com/photos/library/guides/overview)
