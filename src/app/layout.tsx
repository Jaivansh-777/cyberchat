import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'CyberChat - Public Chat',
  description: 'Public chat rooms for everyone',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="%233b82f6"/><path d="M16 8c-7.4 0-13.4 5-13.4 11.2 0 3.6 2 6.8 5.2 8.9L7 26l4.7-2.8c2.3.7 4.8 1 7.4 1 7.4 0 13.4-5 13.4-11.2S23.4 8 16 8z" fill="white" opacity="0.9"/></svg>',
    apple: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><rect width="180" height="180" rx="30" fill="white"/><rect x="12" y="12" width="156" height="156" rx="26" fill="%233b82f6"/><path d="M90 45c-24.8 0-45 16.8-45 37.5 0 11.9 6.8 22.6 17.5 29.8L58 135l15.8-9.4c7.8 2.3 16 3.5 24.6 3.5 24.8 0 45-16.8 45-37.5S114.8 45 90 45z" fill="white" opacity="0.9"/></svg>',
  },
}

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#3b82f6',
          colorBackground: '#ffffff',
          colorText: '#1e293b',
          colorInputBackground: '#f8fafc',
          colorInputText: '#1e293b',
          borderRadius: '0.75rem',
        },
        elements: {
          card: { boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' },
          headerTitle: { color: '#1e293b' },
          headerSubtitle: { color: '#64748b' },
          socialButtonsBlockButton: { border: '1px solid #e2e8f0' },
          formFieldInput: { border: '1px solid #e2e8f0' },
          footer: { display: 'none' },
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-gray-50 text-slate-800`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
