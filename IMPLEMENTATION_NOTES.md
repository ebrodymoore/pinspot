# Implementation Notes

## Architecture Overview

### Technology Decisions

#### Frontend: Next.js 14
- **Why**: Full-stack framework with App Router, built-in API routes, excellent TypeScript support
- **Trade-offs**: Larger bundle size, but faster development
- **Alternative considered**: Vue.js + Nuxt (simpler but less ecosystem support)

#### Database: PostgreSQL via Supabase
- **Why**: Powerful relational database with PostGIS for spatial queries, built-in auth
- **Trade-offs**: Requires SQL knowledge, but more flexible than Firebase
- **Alternative considered**: MongoDB (simpler schema but slower geospatial queries)

#### Maps: Leaflet
- **Why**: Lightweight, open-source, works with OpenStreetMap
- **Trade-offs**: Fewer features than Google Maps, but privacy-friendly
- **Alternative considered**: Mapbox (prettier but commercial)

#### Google Photos Integration
- **Why**: Most users have Google Photos, read-only prevents data loss
- **Trade-offs**: Requires OAuth setup, Google API complexity
- **Alternative considered**: Flickr API, OneDrive API

### Design Patterns

#### Client-Side State
- Using React hooks for component state
- Supabase client for real-time updates
- Future: Consider React Query for data fetching

#### Server-Side Operations
- Route handlers in `/app/api` for server-side logic
- Supabase client with service role for admin operations
- No NextAuth implementation yet (planned for future)

#### Authentication Flow
```
User → Google OAuth → Supabase Auth → Session Token → App Access
```

#### Photo Import Flow
```
User → OAuth Consent → Google Photos API → Download Photos →
Extract EXIF → Cluster by Location → Reverse Geocode →
Create Pins → Upload to Supabase → Update UI
```

## Implementation Decisions

### Why No Marker Clustering Library Wrapper
- Using raw Leaflet.MarkerCluster for more control
- Manual cluster configuration allows customization
- React integration is minimal for this feature

### Why Manual Reverse Geocoding
- Using Nominatim (OpenStreetMap) instead of Google Maps
- Keeps costs low, respects open data principles
- Slower but acceptable for non-real-time use

### Why Single Storage Bucket
- All photos in one `photos` bucket for simplicity
- Path structure: `pins/{pinId}/{photoId}.jpg`
- Easier to implement cleanup on pin deletion
- Could split into public/private buckets if needed

### Why Clustering Happens Client-Side
- Prevents multiple API calls during import
- Users can verify before finalizing
- Easier to debug and test

### Why Row-Level Security Over Application Layer
- Data security at database level
- Less code to write
- More difficult to accidentally expose data
- RLS policies are enforced even for direct DB access

## Known Issues & Workarounds

### Issue 1: Leaflet with React Strict Mode
**Problem**: React 18 Strict Mode double-mounts components, causing duplicate maps
**Workaround**: Map initialization checks if map already exists with `mapRef.current`
**Future Fix**: Extract map to separate component with `use client` directive

### Issue 2: Google Photos API Rate Limiting
**Problem**: Google Photos API has rate limits and no public documentation
**Workaround**: Batch requests with 1-second delays between batches
**Future Fix**: Implement exponential backoff with Retry-After headers

### Issue 3: EXIF Data Not in Google Photos API Response
**Problem**: Google Photos API doesn't return EXIF data directly
**Workaround**: Would need to download full photo and extract EXIF locally
**Current Implementation**: Assumed location metadata in geoLocation field
**Limitation**: Only works for photos taken with location services enabled

### Issue 4: Marker Cluster Not Responsive on Mobile
**Problem**: Touch events on clustered markers sometimes don't work
**Workaround**: Use L.Browser detection for mobile optimizations
**Future Fix**: Custom mobile-optimized cluster click handler

## Performance Considerations

### Database Queries
```sql
-- Optimized with indexes
SELECT * FROM pins WHERE user_id = ? ORDER BY visit_date DESC;
-- Uses: idx_pins_user_id, idx_pins_visit_date

SELECT * FROM photos WHERE pin_id IN (?, ?, ?);
-- Uses: idx_photos_pin_id

SELECT DISTINCT tag_name FROM tags WHERE pin_id IN (?, ?, ?);
-- Uses: idx_tags_pin_id
```

### Frontend Optimization
1. **Lazy Load Map**: Only load Leaflet when map page is visited
2. **Marker Clustering**: Automatically clusters at zoom < 16
3. **Image Optimization**: Use next/image for responsive images
4. **Code Splitting**: Route-based code splitting via Next.js

### API Response Times
- Get user pins: ~200-300ms
- Create pin: ~150-200ms
- Upload photo: ~500-1000ms (depending on size)
- Google Photos API call: ~1-2 seconds

## Testing Strategy

### Unit Tests Needed
- [ ] Geocoding utilities
- [ ] Photo clustering algorithm
- [ ] Date range calculations
- [ ] Pin validation

### Integration Tests Needed
- [ ] Authentication flow
- [ ] Pin CRUD operations
- [ ] Photo upload/download
- [ ] Google Photos import workflow

### E2E Tests Needed
- [ ] Complete user signup → import → view map flow
- [ ] Public profile access
- [ ] Pin editing workflow

