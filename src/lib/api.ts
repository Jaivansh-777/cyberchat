const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message || `API error: ${res.status}`)
  }

  return res.json()
}

export const api = {
  users: {
    search: (query: string) =>
      fetchAPI<{ users: import('@/types').CyberUser[] }>(`/users/search?q=${encodeURIComponent(query)}`),
    getById: (id: string) =>
      fetchAPI<{ user: import('@/types').CyberUser }>(`/users/${id}`),
    getProfile: (id: string) =>
      fetchAPI<{ profile: import('@/types').ProfileData }>(`/users/${id}/profile`),
    updateStatus: (status: string) =>
      fetchAPI<{ success: boolean }>('/users/status', {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
  },
  friends: {
    list: () =>
      fetchAPI<{ friends: import('@/types').Friendship[] }>('/friends'),
    requests: () =>
      fetchAPI<{ requests: import('@/types').FriendRequest[] }>('/friends/requests'),
    send: (receiverId: string) =>
      fetchAPI<{ request: import('@/types').FriendRequest }>('/friends/requests', {
        method: 'POST',
        body: JSON.stringify({ receiverId }),
      }),
    accept: (requestId: string) =>
      fetchAPI<{ friendship: import('@/types').Friendship }>(`/friends/requests/${requestId}/accept`, {
        method: 'PUT',
      }),
    reject: (requestId: string) =>
      fetchAPI<{ success: boolean }>(`/friends/requests/${requestId}/reject`, {
        method: 'PUT',
      }),
    remove: (friendId: string) =>
      fetchAPI<{ success: boolean }>(`/friends/${friendId}`, {
        method: 'DELETE',
      }),
  },
  conversations: {
    list: () =>
      fetchAPI<{ conversations: import('@/types').Conversation[] }>('/conversations'),
    get: (id: string) =>
      fetchAPI<{ conversation: import('@/types').Conversation }>(`/conversations/${id}`),
    create: (userId: string) =>
      fetchAPI<{ conversation: import('@/types').Conversation }>('/conversations', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),
  },
  messages: {
    list: (conversationId: string) =>
      fetchAPI<{ messages: import('@/types').Message[] }>(`/messages/${conversationId}`),
    send: (conversationId: string, data: { content?: string; contentType?: string; mediaUrl?: string }) =>
      fetchAPI<{ message: import('@/types').Message }>(`/messages/${conversationId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    markRead: (conversationId: string) =>
      fetchAPI<{ success: boolean }>(`/messages/${conversationId}/read`, {
        method: 'PUT',
      }),
  },
  groups: {
    list: () => fetchAPI<{ groups: import('@/types').Group[] }>('/groups'),
    create: (data: { name: string; description?: string; memberIds: string[] }) =>
      fetchAPI<{ group: import('@/types').Group }>('/groups', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    get: (id: string) =>
      fetchAPI<{ group: import('@/types').Group }>(`/groups/${id}`),
    addMember: (groupId: string, userId: string) =>
      fetchAPI<{ member: import('@/types').GroupMember }>(`/groups/${groupId}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),
    removeMember: (groupId: string, userId: string) =>
      fetchAPI<{ success: boolean }>(`/groups/${groupId}/members/${userId}`, {
        method: 'DELETE',
      }),
  },
  calls: {
    log: () => fetchAPI<{ logs: import('@/types').CallLog[] }>('/calls'),
    create: (data: { calleeId: string; type: string }) =>
      fetchAPI<{ log: import('@/types').CallLog }>('/calls', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  notifications: {
    list: () =>
      fetchAPI<{ notifications: import('@/types').Notification[] }>('/notifications'),
    markRead: (id: string) =>
      fetchAPI<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () =>
      fetchAPI<{ success: boolean }>('/notifications/read-all', { method: 'PUT' }),
  },
  block: {
    user: (userId: string) =>
      fetchAPI<{ blocked: import('@/types').BlockedUser }>('/admin/block', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),
    unblock: (userId: string) =>
      fetchAPI<{ success: boolean }>('/admin/unblock', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),
    list: () => fetchAPI<{ blocked: import('@/types').BlockedUser[] }>('/admin/blocked'),
  },
}
