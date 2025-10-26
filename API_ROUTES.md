# API Routes Documentation

## Authentication Routes

### GET `/auth/callback`
Handles OAuth callback from Google and Supabase.

**Query Parameters:**
- `code` - Authorization code from OAuth provider

**Behavior:**
1. Exchanges code for session tokens
2. Creates user profile if new user
3. Redirects to onboarding page

**Response:** Redirects to `/onboarding` or `/auth/login?error=...`

## Google Photos Routes

### POST `/api/google-photos/import`
Initiates the Google Photos import process.

**Headers:**
- `Authorization: Bearer <session_token>` (from Supabase Auth)

**Request Body:**
```json
{
  "dateRange": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-12-31T23:59:59Z"
  }
}
```

**Response:**
```json
{
  "jobId": "uuid",
  "status": "pending",
  "message": "Import job created"
}
```

**Behavior:**
1. Validates user authentication
2. Creates import job record
3. Queues background import task
4. Returns job ID for polling

### GET `/api/google-photos/progress/:jobId`
Get progress of an import job.

**Parameters:**
- `jobId` - UUID of import job

**Response:**
```json
{
  "jobId": "uuid",
  "status": "processing",
  "photosImported": 45,
  "pinsCreated": 12,
  "progress": 65
}
```

### GET `/api/google-photos/callback`
OAuth callback handler for Google Photos API.

**Query Parameters:**
- `code` - Authorization code
- `state` - State parameter for CSRF protection

**Behavior:**
1. Exchanges code for tokens
2. Encrypts and stores refresh token in database
3. Redirects to import flow

## Pin Management Routes

### POST `/api/pins`
Create a new pin.

**Headers:**
- `Authorization: Bearer <session_token>`

**Request Body:**
```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "location_name": "San Francisco, USA",
  "visit_date": "2024-06-15",
  "notes": "Amazing trip to SF",
  "source": "manual"
}
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "location_name": "San Francisco, USA",
  "visit_date": "2024-06-15",
  "notes": "Amazing trip to SF",
  "source": "manual",
  "created_at": "2024-10-26T12:00:00Z",
  "updated_at": "2024-10-26T12:00:00Z"
}
```

### GET `/api/pins`
Get all pins for authenticated user.

**Headers:**
- `Authorization: Bearer <session_token>`

