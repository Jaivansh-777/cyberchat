'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image, Camera, Type, Send } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface StatusCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StatusCreateModal({ isOpen, onClose }: StatusCreateModalProps) {
  const { user } = useUser();
  const [step, setStep] = useState<'choose' | 'text' | 'preview'>('choose');
  const [text, setText] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  const reset = useCallback(() => {
    setStep('choose');
    setText('');
    setMediaPreview(null);
    setMediaFile(null);
    setUploading(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleImagePick = () => {
    fileInputRef.current?.click();
  };

  const handleVideoPick = () => {
    videoInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setMediaPreview(ev.target?.result as string);
      setStep('preview');
    };
    reader.readAsDataURL(file);
  };

  const handleTextSubmit = () => {
    if (!text.trim()) return;
    setStep('preview');
  };

  const handleSend = async () => {
    setUploading(true);
    try {
      let mediaUrl = '';

      if (mediaFile) {
        try {
          const url = await api.uploadAvatar(mediaFile);
          mediaUrl = typeof url === 'string' ? url : url?.url || '';
        } catch {
          mediaUrl = mediaPreview || '';
        }
      }

      await api.createStatus({
        type: mediaUrl ? (mediaFile?.type?.startsWith('video') ? 'VIDEO' : 'IMAGE') : 'TEXT',
        text: text.trim() || undefined,
        mediaUrl: mediaUrl || undefined,
      });

      toast.success('Status posted!');
      handleClose();
    } catch (err) {
      toast.error('Failed to post status');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (step === 'text') handleTextSubmit();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl overflow-hidden w-full max-w-sm mx-4"
          >
            <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                {step === 'choose' ? 'Add Status' : step === 'text' ? 'Text Status' : 'Preview'}
              </h2>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              >
                <X className="w-5 h-5 text-surface-500" />
              </button>
            </div>

            <div className="p-4">
              {step === 'choose' && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setStep('text')}
                    className="flex flex-col items-center gap-2 p-6 rounded-xl bg-gradient-to-br from-cyber-50 to-surf-50 dark:from-cyber-900/20 dark:to-surf-900/20 border border-cyber-200 dark:border-cyber-700 hover:border-cyber-400 transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-cyber-100 dark:bg-cyber-900/30 flex items-center justify-center">
                      <Type className="w-6 h-6 text-cyber-600 dark:text-cyber-400" />
                    </div>
                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Text</span>
                  </button>
                  <button
                    onClick={handleImagePick}
                    className="flex flex-col items-center gap-2 p-6 rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border border-pink-200 dark:border-pink-700 hover:border-pink-400 transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                      <Image className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                    </div>
                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Image</span>
                  </button>
                  <button
                    onClick={handleVideoPick}
                    className="flex flex-col items-center gap-2 p-6 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-700 hover:border-violet-400 transition-all col-span-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Video</span>
                  </button>
                </div>
              )}

              {step === 'text' && (
                <div>
                  <textarea
                    ref={textInputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="What's on your mind?"
                    className="w-full h-32 p-3 rounded-xl bg-surface-50 dark:bg-surface-700/50 border border-surface-200 dark:border-surface-600 resize-none text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-cyber-500/50 text-lg"
                    autoFocus
                    maxLength={500}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-surface-400">{text.length}/500</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setStep('choose')}
                        className="px-3 py-1.5 text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleTextSubmit}
                        disabled={!text.trim()}
                        className="px-4 py-1.5 text-sm bg-cyber-500 text-white rounded-lg hover:bg-cyber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step === 'preview' && (
                <div>
                  <div className="w-full aspect-[9/16] max-h-[400px] rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-700 flex items-center justify-center mb-4">
                    {mediaPreview ? (
                      mediaFile?.type?.startsWith('video') ? (
                        <video src={mediaPreview} className="w-full h-full object-cover" autoPlay muted loop />
                      ) : (
                        <img src={mediaPreview} alt="" className="w-full h-full object-cover" />
                      )
                    ) : (
                      <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-cyber-500 to-purple-600 p-6">
                        <p className="text-white text-xl font-medium text-center break-words">
                          {text}
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={uploading}
                    className="w-full py-2.5 bg-cyber-500 text-white rounded-xl hover:bg-cyber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Post Status
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
