  import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  CalendarIcon,
  ClipboardDocumentListIcon,
  ChevronDownIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const navigation = [
    { name: 'Главная', href: '/', icon: HomeIcon },
    { name: 'Наряды', href: '/duty-structures', icon: ClipboardDocumentListIcon },
    { name: 'Распределение нарядов', href: '/duty-distribution', icon: CalendarIcon },
  ]

  const systemMenu = [
    { name: 'Система нарядов', href: '/', icon: ClipboardDocumentListIcon },
    { name: 'Расход личного состава', href: '/personnel-expense', icon: UserGroupIcon },
    { name: 'Управление личным составом', href: '/departments', icon: BuildingOfficeIcon },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Навигация */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Вкладка Главная */}
              <div className="flex-shrink-0 flex items-center">
                <Link
                  to="/"
                  className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium ${
                    location.pathname === '/'
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <HomeIcon className="h-5 w-5 mr-2" />
                  Главная
                </Link>
              </div>

              {/* Раскрывающийся список Система нарядов */}
              <div className="flex-shrink-0 flex items-center ml-6">
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center text-xl font-semibold text-gray-900 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {location.pathname.startsWith('/personnel-expense') 
                      ? 'Расход личного состава' 
                      : location.pathname.startsWith('/departments')
                      ? 'Управление личным составом'
                      : 'Система нарядов'}
                    <ChevronDownIcon className="ml-2 h-5 w-5" />
                  </button>
                  
                  {isMenuOpen && (
                    <div className="absolute z-10 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div className="py-1" role="menu" aria-orientation="vertical">
                        {systemMenu.map((item) => {
                          const isActive = item.href === '/' 
                            ? location.pathname === item.href && !location.pathname.startsWith('/personnel-expense')
                            : location.pathname.startsWith(item.href)
                          return (
                            <Link
                              key={item.name}
                              to={item.href}
                              onClick={() => {
                                setIsMenuOpen(false)
                              }}
                              className={`flex items-center px-4 py-2 text-sm ${
                                isActive
                                  ? 'bg-indigo-50 text-indigo-700'
                                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                              }`}
                              role="menuitem"
                            >
                              <item.icon className="h-4 w-4 mr-3" />
                              {item.name}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Остальные вкладки навигации */}
              {!location.pathname.startsWith('/personnel-expense') && !location.pathname.startsWith('/departments') && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.slice(1).map((item) => {
                    const isActive = item.href === '/' 
                      ? location.pathname === item.href
                      : location.pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? 'border-indigo-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <item.icon className="h-5 w-5 mr-2" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

export default Layout 