import type { Metadata } from 'next'
import { Inter, Montserrat } from 'next/font/google'
import '@/styles/globals.scss'
import Sidebar from '@/components/Sidebar'
import { Toaster } from 'sonner'
import CommandPalette from '@/components/CommandPalette'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat', weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'SimplePass CRM',
  description: 'CRM interno para gestión de productores de eventos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${montserrat.variable}`}>
      <body className="font-sans antialiased">
        <div className="flex h-screen overflow-hidden bg-[#0a0a0a]">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-[#0a0a0a]">
            {children}
          </main>
        </div>
        <CommandPalette />
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              color: '#e4e4e7',
              fontSize: '13px',
            },
          }}
        />
      </body>
    </html>
  )
}
