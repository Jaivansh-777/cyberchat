import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMessageTime(date: string) {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Yesterday ' + format(d, 'HH:mm');
  return format(d, 'MMM d, HH:mm');
}

export function formatLastSeen(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatCallDuration(seconds?: number) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateAvatarColor(name: string) {
  const colors = [
    '#5c7cfa', '#748ffc', '#9775fa', '#da77f2',
    '#f06595', '#ff6b6b', '#fcc419', '#69db7c',
    '#38d9a9', '#22b8cf', '#4dabf7', '#748ffc',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function truncate(str: string, length: number) {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('zip') || mimeType.includes('compress')) return 'zip';
  return 'document';
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function getCallStatusLabel(status: string, isOwn: boolean, duration?: number): string {
  switch (status) {
    case 'MISSED': return isOwn ? 'Missed call' : 'Missed';
    case 'REJECTED': return 'Declined';
    case 'CANCELLED': return 'Cancelled';
    case 'CONNECTED': return 'Connected';
    case 'COMPLETED': return duration ? formatCallDuration(duration) : 'Completed';
    default: return 'No answer';
  }
}

export function getRelativeTime(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}
