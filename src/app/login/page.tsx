'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ticket, Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }

    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-2xl shadow-violet-900/40 mb-4">
            <Ticket size={20} className="text-white" />
          </div>
          <h1 className="text-[20px] font-semibold text-white tracking-tight">CRM Productora</h1>
          <p className="text-[13px] text-zinc-600 mt-1">Ingresá con tu cuenta</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="bg-[#141414] border border-[#1f1f1f] rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoFocus
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-[14px] text-white placeholder-zinc-700 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 pr-10 text-[14px] text-white placeholder-zinc-700 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-[12px] text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-[14px] font-medium rounded-lg transition-all shadow-lg shadow-violet-900/20"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-[11px] text-zinc-700 mt-5">
          Acceso restringido · Solo usuarios autorizados
        </p>
      </div>
    </div>
  )
}
