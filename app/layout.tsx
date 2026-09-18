import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'タスク貯金 | ゲーミフィケーション型資金管理',
  description: 'タスクをこなして貯金を増やす、ライフログ兼資金管理Webアプリ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
