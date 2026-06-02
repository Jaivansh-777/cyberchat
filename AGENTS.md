<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Build Commands
- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run lint` - Run ESLint
- `npx cap sync android` - Sync Capacitor after build (for APK)

## Environment Variables Required
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key
- `CLERK_WEBHOOK_SECRET` - Clerk webhook signing secret
- `NEXT_PUBLIC_STREAM_KEY` - Stream Chat API key
- `STREAM_SECRET` - Stream Chat secret
- `DATABASE_URL` - PostgreSQL (Neon) connection string
- `NEXT_PUBLIC_APP_URL` - Deployed app URL (for Capacitor)

## APK Generation
1. `npm run build` - Build Next.js
2. `npx cap sync android` - Sync web to native
3. `cd android && ./gradlew assembleDebug` - Generate debug APK
4. APK at `android/app/build/outputs/apk/debug/app-debug.apk`

## Key Architecture
- Clerk handles authentication (sign-in/sign-up, session management)
- Prisma + Neon PostgreSQL for user data (User model with clerkId, cyberId)
- Stream Chat handles real-time messaging via client SDK
- Stream Video SDK handles voice/video calls
- All API routes protected by Clerk `auth()` middleware
- Middleware protects all routes except `/sign-in`, `/sign-up`, `/api/webhooks`
- User sync happens via Clerk webhook (`user.created` / `user.updated`) and on-demand via `/api/user/me`
- Friendship system uses Stream Chat `friend_requests` channel with structured messages
- Status system uses Stream Chat `status_updates` channel with 24h filter
- Capacitor config reads `NEXT_PUBLIC_APP_URL` from env

## Clerk Setup
- Sign-in/Sign-up at `/sign-in` and `/sign-up`
- Webhook endpoint: `/api/webhooks/clerk`
- After sign-in redirect: `/chats`
- After sign-out redirect: `/sign-in`
