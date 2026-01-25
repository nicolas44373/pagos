'use client'
import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { Package, Mail, Lock, User, Building2, Link as LinkIcon, CheckCircle, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    nombreEmpresa: '',
    slug: '',
    nombreUsuario: '',
    email: '',
    password: '',
    confirmarPassword: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    if (name === 'slug') {
      const cleanSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '')
      
      setFormData(prev => ({ ...prev, [name]: cleanSlug }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleNombreEmpresaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nombre = e.target.value
    setFormData(prev => ({
      ...prev,
      nombreEmpresa: nombre,
      slug: nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 30)
    }))
  }

  const validarFormulario = () => {
    if (!formData.nombreEmpresa.trim()) {
      setError('El nombre de la empresa es obligatorio')
      return false
    }
    
    if (!formData.slug.trim() || formData.slug.length < 3) {
      setError('El identificador debe tener al menos 3 caracteres')
      return false
    }
    
    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      setError('El identificador solo puede contener letras minúsculas, números y guiones')
      return false
    }
    
    if (!formData.nombreUsuario.trim()) {
      setError('Tu nombre es obligatorio')
      return false
    }
    
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Email inválido')
      return false
    }
    
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return false
    }
    
    if (formData.password !== formData.confirmarPassword) {
      setError('Las contraseñas no coinciden')
      return false
    }
    
    return true
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!validarFormulario()) return
    
    setLoading(true)
    
    try {
      // 1. Crear usuario en auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nombre: formData.nombreUsuario
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('No se pudo crear el usuario')

      console.log('✅ Usuario creado:', authData.user.id)

      // 2. Esperar un momento para asegurar que el usuario esté en la BD
      await new Promise(resolve => setTimeout(resolve, 1000))

      // ⭐ CALCULAR FECHA DE EXPIRACIÓN - 24 HORAS DESDE AHORA
      const ahora = new Date()
      const expiracion24h = new Date(ahora.getTime() + (24 * 60 * 60 * 1000))

      // 3. Llamar a la función RPC para crear organización y perfil
      console.log('📞 Llamando a RPC...')
      const { data: rpcData, error: rpcError } = await supabase.rpc('register_new_organization', {
        p_org_name: formData.nombreEmpresa,
        p_org_slug: formData.slug,
        p_org_email: formData.email,
        p_user_name: formData.nombreUsuario,
        p_user_id: authData.user.id
      })

      if (rpcError) {
        console.error('❌ Error RPC:', rpcError)
        
        // Intentar crear manualmente como fallback
        console.log('🔄 Intentando crear manualmente...')
        
        // ⭐ Crear organización con trial de 24 horas
        const { data: orgData, error: orgError } = await supabase
          .from('organizaciones')
          .insert({
            nombre: formData.nombreEmpresa,
            slug: formData.slug,
            email_contacto: formData.email,
            plan: 'trial',
            status: 'active',
            trial_ends_at: expiracion24h.toISOString(), // ⭐ 24 HORAS
            plan_started_at: ahora.toISOString()        // ⭐ AHORA
          })
          .select()
          .single()

        if (orgError) {
          console.error('❌ Error creando organización:', orgError)
          throw new Error('Error al crear la organización: ' + orgError.message)
        }

        console.log('✅ Organización creada con trial de 24h:', orgData.id)

        // Crear perfil
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: authData.user.id,
            organization_id: orgData.id,
            nombre: formData.nombreUsuario,
            role: 'admin'
          })

        if (profileError) {
          console.error('❌ Error creando perfil:', profileError)
          throw new Error('Error al crear el perfil: ' + profileError.message)
        }

        console.log('✅ Perfil creado')
      } else {
        console.log('✅ RPC exitoso:', rpcData)
        
        // ⭐ Si RPC fue exitoso, actualizar trial_ends_at
        console.log('🔄 Actualizando trial de 24 horas...')
        const { error: updateError } = await supabase
          .from('organizaciones')
          .update({
            trial_ends_at: expiracion24h.toISOString(),
            plan_started_at: ahora.toISOString()
          })
          .eq('slug', formData.slug)

        if (updateError) {
          console.error('⚠️ No se pudo actualizar el trial:', updateError)
        } else {
          console.log('✅ Trial de 24 horas configurado')
        }
      }

      setSuccess(true)
      
      setTimeout(() => {
        router.push('/login')
      }, 2000)
      
    } catch (error: any) {
      console.error('💥 Error en registro:', error)
      setError(error.message || 'Error al crear la cuenta. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
        <div className="max-w-md w-full bg-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">¡Cuenta creada!</h2>
          <p className="text-slate-300 mb-4">
            Tu cuenta ha sido creada exitosamente con 24 horas de prueba gratuita.
          </p>
          <p className="text-sm text-slate-400">
            Redirigiendo al inicio de sesión...
          </p>
        </div>
      </div>
    )
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
          <h1 className="text-4xl font-bold text-white mb-2">Comienza tu prueba gratuita</h1>
          <p className="text-slate-400 text-lg">24 horas gratis • Sin tarjeta de crédito</p>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-700/50 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-100 text-sm">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                Datos de tu empresa
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre de la empresa *
                </label>
                <input
                  type="text"
                  name="nombreEmpresa"
                  value={formData.nombreEmpresa}
                  onChange={handleNombreEmpresaChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: ElectroHogar San Miguel"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Identificador único *
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    placeholder="mi-empresa"
                    pattern="[a-z0-9-]+"
                    minLength={3}
                    maxLength={30}
                    required
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Solo letras minúsculas, números y guiones. Mínimo 3 caracteres.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-700"></div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" />
                Tus datos
              </h3>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tu nombre completo *
                </label>
                <input
                  type="text"
                  name="nombreUsuario"
                  value={formData.nombreUsuario}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email *
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
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Contraseña *
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
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Confirmar contraseña *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="password"
                      name="confirmarPassword"
                      value={formData.confirmarPassword}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="••••••••"
                      minLength={6}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Creando cuenta...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Crear cuenta gratis
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-center text-slate-400 text-sm">
              ¿Ya tienes cuenta?{' '}
              <a href="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold">
                Iniciar sesión
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}