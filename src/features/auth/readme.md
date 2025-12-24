# Authentication API Documentation

## Base URL

```
http://localhost:3000/api/v1/auth
```

## Table of Contents

- [Overview](#overview)
- [Authentication Flow](#authentication-flow)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [Public Endpoints](#public-endpoints)
  - [Protected Endpoints](#protected-endpoints)
- [Token Management](#token-management)
- [User Types](#user-types)
- [Code Examples](#code-examples)

---

## Overview

The Authentication API provides complete user authentication and authorization functionality including:

- **Email/Password Authentication**: Signup, login, email verification
- **Google OAuth**: Sign in with Google using Firebase
- **Guest Access**: Continue as guest without registration
- **Password Management**: Forgot password, reset password, change password
- **Profile Management**: Get and update user profile
- **Token Management**: JWT access tokens and refresh tokens

---

## Authentication Flow

### Standard Registration Flow

1. **Signup** → User creates account with email/password
2. **Verify OTP** → User verifies email with 6-digit OTP code
3. **Login** → User logs in with email/password
4. **Access Protected Routes** → Use access token in Authorization header

### Guest Flow

1. **Guest Login** → User continues as guest (no email/password required)
2. **Use App** → Guest can access app features
3. **Convert to Registered** (Optional) → Guest can convert to registered account later

### Google OAuth Flow

1. **Get Firebase ID Token** → Frontend authenticates with Google via Firebase
2. **Send ID Token** → Send Firebase ID token to backend
3. **Auto Signup/Login** → Backend creates account or logs in existing user
4. **Access Protected Routes** → Use access token in Authorization header

---

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  },
  "meta": {
    "version": "v1",
    "timestamp": 1234567890
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "data": null,
  "errors": [
    {
      "field": "email",
      "message": "Email is required",
      "code": "required",
      "value": null
    }
  ],
  "meta": {
    "version": "v1",
    "timestamp": 1234567890
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Error Handling

### HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists (e.g., email already registered)
- `422 Unprocessable Entity` - Validation errors
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Common Error Scenarios

**Invalid Credentials:**
```json
{
  "success": false,
  "message": "Invalid email or password",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email or password"
    }
  ]
}
```

**Validation Errors:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    }
  ]
}
```

**Token Expired:**
```json
{
  "success": false,
  "message": "Token expired. Please login again."
}
```

---

## Endpoints

### Public Endpoints

#### 1. Signup

Create a new user account.

**Endpoint:** `POST /signup`

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "phone": "+1234567890"
  }'
```

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "phone": "+1234567890",  // Optional
  "signupMethod": "EMAIL"   // Optional, default: "EMAIL"
}
```

**Validation Rules:**
- `username`: 3-30 characters, alphanumeric and underscores only
- `email`: Valid email format
- `password`: Minimum 8 characters, must contain uppercase, lowercase, and number
- `phone`: Optional, E.164 format (e.g., +1234567890)

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Please verify your email.",
  "data": {
    "user": {
      "id": "0f3f836b-014a-4d30-82ac-c9675a6dde56",
      "username": "johndoe",
      "email": "john@example.com",
      "isEmailVerified": false,
      "phone": null,
      "isPhoneVerified": false,
      "profilePicture": null,
      "role": "USER",
      "userType": "REGISTERED",
      "platformId": null,
      "signupMethod": "EMAIL",
      "isActive": true,
      "isDeleted": false,
      "deletedAt": null,
      "stripeCustomerId": null,
      "isSubscribed": false,
      "createdAt": "2025-12-24T15:53:24.862Z",
      "updatedAt": "2025-12-24T15:53:24.862Z"
    }
  },
  "timestamp": "2025-12-24T15:53:24.899Z"
}
```

**Error Response (409 Conflict) - Email Already Exists:**
```json
{
  "success": false,
  "message": "Email already exists",
  "data": null,
  "errors": [
    {
      "field": "email",
      "message": "Email already exists"
    }
  ],
  "timestamp": "2025-12-24T15:54:09.830Z"
}
```

**Error Response (422 Unprocessable Entity) - Validation Errors:**
```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "invalid_format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters long",
      "code": "too_small"
    },
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      "code": "invalid_format"
    }
  ],
  "timestamp": "2025-12-24T15:53:58.098Z"
}
```

**Note:** After signup, a 6-digit OTP code is sent to the user's email. The user must verify their email before they can access protected routes.

---

#### 2. Login

Authenticate an existing user.

**Endpoint:** `POST /login`

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "isEmailVerified": true,
      "userType": "REGISTERED",
      "role": "USER",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Response (401 Unauthorized) - Email Not Verified:**
```json
{
  "success": false,
  "message": "Please verify your email before logging in",
  "data": null,
  "errors": [
    {
      "field": "email",
      "message": "Please verify your email before logging in"
    }
  ],
  "timestamp": "2025-12-24T15:53:33.384Z"
}
```

**Error Responses:**
- `401` - Invalid email or password
- `401` - Email not verified (user must verify email first)
- `403` - Account is deactivated

---

#### 3. Guest Login

Continue as guest without registration.

**Endpoint:** `POST /guest`

**cURL Example:**
```bash
# With username
curl -X POST http://localhost:3000/api/v1/auth/guest \
  -H "Content-Type: application/json" \
  -d '{
    "username": "GuestUser"
  }'

# Without username (auto-generated)
curl -X POST http://localhost:3000/api/v1/auth/guest \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Request Body:**
```json
{
  "username": "GuestUser"  // Optional, auto-generated if not provided
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Guest login successful",
  "data": {
    "user": {
      "id": "df51a49b-06e8-427f-a3e3-1b1f81baa886",
      "username": "GuestUser",
      "email": "guest_1766591617264_s7z7wnb@guest.local",
      "isEmailVerified": true,
      "phone": null,
      "isPhoneVerified": false,
      "profilePicture": null,
      "role": "USER",
      "userType": "GUEST",
      "platformId": null,
      "signupMethod": "EMAIL",
      "isActive": true,
      "isDeleted": false,
      "deletedAt": null,
      "stripeCustomerId": null,
      "isSubscribed": false,
      "createdAt": "2025-12-24T15:53:37.350Z",
      "updatedAt": "2025-12-24T15:53:37.350Z"
    },
    "token": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRmNTFhNDliLTA2ZTgtNDI3Zi1hM2UzLTFiMWY4MWJhYTg4NiIsImVtYWlsIjoiZ3Vlc3RfMTc2NjU5MTYxNzI2NF9zN3o3d25iQGd1ZXN0LmxvY2FsIiwicm9sZSI6IlVTRVIiLCJpYXQiOjE3NjY1OTE2MTcsImV4cCI6MTc2NjU5NTIxNywiYXVkIjoibm9kZS1tb25nb2RiLXRlbXBsYXRlIiwiaXNzIjoibm9kZS1tb25nb2RiLXRlbXBsYXRlIn0.d8F0aiard1Nhf8gnGKGZlga09mDVigVTrA3Xjae5nvM",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRmNTFhNDliLTA2ZTgtNDI3Zi1hM2UzLTFiMWY4MWJhYTg4NiIsImVtYWlsIjoiZ3Vlc3RfMTc2NjU5MTYxNzI2NF9zN3o3d25iQGd1ZXN0LmxvY2FsIiwicm9sZSI6IlVTRVIiLCJpYXQiOjE3NjY1OTE2MTcsImV4cCI6MTc2NzE5NjQxNywiYXVkIjoibm9kZS1tb25nb2RiLXRlbXBsYXRlIiwiaXNzIjoibm9kZS1tb25nb2RiLXRlbXBsYXRlIn0.7qaX9BdGmHQFq0Vca_lqv5XyunMsnOQf9V1UC6OxYxs"
    }
  },
  "timestamp": "2025-12-24T15:53:37.368Z"
}
```

**Note:** Guest users don't need email verification and can access protected routes immediately. They can convert to registered accounts later.

---

#### 4. Google OAuth

Sign in or sign up with Google using Firebase.

**Endpoint:** `POST /google`

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "firebase_id_token_from_frontend",
    "username": "johndoe"
  }'
```

**Request Body:**
```json
{
  "idToken": "firebase_id_token_from_frontend",
  "username": "johndoe"  // Optional, uses Google display name if not provided
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Google authentication successful",
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@gmail.com",
      "isEmailVerified": true,
      "userType": "REGISTERED",
      "signupMethod": "GOOGLE",
      "profilePicture": "https://lh3.googleusercontent.com/...",
      "role": "USER",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Response (401 Unauthorized) - Invalid Token:**
```json
{
  "success": false,
  "message": "Invalid or expired Firebase token",
  "data": null,
  "errors": [],
  "timestamp": "2025-12-24T15:53:55.931Z"
}
```

**Frontend Integration:**
```javascript
// Using Firebase SDK
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const provider = new GoogleAuthProvider();
const result = await signInWithPopup(auth, provider);
const idToken = await result.user.getIdToken();

// Send to backend
const response = await fetch('http://localhost:3000/api/v1/auth/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken })
});
```

---

#### 5. Verify OTP

Verify email address or reset password with OTP code.

**Endpoint:** `POST /verify-otp`

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "otp": "123456",
    "type": "emailVerification"
  }'
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "type": "emailVerification"  // Optional: "emailVerification" (default) or "forgotPassword"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "isEmailVerified": true,
      "userType": "REGISTERED"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Response (400 Bad Request) - Invalid OTP:**
```json
{
  "success": false,
  "message": "Invalid or expired OTP code",
  "data": null,
  "errors": [
    {
      "field": "otp",
      "message": "Invalid or expired OTP code"
    }
  ],
  "timestamp": "2025-12-24T15:53:44.414Z"
}
```

**Error Responses:**
- `400` - Invalid or expired OTP
- `404` - User not found

---

#### 6. Resend OTP

Resend OTP code to user's email.

**Endpoint:** `POST /resend-otp`

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "type": "emailVerification"
  }'
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "type": "emailVerification"  // Optional: "emailVerification" (default) or "forgotPassword"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "message": "OTP code sent to your email"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Note:** If email sending fails (e.g., SMTP not configured), the endpoint will still return success but log an error. In production, ensure SMTP is properly configured.

---

#### 7. Forgot Password

Request password reset OTP code.

**Endpoint:** `POST /forgot-password`

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset code sent",
  "data": {
    "message": "OTP code sent to your email"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Note:** If email sending fails (e.g., SMTP not configured), the endpoint will still return success but log an error. In production, ensure SMTP is properly configured.

---

#### 8. Reset Password

Reset password using OTP code.

**Endpoint:** `POST /reset-password`

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "NewSecurePass123"
  }'
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "NewSecurePass123"
}
```

**Note:** OTP must be verified first using `/verify-otp` with `type: "forgotPassword"`.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "john@example.com"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

#### 9. Refresh Token

Get a new access token using refresh token.

**Endpoint:** `POST /refresh-token`

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "user": {
      "id": "df51a49b-06e8-427f-a3e3-1b1f81baa886",
      "username": "UpdatedGuest",
      "email": "guest_1766591617264_s7z7wnb@guest.local",
      "isEmailVerified": true,
      "phone": null,
      "isPhoneVerified": false,
      "profilePicture": null,
      "role": "USER",
      "userType": "GUEST",
      "platformId": null,
      "signupMethod": "EMAIL",
      "isActive": true,
      "isDeleted": false,
      "deletedAt": null,
      "stripeCustomerId": null,
      "isSubscribed": false,
      "createdAt": "2025-12-24T15:53:37.350Z",
      "updatedAt": "2025-12-24T15:53:51.245Z"
    },
    "token": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRmNTFhNDliLTA2ZTgtNDI3Zi1hM2UzLTFiMWY4MWJhYTg4NiIsImVtYWlsIjoiZ3Vlc3RfMTc2NjU5MTYxNzI2NF9zN3o3d25iQGd1ZXN0LmxvY2FsIiwicm9sZSI6IlVTRVIiLCJpYXQiOjE3NjY1OTE2MzMsImV4cCI6MTc2NjU5NTIzMywiYXVkIjoibm9kZS1tb25nb2RiLXRlbXBsYXRlIiwiaXNzIjoibm9kZS1tb25nb2RiLXRlbXBsYXRlIn0.eYvRxMkSudDjUpl_Z904DRiA7_bde-s6GPARG2ISJhQ",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRmNTFhNDliLTA2ZTgtNDI3Zi1hM2UzLTFiMWY4MWJhYTg4NiIsImVtYWlsIjoiZ3Vlc3RfMTc2NjU5MTYxNzI2NF9zN3o3d25iQGd1ZXN0LmxvY2FsIiwicm9sZSI6IlVTRVIiLCJpYXQiOjE3NjY1OTE2MzMsImV4cCI6MTc2NzE5NjQzMywiYXVkIjoibm9kZS1tb25nb2RiLXRlbXBsYXRlIiwiaXNzIjoibm9kZS1tb25nb2RiLXRlbXBsYXRlIn0.xytv2GWg1-qeNd100D2j4W6Pb-cNoeamKqlwejDpVLQ"
    }
  },
  "timestamp": "2025-12-24T15:53:53.146Z"
}
```

**Note:** Refresh tokens may be rotated for security. Always use the new refresh token returned in the response. The response also includes the updated user object.

**Error Responses:**
- `401` - Invalid or expired refresh token
- `401` - Refresh token has been blacklisted (user logged out)

---

### Protected Endpoints

All protected endpoints require an `Authorization` header with a valid access token:

```
Authorization: Bearer <access_token>
```

---

#### 10. Get Current User

Get authenticated user's profile.

**Endpoint:** `GET /me`

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <access_token>"
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "df51a49b-06e8-427f-a3e3-1b1f81baa886",
      "username": "GuestUser",
      "email": "guest_1766591617264_s7z7wnb@guest.local",
      "isEmailVerified": true,
      "phone": null,
      "isPhoneVerified": false,
      "profilePicture": null,
      "role": "USER",
      "userType": "GUEST",
      "platformId": null,
      "signupMethod": "EMAIL",
      "isActive": true,
      "isDeleted": false,
      "deletedAt": null,
      "stripeCustomerId": null,
      "isSubscribed": false,
      "createdAt": "2025-12-24T15:53:37.350Z",
      "updatedAt": "2025-12-24T15:53:37.364Z"
    }
  },
  "timestamp": "2025-12-24T15:53:48.869Z"
}
```