**Query Parameters:**
- `sort` - 'date_asc' | 'date_desc' (default: 'date_desc')
- `limit` - Number of results (default: 100)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "pins": [
    {
      "id": "uuid",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "location_name": "San Francisco, USA",
      "visit_date": "2024-06-15",
      "notes": "Amazing trip to SF",
      "source": "manual",
      "created_at": "2024-10-26T12:00:00Z",
      "photos": [
        {
          "id": "uuid",
          "storage_path": "pins/uuid/photo1.jpg",
          "display_order": 0,
          "taken_date": "2024-06-15T10:30:00Z"
        }
      ],
      "tags": [
        {
          "id": "uuid",
          "tag_name": "city"
        }
      ]
    }
  ],
  "total": 45
}
```

### GET `/api/pins/:pinId`
Get a specific pin.

**Headers:**
- `Authorization: Bearer <session_token>`

**Response:** Single pin object (same structure as GET /api/pins)

### PUT `/api/pins/:pinId`
Update a pin.

**Headers:**
- `Authorization: Bearer <session_token>`

**Request Body:**
```json
{
  "location_name": "Updated location",
  "visit_date": "2024-06-16",
  "notes": "Updated notes"
}
```

**Response:** Updated pin object

### DELETE `/api/pins/:pinId`
Delete a pin (and all associated photos/tags).

**Headers:**
- `Authorization: Bearer <session_token>`

**Response:**
```json
{
  "success": true,
  "message": "Pin deleted successfully"
}
```

## Photo Management Routes

### POST `/api/pins/:pinId/photos`
Upload a photo to a pin.

**Headers:**
- `Authorization: Bearer <session_token>`
- `Content-Type: multipart/form-data`

**Form Data:**
- `file` - Image file
- `display_order` - Position in photo carousel (optional)

**Response:**
```json
{
  "id": "uuid",
  "pin_id": "uuid",
  "storage_path": "pins/uuid/photo-uuid.jpg",
  "display_order": 0,
  "taken_date": null,
  "created_at": "2024-10-26T12:00:00Z"
}
```

### PUT `/api/pins/:pinId/photos/:photoId`
Update photo metadata.

**Headers:**
- `Authorization: Bearer <session_token>`

**Request Body:**
```json
{
  "display_order": 0,
  "taken_date": "2024-06-15T10:30:00Z"
}
```

**Response:** Updated photo object

### DELETE `/api/pins/:pinId/photos/:photoId`
Delete a photo.

**Headers:**
- `Authorization: Bearer <session_token>`

**Response:**
```json
{
  "success": true,
  "message": "Photo deleted successfully"
}
```

## Tag Management Routes

### POST `/api/pins/:pinId/tags`
Add a tag to a pin.

**Headers:**
- `Authorization: Bearer <session_token>`

**Request Body:**
```json
{
  "tag_name": "restaurant"
}
```

**Response:**
```json
{
  "id": "uuid",
  "pin_id": "uuid",
  "tag_name": "restaurant",
  "created_at": "2024-10-26T12:00:00Z"
}
```

### DELETE `/api/pins/:pinId/tags/:tagId`
Remove a tag from a pin.

**Headers:**
- `Authorization: Bearer <session_token>`

**Response:**
```json
{
  "success": true,
  "message": "Tag removed successfully"
}
```

## User Profile Routes

### GET `/api/user`
Get current user profile.

**Headers:**
- `Authorization: Bearer <session_token>`

**Response:**
```json
{
  "id": "uuid",
  "username": "johndoe",
  "email": "john@example.com",
  "is_public": true,
  "created_at": "2024-10-26T12:00:00Z"
}
```

### PUT `/api/user`
Update user profile.

**Headers:**
- `Authorization: Bearer <session_token>`

**Request Body:**
```json
{
  "username": "newusername",
  "is_public": true
}
```

**Response:** Updated user object

### GET `/api/user/stats`
Get user travel statistics.

**Headers:**
- `Authorization: Bearer <session_token>`

**Response:**
```json
{
  "totalPins": 45,
  "totalPhotos": 234,
  "countriesVisited": 12,
  "citiesVisited": 28,
  "dateRange": {
    "earliest": "2023-01-15T00:00:00Z",
    "latest": "2024-10-26T00:00:00Z"
  },
  "tagBreakdown": [
    {
      "tag_name": "restaurant",
      "count": 15
    }
  ]
}
```

## Public Routes

### GET `/api/user/:username`
Get public profile information.

**Response:**
```json
{
  "username": "johndoe",
  "is_public": true,
  "created_at": "2024-10-26T12:00:00Z",
  "stats": {
    "totalPins": 45,
    "totalPhotos": 234,
    "countriesVisited": 12,
    "citiesVisited": 28
  }
}
```

### GET `/api/user/:username/pins`
Get public pins for a user.

**Query Parameters:**
- `limit` - Number of results (default: 100)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "pins": [
    {
      "id": "uuid",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "location_name": "San Francisco, USA",
      "visit_date": "2024-06-15",
      "notes": "Amazing trip to SF",
      "source": "manual",
      "photos": [],
      "tags": []
    }
  ],
  "total": 45
}
```

## Error Responses

All endpoints return appropriate HTTP status codes:

### 400 Bad Request
```json
{
  "error": "Invalid request body",
  "message": "Field 'location_name' is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required",
  "message": "Valid session token required"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied",
  "message": "You do not have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Pin with ID 'xyz' not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting

All routes are rate limited:

- **Authentication routes:** 10 requests per minute per IP
- **API routes:** 100 requests per minute per user
- **Public routes:** 1000 requests per hour per IP

Rate limit info is returned in response headers:
- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Pagination

For list endpoints, use standard pagination:

```
GET /api/pins?limit=20&offset=0
GET /api/pins?limit=20&offset=20
```

Response includes:
- `items`: Array of results
- `total`: Total number of items
- `limit`: Limit used
- `offset`: Offset used
- `hasMore`: Boolean indicating if more results exist

## Sorting

Where applicable, use `sort` parameter:

```
GET /api/pins?sort=date_asc
GET /api/pins?sort=date_desc
GET /api/pins?sort=name_asc
```

## Filtering

Use query parameters for filtering:

```
GET /api/pins?tags=restaurant,museum
GET /api/pins?country=USA
GET /api/pins?dateFrom=2024-01-01&dateTo=2024-12-31
```

## Webhook Events (Future Enhancement)

Plan to add webhook support for:
- `pin.created`
- `pin.updated`
- `pin.deleted`
- `photo.imported`
- `import.completed`

Configuration available at `/api/webhooks/configure`
