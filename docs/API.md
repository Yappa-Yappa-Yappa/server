# API documentation

Base URL: `/api`

Successful responses use `{ "status": "success", "data": ... }`. Errors use `{ "success": false, "message": "..." }` unless noted otherwise.

Protected endpoints require `Authorization: Bearer <access-token>`. The refresh token is stored in an HTTP-only `refreshToken` cookie after login.

## Health

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | No | Check API status, uptime, and timestamp |

## Authentication

### `POST /auth/register`

Create an account.

```json
{
  "name": "Yappa User",
  "email": "user@example.com",
  "password": "Password1!"
}
```

Password requirements: at least 8 characters, one letter, one number, and one special character.

### `POST /auth/login`

Authenticate with `{ "email": "user@example.com", "password": "Password1!" }`. Returns the user and access token, and sets the refresh-token cookie.

### `POST /auth/google`

Authenticate with a Google Identity Services credential:

```json
{
  "credential": "google-id-token"
}
```

The backend verifies the credential against `GOOGLE_CLIENT_ID`, then returns the user and access token.

### `POST /auth/refresh`

Use the `refreshToken` cookie to receive a new access token.

### `POST /auth/logout` — protected

Clear the refresh-token cookie.

## Posts

Post and comment image uploads use `multipart/form-data` with the `images` field. Posts accept up to 5 images; comment endpoints accept up to 3.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/posts` | Yes | Create a post with optional `content` and `images` |
| GET | `/posts` | Yes | List the authenticated user's feed |
| GET | `/posts/:id` | No | Get one post and its images |
| PUT | `/posts/:id` | Yes | Update the owner's post; accepts `content` and optional `images` |
| DELETE | `/posts/:id` | Yes | Delete the owner's post |

## Comments

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/posts/:postId/comments` | Yes | Add a comment with optional `content` and `images` |
| GET | `/posts/:postId/comments` | No | List comments for a post |
| GET | `/comments/:id` | No | Get one comment and its images |
| PATCH | `/comments/:id` | Yes | Update the owner's comment; accepts `content` and optional `images` |
| DELETE | `/comments/:id` | Yes | Delete the owner's comment |

## Likes

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/posts/:postId/like` | Yes | Like a post |
| GET | `/posts/:postId/likes` | No | List post likes and count |
| DELETE | `/posts/:postId/like` | Yes | Unlike a post |
| POST | `/comments/:commentId/like` | Yes | Like a comment |
| GET | `/comments/:commentId/likes` | No | List comment likes and count |
| DELETE | `/comments/:commentId/like` | Yes | Unlike a comment |

## Follows

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/follows/:userId/follow` | Yes | Follow a user |
| DELETE | `/follows/:userId/unfollow` | Yes | Unfollow a user |
| GET | `/follows/:username/followers` | Yes | Get a user's followers, count, and viewer follow state |
| GET | `/follows/:username/following` | Yes | Get users followed by a user, count, and viewer follow state |

## Notifications

Notifications are generated when another user likes a post/comment, comments on a post, or follows the user. Users do not receive notifications for their own actions.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/notifications?page=1&limit=20&unreadOnly=true` | Yes | List the authenticated user's notifications; `limit` is capped at 100 |
| GET | `/notifications/unread-count` | Yes | Get the authenticated user's unread count |
| PATCH | `/notifications/:id/read` | Yes | Mark one notification as read |
| PATCH | `/notifications/read-all` | Yes | Mark all notifications as read |
| DELETE | `/notifications/:id` | Yes | Delete one notification |

## OTP

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/otps/request-otp` | No | Request an email verification or password-reset OTP |
| POST | `/otps/verify-otp` | No | Verify an OTP and complete the related flow |

## Users

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/user/:username` | Yes | Get a user's profile and viewer-specific relationship state |
| GET | `/user/me/activity` | Yes | Get recent activity for the authenticated user |
| PATCH | `/user/update-bio` | Yes | Update the authenticated user's bio |
| PATCH | `/user/update-name` | Yes | Update the authenticated user's display name |
| PATCH | `/user/update-username` | Yes | Update the authenticated user's username |
| PATCH | `/user/update-email` | Yes | Update the authenticated user's email |
| PATCH | `/user/update-password` | Yes | Update the authenticated user's password |
| PATCH | `/user/update-avatar` | Yes | Upload a new avatar using the `imageUrl` field |
| PATCH | `/user/update-background` | Yes | Upload a new background using the `bgUrl` field |

## Search

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/search?q=<term>` | No | Search users and posts by query text |

## Conversations

All conversation endpoints require authentication.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/conversations` | Yes | List the authenticated user's conversations |
| GET | `/conversations/unread-count` | Yes | Get the unread conversation count |
| POST | `/conversations/direct/:userId` | Yes | Get or create a direct conversation with a user |
| GET | `/conversations/:id/messages?page=1&limit=30` | Yes | Get paginated messages for a conversation |
| POST | `/conversations/:id/read` | Yes | Mark a conversation's messages as read |

## Real-time chat events

Socket.IO connections authenticate with the access token in the handshake auth object:

```js
io("http://localhost:6969", {
  auth: { token: accessToken }
});
```

| Event | Direction | Description |
| --- | --- | --- |
| `conversation:join` | Client to server | Join a conversation room |
| `conversation:leave` | Client to server | Leave a conversation room |
| `conversation:read` | Client to server | Mark messages as seen and update unread count |
| `conversation:unread-count` | Server to client | Receive the current unread conversation count |
| `message:send` | Client to server | Send a message with `conversationId`, `content`, and optional `clientMessageId` |
| `message:new` | Server to client | Receive a newly sent message |
| `message:delivered` | Client to server | Mark a received message as delivered |
| `message:status` | Server to client | Receive `delivered` or `seen` status updates for a message |