**Error Response (401 Unauthorized) - Missing Token:**
```json
{
  "success": false,
  "message": "Authentication required. Please login.",
  "data": null,
  "errors": [],
  "timestamp": "2025-12-24T15:54:07.643Z"
}
```

**Error Response (401 Unauthorized) - Invalid Token:**
```json
{
  "success": false,
  "message": "Invalid or expired token. Please login again.",
  "data": null,
  "errors": [],
  "timestamp": "2025-12-24T15:54:05.546Z"
}
```

**Error Responses:**
- `401` - Invalid or expired token
- `401` - Email not verified (for registered users only, guests are exempt)

---

#### 11. Update Profile

Update user profile information.

**Endpoint:** `PUT /profile`

**cURL Example:**
```bash
curl -X PUT http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newusername",
    "phone": "+1234567890",
    "profilePicture": "https://example.com/avatar.jpg"
  }'
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "username": "newusername",      // Optional
  "phone": "+1234567890",         // Optional
  "profilePicture": "https://example.com/avatar.jpg"  // Optional, must be valid URL
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "df51a49b-06e8-427f-a3e3-1b1f81baa886",
      "username": "UpdatedGuest",
      "email": "guest_1766591617264_s7z7wnb@guest.local",
      "isEmailVerified": true,
      "phone": null,
      "isPhoneVerified": false,
      "profilePicture": null,
      "role": "USER",
      "userType": "GUEST",
      "platformId": null,
      "signupMethod": "EMAIL",
      "isActive": true,
      "isDeleted": false,
      "deletedAt": null,
      "stripeCustomerId": null,
      "isSubscribed": false,
      "createdAt": "2025-12-24T15:53:37.350Z",
      "updatedAt": "2025-12-24T15:53:51.245Z"
    }
  },
  "timestamp": "2025-12-24T15:53:51.249Z"
}
```

