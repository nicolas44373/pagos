'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface Organization {
  id: string
  nombre: string
  slug: string
  plan: string
  status: string
  trial_ends_at: string | null
  plan_started_at: string | null // ⭐ AGREGADO
  created_at?: string
  updated_at?: string
}

interface UserProfile {
  id: string
  nombre: string
  role: string
  organization_id: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  organization: Organization | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  organization: null,
  loading: true,
  signOut: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserData(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserData(session.user.id)
      } else {
        setProfile(null)
        setOrganization(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserData = async (userId: string) => {
    try {
      // Cargar perfil de usuario
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (profileError) throw profileError
      
      if (profileData) {
        setProfile(profileData)
        
        // Cargar organización
        const { data: orgData, error: orgError } = await supabase
          .from('organizaciones')
          .select('*')
          .eq('id', profileData.organization_id)
          .single()
        
        if (orgError) throw orgError
        if (orgData) {
          setOrganization(orgData)
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  // ⭐ FUNCIÓN signOut (solo una vez)
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setOrganization(null)
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, organization, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)