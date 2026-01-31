'use client'
import { useAuth } from '../lib/auth.context'
import { useTrialCheck } from '@/app/lib/use-trial-check'
import { 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp,
  ShoppingCart,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  Clock
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

interface Stats {
  totalProductos: number
  totalClientes: number
  totalVentas: number
  ventasMes: number
}

export default function DashboardPage() {
  const { organization, profile } = useAuth()
  const { checking } = useTrialCheck()
  const router = useRouter()
  
  const [stats, setStats] = useState<Stats>({
    totalProductos: 0,
    totalClientes: 0,
    totalVentas: 0,
    ventasMes: 0
  })
  const [loading, setLoading] = useState(true)

  // ⭐ Inicializar con valores vacíos (NO llamar calcularTiempoRestante aquí)
  const [tiempoRestante, setTiempoRestante] = useState({ 
    horas: 0, 
    minutos: 0, 
    segundos: 0, 
    total: 0 
  })

  useEffect(() => {
    if (organization) {
      cargarEstadisticas()
    }
  }, [organization])

  const cargarEstadisticas = async () => {
    if (!organization) return
    
    try {
      const { count: productos } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id)

      const { count: clientes } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id)

      const { count: ventas } = await supabase
        .from('transacciones')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .eq('tipo', 'venta')

      setStats({
        totalProductos: productos || 0,
        totalClientes: clientes || 0,
        totalVentas: ventas || 0,
        ventasMes: 0
      })
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  // ⭐ Función mejorada con logs para debug
  const calcularTiempoRestante = () => {
    if (!organization?.trial_ends_at) {
      console.log('⚠️ No hay organization o trial_ends_at')
      return { horas: 0, minutos: 0, segundos: 0, total: 0 }
    }
    
    const ahora = new Date()
    const fin = new Date(
  organization.trial_ends_at.endsWith('Z') 
    ? organization.trial_ends_at 
    : organization.trial_ends_at + 'Z'
)
    
    // ⭐ LOGS PARA DEBUG (puedes comentarlos después)
    console.log('🕐 Hora actual:', ahora.toISOString())
    console.log('🏁 Trial expira:', fin.toISOString())
    console.log('⏱️ Diferencia ms:', fin.getTime() - ahora.getTime())
    
    const diff = fin.getTime() - ahora.getTime()
    
    if (diff <= 0) {
      console.log('⏰ Trial expirado!')
      return { horas: 0, minutos: 0, segundos: 0, total: 0 }
    }
    
    const horas = Math.floor(diff / (1000 * 60 * 60))
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const segundos = Math.floor((diff % (1000 * 60)) / 1000)
    
    console.log(`⏰ Tiempo restante: ${horas}h ${minutos}m ${segundos}s`)
    
    return { horas, minutos, segundos, total: diff }
  }

  // ⭐ Efecto para calcular inicialmente cuando organization cambie
  useEffect(() => {
    if (organization?.trial_ends_at) {
      console.log('🔄 Organization cargada, calculando tiempo...')
      const tiempo = calcularTiempoRestante()
      setTiempoRestante(tiempo)
    }
  }, [organization?.trial_ends_at]) // ⭐ Dependencia específica

  // ⭐ Efecto para actualizar cada segundo
  useEffect(() => {
    if (!organization?.trial_ends_at) return

    const interval = setInterval(() => {
      const tiempo = calcularTiempoRestante()
      setTiempoRestante(tiempo)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [organization?.trial_ends_at]) // ⭐ Dependencia específica

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-emerald-500 mb-4"></div>
          <p className="text-slate-300 font-medium">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="backdrop-blur-xl bg-slate-800/40 rounded-xl border border-slate-700/50 shadow-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              ¡Hola, {profile?.nombre}! 👋
            </h1>
            <p className="text-slate-300">
              Bienvenido al panel de {organization?.nombre}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-400" />
            <span className="text-slate-300">
              {new Date().toLocaleDateString('es-AR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>

      {organization?.plan === 'trial' && tiempoRestante.total > 0 && (
        <div className="backdrop-blur-xl bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-500/50 rounded-xl p-6 shadow-2xl">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <AlertCircle className="w-8 h-8 text-amber-400" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-amber-100 mb-2">
                ⏰ Prueba gratuita activa
              </h3>
              
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-slate-900/50 rounded-lg px-4 py-2">
                  <div className="text-3xl font-bold text-white">{String(tiempoRestante.horas).padStart(2, '0')}</div>
                  <div className="text-xs text-slate-400">horas</div>
                </div>
                <div className="text-2xl text-amber-400">:</div>
                <div className="bg-slate-900/50 rounded-lg px-4 py-2">
                  <div className="text-3xl font-bold text-white">{String(tiempoRestante.minutos).padStart(2, '0')}</div>
                  <div className="text-xs text-slate-400">minutos</div>
                </div>
                <div className="text-2xl text-amber-400">:</div>
                <div className="bg-slate-900/50 rounded-lg px-4 py-2">
                  <div className="text-3xl font-bold text-white">{String(tiempoRestante.segundos).padStart(2, '0')}</div>
                  <div className="text-xs text-slate-400">segundos</div>
                </div>
              </div>
              
              <p className="text-amber-200 text-sm">
                Actualiza tu plan ahora para continuar usando todas las funcionalidades sin interrupciones.
              </p>
            </div>

            <button 
              onClick={() => router.push('/planes')}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl whitespace-nowrap transform hover:scale-105"
            >
              🚀 Actualizar plan
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="backdrop-blur-xl bg-slate-800/40 rounded-xl border border-slate-700/50 shadow-xl p-6 hover:shadow-2xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Package className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-emerald-400 text-sm font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" />
              +12%
            </span>
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">Total Productos</h3>
          <p className="text-3xl font-bold text-white">
            {loading ? (
              <span className="inline-block w-20 h-8 bg-slate-700 animate-pulse rounded"></span>
            ) : (
              stats.totalProductos
            )}
          </p>
        </div>

        <div className="backdrop-blur-xl bg-slate-800/40 rounded-xl border border-slate-700/50 shadow-xl p-6 hover:shadow-2xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <Users className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-emerald-400 text-sm font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" />
              +8%
            </span>
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">Total Clientes</h3>
          <p className="text-3xl font-bold text-white">
            {loading ? (
              <span className="inline-block w-20 h-8 bg-slate-700 animate-pulse rounded"></span>
            ) : (
              stats.totalClientes
            )}
          </p>
        </div>

        <div className="backdrop-blur-xl bg-slate-800/40 rounded-xl border border-slate-700/50 shadow-xl p-6 hover:shadow-2xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-emerald-400 text-sm font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" />
              +15%
            </span>
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">Total Ventas</h3>
          <p className="text-3xl font-bold text-white">
            {loading ? (
              <span className="inline-block w-20 h-8 bg-slate-700 animate-pulse rounded"></span>
            ) : (
              stats.totalVentas
            )}
          </p>
        </div>

        <div className="backdrop-blur-xl bg-slate-800/40 rounded-xl border border-slate-700/50 shadow-xl p-6 hover:shadow-2xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <DollarSign className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-emerald-400 text-sm font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" />
              +23%
            </span>
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">Ingresos del mes</h3>
          <p className="text-3xl font-bold text-white">$0</p>
        </div>
      </div>

      <div className="backdrop-blur-xl bg-slate-800/40 rounded-xl border border-slate-700/50 shadow-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Accesos rápidos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/productos"
            className="group p-4 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg border border-slate-600/50 hover:border-emerald-500/50 transition-all"
          >
            <Package className="w-8 h-8 text-blue-400 mb-3" />
            <h3 className="font-semibold text-white mb-1">Agregar Producto</h3>
            <p className="text-sm text-slate-400">Registra un nuevo producto en el inventario</p>
          </a>

          <a
            href="/clientes"
            className="group p-4 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg border border-slate-600/50 hover:border-emerald-500/50 transition-all"
          >
            <Users className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="font-semibold text-white mb-1">Nuevo Cliente</h3>
            <p className="text-sm text-slate-400">Registra un nuevo cliente</p>
          </a>

          <a
            href="/cobranzas"
            className="group p-4 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg border border-slate-600/50 hover:border-emerald-500/50 transition-all"
          >
            <ShoppingCart className="w-8 h-8 text-purple-400 mb-3" />
            <h3 className="font-semibold text-white mb-1">Nueva Venta</h3>
            <p className="text-sm text-slate-400">Registra una nueva venta</p>
          </a>
        </div>
      </div>

      <div className="backdrop-blur-xl bg-slate-800/40 rounded-xl border border-slate-700/50 shadow-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          Actividad reciente
        </h2>
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No hay actividad reciente</p>
        </div>
      </div>
    </div>
  )
}