---

#### 12. Change Password

Change password for authenticated user.

**Endpoint:** `PUT /change-password`

**cURL Example:**
```bash
curl -X PUT http://localhost:3000/api/v1/auth/change-password \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "OldSecurePass123",
    "newPassword": "NewSecurePass123"
  }'
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "OldSecurePass123",
  "newPassword": "NewSecurePass123"
}
```

**Validation Rules:**
- `newPassword`: Minimum 8 characters, must contain uppercase, lowercase, and number

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "message": "Password updated successfully"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `400` - Current password is incorrect
- `400` - New password validation failed

---

#### 13. Logout

Logout user and blacklist refresh token.

**Endpoint:** `POST /logout`

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": {
    "message": "Logged out successfully"
  },
  "timestamp": "2025-12-24T15:54:03.222Z"
}
```

**Note:** After logout, the refresh token is blacklisted and cannot be used to refresh the access token.

---

#### 14. Convert Guest to Registered

Convert guest account to registered account.

**Endpoint:** `POST /convert-guest`

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/convert-guest \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123",
    "username": "johndoe"
  }'
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123",
  "username": "johndoe"  // Optional, uses current username if not provided
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Account converted to registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "isEmailVerified": false,
      "userType": "REGISTERED",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Note:** After conversion, the user must verify their email address. A verification OTP is sent automatically.

**Error Responses:**
- `400` - User is already registered
- `409` - Email already exists

---

## Token Management

### Access Token

- **Type:** JWT (JSON Web Token)
- **Expiration:** 1 hour (configurable via `JWT_EXPIRES_IN`)
- **Usage:** Include in `Authorization` header for protected endpoints
- **Format:** `Bearer <access_token>`

### Refresh Token

- **Type:** JWT (JSON Web Token)
- **Expiration:** 7 days (configurable via `JWT_REFRESH_EXPIRES_IN`)
- **Usage:** Use to get new access tokens when expired
- **Rotation:** May be rotated for security (use new token from response)

### Token Storage Recommendations

**Frontend Storage:**
- **Access Token:** Store in memory (JavaScript variable) or secure HTTP-only cookie
- **Refresh Token:** Store in secure HTTP-only cookie or secure storage (e.g., Keychain on iOS, Keystore on Android)

**⚠️ Security Best Practices:**
- Never store tokens in `localStorage` or `sessionStorage` (vulnerable to XSS)
- Use HTTPS in production
- Implement token refresh logic before expiration
- Clear tokens on logout

### Token Refresh Flow

```javascript
// Example token refresh implementation
async function refreshAccessToken() {
  const refreshToken = getRefreshToken(); // From secure storage
  
  try {
    const response = await fetch('http://localhost:3000/api/v1/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    if (response.ok) {
      const data = await response.json();
      // Update tokens
      setAccessToken(data.data.token.accessToken);
      setRefreshToken(data.data.token.refreshToken); // May be rotated
      return data.data.token.accessToken;
    } else {
      // Refresh token expired or invalid - redirect to login
      logout();
      throw new Error('Refresh token expired');
    }
  } catch (error) {
    logout();
    throw error;
  }
}

