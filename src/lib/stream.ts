import { StreamChat } from 'stream-chat'

let serverClient: StreamChat | null = null

export function getStreamServer() {
  if (serverClient) return serverClient
  const key = process.env.NEXT_PUBLIC_STREAM_KEY!
  const secret = process.env.STREAM_SECRET!
  serverClient = StreamChat.getInstance(key, secret)
  return serverClient
}

export async function upsertStreamUser(userId: string, name: string, image?: string) {
  const client = getStreamServer()
  await client.upsertUser({
    id: userId,
    name,
    image: image || undefined,
  })
}

export function generateStreamToken(userId: string) {
  const client = getStreamServer()
  return client.createToken(userId)
}
