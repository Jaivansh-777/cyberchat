'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import {
  User, Shield, Bell, Smartphone, Eye, EyeOff, Moon, Sun,
  Key, LogOut, Trash2, Check, Save, Camera, Copy, Share2, QrCode
} from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { api } from '@/lib/api';
import { cn, getInitials, generateAvatarColor } from '@/lib/utils';
import toast from 'react-hot-toast';

type SettingsTab = 'profile' | 'privacy' | 'appearance' | 'notifications' | 'devices';

const tabs: { id: SettingsTab; label: string; icon: any }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Eye },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'devices', label: 'Devices', icon: Smartphone },
];

export default function SettingsPage() {
  const { user } = useUser();
  const { isDarkMode, toggleDarkMode, profile, setProfile } = useUIStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.getMe();
      setDisplayName(data.displayName || '');
      setBio(data.bio || '');
      setAvatar(data.avatar || null);
      setProfile(data);
    } catch {
      if (user) {
        setDisplayName(user.fullName || '');
        setBio('Hey there! I am using CyberChat');
        const fallbackUsername = user.username || user.fullName?.toLowerCase().replace(/\s+/g, '') || user.primaryEmailAddress?.emailAddress?.split('@')[0] || '';
        setProfile({
          id: user.id,
          clerkId: user.id,
          username: fallbackUsername,
          displayName: user.fullName || '',
          email: user.primaryEmailAddress?.emailAddress || '',
          avatar: user.imageUrl || '',
          bio: 'Hey there! I am using CyberChat',
          isOnline: true,
          lastSeen: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setUploading(true);
    try {
      const url = await api.uploadAvatar(file);
      const updated = await api.updateProfile({ avatar: url });
      setAvatar(url);
      if (profile) setProfile({ ...profile, avatar: url });
      toast.success('Avatar updated');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await api.updateProfile({ displayName, bio });
      if (profile) setProfile({ ...profile, displayName, bio });
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyUsername = () => {
    const uname = profile?.username || user?.username || user?.fullName?.toLowerCase().replace(/\s+/g, '') || 'user';
    navigator.clipboard.writeText(`@${uname}`);
    toast.success('Username copied');
  };

  const avatarUrl = avatar || user?.imageUrl;
  const displayNameValue = profile?.displayName || displayName || user?.fullName || '';
  const usernameValue = profile?.username || user?.username || user?.fullName?.toLowerCase().replace(/\s+/g, '') || 'user';

  return (
    <div className="flex h-full">
      <div className="w-full md:w-72 border-r border-surface-200 dark:border-surface-700 flex flex-col">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <h1 className="text-xl font-semibold text-surface-900 dark:text-white">Settings</h1>
        </div>
        <div className="flex-1 py-2 space-y-1 px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'sidebar-item w-full',
                activeTab === tab.id && 'active'
              )}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-2xl mx-auto p-6">
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-medium overflow-hidden"
                    style={{ backgroundColor: generateAvatarColor(displayNameValue) }}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getInitials(displayNameValue || 'U')
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-surface-900 dark:text-white">{displayNameValue}</h2>
                  <div className="flex items-center gap-2 text-sm text-surface-500">
                    <span>@{usernameValue}</span>
                    <button onClick={handleCopyUsername} className="btn-ghost p-1 rounded">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1 block">Display Name</span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input-field"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1 block">Bio</span>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="Tell the world about yourself..."
                    className="input-field resize-none"
                  />
                </label>
                <div className="flex items-center gap-3">
                  <button onClick={handleSaveProfile} disabled={saving} className="btn-primary flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'privacy' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Privacy Controls</h2>
              {[
                { label: 'Last Seen', desc: 'Show when you were last active' },
                { label: 'Online Status', desc: 'Show your online status' },
                { label: 'Profile Photo', desc: 'Show your profile picture' },
                { label: 'Read Receipts', desc: 'Send read receipts' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-800">
                  <div>
                    <p className="text-sm font-medium text-surface-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-surface-500">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-surface-300 peer-focus:outline-none rounded-full peer dark:bg-surface-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyber-500" />
                  </label>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'appearance' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Appearance</h2>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-surface-900 dark:text-white">Dark Mode</p>
                  <p className="text-xs text-surface-500">Toggle dark mode theme</p>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={cn(
                    'relative w-14 h-7 rounded-full transition-colors duration-200',
                    isDarkMode ? 'bg-cyber-500' : 'bg-surface-300'
                  )}
                >
                  <div className={cn(
                    'absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 flex items-center justify-center',
                    isDarkMode ? 'translate-x-7.5 left-0.5' : 'left-0.5'
                  )}>
                    {isDarkMode ? <Moon className="w-3 h-3 text-cyber-500" /> : <Sun className="w-3 h-3 text-yellow-500" />}
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Notification Settings</h2>
              {[
                { label: 'Message Notifications', desc: 'Get notified of new messages' },
                { label: 'Group Notifications', desc: 'Get notified of group activity' },
                { label: 'Call Notifications', desc: 'Get notified of incoming calls' },
                { label: 'Sound', desc: 'Play sounds for notifications' },
                { label: 'Vibration', desc: 'Vibrate on new notifications' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-800">
                  <div>
                    <p className="text-sm font-medium text-surface-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-surface-500">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-surface-300 peer-focus:outline-none rounded-full peer dark:bg-surface-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyber-500" />
                  </label>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'devices' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Linked Devices</h2>
              <p className="text-sm text-surface-500">Devices with active sessions</p>
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-8 h-8 text-cyber-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-surface-900 dark:text-white">Current Device</p>
                    <p className="text-xs text-surface-500">Active now</p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
              </div>
              <button className="btn-ghost text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                <LogOut className="w-4 h-4 mr-2" />
                Log Out of All Devices
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
