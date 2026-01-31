'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'
import { Package, Mail, Lock, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const addDebug = (msg: string) => {
    console.log(msg)
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')
  setDebugInfo([])
  setLoading(true)
  
  addDebug('🔐 Iniciando login...')
  
  try {
    addDebug(`📧 Email: ${formData.email}`)
    
    // Primero hacer signOut para limpiar cualquier sesión previa
    await supabase.auth.signOut()
    addDebug('🧹 Sesión anterior limpiada')
    
    // Ahora hacer login
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password
    })

    addDebug(`📊 Auth completado`)

    if (authError) {
      addDebug(`❌ Error: ${authError.message}`)
      throw authError
    }

    if (!data.user || !data.session) {
      addDebug('❌ No user/session data')
      throw new Error('No se recibió información de sesión')
    }

    addDebug(`✅ Usuario logueado: ${data.user.id}`)
    addDebug(`✅ Session token: ${data.session.access_token.substring(0, 20)}...`)
    
    // ⭐ CORREGIDO: Verificar perfil sin .single() primero
    addDebug('🔍 Verificando perfil...')
    
    // Primero consultar sin el JOIN para ver qué pasa
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', data.user.id)
    
    if (profileError) {
      addDebug(`❌ Error perfil: ${profileError.message}`)
      throw new Error('No se encontró el perfil de usuario')
    }

    if (!profiles || profiles.length === 0) {
      addDebug('❌ No profile data')
      throw new Error('Perfil no encontrado')
    }

    addDebug(`✅ Perfiles encontrados: ${profiles.length}`)
    
    // Tomar el primer perfil (o el principal si hay lógica)
    const profileData = profiles[0]
    addDebug(`✅ Perfil seleccionado: ${profileData.nombre}`)

    // Ahora cargar la organización por separado
    if (profileData.organization_id) {
      const { data: orgData } = await supabase
        .from('organizaciones')
        .select('*')
        .eq('id', profileData.organization_id)
        .single()
      
      if (orgData) {
        addDebug(`✅ Organización: ${orgData.nombre}`)
      }
    }

    // Verificar que la sesión esté guardada
    addDebug('🔍 Verificando sesión guardada...')
    const { data: { session: savedSession } } = await supabase.auth.getSession()
    
    if (savedSession) {
      addDebug('✅ Sesión verificada y guardada correctamente')
    } else {
      addDebug('⚠️ Advertencia: sesión no se guardó correctamente')
    }

    addDebug('⏳ Esperando 2 segundos antes de redirigir...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    addDebug('➡️ Redirigiendo con window.location...')
    
    // Forzar recarga completa para que el middleware detecte la sesión
    window.location.href = '/'
    
  } catch (error: any) {
    addDebug(`💥 Error final: ${error.message}`)
    
    if (error.message.includes('Invalid login credentials')) {
      setError('Email o contraseña incorrectos')
    } else if (error.message.includes('Email not confirmed')) {
      setError('Por favor confirma tu email antes de iniciar sesión')
    } else {
      setError(error.message || 'Error al iniciar sesión')
    }
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="bg-gradient-to-br from-emerald-600 to-blue-600 p-4 rounded-xl">
              <Package className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Bienvenido de nuevo</h1>
          <p className="text-slate-400">Ingresa a tu cuenta</p>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-100 text-sm">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="tu@email.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Iniciando sesión...
                </div>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-center text-slate-400 text-sm">
              ¿No tienes cuenta?{' '}
              <a href="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold">
                Crear cuenta gratis
              </a>
            </p>
          </div>
        </div>
        
        {/* Debug panel - SIEMPRE VISIBLE */}
        
      </div>
    </div>
  )
}