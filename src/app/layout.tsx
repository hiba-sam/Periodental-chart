import React from 'react';
import type { Metadata, Viewport } from 'next';
import * as Sentry from '@sentry/nextjs';
import './globals.css';
import '../styles/scroll-fix.css';
import '../styles/rtl.css';
// Initialize global CSRF protection for all axios requests
import '@/utils/axiosConfig';
// Import the new client component
import MainLayout from './MainLayout';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/use-toast';
import { LanguageProvider } from '@/contexts/LanguageContext';
import NetworkStatusPopup from '@/components/ui/NetworkStatusPopup';
import { ReactQueryProvider } from '@/providers/ReactQueryProvider';
import { HeaderProvider } from '@/contexts/HeaderContext';

export function generateMetadata(): Metadata {
  return {
    title: 'MyPrescription - Tableau de bord médical',
    description: 'Application de gestion de prescriptions médicales',
    other: {
      ...Sentry.getTraceData()
    }
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="h-auto min-h-dvh antialiased text-gray-900 transition-colors scroll-smooth bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
        <LanguageProvider>
          <ReactQueryProvider>
            <AuthProvider>
              <HeaderProvider>
                <NetworkStatusPopup />
                <MainLayout>{children}</MainLayout>
                <Toaster />
              </HeaderProvider>
            </AuthProvider>
          </ReactQueryProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}