const BASE_URL = ''

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}/api${endpoint}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: `API error: ${res.status}` }))
    throw new Error(error.message || `API error: ${res.status}`)
  }

  return res.json()
}

export const api = {
  user: {
    me: () => fetchAPI<{ id: string; cyberId: string; username: string; displayName: string; avatarUrl: string; email: string }>('/user/me'),
    avatar: (formData: FormData) =>
      fetchAPI<{ avatarUrl: string }>('/user/avatar', { method: 'POST', body: formData, headers: {} }),
    lastSeen: () => fetchAPI<{ ok: boolean }>('/user/last-seen', { method: 'POST' }),
  },
  friends: {
    list: () => fetchAPI<{ friends: { clerkId: string; cyberId: string; name: string; avatar: string; lastSeen: string; since: string }[] }>('/friends/list'),
    incoming: () => fetchAPI<{ requests: { id: string; senderId: string; senderName: string; senderCyberId: string; senderAvatar: string; createdAt: string }[] }>('/friends/incoming'),
    outgoing: () => fetchAPI<{ requests: { id: string; receiverId: string; receiverName: string; receiverCyberId: string; receiverAvatar: string; createdAt: string }[] }>('/friends/outgoing'),
    send: (toCyberId: string) =>
      fetchAPI<{ requestId: string; status: string }>('/friends/send', { method: 'POST', body: JSON.stringify({ toCyberId }) }),
    accept: (requestId: string) =>
      fetchAPI<{ ok: boolean; dmChannelId: string; friendId: string }>('/friends/accept', { method: 'POST', body: JSON.stringify({ requestId }) }),
    decline: (requestId: string) =>
      fetchAPI<{ ok: boolean }>('/friends/decline', { method: 'POST', body: JSON.stringify({ requestId }) }),
    cancel: (toCyberId: string) =>
      fetchAPI<{ ok: boolean }>('/friends/cancel', { method: 'POST', body: JSON.stringify({ toCyberId }) }),
    remove: (friendClerkId: string) =>
      fetchAPI<{ ok: boolean }>('/friends/remove', { method: 'POST', body: JSON.stringify({ friendClerkId }) }),
    findUser: (cyberId: string) =>
      fetchAPI<{ found: boolean; user: { id: string; cyberId: string; name: string; image: string } }>(`/friends/find-user?cyberId=${encodeURIComponent(cyberId)}`),
  },
  stream: {
    token: () => fetchAPI<{ token: string; user: { id: string; cyberId: string; name: string; image: string } }>('/stream/token', { method: 'POST' }),
    createDm: (targetUserId: string) =>
      fetchAPI<{ channelId: string; channelType: string }>('/stream/create-dm', { method: 'POST', body: JSON.stringify({ targetUserId }) }),
    join: () => fetchAPI<{ joined: number; created: number }>('/stream/join', { method: 'POST', body: JSON.stringify({}) }),
  },
  groups: {
    myGroups: () => fetchAPI<{ groups: any[] }>('/groups/my-groups'),
    create: (data: { name: string; description?: string }) =>
      fetchAPI<{ group: any }>('/groups/create', { method: 'POST', body: JSON.stringify(data) }),
    info: (groupId: string) => fetchAPI<{ group: any }>(`/groups/info?groupId=${encodeURIComponent(groupId)}`),
    join: (inviteCode: string) =>
      fetchAPI<{ ok: boolean }>('/groups/join', { method: 'POST', body: JSON.stringify({ inviteCode }) }),
    addMember: (groupId: string, clerkId: string) =>
      fetchAPI<{ ok: boolean }>('/groups/add-member', { method: 'POST', body: JSON.stringify({ groupId, clerkId }) }),
    removeMember: (groupId: string, clerkId: string) =>
      fetchAPI<{ ok: boolean }>('/groups/remove-member', { method: 'POST', body: JSON.stringify({ groupId, clerkId }) }),
  },
  calls: {
    history: () => fetchAPI<{ logs: any[] }>('/calls/history'),
    log: (data: { receiverId: string; callType: string; status: string; duration?: number }) =>
      fetchAPI<{ ok: boolean }>('/calls/log', { method: 'POST', body: JSON.stringify(data) }),
  },
}
