'use client'
import { Transaccion, Pago } from '@/app/lib/types/cobranzas'

interface ResumenPagosProps {
  transaccion: Transaccion
  pagos: Pago[]
}

export default function ResumenPagos({ transaccion, pagos }: ResumenPagosProps) {
  // Función de formateo de fecha seguro
  const formatearFecha = (fecha: string) => {
    try {
      if (!fecha) return ''
      
      const fechaSoloFecha = fecha.split('T')[0]
      const [year, month, day] = fechaSoloFecha.split('-').map(Number)
      
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return fecha
      }
      
      const fechaObj = new Date(year, month - 1, day)
      
      if (isNaN(fechaObj.getTime())) {
        return fecha
      }
      
      return fechaObj.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return fecha
    }
  }

  // Función para calcular diferencia en días
  const calcularDiferenciaDias = (fechaVencimiento: string) => {
    try {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      
      const fechaSoloFecha = fechaVencimiento.split('T')[0]
      const [year, month, day] = fechaSoloFecha.split('-').map(Number)
      
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return 0
      }
      
      const vencimiento = new Date(year, month - 1, day)
      vencimiento.setHours(0, 0, 0, 0)
      
      if (isNaN(vencimiento.getTime())) {
        return 0
      }
      
      return Math.floor((hoy.getTime() - vencimiento.getTime()) / (1000 * 60 * 60 * 24))
    } catch {
      return 0
    }
  }

  const totalPagado = pagos.reduce((sum, p) => sum + p.monto_pagado, 0)
  const totalPendiente = transaccion.monto_total - totalPagado
  const cuotasPagadas = pagos.filter(p => p.estado === 'pagado').length
  const porcentajePagado = (totalPagado / transaccion.monto_total) * 100
  
  // Calcular próximo vencimiento
  const proximoPago = pagos
    .filter(p => p.estado !== 'pagado')
    .sort((a, b) => {
      const fechaA = a.fecha_vencimiento.split('T')[0]
      const fechaB = b.fecha_vencimiento.split('T')[0]
      return fechaA.localeCompare(fechaB)
    })[0]
  
  // Calcular pagos vencidos
  const pagosVencidos = pagos.filter(p => {
    if (p.estado === 'pagado') return false
    const diasDiferencia = calcularDiferenciaDias(p.fecha_vencimiento)
    return diasDiferencia > 0 // Positivo significa que ya pasó la fecha
  })
  
  return (
    <div className="bg-gray-50 p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Montos */}
        <div className="bg-white p-3 rounded shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">💵 Total Pagado</p>
            {porcentajePagado === 100 && (
              <span className="text-green-500">✓</span>
            )}
          </div>
          <p className="text-xl font-bold text-green-600">
            ${totalPagado.toFixed(2)}
          </p>
          <div className="mt-2 pt-2 border-t">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">Pendiente</p>
              <p className="font-semibold text-gray-700">
                ${totalPendiente.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Progreso */}
        <div className="bg-white p-3 rounded shadow-sm">
          <p className="text-xs text-gray-500 mb-2">📈 Progreso de Pagos</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold">
              {cuotasPagadas}
            </p>
            <p className="text-sm text-gray-500">
              de {transaccion.numero_cuotas} cuotas
            </p>
          </div>
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  porcentajePagado === 100 ? 'bg-green-500' :
                  porcentajePagado > 50 ? 'bg-blue-500' :
                  porcentajePagado > 0 ? 'bg-yellow-500' : 'bg-gray-300'
                }`}
                style={{ width: `${porcentajePagado}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">
              {porcentajePagado.toFixed(0)}% completado
            </p>
          </div>
        </div>
        
        {/* Próximo vencimiento o Estado */}
        <div className="bg-white p-3 rounded shadow-sm">
          {pagosVencidos.length > 0 ? (
            <>
              <p className="text-xs text-red-600 mb-2">⚠️ Pagos Vencidos</p>
              <p className="text-xl font-bold text-red-600">
                {pagosVencidos.length} {pagosVencidos.length === 1 ? 'cuota' : 'cuotas'}
              </p>
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs text-gray-500">Monto vencido</p>
                <p className="font-semibold text-red-600">
                  ${(pagosVencidos.length * transaccion.monto_cuota).toFixed(2)}
                </p>
              </div>
            </>
          ) : proximoPago ? (
            <>
              <p className="text-xs text-gray-500 mb-2">📅 Próximo Vencimiento</p>
              <p className="text-xl font-bold">
                Cuota #{proximoPago.numero_cuota}
              </p>
              <div className="mt-2 pt-2 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">Fecha</p>
                  <p className="font-semibold text-gray-700 text-sm">
                    {formatearFecha(proximoPago.fecha_vencimiento)}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">Monto</p>
                  <p className="font-semibold text-gray-700 text-sm">
                    ${transaccion.monto_cuota.toFixed(2)}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-2">
              <span className="text-3xl mb-2">🎉</span>
              <p className="text-green-600 font-semibold">
                ¡Completado!
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Todas las cuotas pagadas
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Alertas adicionales */}
      <div className="mt-4 space-y-2">
        {transaccion.estado === 'completado' && (
          <div className="p-3 bg-green-100 border border-green-300 rounded-lg text-center">
            <p className="text-green-800 font-medium flex items-center justify-center gap-2">
              <span>✅</span>
              <span>Transacción completada exitosamente</span>
            </p>
            {(() => {
              const ultimoPago = pagos.find(p => p.numero_cuota === transaccion.numero_cuotas)
              return ultimoPago?.fecha_pago ? (
                <p className="text-green-700 text-xs mt-1">
                  Finalizada el {formatearFecha(ultimoPago.fecha_pago)}
                </p>
              ) : null
            })()}
          </div>
        )}
        
        {pagosVencidos.length > 0 && transaccion.estado !== 'completado' && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-800 font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>Atención: Esta cuenta tiene {pagosVencidos.length} {pagosVencidos.length === 1 ? 'pago vencido' : 'pagos vencidos'}</span>
            </p>
            <p className="text-red-700 text-xs mt-1">
              El pago más antiguo venció hace {calcularDiferenciaDias(pagosVencidos[0].fecha_vencimiento)} días
            </p>
          </div>
        )}
        
        {/* Información del plan de pago */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">📊</span>
              <span className="text-blue-800">Plan {transaccion.tipo_pago}</span>
            </div>
            <span className="text-blue-700 font-medium">
              {transaccion.numero_cuotas} cuotas de ${transaccion.monto_cuota.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Botón de acción rápida si hay pagos pendientes */}
      {totalPendiente > 0 && cuotasPagadas < transaccion.numero_cuotas && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 mb-2">
            Faltan {transaccion.numero_cuotas - cuotasPagadas} cuotas por pagar
          </p>
        </div>
      )}
    </div>
  )
}