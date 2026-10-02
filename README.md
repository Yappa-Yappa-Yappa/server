# Yappa Server

The Yappa backend is an Express 5 API using Prisma, PostgreSQL, JWT authentication, Cloudinary uploads, email services, and Socket.IO for real-time chat.

## Requirements

- Node.js 18 or newer
- PostgreSQL
- Cloudinary account for media uploads
- OAuth credentials if social login is enabled

## Setup

Install dependencies:

```bash
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Fill in the values in `.env`. Never commit `.env` or any secret values.

## Database

Prisma schema and migrations are stored in `prisma/`:

```bash
npx prisma migrate dev
npx prisma generate
```

Run `npx prisma generate` after schema-only changes. Use a migration when changing the database structure.

After pulling migrations, stop any running server process before applying them and regenerating Prisma Client:

```bash
npx prisma migrate dev
npx prisma generate
```

## Development

Start the API with hot reload:

```bash
npm run dev
```

Start normally:

```bash
npm start
```

The server listens on the port configured by `PORT` in `.env`.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Express with nodemon |
| `npm start` | Start Express normally |
| `npm test` | Not configured; exits with a failure status |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix supported ESLint issues |

## Source structure

```text
src/
├── config/       # Environment and external service configuration
├── controllers/  # Thin HTTP request handlers
├── middlewares/  # Auth, uploads, rate limiting, and error handling
├── routes/       # API route definitions
├── services/     # Business logic and database operations
├── utils/        # Shared helpers
└── validators/   # Zod request validation
```

Controllers should delegate business logic to services. Authenticated resources should use `verifyToken` and scope database queries to `req.user.id`.

## Environment variables

See `.env.example` for the complete list. Important groups include:

- PostgreSQL connection: `DATABASE_URL`
- Server and CORS: `PORT`, `FRONTEND_URL`, `NODE_ENV`
- JWT authentication: `ACCESS_SECRET`, `REFRESH_SECRET`, `JWT_EXPIRES_IN`
- Uploads: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Email delivery: `BREVO_*`
- Google login: `GOOGLE_CLIENT_ID`

## Security

- Keep `.env` out of version control.
- Keep JWT secrets, database credentials, Cloudinary secrets, email keys, and OAuth client secrets on the server.
- Do not trust client-provided user IDs for authenticated operations; use the verified token user.
