const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

let _getToken: (() => Promise<string | null>) | null = null;

export function setTokenProvider(provider: () => Promise<string | null>) {
  _getToken = provider;
}

async function getAuthToken(): Promise<string | null> {
  if (_getToken) return _getToken();
  return null;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Users
  getMe: () => request<any>('/users/me'),
  updateProfile: (data: any) => request<any>('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
  searchUsers: (query: string) => request<any>(`/users/search?q=${encodeURIComponent(query)}`),
  getUser: (id: string) => request<any>(`/users/${id}`),
  getUserByUsername: (username: string) => request<any>(`/users/username/${encodeURIComponent(username)}`),

  // Chats
  getChats: () => request<any[]>('/chats'),
  getChat: (id: string) => request<any>(`/chats/${id}`),
  createPrivateChat: (userId: string) => request<any>('/chats/private', { method: 'POST', body: JSON.stringify({ userId }) }),

  // Messages
  getMessages: (chatId: string, cursor?: string) =>
    request<any[]>(`/messages/chat/${chatId}${cursor ? `?cursor=${cursor}` : ''}`),
  sendMessage: (data: any) => request<any>('/messages', { method: 'POST', body: JSON.stringify(data) }),
  editMessage: (id: string, content: string) =>
    request<any>(`/messages/${id}`, { method: 'PATCH', body: JSON.stringify({ content }) }),
  deleteMessage: (id: string, forEveryone = false) =>
    request<any>(`/messages/${id}?forEveryone=${forEveryone}`, { method: 'DELETE' }),
  addReaction: (messageId: string, emoji: string) =>
    request<any>(`/messages/${messageId}/reactions`, { method: 'POST', body: JSON.stringify({ emoji }) }),
  removeReaction: (messageId: string, emoji: string) =>
    request<any>(`/messages/${messageId}/reactions`, { method: 'DELETE', body: JSON.stringify({ emoji }) }),
  pinMessage: (messageId: string, chatId: string) =>
    request<any>(`/messages/${messageId}/pin`, { method: 'POST', body: JSON.stringify({ chatId }) }),
  forwardMessage: (messageId: string, chatId: string) =>
    request<any>('/messages/forward', { method: 'POST', body: JSON.stringify({ messageId, chatId }) }),
  markAsRead: (chatId: string) => request<any>(`/messages/read/${chatId}`, { method: 'POST' }),

  // Groups
  getGroups: () => request<any[]>('/groups'),
  getGroup: (id: string) => request<any>(`/groups/${id}`),
  createGroup: (data: any) => request<any>('/groups', { method: 'POST', body: JSON.stringify(data) }),
  updateGroup: (id: string, data: any) => request<any>(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addGroupMember: (groupId: string, userId: string) =>
    request<any>(`/groups/${groupId}/members`, { method: 'POST', body: JSON.stringify({ userId }) }),
  removeGroupMember: (groupId: string, userId: string) =>
    request<any>(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' }),
  updateMemberRole: (groupId: string, userId: string, role: string) =>
    request<any>(`/groups/${groupId}/members/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  transferOwnership: (groupId: string, newOwnerId: string) =>
    request<any>(`/groups/${groupId}/transfer`, { method: 'POST', body: JSON.stringify({ newOwnerId }) }),

  // Calls
  getCallToken: () => request<{ token: string; apiKey: string }>('/calls/token'),
  initiateCall: (data: any) => request<any>('/calls/initiate', { method: 'POST', body: JSON.stringify(data) }),
  updateCallStatus: (id: string, data: any) => request<any>(`/calls/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  getCallHistory: () => request<any[]>('/calls/history'),

  // Media
  uploadFile: async (file: File) => {
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/media/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  },

  // Friends
  getFriends: () => request<any[]>('/friends'),
  sendFriendRequest: (receiverId: string) => request<any>('/friends/request', { method: 'POST', body: JSON.stringify({ receiverId }) }),
  acceptFriendRequest: (requestId: string) => request<any>(`/friends/accept/${requestId}`, { method: 'POST' }),
  rejectFriendRequest: (requestId: string) => request<any>(`/friends/reject/${requestId}`, { method: 'POST' }),
  cancelFriendRequest: (requestId: string) => request<any>(`/friends/cancel/${requestId}`, { method: 'POST' }),
  removeFriend: (friendId: string) => request<any>(`/friends/${friendId}`, { method: 'DELETE' }),
  getIncomingFriendRequests: () => request<any[]>('/friends/requests/incoming'),
  getSentFriendRequests: () => request<any[]>('/friends/requests/sent'),
  getMutualFriends: (userId: string) => request<any>(`/friends/mutual/${userId}`),

  // Avatar Upload
  uploadAvatar: async (file: File) => {
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/media/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return data.url || data;
  },

  // Status
  createStatus: (data: any) => request<any>('/status/create', { method: 'POST', body: JSON.stringify(data) }),
  getStatusFeed: () => request<any[]>('/status/feed'),
  getMyStatuses: () => request<any[]>('/status/my'),
  viewStatus: (statusId: string) => request<any>(`/status/view/${statusId}`, { method: 'POST' }),
  deleteStatus: (statusId: string) => request<any>(`/status/${statusId}`, { method: 'DELETE' }),

  // Global Search
  globalSearch: (query: string) => request<any>(`/search?q=${encodeURIComponent(query)}`),
  globalSearchUsers: (query: string) => request<any>(`/search/users?q=${encodeURIComponent(query)}`),
  globalSearchMessages: (query: string) => request<any>(`/search/messages?q=${encodeURIComponent(query)}`),
  globalSearchGroups: (query: string) => request<any>(`/search/groups?q=${encodeURIComponent(query)}`),
  globalSearchMedia: (chatId: string, type?: string) => request<any>(`/search/media?chatId=${chatId}${type ? `&type=${type}` : ''}`),
};
