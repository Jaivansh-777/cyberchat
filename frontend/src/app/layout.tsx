import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CyberChat - Secure Messaging Platform',
  description: 'End-to-end encrypted messaging with voice and video calls',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#5c7cfa',
          colorText: '#212529',
          borderRadius: '12px',
        },
        elements: {
          card: 'shadow-none border border-surface-200',
          headerTitle: 'text-surface-900',
          headerSubtitle: 'text-surface-500',
          socialButtonsBlockButton: 'border border-surface-300 hover:bg-surface-50',
          formFieldInput: 'rounded-xl border-surface-300 focus:border-cyber-500',
          footerActionLink: 'text-cyber-600 hover:text-cyber-700',
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100`}>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '12px',
                background: 'var(--color-glass)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--color-glass-border)',
              },
            }}
          />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
