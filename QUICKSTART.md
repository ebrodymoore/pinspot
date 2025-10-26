# Pinspot Quick Start Guide

Get Pinspot running locally in 15 minutes.

## Prerequisites

- Node.js 18+ and npm
- Git
- Supabase account
- Google Cloud project with OAuth credentials

## Step 1: Setup Supabase (5 minutes)

### 1.1 Create Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Enter "pinspot" as name and set a database password
4. Click "Create new project"
5. Wait for initialization

### 1.2 Run Database Schema
1. Go to **SQL Editor** → **New Query**
2. Copy entire contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and click **Run**

### 1.3 Get API Keys
1. Go to **Settings** → **API**
2. Copy these values:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key

## Step 2: Google Cloud Setup (3 minutes)

### 2.1 Create Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project named "Pinspot"

### 2.2 Enable APIs
1. Search "Google Photos Library API"
2. Click **Enable**

### 2.3 Create OAuth Credentials
1. Go to **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Add redirect URI: `http://localhost:3000/auth/callback`
5. Click **Create**
6. Copy **Client ID** and **Client Secret**

## Step 3: Local Setup (5 minutes)

### 3.1 Clone & Install
```bash
git clone https://github.com/your-username/pinspot.git
cd pinspot
npm install
```

### 3.2 Create .env.local
```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
NEXTAUTH_SECRET=test-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3000
EOF
```

### 3.3 Run Development Server
```bash
npm run dev
```

### 3.4 Open Browser
Navigate to `http://localhost:3000`

## Step 4: Test the App (2 minutes)

1. **Sign Up**
   - Click "Sign Up"
   - Create account with email/password or Google

2. **Add a Pin Manually**
   - Go to Dashboard
   - Click on map to add pin
   - Fill in location details
   - Save

3. **Import Google Photos** (Optional)
   - Go to Onboarding
   - Click "Import from Google Photos"
   - Authorize access
   - Follow import flow

4. **View Public Profile**
   - Go to Settings
   - Enable "Make profile public"
   - Visit public profile URL

## Common Commands

```bash
# Development
npm run dev                # Start dev server
npm run build             # Build for production
npm start                 # Run production build
npm run lint              # Run ESLint

# Database (via Supabase CLI)
npx supabase status       # Check connection
npx supabase db push      # Push migrations
```

## Troubleshooting

### "Can't connect to Supabase"
- Check NEXT_PUBLIC_SUPABASE_URL format
- Verify API keys in Supabase dashboard
- Ensure tables exist (run migration again)

### "Google Photos not importing"
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- Check redirect URI matches exactly
- Enable Google Photos Library API in Google Cloud

### "Map not showing"
- Check browser console for errors
- Verify Leaflet CSS in layout.tsx
- Ensure Leaflet is properly imported

### "Port 3000 already in use"
```bash
npm run dev -- -p 3001  # Use different port
```

## Next Steps

1. **Customize Design**
   - Edit Tailwind colors in `tailwind.config.ts`
   - Modify component styles in `components/`

2. **Deploy to Vercel**
   - Follow [DEPLOYMENT.md](./DEPLOYMENT.md)
   - Push to GitHub
   - Import to Vercel
   - Set environment variables

3. **Add Features**
   - Implement API routes
   - Add new components
   - Extend database schema

## File Structure Quick Reference

```
pinspot/
├── app/                    # Pages and layouts
│   ├── page.tsx           # Home page
│   ├── layout.tsx         # Root layout
│   ├── dashboard/         # User dashboard
│   ├── auth/              # Auth pages
│   └── map/[username]/    # Public profile
├── components/            # Reusable components
│   ├── map/              # Map components
│   └── dashboard/        # Dashboard components
├── lib/                   # Utilities and helpers
│   ├── supabase.ts       # DB client
│   └── google-photos.ts  # Google API
└── supabase/             # Database migrations
    └── migrations/
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public API key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin API key | `eyJ...` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | `xxx` |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | `http://localhost:3000/auth/callback` |
| `NEXTAUTH_SECRET` | Auth encryption key | `random-string` |
| `NEXTAUTH_URL` | App base URL | `http://localhost:3000` |

## Testing Checklist

- [ ] App loads on `http://localhost:3000`
- [ ] Can sign up with email
- [ ] Can sign up with Google
- [ ] Can add pin by clicking map
- [ ] Can edit pin details
- [ ] Can add tags to pin
- [ ] Can view map with pins
- [ ] Can see statistics on dashboard
- [ ] Can visit public profile
- [ ] Google Photos import works (optional)

## Performance Tips

- Use Chrome DevTools to monitor performance
- Check Network tab for slow requests
- Monitor console for JavaScript errors
- Test on mobile devices
- Use Lighthouse for audits

## Getting Help

1. **Check Documentation**
   - README.md - Project overview
   - DEPLOYMENT.md - Deployment guide
   - API_ROUTES.md - API documentation

2. **Common Issues**
   - See Troubleshooting section above
   - Check GitHub issues
   - Review error messages in console

3. **Resources**
   - [Next.js Docs](https://nextjs.org/docs)
   - [Supabase Docs](https://supabase.com/docs)
   - [Leaflet Docs](https://leafletjs.com/)
   - [Google Photos API](https://developers.google.com/photos)

## What's Next?

After getting the app running locally:

1. **Explore the code** - Review components and understand structure
2. **Customize styling** - Update Tailwind config and CSS
3. **Deploy to production** - Follow DEPLOYMENT.md guide
4. **Add features** - Build on top of existing functionality
5. **Optimize performance** - Profile and improve speed

Happy mapping! 🗺️
