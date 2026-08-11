# CyberChat 🔐

A production-ready mobile-first secure messenger with premium cyber dark theme, glassmorphism UI, and end-to-end encryption architecture.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Animation:** Framer Motion
- **State:** Zustand
- **Auth:** Clerk (with webhook sync)
- **Real-time Chat:** Stream Chat SDK
- **Voice/Video:** Stream Video SDK
- **Database:** PostgreSQL + Prisma ORM
- **Validation:** Zod + React Hook Form
- **PWA:** Manifest + Service Worker

## Features

- 🛡️ Clerk Authentication (email/Google/GitHub)
- 💬 Real-time 1-on-1 & Group Chat
- 📞 Voice & Video Calls (Stream Video)
- 👥 Friends System (requests, accept/reject)
- 🔍 User Search by Cyber ID
- 📸 Story/Status Sharing
- 🔔 Push-style Notifications
- 🎨 Premium Dark Cyber Theme
- 📱 Mobile-First Responsive Design
- 🔒 E2E Encryption-Ready Architecture
- 🚫 Block/Report User System
- 📁 File & Image Sharing

## Prerequisites

- Node.js 20.9+
- PostgreSQL database
- Clerk account (https://clerk.com)
- Stream Chat account (https://getstream.io)
- UploadThing account (https://uploadthing.com)

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_STREAM_KEY` | Stream Chat public key |
| `STREAM_SECRET` | Stream Chat secret |
| `UPLOADTHING_SECRET` | UploadThing secret |
| `UPLOADTHING_APP_ID` | UploadThing app ID |

## Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed database (optional)
npx prisma db seed

# Start development server
npm run dev
```

## Clerk Webhook Setup

1. Go to Clerk Dashboard > Webhooks
2. Add endpoint: `https://your-domain.com/api/auth/webhook`
3. Subscribe to `user.created`, `user.updated`, `user.deleted`
4. Copy the signing secret to `CLERK_WEBHOOK_SECRET` in `.env.local`

## Project Structure

```
├── prisma/
│   └── schema.prisma          # Database models
├── public/
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service worker
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login/Signup pages
│   │   ├── (main)/            # Authenticated pages
│   │   │   ├── chats/         # Chat dashboard & rooms
│   │   │   ├── friends/       # Friends management
│   │   │   ├── calls/         # Call history
│   │   │   ├── notifications/ # Notifications
│   │   │   ├── settings/      # App settings
│   │   │   ├── groups/        # Group chats
│   │   │   └── profile/       # User profiles
│   │   ├── api/               # REST API routes
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── shared/            # Shared app components
│   │   ├── chat/              # Chat-specific components
│   │   ├── calls/             # Call-specific components
│   │   ├── groups/            # Group-specific components
│   │   └── profile/           # Profile-specific components
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   ├── api.ts             # API client
│   │   └── utils.ts           # Utility functions
│   ├── store/
│   │   ├── chat-store.ts      # Chat state (Zustand)
│   │   └── ui-store.ts        # UI state (Zustand)
│   └── types/
│       └── index.ts           # TypeScript types
└── proxy.ts                   # Clerk auth middleware
```

## Security

- All API routes are protected with Clerk authentication
- Webhook signatures are verified with Svix
- Input validation on all endpoints
- Rate limiting on sensitive actions
- Block/report system for abuse prevention
- E2E encryption-ready message architecture

## License

MIT
