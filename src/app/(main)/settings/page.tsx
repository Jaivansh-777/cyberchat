'use client'

import { motion } from 'framer-motion'
import { Settings, Moon, Bell, Shield, HelpCircle, LogOut, ChevronRight } from 'lucide-react'

const settingsItems = [
  { icon: Bell, label: 'Notifications', desc: 'Manage push notifications' },
  { icon: Shield, label: 'Privacy', desc: 'Control your privacy settings' },
  { icon: HelpCircle, label: 'Help & Support', desc: 'Get help using CyberChat' },
]

export default function SettingsPage() {
  return (
    <div className="h-full bg-white flex flex-col pb-16 md:pb-0">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-indigo-500 flex items-center justify-center shadow-sm">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Settings</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-cyber px-4 py-4 space-y-2">
        {settingsItems.map((item, i) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-gray-50 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/10 to-indigo-500/10 flex items-center justify-center">
              <item.icon className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </motion.button>
        ))}

        <div className="pt-4 mt-4 border-t border-gray-100">
          <button className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-red-50 transition-colors text-left">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-500">Reset identity</p>
              <p className="text-xs text-gray-400">Generate a new anonymous user ID</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
