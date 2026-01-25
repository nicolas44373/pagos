'use client'
import { useAuth } from '../lib/auth.context'
import { useRouter, usePathname } from 'next/navigation'
import { Package, Users, ShoppingCart, DollarSign, Settings, LogOut, Menu, X, Bell } from 'lucide-react'
import { useState } from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, organization, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-emerald-500 mb-4"></div>
          <p className="text-slate-300 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
  console.log('⚠️ Dashboard: No user, should redirect')
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
  return null
}

if (!organization) {
  console.log('⚠️ Dashboard: No organization yet, waiting...')
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-emerald-500 mb-4"></div>
        <p className="text-slate-300 font-medium">Cargando organización...</p>
      </div>
    </div>
  )
}

  const menuItems = [
    { name: 'Dashboard', icon: Package, href: '/' },
    { name: 'Productos', icon: Package, href: '/productos' },
    { name: 'Clientes', icon: Users, href: '/clientes' },
    { name: 'Cobranzas', icon: ShoppingCart, href: '/cobranzas' },
    { name: 'Configuración', icon: Settings, href: '/configuracion' },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname?.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-900/50 backdrop-blur-xl border-r border-slate-700/50 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center gap-3 pt-6">
            <div className="bg-gradient-to-br from-emerald-600 to-blue-600 p-2 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">{organization.nombre}</h2>
              <p className="text-xs text-slate-400 capitalize">{organization.plan}</p>
            </div>
          </div>

          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)
                    return (
                      <li key={item.name}>
                        <a
                          href={item.href}
                          className={`group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-semibold transition-all ${
                            active
                              ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                          }`}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          {item.name}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </li>

              <li className="mt-auto">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-blue-600 flex items-center justify-center text-white font-bold">
                      {profile?.nombre?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{profile?.nombre}</p>
                      <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={signOut}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="relative z-50 lg:hidden">
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 px-6 pb-4">
                <div className="flex h-16 shrink-0 items-center gap-3 pt-6">
                  <div className="bg-gradient-to-br from-emerald-600 to-blue-600 p-2 rounded-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg">{organization.nombre}</h2>
                    <p className="text-xs text-slate-400 capitalize">{organization.plan}</p>
                  </div>
                </div>

                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {menuItems.map((item) => {
                          const Icon = item.icon
                          const active = isActive(item.href)
                          return (
                            <li key={item.name}>
                              <a
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-semibold transition-all ${
                                  active
                                    ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                                }`}
                              >
                                <Icon className="h-5 w-5 shrink-0" />
                                {item.name}
                              </a>
                            </li>
                          )
                        })}
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-slate-400 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 items-center justify-end">
            {organization.plan === 'trial' && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-amber-200">Prueba gratuita</span>
              </div>
            )}

            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>

        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}