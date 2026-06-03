'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Users, Hash, Settings, MoreVertical, UserPlus,
  UserCheck, UserX, UserMinus, Clock, Check, X, Search, MessageCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn, getInitials, generateAvatarColor } from '@/lib/utils';
import type { Group } from '@/types';
import toast from 'react-hot-toast';

type SocialTab = 'friends' | 'groups' | 'incoming' | 'sent';

export default function GroupsPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<SocialTab>('friends');

  // Groups state
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  // Friends state
  const [friends, setFriends] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadGroups();
    loadFriends();
    loadRequests();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await api.getGroups();
      setGroups(data);
    } catch {}
    setLoading(false);
  };

  const loadFriends = async () => {
    try {
      const data = await api.getFriends();
      setFriends(data);
    } catch {}
    setFriendsLoading(false);
  };

  const loadRequests = async () => {
    try {
      const [incoming, sent] = await Promise.all([
        api.getIncomingFriendRequests(),
        api.getSentFriendRequests(),
      ]);
      setIncomingRequests(incoming);
      setSentRequests(sent);
    } catch {}
  };

  const handleSendRequest = async (receiverId: string) => {
    try {
      await api.sendFriendRequest(receiverId);
      toast.success('Friend request sent!');
      setSearchResults([]);
      setSearchQuery('');
      loadRequests();
    } catch {
      toast.error('Failed to send request');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await api.acceptFriendRequest(requestId);
      toast.success('Friend request accepted!');
      loadFriends();
      loadRequests();
    } catch {
      toast.error('Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await api.rejectFriendRequest(requestId);
      toast.success('Request declined');
      loadRequests();
    } catch {
      toast.error('Failed to decline request');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await api.removeFriend(friendId);
      toast.success('Friend removed');
      loadFriends();
    } catch {
      toast.error('Failed to remove friend');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await api.cancelFriendRequest(requestId);
      loadRequests();
    } catch {}
  };

  const handleSearchUsers = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await api.searchUsers(q);
      setSearchResults(results.filter((r: any) => r.id !== user?.id));
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  };

  const tabs = [
    { id: 'friends' as SocialTab, label: 'Friends', icon: Users, count: friends.length },
    { id: 'incoming' as SocialTab, label: 'Requests', icon: UserPlus, count: incomingRequests.length },
    { id: 'sent' as SocialTab, label: 'Sent', icon: Clock, count: sentRequests.length },
    { id: 'groups' as SocialTab, label: 'Groups', icon: Hash, count: groups.length },
  ];

  return (
    <div className="flex h-full">
      <div className={cn('w-full md:w-80 lg:w-96 border-r border-surface-200 dark:border-surface-700 flex flex-col', activeGroup && 'hidden md:flex')}>
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <h1 className="text-xl font-semibold text-surface-900 dark:text-white">Social</h1>
          <div className="flex gap-1 mt-3 overflow-x-auto scrollbar-thin">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  activeTab === tab.id
                    ? 'bg-cyber-500 text-white'
                    : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700'
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full',
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-surface-200 dark:bg-surface-600 text-surface-600 dark:text-surface-300'
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
          {activeTab === 'friends' && (
            <div>
              <div className="px-4 pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="text"
                    placeholder="Search users by name..."
                    value={searchQuery}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    className="input-field pl-10 py-2 text-sm"
                  />
                </div>
              </div>

              {searchQuery.length >= 2 && searchResults.length > 0 && (
                <div className="px-2 mb-2">
                  <p className="text-xs font-medium text-surface-400 px-2 py-1">Search Results</p>
                  {searchResults.map((suser: any) => (
                    <div key={suser.id} className="sidebar-item w-full">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium overflow-hidden shrink-0"
                        style={{ backgroundColor: generateAvatarColor(suser.displayName) }}>
                        {suser.avatar ? (
                          <img src={suser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : getInitials(suser.displayName)}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{suser.displayName}</p>
                        <p className="text-xs text-surface-500">{suser.username}</p>
                      </div>
                      <button
                        onClick={() => handleSendRequest(suser.id)}
                        className="btn-ghost p-1.5 rounded-lg text-cyber-500"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {friends.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-surface-400 p-8">
                  <Users className="w-12 h-12 mb-4" />
                  <p className="text-sm">No friends yet</p>
                  <p className="text-xs mt-1">Search for users to add</p>
                </div>
              ) : (
                friends.map((f: any) => (
                  <div key={f.id} className="sidebar-item w-full group">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium overflow-hidden"
                        style={{ backgroundColor: generateAvatarColor(f.displayName) }}>
                        {f.avatar ? (
                          <img src={f.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : getInitials(f.displayName)}
                      </div>
                      {f.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-surface-800 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{f.displayName}</p>
                      <p className="text-xs text-surface-500 truncate">@{f.username} {f.bio ? `· ${f.bio}` : ''}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveFriend(f.id)}
                      className="btn-ghost p-1.5 rounded-lg text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'incoming' && (
            <div>
              {incomingRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-surface-400 p-8">
                  <UserPlus className="w-12 h-12 mb-4" />
                  <p className="text-sm">No pending requests</p>
                </div>
              ) : (
                incomingRequests.map((req: any) => (
                  <div key={req.id} className="sidebar-item w-full">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium overflow-hidden shrink-0"
                      style={{ backgroundColor: generateAvatarColor(req.sender.displayName) }}>
                      {req.sender.avatar ? (
                        <img src={req.sender.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : getInitials(req.sender.displayName)}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{req.sender.displayName}</p>
                      <p className="text-xs text-surface-500">@{req.sender.username}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAcceptRequest(req.id)}
                        className="btn-ghost p-1.5 rounded-lg text-green-500"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req.id)}
                        className="btn-ghost p-1.5 rounded-lg text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'sent' && (
            <div>
              {sentRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-surface-400 p-8">
                  <Clock className="w-12 h-12 mb-4" />
                  <p className="text-sm">No sent requests</p>
                </div>
              ) : (
                sentRequests.map((req: any) => (
                  <div key={req.id} className="sidebar-item w-full">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium overflow-hidden shrink-0"
                      style={{ backgroundColor: generateAvatarColor(req.receiver.displayName) }}>
                      {req.receiver.avatar ? (
                        <img src={req.receiver.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : getInitials(req.receiver.displayName)}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{req.receiver.displayName}</p>
                      <p className="text-xs text-surface-500">@{req.receiver.username}</p>
                    </div>
                    <button
                      onClick={() => handleCancelRequest(req.id)}
                      className="btn-ghost p-1.5 rounded-lg text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'groups' && (
            <div>
              {groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-surface-400 p-8">
                  <Hash className="w-12 h-12 mb-4" />
                  <p className="text-sm">No groups yet</p>
                </div>
              ) : (
                groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setActiveGroup(group)}
                    className={cn('sidebar-item w-full', activeGroup?.id === group.id && 'active')}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-medium shrink-0"
                      style={{ backgroundColor: generateAvatarColor(group.name) }}>
                      {group.icon ? (
                        <img src={group.icon} alt="" className="w-full h-full rounded-xl object-cover" />
                      ) : getInitials(group.name)}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{group.name}</p>
                      <p className="text-xs text-surface-500">{group.members.length} members</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className={cn('flex-1 flex flex-col', !activeGroup && 'hidden md:flex')}>
        {activeGroup ? (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-3 p-4 border-b border-surface-200 dark:border-surface-700 bg-white/80 dark:bg-surface-800/80 backdrop-blur-sm">
              <button className="md:hidden btn-ghost p-1" onClick={() => setActiveGroup(null)}>
                <Hash className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-medium shrink-0"
                style={{ backgroundColor: generateAvatarColor(activeGroup.name) }}>
                {getInitials(activeGroup.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900 dark:text-white">{activeGroup.name}</p>
                <p className="text-xs text-surface-500">{activeGroup.members.length} members</p>
              </div>
              <button className="btn-ghost p-2 rounded-lg">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center text-surface-400">
              <div className="text-center">
                <Hash className="w-16 h-16 mx-auto mb-4 text-surface-300" />
                <p className="font-medium">Group chat coming soon</p>
                <p className="text-sm mt-1">Group messaging will be available in the chat window</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-surface-400">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-surface-300" />
              <p className="text-lg font-medium">Friends & Groups</p>
              <p className="text-sm mt-1">Manage your social connections</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
