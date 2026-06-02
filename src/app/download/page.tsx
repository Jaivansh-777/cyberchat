'use client'

import { motion } from 'framer-motion'
import { Download, Smartphone, Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <Link href="/chats" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" />
          Back to app
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Smartphone className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Download CyberChat</h1>
          <p className="text-sm text-gray-500 mb-8 max-w-sm mx-auto">
            Install the APK on your Android device to use CyberChat as a native app.
          </p>

          <motion.a
            href="/CyberChat.apk"
            download
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold shadow-lg hover:shadow-xl transition-shadow"
          >
            <Download className="w-6 h-6" />
            Download APK (debug)
          </motion.a>

          <div className="mt-8 p-5 rounded-2xl bg-amber-50 border border-amber-200 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-800">Installation Guide</span>
            </div>
            <ol className="text-xs text-amber-700 space-y-1.5 ml-4 list-decimal">
              <li>Download the APK file above</li>
              <li>Open the file on your Android device</li>
              <li>Allow installation from unknown sources if prompted</li>
              <li>Open CyberChat and sign in anonymously</li>
              <li>The app connects to the server automatically</li>
            </ol>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
