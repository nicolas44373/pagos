'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '../../lib/auth.context'
import { Save, Building, MapPin, Phone, Mail, AlertCircle, CheckCircle } from 'lucide-react'

interface ConfiguracionComercio {
  id?: string
  nombre_comercio: string
  direccion: string
  telefono: string
  email: string
  organization_id?: string
}

export default function ConfiguracionPage() {
  const { organization } = useAuth()
  const [loading, setLoading] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{tipo: 'exito' | 'error', texto: string} | null>(null)
  
  const [configuracion, setConfiguracion] = useState<ConfiguracionComercio>({
    nombre_comercio: '',
    direccion: '',
    telefono: '',
    email: ''
  })

  useEffect(() => {
    if (organization) {
      cargarConfiguracion()
    }
  }, [organization])

  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [mensaje])

  const cargarConfiguracion = async () => {
    if (!organization) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('configuracion')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('clave', 'datos_comercio')
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data && data.valor) {
        const datosComercio = JSON.parse(data.valor)
        setConfiguracion({
          id: data.id,
          ...datosComercio,
          organization_id: organization.id
        })
      }
    } catch (error: any) {
      console.error('Error cargando configuración:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ConfiguracionComercio, value: string) => {
    setConfiguracion(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validarFormulario = () => {
    if (!configuracion.nombre_comercio.trim()) {
      setMensaje({ tipo: 'error', texto: 'El nombre del comercio es obligatorio' })
      return false
    }
    if (!configuracion.direccion.trim()) {
      setMensaje({ tipo: 'error', texto: 'La dirección es obligatoria' })
      return false
    }
    if (!configuracion.telefono.trim()) {
      setMensaje({ tipo: 'error', texto: 'El teléfono es obligatorio' })
      return false
    }
    if (!configuracion.email.trim()) {
      setMensaje({ tipo: 'error', texto: 'El email es obligatorio' })
      return false
    }
    if (!configuracion.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setMensaje({ tipo: 'error', texto: 'El email no es válido' })
      return false
    }
    return true
  }

  const guardarConfiguracion = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validarFormulario() || !organization) return
    
    setGuardando(true)
    try {
      const datosComercio = {
        nombre_comercio: configuracion.nombre_comercio,
        direccion: configuracion.direccion,
        telefono: configuracion.telefono,
        email: configuracion.email
      }

      const dataToSave = {
        organization_id: organization.id,
        clave: 'datos_comercio',
        valor: JSON.stringify(datosComercio),
        descripcion: 'Datos del comercio para recibos y documentos'
      }

      if (configuracion.id) {
        // Actualizar
        const { error } = await supabase
          .from('configuracion')
          .update(dataToSave)
          .eq('id', configuracion.id)
        
        if (error) throw error
        setMensaje({ tipo: 'exito', texto: 'Configuración actualizada correctamente' })
      } else {
        // Insertar
        const { data, error } = await supabase
          .from('configuracion')
          .insert(dataToSave)
          .select()
          .single()
        
        if (error) throw error
        if (data) {
          setConfiguracion(prev => ({ ...prev, id: data.id }))
        }
        setMensaje({ tipo: 'exito', texto: 'Configuración guardada correctamente' })
      }
      
      await cargarConfiguracion()
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: 'Error al guardar: ' + error.message })
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-emerald-500 mb-4"></div>
          <p className="text-slate-300 font-medium">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="relative max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="backdrop-blur-xl bg-slate-800/40 rounded-xl border border-slate-700/50 shadow-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl blur opacity-50"></div>
              <div className="relative bg-gradient-to-br from-emerald-600 to-blue-600 p-4 rounded-xl">
                <Building className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Configuración del Comercio</h1>
              <p className="text-slate-300 mt-1">
                Datos que aparecerán en recibos y documentos
              </p>
            </div>
          </div>
        </div>

        {/* Mensaje */}
        {mensaje && (
          <div className={`mb-6 backdrop-blur-xl rounded-xl p-4 flex items-center gap-3 shadow-lg animate-fade-in ${
            mensaje.tipo === 'exito' 
              ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-100'
              : 'bg-red-500/20 border border-red-500/50 text-red-100'
          }`}>
            {mensaje.tipo === 'exito' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="font-medium">{mensaje.texto}</span>
          </div>
        )}

        {/* Formulario */}
        <div className="backdrop-blur-xl bg-slate-800/40 rounded-xl border border-slate-700/50 shadow-2xl p-6">
          <form onSubmit={guardarConfiguracion} className="space-y-6">
            {/* Nombre del comercio */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nombre del Comercio *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Ej: ELECTRO HOGAR"
                  value={configuracion.nombre_comercio}
                  onChange={(e) => handleInputChange('nombre_comercio', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Dirección Completa *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                <textarea
                  placeholder="Ej: San miguel de Tucumán, Av. Roca 1234, CP 4000"
                  value={configuracion.direccion}
                  onChange={(e) => handleInputChange('direccion', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  rows={3}
                  required
                />
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Teléfono *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="tel"
                  placeholder="Ej: 381  1234-5678"
                  value={configuracion.telefono}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={configuracion.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Vista previa */}
            <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Vista previa (como aparecerá en recibos):</h3>
              <div className="text-sm text-slate-300 space-y-1">
                <div className="font-semibold">{configuracion.nombre_comercio || 'Nombre del comercio'}</div>
                <div>{configuracion.direccion || 'Dirección completa'}</div>
                <div>Teléfono: {configuracion.telefono || '(000) 000-0000'}</div>
                <div>Email: {configuracion.email || 'correo@ejemplo.com'}</div>
              </div>
            </div>

            {/* Botón guardar */}
            <button
              type="submit"
              disabled={guardando}
              className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {guardando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Configuración
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}