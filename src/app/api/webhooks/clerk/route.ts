import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { syncUser } from '@/lib/db/sync-user'

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || ''

export async function POST(req: Request) {
  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  let evt: any
  try {
    const wh = new Webhook(webhookSecret)
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as any
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  const eventType = evt.type

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const data = evt.data
    await syncUser({
      id: data.id,
      email: data.email_addresses?.[0]?.email_address || '',
      username: data.username || '',
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      imageUrl: data.image_url || '',
    })
  }

  return NextResponse.json({ ok: true })
}