### Manual Testing Checklist
- [ ] Add pin on desktop
- [ ] Add pin on mobile
- [ ] Import photos (need test Google Photos account)
- [ ] Edit pin details
- [ ] Delete pin
- [ ] Upload additional photos
- [ ] View public profile
- [ ] Search and filter
- [ ] Map controls (zoom, locate)

## Security Considerations

### Implemented
- ✅ Row-Level Security on all tables
- ✅ API authentication via Supabase sessions
- ✅ Password hashing by Supabase Auth
- ✅ HTTPS in production (Vercel)
- ✅ Environment variables for secrets
- ✅ Google OAuth token refresh handling

### Not Yet Implemented
- ⚠️ CSRF protection (needed for POST routes)
- ⚠️ Rate limiting (basic but not comprehensive)
- ⚠️ Audit logging
- ⚠️ Data encryption at rest (Supabase provides)
- ⚠️ DDoS protection (Vercel provides basic)

### Recommendations
1. Enable Google Photos token encryption in environment
2. Add request signing for webhook verification
3. Implement audit logging for sensitive operations
4. Add IP whitelisting for admin API
5. Set up security headers middleware

## Scalability Considerations

### Database Scaling
- Current: Single Supabase project (handles ~1M rows easily)
- When to scale: > 10M photos or 100K+ users
- Options: Database replication, read replicas, sharding

### Storage Scaling
- Current: Single Supabase storage bucket
- Estimated: Can handle ~500GB per bucket
- When to scale: Storage approaching 400GB
- Options: Multiple buckets, CDN caching

### API Scaling
- Current: Vercel serverless functions
- Auto-scales: Can handle 1000+ concurrent requests
- When to scale: > 10K requests/minute consistently
- Options: Reserved capacity, edge functions

### Google Photos API Scaling
- Current: Batch processing with 1-second delays
- Rate limit: ~100 requests/second
- When to scale: > 10K photos/day imports
- Options: Queue system (Bull, AWS SQS), worker threads

## Code Quality

### TypeScript Coverage
- ✅ Strict mode enabled in tsconfig.json
- ✅ All database tables have types
- ✅ API responses typed
- ⚠️ Some `any` types in legacy code (should refactor)

### ESLint Configuration
- Enabled: Next.js recommended rules
- Disabled: none
- Future: Add stricter rules (airbnb-typescript)

### Code Style
- Function declarations: Named for debugging
- Component naming: PascalCase for components
- File naming: camelCase for utilities, PascalCase for components
- Import ordering: React, third-party, local

## Future Enhancements

### High Priority
1. **API Routes** - Implement REST API for pin/photo management
2. **Error Boundaries** - Add error handling for map component
3. **Loading States** - Better UX during data fetching
4. **Mobile UX** - Optimize touch interactions

### Medium Priority
1. **Advanced Search** - Full-text search on location names
2. **Photo Viewer** - Full-screen carousel with lightbox
3. **Trip Planning** - Create and manage trip itineraries
4. **Export** - Download data as GPX, GeoJSON, CSV
5. **Real-time Sync** - Supabase real-time subscriptions

### Low Priority
1. **Social Features** - Follows, likes, comments
2. **Mobile App** - React Native version
3. **Offline Support** - Service workers for offline mode
4. **AI Features** - Automatic tag suggestions
5. **Integration** - Slack, Twitter sharing

## Deployment Notes

### Pre-Deployment Checklist
- [ ] All environment variables set in Vercel
- [ ] Database migrations run on production
- [ ] RLS policies tested
- [ ] Google OAuth credentials configured
- [ ] Storage bucket created and configured
- [ ] HTTPS certificate valid
- [ ] Build succeeds locally: `npm run build`

### Monitoring After Deployment
- [ ] Check Vercel Analytics dashboard
- [ ] Monitor Supabase database performance
- [ ] Review error logs in console
- [ ] Test critical user flows
- [ ] Monitor uptime with status page

### Rollback Procedure
1. If code issue: Redeploy previous commit in Vercel
2. If database issue: Restore from Supabase backup
3. If config issue: Update environment variables

## Cost Estimation (Monthly)

### Supabase (Free Tier includes)
- 500MB database storage ✓
- 1GB file storage ✓
- 50K API calls ✓
- Unlimited auth ✓

### Vercel (Free Tier includes)
- Unlimited deployments ✓
- 100GB bandwidth ✓
- Serverless functions ✓
- All features ✓

### Estimated Production Costs (100K users)
- Supabase Pro: ~$25/month (additional storage/API)
- Vercel Pro: ~$20/month (increased limits)
- Domain: ~$12/year
- Google Cloud (minimal): ~$0 (free tier)
- **Total: ~$50/month**

## Documentation Links

- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Guide](https://supabase.com/docs)
- [Leaflet API](https://leafletjs.com/reference.html)
- [Google Photos Library API](https://developers.google.com/photos/library/guides)
- [Nominatim API](https://nominatim.org/release-docs/latest/api/Reverse/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Contributing Guidelines

When contributing to this project:

1. **Code Style**: Follow existing patterns in codebase
2. **Commits**: Use descriptive commit messages
3. **Testing**: Test changes locally before pushing
4. **Documentation**: Update README if adding features
5. **Performance**: Consider performance impact of changes
6. **Security**: Never commit secrets or sensitive data

## License

This project is MIT licensed. See LICENSE file for details.
