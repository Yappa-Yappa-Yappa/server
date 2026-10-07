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

### `POST /auth/logout` — public

Clear the refresh-token cookie. The endpoint does not currently require an access token.

### `POST /auth/forgot-password`

Request a password-reset link with `{ "email": "user@example.com" }`. The response is intentionally generic so it does not reveal whether the email is registered.

### `POST /auth/reset-password`

Set a new password with:

```json
{
  "token": "password-reset-token",
  "newPassword": "NewPassword1!"
}
```

## Posts

Post and comment image uploads use `multipart/form-data` with the `images` field. Posts accept up to 5 images; comment endpoints accept up to 3.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/posts` | Yes | Create a post with optional `content` and `images` |
| GET | `/posts` | Yes | List the authenticated user's feed |
| GET | `/posts/following` | Yes | List posts from users followed by the authenticated user |
| GET | `/posts/:id` | No | Get one post and its images |
| PUT | `/posts/:id` | Yes | Update the owner's post; accepts `content` and optional `images` |
| DELETE | `/posts/:id` | Yes | Delete the owner's post |

Post list and detail responses include `_count.likes`, `_count.comments`, and `_count.reposts`.

## Reposts

Reposts create a relationship between the authenticated user and an existing post. A user can repost a post only once.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/posts/:postId/repost` | Yes | Repost a post |
| DELETE | `/posts/:postId/repost` | Yes | Remove the authenticated user's repost |
| GET | `/posts/:postId/repost/status` | Yes | Return whether the authenticated user has reposted the post |
| GET | `/posts/user/:username/reposts` | Yes | List a user's reposts, newest first |

`POST /posts/:postId/repost` returns `409` if the authenticated user has already reposted the post. The status endpoint returns a boolean in `data`.

## Comments

The post comment list returns only top-level comments ordered by creation time. Each comment includes `_count.replies`. A reply references the comment it answers through `parentId`; open the comment thread endpoint to retrieve replies.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/posts/:postId/comments` | Yes | Add a comment or reply with optional `content`, `images`, and `parentId` |
| GET | `/posts/:postId/comments` | Yes | List top-level comments for a post with reply counts, like state, and bookmark state |
| GET | `/comments/:id` | No | Get one comment and its images |
| GET | `/comments/:id/thread` | Yes | Get a comment and its direct replies in chronological order with like/bookmark state |
| PATCH | `/comments/:id` | Yes | Update the owner's comment; accepts `content` and optional `images` |
| DELETE | `/comments/:id` | Yes | Delete the owner's comment |

To create a reply, include the parent comment ID. The parent must exist and belong to the same post:

```json
{
  "content": "This is a reply",
  "parentId": "comment-id"
}
```

Omit `parentId` for a top-level comment. A top-level comment notifies the post author; a reply notifies the parent comment author. Users are not notified of their own comments or replies.

Comment likes use `/comments/:commentId/like`. Comment bookmarks use `/comments/:commentId/favorite` and require authentication for both POST and DELETE.

## Likes

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/posts/:postId/like` | Yes | Like a post |
| GET | `/posts/:postId/likes` | No | List post likes and count |
| DELETE | `/posts/:postId/like` | Yes | Unlike a post |
| POST | `/comments/:commentId/like` | Yes | Like a comment |
| GET | `/comments/:commentId/likes` | No | List comment likes and count |
| DELETE | `/comments/:commentId/like` | Yes | Unlike a comment |

## Favorites

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/posts/:postId/favorite` | Yes | Add a post to the authenticated user's favorites |
| GET | `/posts/user/favorites` | Yes | List the authenticated user's favorited posts |
| DELETE | `/posts/:postId/favorite` | Yes | Remove a post from the authenticated user's favorites |
| POST | `/comments/:commentId/favorite` | Yes | Bookmark a comment or reply |
| DELETE | `/comments/:commentId/favorite` | Yes | Remove a comment or reply bookmark |

## Follows

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/follows/:userId/follow` | Yes | Follow a user |
| DELETE | `/follows/:userId/unfollow` | Yes | Unfollow a user |
| GET | `/follows/:username/followers` | Yes | Get a user's followers, count, and viewer follow state |
| GET | `/follows/:username/following` | Yes | Get users followed by a user, count, and viewer follow state |

## Notifications

Notifications are generated when another user likes a post/comment, comments on a post, follows the user, or reposts the user's post. Users do not receive notifications for their own actions.

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
| GET | `/user/:username/comments` | Yes | List the user's top-level comments on other users' posts |
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
