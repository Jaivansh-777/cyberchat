'use client'

import { motion } from 'framer-motion'
import { MessageCircle, ArrowRight, Shield, Zap, Globe } from 'lucide-react'
import Link from 'next/link'

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-800">CyberChat</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="text-sm text-white bg-gradient-to-r from-blue-500 to-indigo-500 font-semibold px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-500/20">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Chat with anyone
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">.</span>
          </h1>

          <p className="text-lg text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
            Real-time messaging, voice and video calls, status updates — all in one place.
          </p>

          <div className="flex items-center justify-center gap-4 mb-12">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold shadow-lg shadow-blue-500/20 hover:shadow-xl transition-shadow"
            >
              Create Account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-gray-700 font-medium border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              Sign In
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl"
        >
          {[
            { icon: Zap, title: 'Real-time', desc: 'Instant messaging with typing indicators and read receipts' },
            { icon: Globe, title: 'Anywhere', desc: 'Web app + Android APK. Chat from any device' },
            { icon: Shield, title: 'Secure', desc: 'Powered by Clerk auth and Stream Chat infrastructure' },
          ].map((item) => (
            <div key={item.title} className="p-4 rounded-2xl bg-white/60 border border-gray-100 text-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center mx-auto mb-3">
                <item.icon className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">{item.title}</h3>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  )
}
