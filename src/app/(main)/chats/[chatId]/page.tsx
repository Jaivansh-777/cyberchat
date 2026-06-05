'use client'

import { useState, useEffect, useRef, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Send, Paperclip, Mic, Check, CheckCheck,
  MessageCircle, Hash, FileText, Download, X,
  Smile, User, Bug, Phone, CornerDownRight, MoreHorizontal,
} from 'lucide-react'
import { useStreamClient } from '@/components/shared/StreamProvider'
import { CallUI } from '@/components/shared/CallUI'
import { sanitizeDisplayName } from '@/lib/display-name'
import type { Channel, MessageResponse } from 'stream-chat'

const EMOJI_LIST = ['😀','😂','🤣','❤️','🔥','👍','🎉','🙏','😎','💀','💯','✨','🚀','💪','👀','😭','🥺','🤔']
const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

function FilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImage = file.type.startsWith('image/')
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 mb-2">
      {isImage ? (
        <img src={URL.createObjectURL(file)} alt="" className="w-10 h-10 rounded-lg object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-[#4f7cff]/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-[#4f7cff]" />
        </div>
      )}
      <span className="text-xs text-gray-700 truncate flex-1">{file.name}</span>
      <button onClick={onRemove} className="p-1 rounded-lg hover:bg-gray-100">
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  )
}

