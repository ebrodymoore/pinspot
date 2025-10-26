# Supabase Setup Guide for Pinspot

## Database Migration Fix

The initial schema migration has been updated to work with standard Supabase PostgreSQL without requiring PostGIS extension (though it can be enabled if desired).

### What Changed

**Original Issue:**
```sql
CREATE INDEX IF NOT EXISTS idx_pins_location ON pins USING GIST (
  ST_Point(longitude, latitude)::geography
);
```

This requires PostGIS extension which must be explicitly enabled in Supabase.

**Current Solution:**
```sql
CREATE INDEX IF NOT EXISTS idx_pins_latitude ON pins(latitude);
CREATE INDEX IF NOT EXISTS idx_pins_longitude ON pins(longitude);
```

This uses standard B-tree indexes on latitude/longitude for efficient filtering and sorting, which works out of the box.

### How to Run the Migration

#### Option 1: Using Supabase UI (Recommended for Beginners)

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
5. Paste it into the query editor
6. Click **Run** (or press Cmd+Enter / Ctrl+Enter)
7. Wait for success message
8. Verify all tables were created

#### Option 2: Using Supabase CLI (For Advanced Users)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

#### Option 3: Using psql (Direct Database Access)

```bash
# Get your database connection string from Supabase settings
# Format: postgresql://username:password@host:5432/postgres

psql "your-connection-string" < supabase/migrations/001_initial_schema.sql
```

## Enabling PostGIS (Optional)

If you want to use advanced spatial queries in the future:

### Step 1: Enable PostGIS Extension

1. Go to **SQL Editor** → **New Query**
2. Run:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Step 2: Create Spatial Index (Optional)

After enabling PostGIS, you can create the spatial index:

```sql
CREATE INDEX IF NOT EXISTS idx_pins_location ON pins USING GIST (
  ST_Point(longitude, latitude)::geography
);
```

### Using PostGIS Queries

Example: Find all pins within 10km of a location

```sql
SELECT * FROM pins
WHERE ST_DistanceSphere(
  ST_Point(longitude, latitude),
  ST_Point(-122.4194, 37.7749)
) < 10000;  -- 10km in meters
```

## Verifying Your Schema

After running the migration, verify everything was created:

### Check Tables

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Should show:
- import_jobs
- photos
- pins
- tags
- users

### Check Indexes

```sql
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY indexname;
```

Should show all idx_* indexes

### Check RLS Policies

```sql
SELECT * FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Should show policies for all 5 tables

### Check Triggers

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

Should show:
- update_users_updated_at
- update_pins_updated_at

## Troubleshooting

### Error: "syntax error at or near '::'"

**Cause:** Using PostGIS syntax without extension enabled
**Solution:** Either:
1. Enable PostGIS extension first: `CREATE EXTENSION postgis;`
2. Or use the updated migration file (already done ✓)

### Error: "relation 'users' does not exist"

**Cause:** Migration hasn't run or failed partially
**Solution:**
1. Check error messages in Supabase SQL Editor
2. Try running migration again
3. If persistent, delete all tables and run migration fresh

### Error: "RLS policies missing"

**Cause:** RLS not enabled or policies failed to create
**Solution:**
```sql
-- Check RLS status
SELECT * FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- Manually re-enable if needed
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
```

## Performance Considerations

### Index Strategy

The schema includes indexes on:
- **Foreign keys** (user_id, pin_id) - for JOINs
- **Coordinates** (latitude, longitude) - for spatial queries
- **Common filters** (visit_date, tag_name, status) - for searches
- **Unique fields** (username, google_photo_id) - for lookups

### RLS Performance

RLS policies use EXISTS clauses which are optimized by PostgreSQL query planner. Performance impact is minimal (< 5% on typical queries).

### When to Add More Indexes

Add more indexes if you have queries that:
- Scan large tables without using existing indexes
- Have many LIKE/ILIKE patterns on TEXT fields
- Do range queries on numeric fields frequently

Monitor with:
```sql
-- Find missing indexes
SELECT * FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;
```

## Backup & Restore

### Automatic Backups

Supabase automatically backs up daily:
1. Go to **Settings** → **Backups**
2. View backup history
3. Download manual backup anytime

### Manual Backup

```bash
# Export entire database
pg_dump "postgresql://user:password@host:5432/postgres" > backup.sql

# Export specific table
pg_dump -t users "postgresql://user:password@host:5432/postgres" > users_backup.sql
```

### Restore from Backup

```bash
# Restore entire database
psql "postgresql://user:password@host:5432/postgres" < backup.sql

# Restore specific table
psql "postgresql://user:password@host:5432/postgres" < users_backup.sql
```

## Environment Variables

After running migrations, you'll need these from Supabase Settings → API:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
```

Add these to your `.env.local` file.

## Testing the Connection

### From Next.js Application

```typescript
import { supabase } from '@/lib/supabase';

async function testConnection() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Connection failed:', error);
  } else {
    console.log('Connection successful!');
  }
}
```

### From Supabase SQL Editor

```sql
-- Test all tables exist and are accessible
SELECT
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM pins) as pins_count,
  (SELECT COUNT(*) FROM photos) as photos_count,
  (SELECT COUNT(*) FROM tags) as tags_count,
  (SELECT COUNT(*) FROM import_jobs) as jobs_count;
```

## Storage Bucket Setup

After running migrations, create a storage bucket for photos:

1. Go to **Storage** in Supabase dashboard
2. Click **Create bucket**
3. Name: `photos`
4. Uncheck "Public bucket" (for private photos)
5. Click **Create**

### Storage RLS Policy (Optional)

```sql
-- Allow users to upload to their own pin folders
CREATE POLICY "Users can upload to photos bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (auth.uid()::text = (string_to_array(name, '/'))[1]);

-- Allow public viewing of public user photos
CREATE POLICY "Public photos are viewable"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'photos' AND (
      auth.uid()::text = (string_to_array(name, '/'))[1]
      OR auth.role() = 'authenticated'
    )
  );
```

## Maintenance Tasks

### Weekly
- Monitor database size in Settings → Usage
- Check for failed backups

### Monthly
- Analyze slow queries: `ANALYZE;`
- Review database performance metrics
- Check for unused indexes

### Quarterly
- Vacuum unused space: `VACUUM ANALYZE;`
- Review RLS policies for correctness
- Test backup restoration

## Getting Help

If you encounter issues:

1. **Check Supabase Status**: https://status.supabase.com
2. **Read Logs**: SQL Editor shows detailed error messages
3. **Check Documentation**: https://supabase.com/docs
4. **Review Migration File**: `supabase/migrations/001_initial_schema.sql`
5. **Test Manually**: Use SQL Editor to debug individual queries

## Next Steps

After successfully running migrations:

1. ✅ Schema created with 5 tables
2. ✅ RLS policies enabled
3. ✅ Indexes created for performance
4. ✅ Ready for application code

See [QUICKSTART.md](./QUICKSTART.md) to continue setup.
