'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/auth.context'
import { supabase } from '@/app/lib/supabase'
import { Check, Zap, Crown, Star } from 'lucide-react'

interface Plan {
  id: string
  nombre: string
  descripcion: string
  precio: number
  duracion_dias: number
  activo: boolean
}

export default function PlanesPage() {
  const { organization } = useAuth()
  const [planes, setPlanes] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState<string | null>(null)

  useEffect(() => {
    cargarPlanes()
  }, [])

  const cargarPlanes = async () => {
    try {
      const { data, error } = await supabase
        .from('planes')
        .select('*')
        .eq('activo', true)
        .order('precio', { ascending: true })

      if (error) throw error
      setPlanes(data || [])
    } catch (error) {
      console.error('Error cargando planes:', error)
    } finally {
      setLoading(false)
    }
  }

  const activarPlan = async (planId: string, duracionDias: number) => {
    if (!organization) return

    setProcesando(planId)
    try {
      const nuevaFechaExpiracion = new Date()
      nuevaFechaExpiracion.setDate(nuevaFechaExpiracion.getDate() + duracionDias)

      const { error } = await supabase
        .from('organizations')
        .update({
          plan: 'premium',
          trial_ends_at: nuevaFechaExpiracion.toISOString(),
          plan_started_at: new Date().toISOString()
        })
        .eq('id', organization.id)

      if (error) throw error

      alert('¡Plan activado correctamente! Tu cuenta ha sido actualizada.')
      window.location.href = '/dashboard'
    } catch (error: any) {
      console.error('Error activando plan:', error)
      alert('Error al activar el plan: ' + error.message)
    } finally {
      setProcesando(null)
    }
  }

  const calcularAhorro = (precio: number, duracionDias: number) => {
    const precioMensual = 9.99
    const meses = duracionDias / 30
    const precioSinDescuento = precioMensual * meses
    const ahorro = precioSinDescuento - precio
    return ahorro > 0 ? ahorro.toFixed(2) : '0.00'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-emerald-500 mb-4"></div>
          <p className="text-slate-300 font-medium">Cargando planes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Elige el plan perfecto para ti
          </h1>
          <p className="text-xl text-slate-300">
            Desbloquea todas las funcionalidades y lleva tu negocio al siguiente nivel
          </p>
        </div>

        {/* Planes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {planes.map((plan, index) => {
            const ahorro = calcularAhorro(plan.precio, plan.duracion_dias)
            const esRecomendado = index === 1 // El plan del medio es recomendado

            return (
              <div
                key={plan.id}
                className={`relative backdrop-blur-xl rounded-2xl border shadow-2xl overflow-hidden transform transition-all hover:scale-105 ${
                  esRecomendado
                    ? 'bg-gradient-to-b from-emerald-500/20 to-blue-500/20 border-emerald-500/50 ring-2 ring-emerald-500/50'
                    : 'bg-slate-800/40 border-slate-700/50'
                }`}
              >
                {esRecomendado && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-4 py-1 text-sm font-bold rounded-bl-xl">
                    ⭐ MÁS POPULAR
                  </div>
                )}

                <div className="p-8">
                  {/* Icono */}
                  <div className="mb-6">
                    {index === 0 && <Zap className="w-12 h-12 text-blue-400" />}
                    {index === 1 && <Crown className="w-12 h-12 text-emerald-400" />}
                    {index === 2 && <Star className="w-12 h-12 text-purple-400" />}
                  </div>

                  {/* Nombre del plan */}
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.nombre}</h3>
                  <p className="text-slate-400 mb-6">{plan.descripcion}</p>

                  {/* Precio */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-white">${plan.precio}</span>
                      <span className="text-slate-400">/ {plan.duracion_dias} días</span>
                    </div>
                    {parseFloat(ahorro) > 0 && (
                      <p className="text-emerald-400 text-sm mt-2">
                        ¡Ahorras ${ahorro}!
                      </p>
                    )}
                  </div>

                  {/* Beneficios */}
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span>Productos ilimitados</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span>Clientes ilimitados</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span>Ventas ilimitadas</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span>Soporte prioritario</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span>Reportes avanzados</span>
                    </li>
                  </ul>

                  {/* Botón */}
                  <button
                    onClick={() => activarPlan(plan.id, plan.duracion_dias)}
                    disabled={procesando !== null}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                      esRecomendado
                        ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:shadow-lg hover:shadow-emerald-500/50'
                        : 'bg-slate-700 text-white hover:bg-slate-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {procesando === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Procesando...
                      </span>
                    ) : (
                      'Activar Plan'
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Garantía */}
        <div className="mt-12 text-center">
          <p className="text-slate-400 text-sm">
            🔒 Pago seguro • ✨ Sin compromiso • 🎯 Cancela cuando quieras
          </p>
        </div>
      </div>
    </div>
  )
}