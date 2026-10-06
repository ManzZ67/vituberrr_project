import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI VTuber 3D Studio - Interactive VRM & Voice AI',
  description: 'Aplikasi Web AI VTuber interaktif 3D VRM dengan FastAPI, Next.js, LLM (Gemini/Groq/OpenAI), dan Text-to-Speech (Edge-TTS) dengan lip-sync real-time.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark h-full">
      <body className={`${inter.className} h-full bg-black text-white antialiased overflow-hidden select-none`}>
        {children}
      </body>
    </html>
  );
}
