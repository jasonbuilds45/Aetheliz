import React from 'react';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Aetheliz | Structural Diagnostics',
  description: 'Production-grade structural diagnostic platform for scientific minds.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" 
          rel="stylesheet" 
        />
      </head>
      {/* Removed variable-based backgrounds that might be defaulting to dark.
         bg-slate-50 provides a very soft, professional light grey-white 
         that is standard in modern educational platforms.
      */}
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased min-h-screen`}>
        <main className="mx-auto w-full">
          {children}
        </main>
      </body>
    </html>
  );
}