// Intercept 401 responses and refresh token
async function apiCall(url, options = {}) {
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${getAccessToken()}`
    }
  });
  
  if (response.status === 401) {
    // Token expired, try to refresh
    const newAccessToken = await refreshAccessToken();
    // Retry original request with new token
    response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${newAccessToken}`
      }
    });
  }
  
  return response;
}
```

---

## User Types

### REGISTERED

- Standard user account with email/password or Google OAuth
- Requires email verification before accessing protected routes
- Can manage profile, change password, etc.

### GUEST

- Temporary account created without email/password
- No email verification required
- Can access protected routes immediately
- Can convert to registered account later
- Guest email format: `guest_{timestamp}_{random}@guest.local`

---

## Code Examples

### React/TypeScript Example

```typescript
// auth.service.ts
const API_BASE_URL = 'http://localhost:3000/api/v1/auth';

interface SignupData {
  username: string;
  email: string;
  password: string;
  phone?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token?: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export const authService = {
  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async guestLogin(username?: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    return response.json();
  },

  async verifyOtp(email: string, otp: string, type: 'emailVerification' | 'forgotPassword' = 'emailVerification'): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, type }),
    });
    return response.json();
  },

  async getMe(accessToken: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return response.json();
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    return response.json();
  },

  async logout(accessToken: string, refreshToken: string): Promise<void> {
    await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
  },
};
```

### React Hook Example

```typescript
// useAuth.ts
import { useState, useEffect } from 'react';
import { authService } from './auth.service';

