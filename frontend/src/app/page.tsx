'use client';

import { useUser, useAuth, SignInButton, SignUpButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, MessageCircle, Phone, Lock, Users, Zap } from 'lucide-react';

export default function HomePage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/chats');
    }
  }, [isLoaded, isSignedIn, router]);

  if (isLoaded && isSignedIn) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyber-50 via-white to-blue-50 dark:from-surface-900 dark:via-surface-800 dark:to-surface-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM1YzdjZmEiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-cyber-500/10 mb-8">
            <MessageCircle className="w-10 h-10 text-cyber-500" />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-surface-900 dark:text-white mb-4">
            CyberChat
          </h1>
          <p className="text-xl text-surface-500 dark:text-surface-400 mb-2">
            Secure, private, and modern messaging
          </p>
          <p className="text-surface-400 dark:text-surface-500 mb-12 max-w-md mx-auto">
            End-to-end encrypted messaging with voice & video calls. No phone number required.
          </p>

          <div className="flex items-center justify-center gap-4 mb-16">
            <SignUpButton mode="modal">
              <button className="btn-primary text-lg px-8 py-3">
                Get Started
              </button>
            </SignUpButton>
            <SignInButton mode="modal">
              <button className="px-8 py-3 rounded-xl border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 font-medium transition-all duration-200">
                Sign In
              </button>
            </SignInButton>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full"
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="glass rounded-2xl p-6 text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyber-500/10 mb-4">
                <feature.icon className="w-6 h-6 text-cyber-500" />
              </div>
              <h3 className="font-semibold text-surface-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-surface-500 dark:text-surface-400">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

const features = [
  { icon: Lock, title: 'End-to-End Encrypted', description: 'Messages encrypted on your device, decrypted only on recipient\'s device' },
  { icon: Users, title: 'No Phone Number Needed', description: 'Use your unique @username to connect with others' },
  { icon: Phone, title: 'Voice & Video Calls', description: 'HD voice and video calls with screen sharing' },
  { icon: Shield, title: 'Privacy First', description: 'Full control over your online status and profile visibility' },
  { icon: MessageCircle, title: 'Rich Messaging', description: 'Reactions, replies, forwarding, and media sharing' },
  { icon: Zap, title: 'Lightning Fast', description: 'Real-time messaging with instant delivery' },
];
