import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Agent School — AI 전문가와 대화하기',
  description: '150+ AI 전문가 에이전트와 1:1로 대화하며 배우세요',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen" style={{ background: 'var(--background)' }}>
        {children}
      </body>
    </html>
  )
}