interface User {
  id: string;
  username: string;
  email: string;
  isEmailVerified: boolean;
  userType: 'GUEST' | 'REGISTERED';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load tokens from secure storage
    const token = getAccessTokenFromStorage();
    if (token) {
      setAccessToken(token);
      // Verify token and get user
      authService.getMe(token)
        .then((response) => {
          if (response.success) {
            setUser(response.data.user);
          } else {
            // Token invalid, clear storage
            clearTokens();
          }
        })
        .catch(() => clearTokens())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    if (response.success && response.data.token) {
      setAccessToken(response.data.token.accessToken);
      setUser(response.data.user);
      saveTokens(response.data.token);
      return response;
    }
    throw new Error(response.message);
  };

  const guestLogin = async (username?: string) => {
    const response = await authService.guestLogin(username);
    if (response.success && response.data.token) {
      setAccessToken(response.data.token.accessToken);
      setUser(response.data.user);
      saveTokens(response.data.token);
      return response;
    }
    throw new Error(response.message);
  };

  const logout = async () => {
    const refreshToken = getRefreshTokenFromStorage();
    if (accessToken && refreshToken) {
      await authService.logout(accessToken, refreshToken);
    }
    clearTokens();
    setUser(null);
    setAccessToken(null);
  };

  return {
    user,
    accessToken,
    loading,
    login,
    guestLogin,
    logout,
    isAuthenticated: !!user,
    isGuest: user?.userType === 'GUEST',
  };
}
```

### Axios Interceptor Example

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
});

// Request interceptor - add access token
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        const response = await axios.post('/auth/refresh-token', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data.data.token;

        // Update tokens
        setAccessToken(accessToken);
        setRefreshToken(newRefreshToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Window:** 15 minutes (configurable)
- **Max Requests:** 100 requests per window (configurable)
- **Response:** `429 Too Many Requests` when limit exceeded

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## Idempotency

The `/signup` endpoint supports idempotency to prevent duplicate signups. Include an idempotency key in the request header:

```
Idempotency-Key: unique-key-here
```

If the same key is used within a short time window, the original response will be returned instead of creating a duplicate account.

---

## Quick Reference - cURL Commands

### Public Endpoints

```bash
# Signup
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","email":"john@example.com","password":"SecurePass123"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePass123"}'

# Guest Login
curl -X POST http://localhost:3000/api/v1/auth/guest \
  -H "Content-Type: application/json" \
  -d '{"username":"GuestUser"}'

# Google OAuth
curl -X POST http://localhost:3000/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"firebase_id_token"}'

# Verify OTP
curl -X POST http://localhost:3000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","otp":"123456"}'

# Resend OTP
curl -X POST http://localhost:3000/api/v1/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com"}'

# Forgot Password
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com"}'

# Reset Password
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"NewSecurePass123"}'

# Refresh Token
curl -X POST http://localhost:3000/api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"your_refresh_token"}'
```

### Protected Endpoints

```bash
# Get Current User
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <access_token>"

# Update Profile
curl -X PUT http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"username":"newusername"}'

# Change Password
curl -X PUT http://localhost:3000/api/v1/auth/change-password \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"OldPass123","newPassword":"NewPass123"}'

# Logout
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"your_refresh_token"}'

# Convert Guest to Registered
curl -X POST http://localhost:3000/api/v1/auth/convert-guest \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePass123"}'
```

---

## Support

For issues or questions, please contact the backend team or refer to the main project documentation.

