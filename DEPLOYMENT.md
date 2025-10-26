# Pinspot Deployment Guide

A complete guide to deploying Pinspot to Vercel with Supabase backend and Google Photos integration.

## Prerequisites

- Node.js 18+ and npm
- GitHub account
- Vercel account
- Supabase account
- Google Cloud Console project

## Step 1: Setup Supabase

### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in project details:
   - **Project name:** pinspot
   - **Database password:** Save this securely
   - **Region:** Choose closest to you
4. Click "Create new project" and wait for initialization

### 1.2 Run Database Migrations

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Click **Run**
5. Verify all tables were created successfully

### 1.3 Get Your Supabase Keys

1. Go to **Settings** → **API**
2. Copy the following (you'll need them later):
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### 1.4 Create Storage Bucket

1. Go to **Storage** in the sidebar
2. Click **Create bucket**
3. Name it: `photos`
4. Uncheck "Public bucket"
5. Click **Create**

## Step 2: Google Cloud Console Setup

### 2.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **Select Project** → **New Project**
3. Name it "Pinspot" and click **Create**
4. Wait for project creation

### 2.2 Enable Google Photos Library API

1. In the search bar, search for "Google Photos Library API"
2. Click on it and click **Enable**
3. Accept the terms

### 2.3 Create OAuth Credentials

1. Go to **Credentials** in the left sidebar
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. If prompted, configure the OAuth consent screen:
   - **User Type:** External
   - **App name:** Pinspot
   - **User support email:** Your email
   - **Developer contact:** Your email
   - Click **Save and Continue**
4. On "Scopes" step, click **Add or Remove Scopes**
5. Search for and add these scopes:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/photoslibrary.readonly`
6. Click **Update**
7. On "OAuth consent screen", click **Save and Continue** (no test users needed for testing)

### 2.4 Create OAuth Client ID

1. Go back to **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. Select **Web application**
4. Under "Authorized redirect URIs", add:
   - For local testing: `http://localhost:3000/auth/callback`
   - For production: `https://yourdomain.vercel.app/auth/callback`
5. Click **Create**
6. Copy the **Client ID** and **Client Secret** (you'll need these)

## Step 3: Prepare for Vercel Deployment

### 3.1 Initialize Git

```bash
cd /Users/ericbrody-moore/Documents/pinspot
git init
git add .
git commit -m "Initial commit: Pinspot travel mapping app"
```

### 3.2 Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name the repository "pinspot"
3. Click **Create repository**
4. Follow instructions to push your local repository:

```bash
git remote add origin https://github.com/YOUR_USERNAME/pinspot.git
git branch -M main
git push -u origin main
```

### 3.3 Setup Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New** → **Project**
3. Import your GitHub repository (you may need to install Vercel GitHub app)
4. Select the `pinspot` repository
5. Click **Import**

### 3.4 Configure Environment Variables

In the Vercel dashboard for your project:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.vercel.app/auth/callback
```

3. Click **Save**

### 3.5 Update Google Cloud Redirect URI

1. Go back to Google Cloud Console
2. Go to **Credentials** → Your OAuth 2.0 Client ID
3. Edit it and update "Authorized redirect URIs" to:
   ```
   https://yourdomain.vercel.app/auth/callback
   ```
   (Replace `yourdomain` with your actual Vercel domain)
4. Click **Save**

## Step 4: Deploy

1. In Vercel dashboard, click **Deploy**
2. The deployment will start automatically
3. Wait for the build to complete (usually 2-3 minutes)
4. Once complete, you'll see the deployment URL

## Step 5: Post-Deployment Setup

### 5.1 Test the Application

1. Visit your deployment URL
2. Click "Sign In"
3. Create an account
4. Test the onboarding flow

### 5.2 Configure Supabase for Production

1. In Supabase dashboard, go to **Settings** → **Auth**
2. Under **Site URL**, set it to your Vercel domain
3. Under **Redirect URLs**, add:
   ```
   https://yourdomain.vercel.app/auth/callback
   https://yourdomain.vercel.app/auth/login
   https://yourdomain.vercel.app/onboarding
   ```
4. Click **Save**

### 5.3 Enable Email Verification (Optional)

1. Go to **Auth** → **Providers** → **Email**
2. Enable "Confirm email"
3. Customize email templates if desired

## Local Development Setup

### 1. Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/pinspot.git
cd pinspot
npm install
```

### 2. Create Local Environment File

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Troubleshooting

### Google Photos Import Not Working

1. Verify Google OAuth credentials are correct
2. Check that Photos Library API is enabled in Google Cloud Console
3. Ensure redirect URI matches exactly in both Google Console and Supabase
4. Check browser console for specific error messages

### Database Connection Issues

1. Verify Supabase URL and keys are correct
2. Check that RLS policies are enabled
3. Test connection in Supabase SQL Editor

### Deployment Failures

1. Check Vercel build logs for specific errors
2. Ensure all environment variables are set
3. Verify Node.js version is 18+
4. Run `npm run build` locally to test build process

## Database Schema Overview

### users
- `id`: UUID (auth.users foreign key)
- `username`: Unique username
- `email`: User email
- `is_public`: Profile visibility
- `google_refresh_token`: Encrypted token for Google Photos
- `last_import_date`: Last import timestamp
- `created_at`, `updated_at`: Timestamps

### pins
- `id`: UUID primary key
- `user_id`: Reference to users
- `latitude`, `longitude`: Location coordinates
- `location_name`: Reverse geocoded location name
- `visit_date`: When user visited
- `notes`: User notes
- `source`: 'manual' or 'google_photos'
- `created_at`, `updated_at`: Timestamps

### photos
- `id`: UUID primary key
- `pin_id`: Reference to pins
- `storage_path`: Path in Supabase Storage
- `google_photo_id`: Original Google photo ID
- `display_order`: Order in carousel
- `taken_date`: Photo timestamp
- `created_at`: Creation timestamp

### tags
- `id`: UUID primary key
- `pin_id`: Reference to pins
- `tag_name`: Category name (e.g., "restaurant", "hike")

### import_jobs
- `id`: UUID primary key
- `user_id`: Reference to users
- `status`: 'pending' | 'processing' | 'completed' | 'failed'
- `photos_imported`: Count of imported photos
- `pins_created`: Count of created pins
- `started_at`, `completed_at`: Timestamps
- `error_message`: Error details if failed

## Performance Optimization Tips

### 1. Map Clustering
The application uses marker clustering at zoom level < 16 for performance.

### 2. Lazy Loading
- Photos are loaded on demand
- Use `next/image` for optimized image serving

### 3. Database Indexes
Pre-created indexes on:
- `pins(user_id)`
- `pins(visit_date)`
- `photos(pin_id)`
- `tags(pin_id)`

### 4. Rate Limiting
- Google Photos API requests are batched with 1-second delays
- Implement request throttling for large imports

## Security Considerations

### 1. RLS Policies
All database tables have Row Level Security enabled:
- Users can only access their own data
- Public profiles are readable by anyone
- All mutations are protected

### 2. Google OAuth
- Tokens are encrypted before storage
- Only read-only scopes are requested
- Refresh tokens are handled securely

### 3. Environment Variables
Never commit `.env.local` or secrets to version control:
- Use `.gitignore` to exclude environment files
- Always use Vercel environment variables for secrets
- Rotate secrets regularly

## Scaling Considerations

### For Large Photo Libraries
1. Implement pagination in photo import (already in place)
2. Use background jobs for batch processing
3. Consider splitting imports across multiple requests
4. Add progress indicators for user feedback

### Database Scaling
1. Monitor Supabase usage in dashboard
2. Consider read replicas for high-traffic deployments
3. Archive old import jobs periodically
4. Use database indexing strategically

## Backup Strategy

### Supabase Automatic Backups
1. Supabase automatically backs up daily
2. 7-day backup retention included
3. Go to **Settings** → **Backups** to manage

### Manual Backups
```bash
# Export database
pg_dump postgresql://user:password@host/db > backup.sql

# Import database
psql postgresql://user:password@host/db < backup.sql
```

## Monitoring & Analytics

### Vercel Analytics
1. Enable Web Analytics in Vercel dashboard
2. Monitor Core Web Vitals
3. Track deployment performance

### Supabase Monitoring
1. Monitor API usage in **Settings** → **Usage**
2. Review database query performance
3. Check authentication logs

## Support & Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Leaflet Documentation](https://leafletjs.com/)
- [Google Photos API](https://developers.google.com/photos)
- [Vercel Documentation](https://vercel.com/docs)
