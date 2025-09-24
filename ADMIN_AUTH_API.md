# Admin Authentication API Documentation

## Overview

This API provides authentication functionality for both regular admins and super admins. The system supports:

- **Regular Admin Login**: Admins created by super admin can login with username/password
- **Super Admin Login**: Super admin can login with credentials from environment variables
- **Role-based Access Control**: Different middleware for different access levels
- **Password Management**: Admins can change their own passwords

## Authentication Middleware

### 1. `authenticateToken`
- **Purpose**: Basic JWT token verification
- **Usage**: General purpose authentication

### 2. `authenticateAdmin`
- **Purpose**: Allows both super admin and regular admin access
- **Usage**: Routes that should be accessible by both admin types
- **Features**: 
  - Verifies admin still exists in database
  - Provides admin data in `req.user.adminData`

### 3. `authenticateSuperAdmin`
- **Purpose**: Only allows super admin access
- **Usage**: Routes that should only be accessible by super admin
- **Features**: Strict role checking

## API Endpoints

### Base URL: `/api/admin`

### 1. Admin Login
**POST** `/login`

**Request Body:**
```json
{
  "username": "admin_username",
  "password": "admin_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin login successful",
  "token": "jwt_token_here",
  "user": {
    "_id": "admin_id",
    "username": "admin_username",
    "phoneNumber": "1234567890",
    "district": "District Name",
    "area": "Area Name",
    "role": "admin"
  }
}
```

### 2. Get Admin Profile
**GET** `/profile`

**Headers:** `Authorization: Bearer <token>`

**Response for Regular Admin:**
```json
{
  "success": true,
  "message": "Admin profile retrieved",
  "data": {
    "_id": "admin_id",
    "username": "admin_username",
    "phoneNumber": "1234567890",
    "district": "District Name",
    "area": "Area Name"
  }
}
```

**Response for Super Admin:**
```json
{
  "success": true,
  "message": "Super admin profile retrieved",
  "data": {
    "username": "superadmin",
    "role": "superadmin",
    "type": "superadmin"
  }
}
```

### 3. Change Admin Password
**PUT** `/change-password`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### 4. Update Admin Profile
**PUT** `/profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "username": "updated_username",
  "phoneNumber": "1234567890",
  "district": "Updated District",
  "area": "Updated Area"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin profile updated successfully",
  "data": {
    "_id": "admin_id",
    "username": "updated_username",
    "phoneNumber": "1234567890",
    "district": "Updated District",
    "area": "Updated Area",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Super Admin Endpoints

### Base URL: `/api/superadmin`

### 1. Super Admin Login
**POST** `/login`

**Request Body:**
```json
{
  "username": "superadmin",
  "password": "super_admin_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Super admin login successful",
  "token": "jwt_token_here",
  "user": {
    "username": "superadmin",
    "role": "superadmin"
  }
}
```

### 2. Create Admin
**POST** `/admin`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "username": "new_admin",
  "phoneNumber": "1234567890",
  "password": "admin_password",
  "district": "District Name",
  "area": "Area Name"
}
```

### 3. Get All Admins
**GET** `/admin`

**Headers:** `Authorization: Bearer <token>`

### 4. Get Single Admin
**GET** `/admin/:id`

**Headers:** `Authorization: Bearer <token>`

### 5. Delete Admin
**DELETE** `/admin/:id`

**Headers:** `Authorization: Bearer <token>`

## JWT Token Structure

### Regular Admin Token
```json
{
  "adminId": "admin_database_id",
  "username": "admin_username",
  "role": "admin",
  "type": "admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Super Admin Token
```json
{
  "username": "superadmin",
  "role": "superadmin",
  "type": "superadmin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## Error Responses

### Authentication Error (401)
```json
{
  "success": false,
  "message": "Access token required"
}
```

### Authorization Error (403)
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

### Invalid Credentials (401)
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### Admin Not Found (401)
```json
{
  "success": false,
  "message": "Admin account not found"
}
```

## Usage Examples

### 1. Regular Admin Login
```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin1", "password": "admin123"}'
```

### 2. Get Admin Profile
```bash
curl -X GET http://localhost:5000/api/admin/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Change Admin Password
```bash
curl -X PUT http://localhost:5000/api/admin/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"currentPassword": "old123", "newPassword": "new123"}'
```

### 4. Update Admin Profile
```bash
curl -X PUT http://localhost:5000/api/admin/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"username": "updated_admin", "phoneNumber": "1234567890", "district": "Central", "area": "Downtown"}'
```

### 5. Super Admin Login
```bash
curl -X POST http://localhost:5000/api/superadmin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "superadmin", "password": "super_password"}'
```

## Security Features

1. **JWT Authentication**: All protected routes require valid JWT tokens
2. **Role-based Access**: Different middleware for different access levels
3. **Password Hashing**: All passwords are hashed using bcrypt
4. **Token Expiration**: Tokens expire after 24 hours
5. **Input Validation**: All inputs are validated before processing
6. **Database Verification**: Admin tokens are verified against database records

## Middleware Usage Guide

### For Routes Accessible by Both Admin Types
```javascript
const { authenticateAdmin } = require('../middleware/auth');

router.get('/some-route', authenticateAdmin, (req, res) => {
    // Accessible by both super admin and regular admin
    if (req.user.role === 'superadmin') {
        // Super admin specific logic
    } else if (req.user.role === 'admin') {
        // Regular admin specific logic
        const adminData = req.user.adminData; // Admin details
    }
});
```

### For Super Admin Only Routes
```javascript
const { authenticateSuperAdmin } = require('../middleware/auth');

router.post('/admin-only', authenticateSuperAdmin, (req, res) => {
    // Only accessible by super admin
});
```

### For General Authentication
```javascript
const { authenticateToken } = require('../middleware/auth');

router.get('/general', authenticateToken, (req, res) => {
    // Basic token verification
});
``` 