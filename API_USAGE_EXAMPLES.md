# Trip API Usage Examples

This document provides examples of how to use the Trip API endpoints.

## Base URL
```
http://localhost:5000/api/trips
```

## Endpoints

### 1. Create Trip (POST /)
**Authentication Required: Admin**

```javascript
// Form Data (multipart/form-data)
const formData = new FormData();
formData.append('name', 'Himalayan Adventure Trek');
formData.append('description', 'Experience the breathtaking beauty of the Himalayas with our guided trek.');
formData.append('from', 'Delhi');
formData.append('to', 'Manali');
formData.append('category', 'BACKPACKING TRIPS');
formData.append('category', 'TWO DAYS TREK'); // Multiple categories
formData.append('image', fileInput.files[0]); // Image file

// Itinerary (JSON string)
const itinerary = [
  {
    day: 1,
    activities: ['Arrival in Manali', 'Check-in to hotel', 'Local sightseeing']
  },
  {
    day: 2,
    activities: ['Trek to base camp', 'Evening bonfire', 'Overnight camping']
  }
];
formData.append('itinerary', JSON.stringify(itinerary));

fetch('/api/trips', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  },
  body: formData
});
```

### 2. Get All Trips (GET /)
**Public Endpoint**

```javascript
// Basic request
fetch('/api/trips')

// With filtering and pagination
fetch('/api/trips?category=BACKPACKING TRIPS&from=Delhi&page=1&limit=5')

// Multiple categories
fetch('/api/trips?category=BACKPACKING TRIPS&category=SUNRISE TREKS')
```

**Query Parameters:**
- `category`: Filter by category (can be multiple)
- `from`: Filter by departure location (case-insensitive partial match)
- `to`: Filter by destination (case-insensitive partial match)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

### 3. Get Trip by ID (GET /:id)
**Public Endpoint**

```javascript
fetch('/api/trips/64f8a1b2c3d4e5f6a7b8c9d0')
```

### 4. Update Trip (PUT /:id)
**Authentication Required: Admin**

```javascript
// Form Data (multipart/form-data)
const formData = new FormData();
formData.append('name', 'Updated Trip Name');
formData.append('description', 'Updated description');
// Only include fields you want to update
// Include new image file if you want to update the image
formData.append('image', newImageFile);

fetch('/api/trips/64f8a1b2c3d4e5f6a7b8c9d0', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  },
  body: formData
});
```

### 5. Delete Trip (DELETE /:id)
**Authentication Required: Admin**

```javascript
fetch('/api/trips/64f8a1b2c3d4e5f6a7b8c9d0', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  }
});
```

### 6. Get Trip Categories (GET /categories)
**Public Endpoint**

```javascript
fetch('/api/trips/categories')
```

## Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Trip created successfully!",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Himalayan Adventure Trek",
    "description": "Experience the breathtaking beauty...",
    "from": "Delhi",
    "to": "Manali",
    "category": ["BACKPACKING TRIPS", "TWO DAYS TREK"],
    "itinerary": [
      {
        "day": 1,
        "activities": ["Arrival in Manali", "Check-in to hotel"]
      }
    ],
    "fileName": "trip_1234567890_image.jpg",
    "url": "https://ik.imagekit.io/your-id/trips/trip_1234567890_image.jpg",
    "fileId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "bookings": [],
    "createdAt": "2023-09-06T10:30:00.000Z",
    "updatedAt": "2023-09-06T10:30:00.000Z"
  }
}
```

### Paginated Response (GET /)
```json
{
  "success": true,
  "data": [...trips],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalTrips": 47,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Error Response
```json
{
  "message": "Missing required fields",
  "required": ["name", "description", "from", "to", "category"]
}
```

## Available Categories
- BACKPACKING TRIPS
- SUNRISE TREKS
- ONE DAY TRIPS
- INTERNATIONAL TRIPS
- WOMEN TRIPS
- LONG WEEKEND
- WATER SPORTS
- TWO DAYS TREK

## Notes

1. **Image Upload**: Images are uploaded to ImageKit.io and organized in the `/trips` folder
2. **Authentication**: Admin routes require a valid JWT token in the Authorization header
3. **Validation**: All required fields are validated, and category values must match the enum
4. **Error Handling**: Comprehensive error handling with specific error messages
5. **Pagination**: Default pagination is 10 items per page
6. **Filtering**: Case-insensitive partial matching for location fields
7. **Image Management**: Old images are automatically deleted when updating or deleting trips
8. **Booking Protection**: Trips with existing bookings cannot be deleted