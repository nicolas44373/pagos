'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './supabase'
import { useAuth } from './auth.context'

export function useTrialCheck() {
  const { organization, signOut } = useAuth()
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkTrial = async () => {
      if (!organization) {
        setChecking(false)
        return
      }

      // Si no es trial, todo bien
      if (organization.plan !== 'trial') {
        setChecking(false)
        return
      }

      // Si no tiene trial_ends_at, establecer 24 horas desde ahora
      if (!organization.trial_ends_at) {
        const nuevaFechaExpiracion = new Date()
        nuevaFechaExpiracion.setHours(nuevaFechaExpiracion.getHours() + 24)

        await supabase
          .from('organizaciones')
          .update({
            trial_ends_at: nuevaFechaExpiracion.toISOString()
          })
          .eq('id', organization.id)
        
        setChecking(false)
        return
      }

      // ⭐ VALIDACIÓN AGREGADA: verificar que trial_ends_at no sea null
      const trialEndsAt = new Date(organization.trial_ends_at)
      const now = new Date()

      // ⭐ VALIDACIÓN: verificar que la fecha sea válida
      if (isNaN(trialEndsAt.getTime())) {
        console.error('Fecha de expiración inválida')
        setChecking(false)
        return
      }

      if (now > trialEndsAt) {
        // Trial expirado - cerrar sesión y redirigir
        alert('Tu prueba gratuita de 24 horas ha expirado. Por favor, actualiza tu plan para continuar.')
        await signOut()
        router.push('/login')
        return
      }

      setChecking(false)
    }

    checkTrial()

    // Verificar cada 60 segundos
    const interval = setInterval(checkTrial, 60000)
    return () => clearInterval(interval)
  }, [organization, signOut, router])

  return { checking }
}