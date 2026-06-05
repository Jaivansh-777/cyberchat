'use client'

import { motion } from 'framer-motion'
import { Bell, Shield, HelpCircle, Trash2, Settings as SettingsIcon } from 'lucide-react'

const settingsItems = [
  { icon: Bell, label: 'Notifications', desc: 'Message sounds, push notifications' },
  { icon: Shield, label: 'Privacy', desc: 'Last seen, profile photo, status' },
  { icon: HelpCircle, label: 'Help & Support', desc: 'FAQ, contact us, report a problem' },
]

export default function SettingsPage() {
  return (
    <div className="h-full bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-sm">
            <SettingsIcon className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Settings</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-cyber">
        {settingsItems.map((item, i) => {
          const Icon = item.icon
          return (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-3 p-4 premium-card text-left"
            >
              <div className="section-icon bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
                <Icon className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <p className="text-[10px] text-gray-400">{item.desc}</p>
              </div>
            </motion.button>
          )
        })}

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 p-4 premium-card text-left mt-4"
        >
          <div className="section-icon bg-gradient-to-br from-red-500/10 to-rose-500/10">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-600">Reset identity</p>
            <p className="text-[10px] text-gray-400">This action cannot be undone</p>
          </div>
        </motion.button>
      </div>
    </div>
  )
}