function MessageBubble({ message, isMe, channel, onReply, replyingTo }: {
  message: MessageResponse; isMe: boolean; channel?: Channel | null;
  onReply?: (msg: MessageResponse) => void; replyingTo?: string | null
}) {
  const attachments = message.attachments || []
  const [showReactions, setShowReactions] = useState(false)
  const reactions = message.latest_reactions || []

  const sendReaction = async (type: string) => {
    if (!channel) return
    try {
      const hasReaction = reactions.some((r) => r.type === type && r.user_id === message.user?.id)
      if (hasReaction) {
        await (channel as any).deleteReaction(message.id, type)
      } else {
        await (channel as any).sendReaction(message.id, { type, score: 1 })
      }
    } catch {}
    setShowReactions(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex w-full ${isMe ? 'sent-message' : 'received-message'} mb-2 relative group`}
    >
      <div className={isMe ? 'message-bubble-sent' : 'message-bubble-received'}>
        {message.quoted_message && (
          <div className={`mb-1.5 pl-2 border-l-2 ${isMe ? 'border-white/40' : 'border-[#4f7cff]/30'} opacity-60`}>
            <p className="text-[10px] font-medium">{sanitizeDisplayName(message.quoted_message.user?.name)}</p>
            <p className="text-[11px] truncate">{message.quoted_message.text || '[media]'}</p>
          </div>
        )}
        {!isMe && (
          <p className="text-[10px] text-[#4f7cff]/70 font-medium mb-1">
            {sanitizeDisplayName(message.user?.name, message.user?.id)}
          </p>
        )}
        {message.text && (
          <p className="message-text text-sm leading-relaxed">{message.text}</p>
        )}
        {attachments.map((att, i) => (
          <div key={i} className="mt-1">
            {att.image_url || att.thumb_url ? (
              <img
                src={att.image_url || att.thumb_url}
                alt={att.fallback || 'Image'}
                className="w-full h-auto rounded-lg"
                style={{ maxWidth: '100%', display: 'block' }}
                loading="lazy"
              />
            ) : att.asset_url ? (
              <a
                href={att.asset_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-black/5 hover:bg-black/10 transition-colors"
              >
                <FileText className="w-4 h-4 text-[#4f7cff]" />
                <span className="text-xs truncate">{att.fallback || att.title || 'File'}</span>
                <Download className="w-3 h-3 text-gray-400 ml-auto" />
              </a>
            ) : null}
          </div>
        ))}
        {reactions.length > 0 && (
          <div className="flex gap-0.5 mt-1.5 flex-wrap">
            {reactions.map((r, i) => (
              <span key={i} className="text-xs">{r.type}</span>
            ))}
          </div>
        )}
      </div>
      <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'} px-1`}>
        <button
          onClick={() => onReply?.(message)}
          className={`text-[10px] text-gray-300 hover:text-gray-500 transition-colors ${replyingTo === message.id ? 'text-[#4f7cff]' : ''}`}
        >
          <CornerDownRight className="w-3 h-3" />
        </button>
        <button
          onClick={() => setShowReactions(!showReactions)}
          className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors"
        >
          +
        </button>
        <span className="text-[10px] text-gray-400">
          {message.created_at
            ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : ''}
        </span>
        {isMe && (
          message.status === 'read'
            ? <CheckCheck className="w-3 h-3 text-[#4f7cff]" />
            : <Check className="w-3 h-3 text-gray-300" />
        )}
      </div>
      {showReactions && (
        <div className={`absolute ${isMe ? 'right-0' : 'left-0'} -bottom-8 flex gap-1 bg-white rounded-xl shadow-lg border border-gray-100 p-1.5 z-10`}>
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              className={`text-lg hover:scale-125 transition-transform ${reactions.some(r => r.type === emoji) ? 'scale-110' : ''}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start mb-2">
      <div className="message-bubble-received py-3 px-4">
        <div className="typing-dots flex gap-1">
          <span className="w-2 h-2" />
          <span className="w-2 h-2" />
          <span className="w-2 h-2" />
        </div>
      </div>
    </motion.div>
  )
}

export default function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isDM = searchParams?.get('type') === 'messaging'
  const { client, userId } = useStreamClient()

  const [channel, setChannel] = useState<Channel | null>(null)
  const [channelName, setChannelName] = useState('')
  const [otherUserName, setOtherUserName] = useState('')
  const [otherUserId, setOtherUserId] = useState('')
  const [messages, setMessages] = useState<MessageResponse[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [attachFile, setAttachFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [streamConnected, setStreamConnected] = useState(false)
  const [pendingCall, setPendingCall] = useState<'voice' | null>(null)
  const [lastSentMsg, setLastSentMsg] = useState('')
  const [lastReceivedMsg, setLastReceivedMsg] = useState('')
  const [replyTo, setReplyTo] = useState<MessageResponse | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!client || !chatId || !userId) return

    let cancelled = false
    let unsubs: (() => void)[] = []
    setStreamConnected(!!client.user)

    const loadChannel = async () => {
      try {
        const channelType = isDM ? 'messaging' : 'team'
        const filter = { type: channelType, id: chatId }
        let [ch] = await client.queryChannels(filter, {}, { watch: true })

        if (!ch && isDM) {
          const friendId = searchParams?.get('friendId')
          if (friendId) {
            const createRes = await fetch('/api/stream/create-dm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ targetUserId: friendId }),
            })
            if (createRes.ok) {
              const retry = await client.queryChannels(filter, {}, { watch: true })
              ch = retry[0]
            }
          }
          if (!ch && friendId) {
            const dmId = chatId
            ch = client.channel('messaging', dmId, { members: [userId, friendId] } as any)
            await ch.create()
            await ch.watch()
          }
        }

        if (!ch && !isDM) {
          ch = client.channel('team', chatId, {
            name: chatId.charAt(0).toUpperCase() + chatId.slice(1),
          } as any)
          await ch.create()
        }

        if (!ch || cancelled) return

        if (!isDM) {
          await fetch('/api/stream/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          })
        }

        const chData = ch.data as Record<string, unknown> | undefined
        const name = (chData?.name as string) || ch.id || chatId

        if (!cancelled) {
          setChannel(ch)
          setChannelName(name)

          if (isDM) {
            const members = Object.keys(ch.state?.members || {})
            const otherId = members.find((m) => m !== userId)
            const otherMember = ch.state?.members?.[otherId || '']
            const otherName = sanitizeDisplayName(otherMember?.user?.name, otherId)
            setOtherUserName(otherName)
            if (otherId) setOtherUserId(otherId)
          }
        }

        const response = await ch.query({ messages: { limit: 100 } })
        const msgs = (response.messages as unknown as MessageResponse[]).sort(
          (a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()
        )
        if (!cancelled) setMessages(msgs)
      } catch (err) {
        console.error('Failed to load channel', err)
      }
    }

    loadChannel()

    return () => {
      cancelled = true
      unsubs.forEach((u) => u())
    }
  }, [client, chatId, userId, isDM])

  useEffect(() => {
    if (!channel) return

    const unsubMsg = channel.on('message.new', (e) => {
      if (e.message) {
        const isMine = e.message.user?.id === userId
        if (!isMine) setLastReceivedMsg(e.message.text || '[media]')
        setMessages((prev) => {
          if (prev.some((m) => m.id === e.message!.id)) return prev
          return [...prev, e.message!]
        })
      }
    })
    const unsubReact = channel.on('reaction.new' as any, (e: any) => {
      if (!e.message || !e.reaction) return
      setMessages((prev) => prev.map((m) =>
        m.id === e.message!.id
          ? { ...m, latest_reactions: [...(m.latest_reactions || []), e.reaction!] }
          : m
      ))
    })
    const unsubReactDel = channel.on('reaction.deleted' as any, (e: any) => {
      if (!e.message || !e.reaction) return
      setMessages((prev) => prev.map((m) =>
        m.id === e.message!.id
          ? { ...m, latest_reactions: (m.latest_reactions || []).filter((r) => r.type !== e.reaction!.type) }
          : m
      ))
    })
    const unsubTyping = channel.on('typing.start', () => setIsTyping(true))
    const unsubStopTyping = channel.on('typing.stop', () => setIsTyping(false))

    return () => {
      unsubMsg?.unsubscribe()
      unsubReact?.unsubscribe()
      unsubReactDel?.unsubscribe()
      unsubTyping?.unsubscribe()
      unsubStopTyping?.unsubscribe()
    }
  }, [channel])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendTypingEvent = () => {
    if (!channel) return
    channel.keystroke()
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      if (channel) channel.stopTyping()
    }, 2000)
  }

  const sendMessage = async () => {
    if (!channel || sending) return
    const text = input.trim()

    if (!text && !attachFile) return

    setSending(true)
    try {
      const attachments: any[] = []

      if (attachFile) {
        const isImage = attachFile.type.startsWith('image/')
        const ch = channel as any
        try {
          if (isImage) {
            const resp = await ch.sendImage(attachFile)
            const url = resp.image || resp.file || resp
            attachments.push({ image_url: typeof url === 'string' ? url : url.image, fallback: attachFile.name })
          } else {
            const resp = await ch.sendFile(attachFile)
            const url = resp.file || resp
            attachments.push({ asset_url: typeof url === 'string' ? url : url.file, fallback: attachFile.name, title: attachFile.name })
          }
        } catch {
          attachments.push({ text: `[File: ${attachFile.name}]`, fallback: attachFile.name })
        }
      }

      const msgOptions: any = { text: text || '', attachments }
      if (replyTo) {
        msgOptions.quoted_message_id = replyTo.id
      }
      await channel.sendMessage(msgOptions)
      setLastSentMsg(text || '[media]')
      setInput('')
      setAttachFile(null)
      setShowEmoji(false)
      setReplyTo(null)
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    } catch (err) {
      console.error('Failed to send message', err)
    } finally {
      setSending(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setAttachFile(file)
    e.target.value = ''
  }

  const insertEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji)
    setShowEmoji(false)
  }

  const headerTitle = isDM ? sanitizeDisplayName(otherUserName) : `# ${channelName}`

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Desktop chat header */}
      <div className="hidden md:flex items-center gap-2 px-5 py-3 border-b border-gray-100 flex-shrink-0 bg-white/80 backdrop-blur-sm">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => router.push('/chats')}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </motion.button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${isDM ? 'from-emerald-400 to-teal-500' : 'from-[#4f7cff]/10 to-indigo-500/10'} flex items-center justify-center flex-shrink-0`}>
            {isDM ? (
              <span className="text-sm font-bold text-white">
                {(otherUserName || '?')[0].toUpperCase()}
              </span>
            ) : (
              <Hash className="w-5 h-5 text-[#4f7cff]" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 truncate">{headerTitle}</h2>
            <p className="text-[10px] text-gray-400">{isDM ? 'Direct message' : 'Channel'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isDM && (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setPendingCall('voice')}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-emerald-500 transition-colors"
              title="Voice call"
            >
              <Phone className="w-4 h-4" />
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => setShowDebug(!showDebug)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            title="Debug"
          >
            <Bug className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Debug panel */}
      {showDebug && (
        <div className="px-5 py-3 bg-gray-900 text-green-400 text-[11px] font-mono space-y-1 border-b border-gray-800">
          <p>User: {userId || '—'}</p>
          <p>Channel ID: {chatId}</p>
          <p>Type: {isDM ? 'messaging' : 'team'}</p>
          <p>Connected: {streamConnected ? 'YES' : 'NO'}</p>
          <p>Channel loaded: {channel ? 'YES' : 'NO'}</p>
          <p>Channel name: {channelName || '—'}</p>
          <p>Messages count: {messages.length}</p>
          <p>Last sent: {lastSentMsg || '—'}</p>
          <p>Last received: {lastReceivedMsg || '—'}</p>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-cyber px-5 py-5 space-y-1 chat-bg">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-[#4f7cff]/10 flex items-center justify-center mb-3">
              <MessageCircle className="w-8 h-8 text-[#4f7cff]/40" />
            </div>
            <p className="text-sm text-gray-400">No messages yet. Say hello!</p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} isMe={msg.user?.id === userId} channel={channel}
                onReply={setReplyTo} replyingTo={replyTo?.id || null} />
            ))}
          </AnimatePresence>
        )}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0 bg-white">
        {replyTo && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-xl bg-blue-50 border border-blue-100">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-[#4f7cff]">{sanitizeDisplayName(replyTo.user?.name)}</p>
              <p className="text-xs text-gray-600 truncate">{replyTo.text || '[media]'}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="p-1 rounded-lg hover:bg-blue-100">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}
        {attachFile && (
          <FilePreview file={attachFile} onRemove={() => setAttachFile(null)} />
        )}
        {showEmoji && (
          <div className="flex flex-wrap gap-1 mb-2 p-2 rounded-xl bg-gray-50 border border-gray-200">
            {EMOJI_LIST.map((e) => (
              <button
                key={e}
                onClick={() => insertEmoji(e)}
                className="text-xl hover:scale-125 transition-transform"
              >
                {e}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt,.zip"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="p-2.5 rounded-xl bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <Smile className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                sendTypingEvent()
              }}
              onPaste={(e) => {
                const items = e.clipboardData?.items
                if (!items) return
                for (const item of items) {
                  if (item.type.startsWith('image/')) {
                    const file = item.getAsFile()
                    if (file) setAttachFile(file)
                    break
                  }
                }
              }}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 pr-12 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#4f7cff]/50 focus:ring-2 focus:ring-[#4f7cff]/10 transition-all"
            />
          </div>
          {input.trim() || attachFile ? (
            <button
              onClick={sendMessage}
              disabled={sending}
              className="p-2.5 rounded-xl bg-[#4f7cff] text-white shadow-sm hover:bg-[#3b5fd9] transition-colors flex-shrink-0 disabled:opacity-50"
            >
              <Send className={`w-5 h-5 ${sending ? 'animate-pulse' : ''}`} />
            </button>
          ) : (
            <button className="p-2.5 rounded-xl bg-gray-100 text-gray-400 flex-shrink-0">
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <CallUI
        channelId={chatId}
        otherUserId={otherUserId}
        otherUserName={otherUserName}
        currentUserId={userId}
        callTrigger={pendingCall}
        onCallTriggered={() => setPendingCall(null)}
      />
    </div>
  )
}
